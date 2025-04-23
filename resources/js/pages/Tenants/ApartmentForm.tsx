
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';


// Estilo personalizado para que se vea consistente con tu Input
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

};

type Props = {
    apartments: Apartment[];
    customerId: number;

};

const ApartmentForm = ({
    apartments,
    customerId,
    onApartmentCreated,
}: Props) => {




    const [name, setName] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    /*const [devices, setDevices] = useState<Device[]>([{
        id: 1,
        name: '',
        brand: '',
        model: '',
        system: '',
    }]);
*/
    /* const handleAddDevice = () => {
         const newId = devices.length + 1;
         setDevices([...devices, { id: newId, name: '', brand: '', model: '', system: '' }]);
     };*/

    /* const handleChangeDevice = (index: number, field: keyof Device, value: string) => {
         const newDevices = [...devices];
         newDevices[index] = { ...newDevices[index], [field]: value };
         setDevices(newDevices);
     };
 */
    const handleSubmit = async () => {
        try {
            const response = await axios.post('/apartments', {
                name,
                ubicacion,
                customer_id: customerId,
                // devices,
            });

            // 🔁 Aquí usamos el callback que actualiza la tabla automáticamente
            onApartmentCreated(response.data.apartment);
            alert('Departamento guardado correctamente');

            // Opcional: limpiar formulario
            setName('');
            setUbicacion('');
            // setDevices([{ id: 1, name: '', brand: '', model: '', system: '' }]);
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
    };

    return (
        <div className="p-4 flex gap-4">
            <Card className=' w-4/12'>
                <CardContent className="p-6">
                    <div >
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div className="space-y-2">

                                <Label htmlFor="deparment" className="text-base">
                                    Nombre del Departamento <span className="text-red-500">*</span>
                                </Label>
                                <Input id="deparment" value={name} onChange={(e) => setName(e.target.value)} className="text-base h-12 " required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ubication" className="text-base">Ubicación</Label>
                                <Input id='ubication' value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className="text-base h-12 "
                                    required />
                            </div>
                        </div>
                    </div>

                    {/*  <h3 className="font-semibold text-lg mb-4">Dispositivos</h3>
                    {devices.map((device, index) => (
                        <div key={device.id} className="grid grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base">Nombre <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    placeholder="Nombre"
                                    value={device.name}
                                    className="text-base h-12 "
                                    required
                                    onChange={(e) => handleChangeDevice(index, 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand" className="text-base">Marca <span className="text-red-500">*</span></Label>
                                <CreatableSelect
                                    id='brand'
                                    placeholder="Marca"
                                    value={{ label: device.brand, value: device.brand }}
                                    onChange={(option) => handleChangeDevice(index, 'brand', option?.value || '')}
                                    options={brands.map((b) => ({ label: b.name, value: b.name }))}
                                    className="text-black "
                                    styles={customStyles}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model" className="text-base">Modelo <span className="text-red-500">*</span></Label>

                                <CreatableSelect
                                    placeholder="Modelo"
                                    value={{ label: device.model, value: device.model }}
                                    onChange={(option) => handleChangeDevice(index, 'model', option?.value || '')}
                                    options={models.map((b) => ({ label: b.name, value: b.name }))}
                                    className="text-black"
                                    styles={customStyles}
                                    id='model'
                                    required

                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="system" className="text-base">Sistema <span className="text-red-500">*</span></Label>
                                <CreatableSelect
                                    placeholder="Sistema"
                                    value={{ label: device.system, value: device.system }}
                                    onChange={(option) => handleChangeDevice(index, 'system', option?.value || '')}
                                    options={systems.map((b) => ({ label: b.name, value: b.name }))}
                                    className="text-black"
                                    styles={customStyles}
                                    id='system'
                                    required
                                />
                            </div>
                        </div>
                    ))}

                    <Button type="button" onClick={handleAddDevice} className="mb-6">
                        Añadir Dispositivo
                    </Button>*/}

                    <div className="flex justify-end">
                        <Button onClick={handleSubmit} className="py-3 text-white">
                            Guardar Departamento
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card className='w-8/12'>
                <CardContent className="p-6">


                    <table className="w-full border-collapse">
                        <thead >
                            <tr>
                                <TableHeader>Departamento</TableHeader>
                                <TableHeader>Ubicación</TableHeader>

                                <TableHeader>Estado</TableHeader>
                                <TableHeader>Acciones</TableHeader>
                            </tr>
                        </thead>
                        <tbody>
                            {apartments.map((apartment) => (
                                <tr key={apartment.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <TableCell className="p-4 text-gray-700 font-medium">{apartment.name}</TableCell>
                                    <TableCell className="p-4 text-gray-700 relative">
                                        {apartment.ubicacion})
                                    </TableCell>

                                    <TableCell className="p-4 text-gray-700">-</TableCell>
                                    <TableCell className="p-4 text-gray-700">
                                        <Button variant="outline" className="text-blue-500 hover:text-blue-700 transition-colors">
                                            Editar
                                        </Button>
                                    </TableCell>
                                </tr>
                            ))}


                        </tbody>
                    </table>


                </CardContent>
            </Card>
        </div >
    );
}
const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-gray-600">{children}</td>
);
export default ApartmentForm;