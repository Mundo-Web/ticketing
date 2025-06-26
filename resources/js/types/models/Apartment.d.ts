export interface  Apartment  {
    id: number;
    name: string;
    ubicacion: string;
    order: number;
    status: boolean;
    created_at: string;
    tenants?: Tenant[];
    devices?: Device[];
};