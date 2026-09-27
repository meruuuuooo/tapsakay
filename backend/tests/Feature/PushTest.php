<?php

namespace Tests\Feature;

use App\Jobs\DeliverPushNotice;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\PushDelivery;
use App\Services\Transport;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushTest extends TestCase
{
    use DatabaseMigrations;

    private function register(User $user, string $token): void
    {
        Sanctum::actingAs($user);
        $this->postJson('/api/v1/push/subscriptions', ['platform' => 'expo', 'token' => $token])->assertOk();
    }

    public function test_registration_is_verified_user_scoped_and_logout_removes_only_current_destination(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();
        $this->register($first, 'ExpoPushToken[first]');
        $this->register($first, 'ExpoPushToken[second]');
        Sanctum::actingAs($second);
        $this->postJson('/api/v1/push/unsubscribe', ['destination' => 'ExpoPushToken[first]'])->assertNoContent();
        $this->assertDatabaseCount('push_subscriptions', 2);
        Sanctum::actingAs($first);
        $this->postJson('/api/v1/auth/logout', ['pushDestination' => 'ExpoPushToken[first]'])->assertNoContent();
        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', ['destination' => 'ExpoPushToken[second]']);
        Sanctum::actingAs(User::factory()->unverified()->create());
        $this->postJson('/api/v1/push/subscriptions', ['platform' => 'expo', 'token' => 'ExpoPushToken[other]'])->assertForbidden();
    }

    public function test_browser_subscription_is_validated_and_encrypted(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $subscription = ['endpoint' => 'https://fcm.googleapis.com/fcm/send/example', 'keys' => ['p256dh' => 'public', 'auth' => 'secret']];
        $this->postJson('/api/v1/push/subscriptions', ['platform' => 'web', 'subscription' => $subscription])->assertOk();
        $stored = DB::table('push_subscriptions')->first();
        $this->assertSame('web', $stored->platform);
        $this->assertStringNotContainsString('secret', $stored->subscription);
        $subscription['endpoint'] = 'https://example.test/internal';
        $this->postJson('/api/v1/push/subscriptions', ['platform' => 'web', 'subscription' => $subscription])->assertUnprocessable();
    }

    public function test_only_other_party_receives_a_job(): void
    {
        Queue::fake();
        $driver = User::factory()->create(['role' => 'driver']);
        $passenger = User::factory()->create();
        $this->seed();
        $vehicle = Vehicle::create(['code' => 'Push rela', 'driver_id' => $driver->id, 'route_id' => 1, 'current_station_id' => 1, 'capacity' => 8, 'online' => true, 'heartbeat_at' => now()]);
        DB::table('route_runs')->insert(['vehicle_id' => $vehicle->id, 'started_at' => now()]);
        $this->register($driver, 'ExpoPushToken[driver]');
        $this->register($passenger, 'ExpoPushToken[passenger]');
        $transport = app(Transport::class);
        $ride = $transport->book($passenger, ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 1], (string) Str::uuid());
        Queue::assertPushed(DeliverPushNotice::class, 1);
        Queue::assertPushed(DeliverPushNotice::class, fn ($job) => DB::table('notices')->find($job->noticeId)->user_id === $driver->id);
        $transport->action($driver, $ride->id, 'accept');
        Queue::assertPushed(DeliverPushNotice::class, 2);
        Queue::assertPushed(DeliverPushNotice::class, fn ($job) => DB::table('notices')->find($job->noticeId)->user_id === $passenger->id);
    }

    public function test_rolled_back_transition_does_not_enqueue_push(): void
    {
        config(['queue.default' => 'database']);
        $driver = User::factory()->create(['role' => 'driver']);
        $passenger = User::factory()->create();
        $this->seed();
        $vehicle = Vehicle::create(['code' => 'Rollback rela', 'driver_id' => $driver->id, 'route_id' => 1, 'current_station_id' => 1, 'capacity' => 8, 'online' => true, 'heartbeat_at' => now()]);
        DB::table('route_runs')->insert(['vehicle_id' => $vehicle->id, 'started_at' => now()]);
        $this->register($driver, 'ExpoPushToken[driver]');
        $this->register($passenger, 'ExpoPushToken[passenger]');
        $transport = app(Transport::class);
        $ride = $transport->book($passenger, ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 1], (string) Str::uuid());
        $this->assertDatabaseCount('jobs', 1);
        try {
            DB::transaction(function () use ($transport, $driver, $ride) {
                $transport->action($driver, $ride->id, 'accept');
                throw new \RuntimeException('rollback');
            });
        } catch (\RuntimeException) {
        }
        $this->assertDatabaseCount('jobs', 1);
    }

    public function test_expo_invalid_token_is_removed_after_delivery_error(): void
    {
        $user = User::factory()->create();
        $this->register($user, 'ExpoPushToken[expired]');
        $vehicleDriver = User::factory()->create(['role' => 'driver']);
        $this->seed();
        $vehicle = Vehicle::create(['code' => 'Test rela', 'driver_id' => $vehicleDriver->id, 'route_id' => 1, 'current_station_id' => 1, 'capacity' => 8, 'online' => true, 'heartbeat_at' => now()]);
        DB::table('route_runs')->insert(['vehicle_id' => $vehicle->id, 'started_at' => now()]);
        app(Transport::class)->book($user, ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 1], (string) Str::uuid());
        $notice = DB::table('notices')->where('user_id', $user->id)->first();
        Http::fake(['exp.host/*' => Http::response(['data' => ['status' => 'error', 'details' => ['error' => 'DeviceNotRegistered']]], 200)]);
        app(PushDelivery::class)->send($notice->id, DB::table('push_subscriptions')->first()->id);
        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
