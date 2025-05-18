import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Laptop2, ShieldCheck, ShieldPlus, ScanQrCodeIcon, Keyboard, ShareIcon } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';
import { Checkbox } from '@/components/ui/checkbox';
import { Device } from '@/types/models/Device';
import { Tenant } from '@/types/models/Tenant';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';


interface ModalDispositivosProps {
    visible: boolean;
    onClose: () => void;
    tenantName: string;
    devices: Device[];
    shareDevice: Device[];
    brands: any[];
    models: any[];
    systems: any[];
    name_devices: any[];
    apartmentId: number;
    tenantId: number;
    tenants: Tenant[];
}

const ModalDispositivos = ({
    visible,
    tenantName,
    
    devices,
    brands,
    models,
    systems,
    shareDevice,
    name_devices,
    apartmentId,
    tenantId,
    tenants
}: ModalDispositivosProps) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  

    const [deviceList, setDeviceList] = useState<Device[]>(devices);
    const [deviceShareList, setDeviceShareList] = useState<Device[]>(shareDevice);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);

    
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        brand_id: '',
        new_brand: '',
        model_id: '',
        new_model: '',
        system_id: '',
        new_system: '',
        name_device_id: '',
        new_name_device: '',
        apartment_id: apartmentId,
        tenant_id: tenantId,
    });

    const handleShareDevice = async (deviceId: number, tenantIds: number[]) => {
        try {
            const response = await axios.post(route('devices.share', deviceId), {
                tenant_id: tenantId, // ID del inquilino actual que está compartiendo el dispositiv
                tenant_ids: tenantIds,
                apartment_id: apartmentId

            });

            if (response.data.success) {
                // Actualizar la lista de dispositivos compartidos
                const updatedShareDevices = response.data.sharedDevices || [];
                setDeviceShareList(updatedShareDevices);
                
                // Opcional: Actualizar el dispositivo en deviceList si tiene cambios
                setDeviceList(prev => prev.map(device => 
                    device.id === deviceId ? {...device, shared_with: response.data.updatedSharedWith} : device
                ));
    
                toast.success('Dispositivo compartido exitosamente');
                setShowShareModal(false);
            }
        } catch (error) {
            console.error('Error al compartir dispositivo:', error);
            toast.error('Error al compartir el dispositivo');
        }
    };

    const handleShowCreate = () => {
        reset();
        setShowForm(true);
        setEditMode(false);
    };

    const handleEdit = (device: Device) => {
        setData({
            id: device.id,
            name: device.name,
            brand_id: device.brand_id?.toString() || '',
            model_id: device.model_id?.toString() || '',
            system_id: device.system_id?.toString() || '',
            name_device_id: device.name_device_id?.toString() || '',
            new_brand: '',
            new_model: '',
            new_system: '',
            new_name_device: '',
            apartment_id: apartmentId,


        });
        setShowForm(true);
        setEditMode(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            ...(data.new_brand && { brand: data.new_brand }),
            ...(data.new_model && { model: data.new_model }),
            ...(data.new_system && { system: data.new_system }),
            ...(data.new_name_device && { name_device: data.new_name_device }),
            tenants: data.tenants || [] // Añadir los inquilinos seleccionados
        };

        if (editMode) {
            try {
                const response = await axios.put(route('devices.update', data.id), payload);
                const updatedDevice = response.data.device;

                if (updatedDevice) {
                    setDeviceList(prev =>
                        prev.map(device => device.id === updatedDevice.id ? updatedDevice : device)
                    );
                    toast.success('Dispositivo actualizado exitosamente');
                    reset();
                    setShowForm(false);
                }
            } catch (error) {
                toast.error('Error al actualizar el dispositivo');
                console.error(error);
            }
        } else {
            try {
                const response = await axios.post(route('devices.store'), payload);
                const newDevice = response.data.device;

                if (newDevice) {
                    setDeviceList(prev => [...prev, newDevice]);
                    toast.success('Dispositivo creado exitosamente');
                    reset();
                    setShowForm(false);
                }
            } catch (error) {
                toast.error('Error al crear el dispositivo');
                console.error(error);
            }
        }



    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(route('devices.destroy', id));
            setDeviceList(prev => prev.filter(device => device.id !== id));
            toast.success('Dispositivo eliminado exitosamente');
        } catch (error) {
            toast.error('Error al eliminar el dispositivo');
            console.error(error);
        }
    };

    const handleSelectChange = (
        selected: any,
        type: 'brand' | 'model' | 'system' | 'name_device'
    ) => {
        const isNew = selected?.__isNew__ ?? false;
        const key_id = `${type}_id` as keyof typeof data;
        const key_new = `new_${type}` as keyof typeof data;

        if (isNew) {
            setData({
                ...data,
                [key_id]: '',
                [key_new]: selected.label // Establecer el nuevo valor de name_device
            });
        } else {
            setData({
                ...data,
                [key_id]: selected.value,
                [key_new]: '' // Limpiar el valor del nuevo name_device si es un valor existente
            });
        }
    };


    const getSelectedValue = (
        id: string | number,
        newValue: string,
        list: any[]
    ) => {
        if (newValue) return { label: newValue, value: '' };
        const item = list?.find((el) => el.id.toString() === id?.toString());
        return item ? { label: item.name, value: item.id } : null;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Device of {tenantName}</h2>
            </div>

            <Button onClick={handleShowCreate} className="mb-4">
                <Plus className="w-4 h-4 mr-2" /> New Device
            </Button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 space-y-4">


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><Laptop2 className='' /></span>Device</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Select or create"
                                onChange={(option) => handleSelectChange(option, 'name_device')}
                                options={name_devices?.map((s) => ({ label: s.name, value: s.id }))}
                                value={getSelectedValue(data.name_device_id, data.new_name_device, name_devices)}
                            />
                            {errors.name_device_id && <p className="text-red-500 text-sm">{errors.name_device_id}</p>}
                        </div>
                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><ShieldPlus className='' /></span>Brand</Label>
                            <CreatableSelect
                                isClearable
                                 placeholder="Select or create"
                                onChange={(option) => handleSelectChange(option, 'brand')}
                                options={brands.map((b) => ({ label: b.name, value: b.id }))}
                                value={getSelectedValue(data.brand_id, data.new_brand, brands)}
                            />
                            {errors.brand_id && <p className="text-red-500 text-sm">{errors.brand_id}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><ScanQrCodeIcon className='' /></span>Model</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Select or create"
                                onChange={(option) => handleSelectChange(option, 'model')}
                                options={models.map((m) => ({ label: m.name, value: m.id }))}
                                value={getSelectedValue(data.model_id, data.new_model, models)}
                            />
                            {errors.model_id && <p className="text-red-500 text-sm">{errors.model_id}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><Keyboard className='' /></span>System</Label>
                            <CreatableSelect
                                isClearable
                                  placeholder="Select or create"
                                onChange={(option) => handleSelectChange(option, 'system')}
                                options={systems.map((s) => ({ label: s.name, value: s.id }))}
                                value={getSelectedValue(data.system_id, data.new_system, systems)}
                            />
                            {errors.system_id && <p className="text-red-500 text-sm">{errors.system_id}</p>}
                        </div>
                    </div>
                    <div className='space-y-2'>
                        <Label>Asignar a inquilinos</Label>
                        <Select
                            isClearable
                            isMulti
                            options={tenants.map(t => ({ label: t.name, value: t.id }))}
                            onChange={(selected) =>
                                setData('tenants', selected?.map(s => s.value) || [])
                            }
                            value={data.tenants?.map(id => ({
                                label: tenants.find(t => t.id === id)?.name || '',
                                value: id
                            }))}
                        />
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {editMode ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </form>
            )}

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Brand</th>
                            <th className="px-4 py-2 text-left">Model</th>
                            <th className="px-4 py-2 text-left">System</th>
                            <th className="px-4 py-2 text-left">Share with</th>
                            <th className="px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deviceList.map((device) => {
console.log(device)
                            // Verificar si el dispositivo está compartid
                            return (
                                <tr key={device.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{device.name_device?.name}</td>
                                    <td className="px-4 py-2">{device.brand?.name}</td>
                                    <td className="px-4 py-2">{device.model?.name}</td>
                                    <td className="px-4 py-2">{device.system?.name}</td>
                                    <td>
                                        {device.shared_with?.map(tenant => (
                                            <span key={tenant.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                {tenant.name}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDevice(device);
                                                    setShowShareModal(true);
                                                }}
                                                className="text-green-600 hover:text-green-800"
                                            >
                                                <ShareIcon className="w-4 h-4" />
                                            </Button>

                                            <button
                                                onClick={() => handleEdit(device)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(device.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {deviceShareList.map((device) => {
console.log(device)
                            return (
                                <tr key={device.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{device.name_device?.name}</td>
                                    <td className="px-4 py-2">{device.brand?.name}</td>
                                    <td className="px-4 py-2">{device.model?.name}</td>
                                    <td className="px-4 py-2">{device.system?.name}</td>
                                    <td>
                                        {device.owner?.map(tenant => (
                                            <span key={tenant.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                {tenant.name}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="px-4 py-2">

                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {showShareModal && selectedDevice && (
                <DeviceShareModal
                    device={selectedDevice}
                    tenants={tenants.filter(t =>
                        !selectedDevice.tenants?.some(dt => dt.id === t.id)
                    )}
                    onClose={() => setShowShareModal(false)}
                    onShare={(tenantIds) => handleShareDevice(selectedDevice.id, tenantIds)}
                />
            )}
        </div>
    );
};

export default ModalDispositivos;


interface DeviceShareProps {
    device: Device;
    tenants: Tenant[];
    onShare: (deviceId: number, tenantIds: number[]) => void;
}
const DeviceShareModal = ({
    device,
    tenants,
    onClose,
    onShare
}: {
    device: Device;
    tenants: Tenant[];
    onClose: () => void;
    onShare: (tenantIds: number[]) => void;
}) => {
    const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
    const ownerId = device.owner?.[0]?.id;
    console.log(device)
    const availableTenants = tenants.filter(t =>
        t.id !== device.tenant_id &&
        !device.shared_with?.some(shared => shared.id === t.id)
    );
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compartir {device.name_device?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {availableTenants.map(tenant => (
                        <div key={tenant.id} className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedTenants.includes(tenant.id)}
                                onCheckedChange={(checked) => {
                                    const newSelection = checked
                                        ? [...selectedTenants, tenant.id]
                                        : selectedTenants.filter(id => id !== tenant.id);
                                    setSelectedTenants(newSelection);
                                }}
                            />
                            <Label>{tenant.name} ({tenant.email})</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => onShare(selectedTenants)}>
                        Compartir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
