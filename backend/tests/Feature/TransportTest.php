<?php

namespace Tests\Feature;

use App\Models\Ride;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\Transport;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class TransportTest extends TestCase
{
    use DatabaseMigrations;

    private User $driver;

    private Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $this->driver = User::factory()->create(['role' => 'driver']);
        $this->vehicle = Vehicle::create(['code' => 'Rela #01', 'driver_id' => $this->driver->id, 'route_id' => 1, 'current_station_id' => 1, 'capacity' => 8, 'online' => true, 'heartbeat_at' => now()]);
        DB::table('route_runs')->insert(['vehicle_id' => $this->vehicle->id, 'started_at' => now()]);
    }

    private function passenger(): User
    {
        return User::factory()->create();
    }

    private function book(User $u, int $count = 2, int $pickup = 1, int $dropoff = 4): Ride
    {
        return app(Transport::class)->book($u, ['pickupId' => $pickup, 'dropoffId' => $dropoff, 'passengerCount' => $count], (string) Str::uuid());
    }

    private function act(int $ride, string $action)
    {
        Sanctum::actingAs($this->driver);

        return $this->postJson("/api/v1/rides/$ride/$action");
    }

    public function test_two_groups_complete_a_shared_ride_with_persisted_history(): void
    {
        $p1 = $this->passenger();
        $p2 = $this->passenger();
        $a = $this->book($p1, 3);
        $b = $this->book($p2, 2, 2, 3);
        $this->act($a->id, 'accept')->assertOk()->assertJsonPath('data.status', 'waiting_pickup');
        $this->act($b->id, 'accept')->assertOk()->assertJsonPath('data.status', 'accepted');
        $this->act($a->id, 'pickup')->assertOk();
        $this->act($a->id, 'pickup')->assertOk();
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 1])->assertNoContent();
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 1])->assertConflict();
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 2])->assertConflict();
        $this->act($b->id, 'pickup')->assertOk();
        $this->getJson('/api/v1/state')->assertJsonPath('relas.0.passengers', 5)->assertJsonPath('relas.0.availableSeats', 3);
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 2])->assertNoContent();
        $this->act($a->id, 'dropoff')->assertConflict();
        $this->act($b->id, 'dropoff')->assertOk();
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 3])->assertNoContent();
        $this->act($a->id, 'dropoff')->assertOk();
        $this->act($a->id, 'dropoff')->assertOk();
        $this->getJson('/api/v1/state')->assertJsonPath('relas.0.passengers', 0)->assertJsonPath('relas.0.availableSeats', 8);
        Sanctum::actingAs($p1);
        $this->getJson('/api/v1/rides')->assertJsonCount(1, 'data')->assertJsonPath('data.0.status', 'completed');
        $this->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('data.0.title', 'Ride completed');
        $this->assertDatabaseCount('ride_events', 11);
    }

    public function test_reservations_prevent_overbooking_and_cancel_releases_seats(): void
    {
        $p = $this->passenger();
        $a = $this->book($p, 6);
        Sanctum::actingAs($this->passenger());
        $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson('/api/v1/rides', ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 3])->assertConflict();
        Sanctum::actingAs($p);
        $this->postJson("/api/v1/rides/{$a->id}/cancel")->assertOk();
        $this->assertSame(0, app(Transport::class)->reserved($this->vehicle->id));
        $this->act($a->id, 'accept')->assertConflict();
    }

    public function test_idempotent_booking_and_one_active_booking(): void
    {
        Sanctum::actingAs($this->passenger());
        $body = ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 2];
        $key = (string) Str::uuid();
        $first = $this->withHeader('Idempotency-Key', $key)->postJson('/api/v1/rides', $body)->assertCreated()->json('data.id');
        $this->postJson('/api/v1/rides', $body)->assertCreated()->assertJsonPath('data.id', $first);
        $this->postJson('/api/v1/rides', [...$body, 'passengerCount' => 3])->assertConflict();
        $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson('/api/v1/rides', $body)->assertConflict();
        $this->assertDatabaseCount('rides', 1);
        $this->assertDatabaseCount('notices', 2);
    }

    public function test_expired_offers_cannot_be_accepted_and_release_reservations(): void
    {
        $ride = $this->book($this->passenger());
        $this->travel(121)->seconds();
        $this->act($ride->id, 'accept')->assertConflict();
        $this->assertDatabaseHas('rides', ['id' => $ride->id, 'status' => 'cancelled']);
        $this->assertSame(0, app(Transport::class)->reserved($this->vehicle->id));
        $this->getJson('/api/v1/state')->assertJsonPath('relas.0.status', 'offline');
    }

    public function test_ownership_and_role_checks(): void
    {
        $ride = $this->book($this->passenger());
        Sanctum::actingAs($this->passenger());
        $this->getJson("/api/v1/rides/{$ride->id}")->assertForbidden();
        foreach (['accept', 'cancel', 'pickup', 'decline', 'dropoff'] as $action) {
            $this->postJson("/api/v1/rides/{$ride->id}/$action")->assertForbidden();
        }
        $this->postJson('/api/v1/driver/availability', ['online' => true])->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'driver']));
        $this->postJson("/api/v1/rides/{$ride->id}/accept")->assertForbidden();
        $this->getJson('/api/v1/state')->assertJsonCount(0, 'rides');
    }

    public function test_invalid_routes_and_counts_are_rejected(): void
    {
        Sanctum::actingAs($this->passenger());
        foreach ([[4, 1, 1], [1, 1, 1], [1, 99, 1], [1, 4, 9], [1, 4, 0]] as [$pickup, $dropoff, $count]) {
            $this->withHeader('Idempotency-Key', (string) Str::uuid())->postJson('/api/v1/rides', ['pickupId' => $pickup, 'dropoffId' => $dropoff, 'passengerCount' => $count])->assertUnprocessable();
        }
    }

    public function test_offline_vehicle_keeps_obligations_and_restart_is_guarded(): void
    {
        $ride = $this->book($this->passenger());
        $this->act($ride->id, 'accept')->assertOk();
        $this->postJson('/api/v1/driver/availability', ['online' => false])->assertNoContent();
        $this->act($ride->id, 'pickup')->assertOk();
        $this->postJson('/api/v1/driver/restart')->assertConflict();
        foreach ([1, 2, 3] as $station) {
            $this->postJson('/api/v1/driver/advance', ['fromStationId' => $station])->assertNoContent();
        }
        $this->act($ride->id, 'dropoff')->assertOk();
        $this->postJson('/api/v1/driver/advance', ['fromStationId' => 4])->assertNoContent();
        $this->postJson('/api/v1/driver/restart')->assertNoContent();
        $this->assertDatabaseCount('route_runs', 2);
        $this->assertSame(1, $this->vehicle->fresh()->current_station_id);
    }

    public function test_concurrent_bookings_use_mysql_locks(): void
    {
        $users = [$this->passenger(), $this->passenger()];
        $processes = array_map(fn ($u) => new Process([PHP_BINARY, base_path('tests/Support/book.php'), (string) $u->id], base_path(), [
            'APP_ENV' => 'testing', 'DB_CONNECTION' => 'mysql', 'DB_DATABASE' => config('database.connections.mysql.database'),
            'DB_HOST' => config('database.connections.mysql.host'), 'DB_PORT' => (string) config('database.connections.mysql.port'),
            'DB_SOCKET' => config('database.connections.mysql.unix_socket'), 'DB_USERNAME' => config('database.connections.mysql.username'), 'DB_PASSWORD' => config('database.connections.mysql.password') ?? '',
        ]), $users);
        foreach ($processes as $p) {
            $p->start();
        }
        $outputs = [];
        foreach ($processes as $p) {
            $p->wait();
            $this->assertSame(0, $p->getExitCode(), $p->getErrorOutput());
            $outputs[] = trim($p->getOutput());
        }
        sort($outputs);
        $this->assertSame(['booked', 'conflict'], $outputs);
        $this->assertSame(5, app(Transport::class)->reserved($this->vehicle->id));
        $this->assertDatabaseCount('rides', 1);
    }
}
