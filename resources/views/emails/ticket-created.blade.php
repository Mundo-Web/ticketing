<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Ticket Creado</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .ticket-info {
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .ticket-info h3 {
            margin-top: 0;
            color: #007bff;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #6c757d;
        }
        .priority-high {
            color: #dc3545;
            font-weight: 600;
        }
        .priority-medium {
            color: #fd7e14;
            font-weight: 600;
        }
        .priority-low {
            color: #28a745;
            font-weight: 600;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-assigned {
            background-color: #d4edda;
            color: #155724;
        }
        .status-in-progress {
            background-color: #cce7ff;
            color: #004085;
        }
        .status-completed {
            background-color: #d1ecf1;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 Nuevo Ticket Creado</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestión de Tickets</p>
        </div>
        
        <div class="content">
            <p>Hola <strong>{{ $user->first_name }}</strong>,</p>
            
            <p>Se ha creado un nuevo ticket en el sistema que requiere tu atención.</p>
            
            <div class="ticket-info">
                <h3>Detalles del Ticket</h3>
                
                <div class="info-row">
                    <span class="info-label">Ticket ID:</span>
                    <span class="info-value"><strong>#{{ $ticket->id }}</strong></span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Título:</span>
                    <span class="info-value">{{ $ticket->title }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Descripción:</span>
                    <span class="info-value">{{ Str::limit($ticket->description, 100) }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                        <span class="status-badge status-{{ strtolower(str_replace(' ', '-', $ticket->status)) }}">
                            {{ $ticket->status }}
                        </span>
                    </span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Prioridad:</span>
                    <span class="info-value priority-{{ strtolower($ticket->priority) }}">
                        {{ ucfirst($ticket->priority) }}
                    </span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">{{ $ticket->category }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Edificio:</span>
                    <span class="info-value">{{ $ticket->building->name ?? 'No especificado' }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Apartamento:</span>
                    <span class="info-value">{{ $ticket->apartment_number ?? 'No especificado' }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Creado por:</span>
                    <span class="info-value">{{ $ticket->user->first_name }} {{ $ticket->user->last_name }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Fecha de creación:</span>
                    <span class="info-value">{{ $ticket->created_at->format('d/m/Y H:i') }}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ route('tickets.show', $ticket->id) }}" class="btn">
                    Ver Ticket Completo
                </a>
            </div>
            
            <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Próximos pasos:</strong><br>
                • Revisa los detalles del ticket<br>
                • Asigna un técnico si es necesario<br>
                • Actualiza el estado según corresponda<br>
                • Comunícate con el solicitante si necesitas más información
            </p>
        </div>
        
        <div class="footer">
            <p>
                Este es un mensaje automático del Sistema de Gestión de Tickets.<br>
                Por favor, no responder directamente a este correo.
            </p>
            <p style="margin-top: 15px;">
                <strong>{{ config('app.name') }}</strong> | 
                <a href="{{ config('app.url') }}" style="color: #007bff;">Acceder al Sistema</a>
            </p>
        </div>
    </div>
</body>
</html>
