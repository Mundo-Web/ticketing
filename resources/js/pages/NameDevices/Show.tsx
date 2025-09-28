import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { ArrowLeft, Edit, Trash2, Image as ImageIcon, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useState } from 'react';
import { useForm } from '@inertiajs/react';

interface NameDevice {
    id: number;
    name: string;
    status: string;
    image?: string;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    [key: string]: unknown;
    nameDevice: NameDevice;
}

export default function Show() {
    const { nameDevice } = usePage<PageProps>().props;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { delete: destroy } = useForm();

    const handleDelete = () => {
        destroy(route('name-devices.destroy', nameDevice.id), {
            onSuccess: () => {
                toast.success('Device name deleted successfully');
                router.get(route('name-devices.index'));
            },
            onError: () => {
                toast.error('Error deleting device name');
            }
        });
    };

    return (
        <AppLayout>
            <Head title={`${nameDevice.name} - Device Name`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
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
                            <h1 className="text-3xl font-bold tracking-tight">{nameDevice.name}</h1>
                            <p className="text-muted-foreground">Device name details</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => router.get(route('name-devices.edit', nameDevice.id))}
                            className="flex items-center gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                                        <p className="text-base font-medium">{nameDevice.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <div className="mt-1">
                                            <Badge variant={nameDevice.status === 'active' ? 'default' : 'secondary'}>
                                                {nameDevice.status === 'active' ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-base">{new Date(nameDevice.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-base">{new Date(nameDevice.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Image */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Device Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nameDevice.image ? (
                                    <div className="space-y-4">
                                        <img
                                            src={`/storage/${nameDevice.image}`}
                                            alt={nameDevice.name}
                                            className="w-48 h-48 rounded-lg object-cover border shadow-sm"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Image available for this device type
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                                        <p className="text-base font-medium">No image available</p>
                                        <p className="text-sm text-muted-foreground">
                                            You can add an image by editing this device name
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.get(route('name-devices.edit', nameDevice.id))}
                                            className="mt-4"
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Add Image
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    onClick={() => router.get(route('name-devices.edit', nameDevice.id))}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Details
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="w-full justify-start"
                                    variant="outline"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Device Name
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Usage Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground">
                                        Usage statistics will be available here
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Device Name</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{nameDevice.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}