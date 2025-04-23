<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NameDevice extends Model
{
    use HasFactory;

    // Especificamos la tabla explícitamente
    protected $table = 'name_devices';

    protected $fillable = [
        'name',
        'status',
    ];
}
