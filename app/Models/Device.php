<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    /** @use HasFactory<\Database\Factories\DeviceFactory> */
    use HasFactory;
    protected $fillable = [
        'name',
        'brand_id',
        'system_id',
        'model_id',
        'status',
    ];


    public function apartments()
    {
        return $this->belongsToMany(Apartment::class, 'apartment_device');
    }



    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function system()
    {
        return $this->belongsTo(System::class);
    }

    public function model()
    {
        return $this->belongsTo(DeviceModel::class);
    }
}
