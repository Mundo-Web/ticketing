import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import { useState, useEffect } from 'react';
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
import Select from 'react-select';

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
    onClose,
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

    useEffect(() => {
        setDeviceList(devices);
        setDeviceShareList(shareDevice);
    }, [devices, shareDevice]);

    const { data, setData, reset } = useForm({
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
        tenants: [] as number[],
    });

    const handleShareDevice = async (deviceId: number, tenantIds: number[]) => {
        try {
            const response = await axios.post(route('devices.share', deviceId), {
                tenant_id: tenantId,
                tenant_ids: tenantIds,
                apartment_id: apartmentId
            });

            if (response.data.success) {
                const updatedDevice = response.data.device;
                
                // Actualizar lista de dispositivos propios
                setDeviceList(prev => 
                    prev.map(device => 
                        device.id === updatedDevice.id ? updatedDevice : device
                    )
                );
                
                // Actualizar lista de dispositivos compartidos
                setDeviceShareList(prev => {
                    const filtered = prev.filter(d => 
                        d.id !== updatedDevice.id || 
                        updatedDevice.shared_with?.some(sw => sw.id === tenantId)
                    );
                    
                    if (updatedDevice.shared_with?.some(sw => tenantIds.includes(sw.id))) {
                        return [...filtered, updatedDevice];
                    }
                    return filtered;
                });

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
            tenant_id: tenantId,
            tenants: device.tenants?.map(t => t.id) || []
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
            tenants: data.tenants || []
        };

        try {
            let response;
            if (editMode) {
                response = await axios.put(route('devices.update', data.id), payload);
            } else {
                response = await axios.post(route('devices.store'), payload);
            }

            const updatedDevice = response.data.device;
            if (updatedDevice) {
                if (editMode) {
                    setDeviceList(prev =>
                        prev.map(device => 
                            device.id === updatedDevice.id ? updatedDevice : device
                        )
                    );
                } else {
                    setDeviceList(prev => [...prev, updatedDevice]);
                }
                
                toast.success(editMode ? 'Dispositivo actualizado' : 'Dispositivo creado');
                reset();
                setShowForm(false);
            }
        } catch (error) {
            toast.error(editMode ? 'Error al actualizar' : 'Error al crear');
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(route('devices.destroy', id));
            setDeviceList(prev => prev.filter(device => device.id !== id));
            setDeviceShareList(prev => prev.filter(device => device.id !== id));
            toast.success('Dispositivo eliminado');
        } catch (error) {
            toast.error('Error al eliminar');
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
                [key_new]: selected.label
            });
        } else {
            setData({
                ...data,
                [key_id]: selected.value,
                [key_new]: ''
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

    if (!visible) return null;

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="min-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Dispositivos de {tenantName} 
                        <span className="text-sm font-normal ml-2">
                            ({deviceList.length} propios, {deviceShareList.length} compartidos)
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={handleShowCreate} className="gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Dispositivo
                        </Button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Laptop2 className='w-4 h-4' /> Dispositivo
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Seleccionar o crear"
                                    onChange={(option) => handleSelectChange(option, 'name_device')}
                                    options={name_devices?.map((s) => ({ label: s.name, value: s.id }))}
                                    value={getSelectedValue(data.name_device_id, data.new_name_device, name_devices)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ShieldPlus className='w-4 h-4' /> Marca
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Seleccionar o crear"
                                    onChange={(option) => handleSelectChange(option, 'brand')}
                                    options={brands.map((b) => ({ label: b.name, value: b.id }))}
                                    value={getSelectedValue(data.brand_id, data.new_brand, brands)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ScanQrCodeIcon className='w-4 h-4' /> Modelo
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Seleccionar o crear"
                                    onChange={(option) => handleSelectChange(option, 'model')}
                                    options={models.map((m) => ({ label: m.name, value: m.id }))}
                                    value={getSelectedValue(data.model_id, data.new_model, models)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Keyboard className='w-4 h-4' /> Sistema
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Seleccionar o crear"
                                    onChange={(option) => handleSelectChange(option, 'system')}
                                    options={systems.map((s) => ({ label: s.name, value: s.id }))}
                                    value={getSelectedValue(data.system_id, data.new_system, systems)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
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
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowForm(false)}
                                className="px-6"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                className="px-6"
                            >
                                {editMode ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </div>
                    </form>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium">Marca</th>
                                <th className="px-4 py-3 text-left font-medium">Modelo</th>
                                <th className="px-4 py-3 text-left font-medium">Sistema</th>
                                <th className="px-4 py-3 text-left font-medium">Compartido con</th>
                                <th className="px-4 py-3 text-left font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deviceList.map((device) => (
                                <tr key={device.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-4 py-3">{device.name_device?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.brand?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.model?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.system?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {device.shared_with?.map(tenant => (
                                                <span key={tenant.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {tenant.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(device)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(device.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {deviceShareList.map((device) => (
                                <tr key={`shared-${device.id}`} className="hover:bg-gray-50 border-b bg-blue-50">
                                    <td className="px-4 py-3">{device.name_device?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.brand?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.model?.name || '-'}</td>
                                    <td className="px-4 py-3">{device.system?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {device.owner?.map(tenant => (
                                                <span key={tenant.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                    Dueño: {tenant.name}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        Compartido
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showShareModal && selectedDevice && (
                    <DeviceShareModal
                        device={selectedDevice}
                        tenants={tenants.filter(t =>
                            t.id !== tenantId &&
                            !selectedDevice.shared_with?.some(sw => sw.id === t.id)
                        )}
                        onClose={() => setShowShareModal(false)}
                        onShare={(tenantIds) => handleShareDevice(selectedDevice.id, tenantIds)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

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

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Compartir {device.name_device?.name || 'dispositivo'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {tenants.length > 0 ? (
                        tenants.map(tenant => (
                            <div key={tenant.id} className="flex items-center gap-3">
                                <Checkbox
                                    id={`share-tenant-${tenant.id}`}
                                    checked={selectedTenants.includes(tenant.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedTenants(prev =>
                                            checked
                                                ? [...prev, tenant.id]
                                                : prev.filter(id => id !== tenant.id)
                         ) }}
                                />
                                <Label htmlFor={`share-tenant-${tenant.id}`} className="flex items-center gap-2">
                                    {tenant.photo && (
                                        <img 
                                            src={`/storage/${tenant.photo}`} 
                                            alt={tenant.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{tenant.name}</p>
                                        <p className="text-sm text-gray-500">{tenant.email}</p>
                                    </div>
                                </Label>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-4">No hay inquilinos disponibles para compartir</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button 
                        onClick={() => onShare(selectedTenants)}
                        disabled={selectedTenants.length === 0}
                    >
                        Compartir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ModalDispositivos;