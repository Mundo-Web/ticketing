
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tenant } from '@/types/models/Tenant';
import { Trash2, Plus, User } from 'lucide-react';

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
        onTenantsChange([...tenants, { name: '', email: '', phone: '', photo: null }]);
    };

    const handleRemoveTenant = (index: number) => {
        onTenantsChange(tenants.filter((_, i) => i !== index));
    };

    const updateTenant = (index: number, field: keyof Tenant, value: any) => {
        const newTenants = [...tenants];
        newTenants[index] = { ...newTenants[index], [field]: value };
        onTenantsChange(newTenants);
    };

    return (
        <div className="space-y-6">
            {tenants.map((tenant, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Tenant {index + 1}</h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTenant(index)}
                        >
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div className="md:col-span-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => updateTenant(index, 'photo', e.target.files?.[0])}
                                className="hidden"
                                id={`tenant-photo-${index}`}
                            />
                            <label
                                htmlFor={`tenant-photo-${index}`}
                                className="block aspect-square rounded-lg border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
                            >
                                {tenant.photo ? (
                                    <img
                                        src={tenant.photo instanceof File ? URL.createObjectURL(tenant.photo) : `/storage/${tenant.photo}`}
                                        alt={`Tenant ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="md:col-span-3 space-y-4">
                            <Input
                                label="Name"
                                value={tenant.name || ''}
                                onChange={(e) => updateTenant(index, 'name', e.target.value)}
                                error={errors[`tenants.${index}.name`]}
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={tenant.email || ''}
                                onChange={(e) => updateTenant(index, 'email', e.target.value)}
                                error={errors[`tenants.${index}.email`]}
                            />
                            <Input
                                label="Phone"
                                value={tenant.phone || ''}
                                onChange={(e) => updateTenant(index, 'phone', e.target.value)}
                                error={errors[`tenants.${index}.phone`]}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={handleAddTenant}
                className="w-full"
            >
                <Plus className="w-4 h-4 mr-2" /> Add Tenant
            </Button>
        </div>
    );
};