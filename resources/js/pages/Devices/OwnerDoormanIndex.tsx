import AppLayout from '@/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Laptop, Users, Building2, Home, Plus, Search, User, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';

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
    name_device?: { name: string };
    brand?: { name: string };
    model?: { name: string };
    system?: { name: string };
    owner?: {
        id: number;
        name: string;
        email: string;
        apartment?: {
            name: string;
        };
    };
}

interface Member {
    id: number;
    name: string;
    email: string;
    photo?: string;
    apartment?: {
        name: string;
    };
    devices?: Device[];
}

interface Building {
    id: number;
    name: string;
    address: string;
}

export default function OwnerDoormanDeviceIndex({
    building,
    members,
    devices,
    userRole
}: {
    building: Building;
    members: Member[];
    devices: Device[];
    userRole: 'owner' | 'doorman';
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [openTicketModal, setOpenTicketModal] = useState(false);

    // Formulario para crear ticket
    const { data, setData, post, processing, errors, reset } = useForm({
        device_id: '',
        category: '',
        title: '',
        description: '',
        member_id: '',
    });

    // Manejar envío del formulario
    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tickets', {
            preserveScroll: true,
            onSuccess: () => {
                setOpenTicketModal(false);
                reset();
                setSelectedMember(null);
            },
        });
    };

    // Filtrar members según el término de búsqueda
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.apartment?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Obtener devices del member seleccionado
    const memberDevices = selectedMember?.devices || [];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Devices & Members', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Device Management - ${userRole === 'owner' ? 'Owner' : 'Doorman'}`} />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Device & Member Management</h1>
                        <p className="text-muted-foreground">
                            Manage devices and create tickets for members in {building.name}
                        </p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                        {userRole === 'owner' ? 'Owner' : 'Doorman'}
                    </Badge>
                </div>

                {/* Building Info */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">{building.name}</h3>
                                <p className="text-sm text-muted-foreground">{building.address}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Search */}
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search members..."
                        className="pl-9 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map(member => (
                        <Card key={member.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-secondary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-foreground truncate">{member.name}</h4>
                                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                        {member.apartment && (
                                            <p className="text-xs text-muted-foreground">Apt: {member.apartment.name}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Laptop className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {member.devices?.length || 0} devices
                                        </span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => {
                                            setSelectedMember(member);
                                            setData('member_id', member.id.toString());
                                            setOpenTicketModal(true);
                                        }}
                                        className="bg-primary hover:bg-primary/90"
                                    >
                                        <Ticket className="w-4 h-4 mr-1" />
                                        Create Ticket
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Create Ticket Modal */}
                <Dialog open={openTicketModal} onOpenChange={setOpenTicketModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Create Ticket for {selectedMember?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmitTicket} className="space-y-4">
                            <div>
                                <Label>Device</Label>
                                <Select
                                    value={data.device_id}
                                    onValueChange={value => setData('device_id', value)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a device" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedMember?.devices?.map(device => (
                                            <SelectItem key={device.id} value={String(device.id)}>
                                                {device.name_device?.name || device.name || 'Unnamed Device'}
                                                {device.brand && ` - ${device.brand.name}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.device_id && <div className="text-red-500 text-sm">{errors.device_id}</div>}
                            </div>
                            
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={data.category}
                                    onValueChange={value => setData('category', value)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
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
                                <Label>Title</Label>
                                <Input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    required
                                />
                                {errors.title && <div className="text-red-500 text-sm">{errors.title}</div>}
                            </div>
                            
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    required
                                />
                                {errors.description && <div className="text-red-500 text-sm">{errors.description}</div>}
                            </div>
                            
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    Create Ticket
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
