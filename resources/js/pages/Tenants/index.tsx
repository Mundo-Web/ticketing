"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import DeviceTable from "./device-table"
import ImageUploader from "./image-uploader"
import AppLayout from "@/layouts/app-layout"
import { Head } from "@inertiajs/react"
import { BreadcrumbItem } from "@/types"

type Device = {
    id: number
    device: string
    brand: string
    system: string
}

export default function Index() {
    const [devices, setDevices] = useState<Device[]>([
        { id: 1, device: "Laptop", brand: "Hp", system: "Windows" },
        { id: 2, device: "Impresora", brand: "Epson", system: "Android" },
        { id: 3, device: "Smart TV", brand: "choose", system: "WebOs" },
    ])

    const addDevice = () => {
        const newId = devices.length > 0 ? Math.max(...devices.map((d) => d.id)) + 1 : 1
        setDevices([...devices, { id: newId, device: "", brand: "", system: "" }])
    }

    const removeDevice = (id: number) => {
        setDevices(devices.filter((device) => device.id !== id))
    }

    const duplicateDevice = (id: number) => {
        const deviceToDuplicate = devices.find((device) => device.id === id)
        if (deviceToDuplicate) {
            const newId = Math.max(...devices.map((d) => d.id)) + 1
            setDevices([...devices, { ...deviceToDuplicate, id: newId }])
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenants" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex gap-4">
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
            </div>
        </AppLayout>
    )
}
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tenants', href: '/tenants' }
];