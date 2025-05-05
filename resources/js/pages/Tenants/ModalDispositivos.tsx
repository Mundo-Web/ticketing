import { useForm } from '@inertiajs/react';
import { router } from '@inertiajs/core';


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Laptop2, ShieldCheck, ShieldPlus, ScanQrCodeIcon, Keyboard } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

interface Device {
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

interface ModalDispositivosProps {
    visible: boolean;
    onClose: () => void;
    departmentName: string;
    devices: Device[];
    brands: any[];
    models: any[];
    systems: any[];
    name_devices: any[];
    apartmentId: number;
}

const ModalDispositivos = ({
    visible,
    departmentName,
    devices,
    brands,
    models,
    systems,
    name_devices,
    apartmentId
}: ModalDispositivosProps) => {
    const [deviceList, setDeviceList] = useState<Device[]>(devices);
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
        apartment_id: apartmentId
    });

    const handleShowCreate = () => {
        reset();
        setShowForm(true);
        setEditMode(false);
    };

    const handleEdit = (device: Device) => {
        setData({
            id: device.id,
            name: device.name,
            brand_id: device.brand_id.toString(),
            model_id: device.model_id.toString(),
            system_id: device.system_id.toString(),
            name_device_id: device.name_device_id.toString(),
            new_brand: '',
            new_model: '',
            new_system: '',
            new_name_device: '',
            apartment_id: apartmentId
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
        };

        if (editMode) {

            try {
                const response = await axios.put(route('devices.update', data.id), payload);

                const updatedDevice = response.data.device;

                if (updatedDevice) {
                    setDeviceList(prev =>
                        prev.map(device => device.id === updatedDevice.id ? updatedDevice : device)
                    );
                    toast.success('Dispositivo creado exitosamente');
                    reset();
                    setShowForm(false);
                }
            } catch (error) {
                toast.error('Error al crear el dispositivo');
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
                <h2 className="text-xl font-bold">Dispositivos de {departmentName}</h2>
            </div>

            <Button onClick={handleShowCreate} className="mb-4">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Dispositivo
            </Button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 space-y-4">


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><Laptop2 className='' /></span>Nombre Dispositivo</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Seleccionar o crear nombre"
                                onChange={(option) => handleSelectChange(option, 'name_device')}
                                options={name_devices?.map((s) => ({ label: s.name, value: s.id }))}
                                value={getSelectedValue(data.name_device_id, data.new_name_device, name_devices)}
                            />
                            {errors.name_device_id && <p className="text-red-500 text-sm">{errors.name_device_id}</p>}
                        </div>
                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><ShieldPlus className='' /></span>Marca</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Seleccionar o crear marca"
                                onChange={(option) => handleSelectChange(option, 'brand')}
                                options={brands.map((b) => ({ label: b.name, value: b.id }))}
                                value={getSelectedValue(data.brand_id, data.new_brand, brands)}
                            />
                            {errors.brand_id && <p className="text-red-500 text-sm">{errors.brand_id}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><ScanQrCodeIcon className='' /></span>Modelo</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Seleccionar o crear modelo"
                                onChange={(option) => handleSelectChange(option, 'model')}
                                options={models.map((m) => ({ label: m.name, value: m.id }))}
                                value={getSelectedValue(data.model_id, data.new_model, models)}
                            />
                            {errors.model_id && <p className="text-red-500 text-sm">{errors.model_id}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label className='flex gap-2 items-center'><span><Keyboard className='' /></span>Sistema</Label>
                            <CreatableSelect
                                isClearable
                                placeholder="Seleccionar o crear sistema"
                                onChange={(option) => handleSelectChange(option, 'system')}
                                options={systems.map((s) => ({ label: s.name, value: s.id }))}
                                value={getSelectedValue(data.system_id, data.new_system, systems)}
                            />
                            {errors.system_id && <p className="text-red-500 text-sm">{errors.system_id}</p>}
                        </div>
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
                            <th className="px-4 py-2 text-left">Nombre</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Modelo</th>
                            <th className="px-4 py-2 text-left">Sistema</th>
                            <th className="px-4 py-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deviceList.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{device.name_device?.name}</td>
                                <td className="px-4 py-2">{device.brand?.name}</td>
                                <td className="px-4 py-2">{device.model?.name}</td>
                                <td className="px-4 py-2">{device.system?.name}</td>
                                <td className="px-4 py-2">
                                    <div className="flex gap-2">
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ModalDispositivos;
