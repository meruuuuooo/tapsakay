<?php

use App\Http\Controllers\AuthController;
use App\Http\Middleware\ApiHeaders;
use Illuminate\Support\Facades\Route;

Route::post('/api/v1/auth/login', [AuthController::class, 'login'])->middleware([ApiHeaders::class, 'throttle:auth']);
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verify'])->middleware(['signed', 'throttle:6,1', ApiHeaders::class])->name('verification.verify');
Route::get('/', fn () => response()->json(['service' => 'TAPSAKAY API', 'version' => 1]));
