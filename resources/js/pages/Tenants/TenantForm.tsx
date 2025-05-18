
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
console.log(tenants)
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
                                {tenant?.photo ? (
                                    <img
                                    src={`/storage/${tenant.photo}`}
                                        alt={`Tenant ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
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

                        <div className="md:col-span-3 space-y-4">
                        <Label htmlFor="name">
                                                Tenant Name <span className="text-red-500">*</span>
                                            </Label>
                            <Input
                                label="Name"
                                value={tenant.name || ''}
                                onChange={(e) => updateTenant(index, 'name', e.target.value)}
                                error={errors[`tenants.${index}.name`]}
                                className={`h-11 mt-2 ${errors.name ? 'border-red-500' : ''}`}
                                required
                            />
                              <Label htmlFor="name">
                                                Email <span className="text-red-500">*</span>
                                            </Label>
                            <Input
                                label="Email"
                                type="email"
                                value={tenant.email || ''}
                                onChange={(e) => updateTenant(index, 'email', e.target.value)}
                                error={errors[`tenants.${index}.email`]}
                                className={`h-11 mt-2 ${errors.name ? 'border-red-500' : ''}`}
                                required
                            />

<Label htmlFor="name">
                                                Phone <span className="text-red-500">*</span>
                                            </Label>
                            <Input
                                label="Phone"
                                value={tenant.phone || ''}
                                onChange={(e) => updateTenant(index, 'phone', e.target.value)}
                                error={errors[`tenants.${index}.phone`]}
                                className={`h-11 mt-2 ${errors.name ? 'border-red-500' : ''}`}
                                required
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