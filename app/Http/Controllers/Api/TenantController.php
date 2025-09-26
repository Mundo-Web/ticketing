<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    protected $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }
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
            'owner' => function ($query) {
                $query->select('tenants.id', 'tenants.name', 'tenants.email');
            }
        ])->get();

        return response()->json([
            'own_devices' => $ownDevices->map(function ($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->name,
                    'status' => $device->status,
                    'ubicacion' => $device->ubicacion,
                    'brand' => $device->brand?->name,
                    'model' => $device->model?->name,
                    'system' => $device->system?->name,
                    'device_type' => $device->name_device?->name,
                    'icon_id' => $device->icon_id,
                    'name_device' => $device->name_device ? [
                        'id' => $device->name_device->id,
                        'name' => $device->name_device->name,
                        'status' => $device->name_device->status
                    ] : null,
                ];
            }),
            'shared_devices' => $sharedDevices->map(function ($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->name,
                    'status' => $device->status,
                    'ubicacion' => $device->ubicacion,
                    'brand' => $device->brand?->name,
                    'model' => $device->model?->name,
                    'system' => $device->system?->name,
                    'device_type' => $device->name_device?->name,
                    'icon_id' => $device->icon_id,
                    'name_device' => $device->name_device ? [
                        'id' => $device->name_device->id,
                        'name' => $device->name_device->name,
                        'status' => $device->name_device->status
                    ] : null,
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
            'tickets' => $tickets->map(function ($ticket) {
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
                        'icon_id' => $ticket->device->icon_id,
                        'name_device' => $ticket->device->name_device ? [
                            'id' => $ticket->device->name_device->id,
                            'name' => $ticket->device->name_device->name,
                            'status' => $ticket->device->name_device->status
                        ] : null,
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
            'apartment.tenants' => function ($query) use ($tenant) {
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
                'other_tenants' => $tenant->apartment->tenants->map(function ($t) {
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
            'doormen' => $doormen->map(function ($doorman) {
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
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        $validated = $request->validate([
            'device_id' => 'required|integer|exists:devices,id',
            'category' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'sometimes|string|in:low,medium,high,urgent',
            'attachments' => 'sometimes|array|max:5',
            'attachments.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi,wmv|max:20480' // 20MB max
        ]);

        // Verify device belongs to tenant
        $deviceBelongsToTenant = $tenant->devices()->where('devices.id', $validated['device_id'])->exists() ||
            $tenant->sharedDevices()->where('devices.id', $validated['device_id'])->exists();

        if (!$deviceBelongsToTenant) {
            return response()->json(['error' => 'Device not found or does not belong to tenant'], 403);
        }

        // Handle file attachments - SAME AS WEB VERSION
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $fileName = uniqid() . '_' . time() . '.' . $extension;

                // Store file in public/storage/tickets (SAME FOLDER AS WEB)
                $path = $file->storeAs('tickets', $fileName, 'public');

                $attachments[] = [
                    'original_name' => $originalName,
                    'file_name'  => $fileName,
                    'file_path' => $path,

                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'uploaded_at' => now()->toISOString(),
                ];
            }
        }

        // Create the ticket with attachments
        $ticket = \App\Models\Ticket::create([
            'user_id' => $user->id,
            'device_id' => $validated['device_id'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'open',
            'code' => $this->generateTicketCode(),
            'attachments' => $attachments
        ]);

        // Create history entry
        $ticket->histories()->create([
            'action' => 'created',
            'description' => 'Ticket created by tenant via mobile app' . (!empty($attachments) ? ' with ' . count($attachments) . ' attachment(s)' : ''),
            'user_id' => $user->id,
            'user_name' => $user->name,
        ]);

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'category' => $ticket->category,
                'status' => $ticket->status,
                'priority' => 'medium', // Default
                'created_at' => $ticket->created_at,
                'attachments' => $attachments
            ],
            'message' => 'Ticket created successfully' . (!empty($attachments) ? ' with attachments' : '')
        ], 201);
    }

    /**
     * Create a new ticket for Android with base64 attachments
     */
    public function createTicketAndroid(Request $request)
    {
        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'Tenant profile not found'], 404);
        }

        $validated = $request->validate([
            'device_id' => 'required|integer|exists:devices,id',
            'category' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'sometimes|string|in:low,medium,high,urgent',
            'attachments_base64' => 'sometimes|array|max:5',
            'attachments_base64.*.name' => 'required_with:attachments_base64|string|max:255',
            'attachments_base64.*.type' => 'required_with:attachments_base64|string|in:image/jpeg,image/png,image/jpg,image/gif,image/webp,video/mp4,video/mov,video/avi,video/wmv',
            'attachments_base64.*.data' => 'required_with:attachments_base64|string',
            'attachments_base64.*.size' => 'required_with:attachments_base64|integer|max:20971520' // 20MB max
        ]);

        // Verify device belongs to tenant
        $deviceBelongsToTenant = $tenant->devices()->where('devices.id', $validated['device_id'])->exists() ||
            $tenant->sharedDevices()->where('devices.id', $validated['device_id'])->exists();

        if (!$deviceBelongsToTenant) {
            return response()->json(['error' => 'Device not found or does not belong to tenant'], 403);
        }

        // Handle base64 attachments for Android
        $attachments = [];
        if (!empty($validated['attachments_base64'])) {
            foreach ($validated['attachments_base64'] as $attachment) {
                try {
                
                    // Validate base64 data format
                    if (!preg_match('/^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,(.+)$/', $attachment['data'], $matches)) {
                        return response()->json(['error' => 'Invalid base64 format for attachment: ' . $attachment['name']], 400);
                    }

                    $mimeType = $matches[1];
                    $base64Data = $matches[2];

                    // Verify mime type matches the provided type
                    if ($mimeType !== $attachment['type']) {
                        return response()->json(['error' => 'Mime type mismatch for attachment: ' . $attachment['name']], 400);
                    }

                    // Decode base64
                    $fileData = base64_decode($base64Data);
                    if ($fileData === false) {
                        return response()->json(['error' => 'Failed to decode base64 for attachment: ' . $attachment['name']], 400);
                    }

                    // Verify file size
                    if (strlen($fileData) !== $attachment['size']) {
                        return response()->json(['error' => 'File size mismatch for attachment: ' . $attachment['name']], 400);
                    }

                    // Generate unique filename
                    $extension = pathinfo($attachment['name'], PATHINFO_EXTENSION);
                    if (empty($extension)) {
                        // Determine extension from mime type
                        $extensionMap = [
                            'image/jpeg' => 'jpg',
                            'image/png' => 'png',
                            'image/jpg' => 'jpg',
                            'image/gif' => 'gif',
                            'image/webp' => 'webp',
                            'video/mp4' => 'mp4',
                            'video/mov' => 'mov',
                            'video/avi' => 'avi',
                            'video/wmv' => 'wmv'
                        ];
                        $extension = $extensionMap[$mimeType] ?? 'bin';
                    }

                    $fileName = uniqid() . '_' . time() . '.' . $extension;
                    $filePath = 'tickets/' . $fileName;

                    // Store file in public/storage/tickets (SAME FOLDER AS WEB)
                    $fullPath = storage_path('app/public/' . $filePath);
                    
                    // Create directory if it doesn't exist
                    $directory = dirname($fullPath);
                    if (!is_dir($directory)) {
                        mkdir($directory, 0755, true);
                    }

                    // Save file
                    if (file_put_contents($fullPath, $fileData) === false) {
                        return response()->json(['error' => 'Failed to save attachment: ' . $attachment['name']], 500);
                    }

                    $attachments[] = [
                        'original_name' => $attachment['name'],
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'mime_type' => $mimeType,
                        'file_size' => $attachment['size'],
                        'uploaded_at' => now()->toISOString(),
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing base64 attachment', [
                        'attachment_name' => $attachment['name'],
                        'error' => $e->getMessage()
                    ]);
                    return response()->json(['error' => 'Failed to process attachment: ' . $attachment['name']], 500);
                }
            }
        }

        // Create the ticket with attachments
        $ticket = \App\Models\Ticket::create([
            'user_id' => $user->id,
            'device_id' => $validated['device_id'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'open',
            'code' => $this->generateTicketCode(),
            'attachments' => $attachments
        ]);

        // Create history entry
        $ticket->histories()->create([
            'action' => 'created',
            'description' => 'Ticket created by tenant via Android app' . (!empty($attachments) ? ' with ' . count($attachments) . ' attachment(s)' : ''),
            'user_id' => $user->id,
            'user_name' => $user->name,
        ]);

        // Load device relations for response
        $ticket->load([
            'device.brand',
            'device.model', 
            'device.system',
            'device.name_device'
        ]);

        return response()->json([
            'ticket' => [
                'id' => $ticket->id,
                'code' => $ticket->code,
                'title' => $ticket->title,
                'description' => $ticket->description,
                'category' => $ticket->category,
                'status' => $ticket->status,
                'priority' => 'medium', // Default value for response
                'created_at' => $ticket->created_at,
                'device' => $ticket->device ? [
                    'id' => $ticket->device->id,
                    'name' => $ticket->device->name,
                    'brand' => $ticket->device->brand?->name,
                    'model' => $ticket->device->model?->name,
                    'system' => $ticket->device->system?->name,
                    'device_type' => $ticket->device->name_device?->name,
                    'icon_id' => $ticket->device->icon_id,
                    'name_device' => $ticket->device->name_device ? [
                        'id' => $ticket->device->name_device->id,
                        'name' => $ticket->device->name_device->name,
                        'status' => $ticket->device->name_device->status
                    ] : null,
                ] : null,
                'attachments' => $attachments
            ],
            'message' => 'Ticket created successfully via Android app' . (!empty($attachments) ? ' with ' . count($attachments) . ' attachment(s)' : '')
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
            'histories' => function ($query) {
                $query->orderBy('created_at', 'desc');
            },
            'histories.technical'
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
                    'icon_id' => $ticket->device->icon_id,
                    'name_device' => $ticket->device->name_device ? [
                        'id' => $ticket->device->name_device->id,
                        'name' => $ticket->device->name_device->name,
                        'status' => $ticket->device->name_device->status
                    ] : null,
                ] : null,
                'technical' => $ticket->technical ? [
                    'id' => $ticket->technical->id,
                    'name' => $ticket->technical->name,
                    'email' => $ticket->technical->email,
                    'phone' => $ticket->technical->phone,
                    'photo' => $ticket->technical->photo,
                    'shift' => $ticket->technical->shift,
                ] : null,
                'histories' => $ticket->histories->map(function ($history) {
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
     * Reset password request - generates temporary password
     */
    public function resetPasswordRequest(Request $request)
    {
        $user = $request->user();

        // Generate temporary password using user's email
        $temporaryPassword = $user->email;

        try {
            // Update user's password
            $user->update([
                'password' => Hash::make($temporaryPassword)
            ]);

            // Send email notification
            $user->notify(new \App\Notifications\PasswordResetNotification($temporaryPassword));

            return response()->json([
                'message' => 'Password has been reset. Check your email for the temporary password.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to reset password'
            ], 500);
        }
    }





    /**
     * Get all tenants for admin/technical to create tickets
     */
    public function getAllTenants()
    {
        try {
            $tenants = Tenant::with(['apartment.building'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'tenants' => $tenants
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching tenants: ' . $e->getMessage());

            return response()->json([
                'error' => 'Error fetching tenants'
            ], 500);
        }
    }

    /**
     * Get notifications for mobile app
     */
    public function notifications(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado',
                    'notifications' => [],
                    'unread_count' => 0
                ], 401);
            }

            // Verificar que el usuario tiene rol de member
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Solo para members.',
                    'notifications' => [],
                    'unread_count' => 0
                ], 403);
            }

            // Obtener notificaciones del usuario
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            // Transformar para la app móvil
            $transformedNotifications = $notifications->map(function ($notification) {
                $data = $notification->data;

                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $data['title'] ?? 'Notificación',
                    'message' => $data['message'] ?? 'Nueva notificación',
                    'ticket_id' => $data['ticket_id'] ?? null,
                    'ticket_code' => $data['ticket_code'] ?? null,
                    'action_url' => $data['action_url'] ?? null,
                    'icon' => $data['icon'] ?? 'bell',
                    'color' => $data['color'] ?? 'blue',
                    'is_read' => !is_null($notification->read_at),
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at->toISOString(),
                    'updated_at' => $notification->updated_at->toISOString(),
                ];
            });

            $unreadCount = $user->unreadNotifications()->count();

            Log::info('Mobile notifications fetched', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'total_notifications' => $notifications->count(),
                'unread_count' => $unreadCount
            ]);

            return response()->json([
                'success' => true,
                'notifications' => $transformedNotifications,
                'unread_count' => $unreadCount,
                'total_count' => $notifications->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching mobile notifications', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener notificaciones',
                'notifications' => [],
                'unread_count' => 0
            ], 500);
        }
    }

    /**
     * Mark notification as read for mobile app
     */
    public function markNotificationAsRead(Request $request, $notificationId)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que el usuario tiene rol de member
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Solo para members.'
                ], 403);
            }

            // Buscar la notificación del usuario
            $notification = $user->notifications()->where('id', $notificationId)->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notificación no encontrada'
                ], 404);
            }

            // Marcar como leída si no lo está ya
            if (is_null($notification->read_at)) {
                $notification->markAsRead();

                Log::info('Mobile notification marked as read', [
                    'user_id' => $user->id,
                    'notification_id' => $notificationId
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Notificación marcada como leída'
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking mobile notification as read', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
                'notification_id' => $notificationId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al marcar notificación como leída'
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for mobile app
     */
    public function markAllNotificationsAsRead(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Verificar que el usuario tiene rol de member
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Solo para members.'
                ], 403);
            }

            // Marcar todas las notificaciones no leídas como leídas
            $unreadCount = $user->unreadNotifications()->count();
            $user->unreadNotifications()->update(['read_at' => now()]);

            Log::info('All mobile notifications marked as read', [
                'user_id' => $user->id,
                'marked_count' => $unreadCount
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Todas las notificaciones marcadas como leídas',
                'marked_count' => $unreadCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking all mobile notifications as read', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al marcar todas las notificaciones como leídas'
            ], 500);
        }
    }

    /**
     * Send message to assigned technician
     */
    public function sendMessageToTechnical(Request $request, $ticketId)
    {
        Log::info("=== SEND MESSAGE TO TECHNICAL START ===", [
            'ticket_id' => $ticketId,
            'user_id' => $request->user()?->id,
            'message_length' => strlen($request->input('message', '')),
            'request_headers' => $request->headers->all(),
            'request_data' => $request->all()
        ]);

        try {
            $request->validate([
                'message' => 'required|string|max:500'
            ]);

            $user = $request->user();
            
            Log::info("User validation check", [
                'user_exists' => !!$user,
                'user_id' => $user?->id,
                'has_member_role' => $user?->hasRole('member') ?? false
            ]);
            
            // Verify user is tenant and owns the ticket
            if (!$user || !$user->hasRole('member')) {
                Log::warning("Unauthorized access attempt", [
                    'user_id' => $user?->id,
                    'has_member_role' => $user?->hasRole('member') ?? false
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $ticket = \App\Models\Ticket::with(['technical', 'user.tenant'])
                ->where('user_id', $user->id)
                ->find($ticketId);

            Log::info("Ticket lookup result", [
                'ticket_found' => !!$ticket,
                'ticket_id' => $ticket?->id,
                'technical_assigned' => !!$ticket?->technical_id,
                'technical_id' => $ticket?->technical_id
            ]);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found or not owned by user'
                ], 404);
            }

            // Verify ticket has assigned technician
            if (!$ticket->technical_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No technician assigned to this ticket'
                ], 400);
            }

            // Create history entry
            Log::info("Creating history entry");
            $historyEntry = $ticket->histories()->create([
                'action' => 'member_message',
                'description' => $request->message,
                'user_id' => $user->id,
                'technical_id' => null, // Message from member
                'created_at' => now(),
            ]);
            
            Log::info("History entry created", ['history_id' => $historyEntry->id]);

            // Send notification to technician - WRAP IN TRY-CATCH
            $technical = $ticket->technical;
            if ($technical) {
                try {
                    Log::info("Sending notification to technical", [
                        'technical_id' => $technical->id,
                        'technical_email' => $technical->email
                    ]);
                    
                    $technicalUser = \App\Models\User::where('email', $technical->email)->first();
                    
                    if ($technicalUser) {
                        Log::info("Technical user found, sending notification", [
                            'technical_user_id' => $technicalUser->id
                        ]);
                        
                        $technicalUser->notify(new \App\Notifications\MemberMessageNotification(
                            $ticket,
                            $user->tenant,
                            $request->message
                        ));
                        
                        Log::info("Notification sent successfully");
                        
                        // Emit real-time notification - ALSO WRAP IN TRY-CATCH
                        try {
                            $databaseNotification = $technicalUser->notifications()->latest()->first();
                            if ($databaseNotification) {
                                event(new \App\Events\NotificationCreated($databaseNotification, $technicalUser->id));
                                Log::info("Real-time event emitted successfully");
                            }
                        } catch (\Exception $eventError) {
                            Log::error("Failed to emit real-time event (non-critical): " . $eventError->getMessage());
                            // Don't fail the entire request for event errors
                        }
                    } else {
                        Log::warning("Technical user not found", ['technical_email' => $technical->email]);
                    }
                } catch (\Exception $notificationError) {
                    Log::error("Failed to send notification (non-critical): " . $notificationError->getMessage());
                    // Don't fail the entire request for notification errors
                }
            }

            Log::info("Message sent successfully", [
                'ticket_id' => $ticket->id,
                'member_id' => $user->id,
                'technical_id' => $ticket->technical_id,
                'message_length' => strlen($request->message)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'ticket_id' => $ticket->id
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in send message: ' . $e->getMessage(), [
                'errors' => $e->errors()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Mobile send message error: ' . $e->getMessage(), [
                'exception_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message'
            ], 500);
        } finally {
            Log::info("=== SEND MESSAGE TO TECHNICAL END ===");
        }
    }

    /**
     * Add member feedback to appointment (CORRECT implementation)
     */
    public function addAppointmentFeedback(Request $request, $appointmentId)
    {
        try {
            $validated = $request->validate([
                'member_feedback' => 'nullable|string|max:1000',
                'service_rating' => 'required|integer|min:1|max:5',
            ]);

            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            // Find appointment and verify it belongs to user's ticket
            $appointment = \App\Models\Appointment::with(['ticket'])
                ->whereHas('ticket', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->find($appointmentId);

            if (!$appointment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment not found or not owned by user'
                ], 404);
            }

            // Verify appointment is awaiting feedback
            if ($appointment->status !== 'awaiting_feedback') {
                return response()->json([
                    'success' => false,
                    'message' => 'Appointment is not awaiting feedback'
                ], 400);
            }

            // Update appointment with feedback and mark as completed
            $appointment->update([
                'status' => 'completed',
                'member_feedback' => $validated['member_feedback'],
                'service_rating' => $validated['service_rating'],
            ]);

            // Add to appointment history via ticket (same as web version)
            $appointment->ticket->addHistory(
                'member_feedback',
                'Member provided feedback via mobile app',
                [
                    'member_feedback' => $validated['member_feedback'],
                    'service_rating' => $validated['service_rating'],
                    'feedback_by' => $user->name,
                    'action' => 'member_feedback'
                ]
            );

            Log::info("Member appointment feedback submitted via mobile", [
                'appointment_id' => $appointment->id,
                'ticket_id' => $appointment->ticket_id,
                'member_id' => $user->id,
                'rating' => $validated['service_rating'],
                'has_comment' => !empty($validated['member_feedback'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Feedback submitted successfully',
                'appointment_id' => $appointment->id,
                'rating' => $validated['service_rating']
            ]);

        } catch (\Exception $e) {
            Log::error('Mobile appointment feedback error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit feedback'
            ], 500);
        }
    }

    /**
     * Get ticket attachments with proper URLs for mobile app
     */
    public function getTicketAttachments(Request $request, $ticketId)
    {
        try {
            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $ticket = \App\Models\Ticket::where('user_id', $user->id)->find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found or not owned by user'
                ], 404);
            }

            $attachments = $ticket->attachments ?? [];
            $baseUrl = config('app.url');

            // Add full URLs for mobile app
            $attachmentsWithUrls = array_map(function($attachment) use ($baseUrl) {
                return [
                    'original_name' => $attachment['original_name'],
                    'file_name' => $attachment['file_name'],
                    'file_path' => $attachment['file_path'],
                    'full_url' => $baseUrl . '/storage/' . $attachment['file_path'],
                    'mime_type' => $attachment['mime_type'],
                    'file_size' => $attachment['file_size'],
                    'uploaded_at' => $attachment['uploaded_at'],
                    'is_image' => strpos($attachment['mime_type'], 'image/') === 0,
                    'is_video' => strpos($attachment['mime_type'], 'video/') === 0,
                ];
            }, $attachments);

            return response()->json([
                'success' => true,
                'attachments' => $attachmentsWithUrls,
                'count' => count($attachmentsWithUrls)
            ]);

        } catch (\Exception $e) {
            Log::error('Mobile get attachments error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get attachments'
            ], 500);
        }
    }

    /**
     * Get ticket appointments for member (to understand feedback availability)
     */
    public function getTicketAppointments(Request $request, $ticketId)
    {
        try {
            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $ticket = \App\Models\Ticket::where('user_id', $user->id)->find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ticket not found or not owned by user'
                ], 404);
            }

            // Load appointments with technical info
            $appointments = $ticket->appointments()
                ->with(['technical'])
                ->orderBy('scheduled_for', 'desc')
                ->get();

            // Get active appointment (including awaiting_feedback)
            $activeAppointment = $ticket->appointments()
                ->whereIn('status', ['scheduled', 'in_progress', 'awaiting_feedback'])
                ->with(['technical'])
                ->first();

            // Get appointment awaiting feedback specifically
            $appointmentAwaitingFeedback = $ticket->appointments()
                ->where('status', 'awaiting_feedback')
                ->with(['technical'])
                ->first();

            $lastCompletedAppointment = $ticket->appointments()
                ->where('status', 'completed')
                ->with(['technical'])
                ->orderBy('completed_at', 'desc')
                ->first();

            // Check if feedback is available (CORRECT: based on appointment status)
            $feedbackAvailable = $appointmentAwaitingFeedback !== null;

            return response()->json([
                'success' => true,
                'ticket_id' => $ticket->id,
                'ticket_status' => $ticket->status,
                'appointments' => $appointments->map(function($appointment) {
                    return [
                        'id' => $appointment->id,
                        'title' => $appointment->title,
                        'description' => $appointment->description,
                        'scheduled_for' => $appointment->scheduled_for,
                        'status' => $appointment->status,
                        'started_at' => $appointment->started_at,
                        'completed_at' => $appointment->completed_at,
                        'completion_notes' => $appointment->completion_notes,
                        'member_feedback' => $appointment->member_feedback,
                        'service_rating' => $appointment->service_rating,
                        'technical' => $appointment->technical ? [
                            'id' => $appointment->technical->id,
                            'name' => $appointment->technical->name,
                            'email' => $appointment->technical->email,
                            'phone' => $appointment->technical->phone,
                        ] : null,
                    ];
                }),
                'active_appointment' => $activeAppointment ? [
                    'id' => $activeAppointment->id,
                    'title' => $activeAppointment->title,
                    'scheduled_for' => $activeAppointment->scheduled_for,
                    'status' => $activeAppointment->status,
                    'technical' => $activeAppointment->technical ? [
                        'id' => $activeAppointment->technical->id,
                        'name' => $activeAppointment->technical->name,
                        'email' => $activeAppointment->technical->email,
                        'phone' => $activeAppointment->technical->phone,
                    ] : null,
                ] : null,
                'last_completed_appointment' => $lastCompletedAppointment ? [
                    'id' => $lastCompletedAppointment->id,
                    'title' => $lastCompletedAppointment->title,
                    'completed_at' => $lastCompletedAppointment->completed_at,
                    'completion_notes' => $lastCompletedAppointment->completion_notes,
                    'technical' => $lastCompletedAppointment->technical ? [
                        'id' => $lastCompletedAppointment->technical->id,
                        'name' => $lastCompletedAppointment->technical->name,
                    ] : null,
                ] : null,
                'appointment_awaiting_feedback' => $appointmentAwaitingFeedback ? [
                    'id' => $appointmentAwaitingFeedback->id,
                    'title' => $appointmentAwaitingFeedback->title,
                    'scheduled_for' => $appointmentAwaitingFeedback->scheduled_for,
                    'completed_at' => $appointmentAwaitingFeedback->completed_at,
                    'completion_notes' => $appointmentAwaitingFeedback->completion_notes,
                    'status' => $appointmentAwaitingFeedback->status,
                    'technical' => $appointmentAwaitingFeedback->technical ? [
                        'id' => $appointmentAwaitingFeedback->technical->id,
                        'name' => $appointmentAwaitingFeedback->technical->name,
                        'email' => $appointmentAwaitingFeedback->technical->email,
                        'phone' => $appointmentAwaitingFeedback->technical->phone,
                    ] : null,
                ] : null,
                'feedback_available' => $feedbackAvailable,
                'feedback_reason' => $feedbackAvailable ? 
                    'Appointment is awaiting feedback from member' : 
                    ($activeAppointment ? 'Appointment is not awaiting feedback' : 'No active appointment requiring feedback'),
            ]);

        } catch (\Exception $e) {
            Log::error('Mobile get appointments error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get appointments'
            ], 500);
        }
    }

    /**
     * Generate unique ticket code
     */
    private function generateTicketCode()
    {
        do {
            // Generate code format: TCK-YYYYMMDD-XXXXX
            $code = 'TCK-' . date('Ymd') . '-' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
        } while (\App\Models\Ticket::where('code', $code)->exists());

        return $code;
    }
}
