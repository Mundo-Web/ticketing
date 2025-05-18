export 
interface Doorman {
    id?: number;
    name: string;
    photo: string | null;
    email: string;
    phone: string;
    shift: 'morning' | 'afternoon' | 'night';
}