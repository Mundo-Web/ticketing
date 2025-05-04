<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doorman extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'name',
        'email',
        'photo',
        'phone',
        'shift',
        'status',
        'visible'
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }
}
