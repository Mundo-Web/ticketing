<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo' => $this->photo,
            'apartment' => $this->when($this->apartment, function () {
                return [
                    'id' => $this->apartment->id,
                    'name' => $this->apartment->name,
                    'ubicacion' => $this->apartment->ubicacion,
                    'status' => $this->apartment->status,
                    'building' => $this->when($this->apartment->building, function () {
                        return [
                            'id' => $this->apartment->building->id,
                            'name' => $this->apartment->building->name,
                            'address' => $this->apartment->building->address,
                            'description' => $this->apartment->building->description,
                            'location_link' => $this->apartment->building->location_link,
                            'image' => $this->apartment->building->image,
                        ];
                    }),
                ];
            }),
            'devices_count' => $this->when($this->devices, $this->devices->count(), 0),
            'shared_devices_count' => $this->when($this->sharedDevices, $this->sharedDevices->count(), 0),
            'tickets_count' => $this->when($this->tickets, $this->tickets->count(), 0),
        ];
    }
}
