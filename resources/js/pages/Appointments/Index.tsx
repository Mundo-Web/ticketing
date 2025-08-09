import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, PlayCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'sonner';

// Configure moment localizer
const localizer = momentLocalizer(moment);

// Custom styles for the calendar
const calendarStyle = `
.rbc-calendar {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.rbc-header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 12px 8px;
    font-weight: 600;
    color: #374151;
    text-align: center;
}
.rbc-event {
    border-radius: 6px;
    border: none !important;
    color: white !important;
    font-size: 11px;
    padding: 0 !important;
    min-height: 50px !important;
    height: auto !important;
    overflow: hidden !important;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    display: flex !important;
    flex-direction: column !important;
}
.rbc-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.rbc-today {
    background-color: #fef3c7;
}
.rbc-current-time-indicator {
    background-color: #ef4444;
    height: 2px;
    z-index: 1;
}
.rbc-time-slot {
    border-top: 1px solid #f1f5f9;
    min-height: 24px;
}
.rbc-timeslot-group {
    border-bottom: 1px solid #e2e8f0;
    min-height: 48px;
}
.rbc-day-slot .rbc-event {
    border: 1px solid rgba(255,255,255,0.3);
    margin: 2px 1px;
}
.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
}
.rbc-agenda-view .rbc-agenda-content {
    padding: 12px;
}
.rbc-agenda-view .rbc-event {
    min-height: auto;
    padding: 12px;
}
.rbc-day-view .rbc-event, .rbc-week-view .rbc-event {
    min-height: 50px !important;
    height: auto !important;
}
.rbc-event-content {
    overflow: hidden !important;
    white-space: normal !important;
    line-height: 1.3;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
    padding: 0 !important;
}
.rbc-time-view {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
.rbc-time-header {
    border-bottom: 1px solid #e2e8f0;
}
.rbc-time-content {
    border-top: none;
}
.rbc-month-view {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}
.rbc-month-row {
    border-bottom: 1px solid #f1f5f9;
}
.rbc-date-cell {
    padding: 8px;
}
.rbc-off-range-bg {
    background-color: #fafafa;
}
`;

interface Appointment {
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
    ticket: {
        id: number;
        title: string;
        code: string;
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
}

interface AppointmentsProps {
    appointments: Appointment[];
    calendarEvents: any[];
    technicals: any[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
    isTechnicalDefault?: boolean;
}

const statusConfig = {
    scheduled: {
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
        bgColor: '#3B82F6',
        icon: CalendarIcon
    },
    in_progress: {
        label: 'In Progress',
        color: 'bg-yellow-100 text-yellow-800',
        bgColor: '#F59E0B',
        icon: PlayCircle
    },
    completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
        bgColor: '#10B981',
        icon: CheckCircle
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800',
        bgColor: '#EF4444',
        icon: XCircle
    },
    rescheduled: {
        label: 'Rescheduled',
        color: 'bg-gray-100 text-gray-800',
        bgColor: '#6B7280',
        icon: RotateCcw
    },
    no_show: {
        label: 'No Show',
        color: 'bg-orange-100 text-orange-800',
        bgColor: '#F97316',
        icon: User
    }
};

export default function AppointmentsIndex({ appointments, technicals, auth, isTechnicalDefault }: AppointmentsProps) {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [calendarView, setCalendarView] = useState<any>(Views.DAY); // Vista por defecto: Día
    const [calendarDate, setCalendarDate] = useState(new Date()); // Usar fecha actual del cliente
    const [notifications, setNotifications] = useState<string[]>([]);
    const [selectedAppointmentLoading, setSelectedAppointmentLoading] = useState(false);
    
    // Estados del modal de detalles de cita - igual que en el index de Tickets
    const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState<{ open: boolean; appointment?: any }>({ open: false });

    // Usar la misma lógica de detección de roles que en el index de Tickets
    const { props } = usePage<any>();
    const isTechnical = (auth.user as any)?.roles?.includes("technical");
    const isSuperAdmin = (auth.user as any)?.roles?.includes("super-admin");
    // isTechnicalDefault ahora viene del backend correctamente

    // Refresca la cita seleccionada desde el backend
    const refreshSelectedAppointment = async (appointmentId?: number) => {
        if (!appointmentId) return;
        setSelectedAppointmentLoading(true);
        try {
            const response = await fetch(`/appointments/${appointmentId}`);
            const updatedAppointment = await response.json();
            setSelectedAppointment(updatedAppointment);
        } catch (e) {
            console.error('Error refreshing appointment:', e);
        } finally {
            setSelectedAppointmentLoading(false);
        }
    };

    // El backend ya está haciendo el filtrado correcto basándose en roles
    // No necesitamos filtrar en el frontend, solo usar lo que envía el backend
    const filteredAppointments = appointments;

    // Verificar notificaciones de citas próximas (30 minutos)
    useEffect(() => {
        const checkUpcomingAppointments = () => {
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
            
            filteredAppointments.forEach(appointment => {
                if (appointment.status === 'scheduled') {
                    const appointmentTime = new Date(appointment.scheduled_for);
                    if (appointmentTime <= thirtyMinutesFromNow && appointmentTime > now) {
                        const timeLeft = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
                        const message = `You have an appointment in ${timeLeft} minutes: ${appointment.title}`;
                        
                        setNotifications(prev => {
                            if (!prev.includes(message)) {
                                return [...prev, message];
                            }
                            return prev;
                        });
                    }
                }
            });
        };

        checkUpcomingAppointments();
        const interval = setInterval(checkUpcomingAppointments, 60000); // Verificar cada minuto
        
        return () => clearInterval(interval);
    }, [filteredAppointments]);

    // Define getStatusConfig first
    const getStatusConfig = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    };

