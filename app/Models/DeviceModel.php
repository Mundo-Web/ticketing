<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeviceModel extends Model
{
    use HasFactory;
    use SoftDeletes;


    protected $table = 'models';

    protected $fillable = [
        'name',
        'status',
        'brand_id',
    ];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }
}
