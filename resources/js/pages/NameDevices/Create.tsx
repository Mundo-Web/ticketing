import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        status: 'active',
        image: null as File | null,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(null);
        // Clear the file input
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('status', data.status);
        if (data.image) {
            formData.append('image', data.image);
        }

        post(route('name-devices.store'), {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Device name created successfully');
                router.get(route('name-devices.index'));
            },
            onError: () => {
                toast.error('Error creating device name');
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Create Device Name" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.get(route('name-devices.index'))}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Device Name</h1>
                        <p className="text-muted-foreground">
                            Add a new device name with optional image
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Fields */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Device Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Enter device name"
                                                className={errors.name ? 'border-destructive' : ''}
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-destructive">{errors.name}</p>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status *</Label>
                                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <p className="text-sm text-destructive">{errors.status}</p>
                                            )}
                                        </div>

                                        {/* Image Upload */}
                                        <div className="space-y-2">
                                            <Label htmlFor="image">Image</Label>
                                            <div className="space-y-4">
                                                <Input
                                                    id="image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className={errors.image ? 'border-destructive' : ''}
                                                />
                                                {errors.image && (
                                                    <p className="text-sm text-destructive">{errors.image}</p>
                                                )}
                                                
                                                {/* Image Preview */}
                                                {imagePreview && (
                                                    <div className="relative inline-block">
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="w-32 h-32 rounded-lg object-cover border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                                            onClick={removeImage}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end pt-6">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? (
                                                <>Processing...</>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Create Device Name
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Help Card */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Naming Convention</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Use descriptive names</li>
                                        <li>• Avoid special characters</li>
                                        <li>• Keep it concise</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium mb-2">Image Requirements</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Max size: 2MB</li>
                                        <li>• Formats: JPG, PNG, GIF, WEBP</li>
                                        <li>• Recommended: Square images</li>
                                        <li>• Optional but recommended</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Status</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Active: Available for selection</li>
                                        <li>• Inactive: Hidden from selection</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}