<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['passenger', 'driver'])->default('passenger');
            $table->unsignedInteger('auth_version')->default(1);
        });
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained();
            $table->string('name');
            $table->unsignedSmallInteger('sequence');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unique(['route_id', 'sequence']);
        });
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('driver_id')->unique()->constrained('users');
            $table->foreignId('route_id')->constrained();
            $table->foreignId('current_station_id')->constrained('stations');
            $table->unsignedTinyInteger('capacity')->default(8);
            $table->boolean('online')->default(false);
            $table->timestamp('heartbeat_at')->nullable();
            $table->timestamps();
        });
        Schema::create('route_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
        });
        Schema::create('rides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passenger_id')->constrained('users');
            $table->foreignId('vehicle_id')->constrained();
            $table->foreignId('route_run_id')->constrained();
            $table->foreignId('pickup_id')->constrained('stations');
            $table->foreignId('dropoff_id')->constrained('stations');
            $table->unsignedTinyInteger('passenger_count');
            $table->string('status', 32)->index();
            $table->string('reason')->nullable();
            $table->uuid('idempotency_key');
            $table->timestamp('offer_expires_at');
            $table->timestamps();
            $table->unique(['passenger_id', 'idempotency_key']);
            $table->index(['vehicle_id', 'status']);
            $table->index(['passenger_id', 'status']);
        });
        Schema::create('ride_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ride_id')->constrained();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('status', 32);
            $table->string('reason')->nullable();
            $table->timestamp('created_at');
        });
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('ride_id')->constrained();
            $table->string('title');
            $table->string('detail');
            $table->timestamp('created_at');
            $table->index(['user_id', 'id']);
        });
    }

    public function down(): void
    {
        foreach (['notices', 'ride_events', 'rides', 'route_runs', 'vehicles', 'stations', 'routes'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'auth_version']));
    }
};
