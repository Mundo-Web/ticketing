<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Owner extends Model
{
    use HasFactory;

    protected $fillable = [
        'building_id',
        'name',
        'email',
        'photo',
        'phone'
    ];

    public function building()
    {
        return $this->belongsTo(Building::class);
    }
}
