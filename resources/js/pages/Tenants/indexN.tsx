


import AppLayout from "@/layouts/app-layout"
import { Head } from "@inertiajs/react"
import { BreadcrumbItem } from "@/types"
import ApartmentForm from "./ApartmentForm"
import ApartmentTable from "./ApartmentTable"
import { useState } from "react"



type PageProps = {
    customer: {
        id: number;
        apartments: {
            id: number;
            name: string;
            ubicacion: string;
            devices: {
                id: number;
                name: string;
                brand: { name: string };
                model: { name: string };
                system: { name: string };
            }[];
        }[];
    };
    brands: { id: number; name: string }[];
    models: { id: number; name: string }[];
    systems: { id: number; name: string }[];
};

export default function Index({ customer, brands, models, systems }: PageProps) {

    const [apartments, setApartments] = useState(customer.apartments);
    // Función para actualizar la lista de apartamentos
    const handleApartmentCreated = (newApartment: any) => {
        setApartments((prevApartments) => [...prevApartments, newApartment]);
    };

    // Función para manejar el cambio de datos en un dispositivo específico
    const handleChangeDevice = (apartmentId: number, deviceId: number, field: string, value: string) => {
        setApartments((prevApartments) => {
            return prevApartments.map((apartment) => {
                if (apartment.id === apartmentId) {
                    return {
                        ...apartment,
                        devices: apartment.devices.map((device) => {
                            if (device.id === deviceId) {
                                return { ...device, [field]: value };  // Actualiza el campo específico
                            }
                            return device;
                        })
                    };
                }
                return apartment;
            });
        });
    };

    // Función para eliminar un dispositivo
    const handleRemoveDevice = (apartmentId: number, deviceId: number) => {
        setApartments((prevApartments) => {
            return prevApartments.map((apartment) => {
                if (apartment.id === apartmentId) {
                    return {
                        ...apartment,
                        devices: apartment.devices.filter((device) => device.id !== deviceId)
                    };
                }
                return apartment;
            });
        });
    };

    // Función para duplicar un dispositivo
    const handleDuplicateDevice = (apartmentId: number, deviceId: number) => {
        setApartments((prevApartments) => {
            return prevApartments.map((apartment) => {
                if (apartment.id === apartmentId) {
                    const deviceToDuplicate = apartment.devices.find((device) => device.id === deviceId);
                    if (deviceToDuplicate) {
                        return {
                            ...apartment,
                            devices: [
                                ...apartment.devices,
                                { ...deviceToDuplicate, id: Date.now() }  // Duplicar con nuevo ID
                            ]
                        };
                    }
                }
                return apartment;
            });
        });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenants" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">


                <ApartmentForm
                    brands={brands}
                    models={models}
                    systems={systems}
                    customerId={customer.id}
                    onApartmentCreated={handleApartmentCreated}
                    apartments={apartments}
                />
                <ApartmentTable
                    apartments={apartments}
                    brands={brands}  // Asegúrate de que brands, models y systems son arrays.
                    models={models}
                    systems={systems}
                    handleChangeDevice={handleChangeDevice}
                    handleRemoveDevice={handleRemoveDevice}
                    handleDuplicateDevice={handleDuplicateDevice}
                />

                {/*   <div className="flex gap-4">
                    <Card className="mb-8 shadow-sm w-8/12">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <Label htmlFor="name" className="text-gray-700 mb-1.5 block font-medium">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="Input Field Text"
                                            className="border-gray-300 focus:border-gray-400 focus:ring-gray-400 h-12 rounded-md"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">Message</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <Label htmlFor="lastName" className="text-gray-700 mb-1.5 block font-medium">
                                            LastName
                                        </Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Input Field Text"
                                            className="border-gray-300 focus:border-gray-400 focus:ring-gray-400 h-12 rounded-md"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">Message</div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="col-span-1">
                                    <Select>
                                        <SelectTrigger className="border-gray-300 focus:border-gray-400 focus:ring-gray-400 h-12 w-full rounded-md">
                                            <SelectValue placeholder="Building" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="building1">Building 1</SelectItem>
                                            <SelectItem value="building2">Building 2</SelectItem>
                                            <SelectItem value="building3">Building 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch id="status" className="data-[state=checked]:bg-gray-800" />
                                    <Label htmlFor="status" className="text-gray-700 font-medium">
                                        Status
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1  w-4/12 relative">
                        <Card className="col-span-1 shadow-sm">
                            <CardContent className="px-6">
                                <ImageUploader />
                            </CardContent>
                        </Card>

                        <div className="absolute right-4 bottom-4">
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 rounded-lg px-4 py-2 shadow-md"
                                onClick={addDevice}
                            >
                                Add Device <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                    </div>
                </div>

                <Card className="shadow-sm mb-8">
                    <CardContent className="p-0">
                        <DeviceTable devices={devices} onRemove={removeDevice} onDuplicate={duplicateDevice} />
                    </CardContent>
                </Card>

                <div className="flex justify-end mt-8">
                    <Button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2 h-12 rounded-md shadow-md">
                        Save tenant
                    </Button>
                </div>
             */}</div>
        </AppLayout>
    )
}
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Departamentos', href: '/apartments' }
];