    // Convert appointments to calendar events
    const calendarEvents = useMemo(() => {
        const events = filteredAppointments.map(appointment => {
            const start = new Date(appointment.scheduled_for);
            const end = new Date(start.getTime() + appointment.estimated_duration * 60000); // Add duration in minutes

            return {
                id: appointment.id,
                title: `${appointment.ticket.user.name} - ${appointment.title}`,
                start,
                end,
                resource: appointment,
                allDay: false
            };
        });
        
        return events;
    }, [filteredAppointments]);

    const handleSelectEvent = (event: any) => {
        setShowAppointmentDetailsModal({ open: true, appointment: event.resource });
    };

    const handleSelectSlot = (slotInfo: any) => {
        // You can add functionality to create new appointments here
        console.log('Selected slot:', slotInfo);
    };

    // Funciones de navegación del calendario
    const navigateCalendar = (direction: 'prev' | 'next' | 'today') => {
        let newDate = new Date(calendarDate);
        
        switch (direction) {
            case 'prev':
                if (calendarView === Views.DAY) {
                    newDate.setDate(newDate.getDate() - 1);
                } else if (calendarView === Views.WEEK) {
                    newDate.setDate(newDate.getDate() - 7);
                } else if (calendarView === Views.MONTH) {
                    newDate.setMonth(newDate.getMonth() - 1);
                }
                break;
            case 'next':
                if (calendarView === Views.DAY) {
                    newDate.setDate(newDate.getDate() + 1);
                } else if (calendarView === Views.WEEK) {
                    newDate.setDate(newDate.getDate() + 7);
                } else if (calendarView === Views.MONTH) {
                    newDate.setMonth(newDate.getMonth() + 1);
                }
                break;
            case 'today':
                newDate = new Date();
                break;
        }
        
        setCalendarDate(newDate);
    };

    // Formatear título de fecha según la vista
    const getCalendarTitle = () => {
        const date = moment(calendarDate);
        
        switch (calendarView) {
            case Views.DAY:
                return date.format('dddd, MMMM Do YYYY');
            case Views.WEEK: {
                const weekStart = date.clone().startOf('week');
                const weekEnd = date.clone().endOf('week');
                return `${weekStart.format('MMM Do')} - ${weekEnd.format('MMM Do, YYYY')}`;
            }
            case Views.MONTH:
                return date.format('MMMM YYYY');
            case Views.AGENDA:
                return 'Agenda View';
            default:
                return date.format('MMMM YYYY');
        }
    };

