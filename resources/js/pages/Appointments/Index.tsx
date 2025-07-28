import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, PlayCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
    padding: 8px;
    font-weight: 600;
    color: #374151;
}
.rbc-event {
    border-radius: 4px;
    border: none !important;
    color: white !important;
    font-size: 12px;
    padding: 2px 4px;
}
.rbc-today {
    background-color: #fef3c7;
}
.rbc-current-time-indicator {
    background-color: #ef4444;
}
.rbc-time-slot {
    border-top: 1px solid #f1f5f9;
}
.rbc-timeslot-group {
    border-bottom: 1px solid #e2e8f0;
}
.rbc-day-slot .rbc-event {
    border: 1px solid rgba(255,255,255,0.2);
}
.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
}
.rbc-agenda-view .rbc-agenda-content {
    padding: 8px;
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
    currentDate: string;
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
    }
};

export default function AppointmentsIndex({ appointments, technicals, currentDate }: AppointmentsProps) {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [calendarView, setCalendarView] = useState<any>(Views.MONTH);
    const [calendarDate, setCalendarDate] = useState(new Date(currentDate));

    // Define getStatusConfig first
    const getStatusConfig = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    };

    // Convert appointments to calendar events
    const calendarEvents = useMemo(() => {
        return appointments.map(appointment => {
            const start = new Date(appointment.scheduled_for);
            const end = new Date(start.getTime() + appointment.estimated_duration * 60000); // Add duration in minutes
            const statusConf = getStatusConfig(appointment.status);

            return {
                id: appointment.id,
                title: `${appointment.title} - ${appointment.technical.name}`,
                start,
                end,
                resource: appointment,
                style: {
                    backgroundColor: statusConf.bgColor,
                    borderColor: statusConf.bgColor,
                    color: 'white'
                }
            };
        });
    }, [appointments]);

    const handleSelectEvent = (event: any) => {
        setSelectedAppointment(event.resource);
        setShowAppointmentModal(true);
    };

    const handleSelectSlot = (slotInfo: any) => {
        // You can add functionality to create new appointments here
        console.log('Selected slot:', slotInfo);
    };

    const eventStyleGetter = (event: any) => {
        const appointment = event.resource;
        const statusConf = getStatusConfig(appointment.status);
        
        return {
            style: {
                backgroundColor: statusConf.bgColor,
                borderColor: statusConf.bgColor,
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                padding: '2px 4px'
            }
        };
    };

    const CustomEvent = ({ event }: { event: any }) => {
        const appointment = event.resource;
        const statusConf = getStatusConfig(appointment.status);
        const IconComponent = statusConf.icon;

        return (
            <div className="flex items-center gap-1 text-white text-xs">
                <IconComponent className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{appointment.title}</span>
            </div>
        );
    };

    // Get upcoming appointments (next 7 days)
    const upcomingAppointments = appointments.filter(appointment => {
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
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Appointments Calendar</h1>
                        <p className="text-gray-600 mt-2">Manage all scheduled on-site appointments</p>
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
                                        Appointments Calendar
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={calendarView === Views.MONTH ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCalendarView(Views.MONTH)}
                                        >
                                            Month
                                        </Button>
                                        <Button
                                            variant={calendarView === Views.WEEK ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCalendarView(Views.WEEK)}
                                        >
                                            Week
                                        </Button>
                                        <Button
                                            variant={calendarView === Views.DAY ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCalendarView(Views.DAY)}
                                        >
                                            Day
                                        </Button>
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
                                            event: CustomEvent
                                        }}
                                        style={{ height: '100%' }}
                                        formats={{
                                            timeGutterFormat: 'HH:mm',
                                            eventTimeRangeFormat: ({ start, end }) => {
                                                return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
                                            }
                                        }}
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
                                                    setSelectedAppointment(appointment);
                                                    setShowAppointmentModal(true);
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
                                        <span className="font-medium">{appointments.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Scheduled:</span>
                                        <span className="font-medium text-blue-600">
                                            {appointments.filter(a => a.status === 'scheduled').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">In Progress:</span>
                                        <span className="font-medium text-yellow-600">
                                            {appointments.filter(a => a.status === 'in_progress').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Completed:</span>
                                        <span className="font-medium text-green-600">
                                            {appointments.filter(a => a.status === 'completed').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Cancelled:</span>
                                        <span className="font-medium text-red-600">
                                            {appointments.filter(a => a.status === 'cancelled').length}
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

                {/* Appointment Details Modal */}
                {selectedAppointment && showAppointmentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedAppointment.title}</h2>
                                    <p className="text-sm text-gray-600">Ticket #{selectedAppointment.ticket.code}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(selectedAppointment.status)}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAppointmentModal(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatTime(selectedAppointment.scheduled_for)} ({selectedAppointment.estimated_duration} min)</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{selectedAppointment.technical.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{selectedAppointment.address}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-4 h-4" />
                                    <span>{selectedAppointment.ticket.user.name}</span>
                                </div>
                            </div>

                            {selectedAppointment.description && (
                                <div className="mb-4">
                                    <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                                    <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                                        {selectedAppointment.description}
                                    </p>
                                </div>
                            )}

                            {selectedAppointment.member_instructions && (
                                <div className="mb-4">
                                    <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
                                    <p className="text-sm text-blue-700 p-3 bg-blue-50 rounded">
                                        {selectedAppointment.member_instructions}
                                    </p>
                                </div>
                            )}

                            {selectedAppointment.completion_notes && (
                                <div className="mb-4">
                                    <h3 className="font-medium text-green-800 mb-2">Completion Notes</h3>
                                    <p className="text-sm text-green-700 p-3 bg-green-50 rounded">
                                        {selectedAppointment.completion_notes}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = `/tickets?ticket=${selectedAppointment.ticket.id}`}
                                >
                                    View Ticket
                                </Button>
                                <Button
                                    onClick={() => setShowAppointmentModal(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
