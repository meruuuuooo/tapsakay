<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['online' => 'boolean', 'heartbeat_at' => 'datetime'];
    }
}
