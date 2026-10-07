<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            return;
        }

        foreach ([
            ['Passenger', 'passenger@tapsakay.test', 'passenger'],
            ['Driver', 'driver@tapsakay.test', 'driver'],
        ] as [$name, $email, $role]) {
            if (User::query()->where('email', $email)->exists()) {
                continue;
            }

            $user = new User([
                'name' => $name,
                'email' => $email,
                'password' => 'Tapsakay12345',
            ]);
            $user->role = $role;
            $user->email_verified_at = now();
            $user->save();
        }
    }
}
