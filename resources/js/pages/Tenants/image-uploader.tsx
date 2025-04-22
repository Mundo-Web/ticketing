"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ImageUploader() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    return (
        <div
            className="w-full h-[250px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {previewUrl ? (
                <div className="relative w-full h-full">
                    <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-contain p-2" />
                    <Button
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 right-2 bg-white"
                        onClick={(e) => {
                            e.stopPropagation()
                            setPreviewUrl(null)
                            if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                    >
                        Change Image
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        {previewUrl ? <ImageIcon className="h-12 w-12" /> : <Upload className="h-12 w-12" />}
                        <p className="text-xs font-medium">Drag and drop an image here or click to browse</p>
                        <p className="text-xs text-gray-400">Supports JPG, PNG, GIF up to 10MB</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                        Select Image
                    </Button>
                </>
            )}
        </div>
    )
}
