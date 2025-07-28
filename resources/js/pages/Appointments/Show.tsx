import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, PlayCircle, RotateCcw, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AppointmentShowProps {
    appointment: {
        id: number;
        title: string;
        description?: string;
        address: string;
        scheduled_for: string;
        estimated_duration: number;
        status: string;
        notes?: string;
        member_instructions?: string;
        completion_notes?: string;
        started_at?: string;
        completed_at?: string;
        rating?: number;
        member_feedback?: {
            comment?: string;
        };
        ticket: {
            id: number;
            title: string;
            code: string;
            status: string;
            user: {
                name: string;
                email: string;
            };
        };
        technical: {
            id: number;
            name: string;
            email: string;
        };
        scheduledBy: {
            name: string;
            email: string;
        };
    };
}

const statusConfig = {
    scheduled: {
        label: 'Programada',
        color: 'bg-blue-100 text-blue-800',
        icon: Calendar
    },
    in_progress: {
        label: 'En Progreso',
        color: 'bg-yellow-100 text-yellow-800',
        icon: PlayCircle
    },
    completed: {
        label: 'Completada',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
    },
    cancelled: {
        label: 'Cancelada',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
    },
    rescheduled: {
        label: 'Reagendada',
        color: 'bg-gray-100 text-gray-800',
        icon: RotateCcw
    }
};

export default function AppointmentShow({ appointment }: AppointmentShowProps) {
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
        const IconComponent = config.icon;
        
        return (
            <Badge className={`${config.color} border-0`}>
                <IconComponent className="w-4 h-4 mr-2" />
                {config.label}
            </Badge>
        );
    };

    const renderRating = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${
                            star <= rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
                <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={[
            { title: "Calendar", href: "/appointments" },
            { title: `Cita #${appointment.id}`, href: "#" }
        ]}>
            <Head title={`Appointment #${appointment.id}`} />
            
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{appointment.title}</h1>
                        <p className="text-gray-600 mt-2">Cita ID #{appointment.id}</p>
                    </div>
                    {getStatusBadge(appointment.status)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Cita</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Fecha y Hora</p>
                                            <p className="font-medium">{formatDateTime(appointment.scheduled_for)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Duración Estimada</p>
                                            <p className="font-medium">{appointment.estimated_duration} minutos</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Dirección</p>
                                            <p className="font-medium">{appointment.address}</p>
                                        </div>
                                    </div>
                                </div>

                                {appointment.description && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600 mb-2">Descripción</p>
                                        <p className="text-gray-800">{appointment.description}</p>
                                    </div>
                                )}

                                {appointment.member_instructions && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 mb-2">Instrucciones para el Usuario</p>
                                        <p className="text-blue-700">{appointment.member_instructions}</p>
                                    </div>
                                )}

                                {appointment.notes && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-800 mb-2">Notas Internas</p>
                                        <p className="text-gray-700">{appointment.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cronología</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="font-medium">Cita Programada</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDateTime(appointment.scheduled_for)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Programada por {appointment.scheduledBy.name}
                                            </p>
                                        </div>
                                    </div>

                                    {appointment.started_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                            <div>
                                                <p className="font-medium">Visita Iniciada</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(appointment.started_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.completed_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                            <div>
                                                <p className="font-medium">Visita Completada</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(appointment.completed_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Completion Details */}
                        {appointment.status === 'completed' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalles de Finalización</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {appointment.completion_notes && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 mb-2">Notas de Finalización</p>
                                            <p className="text-gray-700 p-3 bg-green-50 rounded-lg">
                                                {appointment.completion_notes}
                                            </p>
                                        </div>
                                    )}

                                    {appointment.member_feedback?.comment && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 mb-2">Comentarios del Usuario</p>
                                            <p className="text-gray-700 p-3 bg-blue-50 rounded-lg">
                                                {appointment.member_feedback.comment}
                                            </p>
                                        </div>
                                    )}

                                    {appointment.rating && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 mb-2">Calificación del Servicio</p>
                                            {renderRating(appointment.rating)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Related Ticket */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Ticket Relacionado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Código</p>
                                        <p className="font-medium">#{appointment.ticket.code}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Título</p>
                                        <p className="font-medium">{appointment.ticket.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Estado</p>
                                        <Badge variant="outline" className="mt-1">
                                            {appointment.ticket.status}
                                        </Badge>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = `/tickets?ticket=${appointment.ticket.id}`}
                                        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Ver Ticket
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* People Involved */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Personas Involucradas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Técnico Asignado</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-medium">{appointment.technical.name}</p>
                                            <p className="text-xs text-gray-500">{appointment.technical.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Usuario</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-medium">{appointment.ticket.user.name}</p>
                                            <p className="text-xs text-gray-500">{appointment.ticket.user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Programada por</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="font-medium">{appointment.scheduledBy.name}</p>
                                            <p className="text-xs text-gray-500">{appointment.scheduledBy.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
