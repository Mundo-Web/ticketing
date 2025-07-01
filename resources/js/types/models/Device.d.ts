export interface Device {
    id: number;
    name: string;
    brand_id: number;
    model_id: number;
    system_id: number;
    name_device_id: number;
    ubicacion?: string;
    icon_id?: string;
    brand?: { id: number; name: string };
    model?: { id: number; name: string };
    system?: { id: number; name: string };
    name_device?: { id: number; name: string };
    shared_with?: Array<{
        id: number;
        name: string;
        photo: string;
    }>;
    owner?: Array<{
        id: number;
        name: string;
        photo: string;
    }>;
    tenants?: Array<{
        id: number;
        name: string;
        photo: string;
    }>;
}