import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { LayoutGrid, Table, Plus, Edit, Trash2, X, Upload, UploadCloud, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/*interface Customer {
    id: number;
    name: string;
    image: string;
    description: string;
    address: string;
    status: boolean;
    created_at: string;
}*/
interface Customer {
    id: number;
    name: string;
    image: string;
    description: string;
    location_link: string;
    owner: {
        name: string;
        email: string;
        photo: string;
        phone: string;
    };
    doormen: Array<{
        name: string;
        photo: string;
        email: string;
        phone: string;
    }>;
    status: boolean;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    customers: {
        data: Customer[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
}





import { Input } from "@/components/ui/input"

export default function Index({ customers }: Props) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4); // Add this new state

    /*const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
        address: '',
    });*/
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
        location_link: '',
        owner: {
            name: '',
            email: '',
            photo: null as File | null,
            phone: ''
        },
        doormen: [] as Array<{
            name: string;
            photo: File | null;
            email: string;
            phone: string;
        }>,
    });

    const toggleStatus = async (customer: Customer) => {
        setIsUpdatingStatus(customer.id);

        // Convertir explícitamente a booleano
        const newStatus = !customer.status;

        try {
            await router.put(
                route('customers.update-status', customer.id),
                { status: newStatus }, // Asegurar tipo booleano
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Cliente activado exitosamente');

                    }
                }
            );
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsUpdatingStatus(null);
        }
    };





    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();



        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('image', data.image || "");
        formData.append('description', data.description);
        formData.append('address', data.address);

        post(route('customers.store'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                toast.success('Cliente creado exitosamente');
            },
            onError: (errors) => {
                console.error('Errores:', errors);
                if (errors.image) toast.error(errors.image);
                if (errors.name) toast.error(errors.name);
            }
        });
    };

    const handleEdit = (customer: Customer) => {
        setData({
            id: customer.id,
            name: customer.name,
            image: null,
            description: customer.description,
            address: customer.address,
        });
        setCurrentCustomer(customer);
        setShowCreateModal(true);
    };

    // components/Customers/Index.tsx
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.id) return;

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || "");
        formData.append('address', data.address || "");
        if (data.image) {
            formData.append('image', data.image);
        }

        // ✅ Laravel espera _method como parte del FormData
        formData.append('_method', 'PUT');

        // ✅ Usar router.post() directamente con FormData y method: 'put'
        router.post(route('customers.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentCustomer(null);
                toast.success('Cliente actualizado exitosamente');
            },
            onError: (errors) => {
                if (errors.name) toast.error(errors.name);
                if (errors.image) toast.error(errors.image);
            }
        });
    };



    const handleDelete = (customer: Customer) => {
        setCurrentCustomer(customer);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentCustomer) return;

        destroy(route('customers.destroy', currentCustomer.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentCustomer(null);
                toast.success('Cliente eliminado exitosamente');
            },
            onError: () => {
                toast.error('Error al eliminar cliente');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-1 rounded flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow ' : ''}`}
                            >
                                <LayoutGrid className={`w-5 h-5 text-gray-600 ${viewMode === 'grid' ? ' !text-primary' : ''}`} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow' : ''}`}
                            >
                                <Table className={`w-5 h-5 text-gray-600  ${viewMode === 'table' ? ' !text-primary' : ''}`} />
                            </button>
                        </div>
                        {viewMode === 'grid' && (
                            <select
                                value={gridColumns}
                                onChange={(e) => setGridColumns(Number(e.target.value))}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                <option value={2}>2 Columnas</option>
                                <option value={3}>3 Columnas</option>
                                <option value={4}>4 Columnas</option>
                                <option value={5}>5 Columnas</option>
                                <option value={6}>6 Columnas</option>
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => {
                                reset();
                                setCurrentCustomer(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2  text-white transition-all duration-300"
                        >
                            <Star className="w-5 h-5" />
                            <span className="hidden sm:block">New Building
                            </span>
                        </Button>
                    </div>
                </div>

                {/* Create/Edit Customer Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="w-full max-w-none sm:max-w-4xl mx-0 sm:mx-4 p-0 overflow-hidden bg-background">
                        <div className="overflow-y-auto px-6 py-8" style={{ maxHeight: '90vh' }}>
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-3xl font-semibold tracking-tight">
                                    {currentCustomer ? 'Edit Building' : 'New Building'}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    {currentCustomer ? 'Update the building information below.' : 'Fill in the building information below to create a new record.'}
                                </DialogDescription>
                            </DialogHeader>




                            <form onSubmit={currentCustomer ? handleUpdateSubmit : handleCreateSubmit} className="space-y-8">
                                <Tabs defaultValue="building" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="building">Building</TabsTrigger>
                                        <TabsTrigger value="owner">Owner</TabsTrigger>
                                        <TabsTrigger value="doorman">Doorman</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="building">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            {/* Left Column - Enhanced Image Upload */}
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="image" className="text-base">
                                                        Building Photo
                                                    </Label>
                                                    {!currentCustomer && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div
                                                    className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                                            ${errors.image
                                                            ? 'ring-2 ring-destructive'
                                                            : 'hover:ring-2 hover:ring-ring'} 
                                            bg-muted/50`}
                                                >
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg,image/jpg"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setData('image', e.target.files[0]);
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />

                                                    <label
                                                        htmlFor="image-upload"
                                                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                                    >
                                                        {data.image || currentCustomer?.image ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.image
                                                                        ? URL.createObjectURL(data.image)
                                                                        : `/storage/${currentCustomer?.image}`}
                                                                    alt="Building preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                    <UploadCloud className="w-8 h-8 text-white" />
                                                                    <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors.image && (
                                                    <p className="text-sm text-destructive">{errors.image}</p>
                                                )}
                                            </div>

                                            {/* Right Column - Form Fields */}
                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="name" className="text-base">
                                                                Building Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            className={`h-11 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter building name"
                                                            required
                                                        />
                                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="description" className="text-base">
                                                            Address
                                                        </Label>
                                                        <Textarea
                                                            id="description"
                                                            value={data.description}
                                                            onChange={(e) => setData('description', e.target.value)}
                                                            rows={4}
                                                            className="resize-none"
                                                            placeholder="Enter building description..."
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="maps_url" className="text-base">
                                                            Location URL
                                                        </Label>
                                                        <Input
                                                            id="maps_url"
                                                            value={data.address}
                                                            onChange={(e) => setData('address', e.target.value)}
                                                            type="url"
                                                            placeholder="https://maps.google.com/..."
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="owner">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            {/* Left Column - Enhanced Image Upload */}
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="image" className="text-base">
                                                        Owner Photo
                                                    </Label>
                                                    {!currentCustomer && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div
                                                    className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                                            ${errors.image
                                                            ? 'ring-2 ring-destructive'
                                                            : 'hover:ring-2 hover:ring-ring'} 
                                            bg-muted/50`}
                                                >
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg,image/jpg"

                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setData('owner', { ...data.owner, photo: e.target.files?.[0] || null })
                                                            }
                                                        }}
                                                        className="hidden"
                                                    />

                                                    <label
                                                        htmlFor="image-upload"
                                                        className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                                    >
                                                        {data.image || currentCustomer?.image ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.image
                                                                        ? URL.createObjectURL(data.image)
                                                                        : `/storage/${currentCustomer?.image}`}
                                                                    alt="Building preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                    <UploadCloud className="w-8 h-8 text-white" />
                                                                    <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors.image && (
                                                    <p className="text-sm text-destructive">{errors.image}</p>
                                                )}
                                            </div>

                                            {/* Right Column - Form Fields */}
                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="name" className="text-base">
                                                                Owner Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="name"
                                                            value={data.owner.name}
                                                            onChange={(e) => setData('owner', { ...data.owner, name: e.target.value })}
                                                            className={`h-11 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter building name"
                                                            required
                                                        />
                                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="email" className="text-base">
                                                            Email
                                                        </Label>
                                                        <Input
                                                            id="email"
                                                            value={data.owner.email}
                                                            onChange={(e) => setData('owner', { ...data.owner, email: e.target.value })}

                                                            className="resize-none"
                                                            placeholder="Enter email..."
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="phone" className="text-base">
                                                            Phone Number
                                                        </Label>
                                                        <Input
                                                            id="phone"
                                                            value={data.owner.phone}
                                                            onChange={(e) => setData('owner', { ...data.owner, phone: e.target.value })}
                                                            placeholder="+1 (555) 000-0000"
                                                            type="text"

                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="doorman" className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-end items-center">

                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (data.doormen.length < 3) {
                                                            setData('doormen', [...data.doormen, {
                                                                name: '',
                                                                photo: null,
                                                                email: '',
                                                                phone: ''
                                                            }]);
                                                        }
                                                    }}
                                                    disabled={data.doormen.length >= 3}
                                                    variant={'default'}
                                                >
                                                    <Plus />
                                                    Add Doorman
                                                </Button>
                                            </div>

                                            {data.doormen.map((doorman, index) => (
                                                <div key={index} className="border rounded-lg p-4 space-y-4 shadow-xl">
                                                    <div className="grid grid-cols-12 gap-6 p-4">
                                                        {/* Left Column */}
                                                        <div className="col-span-12 md:col-span-7 space-y-6">
                                                            <div className="grid gap-6">
                                                                <div>
                                                                    <Label>Doorman Name    {!currentCustomer && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}</Label>
                                                                    <Input
                                                                        value={doorman.name}
                                                                        onChange={(e) => {
                                                                            const newDoormen = [...data.doormen];
                                                                            newDoormen[index].name = e.target.value;
                                                                            setData('doormen', newDoormen);
                                                                        }}
                                                                        required
                                                                        className="h-11"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label>Email *</Label>
                                                                    <Input
                                                                        type="email"
                                                                        value={doorman.email}
                                                                        onChange={(e) => {
                                                                            const newDoormen = [...data.doormen];
                                                                            newDoormen[index].email = e.target.value;
                                                                            setData('doormen', newDoormen);
                                                                        }}
                                                                        required
                                                                        className="h-11"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label>Phone Number</Label>
                                                                    <Input
                                                                        value={doorman.phone}
                                                                        onChange={(e) => {
                                                                            const newDoormen = [...data.doormen];
                                                                            newDoormen[index].phone = e.target.value;
                                                                            setData('doormen', newDoormen);
                                                                        }}
                                                                        placeholder="+1 (555) 000-0000"
                                                                        className="h-11"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>


                                                        <div className="col-span-12 md:col-span-5 space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label htmlFor="image" className="text-base">
                                                                    Doorman Photo
                                                                </Label>
                                                                {!currentCustomer && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                            </div>

                                                            <div
                                                                className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                                            ${errors.image
                                                                        ? 'ring-2 ring-destructive'
                                                                        : 'hover:ring-2 hover:ring-ring'} 
                                            bg-muted/50`}
                                                            >
                                                                <input
                                                                    id="image-upload"
                                                                    type="file"
                                                                    accept="image/png, image/jpeg,image/jpg"

                                                                    onChange={(e) => {
                                                                        const newDoormen = [...data.doormen];
                                                                        newDoormen[index].photo = e.target.files?.[0] || null;
                                                                        setData('doormen', newDoormen);
                                                                    }}
                                                                    className="hidden"
                                                                />

                                                                <label
                                                                    htmlFor="image-upload"
                                                                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                                                >
                                                                    {data.image || currentCustomer?.image ? (
                                                                        <div className="relative w-full h-full group">
                                                                            <img
                                                                                src={data.image
                                                                                    ? URL.createObjectURL(data.image)
                                                                                    : `/storage/${currentCustomer?.image}`}
                                                                                alt="Building preview"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                                <UploadCloud className="w-8 h-8 text-white" />
                                                                                <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                            </div>
                                                                            <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                            <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                                        </div>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            {errors.image && (
                                                                <p className="text-sm text-destructive">{errors.image}</p>
                                                            )}
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                const newDoormen = [...data.doormen];
                                                                newDoormen.splice(index, 1);
                                                                setData('doormen', newDoormen);
                                                            }}
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>



                                </Tabs>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-11"
                                    >
                                        {processing
                                            ? (currentCustomer ? 'Updating...' : 'Creating...')
                                            : (currentCustomer ? 'Update Building' : 'Create Building')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}

                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                                ¿Estás seguro de que deseas eliminar al cliente <strong>{currentCustomer?.name}</strong>?
                                Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Content Section */}
                {customers.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                        gridColumns={gridColumns}
                    />
                ) : (
                    <TableView
                        customers={customers.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                    />
                )}

                {/* Pagination */}
                {customers.data.length > 0 && (
                    <Pagination links={customers.links} meta={customers.meta} />
                )}
            </div>
        </AppLayout>
    );
}

// Update GridView component
const GridView = ({ customers, onEdit, onDelete, onToggleStatus, isUpdatingStatus, gridColumns }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onToggleStatus: (customer: Customer) => void,
    isUpdatingStatus: number | null,
    gridColumns: number
}) => {
    // Función para determinar las clases de grid basadas en el número de columnas
    const getGridClass = () => {
        switch (gridColumns) {
            case 2:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
            case 3:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case 4:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
            case 5:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5';
            case 6:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6';
            default:
                return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        }
    };

    return (
        <div className={`grid ${getGridClass()} gap-6`}>
            {customers.map((customer) => (
                <div key={customer.id} className="bg-card text-card-foreground p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border relative">
                    {customer.image && (
                        <img
                            src={`/storage/${customer.image}`}
                            alt={customer.name}
                            className="object-cover rounded-md mb-4 w-full aspect-[4/3]"
                        />
                    )}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-xl  truncate">{customer.name}</h3>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={customer.status}
                                    onCheckedChange={() => onToggleStatus(customer)}
                                    className="data-[state=checked]:bg-green-500"
                                    disabled={isUpdatingStatus === customer.id}
                                />
                                <StatusBadge status={customer.status ? "active" : "inactive"} />
                            </div>
                        </div>
                        {customer.apartments && (
                            <p className="text-sm  line-clamp-2">{customer.apartments?.length} departamentos</p>
                        )}
                        <div className="text-xs  mt-2">
                            Creado: {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                        <div className='flex space-x-4'>
                            <Link
                                href={route('customers.apartments', customer)}
                                className="flex  rounded-lg items-center justify-center gap-2 transition-all duration-300 w-7/12  bg-primary text-primary-foreground"
                            >
                                <span className="hidden sm:block">Admin</span>
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                            <div className="relative   flex gap-4 w-5/12 justify-end items-center">
                                <Button
                                    onClick={() => onEdit(customer)}
                                    variant="secondary"

                                    title="Editar"
                                    size="icon"
                                >
                                    <Edit className="w-6 h-6" />
                                </Button>
                                <Button
                                    onClick={() => onDelete(customer)}
                                    variant="destructive"
                                    title="Eliminar"
                                    size="icon"

                                >
                                    <Trash2 className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>
            ))}
        </div>
    );
};

const TableView = ({ customers, onEdit, onDelete, onToggleStatus, isUpdatingStatus }: {
    customers: Customer[],
    onEdit: (customer: Customer) => void,
    onDelete: (customer: Customer) => void,
    onToggleStatus: (customer: Customer) => void,
    isUpdatingStatus: number | null
}) => (
    <div className="rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50">
                <tr>
                    <TableHeader>Imagen</TableHeader>
                    <TableHeader>Nombre</TableHeader>
                    <TableHeader>Estado</TableHeader>
                    <TableHeader>Descripción</TableHeader>
                    <TableHeader>Acciones</TableHeader>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                            {customer.image && (
                                <img
                                    src={`/storage/${customer.image}`}
                                    alt={customer.name}
                                    className="w-12 h-12 rounded-full  object-cover"

                                />
                            )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={customer.status}
                                    onCheckedChange={() => onToggleStatus(customer)}
                                    className="data-[state=checked]:bg-green-500"
                                    disabled={isUpdatingStatus === customer.id}
                                />
                                <StatusBadge status={customer.status ? "active" : "inactive"} />
                            </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                            <p className="truncate">{customer.description || 'Sin descripción'}</p>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEdit(customer)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />

                                </button>
                                <button
                                    onClick={() => onDelete(customer)}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />

                                </button>
                            </div>
                        </TableCell>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
);

const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
    <div className="bg-sidebar p-8 rounded-xl text-center border-2 border-dashed ">
        <div className="text-primary mb-4 flex justify-center">
            <LayoutGrid className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-semibold text-primary mb-2">No hay clientes registrados</h3>
        <p className="text-primary mb-4">Comienza agregando tu primer cliente</p>
        <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg  transition-colors"
        >
            <Plus className="w-5 h-5" />
            Crear Primer Cliente
        </button>
    </div>
);

const Pagination = ({ links, meta }: { links: PaginationLink[], meta: PaginationMeta }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-gray-500">
            Mostrando {meta?.per_page * (meta?.current_page - 1) + 1} -{' '}
            {Math.min(meta?.per_page * meta?.current_page, meta?.total)} de {meta?.total}
        </div>
        <div className="flex gap-1">
            {links.map((link, index) => (
                link.url && (
                    <Link
                        key={index}
                        href={link.url}
                        className={`px-3 py-1 rounded-lg ${link.active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                )
            ))}
        </div>
    </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-600">{children}</td>
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clientes', href: '/customers' }
];
