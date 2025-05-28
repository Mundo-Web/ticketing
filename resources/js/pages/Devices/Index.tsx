
import AppLayout from '@/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Laptop, Users, Building2, Home, Share2, Edit, Trash2, Cpu, ChevronRight, Plus, Search, Filter, SlidersHorizontal, DoorOpen, ShieldPlus, ScanQrCodeIcon, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, router } from '@inertiajs/react';
// Opciones de categorías para el ticket
const TICKET_CATEGORIES = [
    'Hardware',
    'Software',
    'Conectividad',
    'Otro',
];


interface Device {
    id: number;
    name: string;
    brand?: { name: string };
    model?: { name: string };
    system?: { name: string };
    shared_with?: Tenant[];
    owner?: Tenant[];
}

interface Tenant {
    id: number;
    name: string;
    email: string;
    phone: string;
    photo: string;
}

interface Apartment {
    name: string;
    photo?: string;
    floor?: string;
    ubicacion?: string;
}

interface Building {
    id: number;
    name: string;
    photo?: string;
    address: string;
}

export default function DeviceDashboard({
    devicesOwn,
    devicesShared,
    member,
    building,
    apartment
}: {
    devicesOwn: Device[];
    devicesShared: Device[];
    member: Tenant;
    building: Building;
    apartment: Apartment;
}) {

    // Estado para el modal de ticket
    const [openTicketModal, setOpenTicketModal] = useState(false);


    // Unir dispositivos propios y compartidos para el formulario
    const allDevices = [...devicesOwn, ...devicesShared].map(device => ({
        ...device,
        // Si el nombre es null, usar device.name_device?.name
        name: device.name || (device.name_device ? device.name_device.name : ''),
    }));
    // Debug: mostrar en consola los dispositivos
    console.log('allDevices', allDevices);

    // Formulario para crear ticket
    const { data, setData, post, processing, errors, reset } = useForm({
        device_id: '',
        category: '',
        title: '',
        description: '',
    });

    // Manejar envío del formulario
    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tickets', {
            preserveScroll: true,
            onSuccess: () => {
                setOpenTicketModal(false);
                reset();
            },
        });
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Filtrar dispositivos según el término de búsqueda
    const filteredDevicesOwn = devicesOwn.filter(device =>
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.system?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDevicesShared = devicesShared.filter(device =>
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.system?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Dispositivos" />

            <div className="flex flex-col gap-6 p-6">
                {/* Botón de acción para crear ticket */}
                <div className="flex justify-end mb-2">
                    <Dialog open={openTicketModal} onOpenChange={setOpenTicketModal}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setOpenTicketModal(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Reportar un problema
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reportar un problema</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <Label>Dispositivo</Label>
                                    <Select
                                        value={data.device_id}
                                        onValueChange={value => setData('device_id', value)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un dispositivo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allDevices.map(device => (
                                                <SelectItem key={device.id} value={String(device.id)}>{device.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.device_id && <div className="text-red-500 text-sm">{errors.device_id}</div>}
                                </div>
                                <div>
                                    <Label>Categoría</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={value => setData('category', value)}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TICKET_CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <div className="text-red-500 text-sm">{errors.category}</div>}
                                </div>
                                <div>
                                    <Label>Título</Label>
                                    <Input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        required
                                    />
                                    {errors.title && <div className="text-red-500 text-sm">{errors.title}</div>}
                                </div>
                                <div>
                                    <Label>Descripción</Label>
                                    <Textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        required
                                    />
                                    {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button type="submit" className="bg-blue-600 text-white" disabled={processing}>Enviar Ticket</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Header Section con animación mejorada */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <HeaderCard
                        icon={<Building2 className="w-6 h-6" />}
                        title={building.name}
                        subtitle={building.address}
                        image={building.image}
                        type="building"
                    />

                    <HeaderCard
                        icon={<Home className="w-6 h-6" />}
                        title={apartment.name}
                        subtitle={`${apartment.ubicacion}`}
                        image={apartment.image}
                        type="apartment"
                    />

                    <HeaderCard
                        title={member.name}
                        subtitle={member.email}
                        image={member.photo}
                        type="user"
                    />
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for devices..."
                            className="pl-9 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                <div className=" w-full">
                  

                    <div className="flex items-center gap-2 self-end">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="owned">Owned</TabsTrigger>
                                <TabsTrigger value="shared">Shared with me</TabsTrigger>
                            </TabsList>

                            {/* IMPORTANTE: Mover los TabsContent dentro del componente Tabs */}
                            <TabsContent value="all" className="space-y-8 mt-4">
                                <DeviceGrid
                                    title="Own Devices"
                                    devices={filteredDevicesOwn}
                                    variant="owned"
                                    count={filteredDevicesOwn.length}
                                />

                                <DeviceGrid
                                    title="Shared With Me"
                                    devices={filteredDevicesShared}
                                    variant="shared"
                                    count={filteredDevicesShared.length}
                                />
                            </TabsContent>

                            <TabsContent value="owned" className="mt-4">
                                <DeviceGrid
                                    title="Own Devices"
                                    devices={filteredDevicesOwn}
                                    variant="owned"
                                    count={filteredDevicesOwn.length}
                                />
                            </TabsContent>

                            <TabsContent value="shared" className="mt-4">
                                <DeviceGrid
                                    title="Shared With Me"
                                    devices={filteredDevicesShared}
                                    variant="shared"
                                    count={filteredDevicesShared.length}
                                />
                            </TabsContent>
                        </Tabs>

                     
                    </div>
                </div>

                {/* Eliminar los TabsContent que estaban fuera del componente Tabs */}
            </div>
        </AppLayout>
    );
}

const HeaderCard = ({ title, subtitle, image, icon, type }: {
    title: string;
    subtitle: string;
    image?: string;
    icon?: React.ReactNode;
    type?: 'building' | 'apartment' | 'user';
}) => {
 

    return (
        <Card className="rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group py-2">

            <CardContent className="p-0 relative">

                <div className="flex items-center gap-3 p-4">
                    {image ? (
                        <img
                            src={`/storage/${image}`}
                            alt={title}
                            className="w-12 h-12 rounded-full border border-primary object-cover"
                        />):(
                            <div className="bg-background/80 p-3 rounded-xl backdrop-blur-sm border">
                            <DoorOpen className="w-6 h-6 text-primary" />
                          </div>
                        )}
                    <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                </div>


            </CardContent>
        </Card>
    );
};

const DeviceGrid = ({ title, devices, variant, count }: {
    title: string;
    devices: Device[];
    variant: 'owned' | 'shared';
    count: number;
}) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                <span className={`p-2 rounded-lg ${variant === 'owned'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                    <Laptop className="w-5 h-5" />
                </span>
                {title}
                <Badge variant="outline" className="ml-2 font-normal">
                    {count}
                </Badge>
            </h2>

            {/*variant === 'owned' && (
                <Button size="sm" className="gap-1 bg-green-500 hover:bg-green-600 text-white shadow-sm">
                    <Plus className="w-4 h-4" /> Añadir Dispositivo
                </Button>
            )*/}
        </div>

        {devices.length === 0 ? (
            <div className="p-12 text-center text-gray-600 rounded-xl border-2 border-dashed bg-gray-50 transition-all hover:bg-gray-100">
                <Laptop className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No devices found</p>
                <p className="text-sm mt-1">
                    {variant === 'owned'
                        ? 'Add your first device to get startedr'
                        : 'No devices have been shared with me yet'}
                </p>
                {variant === 'owned' && (
                    <Button size="sm" className="mt-4 gap-1 bg-green-500 hover:bg-green-600 text-white shadow-sm">
                        <Plus className="w-4 h-4" /> Add Device
                    </Button>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                {devices.map(device => (
                    <DeviceCard key={device.id} device={device} variant={variant} />
                ))}
            </div>
        )}
    </div>
);

const DeviceCard = ({ device, variant }: { device: Device; variant: 'owned' | 'shared' }) => {
    const variantStyles = {
        owned: {
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            hoverBg: "hover:bg-green-50/70",
            borderAccent: "group-hover:border-green-200",
            badge: "bg-green-50 text-green-700 border-green-200"
        },
        shared: {
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            hoverBg: "hover:bg-blue-50/70",
            borderAccent: "group-hover:border-blue-200",
            badge: "bg-blue-50 text-blue-700 border-blue-200"
        }
    };

    const styles = variantStyles[variant];

    return (
        <Card className={`group rounded-xl border hover:shadow-md transition-all duration-300 ${styles.hoverBg} ${styles.borderAccent} bg-white`}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${styles.iconBg} ${styles.iconColor} transition-transform group-hover:scale-110 shadow-sm`}>
                            <Laptop className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-base text-gray-800">{device.name_device?.name || 'Dispositivo sin nombre'}</h3>
                            <div className="flex flex-wrap gap-1 text-sm text-gray-600 mt-1">
                                {device.brand?.name && (
                                    <Badge variant="outline" className={`font-normal ${styles.badge}`}>
                                     <ScanQrCodeIcon/>   {device.brand.name}
                                    </Badge>
                                )}
                                {device.model?.name && (
                                    <Badge variant="outline" className={`font-normal ${styles.badge}`}>
                                       <Keyboard/> {device.model.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                            <Share2 className="w-4 h-4 text-gray-600" />
                        </Button>
                        {variant === 'owned' && (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {device.system?.name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{device.system.name}</span>
                    </div>
                )}

                {variant === 'owned' && device.shared_with?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Shared with:</span>
                            <div className="flex -space-x-2 ml-1">
                                {device.shared_with.map(user => (
                                    <TooltipProvider key={user.id}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <img
                                                    src={`/storage/${user.photo}`}
                                                    alt={user.name}
                                                    className="w-6 h-6 rounded-full border-2 border-white object-cover hover:scale-110 transition-transform shadow-sm"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{user.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {variant === 'shared' && device.owner && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Owner:</span>
                            <div className="flex items-center gap-2">
                                <img
                                    src={`/storage/${device.owner[0].photo}`}
                                    alt={device.owner[0].name}
                                    className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                                <span className="font-medium text-gray-700">{device.owner[0].name}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Dispositivos', href: '#' }
];