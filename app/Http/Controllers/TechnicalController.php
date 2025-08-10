<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TechnicalController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isDefaultTechnical = false;
        $isSuperAdmin = $user->hasRole('super-admin');
        
        // Check if current user is default technical
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        // Only super-admin and default technical can access technicals management
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        $technicals = Technical::query()
            ->with([
                'tickets' => function($query) {
                    $query->select('id', 'technical_id', 'status', 'title', 'created_at', 'resolved_at')
                        ->latest()
                        ->limit(5);
                }
            ])
            ->withCount([
                'tickets as total_tickets',
                'tickets as open_tickets' => function($query) {
                    $query->where('status', 'open');
                },
                'tickets as in_progress_tickets' => function($query) {
                    $query->where('status', 'in_progress');
                },
                'tickets as resolved_tickets' => function($query) {
                    $query->where('status', 'resolved');
                },
                'tickets as closed_tickets' => function($query) {
                    $query->where('status', 'closed');
                },
                'tickets as weekly_tickets' => function($query) {
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                },
                'tickets as monthly_tickets' => function($query) {
                    $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                },
                'tickets as today_tickets' => function($query) {
                    $query->whereDate('created_at', today());
                },
                'tickets as resolved_today' => function($query) {
                    $query->where('status', 'resolved')->whereDate('resolved_at', today());
                },
                'tickets as resolved_this_week' => function($query) {
                    $query->where('status', 'resolved')
                        ->whereBetween('resolved_at', [now()->startOfWeek(), now()->endOfWeek()]);
                }
            ])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // Agregar información adicional para cada técnico
        $technicals->getCollection()->transform(function ($technical) {
            // Obtener dispositivos únicos asignados a través de tickets activos
            $deviceIds = $technical->tickets()
                ->whereIn('status', ['open', 'in_progress'])
                ->distinct()
                ->pluck('device_id')
                ->filter()
                ->take(5); // Aumentar a 5 dispositivos

            $assignedDevices = \App\Models\Device::whereIn('id', $deviceIds)
                ->with(['brand', 'system', 'model', 'name_device'])
                ->get();

            // Calcular tiempo promedio de resolución (en horas)
            $resolvedTickets = $technical->tickets()
                ->where('status', 'resolved')
                ->whereNotNull('resolved_at')
                ->get();

            $avgResolutionTime = 0;
            if ($resolvedTickets->count() > 0) {
                $totalHours = $resolvedTickets->sum(function($ticket) {
                    return $ticket->created_at->diffInHours($ticket->resolved_at);
                });
                $avgResolutionTime = round($totalHours / $resolvedTickets->count(), 1);
            }

            // Calcular racha de tickets resueltos consecutivos
            $recentTickets = $technical->tickets()
                ->orderByDesc('created_at')
                ->limit(10)
                ->get();
            
            $currentStreak = 0;
            foreach ($recentTickets as $ticket) {
                if ($ticket->status === 'resolved') {
                    $currentStreak++;
                } else {
                    break;
                }
            }

            $technical->assigned_devices = $assignedDevices;
            $technical->assigned_devices_count = $assignedDevices->count();
            $technical->avg_resolution_time = $avgResolutionTime;
            $technical->current_streak = $currentStreak;
            $technical->last_activity = $technical->tickets()->latest('created_at')->first()?->created_at;
            
            return $technical;
        });

        return Inertia::render('Technicals/index', [
            'technicals' => $technicals,
            'filters' => $request->only(['search']),
            'canManage' => $isSuperAdmin || $isDefaultTechnical,
            'isDefaultTechnical' => $isDefaultTechnical,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }
    private function storeImage($file, $folder): string
    {
        $path = $file->store("images/{$folder}", 'public');
        return $path;
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:technicals,email',
            'phone' => 'required|string|max:20',
            'shift' => 'required|in:morning,afternoon,night',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('images/technicals', 'public');
        }

        // New technicals are NOT set as Tech Chief by default
        // Only super-admin can manually assign Tech Chief role
        $validated['is_default'] = false;

        $technical = Technical::create($validated);

        $user = User::updateOrCreate(
            ['email' => $technical->email],
            [
                'name' => $technical->name,
                'password' => Hash::make($technical->email),
            ]
        );

        if (!$user->hasRole('technical')) {
            $user->assignRole('technical');
        }

        return redirect()->route('technicals.index')->with('success', 'Technical created successfully');
    }

    public function update(Request $request, Technical $technical)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:technicals,email,' . $technical->id,
            'phone' => 'required|string|max:20',
            'shift' => 'required|in:morning,afternoon,night',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($technical->photo) {
                Storage::disk('public')->delete($technical->photo);
            }
            $validated['photo'] = $request->file('photo')->store('images/technicals', 'public');
        }

        $technical->update($validated);

        return redirect()->route('technicals.index')->with('success', 'Technical updated successfully');
    }

    public function destroy(Technical $technical)
    {
        if ($technical->photo) {
            Storage::disk('public')->delete($technical->photo);
        }

        $technical->delete();
        return redirect()->route('technicals.index')->with('success', 'Technical deleted successfully');
    }

    public function updateStatus(Request $request, Technical $technical)
    {
        $technical->update(['status' => !$technical->status]);
        return back()->with('success', 'Status updated');
    }

    public function setDefault(Request $request, Technical $technical)
    {
        // Verificar que el usuario tenga rol super-admin
        if (!Auth::user()->hasRole('super-admin')) {
            return back()->withErrors(['error' => 'Only super-admin can set default technical']);
        }

        // Toggle del estado is_default del técnico
        $newDefaultStatus = !$technical->is_default;
        $technical->update(['is_default' => $newDefaultStatus]);
        
        $message = $newDefaultStatus 
            ? 'Technical assigned as Tech Chief successfully' 
            : 'Technical removed from Tech Chief role successfully';
            
        return back()->with('success', $message);
    }

    public function sendInstruction(Request $request, Technical $technical)
    {
        // Verificar que el usuario sea super-admin o técnico default
        $isSuperAdmin = Auth::user()->hasRole('super-admin');
        $isDefaultTechnical = Auth::user()->hasRole('technical') && 
                              Technical::where('email', Auth::user()->email)->where('is_default', true)->exists();

        if (!$isSuperAdmin && !$isDefaultTechnical) {
            return back()->withErrors(['error' => 'Only super-admin or Tech Chief can send instructions']);
        }

        $validated = $request->validate([
            'instruction' => 'required|string|max:1000',
            'priority' => 'required|in:low,normal,high,urgent',
        ]);

        // Crear la notificación de instrucción
        $instruction = [
            'from' => Auth::user()->name,
            'instruction' => $validated['instruction'],
            'priority' => $validated['priority'],
            'sent_at' => now(),
            'read' => false,
        ];

        // Obtener las instrucciones actuales del técnico
        $currentInstructions = $technical->instructions ?? [];
        
        // Agregar la nueva instrucción al inicio del array
        array_unshift($currentInstructions, $instruction);
        
        // Mantener solo las últimas 20 instrucciones
        $currentInstructions = array_slice($currentInstructions, 0, 20);

        // Actualizar las instrucciones del técnico
        $technical->update(['instructions' => $currentInstructions]);

        $priorityMessage = [
            'low' => 'Low priority',
            'normal' => 'Normal priority',
            'high' => 'High priority',
            'urgent' => 'URGENT'
        ];

        return back()->with('success', "Instruction sent to {$technical->name} - {$priorityMessage[$validated['priority']]}");
    }
}