    // Función para manejar acciones de citas - igual que en el index de Tickets
    const handleAppointmentAction = async (action: string, appointmentId: number, formData?: any) => {
        try {
            // Map action to the correct route
            const routeAction = action === 'member_feedback' ? 'member-feedback' : action;

            // Using Inertia router for better CSRF handling
            router.post(`/appointments/${appointmentId}/${routeAction}`, formData || {}, {
                preserveScroll: true,
                onSuccess: (page) => {
                    const data = (page.props as any).flash || {};

                    // Show success notification with specific messages
                    const successMessages = {
                        'start': 'Visit started successfully!',
                        'complete': 'Visit completed successfully! Waiting for member feedback.',
                        'member_feedback': 'Thank you for your feedback!',
                        'cancel': 'Appointment cancelled successfully!',
                        'reschedule': 'Appointment rescheduled successfully!',
                        'no-show': 'Appointment marked as No Show successfully!'
                    };

                    const message = data.success || data.message || successMessages[action] || `${action} completed successfully`;
                    toast.success(message);

                    // Refresh selected appointment
                    if (selectedAppointment) {
                        refreshSelectedAppointment(selectedAppointment.id);
                    }
                },
                onError: (errors) => {
                    console.error(`Error ${action} appointment:`, errors);

                    if (typeof errors === 'object' && errors !== null) {
                        const errorMessages = Object.values(errors).flat();
                        errorMessages.forEach(message => {
                            if (typeof message === 'string') {
                                toast.error(message);
                            }
                        });
                    } else {
                        toast.error(`Error processing ${action} action`);
                    }
                }
            });
        } catch (error) {
            console.error(`Error ${action} appointment:`, error);
            toast.error(`Error processing ${action} action`);
        }
    };

    const eventStyleGetter = (event: any) => {
        // Since we're using a custom component, we just need minimal styling here
        return {
            style: {
                border: 'none',
                borderRadius: '8px',
                padding: '0',
                backgroundColor: 'transparent', // Let the custom component handle the background
                overflow: 'visible'
            }
        };
    };

    const CustomEvent = ({ event }: { event: any }) => {
        const appointment = event.resource;
        const statusConf = getStatusConfig(appointment.status);
        const IconComponent = statusConf.icon;

        // Define the same gradients here to ensure consistency
        const gradients = {
            scheduled: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            in_progress: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            completed: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            cancelled: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            rescheduled: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
            no_show: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
        };

        return (
            <div 
                className="w-full h-full text-white text-xs p-1.5 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 relative"
                style={{ 
                    minHeight: '100%',
                    height: '100%',
                    borderRadius: '6px',
                    background: gradients[appointment.status as keyof typeof gradients] || gradients.scheduled,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start'
                }}
                title={`${appointment.ticket.user.name} - ${appointment.title} at ${formatTime(appointment.scheduled_for)}`}
            >
                {/* Header con hora e icono */}
                <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
                    <IconComponent className="w-3 h-3 flex-shrink-0 opacity-90" />
                    <span className="font-bold text-xs leading-none">
                        {formatTime(appointment.scheduled_for)}
                    </span>
                </div>
                
                {/* Nombre del cliente */}
                <div className="font-semibold text-xs leading-tight mb-1 flex-shrink-0">
                    {appointment.ticket.user.name}
                </div>
                
                {/* Título de la cita */}
                <div className="text-xs opacity-95 leading-tight flex-1 overflow-hidden">
                    {appointment.title}
                </div>
                
                {/* Status indicator dot */}
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white opacity-75 rounded-full"></div>
            </div>
        );
    };

