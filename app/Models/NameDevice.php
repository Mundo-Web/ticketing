<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NameDevice extends Model
{
    use HasFactory;
    use SoftDeletes;

    // Especificamos la tabla explícitamente
    protected $table = 'name_devices';

    protected $fillable = [
        'name',
        'status',
        'image',
    ];
}
