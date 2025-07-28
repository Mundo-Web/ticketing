import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tenant } from '@/types/models/Tenant';
import { Trash2, Plus, User, ShieldPlus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TenantFormProps {
    tenants: Tenant[];
    onTenantsChange: (tenants: Tenant[]) => void;
    errors: Record<string, string>;
    apartmentId?: number;
    onExportMembersNinjaOne?: (apartmentId?: number) => void;
}

export const TenantForm = ({
    tenants,
    onTenantsChange,
    errors,
    apartmentId,
    onExportMembersNinjaOne
}: TenantFormProps) => {
    const [filePreviews, setFilePreviews] = useState<Record<number, string>>({});
    const [existingPhotos, setExistingPhotos] = useState<Record<number, string>>({});

    // Inicializar fotos existentes al montar
    useEffect(() => {
        const initialExisting: Record<number, string> = {};
        tenants.forEach((tenant, index) => {
            if (typeof tenant.photo === 'string' && tenant.photo) {
                initialExisting[index] = tenant.photo;
            }
        });
        setExistingPhotos(initialExisting);
    }, [tenants]);

    const handleAddTenant = () => {
        onTenantsChange([...tenants, { 
            name: '', 
            email: '', 
            phone: '', 
            photo: null,
            apartment_id: 0
        }]);
    };

    const handleRemoveTenant = (index: number) => {
        const newTenants = [...tenants];
        newTenants.splice(index, 1);
        onTenantsChange(newTenants);

        // Limpiar estados relacionados
        setFilePreviews(prev => {
            const newPreviews = {...prev};
            delete newPreviews[index];
            return newPreviews;
        });
        
        setExistingPhotos(prev => {
            const newExisting = {...prev};
            delete newExisting[index];
            return newExisting;
        });
    };

    const updateTenant = (index: number, field: keyof Tenant, value: any) => {
        const newTenants = [...tenants];
        newTenants[index] = { 
            ...newTenants[index], 
            [field]: value,
            // Conservar la foto existente si no hay cambios
            photo: newTenants[index].photo 
        };
        onTenantsChange(newTenants);
    };

    const handlePhotoChange = (index: number, file: File | null) => {
        const newTenants = [...tenants];
        
        if (file) {
            // Nuevo archivo subido
            const previewUrl = URL.createObjectURL(file);
            setFilePreviews(prev => ({ ...prev, [index]: previewUrl }));
            
            newTenants[index] = { 
                ...newTenants[index], 
                photo: file  // Aseguramos que sea un objeto File
            };
        } else {
            // Si no hay nuevo archivo, establecemos photo a null
            // Esto evita enviar una cadena de texto como valor
            newTenants[index] = { 
                ...newTenants[index], 
                photo: null 
            };
            
            // Limpiar previews
            setFilePreviews(prev => {
                const newPreviews = {...prev};
                delete newPreviews[index];
                return newPreviews;
            });
        }
        
        onTenantsChange(newTenants);
    };

    const getImageSource = (index: number): string => {
        if (filePreviews[index]) {
            return filePreviews[index];
        }
        if (existingPhotos[index]) {
            return `/storage/${existingPhotos[index]}`;
        }
        return '';
    };

    return (
        <div className="space-y-8">
            <div className=" top-0 bg-background z-10 pb-4">
                <div className="flex gap-2">
                    <Button 
                        type="button"
                        onClick={handleAddTenant}
                        className="w-max h-12 rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Member
                    </Button>
                    {/*onExportMembersNinjaOne && (
                        <Button 
                            type="button"
                            onClick={() => onExportMembersNinjaOne(apartmentId)}
                            variant="outline"
                            className="w-max h-12 rounded-xl shadow-sm hover:shadow-md transition-all border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                            <ShieldPlus className="w-5 h-5 mr-2 text-blue-600" />
                            Export Members NinjaOne
                        </Button>
                    )*/}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((tenant, index) => {
                    const imageSrc = getImageSource(index);

                    return (
                        <div key={index} className="relative group border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTenant(index)}
                                className="absolute -top-3 -right-3 bg-destructive/90 text-white rounded-full w-8 h-8 hover:bg-destructive z-20 shadow-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="mb-6">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoChange(index, e.target.files?.[0] || null)}
                                    className="hidden"
                                    id={`tenant-photo-${index}`}
                                />
                                <label
                                    htmlFor={`tenant-photo-${index}`}
                                    className="block aspect-square rounded-xl border-2 border-dashed cursor-pointer hover:border-primary overflow-hidden transition-all"
                                >
                                    {tenant.photo || tenant?.photoPreview ? (
                                        <img
                                        src={tenant.photo
                                            ? URL.createObjectURL(tenant.photo)
                                            : `/storage/${tenant?.photoPreview}`}
                                            alt={`Member ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                            onLoad={() => {
                                                if (filePreviews[index]) {
                                                    URL.revokeObjectURL(filePreviews[index]);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full p-4 bg-muted/20">
                                            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                                                <User className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground text-center">
                                                Subir foto
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                   
                                    <Input
                                        value={tenant.name || ''}
                                        onChange={(e) => updateTenant(index, 'name', e.target.value)}
                                        placeholder="Nombre completo"
                                        className="h-12 rounded-lg"
                                    />
                                    {errors[`tenants.${index}.name`] && (
                                        <p className="text-xs text-destructive">{errors[`tenants.${index}.name`]}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                
                                    <Input
                                        type="email"
                                        value={tenant.email || ''}
                                        onChange={(e) => updateTenant(index, 'email', e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        className="h-12 rounded-lg"
                                    />
                                    {errors[`tenants.${index}.email`] && (
                                        <p className="text-xs text-destructive">{errors[`tenants.${index}.email`]}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                   
                                    <Input
                                        value={tenant.phone || ''}
                                        onChange={(e) => updateTenant(index, 'phone', e.target.value)}
                                        placeholder="+1 234 567 890"
                                        className="h-12 rounded-lg"
                                    />
                                    {errors[`tenants.${index}.phone`] && (
                                        <p className="text-xs text-destructive">{errors[`tenants.${index}.phone`]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};