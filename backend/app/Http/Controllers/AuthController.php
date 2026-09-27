<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public static function profile(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role, 'verified' => $u->hasVerifiedEmail()];
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => 'required|string|max:100', 'email' => 'required|email|max:254|unique:users', 'password' => ['required', 'confirmed', 'max:128', PasswordRule::min(12)->letters()->numbers()]]);
        $user = User::create($data);
        event(new Registered($user));

        return response()->json(['message' => 'Account created. Check your email to verify, then sign in.'], 201);
    }

    public function login(Request $request): array
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string|max:128', 'deviceName' => 'sometimes|string|max:100']);

        return DB::transaction(function () use ($request, $data) {
            $user = User::where('email', $data['email'])->lockForUpdate()->first();
            if (! $user || ! Hash::check($data['password'], $user->password)) {
                throw ValidationException::withMessages(['email' => ['These credentials do not match our records.']]);
            }
            if ($request->is('api/v1/auth/token')) {
                $token = $user->createToken($data['deviceName'] ?? 'TAPSAKAY mobile', ['*'], now()->addDays(7));

                return ['user' => self::profile($user), 'token' => $token->plainTextToken];
            }
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
            $request->session()->put('auth_version', $user->auth_version);

            return ['user' => self::profile($user)];
        });
    }

    public function me(Request $r): array
    {
        return ['user' => self::profile($r->user())];
    }

    public function logout(Request $r): Response
    {
        $data = $r->validate(['pushDestination' => 'nullable|string|max:2048']);
        if (! empty($data['pushDestination'])) {
            DB::table('push_subscriptions')->where('user_id', $r->user()->id)->where('destination_hash', hash('sha256', $data['pushDestination']))->delete();
        }
        $token = $r->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
        if ($r->hasSession()) {
            Auth::guard('web')->logout();
            $r->session()->invalidate();
            $r->session()->regenerateToken();
        }

        return response()->noContent();
    }

    public function resend(Request $r): array
    {
        if (! $r->user()->hasVerifiedEmail()) {
            $r->user()->sendEmailVerificationNotification();
        }

        return ['message' => 'Verification email sent.'];
    }

    public function verify(Request $r, int $id, string $hash): Response
    {
        $user = User::findOrFail($id);
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);
        if (! $user->hasVerifiedEmail() && $user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response('Email verified. Return to TAPSAKAY and sign in or tap “Check verification”.')->header('Content-Type', 'text/plain');
    }

    public function forgot(Request $r): array
    {
        $data = $r->validate(['email' => 'required|email']);
        Password::sendResetLink($data);

        return ['message' => 'If that account exists, a reset link has been sent.'];
    }

    public function reset(Request $r): array
    {
        $data = $r->validate(['email' => 'required|email', 'token' => 'required|string', 'password' => ['required', 'confirmed', 'max:128', PasswordRule::min(12)->letters()->numbers()]]);
        $status = Password::reset($data, function (User $user, string $password) {
            DB::transaction(function () use ($user, $password) {
                $u = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                $u->forceFill(['password' => $password, 'remember_token' => Str::random(60), 'auth_version' => $u->auth_version + 1])->save();
                $u->tokens()->delete();
                DB::table('push_subscriptions')->where('user_id', $u->id)->delete();
                DB::table('sessions')->where('user_id', $u->id)->delete();
                event(new PasswordReset($u));
            });
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return ['message' => 'Password reset. Sign in with your new password.'];
    }
}
