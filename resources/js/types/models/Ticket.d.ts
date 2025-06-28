export interface Ticket {
    id: number;
    code: string;
    user_id: number;
    device_id: number;
    category: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled' | 'reopened';
    resolved_at?: string;
    closed_at?: string;
    created_at: string;
    updated_at: string;
    technical_id?: number;
    device?: {
        id: number;
        name: string;
        brand?: { name: string };
        system?: { name: string };
        model?: { name: string };
        name_device?: { name: string };
    };
    technical?: {
        id: number;
        name: string;
        email: string;
    };
    histories?: TicketHistory[];
}

export interface TicketHistory {
    id: number;
    ticket_id: number;
    action: string;
    description?: string;
    meta?: string;
    technical_id?: number;
    created_at: string;
    updated_at: string;
}
