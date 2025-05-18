export interface Device {
    id: number;
    name: string;
    brand_id: number;
    model_id: number;
    system_id: number;
    name_device_id: number;
    brand?: { id: number; name: string };
    model?: { id: number; name: string };
    system?: { id: number; name: string };
    name_device?: { id: number; name: string };
}