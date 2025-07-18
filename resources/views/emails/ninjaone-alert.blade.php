<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Device Alert Notification</title>
    <style>
        .email-container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .alert-card {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        .alert-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        .severity-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-right: 12px;
        }
        .severity-critical { background-color: #fef2f2; color: #dc2626; }
        .severity-high { background-color: #fef3c7; color: #d97706; }
        .severity-medium { background-color: #fff7ed; color: #ea580c; }
        .severity-low { background-color: #f0f9ff; color: #0369a1; }
        .device-info {
            background-color: #f8fafc;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 16px 0;
        }
        .btn:hover {
            background-color: #2563eb;
        }
        .alert-details {
            margin: 16px 0;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="alert-card">
            <div class="alert-header">
                <span class="severity-badge severity-{{ $alert->severity }}">
                    {{ ucfirst($alert->severity) }}
                </span>
                <h2 style="margin: 0; color: #1f2937;">Device Alert</h2>
            </div>

            <h3 style="color: #374151; margin-bottom: 8px;">{{ $alert->title }}</h3>
            
            @if($device)
            <div class="device-info">
                <h4 style="margin: 0 0 8px 0; color: #4b5563;">Device Information</h4>
                <p style="margin: 4px 0;"><strong>Name:</strong> {{ $device->name }}</p>
                @if($device->brand)
                <p style="margin: 4px 0;"><strong>Brand:</strong> {{ $device->brand->name }}</p>
                @endif
                @if($device->ubicacion)
                <p style="margin: 4px 0;"><strong>Location:</strong> {{ $device->ubicacion }}</p>
                @endif
                <p style="margin: 4px 0;"><strong>NinjaOne ID:</strong> {{ $alert->ninjaone_device_id }}</p>
            </div>
            @endif

            <div class="alert-details">
                <h4 style="color: #4b5563; margin-bottom: 8px;">Alert Details</h4>
                <p style="color: #6b7280; line-height: 1.5;">{{ $alert->description }}</p>
                
                <p style="margin: 8px 0;"><strong>Alert Type:</strong> {{ $alert->alert_type }}</p>
                <p style="margin: 8px 0;"><strong>Detected:</strong> {{ $alert->ninjaone_created_at->format('M j, Y \a\t g:i A') }}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{{ $createTicketUrl }}" class="btn">Create Support Ticket</a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; color: #6b7280; font-size: 14px;">
                <p><strong>What should you do?</strong></p>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>Click the button above to create a support ticket</li>
                    <li>Provide additional details about any issues you've noticed</li>
                    <li>A technician will be assigned to help resolve the issue</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>This alert was automatically generated by NinjaOne monitoring.</p>
            <p>If you no longer wish to receive these notifications, please contact your administrator.</p>
        </div>
    </div>
</body>
</html>
