import { SidebarProvider } from '@/components/ui/sidebar';
// import { useAppointmentReminders } from '@/hooks/useAppointmentReminders'; // Disabled due to 404 errors blocking WebSocket notifications
import { useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));

    // Activar verificación automática de recordatorios - DISABLED: Causing 404 errors that block WebSocket notifications
    // useAppointmentReminders({ 
    //     enabled: true, 
    //     intervalMinutes: 1 
    // });

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            {children}
        </SidebarProvider>
    );
}
