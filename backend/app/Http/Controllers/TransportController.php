<?php

namespace App\Http\Controllers;

use App\Models\Ride;
use App\Models\Vehicle;
use App\Services\Transport;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TransportController extends Controller
{
    public function __construct(private Transport $transport) {}

    public static function ride(Ride $r): array
    {
        return ['id' => $r->id, 'pickupId' => $r->pickup_id, 'dropoffId' => $r->dropoff_id,
            'passengerCount' => $r->passenger_count, 'relaId' => $r->vehicle_id, 'status' => $r->status,
            'reason' => $r->reason, 'createdAt' => $r->created_at->toIso8601String(), 'offerExpiresAt' => $r->offer_expires_at->toIso8601String()];
    }

    private function vehicles(Collection $vehicles): array
    {
        return $vehicles->map(function ($v) {
            $reserved = $this->transport->reserved($v->id);
            $online = $v->online && $v->heartbeat_at?->gt(now()->subSeconds(120));

            return ['id' => $v->id, 'code' => $v->code, 'capacity' => $v->capacity,
                'passengers' => (int) Ride::where('vehicle_id', $v->id)->whereIn('status', Ride::ONBOARD)->sum('passenger_count'),
                'reservedSeats' => $reserved, 'availableSeats' => $v->capacity - $reserved,
                'currentStationId' => $v->current_station_id, 'status' => ! $online ? 'offline' : ($reserved >= $v->capacity ? 'full' : 'online'),
                'driverName' => DB::table('users')->where('id', $v->driver_id)->value('name')];
        })->all();
    }

    public function stations(): array
    {
        return ['data' => DB::table('stations')->where('route_id', 1)->orderBy('sequence')->get()->map(fn ($s) => [
            'id' => $s->id, 'name' => $s->name, 'sequence' => $s->sequence, 'latitude' => (float) $s->latitude, 'longitude' => (float) $s->longitude])];
    }

    public function state(Request $r): array
    {
        return $this->transport->locked(function () use ($r) {
            $driver = $r->user()->role === 'driver';
            $vehicle = $driver ? Vehicle::where('driver_id', $r->user()->id)->first() : null;
            $rides = $driver ? Ride::where('vehicle_id', $vehicle?->id ?? 0) : Ride::where('passenger_id', $r->user()->id);
            $active = (clone $rides)->whereIn('status', Ride::ACTIVE)->orderBy('id')->get();
            $latest = $driver ? null : (clone $rides)->latest('id')->first();

            return ['rides' => $active->map(self::ride(...)), 'ride' => $latest ? self::ride($latest) : null,
                'relas' => $this->vehicles($driver ? collect($vehicle ? [$vehicle] : []) : Vehicle::orderBy('id')->get()),
                'serverTime' => now()->toIso8601String()];
        });
    }

    public function history(Request $r): LengthAwarePaginator
    {
        $query = $r->user()->role === 'driver' ? Ride::whereIn('vehicle_id', Vehicle::where('driver_id', $r->user()->id)->select('id')) : Ride::where('passenger_id', $r->user()->id);

        return $query->latest('id')->paginate(20)->through(self::ride(...));
    }

    public function notices(Request $r): LengthAwarePaginator
    {
        return DB::table('notices')->where('user_id', $r->user()->id)->latest('id')->paginate(20, ['id', 'ride_id as rideId', 'title', 'detail', 'created_at as createdAt']);
    }

    public function show(Request $r, int $id): array
    {
        $ride = Ride::findOrFail($id);
        abort_unless($ride->passenger_id === $r->user()->id || ($r->user()->role === 'driver' && Vehicle::whereKey($ride->vehicle_id)->where('driver_id', $r->user()->id)->exists()), 403);

        return ['data' => self::ride($ride)];
    }

    public function book(Request $r): JsonResponse
    {
        abort_unless($r->user()->role === 'passenger', 403);
        $r->merge(['idempotencyKey' => $r->header('Idempotency-Key')]);
        $data = $r->validate(['pickupId' => 'required|integer', 'dropoffId' => 'required|integer', 'passengerCount' => 'required|integer|min:1|max:8', 'idempotencyKey' => 'required|uuid']);

        return response()->json(['data' => self::ride($this->transport->book($r->user(), $data, $data['idempotencyKey']))], 201);
    }

    public function action(Request $r, int $id, string $action): array
    {
        return ['data' => self::ride($this->transport->action($r->user(), $id, $action))];
    }

    public function driver(Request $r, string $action): Response
    {
        abort_unless($r->user()->role === 'driver', 403);
        $data = match ($action) {
            'availability' => $r->validate(['online' => 'required|boolean']),
            'advance' => $r->validate(['fromStationId' => 'required|integer']), default => [],
        };
        $this->transport->driverAction($r->user(), $action, $data);

        return response()->noContent();
    }
}
