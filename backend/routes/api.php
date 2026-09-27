<?php

use App\Http\Controllers\AuthController as Auth;
use App\Http\Controllers\TransportController as Transport;
use App\Http\Middleware\ApiHeaders;
use App\Http\Middleware\SessionVersion;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware([ApiHeaders::class, 'throttle:api'])->group(function () {
    Route::post('auth/register', [Auth::class, 'register'])->middleware('throttle:auth');
    Route::post('auth/token', [Auth::class, 'login'])->middleware('throttle:auth');
    Route::post('auth/forgot-password', [Auth::class, 'forgot'])->middleware('throttle:auth');
    Route::post('auth/reset-password', [Auth::class, 'reset'])->middleware('throttle:auth');
    Route::middleware(['auth:sanctum', SessionVersion::class])->group(function () {
        Route::get('auth/me', [Auth::class, 'me']);
        Route::post('auth/logout', [Auth::class, 'logout']);
        Route::post('auth/verification-notification', [Auth::class, 'resend'])->middleware('throttle:3,1');
        Route::middleware('verified')->group(function () {
            Route::get('stations', [Transport::class, 'stations']);
            Route::get('state', [Transport::class, 'state']);
            Route::get('rides', [Transport::class, 'history']);
            Route::get('rides/{id}', [Transport::class, 'show'])->whereNumber('id');
            Route::post('rides', [Transport::class, 'book'])->middleware('throttle:bookings');
            Route::post('rides/{id}/{action}', [Transport::class, 'action'])->whereNumber('id')->whereIn('action', ['accept', 'decline', 'cancel', 'pickup', 'dropoff']);
            Route::get('notifications', [Transport::class, 'notices']);
            Route::post('driver/{action}', [Transport::class, 'driver'])->whereIn('action', ['heartbeat', 'availability', 'advance', 'restart']);
        });
    });
});
