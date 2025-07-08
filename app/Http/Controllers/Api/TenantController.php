<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    /**
     * Login tenant
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Verificar que el usuario tiene rol de member (tenant)
        if (!$user->hasRole('member')) {
            throw ValidationException::withMessages([
                'email' => ['Access denied. Not a valid tenant account.'],
            ]);
        }

        // Obtener información del tenant
        $tenant = $user->tenant;
        if (!$tenant) {
            throw ValidationException::withMessages([
                'email' => ['Tenant profile not found.'],
            ]);
        }

        // Crear token
        $token = $user->createToken('tenant-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tenant_id' => $tenant->id,
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'photo' => $tenant->photo,
                'apartment_id' => $tenant->apartment_id,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Logout tenant
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Get authenticated tenant's profile
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        $tenant->load([
            'apartment.building.owner',
            'apartment.building.doormen'
        ]);

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'photo' => $tenant->photo,
                'apartment' => $tenant->apartment ? [
                    'id' => $tenant->apartment->id,
                    'name' => $tenant->apartment->name,
                    'ubicacion' => $tenant->apartment->ubicacion,
                    'building' => $tenant->apartment->building ? [
                        'id' => $tenant->apartment->building->id,
                        'name' => $tenant->apartment->building->name,
                        'address' => $tenant->apartment->building->address,
                        'description' => $tenant->apartment->building->description,
                        'location_link' => $tenant->apartment->building->location_link,
                        'image' => $tenant->apartment->building->image,
                    ] : null,
                ] : null,
            ]
        ]);
    }

    /**
     * Get tenant's devices
     */
    public function devices(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        // Devices propios
        $ownDevices = $tenant->devices()->with([
            'brand',
            'model',
            'system',
            'name_device'
        ])->get();

        // Devices compartidos
        $sharedDevices = $tenant->sharedDevices()->with([
            'brand',
            'model',
            'system',
            'name_device',
            'owner' => function($query) {
                $query->select('tenants.id', 'tenants.name', 'tenants.email');
            }
        ])->get();

        return response()->json([
            'own_devices' => $ownDevices->map(function($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->name,
                    'status' => $device->status,
                    'ubicacion' => $device->ubicacion,
                    'brand' => $device->brand?->name,
                    'model' => $device->model?->name,
                    'system' => $device->system?->name,
                    'device_type' => $device->name_device?->name,
                ];
            }),
            'shared_devices' => $sharedDevices->map(function($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->name,
                    'status' => $device->status,
                    'ubicacion' => $device->ubicacion,
                    'brand' => $device->brand?->name,
                    'model' => $device->model?->name,
                    'system' => $device->system?->name,
                    'device_type' => $device->name_device?->name,
                    'owner' => $device->owner->first() ? [
                        'id' => $device->owner->first()->id,
                        'name' => $device->owner->first()->name,
                        'email' => $device->owner->first()->email,
                    ] : null,
                ];
            }),
        ]);
    }

    /**
     * Get tenant's tickets
     */
    public function tickets(Request $request)
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        $status = $request->query('status', 'all');

        // Buscar tickets del usuario autenticado
        $ticketsQuery = \App\Models\Ticket::with([
            'device.brand',
            'device.model',
            'device.system',
            'device.name_device',
            'technical',
            'histories'
        ])->where('user_id', $user->id);

        if ($status !== 'all') {
            $ticketsQuery->where('status', $status);
        }

        $tickets = $ticketsQuery->orderBy('created_at', 'desc')->get();

        return response()->json([
            'tickets' => $tickets->map(function($ticket) {
                return [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'description' => $ticket->description,
                    'category' => $ticket->category,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                    'device' => $ticket->device ? [
                        'id' => $ticket->device->id,
                        'name' => $ticket->device->name,
                        'brand' => $ticket->device->brand?->name,
                        'model' => $ticket->device->model?->name,
                        'system' => $ticket->device->system?->name,
                        'device_type' => $ticket->device->name_device?->name,
                    ] : null,
                    'technical' => $ticket->technical ? [
                        'id' => $ticket->technical->id,
                        'name' => $ticket->technical->name,
                        'email' => $ticket->technical->email,
                        'phone' => $ticket->technical->phone,
                    ] : null,
                    'histories_count' => $ticket->histories->count(),
                ];
            }),
        ]);
    }

    /**
     * Get tenant's apartment info
     */
    public function apartment(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        $tenant->load([
            'apartment.building.owner',
            'apartment.tenants' => function($query) use ($tenant) {
                $query->where('id', '!=', $tenant->id);
            }
        ]);

        if (!$tenant->apartment) {
            return response()->json(['error' => 'Apartment not found'], 404);
        }

        return response()->json([
            'apartment' => [
                'id' => $tenant->apartment->id,
                'name' => $tenant->apartment->name,
                'ubicacion' => $tenant->apartment->ubicacion,
                'status' => $tenant->apartment->status,
                'other_tenants' => $tenant->apartment->tenants->map(function($t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                        'email' => $t->email,
                        'phone' => $t->phone,
                        'photo' => $t->photo,
                    ];
                }),
                'building' => $tenant->apartment->building ? [
                    'id' => $tenant->apartment->building->id,
                    'name' => $tenant->apartment->building->name,
                    'address' => $tenant->apartment->building->address,
                    'description' => $tenant->apartment->building->description,
                    'location_link' => $tenant->apartment->building->location_link,
                    'image' => $tenant->apartment->building->image,
                ] : null,
            ]
        ]);
    }

    /**
     * Get tenant's building info
     */
    public function building(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant || !$tenant->apartment || !$tenant->apartment->building) {
            return response()->json(['error' => 'Building not found'], 404);
        }

        $building = $tenant->apartment->building;
        $building->load(['owner', 'doormen']);

        return response()->json([
            'building' => [
                'id' => $building->id,
                'name' => $building->name,
                'managing_company' => $building->managing_company,
                'address' => $building->address,
                'description' => $building->description,
                'location_link' => $building->location_link,
                'image' => $building->image,
                'status' => $building->status,
                'owner' => $building->owner ? [
                    'id' => $building->owner->id,
                    'name' => $building->owner->name,
                    'email' => $building->owner->email,
                    'phone' => $building->owner->phone,
                    'photo' => $building->owner->photo,
                ] : null,
            ]
        ]);
    }

    /**
     * Get tenant's building doormen
     */
    public function doormen(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant || !$tenant->apartment || !$tenant->apartment->building) {
            return response()->json(['error' => 'Building not found'], 404);
        }

        $doormen = $tenant->apartment->building->doormen()
            ->where('status', true)
            ->where('visible', true)
            ->get();

        return response()->json([
            'doormen' => $doormen->map(function($doorman) {
                return [
                    'id' => $doorman->id,
                    'name' => $doorman->name,
                    'email' => $doorman->email,
                    'phone' => $doorman->phone,
                    'photo' => $doorman->photo,
                    'shift' => $doorman->shift,
                ];
            }),
        ]);
    }

    /**
     * Get tenant's building owner
     */
    public function owner(Request $request)
    {
        $tenant = $request->user()->tenant;

        if (!$tenant || !$tenant->apartment || !$tenant->apartment->building) {
            return response()->json(['error' => 'Building not found'], 404);
        }

        $owner = $tenant->apartment->building->owner;

        if (!$owner) {
            return response()->json(['error' => 'Owner not found'], 404);
        }

        return response()->json([
            'owner' => [
                'id' => $owner->id,
                'name' => $owner->name,
                'email' => $owner->email,
                'phone' => $owner->phone,
                'photo' => $owner->photo,
            ]
        ]);
    }

    /**
     * Create a new ticket
     */
    public function createTicket(Request $request)
    {
        $request->validate([
            'device_id' => 'required|exists:devices,id',
            'category' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        // Verificar que el device pertenece al tenant o está compartido con él
        $device = $tenant->devices()->find($request->device_id) ?: 
                  $tenant->sharedDevices()->find($request->device_id);

        if (!$device) {
            return response()->json([
                'error' => 'Device not found or not accessible'
            ], 403);
        }

        $ticket = \App\Models\Ticket::create([
            'user_id' => $user->id,
            'device_id' => $request->device_id,
            'category' => $request->category,
            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority ?? 'medium',
            'status' => 'open',
        ]);

        // Agregar entrada al historial
        $ticket->histories()->create([
            'action' => 'created',
            'description' => "Ticket created by {$tenant->name}",
            'user_name' => $tenant->name,
        ]);

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'category' => $ticket->category,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'created_at' => $ticket->created_at,
            ],
            'message' => 'Ticket created successfully'
        ], 201);
    }

    /**
     * Get ticket detail
     */
    public function ticketDetail(Request $request, $ticketId)
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        // Buscar el ticket que pertenece al usuario autenticado
        $ticket = \App\Models\Ticket::with([
            'device.brand',
            'device.model', 
            'device.system',
            'device.name_device',
            'technical',
            'histories' => function($query) {
                $query->orderBy('created_at', 'desc');
            }
        ])->where('user_id', $user->id)->find($ticketId);

        if (!$ticket) {
            return response()->json(['error' => 'Ticket not found'], 404);
        }

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'category' => $ticket->category,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'created_at' => $ticket->created_at,
                'updated_at' => $ticket->updated_at,
                'device' => $ticket->device ? [
                    'id' => $ticket->device->id,
                    'name' => $ticket->device->name,
                    'brand' => $ticket->device->brand?->name,
                    'model' => $ticket->device->model?->name,
                    'system' => $ticket->device->system?->name,
                    'device_type' => $ticket->device->name_device?->name,
                    'ubicacion' => $ticket->device->ubicacion,
                ] : null,
                'technical' => $ticket->technical ? [
                    'id' => $ticket->technical->id,
                    'name' => $ticket->technical->name,
                    'email' => $ticket->technical->email,
                    'phone' => $ticket->technical->phone,
                ] : null,
                'histories' => $ticket->histories->map(function($history) {
                    return [
                        'id' => $history->id,
                        'action' => $history->action,
                        'description' => $history->description,
                        'user_name' => $history->user_name,
                        'created_at' => $history->created_at,
                    ];
                }),
            ]
        ]);
    }

    /**
     * Change password for authenticated tenant
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        // Verificar contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'error' => 'Current password is incorrect'
            ], 400);
        }

        // Actualizar contraseña
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Request password reset (for authenticated users)
     */
    public function resetPasswordRequest(Request $request)
    {
        $user = $request->user();

        // Generar nueva contraseña temporal (su email)
        $tempPassword = $user->email;

        // Actualizar contraseña en base de datos
        $user->update([
            'password' => Hash::make($tempPassword)
        ]);

        // Enviar email de notificación
        try {
            Mail::to($user->email)->send(new \App\Mail\PasswordResetNotification($user, $tempPassword));
            
            return response()->json([
                'message' => 'Password has been reset. Check your email for the temporary password.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error sending password reset email: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Password has been reset but there was an error sending the email notification.'
            ]);
        }
    }
}
