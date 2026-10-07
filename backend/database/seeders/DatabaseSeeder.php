<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AccountSeeder::class);

        DB::table('routes')->insertOrIgnore(['id' => 1, 'name' => 'CBM–Terminal']);
        foreach ([['CBM', 7.86202, 125.05083], ['CMU Gate', 7.85903, 125.05216], ['Hospital', 7.85825, 125.04739], ['Market', 7.7603, 125.0031], ['Terminal', 7.75992, 125.00228]] as $i => [$name, $lat, $lng]) {
            DB::table('stations')->insertOrIgnore(['id' => $i + 1, 'route_id' => 1, 'name' => $name, 'sequence' => $i + 1, 'latitude' => $lat, 'longitude' => $lng]);
        }
    }
}
