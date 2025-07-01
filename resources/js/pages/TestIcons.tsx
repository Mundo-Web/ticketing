import React from 'react';
import AppLayout from '@/layouts/app-layout';
import DeviceIcon from '@/components/DeviceIcon';
import { Card, CardContent } from '@/components/ui/card';

export default function TestIcons() {
    const testIcons = [
        'monitor', 'tv', 'camera', 'wifi', 'router', 'smartphone', 
        'speaker', 'laptop', 'desktop', 'tablet', 'printer'
    ];

    return (
        <AppLayout breadcrumbs={[{ title: "Test Icons", href: "/test-icons" }]}>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Device Icons Test</h1>
                <div className="grid grid-cols-4 gap-4">
                    {testIcons.map(iconId => (
                        <Card key={iconId} className="p-4">
                            <CardContent className="flex flex-col items-center gap-2">
                                <DeviceIcon deviceIconId={iconId} size={32} />
                                <span className="text-sm font-medium">{iconId}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
