<?php

use App\Models\User;
use App\Models\Vehicle;
use App\Services\Transport;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('rides:expire', function (Transport $transport) {
    $transport->expire();
    $this->info('Expired offers released.');
});
Schedule::command('rides:expire')->everyMinute()->withoutOverlapping();
Schedule::command('sanctum:prune-expired --hours=24')->daily();

Artisan::command('driver:create', function () {
    $data = ['name' => $this->ask('Driver name'), 'email' => strtolower($this->ask('Email')), 'password' => $this->secret('Password (at least 12 characters, letters and numbers)')];
    Validator::make($data, ['name' => 'required|max:100', 'email' => 'required|email|unique:users', 'password' => ['required', 'max:128', Password::min(12)->letters()->numbers()]])->validate();
    $user = new User($data);
    $user->role = 'driver';
    $user->save();
    $user->sendEmailVerificationNotification();
    $this->info("Driver #{$user->id} created; verification sent.");
});

Artisan::command('vehicle:assign', function (Transport $transport) {
    $email = $this->ask('Driver email');
    $driver = User::where('email', $email)->where('role', 'driver')->firstOrFail();
    $data = ['code' => $this->ask('New vehicle code'), 'capacity' => (int) $this->ask('Capacity', '8')];
    Validator::make($data, ['code' => 'required|string|max:40|unique:vehicles', 'capacity' => 'integer|min:1|max:8'])->validate();
    $transport->locked(function () use ($driver, $data) {
        if (Vehicle::where('driver_id', $driver->id)->exists()) {
            throw new RuntimeException('This driver already has a vehicle.');
        }
        $first = DB::table('stations')->where('route_id', 1)->orderBy('sequence')->value('id');
        $v = Vehicle::create([...$data, 'driver_id' => $driver->id, 'route_id' => 1, 'current_station_id' => $first]);
        DB::table('route_runs')->insert(['vehicle_id' => $v->id, 'started_at' => now()]);
    });
    $this->info('Vehicle assigned, empty and offline.');
});
