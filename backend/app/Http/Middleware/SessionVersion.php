<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class SessionVersion
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->hasSession() && $request->user() && ! ($request->user()->currentAccessToken() instanceof PersonalAccessToken)) {
            abort_unless($request->session()->get('auth_version') === $request->user()->auth_version, 401, 'Please sign in again.');
        }

        return $next($request);
    }
}
