<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    public const ACTIVE = ['requested', 'accepted', 'waiting_pickup', 'onboard', 'approaching_dropoff'];

    public const ONBOARD = ['onboard', 'approaching_dropoff'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['offer_expires_at' => 'datetime'];
    }
}
