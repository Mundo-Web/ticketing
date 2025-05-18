export interface Tenant {
    id: number;
    name: string;
    email: string;
    phone: string;
    photo: File|string|null;
    photoPreview: string;
};