import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Laptop2, ShieldCheck, ShieldPlus, ScanQrCodeIcon, Keyboard, ShareIcon, MapPin, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';
import { Checkbox } from '@/components/ui/checkbox';
import { Device } from '@/types/models/Device.d';
import { Tenant } from '@/types/models/Tenant';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Select, { components } from 'react-select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DeviceIcon from '@/components/DeviceIcon';
import { getDeviceIconsByCategory } from '@/utils/deviceIcons';

// Helper para routes (Ziggy)
declare global {
    function route(name: string, params?: any): string;
}

interface ModalDispositivosProps {
    visible: boolean;
    onClose: () => void;
    tenantName: Tenant;
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

    console.log(deviceShareList)
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // Estados locales para las opciones
    const [localBrands, setLocalBrands] = useState(brands);
    const [localModels, setLocalModels] = useState(models);
    const [localSystems, setLocalSystems] = useState(systems);
    const [localNameDevices, setLocalNameDevices] = useState(name_devices);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        type: string;
        id: number | null;
        deviceCount?: number;
        canForce?: boolean;
    }>({ type: '', id: null });
    
    // Función para exportar dispositivos en NinjaOne
    const exportNinjaOneDevices = async (exportType: 'all' | 'building' | 'apartment') => {
        try {
            // Filtrar dispositivos que están en NinjaOne
            const ninjaOneDevices = deviceList.filter(device => device.is_in_ninjaone === true);
            
            if (ninjaOneDevices.length === 0) {
                toast.error('No hay dispositivos en NinjaOne para exportar');
                return;
            }
            
            let url = '';
            let data = {};
            
            switch (exportType) {
                case 'all':
                    url = route('devices.export.ninjaone');
                    data = { devices: ninjaOneDevices.map(d => d.id) };
                    break;
                case 'building':
                    url = route('devices.export.ninjaone.building');
                    data = { 
                        tenant_id: tenantId,
                        // Si no tenemos building_id, usamos el apartmentId para que el backend resuelva
                        apartment_id: apartmentId 
                    };
                    break;
                case 'apartment':
                    url = route('devices.export.ninjaone.apartment');
                    data = { 
                        tenant_id: tenantId,
                        apartment_id: apartmentId
                    };
                    break;
            }
            
            const response = await axios.post(url, data, {
                responseType: 'blob'
            });
            
            // Crear un blob y un enlace para descargar
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `ninjaone-devices-${exportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success(`Dispositivos exportados correctamente (${exportType})`);
        } catch (error) {
            console.error('Error exporting devices:', error);
            toast.error('Error al exportar dispositivos');
        }
    };
    useEffect(() => {
        setDeviceList(devices);
        setDeviceShareList(shareDevice);
        // Sincronizar estados locales cuando cambian las props
        setLocalBrands(brands);
        setLocalModels(models);
        setLocalSystems(systems);
        setLocalNameDevices(name_devices);
    }, [devices, shareDevice, brands, models, systems, name_devices]);



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
        ubicacion: '',
        icon_id: '',
        is_in_ninjaone: false as boolean,
    });

    const handleShareDevice = async (deviceId: number, tenantIds: number[], unshareIds: number[] = []) => {
        try {
            const response = await axios.post(route('devices.share', deviceId), {
                tenant_id: tenantId,
                tenant_ids: tenantIds,
                apartment_id: apartmentId,
                unshare_tenant_ids: unshareIds
            });

            if (response.data.success) {
                const updatedDevice = response.data.device;

                console.log(updatedDevice)
                setDeviceList(prev =>
                    prev.map(device =>
                        device.id === updatedDevice.id ? updatedDevice : device
                    )
                );

                const isSharedWithCurrentTenant = updatedDevice.shared_with?.some(sw => sw.id === tenantId);

                setDeviceShareList(prev => {
                    if (!isSharedWithCurrentTenant) {
                        return prev.filter(d => d.id !== updatedDevice.id);
                    }

                    const deviceExists = prev.some(d => d.id === updatedDevice.id);
                    return deviceExists ? prev.map(d => d.id === updatedDevice.id ? updatedDevice : d) : [...prev, updatedDevice];
                });

                toast.success(unshareIds.length > 0 ? 'Device updated' : 'Device shared');
                setShowShareModal(false);
            }
        } catch (error) {
            console.error('Error sharing device:', error);
            toast.error('Error sharing device');
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
            tenants: device.tenants?.map(t => t.id) || [],
            ubicacion: device.ubicacion || '',
            icon_id: device.icon_id || '',
            is_in_ninjaone: device.is_in_ninjaone || false
        });
        setShowForm(true);
        setEditMode(true);
    };

    const validateForm = () => {
        const errors: string[] = [];
        if (!data.name_device_id && !data.new_name_device) errors.push('Device name required');
        if (!data.brand_id && !data.new_brand) errors.push('Marca requerida');
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }

        // Asegurarse de que los campos dependientes solo se envíen si el padre está seleccionado
        const payload = {
            ...data,
            ...(data.new_brand && { brand: data.new_brand }),
            // Solo enviar model_id o new_model si brand_id está seleccionado
            ...(data.brand_id && data.model_id && { model_id: data.model_id }),
            ...(data.brand_id && data.new_model && { model: data.new_model }),
            // Solo enviar system_id o new_system si model_id está seleccionado
            ...(data.model_id && data.system_id && { system_id: data.system_id }),
            ...(data.model_id && data.new_system && { system: data.new_system }),
            ...(data.new_name_device && { name_device: data.new_name_device }),
            tenants: data.tenants || []
        };

        try {
            const response = editMode
                ? await axios.put(route('devices.update', data.id!), payload)
                : await axios.post(route('devices.store'), payload);

            const updatedDevice = response.data.device;
            console.log(updatedDevice)

            if (updatedDevice) {
                setDeviceList(prev => editMode
                    ? prev.map(d => d.id === updatedDevice.id ? updatedDevice : d)
                    : [...prev, updatedDevice]
                );

                if (data.new_name_device && updatedDevice.name_device) {
                    const newList = [...localNameDevices, updatedDevice.name_device];
                    setLocalNameDevices(newList);
                }

                if (data.new_brand && updatedDevice.brand) {
                    const newList = [...localBrands, updatedDevice.brand];
                    setLocalBrands(newList);
                }

                if (data.new_model && updatedDevice.model) {
                    const newList = [...localModels, updatedDevice.model];
                    setLocalModels(newList);
                }
                if (data.new_system && updatedDevice.system) {
                    const newList = [...localSystems, updatedDevice.system];
                    setLocalSystems(newList);
                }
                toast.success(editMode ? 'Device updated' : 'Device created');
                reset();
                setShowForm(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (editMode ? 'Error al actualizar' : 'Error al crear'));
        }
    };



    const handleDelete = async (id: number) => {
        try {
            await axios.delete(route('devices.removeFromTenant', id), {
                data: { tenant_id: tenantId }
            });
            setDeviceList(prev => prev.filter(d => d.id !== id));
            setDeviceShareList(prev => prev.filter(d => d.id !== id));
            toast.success('Device removed from tenant successfully');
        } catch {
            toast.error('Error removing device from tenant');
        }
    };

    // Modal de confirmación de eliminación
    const ConfirmDeleteModal = () => (
        <Dialog open={!!deleteConfirmation.id} onOpenChange={() => setDeleteConfirmation({ type: '', id: null })}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {deleteConfirmation.canForce ? 'Force Delete Confirmation' : 'Delete Confirmation'}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {deleteConfirmation.canForce ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="text-yellow-600">⚠️</div>
                                    <div>
                                        <h3 className="font-medium text-yellow-800">
                                            This item is currently in use
                                        </h3>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            There are {deleteConfirmation.deviceCount} device(s) using this {deleteConfirmation.type}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    What would you like to do?
                                </p>

                                <div className="grid gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirmation({ type: '', id: null })}
                                        className="justify-start h-auto p-4"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium">Cancel</div>
                                            <div className="text-sm ">Don't delete anything</div>
                                        </div>
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (deleteConfirmation.id) {
                                                confirmDelete(deleteConfirmation.id, deleteConfirmation.type as 'brand' | 'model' | 'system' | 'name_device', true);
                                            }
                                        }}
                                        className="justify-start h-auto p-4"
                                    >
                                        <div className="text-left">
                                            <div className="font-medium">Force Delete</div>
                                            <div className="text-sm opacity-90">
                                                Delete the {deleteConfirmation.type} and remove all associated devices
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Are you sure you want to permanently delete this item?</p>
                    )}
                </div>

                {!deleteConfirmation.canForce && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmation({ type: '', id: null })}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirmation.id) {
                                    confirmDelete(deleteConfirmation.id, deleteConfirmation.type as 'brand' | 'model' | 'system' | 'name_device');
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );

    const handleDeleteItem = (id: number, type: 'brand' | 'model' | 'system' | 'name_device') => {
        setDeleteConfirmation({ type, id });
    };

    const confirmDelete = async (id: number, type: 'brand' | 'model' | 'system' | 'name_device', force: boolean = false) => {
        try {
            const endpoint = {
                brand: 'brands.destroy',
                model: 'models.destroy',
                system: 'systems.destroy',
                name_device: 'name_devices.destroy'
            }[type];

            console.log(`Eliminando ${type} con ID: ${id}, endpoint: ${endpoint}, force: ${force}`);
            console.log(`URL generada: ${route(endpoint, id)}`);

            const response = await axios.delete(route(endpoint, id), {
                data: { force }
            });
            console.log('Respuesta del servidor:', response);

            // Check for successful response
            if (response.status === 200 && response.data.success) {
                toast.success(response.data.message || `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);

                // Update local state
                switch (type) {
                    case 'brand':
                        setLocalBrands(prev => prev.filter(b => b.id !== id));
                        if (data.brand_id === id.toString()) {
                            setData({ ...data, brand_id: '', new_brand: '', model_id: '', new_model: '', system_id: '', new_system: '' });
                        }
                        break;
                    case 'model':
                        setLocalModels(prev => prev.filter(m => m.id !== id));
                        if (data.model_id === id.toString()) {
                            setData({ ...data, model_id: '', new_model: '', system_id: '', new_system: '' });
                        }
                        break;
                    case 'system':
                        setLocalSystems(prev => prev.filter(s => s.id !== id));
                        if (data.system_id === id.toString()) {
                            setData({ ...data, system_id: '', new_system: '' });
                        }
                        break;
                    case 'name_device':
                        setLocalNameDevices(prev => prev.filter(nd => nd.id !== id));
                        if (data.name_device_id === id.toString()) {
                            setData({ ...data, name_device_id: '', new_name_device: '', brand_id: '', new_brand: '', model_id: '', new_model: '', system_id: '', new_system: '' });
                        }
                        break;
                }

                // If forced, reload device list to reflect changes
                if (force) {
                    window.location.reload();
                }
            }
        } catch (error: unknown) {
            console.error('Error deleting:', error);
            const axiosError = error as any;
            console.error('Respuesta del servidor:', axiosError.response);

            if (axiosError.response?.status === 422 && axiosError.response?.data?.can_force) {
                // Show option to force delete
                setDeleteConfirmation({
                    type,
                    id,
                    deviceCount: axiosError.response.data.devices_count,
                    canForce: true
                });
                toast.error(axiosError.response.data.message);
                return; // Don't close the modal yet
            } else if (axiosError.response?.data?.message) {
                toast.error(axiosError.response.data.message);
            } else {
                toast.error(`Error deleting ${type}: ${axiosError.message}`);
            }

            // Close modal if it's not a force-delete scenario
            setDeleteConfirmation({ type: '', id: null });
        }
    };

    /**EDIT */
    // Estados nuevos para edición
    const [editItem, setEditItem] = useState<{
        type: 'brand' | 'model' | 'system' | 'name_device';
        id: number;
        name: string;
    } | null>(null);

    const EditModal = () => {
        const [editName, setEditName] = useState('');

        const handleSave = async () => {
            if (!editItem) return;

            try {
                await axios.put(route(
                    {
                        brand: 'brands.update',
                        model: 'models.update',
                        system: 'systems.update',
                        name_device: 'name_devices.update'
                    }[editItem.type], editItem.id), {
                    name: editName
                });

                // Update local state with new name
                switch (editItem.type) {
                    case 'brand':
                        setLocalBrands(prev =>
                            prev.map(b => b.id === editItem.id ? { ...b, name: editName } : b)
                        );
                        break;
                    case 'model':
                        setLocalModels(prev =>
                            prev.map(m => m.id === editItem.id ? { ...m, name: editName } : m)
                        );
                        break;
                    case 'system':
                        setLocalSystems(prev =>
                            prev.map(s => s.id === editItem.id ? { ...s, name: editName } : s)
                        );
                        break;
                    case 'name_device':
                        setLocalNameDevices(prev =>
                            prev.map(n => n.id === editItem.id ? { ...n, name: editName } : n)
                        );
                        break;
                }

                toast.success('Updated successfully');
                setEditItem(null);
            } catch (error) {
                console.error('Error updating:', error);
                toast.error('Error updating');
            }
        };

        return (
            <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
                <DialogContent className="sm:max-w-[425px]">                <DialogHeader>
                    <DialogTitle>Edit {editItem?.type}</DialogTitle>
                </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={editName || editItem?.name || ''}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditItem(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    // Handler para guardar cambios - Removed as it's now integrated into EditModal

    const CustomOption = ({ children, ...props }: any) => (
        <components.Option {...props}>
            <div className="flex items-center justify-between w-full">
                <div>{children}</div>
                {!props.data.__isNew__ && props.data.value && (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditItem({
                                    type: props.data.type,
                                    id: parseInt(props.data.value),
                                    name: props.data.label
                                });
                            }}
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(
                                    parseInt(props.data.value),
                                    props.data.type
                                );
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        </components.Option>
    );

    // Estados para filtros relacionados
    const [filteredBrands, setFilteredBrands] = useState(localBrands);
    const [filteredModels, setFilteredModels] = useState(localModels);
    const [filteredSystems, setFilteredSystems] = useState(localSystems);
    const [filteredNameDevices, setFilteredNameDevices] = useState(localNameDevices);

    // Función para filtrar modelos basados en la marca seleccionada

    const filterBrandsByName = (NameDeviceId: string) => {
        if (!NameDeviceId) {
            setFilteredBrands(localBrands);
            return;
        }

        const filtered = localBrands.filter(brand => brand.name_device_id?.toString() === NameDeviceId);
        setFilteredBrands(filtered.length > 0 ? filtered : localBrands);
    };

    const filterModelsByBrand = (brandId: string) => {
        if (!brandId) {
            setFilteredModels(models);
            return;
        }

        const filtered = models.filter(model => model.brand_id?.toString() === brandId);
        setFilteredModels(filtered.length > 0 ? filtered : models);
    };

    // Función para filtrar sistemas basados en el modelo seleccionado
    const filterSystemsByModel = (modelId: string) => {
        if (!modelId) {
            setFilteredSystems(systems);
            return;
        }

        const filtered = systems.filter(system => system.model_id?.toString() === modelId);
        setFilteredSystems(filtered.length > 0 ? filtered : systems);
    };

    // Function to filter device names based on selected system
    const filterNameDevicesBySystem = (systemId: string) => {
        if (!systemId) {
            setFilteredNameDevices(name_devices);
            return;
        }

        const filtered = name_devices.filter(nameDevice => nameDevice.system_id?.toString() === systemId);
        setFilteredNameDevices(filtered.length > 0 ? filtered : name_devices);
    };

    // Actualizar filtros cuando cambia la selección
    useEffect(() => {

        if (data.name_device_id) {
            filterBrandsByName(data.name_device_id);
        }

        if (data.new_name_device) {
            setFilteredBrands([]);
            setFilteredModels([]);
            setFilteredSystems([]);
        }



        if (data.brand_id) {
            filterModelsByBrand(data.brand_id);
        }

        if (data.new_brand) {
            setFilteredModels([]);
            setFilteredSystems([]);
        }

        if (data.model_id) {
            filterSystemsByModel(data.model_id);
        }

        if (data.new_model) {
            setFilteredSystems([]);
        }

        if (data.system_id) {
            filterNameDevicesBySystem(data.system_id);
        }
    }, [data.brand_id, data.name_device_id, data.model_id, data.system_id, data.new_name_device, data.new_brand, data.new_model, data.new_system]);


    useEffect(() => {

        setFilteredNameDevices(localNameDevices);
        setFilteredBrands(localBrands);
        setFilteredModels(localModels);
        setFilteredSystems(localSystems);

    }, [localNameDevices, localBrands, localModels, localSystems]);


    const handleSelectChange = (selected: any, type: 'brand' | 'model' | 'system' | 'name_device') => {
        const isNew = selected?.__isNew__ ?? false;
        const key_id = `${type}_id`;
        const key_new = `new_${type}`;

        setData({
            ...data,
            [key_id]: isNew ? '' : selected?.value || '',
            [key_new]: isNew ? selected?.label : ''
        });

        // Aplicar filtros cuando cambia la selección
        if (type === 'name_device' && !isNew) {
            filterBrandsByName(selected?.value || '');
            setData(prev => ({
                ...prev,
                brand_id: '',
                new_brand: '',
                model_id: '',
                new_model: '',
                system_id: '',
                new_system: '',

            }));

        }
        else if (type === 'brand' && !isNew) {
            filterModelsByBrand(selected?.value || '');
            // Resetear selecciones dependientes
            setData(prev => ({
                ...prev,
                model_id: '',
                new_model: '',
                system_id: '',
                new_system: '',

            }));
        } else if (type === 'model' && !isNew) {
            filterSystemsByModel(selected?.value || '');
            // Resetear selecciones dependientes
            setData(prev => ({
                ...prev,
                system_id: '',
                new_system: '',

            }));
        } else if (type === 'system' && !isNew) {
            filterNameDevicesBySystem(selected?.value || '');
            // Resetear selecciones dependientes
            setData(prev => ({
                ...prev,

            }));
        }
    };

    const getSelectedValue = (id: string | number, newValue: string, list: any[]) => {
        if (newValue) return { label: newValue, value: '' };
        const item = list?.find(el => el.id.toString() === id?.toString());
        return item ? { label: item.name, value: item.id } : null;
    };

    const prepareOptions = (items: any[], type: 'brand' | 'model' | 'system' | 'name_device') => {
        return items?.map(item => ({
            label: item.name,
            value: item.id.toString(),
            type: type,
            __isNew__: false
        }));
    };

    if (!visible) return null;

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="min-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex justify-between relative">
                        <div>
                            Devices of {tenantName?.name}
                            <span className="text-sm font-normal ml-2">
                                ({deviceList.length} owned, {deviceShareList.length} shared with me)
                            </span>
                        </div>
                        <div className='relative mx-4'>
                            <img
                                src={`/storage/${tenantName?.photo}`}
                                alt={tenantName?.name}
                                className="w-20 h-20 object-cover rounded-full border-4 border-secondary fixed right-16"
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                }}
                            />
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                        <Button onClick={handleShowCreate} className="gap-2">
                            <Plus className="w-4 h-4" /> New Device
                        </Button>
                        
                        <div className="dropdown relative">
                            <Button variant="outline" className="gap-2 flex items-center">
                                <ShieldPlus className="w-4 h-4" /> Export NinjaOne Devices
                                <div className="ml-1 border-l border-gray-300 h-4"></div>
                                <span className="text-xs">▼</span>
                            </Button>
                            <div className="dropdown-content absolute hidden bg-white shadow-md rounded-md mt-1 py-1 w-48 z-10">
                                <button 
                                    onClick={() => exportNinjaOneDevices('all')} 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <ShieldCheck className="w-4 h-4" /> All Devices
                                </button>
                                <button 
                                    onClick={() => exportNinjaOneDevices('building')} 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" /> By Building
                                </button>
                                <button 
                                    onClick={() => exportNinjaOneDevices('apartment')} 
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" /> By Apartment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    {`.dropdown:hover .dropdown-content {
                        display: block;
                    }`}
                </style>

                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-6 space-y-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Campo Name Device */}
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Laptop2 className='w-4 h-4' /> Device
                                </Label>
                                <CreatableSelect
                                    components={{ Option: CustomOption }}
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'name_device')}
                                    options={prepareOptions(filteredNameDevices, 'name_device')}
                                    value={getSelectedValue(data.name_device_id, data.new_name_device, filteredNameDevices)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            {/* Campo Device Icon */}
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <DeviceIcon deviceIconId={data.icon_id} size={16} /> Device Icon
                                </Label>
                                <Select
                                    isClearable
                                    placeholder="Select device icon"
                                    onChange={(option) => setData('icon_id', option?.value || '')}
                                    options={(() => {
                                        const categories = getDeviceIconsByCategory();
                                        const allDevices = Object.values(categories).flatMap(category => category.devices);
                                        return allDevices.map(device => ({
                                            label: device.name,
                                            value: device.id,
                                            icon: device.icon,
                                            color: device.color
                                        }));
                                    })()}
                                    value={(() => {
                                        if (!data.icon_id) return null;
                                        const categories = getDeviceIconsByCategory();
                                        const allDevices = Object.values(categories).flatMap(category => category.devices);
                                        const device = allDevices.find(d => d.id === data.icon_id);
                                        return device ? {
                                            label: device.name,
                                            value: device.id,
                                            icon: device.icon,
                                            color: device.color
                                        } : null;
                                    })()}
                                    components={{
                                        Option: ({ children, ...props }) => (
                                            <components.Option {...props}>
                                                <div className="flex items-center gap-3">
                                                    <DeviceIcon deviceIconId={props.data.value} size={20} />
                                                    <span>{children}</span>
                                                </div>
                                            </components.Option>
                                        ),
                                        SingleValue: ({ children, ...props }) => (
                                            <components.SingleValue {...props}>
                                                <div className="flex items-center gap-2">
                                                    <DeviceIcon deviceIconId={props.data.value} size={16} />
                                                    <span>{children}</span>
                                                </div>
                                            </components.SingleValue>
                                        )
                                    }}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            {/* Campo Brand */}
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ShieldPlus className='w-4 h-4' /> Brand
                                </Label>
                                <CreatableSelect
                                    isDisabled={!data.name_device_id && !data.new_name_device}
                                    components={{ Option: CustomOption }}
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'brand')}
                                    options={prepareOptions(filteredBrands, 'brand')}
                                    value={getSelectedValue(data.brand_id, data.new_brand, filteredBrands)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            {/* Campo Model */}
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <ScanQrCodeIcon className='w-4 h-4' /> Model
                                </Label>
                                <CreatableSelect
                                    isDisabled={(!data.brand_id && !data.new_brand)}
                                    components={{ Option: CustomOption }}
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'model')}
                                    options={prepareOptions(filteredModels, 'model')}
                                    value={getSelectedValue(data.model_id, data.new_model, filteredModels)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>

                            {/* Campo System */}
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Keyboard className='w-4 h-4' /> System
                                </Label>
                                <CreatableSelect
                                    isDisabled={(!data.model_id && !data.new_model)}
                                    components={{ Option: CustomOption }}
                                    isClearable
                                    placeholder="Select or create"
                                    onChange={(option) => handleSelectChange(option, 'system')}
                                    options={prepareOptions(filteredSystems, 'system')}
                                    value={getSelectedValue(data.system_id, data.new_system, filteredSystems)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                />
                            </div>
                        </div>

                        {/* Campo Ubicación */}
                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'>
                                <MapPin className='w-4 h-4' /> Location/Description
                            </Label>
                            <Textarea
                                placeholder="Enter device location or description (optional)"
                                value={data.ubicacion}
                                onChange={(e) => setData('ubicacion', e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Campo NinjaOne */}
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id="ninjaone"
                                checked={data.is_in_ninjaone}
                                onCheckedChange={(checked) => setData('is_in_ninjaone', Boolean(checked))}
                            />
                            <Label htmlFor="ninjaone" className="flex gap-2 items-center">
                                <ShieldCheck className='w-4 h-4' /> Device is in NinjaOne
                            </Label>
                        </div>
                        
                        {/* Campo Name para conectar con NinjaOne */}
                        {data.is_in_ninjaone && (
                            <div className='space-y-2'>
                                <Label className='flex gap-2 items-center'>
                                    <Tag className='w-4 h-4' /> NinjaOne Device Name
                                </Label>
                                <Input
                                    placeholder="Enter device name as it appears in NinjaOne"
                                    value={data.name || ''}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <p className="text-xs text-gray-500">
                                    Enter the System Name as shown in NinjaOne (e.g., DESKTOP-6VEP452, DAMIANPC)
                                </p>
                            </div>
                        )}

                        <div className='space-y-2'>
                            <Label>Sharing with members</Label>
                            <Select
                                isMulti
                                options={tenants.filter(t => t.id !== tenantId).map(t => ({ label: t.name, value: t.id }))}
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
                            <Button variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editMode ? 'Update' : 'Save'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Tabla de dispositivos */}
                <div className="border rounded-lg overflow-visible">
                    <table className="w-full">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Name</th>
                                    <th className="px-4 py-3 text-left font-medium">Brand</th>
                                    <th className="px-4 py-3 text-left font-medium">Model</th>
                                    <th className="px-4 py-3 text-left font-medium">System</th>
                                    <th className="px-4 py-3 text-left font-medium">Location</th>
                                    <th className="px-4 py-3 text-left font-medium">NinjaOne</th>
                                    <th className="px-4 py-3 text-left font-medium">Shared with</th>
                                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deviceList.map((device) => (
                                    <tr key={device.id} className="hover:bg-gray-50 border-b">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <DeviceIcon 
                                                    deviceIconId={device.icon_id} 
                                                    size={20} 
                                                />
                                                <span>{device.name_device?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{device.brand?.name || '-'}</td>
                                        <td className="px-4 py-3">{device.model?.name || '-'}</td>
                                        <td className="px-4 py-3">{device.system?.name || '-'}</td>
                                        <td className="px-4 py-3 max-w-32">
                                            <div className="text-sm text-gray-600 truncate" title={device.ubicacion}>
                                                {device.ubicacion || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {device.is_in_ninjaone ? (
                                                <div className="flex items-center">
                                                    <ShieldCheck className="w-4 h-4 text-green-500 mr-1" />
                                                    <div className="flex flex-col">
                                                        <span className="text-green-600">Yes</span>
                                                        {device.name && (
                                                            <span className="text-xs text-gray-500">
                                                                System: {device.name}
                                                            </span>
                                                        )}
                                                        {!device.name && (
                                                            <span className="text-xs text-orange-500">
                                                                ⚠️ No system name
                                                            </span>
                                                        )}
                                                        {device.ninjaone_status && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                {device.ninjaone_status === 'healthy' && (
                                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <CheckCircle className="w-3 h-3" /> Healthy
                                                                    </span>
                                                                )}
                                                                {device.ninjaone_status === 'warning' && (
                                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Warning
                                                                    </span>
                                                                )}
                                                                {device.ninjaone_status === 'critical' && (
                                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Critical
                                                                    </span>
                                                                )}
                                                                {device.ninjaone_status === 'offline' && (
                                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Offline
                                                                    </span>
                                                                )}
                                                                {device.ninjaone_status === 'maintenance' && (
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Maintenance
                                                                    </span>
                                                                )}
                                                                {device.ninjaone_status === 'unknown' && (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Unknown
                                                                    </span>
                                                                )}
                                                                {(device.ninjaone_issues_count || 0) > 0 && (
                                                                    <span className="text-xs text-red-600 ml-1">
                                                                        ({device.ninjaone_issues_count} issues)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {device.shared_with?.map(tenant => {
                                                    console.log(tenant);
                                                    return (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <img
                                                                        key={tenant.photo}
                                                                        src={tenant.photo ? `/storage/${tenant.photo}?v=${Date.now()}` : '/images/default-avatar.png'}
                                                                        alt={tenant.name}
                                                                        className="w-8 h-8 object-cover rounded-full border-2 border-blue-400"
                                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                            e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                                                        }}
                                                                    /></TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{tenant.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>




                                                    )
                                                })}
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
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(device.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Remove device from this tenant</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {deviceShareList.map((device) => (
                                    <tr key={`shared-${device.id}`} className="hover:bg-gray-50 border-b bg-blue-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <DeviceIcon 
                                                    deviceIconId={device.icon_id} 
                                                    size={20} 
                                                />
                                                <span>{device.name_device?.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{device.brand?.name || '-'}</td>
                                        <td className="px-4 py-3">{device.model?.name || '-'}</td>
                                        <td className="px-4 py-3">{device.system?.name || '-'}</td>
                                        <td className="px-4 py-3 max-w-32">
                                            <div className="text-sm text-gray-600 truncate" title={device.ubicacion}>
                                                {device.ubicacion || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {device.owner && (


                                                    <TooltipProvider key={`owner-${device.id}`}>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <img
                                                                    src={device.owner ? `/storage/${device?.owner[0].photo}` : '/images/default-avatar.png'}
                                                                    alt={device.owner[0].name}
                                                                    className="w-8 h-8 object-cover rounded-full border-2 border-green-500"
                                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                        e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                                                    }}
                                                                /></TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>  Own: {device.owner[0].name || (Array.isArray(device.owner) && device.owner[0]?.name) || 'Unknown'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

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
                <EditModal />
                <ConfirmDeleteModal />
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
                    <DialogTitle>Share device</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-4">
                        <Label>Select tenants to share with</Label>
                        {tenants.length === 0 ? (
                            <p className="text-sm text-gray-500">No tenants available to share with</p>
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
                                            <img src={`/storage/${tenant.photo}`} className='h-8 w-8 rounded-full object-cover' onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                e.currentTarget.src = '/images/default-user.png'; // Ruta de imagen por defecto
                                            }} />
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
                            Cancel                        </Button>
                        <Button type="submit">
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ModalDispositivos;
