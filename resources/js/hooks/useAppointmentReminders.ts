import { useEffect } from 'react';
import axios from 'axios';

interface UseAppointmentRemindersProps {
    enabled?: boolean;
    intervalMinutes?: number;
}

/**
 * Hook para verificar recordatorios de citas automáticamente
 * Se ejecuta cada minuto para consultar citas próximas y disparar recordatorios
 */
export function useAppointmentReminders({ 
    enabled = true, 
    intervalMinutes = 1 
}: UseAppointmentRemindersProps = {}) {
    
    useEffect(() => {
        if (!enabled) return;

        const checkReminders = async () => {
            try {
                const response = await axios.get('/appointments/check-reminders');
                console.log('📅 Checked appointment reminders:', response.data);
            } catch (error) {
                console.error('❌ Error checking appointment reminders:', error);
            }
        };

        // Ejecutar inmediatamente
        checkReminders();

        // Luego ejecutar cada X minutos
        const interval = setInterval(checkReminders, intervalMinutes * 60 * 1000);

        return () => clearInterval(interval);
    }, [enabled, intervalMinutes]);
}