    // Get upcoming appointments (next 7 days) - usando filteredAppointments
    const upcomingAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_for);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return appointmentDate >= today && appointmentDate <= nextWeek && appointment.status === 'scheduled';
    }).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const config = getStatusConfig(status);
        const IconComponent = config.icon;
        
        return (
            <Badge className={`${config.color} border-0`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: "Calendar", href: "/appointments" }]}>
            <Head title="Appointments Calendar" />
            
            {/* Custom styles */}
            <style dangerouslySetInnerHTML={{ __html: calendarStyle }} />
            
            <div className="flex flex-col gap-6 p-6">
                {/* Notificaciones */}
                {notifications.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CalendarIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-yellow-800 mb-2">Upcoming Appointments</h3>
                                <div className="space-y-1">
                                    {notifications.map((notification, index) => (
                                        <p key={index} className="text-sm text-yellow-700">{notification}</p>
                                    ))}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNotifications([])}
                                className="text-yellow-600 hover:text-yellow-800"
                            >
                                ×
                            </Button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isTechnical || isTechnicalDefault 
                                ? 'My Appointments' 
                                : 'All Appointments Calendar'
                            }
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {isTechnical || isTechnicalDefault 
                                ? `Manage your scheduled on-site appointments - User: ${auth.user.name}` 
                                : 'Manage all scheduled on-site appointments'
                            }
                        </p>
                    </div>
                    
                    {/* Status Legend */}
                    <div className="flex gap-4 text-sm">
                        {Object.entries(statusConfig).map(([status, config]) => {
                            const IconComponent = config.icon;
                            return (
                                <div key={status} className="flex items-center gap-2">
                                    <div 
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: config.bgColor }}
                                    />
                                    <IconComponent className="w-4 h-4" />
                                    <span>{config.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Calendar Area */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5" />
                                       
                                    </span>
                                    
                                    {/* Navigation Controls */}
                                    <div className="flex items-center gap-4">
                                        {/* Date Navigation */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateCalendar('prev')}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateCalendar('today')}
                                                className="min-w-[80px]"
                                            >
                                                Today
                                            </Button>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigateCalendar('next')}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        {/* Current Date/Range Display */}
                                        <div className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
                                            {getCalendarTitle()}
                                        </div>
                                        
                                        {/* View Toggle Buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant={calendarView === Views.DAY ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCalendarView(Views.DAY)}
                                            >
                                                Day
                                            </Button>
                                            <Button
                                                variant={calendarView === Views.WEEK ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCalendarView(Views.WEEK)}
                                            >
                                                Week
                                            </Button>
                                            <Button
                                                variant={calendarView === Views.MONTH ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCalendarView(Views.MONTH)}
                                            >
                                                Month
                                            </Button>
                                            <Button
                                                variant={calendarView === Views.AGENDA ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCalendarView(Views.AGENDA)}
                                            >
                                                Agenda
                                            </Button>
                                        </div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[600px]">
                                    <Calendar
                                        localizer={localizer}
                                        events={calendarEvents}
                                        startAccessor="start"
                                        endAccessor="end"
                                        view={calendarView}
                                        onView={setCalendarView}
                                        date={calendarDate}
                                        onNavigate={setCalendarDate}
                                        onSelectEvent={handleSelectEvent}
                                        onSelectSlot={handleSelectSlot}
                                        selectable
                                        eventPropGetter={eventStyleGetter}
                                        components={{
                                            event: CustomEvent,
                                            toolbar: () => null // Deshabilitar la toolbar por defecto para evitar duplicación
                                        }}
                                        style={{ height: '100%' }}
                                        formats={{
                                            timeGutterFormat: 'HH:mm',
                                            eventTimeRangeFormat: ({ start, end }) => {
                                                return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
                                            }
                                        }}
                                        min={new Date(2025, 0, 1, 6, 0, 0)} // 6:00 AM
                                        max={new Date(2025, 0, 1, 22, 0, 0)} // 10:00 PM
                                        step={15} // 15 minute steps
                                        timeslots={4} // 4 slots per hour (15 min each)
                                        showMultiDayTimes={true}
                                        popup={true}
                                        popupOffset={30}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Upcoming Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingAppointments.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No upcoming appointments</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingAppointments.slice(0, 5).map((appointment) => (
                                            <div 
                                                key={appointment.id} 
                                                className="border-l-4 border-blue-500 pl-3 py-2 cursor-pointer hover:bg-gray-50 rounded-r"
                                                onClick={() => {
                                                    setShowAppointmentDetailsModal({ open: true, appointment });
                                                }}
                                            >
                                                <p className="font-medium text-sm">{appointment.title}</p>
                                                <p className="text-xs text-gray-600">
                                                    {formatDate(appointment.scheduled_for)} - {formatTime(appointment.scheduled_for)}
                                                </p>
                                                <p className="text-xs text-gray-500">{appointment.technical.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Appointments:</span>
                                        <span className="font-medium">{filteredAppointments.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Scheduled:</span>
                                        <span className="font-medium text-blue-600">
                                            {filteredAppointments.filter(a => a.status === 'scheduled').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">In Progress:</span>
                                        <span className="font-medium text-yellow-600">
                                            {filteredAppointments.filter(a => a.status === 'in_progress').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Completed:</span>
                                        <span className="font-medium text-green-600">
                                            {filteredAppointments.filter(a => a.status === 'completed').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">No Show:</span>
                                        <span className="font-medium text-orange-600">
                                            {filteredAppointments.filter(a => a.status === 'no_show').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Cancelled:</span>
                                        <span className="font-medium text-red-600">
                                            {filteredAppointments.filter(a => a.status === 'cancelled').length}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Technicians */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Available Technicians</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {technicals.map((technical: any) => (
                                        <div key={technical.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">{technical.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {technical.shift || 'Available'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Appointment Details Modal - igual que en el index de Tickets */}
                <Dialog
                    open={showAppointmentDetailsModal.open}
                    onOpenChange={(open) => setShowAppointmentDetailsModal({ open, appointment: showAppointmentDetailsModal.appointment })}
                >
                    <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                        <DialogHeader className="pb-6 border-b border-slate-200">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                    <CalendarIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div>Appointment Details</div>
                                    <div className="text-sm font-normal text-slate-600 mt-1">
                                        Manage and track appointment progress
                                    </div>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            {showAppointmentDetailsModal.appointment && (
                                <div className="space-y-8">
                                    {/* Main Appointment Info Card */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                                    {showAppointmentDetailsModal.appointment.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(showAppointmentDetailsModal.appointment.status)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-600">Scheduled Date & Time</div>
                                                        <div className="text-base font-semibold text-slate-900">
                                                            {formatDate(showAppointmentDetailsModal.appointment.scheduled_for)}
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            {formatTime(showAppointmentDetailsModal.appointment.scheduled_for)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <MapPin className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-600">Location</div>
                                                        <div className="text-base font-semibold text-slate-900">
                                                            {showAppointmentDetailsModal.appointment.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <User className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-600">Assigned Technician</div>
                                                        <div className="text-base font-semibold text-slate-900">
                                                            {showAppointmentDetailsModal.appointment.technical?.name || 'Not assigned'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <CalendarIcon className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-600">Related Ticket</div>
                                                        <div className="text-base font-semibold text-slate-900">
                                                            #{showAppointmentDetailsModal.appointment.ticket?.code || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {showAppointmentDetailsModal.appointment.description && (
                                            <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100">
                                                <h4 className="text-sm font-medium text-slate-600 mb-2">Description</h4>
                                                <p className="text-slate-900">{showAppointmentDetailsModal.appointment.description}</p>
                                            </div>
                                        )}

                                        {/* Member Instructions */}
                                        {showAppointmentDetailsModal.appointment.member_instructions && (
                                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                <h4 className="text-sm font-medium text-blue-600 mb-2">Instructions</h4>
                                                <p className="text-blue-700">{showAppointmentDetailsModal.appointment.member_instructions}</p>
                                            </div>
                                        )}

                                        {/* Completion Notes */}
                                        {showAppointmentDetailsModal.appointment.completion_notes && (
                                            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                                <h4 className="text-sm font-medium text-green-600 mb-2">Completion Notes</h4>
                                                <p className="text-green-700">{showAppointmentDetailsModal.appointment.completion_notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons for Technicians */}
                                    {(isTechnical || isTechnicalDefault || isSuperAdmin) && showAppointmentDetailsModal.appointment.status === 'scheduled' && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <PlayCircle className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-blue-900">Visit Actions</h3>
                                                    <p className="text-sm text-blue-700">Start your visit or mark as no show</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <Button
                                                    onClick={() => {
                                                        handleAppointmentAction('start', showAppointmentDetailsModal.appointment.id);
                                                        setShowAppointmentDetailsModal({ open: false });
                                                    }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold"
                                                >
                                                    <PlayCircle className="w-5 h-5 mr-2" />
                                                    Start Visit
                                                </Button>
                                                
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        handleAppointmentAction('no-show', showAppointmentDetailsModal.appointment.id);
                                                        setShowAppointmentDetailsModal({ open: false });
                                                    }}
                                                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 py-3 px-6 rounded-xl font-semibold"
                                                >
                                                    <User className="w-5 h-5 mr-2" />
                                                    Mark as No Show
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-6 border-t border-slate-200">
                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = `/tickets?ticket=${showAppointmentDetailsModal.appointment?.ticket?.id}`}
                                    className="flex-1"
                                >
                                    View Ticket
                                </Button>
                                <Button
                                    onClick={() => setShowAppointmentDetailsModal({ open: false })}
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
