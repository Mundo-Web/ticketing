import React from "react";

import CreatableSelect from "react-select/creatable";  // Asegúrate de tener esto importado
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

const customStyles = {
    control: (provided: any) => ({
        ...provided,
        borderRadius: "0.375rem", // Mismo border-radius del Input
        borderWidth: "1px", // Bordes sutiles
        padding: "0.25rem 0.75rem", // Padding ajustado
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)", // Ligera sombra para el input
        minHeight: "3rem", // Altura del control
        backgroundColor: "transparent", // Fondo transparente
        transition: "border-color 0.3s ease, box-shadow 0.3s ease", // Transiciones suaves
    }),
    menu: (provided: any) => ({
        ...provided,
        borderRadius: "0.375rem", // Mismo border-radius para el menú
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)", // Sombra del menú
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#e0e7ff" : "transparent", // Fondo claro para la opción seleccionada
        color: state.isSelected ? "#1e3a8a" : "#000", // Color de texto
        padding: "0.5rem", // Padding para las opciones
        cursor: "pointer",
        fontSize: "0.875rem", // Ajuste de tamaño de fuente
    }),
    singleValue: (provided: any) => ({
        ...provided,
        color: "#000", // Color de texto
        fontSize: "1rem", // Tamaño de fuente
    }),
    placeholder: (provided: any) => ({
        ...provided,
        color: "#6b7280", // Color del placeholder
        fontSize: "1rem",
    }),
};


type Apartment = {
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
};

type ApartmentTableProps = {
    apartments: Apartment[];
    brands: { name: string }[];
    systems: { name: string }[];
    handleChangeDevice: (apartmentId: number, deviceId: number, field: string, value: string) => void;
    handleRemoveDevice: (apartmentId: number, deviceId: number) => void;
};

const ApartmentTable = ({
    apartments,
    brands,
    systems,
    handleChangeDevice,
    handleRemoveDevice
}: ApartmentTableProps) => {
    return (
        <div className="overflow-x-auto p-4">
            <Card>
                <CardContent className="p-6">
                    <table className="w-full border-collapse">
                        <thead >
                            <tr>
                                <TableHeader>Departamento</TableHeader>
                                <TableHeader>Marca</TableHeader>
                                <TableHeader>Sistema</TableHeader>
                                <TableHeader>Historial</TableHeader>
                                <TableHeader>Acciones</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {apartments.map((apartment) => (
                                <tr key={apartment.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <TableCell className="p-4 text-gray-700 font-medium">{apartment.name}</TableCell>
                                    <TableCell className="p-4 text-gray-700 relative">
                                        {apartment.devices.map((device) => {

                                            return (
                                                <div key={device.id} className="space-y-2">
                                                    <CreatableSelect
                                                        placeholder="Select Brand"
                                                        // Selecciona la opción por defecto si existe
                                                        value={device.brand ? { label: device.brand.name, value: device.brand.name } : null}
                                                        onChange={(option) =>
                                                            handleChangeDevice(apartment.id, device.id, "brand", option?.value || "")
                                                        }
                                                        options={brands.map((b) => ({ label: b.name, value: b.name }))}
                                                        className="text-black"
                                                        styles={customStyles}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </TableCell>
                                    <TableCell className="p-4 text-gray-700">
                                        {apartment.devices.map((device) => {
                                            console.log("Device system:", device.system); // Agregado para verificar
                                            return (
                                                <div key={device.id} className="space-y-2">
                                                    <CreatableSelect
                                                        placeholder="Select System"
                                                        // Selecciona la opción por defecto si existe
                                                        value={device.system ? { label: device.system.name, value: device.system.name } : null}
                                                        onChange={(option) =>
                                                            handleChangeDevice(apartment.id, device.id, "system", option?.value || "")
                                                        }
                                                        options={systems.map((s) => ({ label: s.name, value: s.name }))}
                                                        className="text-black"
                                                        styles={customStyles}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </TableCell>
                                    <TableCell className="p-4 text-gray-700">-</TableCell>
                                    <TableCell className="p-4 text-gray-700">
                                        {apartment.devices.map((device) => (
                                            <button
                                                onClick={() => handleRemoveDevice(apartment.id, device.id)}
                                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />

                                            </button>

                                        ))}
                                    </TableCell>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};
const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-600">{children}</td>
);
export default ApartmentTable;
