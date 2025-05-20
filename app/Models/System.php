<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class System extends Model
{
    /** @use HasFactory<\Database\Factories\SystemFactory> */
    use HasFactory;
    USE SoftDeletes;
    protected $fillable = [
        'name',
        'status',
        'model_id'
    ];

    public function model()
    {
        return $this->belongsTo(DeviceModel::class);
    }
}
