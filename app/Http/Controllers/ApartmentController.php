<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Apartment;
use App\Models\Building;
use App\Models\Tenant;
use App\Models\User;
use App\Mail\PasswordResetNotification;
use App\Mail\NewUserWelcome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ApartmentController extends Controller
{
    public function storeApartment(Request $request, Building $building)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'order' => 'nullable|integer|min:0',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        DB::beginTransaction();

        try {
            // Determinar el order correcto
            $order = $this->getNextAvailableOrder($building, $request->order);
            
            $apartment = $building->apartments()->create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion ?? '',
                'order' => $order,
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
            'order' => 'nullable|integer|min:0',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'tenants.*.id' => 'nullable|exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            // Determinar el order correcto para actualización
            $order = $this->getNextAvailableOrder($apartment->building, $request->order, $apartment->id);
            
            $apartment->update([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion ?? '',
                'order' => $order,
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
            $userExists = User::where('email', $tenant->email)->exists();
            
            $user = User::updateOrCreate(
                ['email' => $tenant->email],
                [
                    'name' => $tenant->name,
                    'password' => Hash::make($tenant->email), // contraseña igual al email
                ]
            );

            // Asignar rol member si no lo tiene
            if (!$user->hasRole('member')) {
                $user->assignRole('member');
            }

            // Si es un usuario nuevo, enviar email de bienvenida con credenciales
            if (!$userExists) {
                try {
                    Mail::to($user->email)->send(new NewUserWelcome($user, $tenant->email));
                    Log::info("Welcome email sent to new user: {$user->email}");
                } catch (\Exception $e) {
                    Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
                }
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
        // Agregar logging para debugging
        Log::info('=== APARTMENT DESTROY METHOD CALLED ===');
        Log::info('Apartment ID: ' . $apartment->id);
        Log::info('Apartment Name: ' . $apartment->name);
        Log::info('Request method: ' . request()->method());
        Log::info('Full request data: ', request()->all());
        Log::info('=== END APARTMENT DESTROY DEBUG ===');
        
        DB::beginTransaction();

        try {
            // Eliminar fotos de inquilinos
            $photosToDelete = $apartment->tenants()->pluck('photo')->filter()->toArray();

            Log::info('Photos to delete: ', $photosToDelete);

            // Eliminar inquilinos
            $apartment->tenants()->delete();
            Log::info('Tenants deleted for apartment ID: ' . $apartment->id);

            // Eliminar apartamento
            $apartment->delete();
            Log::info('Apartment deleted: ' . $apartment->id);

            // Eliminar fotos
            foreach ($photosToDelete as $photo) {
                Storage::disk('public')->delete($photo);
            }

            DB::commit();
            Log::info('Transaction committed successfully');

            return redirect()->back()->with('success', 'Apartamento eliminado exitosamente');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting apartment: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
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

        // Usar redirect back para que sea compatible con Inertia
        return redirect()->back()->with('success', 'Estado actualizado exitosamente');
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
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // Max 10MB
        ]);

        // Aumentar el tiempo límite de ejecución
        set_time_limit(300); // 5 minutos
        ini_set('memory_limit', '512M'); // Aumentar memoria disponible

        DB::beginTransaction();

        try {
            $file = $request->file('file');
            $data = $this->readExcelFile($file);

            $apartmentsCreated = 0;
            $membersCreated = 0;

            // Agrupar por apartment
            $groupedData = collect($data)->groupBy('apartment');

            foreach ($groupedData as $apartmentName => $members) {
                // Obtener el valor de order del primer miembro del grupo (si existe)
                $requestedOrder = $members->first()['order'] ?? null;
                
                // Determinar el order correcto usando la misma lógica
                $finalOrder = $this->getNextAvailableOrder($building, $requestedOrder);
                
                // Crear o buscar el apartamento
                $apartment = $building->apartments()->firstOrCreate([
                    'name' => $apartmentName
                ], [
                    'status' => true,
                    'ubicacion' => '',
                    'order' => $finalOrder
                ]);

                // Si el apartamento ya existe, actualizar el order si se proporciona uno nuevo
                if (!$apartment->wasRecentlyCreated && $requestedOrder && $requestedOrder > 0) {
                    $newOrder = $this->getNextAvailableOrder($building, $requestedOrder, $apartment->id);
                    $apartment->update(['order' => $newOrder]);
                }

                $isNewApartment = $apartment->wasRecentlyCreated;
                if ($isNewApartment) {
                    $apartmentsCreated++;
                }

                // Preparar datos para inserción en lote (procesamiento por chunks)
                $chunkSize = 50; // Procesar de 50 en 50 para evitar timeouts
                $membersChunks = $members->chunk($chunkSize);
                
                foreach ($membersChunks as $chunk) {
                    $tenantsToCreate = [];
                    $usersToCreate = [];
                    $existingEmails = $apartment->tenants()->pluck('email')->toArray();

                    foreach ($chunk as $memberData) {
                        // Skip if tenant already exists in this apartment
                        if (in_array($memberData['email'], $existingEmails)) {
                            continue;
                        }

                        $tenantsToCreate[] = [
                            'name' => $memberData['name'],
                            'email' => $memberData['email'],
                            'phone' => $memberData['phone'] ?? '',
                            'apartment_id' => $apartment->id,
                            'photo' => null,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];

                        $usersToCreate[] = [
                            'name' => $memberData['name'],
                            'email' => $memberData['email'],
                            'password' => Hash::make($memberData['email']),
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                    }

                    // Insertar tenants en lote
                    if (!empty($tenantsToCreate)) {
                        Tenant::insert($tenantsToCreate);
                        $membersCreated += count($tenantsToCreate);

                        // Crear usuarios y asignar roles (más eficiente)
                        foreach ($usersToCreate as $userData) {
                            $user = User::updateOrCreate(
                                ['email' => $userData['email']],
                                $userData
                            );

                            if (!$user->hasRole('member')) {
                                $user->assignRole('member');
                            }
                        }
                    }
                    
                    // Pequeña pausa para evitar sobrecarga
                    usleep(10000); // 10ms
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 
                "Carga masiva completada. Apartamentos creados: {$apartmentsCreated}, Miembros creados: {$membersCreated}");

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error for debugging
            Log::error('Bulk upload error: ' . $e->getMessage(), [
                'file' => $file->getClientOriginalName(),
                'building_id' => $building->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Provide user-friendly error messages
            $errorMessage = 'Error al procesar el archivo: ';
            
            if (str_contains($e->getMessage(), 'Maximum execution time')) {
                $errorMessage .= 'El archivo es demasiado grande o complejo. Intente con un archivo más pequeño (máximo 1000 filas).';
            } elseif (str_contains($e->getMessage(), 'Memory limit')) {
                $errorMessage .= 'No hay suficiente memoria para procesar el archivo. Intente con un archivo más pequeño.';
            } elseif (str_contains($e->getMessage(), 'demasiadas filas')) {
                $errorMessage .= $e->getMessage();
            } elseif (str_contains($e->getMessage(), 'Header') || str_contains($e->getMessage(), 'email format')) {
                $errorMessage .= $e->getMessage();
            } else {
                $errorMessage .= $e->getMessage();
            }
            
            return redirect()->back()->withErrors(['file' => $errorMessage]);
        }
    }

    private function readExcelFile($file)
    {
        try {
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);
            $reader->setReadEmptyCells(false);
            $spreadsheet = $reader->load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();

            $data = [];
            $headers = [];
            $maxRow = $worksheet->getHighestRow();
            
            // Limitar a 1000 filas para evitar timeout
            if ($maxRow > 1000) {
                throw new \Exception("El archivo contiene demasiadas filas. Máximo permitido: 1000 filas");
            }
            
            foreach ($worksheet->getRowIterator(1, $maxRow) as $rowIndex => $row) {
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);
                
                $rowData = [];
                foreach ($cellIterator as $cell) {
                    $value = $cell->getValue();
                    $rowData[] = $value !== null ? trim((string)$value) : '';
                }
                
                if ($rowIndex === 1) {
                    $headers = array_map('strtolower', $rowData);
                    // Validate required headers
                    $requiredHeaders = ['apartment', 'name', 'email', 'phone'];
                    $optionalHeaders = ['order'];
                    foreach ($requiredHeaders as $required) {
                        if (!in_array($required, $headers)) {
                            throw new \Exception("Header '{$required}' is missing in Excel file");
                        }
                    }
                } else {
                    // Skip completely empty rows
                    if (empty(array_filter($rowData))) {
                        continue;
                    }
                    
                    $record = [];
                    foreach ($headers as $index => $header) {
                        $record[$header] = $rowData[$index] ?? '';
                    }
                    
                    // Validate required fields
                    if (empty($record['apartment']) || empty($record['name']) || empty($record['email'])) {
                        continue; // Skip rows with missing required data
                    }
                    
                    // Validate email format
                    if (!filter_var($record['email'], FILTER_VALIDATE_EMAIL)) {
                        throw new \Exception("Invalid email format in row {$rowIndex}: {$record['email']}");
                    }
                    
                    $data[] = $record;
                }
            }

            if (empty($data)) {
                throw new \Exception('No valid data found in Excel file');
            }

            return $data;
            
        } catch (\PhpOffice\PhpSpreadsheet\Exception $e) {
            throw new \Exception("Error reading Excel file: " . $e->getMessage());
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Determina el siguiente order disponible para un apartamento
     * 
     * @param Building $building
     * @param int|null $requestedOrder
     * @param int|null $excludeApartmentId - Para excluir el apartamento actual en actualizaciones
     * @return int
     */
    private function getNextAvailableOrder(Building $building, $requestedOrder = null, $excludeApartmentId = null)
    {
        // Si no se proporciona order o es 0, obtener el máximo + 1
        if (!$requestedOrder || $requestedOrder == 0) {
            $maxOrder = $building->apartments()
                ->when($excludeApartmentId, function ($query) use ($excludeApartmentId) {
                    return $query->where('id', '!=', $excludeApartmentId);
                })
                ->max('order') ?? 0;
            
            return $maxOrder + 1;
        }
        
        // Verificar si el order solicitado ya existe
        $existingApartment = $building->apartments()
            ->where('order', $requestedOrder)
            ->when($excludeApartmentId, function ($query) use ($excludeApartmentId) {
                return $query->where('id', '!=', $excludeApartmentId);
            })
            ->exists();
        
        // Si el order ya existe, obtener el máximo + 1
        if ($existingApartment) {
            $maxOrder = $building->apartments()
                ->when($excludeApartmentId, function ($query) use ($excludeApartmentId) {
                    return $query->where('id', '!=', $excludeApartmentId);
                })
                ->max('order') ?? 0;
            
            return $maxOrder + 1;
        }
        
        // Si el order no existe, usarlo
        return $requestedOrder;
    }
}
