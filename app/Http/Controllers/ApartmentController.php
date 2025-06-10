<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ApartmentController extends Controller
{
    public function storeApartment(Request $request, Building $building)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        DB::beginTransaction();

        try {
            $apartment = $building->apartments()->create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
                'status' => true
            ]);

            $this->saveTenants($request, $apartment);

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento creado exitosamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al crear el apartamento: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function updateApartment(Request $request, Apartment $apartment)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'tenants.*.id' => 'nullable|exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            $apartment->update([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
            ]);

            $this->saveTenants($request, $apartment);

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento actualizado exitosamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al actualizar el apartamento: ' . $e->getMessage()])
                ->withInput();
        }
    }

    private function saveTenants(Request $request, Apartment $apartment)
    {
        $currentTenantIds = $apartment->tenants()->pluck('id')->toArray();
        $newTenantIds = [];
        $photosToDelete = [];

        foreach ($request->tenants as $tenantData) {
            $data = [
                'name' => $tenantData['name'],
                'email' => $tenantData['email'],
                'phone' => $tenantData['phone'],
                'apartment_id' => $apartment->id
            ];

            // Manejar la foto
            if (isset($tenantData['photo']) && $tenantData['photo'] instanceof \Illuminate\Http\UploadedFile) {
                $path = $tenantData['photo']->store('tenants', 'public');
                $data['photo'] = $path;

                // Si es actualización, marcar la foto anterior para eliminación
                if (isset($tenantData['id']) && in_array($tenantData['id'], $currentTenantIds)) {
                    $existingTenant = $apartment->tenants()->find($tenantData['id']);
                    if ($existingTenant && $existingTenant->photo) {
                        $photosToDelete[] = $existingTenant->photo;
                    }
                }
            }

            if (isset($tenantData['id']) && in_array($tenantData['id'], $currentTenantIds)) {
                // Actualizar inquilino existente
                $apartment->tenants()->where('id', $tenantData['id'])->update($data);
                $tenant = $apartment->tenants()->find($tenantData['id']);
                $newTenantIds[] = $tenantData['id'];
            } else {
                // Crear nuevo inquilino
                $tenant = $apartment->tenants()->create($data);
                $newTenantIds[] = $tenant->id;
            }

            // Crear o actualizar usuario asociado al tenant
            $user = User::updateOrCreate(
                ['email' => $tenant->email],
                [
                    'name' => $tenant->name,
                    'password' => Hash::make($tenant->email), // contraseña igual al email, puedes cambiar
                ]
            );

            // Asignar rol member si no lo tiene
            if (!$user->hasRole('member')) {
                $user->assignRole('member');
            }
        }

        // Eliminar inquilinos que ya no están en la lista
        $idsToDelete = array_diff($currentTenantIds, $newTenantIds);
        if (!empty($idsToDelete)) {
            $tenantsToDelete = $apartment->tenants()->whereIn('id', $idsToDelete)->get();
            foreach ($tenantsToDelete as $tenant) {
                if ($tenant->photo) {
                    $photosToDelete[] = $tenant->photo;
                }
                // Opcional: eliminar usuario también
                $user = User::where('email', $tenant->email)->first();
                if ($user) {
                    $user->delete();
                }
            }
            $apartment->tenants()->whereIn('id', $idsToDelete)->delete();
        }

        // Eliminar fotos marcadas
        foreach (array_unique($photosToDelete) as $photo) {
            Storage::disk('public')->delete($photo);
        }
    }

    public function destroy(Apartment $apartment)
    {
        DB::beginTransaction();

        try {
            // Eliminar fotos de inquilinos
            $photosToDelete = $apartment->tenants()->pluck('photo')->filter()->toArray();

            // Eliminar inquilinos
            $apartment->tenants()->delete();

            // Eliminar apartamento
            $apartment->delete();

            // Eliminar fotos
            foreach ($photosToDelete as $photo) {
                Storage::disk('public')->delete($photo);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento eliminado exitosamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al eliminar el apartamento: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, Apartment $apartment)
    {
        $request->validate([
            'status' => 'required|boolean'
        ]);

        $apartment->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado',
            'status' => $apartment->status
        ]);
    }


    public function apartmentMemberDevice(Building $building, $id)
    {
        $member = Tenant::findOrFail($id);
        $apartment = $member->apartment;
        $building = $apartment->building;

        $devicesOwn = $member->devices;
        $devicesShared = $member->sharedDevices;
        $devicesOwn->load([
            'brand',
            'model',
            'system',
            'name_device',
            'sharedWith' => function ($query) {
                $query->select('tenants.id', 'tenants.name', 'tenants.email','tenants.photo');
            },
            'tenants' => function ($query) {
                $query->select('tenants.id', 'tenants.name', 'tenants.email','tenants.photo');
            }
        ]);
        $devicesShared->load([
            'brand',
            'model',
            'system',
            'name_device',
            'owner' => function ($query) {
                $query->select('tenants.id', 'tenants.name', 'tenants.email','tenants.photo');
            }
           
        ]);

        return Inertia::render('Devices/Index', [
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
            'building' => $building,
            'all_buildings' => Building::all(),
            'apartment' => $apartment,
            'devicesOwn' => $devicesOwn,
            'devicesShared' => $devicesShared,
            'member' => $member,
        ]);
    }

    public function bulkUpload(Request $request, Building $building)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        DB::beginTransaction();

        try {
            $file = $request->file('file');
            $data = $this->readExcelFile($file);

            $apartmentsCreated = 0;
            $membersCreated = 0;

            // Agrupar por apartment
            $groupedData = collect($data)->groupBy('apartment');

            foreach ($groupedData as $apartmentName => $members) {
                // Crear o buscar el apartamento
                $apartment = $building->apartments()->firstOrCreate([
                    'name' => $apartmentName
                ], [
                    'status' => true,
                    'ubicacion' => ''
                ]);

                $isNewApartment = $apartment->wasRecentlyCreated;
                if ($isNewApartment) {
                    $apartmentsCreated++;
                }

                // Crear members (tenants) para este apartamento
                foreach ($members as $memberData) {
                    // Verificar si el tenant ya existe en este apartamento
                    $existingTenant = $apartment->tenants()
                        ->where('email', $memberData['email'])
                        ->first();

                    if (!$existingTenant) {
                        $tenant = $apartment->tenants()->create([
                            'name' => $memberData['name'],
                            'email' => $memberData['email'],
                            'phone' => $memberData['phone'] ?? '',
                            'photo' => null
                        ]);

                        // Crear usuario con rol member
                        $user = User::updateOrCreate(
                            ['email' => $tenant->email],
                            [
                                'name' => $tenant->name,
                                'password' => Hash::make($tenant->email),
                            ]
                        );

                        if (!$user->hasRole('member')) {
                            $user->assignRole('member');
                        }

                        $membersCreated++;
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 
                "Carga masiva completada. Apartamentos creados: {$apartmentsCreated}, Miembros creados: {$membersCreated}");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['file' => 'Error al procesar el archivo: ' . $e->getMessage()]);
        }
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment;filename="apartments_template.xlsx"',
            'Cache-Control' => 'max-age=0',
        ];

        // Crear un archivo Excel simple con PhpSpreadsheet
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $sheet->setCellValue('A1', 'apartment');
        $sheet->setCellValue('B1', 'name');
        $sheet->setCellValue('C1', 'email');
        $sheet->setCellValue('D1', 'phone');

        // Ejemplo de datos
        $sheet->setCellValue('A2', 'Apt 101');
        $sheet->setCellValue('B2', 'John Doe');
        $sheet->setCellValue('C2', 'john@example.com');
        $sheet->setCellValue('D2', '123456789');

        $sheet->setCellValue('A3', 'Apt 101');
        $sheet->setCellValue('B3', 'Jane Doe');
        $sheet->setCellValue('C3', 'jane@example.com');
        $sheet->setCellValue('D3', '987654321');

        $sheet->setCellValue('A4', 'Apt 102');
        $sheet->setCellValue('B4', 'Bob Smith');
        $sheet->setCellValue('C4', 'bob@example.com');
        $sheet->setCellValue('D4', '555123456');

        // Auto-adjust column widths
        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        return response()->stream(function() use ($writer) {
            $writer->save('php://output');
        }, 200, $headers);
    }

    private function readExcelFile($file)
    {
        $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();

        $data = [];
        $headers = [];
        
        foreach ($worksheet->getRowIterator() as $rowIndex => $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);
            
            $rowData = [];
            foreach ($cellIterator as $cell) {
                $rowData[] = $cell->getValue();
            }
            
            if ($rowIndex === 1) {
                $headers = $rowData;
                // Validate required headers
                $requiredHeaders = ['apartment', 'name', 'email', 'phone'];
                foreach ($requiredHeaders as $required) {
                    if (!in_array($required, $headers)) {
                        throw new \Exception("Header '{$required}' is missing in Excel file");
                    }
                }
            } else {
                if (!empty(array_filter($rowData))) {
                    $record = [];
                    foreach ($headers as $index => $header) {
                        $record[$header] = $rowData[$index] ?? '';
                    }
                    
                    // Validate required fields
                    if (empty($record['apartment']) || empty($record['name']) || empty($record['email'])) {
                        continue; // Skip empty rows
                    }
                    
                    // Validate email format
                    if (!filter_var($record['email'], FILTER_VALIDATE_EMAIL)) {
                        throw new \Exception("Invalid email format: {$record['email']}");
                    }
                    
                    $data[] = $record;
                }
            }
        }

        if (empty($data)) {
            throw new \Exception('No valid data found in Excel file');
        }

        return $data;
    }
}
