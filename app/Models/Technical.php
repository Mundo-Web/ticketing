<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Technical extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'photo',
        'phone',
        'shift',
        'status',
        'visible',
        'is_default',
    ];
}
