<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model
{
    /** @use HasFactory<\Database\Factories\BrandFactory> */
    use HasFactory;
    USE SoftDeletes;
    protected $fillable = [
        'name',
        'status',
        'name_device_id'
    ];

    public function nameDevice()
    {
        return $this->belongsTo(NameDevice::class);
    }
}
