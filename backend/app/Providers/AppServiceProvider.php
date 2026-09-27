<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        URL::forceRootUrl(config('app.url'));
        URL::forceScheme(parse_url(config('app.url'), PHP_URL_SCHEME) ?: 'https');
        RateLimiter::for('auth', fn (Request $r) => [Limit::perMinute(20)->by($r->ip()), Limit::perMinute(5)->by(strtolower((string) $r->input('email')).'|'.$r->ip())]);
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(180)->by($r->user()?->id ?? $r->ip()));
        RateLimiter::for('bookings', fn (Request $r) => Limit::perMinute(10)->by($r->user()->id));
        ResetPassword::createUrlUsing(fn ($user, $token) => rtrim(config('app.frontend_url'), '/').'/?'.http_build_query(['resetToken' => $token, 'email' => $user->email]));
    }
}
