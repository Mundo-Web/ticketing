<?php

namespace App\Http\Controllers;

use App\Models\NinjaOneAlert;
use App\Models\Device;
use App\Services\NinjaOneService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class NinjaOneController extends Controller
{
    use AuthorizesRequests;
    protected $ninjaOneService;
    protected $notificationService;

    public function __construct(NinjaOneService $ninjaOneService, NotificationService $notificationService)
    {
        $this->ninjaOneService = $ninjaOneService;
        $this->notificationService = $notificationService;
    }

    /**
     * Show form to create ticket from NinjaOne alert
     */
    public function createTicketFromAlert(NinjaOneAlert $alert)
    {
        // Simple authorization check - ensure user has access to the device
        $user = Auth::user();
        
        // Check if ticket already exists for this alert
        if ($alert->ticket_id) {
            return redirect()->route('tickets.show', $alert->ticket_id)
                ->with('info', 'A ticket already exists for this alert.');
        }

        // Pre-populate ticket data from alert
        $ticketData = [
            'device_id' => $alert->device_id,
            'title' => "NinjaOne Alert: {$alert->title}",
            'description' => $this->buildTicketDescription($alert),
            'category' => $this->ninjaOneService->mapAlertTypeToCategory($alert->alert_type),
            'ninjaone_alert_id' => $alert->id,
        ];

        return Inertia::render('Tickets/CreateFromAlert', [
            'alert' => $alert->load('device'),
            'ticketData' => $ticketData,
            'categories' => $this->getTicketCategories(),
        ]);
    }

    /**
     * Create ticket from NinjaOne alert
     */
    public function storeTicketFromAlert(Request $request, NinjaOneAlert $alert)
    {
        // Check if ticket already exists
        if ($alert->ticket_id) {
            return redirect()->route('tickets.show', $alert->ticket_id)
                ->with('info', 'A ticket already exists for this alert.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
        ]);

        $ticket = $this->notificationService->createTicketFromAlert($alert, Auth::user());

        if ($ticket) {
            // Update ticket with user input
            $ticket->update([
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
            ]);

            return redirect()->route('tickets.show', $ticket->id)
                ->with('success', 'Ticket created successfully from NinjaOne alert.');
        }

        return back()->with('error', 'Failed to create ticket from alert.');
    }

    /**
     * Show NinjaOne alerts for user's devices
     */
    public function alerts(Request $request): Response
    {
        $user = Auth::user();
        
        // Get user's devices with NinjaOne integration
        $deviceIds = $user->tenant->devices()
            ->where('ninjaone_enabled', true)
            ->pluck('id');

        $alerts = NinjaOneAlert::whereIn('device_id', $deviceIds)
            ->with('device')
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->severity, function ($query, $severity) {
                return $query->where('severity', $severity);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('NinjaOne/Alerts', [
            'alerts' => $alerts,
            'filters' => $request->only(['status', 'severity']),
            'stats' => [
                'total' => NinjaOneAlert::whereIn('device_id', $deviceIds)->count(),
                'open' => NinjaOneAlert::whereIn('device_id', $deviceIds)->where('status', 'open')->count(),
                'critical' => NinjaOneAlert::whereIn('device_id', $deviceIds)->where('severity', 'critical')->count(),
            ]
        ]);
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledgeAlert(NinjaOneAlert $alert)
    {
        $alert->acknowledge();

        return response()->json(['message' => 'Alert acknowledged successfully']);
    }

    /**
     * Resolve an alert
     */
    public function resolveAlert(NinjaOneAlert $alert)
    {
        $alert->resolve();

        return response()->json(['message' => 'Alert resolved successfully']);
    }

    /**
     * Sync device with NinjaOne
     */
    public function syncDevice(Device $device)
    {
        if (!$device->ninjaone_enabled) {
            return response()->json(['error' => 'NinjaOne integration not enabled for this device'], 400);
        }

        $success = $this->ninjaOneService->syncDevice($device);

        if ($success) {
            return response()->json(['message' => 'Device synced successfully']);
        }

        return response()->json(['error' => 'Failed to sync device'], 500);
    }

    /**
     * Get device alerts from NinjaOne API
     */
    public function getDeviceAlerts(Device $device)
    {
        if (!$device->ninjaone_enabled || !$device->ninjaone_device_id) {
            return response()->json(['error' => 'NinjaOne integration not configured'], 400);
        }

        $alerts = $this->ninjaOneService->getDeviceAlerts($device->ninjaone_device_id);

        return response()->json(['alerts' => $alerts]);
    }

    /**
     * Build ticket description from alert
     */
    protected function buildTicketDescription(NinjaOneAlert $alert): string
    {
        $description = "**Issue detected by NinjaOne monitoring:**\n\n";
        $description .= "**Alert:** {$alert->title}\n";
        $description .= "**Severity:** " . ucfirst($alert->severity) . "\n";
        $description .= "**Type:** {$alert->alert_type}\n";
        $description .= "**Detected:** {$alert->ninjaone_created_at->format('M j, Y \a\t g:i A')}\n\n";
        $description .= "**Description:**\n{$alert->description}\n\n";
        $description .= "**Additional details about the issue:**\n";
        $description .= "(Please describe any symptoms or problems you've noticed with this device)";

        return $description;
    }

    /**
     * Get available ticket categories
     */
    protected function getTicketCategories(): array
    {
        return [
            'Hardware',
            'Software', 
            'Network',
            'Security',
            'Performance',
            'General'
        ];
    }
}
