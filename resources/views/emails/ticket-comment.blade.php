<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Comentario en Ticket</title>
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
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%);
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
        .comment-info {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .comment-info h3 {
            margin-top: 0;
            color: #ff8f00;
            font-size: 18px;
        }
        .comment-content {
            background-color: #ffffff;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
        }
        .ticket-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #6c757d;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%);
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
        .commenter-info {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        .commenter-info h4 {
            margin-top: 0;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nuevo Comentario</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Se ha agregado un comentario al ticket</p>
        </div>
        
        <div class="content">
            <p>Hola <strong>{{ $user->first_name }}</strong>,</p>
            
            <p>Se ha agregado un nuevo comentario al ticket #{{ $ticket->id }}. Revisa los detalles a continuación:</p>
            
            <div class="commenter-info">
                <h4>Información del Comentario</h4>
                <p><strong>Comentado por:</strong> {{ $comment->user->first_name }} {{ $comment->user->last_name }}</p>
                <p><strong>Rol:</strong> {{ ucfirst($comment->user->role) }}</p>
                <p><strong>Fecha:</strong> {{ $comment->created_at->format('d/m/Y H:i') }}</p>
            </div>
            
            <div class="comment-info">
                <h3>Comentario</h3>
                <div class="comment-content">
                    "{{ $comment->comment }}"
                </div>
            </div>
            
            <div class="ticket-info">
                <h3 style="margin-top: 0; color: #495057;">Información del Ticket</h3>
                
                <div class="info-row">
                    <span class="info-label">Ticket ID:</span>
                    <span class="info-value"><strong>#{{ $ticket->id }}</strong></span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Título:</span>
                    <span class="info-value">{{ $ticket->title }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Estado Actual:</span>
                    <span class="info-value">{{ $ticket->status }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Prioridad:</span>
                    <span class="info-value">{{ ucfirst($ticket->priority) }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">{{ $ticket->category }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Edificio:</span>
                    <span class="info-value">{{ $ticket->building->name ?? 'No especificado' }}</span>
                </div>
                
                @if($ticket->assigned_to)
                <div class="info-row">
                    <span class="info-label">Asignado a:</span>
                    <span class="info-value">{{ $ticket->assignedTo->first_name }} {{ $ticket->assignedTo->last_name }}</span>
                </div>
                @endif
            </div>
            
            <div style="text-align: center;">
                <a href="{{ route('tickets.show', $ticket->id) }}" class="btn">
                    Ver Ticket y Responder
                </a>
            </div>
            
            @if($comment->user->id !== $user->id)
            <div style="background-color: #e8f5e8; border: 1px solid #28a745; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #155724; font-size: 14px;">
                    <strong>Sugerencia:</strong> Considera responder al comentario para mantener una comunicación fluida 
                    y asegurar que el ticket se resuelva de manera eficiente.
                </p>
            </div>
            @endif
            
            <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                <strong>Historial de comentarios:</strong><br>
                Puedes ver todos los comentarios y el historial completo del ticket accediendo al enlace anterior.
            </p>
        </div>
        
        <div class="footer">
            <p>
                Este es un mensaje automático del Sistema de Gestión de Tickets.<br>
                Por favor, no responder directamente a este correo.
            </p>
            <p style="margin-top: 15px;">
                <strong>{{ config('app.name') }}</strong> | 
                <a href="{{ config('app.url') }}" style="color: #ffc107;">Acceder al Sistema</a>
            </p>
        </div>
    </div>
</body>
</html>
