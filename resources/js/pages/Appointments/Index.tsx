import React, { useState, useMemo, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar as CalendarIcon, Clock, MapPin, User, CheckCircle, XCircle, PlayCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'sonner';

// Configure moment localizer with timezone
moment.locale('en'); // o 'es' si prefieres español
const localizer = momentLocalizer(moment);

// Modern Google Calendar Style CSS
const calendarStyle = `
/* Base Calendar - Clean Modern Look */
.rbc-calendar {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: none;
}

/* Header - Google Calendar Style */
.rbc-header {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    color: #334155;
    border: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 12px;
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    letter-spacing: 0.025em;
    position: relative;
}

.rbc-header:hover {
    background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
    transition: background 0.2s ease;
}

.rbc-header + .rbc-header {
    border-left: 1px solid #e2e8f0;
}

/* Week View Header - Force single cell appearance per day */
.rbc-time-header .rbc-header {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

.rbc-time-header .rbc-header:first-child {
    border-left: none !important;
}

.rbc-time-header .rbc-header:last-child {
    border-right: none !important;
}

/* Hide internal subdivisions in day headers */
.rbc-time-header-gutter + .rbc-header,
.rbc-time-header .rbc-header ~ .rbc-header {
    border-left: 1px solid #e2e8f0 !important;
}

/* Ensure day headers span full width without subdivisions */
.rbc-time-view .rbc-time-header {
    display: flex !important;
}

.rbc-time-view .rbc-time-header .rbc-header {
    flex: 1 !important;
    min-width: 0 !important;
}

/* Fix for rbc-row-bg - Remove internal subdivisions */
.rbc-row-bg {
    display: flex !important;
}

.rbc-row-bg .rbc-day-bg {
    border-left: 1px solid #f1f5f9 !important;
    border-right: none !important;
    flex: 1 !important;
}

.rbc-row-bg .rbc-day-bg:first-child {
    border-left: none !important;
}

.rbc-row-bg .rbc-day-bg:last-child {
    border-right: none !important;
}

/* Hide extra day-bg elements that create subdivisions */
.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg + .rbc-day-bg {
    display: none !important;
}

.rbc-time-view .rbc-row-bg .rbc-day-bg + .rbc-day-bg:not(:last-child) {
    display: none !important;
}

/* Today Cell - Subtle Highlight */
.rbc-today {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-radius: 8px;
    position: relative;
}

.rbc-today::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.05), transparent, rgba(59, 130, 246, 0.05));
    border-radius: 8px;
    animation: subtlePulse 3s infinite;
}

@keyframes subtlePulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}

/* Date Cells - Clean and Interactive */
.rbc-date-cell {
    padding: 12px 8px;
    border-right: 1px solid #f1f5f9;
    font-weight: 500;
    color: #475569;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: #ffffff;
    position: relative;
}

.rbc-date-cell:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.rbc-off-range-bg {
    background: #fafafa;
}

.rbc-off-range {
    color: #94a3b8;
    opacity: 0.7;
}

/* Current Time Indicator - Blue Line */
.rbc-current-time-indicator {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    height: 2px;
    z-index: 10;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    border-radius: 1px;
}

/* Time Slots - Minimal and Clean */
.rbc-time-slot {
    border-top: 1px solid #f8fafc;
    min-height: 60px;
    transition: background-color 0.15s ease;
    background: #ffffff;
}

.rbc-time-slot:hover {
    background: rgba(59, 130, 246, 0.02);
}

.rbc-timeslot-group {
    border-bottom: 1px solid #f1f5f9;
    min-height: 60px;
}

/* Week View - Force single cells per hour */
.rbc-time-view .rbc-timeslot-group {
    min-height: 60px !important;
    height: 60px !important;
}

.rbc-time-view .rbc-time-slot {
    min-height: 60px !important;
    height: 60px !important;
    border-top: none !important;
}

.rbc-time-view .rbc-timeslot-group:last-child .rbc-time-slot {
    border-bottom: 1px solid #f1f5f9 !important;
}

.rbc-time-gutter .rbc-timeslot-group {
    border-right: 1px solid #f1f5f9;
}

.rbc-time-header-gutter {
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    border-right: 1px solid #e2e8f0;
}

.rbc-time-gutter {
    background: #fafafa;
    border-right: 1px solid #f1f5f9;
}

.rbc-time-slot-time {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
    padding: 4px 8px;
    text-align: right;
}

/* Events - Modern Card Style */
.rbc-day-slot .rbc-event, .rbc-week-view .rbc-event {
    border: none;
    border-radius: 8px;
    margin: 1px 2px;
    padding: 0;
    min-height: 60px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.rbc-event {
    border-radius: 8px;
    border: none !important;
    color: white !important;
    font-size: 12px;
    padding: 0 !important;
    overflow: hidden !important;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
}

.rbc-event:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08);
    z-index: 100;
}

.rbc-event:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
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
    position: relative;
    z-index: 2;
}

/* Month View - Clean Grid */
.rbc-month-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-month-row {
    border-bottom: 1px solid #f1f5f9;
}

.rbc-month-row:last-child {
    border-bottom: none;
}

.rbc-date-cell a {
    color: #475569;
    font-weight: 600;
    text-decoration: none;
    padding: 6px 8px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-block;
    position: relative;
}

.rbc-date-cell a:hover {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.rbc-date-cell.rbc-today a {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

/* Agenda View - List Style */
.rbc-agenda-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-agenda-view table.rbc-agenda-table {
    font-size: 14px;
    width: 100%;
}

.rbc-agenda-view .rbc-agenda-content {
    padding: 16px;
}

.rbc-agenda-view .rbc-event {
    background: none !important;
    border: none !important;
    color: inherit !important;
    min-height: auto;
    padding: 12px 16px;
    border-radius: 12px;
    margin: 4px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 3px solid #3b82f6 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    position: relative;
    overflow: hidden;
}

.rbc-agenda-view .rbc-event:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
    border-left-width: 4px !important;
}

.rbc-agenda-date-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    font-weight: 600;
    color: #475569;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

.rbc-agenda-time-cell {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    font-weight: 500;
    color: #64748b;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
}

.rbc-agenda-event-cell {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
}

/* Week/Time Views */
.rbc-time-view {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
}

.rbc-time-header {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #f1f5f9;
}

.rbc-time-content {
    border: none;
    background: #ffffff;
}

.rbc-allday-cell {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid #e2e8f0;
    padding: 0px 0;
    visibility: hidden;
    display: none !important;
}

/* Fix for rbc-allday-cell - Remove internal subdivisions */
.rbc-time-view .rbc-allday-cell {
    border-left: none !important;
    border-right: 1px solid #e2e8f0 !important;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    display: none !important;
    flex: 1 !important;
}

.rbc-time-view .rbc-allday-cell:first-child {
    border-left: none !important;
}

.rbc-time-view .rbc-allday-cell:last-child {
    border-right: none !important;
}

/* Hide extra allday cells that create subdivisions */
.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell + .rbc-allday-cell {
    display: none !important;
}

.rbc-time-view .rbc-header-row .rbc-allday-cell + .rbc-allday-cell:not(:last-child) {
    display: none !important;
}

.rbc-row-content {
    border-bottom: 1px solid #f1f5f9;
}

/* Custom Scrollbar - Minimal */
.rbc-time-content::-webkit-scrollbar {
    width: 8px;
}

.rbc-time-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
}

.rbc-time-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    border-radius: 4px;
    border: 1px solid #f1f5f9;
}

.rbc-time-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

/* Custom Event Content - Clean Typography */
.custom-event-content {
    color: #ffffff !important;
    position: relative;
    overflow: hidden;
}

.custom-event-content * {
    color: #ffffff !important;
    position: relative;
    z-index: 2;
}

.custom-event-content .event-time {
    color: #ffffff !important;
    font-weight: 600 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-client {
    color: #ffffff !important;
    font-weight: 700 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-title {
    color: #ffffff !important;
    font-weight: 500 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content .event-location {
    color: #ffffff !important;
    opacity: 0.95 !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.custom-event-content svg {
    color: #ffffff !important;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* Loading Animation - Subtle */
@keyframes eventAppear {
    0% { 
        opacity: 0; 
        transform: translateY(10px) scale(0.95); 
    }
    100% { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
    }
}

.rbc-event {
    animation: eventAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive Design */
@media (max-width: 768px) {
    .rbc-calendar {
        border-radius: 12px;
    }
    
    .rbc-header {
        padding: 8px 6px;
        font-size: 11px;
    }
    
    .rbc-time-slot-time {
        font-size: 10px;
        padding: 2px 6px;
    }
    
    .rbc-event {
        border-radius: 6px;
        min-height: 40px !important;
    }
    
    .rbc-date-cell {
        padding: 8px 4px;
    }
}

/* Focus States for Accessibility */
.rbc-calendar *:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
}

/* Selection States */
.rbc-selected {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
    color: white !important;
}

/* Drag and Drop States */
.rbc-addons-dnd-drag-row {
    background: rgba(59, 130, 246, 0.1);
}

.rbc-addons-dnd-over {
    background: rgba(59, 130, 246, 0.2);
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
    googleMapsApiKey?: string;
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

export default function AppointmentsIndex({ appointments, technicals, auth, isTechnicalDefault, googleMapsApiKey }: AppointmentsProps) {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    
    // Usar la misma lógica de detección de roles que en el index de Tickets
    const { props } = usePage<any>();
    const isTechnical = (auth.user as any)?.roles?.includes("technical");
    const isSuperAdmin = (auth.user as any)?.roles?.includes("super-admin");
    
    // Vista por defecto: Agenda para técnicos, Día para super admins
    const defaultView = (isTechnical || isTechnicalDefault) ? Views.AGENDA : Views.DAY;
    const [calendarView, setCalendarView] = useState<any>(defaultView);
    
    const [calendarDate, setCalendarDate] = useState(new Date()); // Usar fecha actual del cliente
    const [notifications, setNotifications] = useState<string[]>([]);
    const [selectedAppointmentLoading, setSelectedAppointmentLoading] = useState(false);
    
    // Estados del modal de detalles de cita - igual que en el index de Tickets
    const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState<{ open: boolean; appointment?: any }>({ open: false });
    
    // Estado para el modal de ubicación (igual que en Tickets)
    const [showLocationModal, setShowLocationModal] = useState<{ open: boolean; building?: any }>({ open: false });
    
    // No Show Modal States
    const [showNoShowModal, setShowNoShowModal] = useState<{ open: boolean; appointment?: any }>({ open: false });
    const [noShowForm, setNoShowForm] = useState({
        reason: '',
        description: '',
        notifyMember: true,
        rescheduleOffered: false
    });
    const [isSubmittingNoShow, setIsSubmittingNoShow] = useState(false);
    
    // No Show Reasons
    const noShowReasons = [
        { value: 'member_not_home', label: 'Member Not Home', description: 'Member was not present at the scheduled time' },
        { value: 'no_response', label: 'No Response', description: 'Member did not respond to door/calls' },
        { value: 'refused_service', label: 'Refused Service', description: 'Member refused to allow technician entry' },
        { value: 'wrong_time', label: 'Wrong Time', description: 'Member expected different time' },
        { value: 'emergency', label: 'Member Emergency', description: 'Member had an emergency and could not attend' },
        { value: 'technical_issue', label: 'Technical Issue', description: 'Technical problem prevented the visit' },
        { value: 'weather', label: 'Weather Conditions', description: 'Weather prevented the visit' },
        { value: 'other', label: 'Other', description: 'Other reason not listed above' }
    ];
    // isTechnicalDefault ahora viene del backend correctamente

    // Función para obtener URL del embed de Google Maps (igual que en Tickets)
    const getEmbedUrl = (locationLink: string): string => {
        if (!locationLink) return '';

        if (locationLink.includes('maps.app.goo.gl')) {
            return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=-10.916879,-74.883391&zoom=15`;
        }

        if (locationLink.includes('/embed')) return locationLink;

        if (locationLink.includes('google.com/maps')) {
            const coordsMatch = locationLink.match(/@([-0-9.]+),([-0-9.]+)/);
            if (coordsMatch) {
                return `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${coordsMatch[1]},${coordsMatch[2]}&zoom=15`;
            }

            const placeIdMatch = locationLink.match(/place\/([^\/]+)/);
            if (placeIdMatch) {
                return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:${placeIdMatch[1]}`;
            }
        }

        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(locationLink)}`;
    };

    // Función para obtener datos completos de la cita (igual que en Tickets)
    const fetchFullAppointmentData = async (appointmentId: number) => {
        console.log('fetchFullAppointmentData called with ID:', appointmentId);
        try {
            const response = await fetch(`/appointments/${appointmentId}/details`);
            console.log('API response status:', response.status);
            if (response.ok) {
                const appointmentData = await response.json();
                console.log('Received appointment data:', appointmentData);
                return appointmentData.appointment;
            } else {
                console.error('API response not ok:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching appointment details:', error);
        }
        return null;
    };

    // Función para abrir modal de cita con datos completos (igual que en Tickets)
    const openAppointmentModal = async (appointment: any, action: string = 'view') => {
        console.log('openAppointmentModal called with:', { appointment, action });
        
        // Si la cita ya tiene datos completos del ticket, usarlos directamente
        if (appointment?.ticket?.device?.tenants || appointment?.ticket?.user?.tenant) {
            console.log('Using existing appointment data - has relationships');
            setShowAppointmentDetailsModal({ open: true, appointment });
            return;
        }

        console.log('Fetching full appointment data for ID:', appointment.id);
        // De lo contrario, obtener los datos completos de la cita
        const fullAppointment = await fetchFullAppointmentData(appointment.id);
        if (fullAppointment) {
            console.log('Successfully fetched full appointment data:', fullAppointment);
            setShowAppointmentDetailsModal({ open: true, appointment: fullAppointment });
        } else {
            console.log('Failed to fetch full appointment data, using fallback');
            // Fallback a la cita original si falla la obtención
            setShowAppointmentDetailsModal({ open: true, appointment });
        }
    };

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
                        const message = isTechnical || isTechnicalDefault 
                            ? `🔔 You have an appointment in ${timeLeft} minutes with ${appointment.ticket.user.name}: ${appointment.title}`
                            : `Upcoming appointment in ${timeLeft} minutes: ${appointment.title}`;
                        
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
    }, [filteredAppointments, isTechnical, isTechnicalDefault]);

    // Define getStatusConfig first
    const getStatusConfig = (status: string) => {
        return statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    };

    // Convert appointments to calendar events
    const calendarEvents = useMemo(() => {
        const events = filteredAppointments.map(appointment => {
            // Crear fechas usando el timezone local para evitar problemas de offset
            const start = new Date(appointment.scheduled_for);
            
            // Para eventos nocturnos (después de las 18:00), limitar la duración más agresivamente
            const hour = start.getHours();
            let durationMinutes = appointment.estimated_duration;
            
            // Si es un evento nocturno, limitarlo para que NO se extienda al día siguiente
            if (hour >= 18) { // Desde las 6 PM
                const minutesUntilMidnight = (24 - hour) * 60 - start.getMinutes();
                
                // Para eventos muy tardíos (después de las 22:00), usar duración muy corta
                if (hour >= 22) {
                    durationMinutes = Math.min(30, minutesUntilMidnight - 30); // máximo 30 min, termina 30 min antes de medianoche
                } else {
                    // Para eventos entre 18:00 y 22:00, limitar pero menos agresivamente
                    durationMinutes = Math.min(durationMinutes, minutesUntilMidnight - 60); // termina 1 hora antes de medianoche
                }
                
                // Asegurar que siempre sea al menos 15 minutos
                durationMinutes = Math.max(15, durationMinutes);
            }
            
            const end = new Date(start.getTime() + durationMinutes * 60000);
            
            // Debug para verificar fechas
            console.log('🗓️ Converting appointment:', {
                id: appointment.id,
                title: appointment.title,
                scheduled_for: appointment.scheduled_for,
                originalDuration: appointment.estimated_duration,
                adjustedDuration: durationMinutes,
                start: start.toISOString(),
                end: end.toISOString(),
                startDay: start.getDate(),
                endDay: end.getDate(),
                hour: hour,
                isNightEvent: hour >= 18,
                startsAt: start.toLocaleTimeString(),
                endsAt: end.toLocaleTimeString()
            });

            return {
                id: appointment.id,
                title: `${appointment.ticket.user.name} - ${appointment.title}`,
                start,
                end,
                resource: appointment,
                allDay: false
            };
        });
        
        console.log('🗓️ Total calendar events created:', events.length);
        return events;
    }, [filteredAppointments]);

    const handleSelectEvent = (event: any) => {
        openAppointmentModal(event.resource);
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
                    const successMessages: Record<string, string> = {
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

    const handleNoShow = async () => {
        try {
            if (!showNoShowModal.appointment) return;
            
            setIsSubmittingNoShow(true);
            
            // Call backend API to mark appointment as no-show
            await router.post(route('appointments.no-show', showNoShowModal.appointment.id), {
                reason: noShowForm.reason,
                description: noShowForm.description || null
            });
            
            toast.success('Appointment marked as No Show successfully');
            setShowNoShowModal({ open: false });
            setNoShowForm({ reason: '', description: '', notifyMember: true, rescheduleOffered: false });
            
            // Refresh appointments
            router.reload();
            
        } catch (error) {
            console.error('Error marking appointment as no-show:', error);
            toast.error('Error marking appointment as no-show');
        } finally {
            setIsSubmittingNoShow(false);
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
                <div className="text-xs opacity-95 leading-tight mb-1 overflow-hidden">
                    {appointment.title}
                </div>
                
                
                
                {/* Status indicator dot */}
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white opacity-75 rounded-full"></div>
            </div>
        );
    };

    // Effect para scroll automático a las 6:00 AM en vista Week
    useEffect(() => {
        if (calendarView === Views.WEEK || calendarView === Views.DAY) {
            // Pequeño delay para asegurar que el calendario se haya renderizado
            setTimeout(() => {
                const timeContent = document.querySelector('.rbc-time-content');
                if (timeContent) {
                    // Calcular la posición de las 6:00 AM
                    // Cada hora son aproximadamente 60px, entonces 6 horas = 360px
                    const scrollTo = 6 * 60; // 6:00 AM * 60px por hora
                    timeContent.scrollTop = scrollTo;
                    console.log('📅 Auto-scrolled to 6:00 AM in Week view');
                }
            }, 100);
        }
    }, [calendarView, calendarDate]);

    // Get upcoming appointments (next 7 days) - usando filteredAppointments
    const upcomingAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_for);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return appointmentDate >= today && appointmentDate <= nextWeek && appointment.status === 'scheduled';
    }).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24 horas
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
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                {/* Modern Header with Glass Effect */}
                <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
                    <div className=" mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                                    <CalendarIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        {isTechnical || isTechnicalDefault ? 'My Schedule' : 'Calendar Management'}
                                    </h1>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {isTechnical || isTechnicalDefault 
                                            ? `${auth.user.name}'s appointments and tasks` 
                                            : 'Comprehensive appointment scheduling system'
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {/* Status Legend - Modern Pills */}
                            <div className="hidden lg:flex items-center gap-2">
                                {Object.entries(statusConfig).map(([status, config]) => {
                                    const IconComponent = config.icon;
                                    return (
                                        <div 
                                            key={status} 
                                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            <div 
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: config.bgColor }}
                                            />
                                            <IconComponent className="w-3.5 h-3.5 text-slate-600" />
                                            <span className="text-xs font-medium text-slate-700">{config.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications - Modern Alert */}
                {notifications.length > 0 && (
                    <div className=" mx-auto px-6 pt-6">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-100 rounded-xl">
                                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-amber-900 mb-2">Upcoming Appointments</h3>
                                    <div className="space-y-1">
                                        {notifications.map((notification, index) => (
                                            <p key={index} className="text-sm text-amber-800">{notification}</p>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setNotifications([])}
                                    className="p-2 h-8 w-8 rounded-full hover:bg-amber-100 text-amber-600 hover:text-amber-800"
                                >
                                    ×
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - Google Calendar Style */}
                <div className=" mx-auto px-6 py-6">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Calendar Area - Primary Content */}
                        <div className="xl:col-span-9">
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                {/* Calendar Controls - Google Style */}
                                <div className="bg-gradient-to-r from-white to-slate-50 border-b border-slate-100 p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        {/* Date Navigation */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigateCalendar('prev')}
                                                    className="h-10 w-10 rounded-xl hover:bg-slate-100"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigateCalendar('today')}
                                                    className="px-6 h-10 rounded-xl font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                >
                                                    Today
                                                </Button>
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigateCalendar('next')}
                                                    className="h-10 w-10 rounded-xl hover:bg-slate-100"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            
                                            {/* Current Date Display - Large and Beautiful */}
                                            <div className="px-4">
                                                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                                    {getCalendarTitle()}
                                                </h2>
                                            </div>
                                        </div>
                                        
                                        {/* View Toggle - Modern Pills */}
                                        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                                            {[
                                                { view: Views.DAY, label: 'Day', icon: CalendarIcon },
                                                { view: Views.WEEK, label: 'Week', icon: CalendarIcon },
                                                { view: Views.MONTH, label: 'Month', icon: CalendarIcon },
                                                { view: Views.AGENDA, label: 'Agenda', icon: CalendarIcon }
                                            ].map(({ view, label, icon: Icon }) => (
                                                <Button
                                                    key={view}
                                                    variant={calendarView === view ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setCalendarView(view)}
                                                    className={`h-10 px-6 rounded-xl font-medium transition-all duration-200 ${
                                                        calendarView === view
                                                            ? 'bg-white shadow-sm text-slate-900 hover:bg-white'
                                                            : 'hover:bg-white/60 text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4 mr-2" />
                                                    {label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar Content */}
                                <div className="p-6">
                                    <div className="h-[700px] bg-white rounded-2xl shadow-inner border border-slate-100 overflow-hidden">
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
                                                toolbar: () => null
                                            }}
                                            style={{ height: '100%' }}
                                            formats={{
                                                timeGutterFormat: 'HH:mm',
                                                eventTimeRangeFormat: ({ start, end }) => {
                                                    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
                                                },
                                                dayFormat: 'ddd DD/MM',
                                                dateFormat: 'DD',
                                                dayHeaderFormat: 'dddd DD/MM/YYYY',
                                                dayRangeHeaderFormat: ({ start, end }) => {
                                                    return `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM/YYYY')}`;
                                                },
                                                agendaDateFormat: 'dddd DD/MM/YYYY',
                                                agendaTimeFormat: 'HH:mm',
                                                agendaTimeRangeFormat: ({ start, end }) => {
                                                    return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
                                                }
                                            }}
                                            min={new Date(2025, 0, 1, 0, 0, 0)}
                                            max={new Date(2025, 0, 1, 23, 59, 59)}
                                            step={60}
                                            timeslots={1}
                                            views={{
                                                day: true,
                                                week: true,
                                                month: true,
                                                agenda: true
                                            }}
                                            showMultiDayTimes={true}
                                            popup={true}
                                            popupOffset={30}
                                            scrollToTime={new Date(1970, 1, 1, 6, 0, 0)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Modern Cards */}
                        <div className="xl:col-span-3 space-y-6">
                            {/* Upcoming Appointments - Redesigned */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                <div className=" bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-900">Upcoming</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {upcomingAppointments.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="p-4 bg-slate-50 rounded-2xl mx-auto w-fit mb-4">
                                                <CalendarIcon className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No upcoming appointments</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingAppointments.slice(0, 4).map((appointment) => (
                                                <div 
                                                    key={appointment.id} 
                                                    className="group relative bg-gradient-to-r from-slate-50 to-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer"
                                                    onClick={() => openAppointmentModal(appointment)}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    
                                                    <div className="relative">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-900 transition-colors">
                                                                    {appointment.title}
                                                                </h4>
                                                                <p className="text-sm text-slate-600 font-medium">
                                                                    {appointment.ticket.user.name}
                                                                </p>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                {(isTechnical || isTechnicalDefault) && appointment.status === 'scheduled' && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAppointmentAction('start', appointment.id);
                                                                        }}
                                                                        className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium shadow-sm"
                                                                    >
                                                                        <PlayCircle className="w-3 h-3 mr-1" />
                                                                        Start
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(appointment.scheduled_for)}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <User className="w-3 h-3" />
                                                                {appointment.technical.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats - Modern Design */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-emerald-900">Statistics</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Total', count: filteredAppointments.length, color: 'text-slate-600' },
                                            { label: 'Scheduled', count: filteredAppointments.filter(a => a.status === 'scheduled').length, color: 'text-blue-600' },
                                            { label: 'In Progress', count: filteredAppointments.filter(a => a.status === 'in_progress').length, color: 'text-yellow-600' },
                                            { label: 'Completed', count: filteredAppointments.filter(a => a.status === 'completed').length, color: 'text-green-600' },
                                            { label: 'No Show', count: filteredAppointments.filter(a => a.status === 'no_show').length, color: 'text-orange-600' },
                                            { label: 'Cancelled', count: filteredAppointments.filter(a => a.status === 'cancelled').length, color: 'text-red-600' }
                                        ].map((stat) => (
                                            <div key={stat.label} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100">
                                                <span className="text-sm font-medium text-slate-700">{stat.label}:</span>
                                                <span className={`text-lg font-bold ${stat.color}`}>{stat.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Available Technicians - Modern Cards */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 border-b border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-xl">
                                            <User className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-purple-900">Team</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {technicals.map((technical: any) => (
                                            <div key={technical.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {technical.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900 text-sm">{technical.name}</p>
                                                    <p className="text-xs text-slate-500">{technical.email}</p>
                                                </div>
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs bg-green-50 text-green-700 border-green-200 px-2 py-1 rounded-lg"
                                                >
                                                    Available
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-slate-600">Location</div>
                                                        <div className="text-base font-semibold text-slate-900">
                                                            {(() => {
                                                                const appointment = showAppointmentDetailsModal.appointment;
                                                                console.log('DEBUG - Full appointment object:', appointment);
                                                                console.log('DEBUG - Ticket object:', appointment?.ticket);
                                                                console.log('DEBUG - Device object:', appointment?.ticket?.device);
                                                                console.log('DEBUG - Device tenants:', appointment?.ticket?.device?.tenants);
                                                                console.log('DEBUG - User tenant:', appointment?.ticket?.user?.tenant);
                                                                
                                                                // Try to get building info from multiple sources
                                                                const building = appointment?.ticket?.device?.tenants?.[0]?.apartment?.building?.name ||
                                                                                appointment?.ticket?.user?.tenant?.apartment?.building?.name ||
                                                                                'Building not specified';
                                                                const apartment = appointment?.ticket?.device?.tenants?.[0]?.apartment?.name ||
                                                                                appointment?.ticket?.user?.tenant?.apartment?.name;
                                                                
                                                                let location = building;
                                                                if (apartment) {
                                                                    location += ` - ${apartment}`;
                                                                }
                                                                return location;
                                                            })()}
                                                        </div>
                                                        {showAppointmentDetailsModal.appointment.address && (
                                                            <div className="text-sm text-slate-600 mt-1">
                                                                {showAppointmentDetailsModal.appointment.address}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {(() => {
                                                        const appointment = showAppointmentDetailsModal.appointment;
                                                        const building = appointment?.ticket?.device?.tenants?.[0]?.apartment?.building ||
                                                                        appointment?.ticket?.user?.tenant?.apartment?.building;
                                                        
                                                        if (building?.location_link) {
                                                            return (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setShowLocationModal({ open: true, building })}
                                                                    className="ml-2 p-2 h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200"
                                                                    title="View on Map"
                                                                >
                                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                                </Button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
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
                                                        setShowNoShowModal({ open: true, appointment: showAppointmentDetailsModal.appointment });
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

                {/* Location Modal - igual que en Tickets */}
                <Dialog open={showLocationModal.open} onOpenChange={(open) => setShowLocationModal({ open })}>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-600" />
                                {showLocationModal.building?.name || 'Building Location'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="w-full aspect-video">
                            <iframe
                                src={showLocationModal.building?.location_link ? getEmbedUrl(showLocationModal.building.location_link) : ''}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Building Location"
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* No Show Modal */}
                <Dialog open={showNoShowModal.open} onOpenChange={(open) => setShowNoShowModal({ open })}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-600" />
                                Mark as No Show
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for No Show *
                                </label>
                                <select
                                    value={noShowForm.reason}
                                    onChange={(e) => setNoShowForm({ ...noShowForm, reason: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    {noShowReasons.map((reasonObj) => (
                                        <option key={reasonObj.value} value={reasonObj.value}>
                                            {reasonObj.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Description (Optional)
                                </label>
                                <textarea
                                    value={noShowForm.description}
                                    onChange={(e) => setNoShowForm({ ...noShowForm, description: e.target.value })}
                                    placeholder="Enter additional details about the no-show..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    rows={3}
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNoShowModal({ open: false });
                                    setNoShowForm({ reason: '', description: '', notifyMember: true, rescheduleOffered: false });
                                }}
                                className="flex-1"
                                disabled={isSubmittingNoShow}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleNoShow}
                                disabled={!noShowForm.reason || isSubmittingNoShow}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {isSubmittingNoShow ? 'Processing...' : 'Mark as No Show'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
