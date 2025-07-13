# NinjaOne Integration Documentation

## Overview

This document describes the complete integration between the ticketing system and NinjaOne IT management platform. The integration enables automatic device monitoring, alert processing, and seamless ticket creation from device issues.

## Architecture

### Database Structure

#### Devices Table Extensions
The `devices` table has been extended with NinjaOne-specific fields:
- `ninjaone_enabled`: Boolean flag to enable/disable NinjaOne integration for specific devices
- `ninjaone_device_id`: Unique device identifier in NinjaOne
- `ninjaone_node_id`: Node identifier in NinjaOne
- `ninjaone_organization_id`: Organization identifier in NinjaOne
- `ninjaone_last_sync`: Timestamp of last synchronization

#### NinjaOne Alerts Table
New `ninjaone_alerts` table stores all alerts received from NinjaOne:
- `ninjaone_alert_id`: Unique alert ID from NinjaOne
- `ninjaone_device_id`: Device ID from NinjaOne
- `device_id`: Local device ID (foreign key)
- `alert_type`: Type of alert (e.g., disk_space_low, cpu_high)
- `severity`: Alert severity (info, warning, critical)
- `title`: Alert title/summary
- `description`: Detailed alert description
- `status`: Alert status (open, acknowledged, resolved)
- `ninjaone_created_at`: Alert creation time in NinjaOne
- `acknowledged_at`: When alert was acknowledged
- `resolved_at`: When alert was resolved
- `ticket_id`: Generated ticket ID if converted to ticket
- `notification_sent`: Whether email notification was sent

### Backend Components

#### Models

**NinjaOneAlert Model** (`app/Models/NinjaOneAlert.php`)
- Manages alert data and relationships
- Provides helper methods for status management
- Handles relationships with devices and tickets

**Device Model Extensions**
- Added NinjaOne relationships and scope methods
- `ninjaoneAlerts()` relationship
- `ninjaoneEnabled()` scope

#### Controllers

**NinjaOneWebhookController** (`app/Http/Controllers/Api/NinjaOneWebhookController.php`)
- Handles incoming webhooks from NinjaOne
- Validates webhook signatures
- Processes alerts and creates database records
- Triggers notifications to device owners

**NinjaOneController** (`app/Http/Controllers/NinjaOneController.php`)
- Web interface for managing alerts
- Provides API endpoints for frontend
- Handles alert acknowledgment and resolution
- Creates tickets from alerts

#### Services

**NinjaOneService** (`app/Services/NinjaOneService.php`)
- Integrates with NinjaOne API
- Handles authentication and API requests
- Syncs device data between systems
- Manages organizations and devices

**NotificationService** (`app/Services/NotificationService.php`)
- Processes alert notifications
- Sends emails to device owners
- Manages notification preferences
- Handles escalation rules

#### Mail/Notifications

**NinjaOneAlertNotification**
- Email template for alert notifications
- Both Mail and Notification classes
- Includes alert details and action buttons
- Supports different severity styling

### Frontend Components

#### NinjaOneAlertCard Component
React component for displaying individual alerts:
- Shows alert severity with color coding
- Displays device information
- Provides action buttons (acknowledge, resolve, create ticket)
- Real-time status updates

#### Integration in Tickets Interface
- Alert toggle buttons for devices with NinjaOne enabled
- Expandable alert sections
- Loading states and empty states
- Badge showing alert count

### API Endpoints

#### Webhook Endpoint
```
POST /api/ninjaone/webhook
```
Receives alerts from NinjaOne with signature validation.

#### Management Endpoints
```
GET /ninjaone/alerts                           # List all alerts
GET /ninjaone/devices/{device}/alerts          # Get alerts for specific device
POST /ninjaone/alerts/{alert}/acknowledge      # Acknowledge an alert
POST /ninjaone/alerts/{alert}/resolve          # Resolve an alert
POST /ninjaone/devices/{device}/sync           # Sync device with NinjaOne
```

## Configuration

### Environment Variables
Add to `.env`:
```
NINJAONE_API_URL=https://api.ninjarmm.com
NINJAONE_CLIENT_ID=your_client_id
NINJAONE_CLIENT_SECRET=your_client_secret
NINJAONE_WEBHOOK_SECRET=your_webhook_secret
```

### NinjaOne Setup
1. Create API credentials in NinjaOne dashboard
2. Configure webhook endpoint: `https://your-domain.com/api/ninjaone/webhook`
3. Set webhook secret for signature validation
4. Configure alert types and thresholds

## Usage

### Enabling NinjaOne for Devices
1. Admin enables NinjaOne integration for specific devices
2. System syncs device data with NinjaOne
3. Sets up monitoring and alert rules

### Alert Processing Flow
1. NinjaOne detects device issue
2. Sends webhook to system
3. System validates webhook signature
4. Creates alert record in database
5. Sends email notification to device owner
6. Device owner can view alerts in interface
7. Owner can acknowledge, resolve, or create ticket

### Ticket Creation from Alerts
1. User clicks "Create Ticket" on alert
2. System pre-fills ticket with alert data
3. User can add additional details
4. Ticket is created and linked to alert
5. Alert status updated to show ticket connection

## Testing

### Sample Data
Use the `NinjaOneAlertSeeder` to create test alerts:
```bash
php artisan db:seed --class=NinjaOneAlertSeeder
```

### Webhook Testing
Test webhook endpoint with sample payload:
```bash
curl -X POST https://your-domain.com/api/ninjaone/webhook \
  -H "Content-Type: application/json" \
  -H "X-NinjaOne-Signature: sha256=signature" \
  -d '{"alert_id":"test","device_id":"test_device",...}'
```

## Monitoring and Maintenance

### Alert Cleanup
Implement automated cleanup for resolved alerts older than 30 days:
```php
// In scheduled task
NinjaOneAlert::where('status', 'resolved')
    ->where('resolved_at', '<', now()->subDays(30))
    ->delete();
```

### Sync Monitoring
Monitor device sync status and handle failures:
- Check `ninjaone_last_sync` timestamps
- Retry failed syncs
- Alert administrators of persistent failures

### Performance Optimization
- Index on `(device_id, status)` for fast alert queries
- Cache device alert counts
- Paginate alert lists for large datasets

## Security Considerations

### Webhook Security
- Always validate webhook signatures
- Use HTTPS for all communications
- Rotate webhook secrets regularly

### API Security
- Secure API credentials in environment variables
- Use least-privilege access in NinjaOne
- Monitor API usage and rate limits

### Data Privacy
- Anonymize alert data if required
- Implement data retention policies
- Secure sensitive device information

## Troubleshooting

### Common Issues

**Webhook Not Receiving Alerts**
- Check webhook URL configuration in NinjaOne
- Verify signature validation
- Check server logs for errors

**Alerts Not Showing in Interface**
- Verify device has `ninjaone_enabled = true`
- Check alert status filters
- Ensure frontend polling is working

**Email Notifications Not Sent**
- Check mail configuration
- Verify device owner email addresses
- Check notification service logs

**Device Sync Failures**
- Verify API credentials
- Check NinjaOne API status
- Review device mapping configuration

## Future Enhancements

### Planned Features
- Real-time alert updates via WebSockets
- Advanced alert filtering and search
- Custom alert escalation rules
- Integration with mobile app notifications
- Automated ticket creation based on alert patterns
- Device health dashboards
- Alert analytics and reporting

### API Extensions
- Bulk alert operations
- Custom alert categories
- Integration with other monitoring tools
- Advanced device synchronization options
