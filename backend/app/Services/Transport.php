<?php

namespace App\Services;

use App\Models\Ride;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

class Transport
{
    // All transport writes acquire this route row first. This deliberately serializes
    // the small single-route fleet, including matching, so capacity reads cannot race.
    public function locked(callable $work): mixed
    {
        return DB::transaction(function () use ($work) {
            abort_unless(DB::table('routes')->where('id', 1)->lockForUpdate()->first(), 503, 'Route is not configured.');
            $this->expireLocked();

            return $work();
        }, 3);
    }

    private function expireLocked(): void
    {
        foreach (Ride::where('status', 'requested')->where('offer_expires_at', '<=', now())->get() as $ride) {
            $this->transition($ride, 'cancelled', null, 'The driver did not respond in time. Please book again.');
        }
    }

    public function expire(): void
    {
        $this->locked(fn () => null);
    }

    public function transition(Ride $ride, string $status, ?int $actor, ?string $reason = null): Ride
    {
        $ride->forceFill(['status' => $status, 'reason' => $reason])->save();
        DB::table('ride_events')->insert(['ride_id' => $ride->id, 'actor_id' => $actor, 'status' => $status, 'reason' => $reason, 'created_at' => now()]);
        $title = match ($status) {
            'requested' => 'New ride request', 'accepted' => 'Ride accepted',
            'waiting_pickup' => 'Ready for pickup', 'onboard' => 'Pickup confirmed',
            'approaching_dropoff' => 'Destination approaching', 'completed' => 'Ride completed',
            default => 'Ride cancelled',
        };
        $driver = Vehicle::findOrFail($ride->vehicle_id)->driver_id;
        foreach ([$ride->passenger_id, $driver] as $userId) {
            DB::table('notices')->insert(['user_id' => $userId, 'ride_id' => $ride->id, 'title' => $title,
                'detail' => $reason ?? "Ride #{$ride->id} · {$ride->passenger_count} passenger(s)", 'created_at' => now()]);
        }

        return $ride;
    }

    public function book(User $user, array $data, string $key): Ride
    {
        return $this->locked(function () use ($user, $data, $key) {
            $old = Ride::where('passenger_id', $user->id)->where('idempotency_key', $key)->first();
            if ($old) {
                abort_unless($old->pickup_id == $data['pickupId'] && $old->dropoff_id == $data['dropoffId'] && $old->passenger_count == $data['passengerCount'], 409, 'This booking key was already used for different details.');

                return $old;
            }
            abort_if(Ride::where('passenger_id', $user->id)->whereIn('status', Ride::ACTIVE)->exists(), 409, 'You already have an active ride.');
            $pickup = DB::table('stations')->where('route_id', 1)->find($data['pickupId']);
            $dropoff = DB::table('stations')->where('route_id', 1)->find($data['dropoffId']);
            abort_unless($pickup && $dropoff && $pickup->sequence < $dropoff->sequence, 422, 'Choose a pickup before the destination.');
            $vehicle = Vehicle::where('route_id', 1)->where('online', true)->where('heartbeat_at', '>', now()->subSeconds(120))->orderBy('id')->get()->first(function ($v) use ($pickup, $data) {
                return DB::table('stations')->find($v->current_station_id)->sequence <= $pickup->sequence
                    && $this->reserved($v->id) + $data['passengerCount'] <= $v->capacity;
            });
            abort_unless($vehicle, 409, 'No rela can reach this pickup with enough seats. Try again shortly.');
            $run = DB::table('route_runs')->where('vehicle_id', $vehicle->id)->whereNull('ended_at')->first();
            abort_unless($run, 409, 'The vehicle has no active route run.');
            $ride = Ride::create(['passenger_id' => $user->id, 'vehicle_id' => $vehicle->id, 'route_run_id' => $run->id,
                'pickup_id' => $pickup->id, 'dropoff_id' => $dropoff->id, 'passenger_count' => $data['passengerCount'],
                'status' => 'requested', 'idempotency_key' => $key, 'offer_expires_at' => now()->addSeconds(120)]);

            return $this->transition($ride, 'requested', $user->id);
        });
    }

    public function reserved(int $vehicle): int
    {
        return (int) Ride::where('vehicle_id', $vehicle)->whereIn('status', Ride::ACTIVE)->sum('passenger_count');
    }

