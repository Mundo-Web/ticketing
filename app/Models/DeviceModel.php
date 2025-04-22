<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceModel extends Model
{
    use HasFactory;

    // Especificamos la tabla explícitamente
    protected $table = 'models';

    protected $fillable = [
        'name',
        'status',
    ];
}
