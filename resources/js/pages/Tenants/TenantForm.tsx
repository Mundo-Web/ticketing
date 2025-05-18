
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tenant } from '@/types/models/Tenant';
import { Trash2, Plus, User, UploadCloud } from 'lucide-react';

export const TenantForm = ({
    tenants,
    onTenantsChange,
    errors
}: {
    tenants: Tenant[];
    onTenantsChange: (tenants: Tenant[]) => void;
    errors: Record<string, string>;
}) => {
    const handleAddTenant = () => {
        onTenantsChange([...tenants, { name: '', email: '', phone: '', photo: '' }]);
    };

    const handleRemoveTenant = (index: number) => {
        onTenantsChange(tenants.filter((_, i) => i !== index));
    };

    const updateTenant = (index: number, field: keyof Tenant, value: any) => {
        const newTenants = [...tenants];
        newTenants[index] = { ...newTenants[index], [field]: value };
        onTenantsChange(newTenants);
    };


    const handlePhotoChange = (index: number, file: File | null) => {
        const newTenants = [...tenants];
        if (file) {
            newTenants[index] = { 
                ...newTenants[index], 
                photo: file 
            };
        } else {
            // Preserve existing photo path if no new file is selected
            const existingPhoto = typeof newTenants[index].photo === 'string' 
                ? newTenants[index].photo 
                : null;
            newTenants[index] = { 
                ...newTenants[index], 
                photo: existingPhoto 
            };
        }
        onTenantsChange(newTenants);
    };
    return (
        <div className="space-y-8">
            <div className="sticky top-0 bg-background z-10 pb-4">
                <Button
                    type="button"
                    onClick={handleAddTenant}
                    className="w-max h-12 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Member
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((tenant, index) => (
                    <div key={index} className="relative group border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                        {/* Botón flotante de eliminar */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTenant(index)}
                            className="absolute -top-3 -right-3 bg-destructive/90 text-white rounded-full w-8 h-8 hover:bg-destructive z-20 shadow-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* Sección de imagen */}
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
                                {tenant?.photo ? (
                                    <img
                                        src={tenant.photo instanceof File 
                                            ? URL.createObjectURL(tenant.photo)
                                            : `/storage/${tenant.photo}`}
                                        alt={`Tenant ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-4 bg-muted/20">
                                        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                                            <User className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground text-center">
                                            Click to upload photo
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Campos del formulario */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                           
                                <Input
                                    value={tenant.name || ''}
                                    onChange={(e) => updateTenant(index, 'name', e.target.value)}
                                    placeholder="Name"
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
                                    placeholder="john@example.com"
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
                ))}
            </div>
        </div>
    );
};