    public function action(User $user, int $id, string $action): Ride
    {
        // Return conflicts outside the transaction so offer expirations stay committed.
        $result = $this->locked(function () use ($user, $id, $action) {
            $ride = Ride::findOrFail($id);
            $vehicle = Vehicle::findOrFail($ride->vehicle_id);
            abort_unless($action === 'cancel' ? $user->role === 'passenger' && $ride->passenger_id === $user->id : $user->role === 'driver' && $vehicle->driver_id === $user->id, 403);
            if ($ride->status === 'cancelled') {
                return in_array($action, ['cancel', 'decline']) ? $ride : null;
            }
            if ($ride->status === 'completed') {
                return $action === 'dropoff' ? $ride : null;
            }
            $next = null;
            $reason = null;
            if ($action === 'cancel' && in_array($ride->status, ['requested', 'accepted', 'waiting_pickup'])) {
                $next = 'cancelled';
                $reason = 'The passenger cancelled the ride.';
            } elseif ($action === 'decline' && $ride->status === 'requested') {
                $next = 'cancelled';
                $reason = 'The driver declined the request. Please book again.';
            } elseif ($action === 'accept') {
                if (in_array($ride->status, ['accepted', 'waiting_pickup', ...Ride::ONBOARD])) {
                    return $ride;
                }
                if ($ride->status === 'requested') {
                    $next = $vehicle->current_station_id === $ride->pickup_id ? 'waiting_pickup' : 'accepted';
                }
            } elseif ($action === 'pickup') {
                if (in_array($ride->status, Ride::ONBOARD)) {
                    return $ride;
                }
                if ($ride->status === 'waiting_pickup' && $vehicle->current_station_id === $ride->pickup_id) {
                    $next = 'onboard';
                }
            } elseif ($action === 'dropoff' && in_array($ride->status, Ride::ONBOARD) && $vehicle->current_station_id === $ride->dropoff_id) {
                $next = 'completed';
            }

            return $next ? $this->transition($ride, $next, $user->id, $reason) : null;
        });
        abort_unless($result, 409, 'This action is no longer available. Refresh the ride.');

        return $result;
    }

    public function driverAction(User $user, string $action, array $data = []): void
    {
        $this->locked(function () use ($user, $action, $data) {
            $v = Vehicle::where('driver_id', $user->id)->firstOrFail();
            if ($action === 'heartbeat') {
                $v->update(['heartbeat_at' => now()]);

                return;
            }
            if ($action === 'availability') {
                $v->update(['online' => $data['online'], 'heartbeat_at' => now()]);

                return;
            }
            $stations = DB::table('stations')->where('route_id', $v->route_id)->orderBy('sequence')->get();
            $current = $stations->firstWhere('id', $v->current_station_id);
            $rides = Ride::where('vehicle_id', $v->id)->whereIn('status', Ride::ACTIVE)->get();
            if ($action === 'restart') {
                abort_unless($v->current_station_id === $stations->last()->id && $rides->isEmpty(), 409, 'Finish the route and all rides before starting another run.');
                DB::table('route_runs')->where('vehicle_id', $v->id)->whereNull('ended_at')->update(['ended_at' => now()]);
                DB::table('route_runs')->insert(['vehicle_id' => $v->id, 'started_at' => now()]);
                $v->update(['current_station_id' => $stations->first()->id, 'heartbeat_at' => now()]);

                return;
            }
            // Expected station prevents a retried command from advancing twice.
            abort_unless($data['fromStationId'] === $v->current_station_id, 409, 'The vehicle has already moved. Refresh the route.');
            $next = $stations->first(fn ($s) => $s->sequence > $current->sequence);
            abort_unless($next, 409, 'You are at the terminal.');
            foreach ($rides as $ride) {
                $obligation = in_array($ride->status, Ride::ONBOARD) ? $ride->dropoff_id : $ride->pickup_id;
                abort_if($stations->firstWhere('id', $obligation)->sequence <= $current->sequence, 409, 'Resolve pickups, requests, and drop-offs at this station first.');
            }
            $v->update(['current_station_id' => $next->id, 'heartbeat_at' => now()]);
            foreach ($rides as $ride) {
                if ($ride->status === 'accepted' && $ride->pickup_id === $next->id) {
                    $this->transition($ride, 'waiting_pickup', $user->id);
                }
                if ($ride->status === 'onboard' && $stations->firstWhere('id', $ride->dropoff_id)->sequence <= $next->sequence + 1) {
                    $this->transition($ride, 'approaching_dropoff', $user->id);
                }
            }
        });
    }
}
