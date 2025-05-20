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

    const handleShareDevice = async (deviceId: number, tenantIds: number[], unshareIds: number[] = []) => {
        try {
            // Asegurarse de que unshareIds sea un array válido
            const unshareIdsToSend = unshareIds;
            
            console.log("Compartiendo con:", tenantIds);
            console.log("Descompartiendo con:", unshareIdsToSend);
            
            const response = await axios.post(route('devices.share', deviceId), {
                tenant_id: tenantId,
                tenant_ids: tenantIds,
                apartment_id: apartmentId,
                unshare_tenant_ids: unshareIdsToSend  // Asegúrate de que este campo coincida con lo que espera tu backend
            });
    
            if (response.data.success) {
                const updatedDevice = response.data.device;
                
                // Actualizar lista de dispositivos propios
                setDeviceList(prev => 
                    prev.map(device => 
                        device.id === updatedDevice.id ? updatedDevice : device
                    )
                );
                
                // Verificar si el dispositivo actualizado está compartido con el inquilino actual
                const isSharedWithCurrentTenant = updatedDevice.shared_with?.some(sw => sw.id === tenantId);
                
                // Actualizar lista de dispositivos compartidos
                setDeviceShareList(prev => {
                    // Si el dispositivo ya no está compartido con este inquilino, eliminarlo de la lista
                    if (!isSharedWithCurrentTenant) {
                        return prev.filter(d => d.id !== updatedDevice.id);
                    }
                    
                    // Si el dispositivo está compartido con este inquilino, actualizarlo o agregarlo
                    const deviceExists = prev.some(d => d.id === updatedDevice.id);
                    if (deviceExists) {
                        return prev.map(d => d.id === updatedDevice.id ? updatedDevice : d);
                    } else {
                        return [...prev, updatedDevice];
                    }
                });
    
                toast.success(unshareIdsToSend.length > 0 ? 'Dispositivo actualizado exitosamente' : 'Dispositivo compartido exitosamente');
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

    const validateForm = () => {
        const errors: string[] = [];
        
        if (!data.name_device_id && !data.new_name_device) {
            errors.push('El nombre del dispositivo es requerido');
        }
        
        if (!data.brand_id && !data.new_brand) {
            errors.push('La marca es requerida');
        }
        
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }
        
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
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || (editMode ? 'Error al actualizar' : 'Error al crear');
            toast.error(errorMessage);
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

   console.log(tenants)
    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="min-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Devices of {tenantName} 
                        <span className="text-sm font-normal ml-2">
                            ({deviceList.length} own, {deviceShareList.length} shared)
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={handleShowCreate} className="gap-2">
                            <Plus className="w-4 h-4" /> New Device
                        </Button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Laptop2 className='w-4 h-4' /> Device
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'name_device')}
                                    options={name_devices?.map((s) => ({ label: s.name, value: s.id }))}
                                    value={getSelectedValue(data.name_device_id, data.new_name_device, name_devices)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ShieldPlus className='w-4 h-4' /> Brand
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'brand')}
                                    options={brands.map((b) => ({ label: b.name, value: b.id }))}
                                    value={getSelectedValue(data.brand_id, data.new_brand, brands)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ScanQrCodeIcon className='w-4 h-4' /> Model
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'model')}
                                    options={models.map((m) => ({ label: m.name, value: m.id }))}
                                    value={getSelectedValue(data.model_id, data.new_model, models)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Keyboard className='w-4 h-4' /> System
                                </Label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'system')}
                                    options={systems.map((s) => ({ label: s.name, value: s.id }))}
                                    value={getSelectedValue(data.system_id, data.new_system, systems)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <Label>Assign to tenants</Label>
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
                                {editMode ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </form>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Brand</th>
                                <th className="px-4 py-3 text-left font-medium">Model</th>
                                <th className="px-4 py-3 text-left font-medium">System</th>
                                <th className="px-4 py-3 text-left font-medium">Shared with</th>
                                <th className="px-4 py-3 text-left font-medium">Actions</th>
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
                                            {device.owner && (
                                                <span key={device.owner.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                    Own: {device.owner.name || (Array.isArray(device.owner) && device.owner[0]?.name) || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        Shared
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showShareModal && selectedDevice && (
                    <DeviceShareModal
                        device={selectedDevice}
                        tenants={tenants.filter(t => t.id !== tenantId)}
                        sharedWithIds={selectedDevice.shared_with?.map(t => t.id) || []}
                        onClose={() => setShowShareModal(false)}
                        onShare={(selectedIds, unshareIds) => handleShareDevice(selectedDevice.id, selectedIds, unshareIds)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

interface DeviceShareModalProps {
    device: Device;
    tenants: Tenant[];
    sharedWithIds: number[];
    onClose: () => void;
    onShare: (selectedIds: number[], unshareIds: number[]) => void;
}

const DeviceShareModal = ({ device, tenants, sharedWithIds, onClose, onShare }: DeviceShareModalProps) => {
    // Inicializar con los IDs de inquilinos con los que ya está compartido
    const [selectedTenants, setSelectedTenants] = useState<number[]>(sharedWithIds || []);
    const [unsharedTenants, setUnsharedTenants] = useState<number[]>([]);
    
    // Agregar un console.log para depuración
    useEffect(() => {
        console.log("Inquilinos seleccionados:", selectedTenants);
        console.log("Inquilinos descompartidos:", unsharedTenants);
    }, [selectedTenants, unsharedTenants]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Enviando descompartidos:", unsharedTenants);
        // Pasar los IDs seleccionados y los IDs para descompartir a la función onShare
        onShare(selectedTenants, unsharedTenants);
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartir dispositivo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <Label>Selecciona inquilinos para compartir</Label>
                        {tenants.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay inquilinos disponibles para compartir</p>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                                {tenants.map((tenant) => {
                                    const wasShared = sharedWithIds.includes(tenant.id);
                                    const isSelected = selectedTenants.includes(tenant.id);
                                    
                                    return (
                                        <div key={tenant.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tenant-${tenant.id}`}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        // Agregar a seleccionados
                                                        setSelectedTenants(prev => [...prev, tenant.id]);
                                                        // Si estaba en la lista de descompartidos, quitarlo
                                                        setUnsharedTenants(prev => prev.filter(id => id !== tenant.id));
                                                    } else {
                                                        // Quitar de seleccionados
                                                        setSelectedTenants(prev => prev.filter(id => id !== tenant.id));
                                                        // Si estaba compartido anteriormente, agregarlo a descompartidos
                                                        if (wasShared) {
                                                            setUnsharedTenants(prev => [...prev, tenant.id]);
                                                        }
                                                    }
                                                }}
                                            />
                                            <img src={`/storage/${tenant.photo}`} className='h-8 w-8 rounded-full object-cover'/>
                                            <Label htmlFor={`tenant-${tenant.id}`} className="cursor-pointer">
                                                {tenant.name}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModalDispositivos;