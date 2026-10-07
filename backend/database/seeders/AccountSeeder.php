<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use RuntimeException;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $newAccounts = [];
        foreach ([
            ['Passenger', 'passenger@tapsakay.test', 'passenger'],
            ['Driver', 'driver@tapsakay.test', 'driver'],
        ] as [$name, $email, $role]) {
            if (User::query()->where('email', $email)->exists()) {
                continue;
            }

            $password = app()->environment(['local', 'testing'])
                ? 'Tapsakay12345'
                : $this->command?->secret("Password for {$email} (at least 12 characters, letters and numbers)");

            if ($password === null) {
                throw new RuntimeException('Run the account seeder interactively to set passwords for new accounts.');
            }

            Validator::make(['password' => $password], [
                'password' => ['required', 'string', 'max:128', Password::min(12)->letters()->numbers()],
            ])->validate();

            $newAccounts[] = [$name, $email, $role, $password];
        }

        foreach ($newAccounts as [$name, $email, $role, $password]) {
            $user = new User([
                'name' => $name,
                'email' => $email,
                'password' => $password,
            ]);
            $user->role = $role;
            $user->email_verified_at = now();
            $user->save();

            $this->command?->info("Created {$role} account: {$email}");
        }
    }
}
