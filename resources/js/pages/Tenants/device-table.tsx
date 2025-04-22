"use client"

import { useState } from "react"
import { X, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Device = {
    id: number
    device: string
    brand: string
    system: string
}

interface DeviceTableProps {
    devices: Device[]
    onRemove: (id: number) => void
    onDuplicate: (id: number) => void
}

export default function DeviceTable({ devices, onRemove, onDuplicate }: DeviceTableProps) {
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)

    const toggleDropdown = (id: number) => {
        setOpenDropdown(openDropdown === id ? null : id)
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50">
                        <TableHead className="text-gray-700 font-semibold text-base py-4">id</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-base py-4">Device</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-base py-4">Brand</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-base py-4">System</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-base py-4">History</TableHead>
                        <TableHead className="text-gray-700 font-semibold text-base py-4"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map((device) => (
                        <TableRow key={device.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <TableCell className="text-gray-700 py-4 font-medium">{device.id}</TableCell>
                            <TableCell className="text-gray-700 py-4">{device.device}</TableCell>
                            <TableCell className="text-gray-700 py-4 relative">
                                {device.id === 3 ? (
                                    <div className="relative">
                                        <Button
                                            variant="outline"
                                            className="border-gray-300 text-gray-700 w-32 justify-between"
                                            onClick={() => toggleDropdown(device.id)}
                                        >
                                            {device.brand}
                                            <ChevronDown className="h-4 w-4 ml-2" />
                                        </Button>

                                        {openDropdown === device.id && (
                                            <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 shadow-lg rounded-md z-10 py-1">
                                                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-700">Hp</div>
                                                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-700">Epson</div>
                                                <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 flex items-center">
                                                    Agregar <Plus className="h-3 w-3 ml-1" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    device.brand
                                )}
                            </TableCell>
                            <TableCell className="text-gray-700 py-4">{device.system}</TableCell>
                            <TableCell className="text-gray-700 py-4">
                                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                                    View
                                </Button>
                            </TableCell>
                            <TableCell className="text-gray-700 py-4 space-x-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-red-200 text-red-500 hover:bg-red-50 rounded-full h-8 w-8"
                                    onClick={() => onRemove(device.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-green-200 text-green-500 hover:bg-green-50 rounded-full h-8 w-8"
                                    onClick={() => onDuplicate(device.id)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
