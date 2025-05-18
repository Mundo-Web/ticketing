export interface  Apartment  {
    id: number;
    name: string;
    ubicacion: string;
 
    status: boolean;
    created_at: string;
    tenants?: Tenant[];
    devices?: Device[];
};