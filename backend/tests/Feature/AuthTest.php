<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseMigrations;

    public function test_registration_cannot_escalate_role_and_requires_verification(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/register', ['name' => 'Rider', 'email' => 'rider@example.test', 'password' => 'StrongPassword123', 'password_confirmation' => 'StrongPassword123', 'role' => 'driver'])->assertCreated();
        $u = User::firstOrFail();
        $this->assertSame('passenger', $u->role);
        Notification::assertSentTo($u, VerifyEmail::class);
        $token = $this->postJson('/api/v1/auth/token', ['email' => $u->email, 'password' => 'StrongPassword123'])->assertOk()->json('token');
        $this->withToken($token)->getJson('/api/v1/state')->assertForbidden();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $u->id, 'hash' => sha1($u->email)]);
        $this->get($url)->assertOk();
        $this->assertNotNull($u->fresh()->email_verified_at);
        $this->get($url.'tampered')->assertForbidden();
    }

    public function test_native_token_expiry_and_logout(): void
    {
        $u = User::factory()->create();
        $token = $u->createToken('phone', ['*'], now()->addMinute())->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonMissingPath('user.password');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $expired = $u->createToken('old', ['*'], now()->subMinute())->plainTextToken;
        $this->app['auth']->forgetGuards();
        $this->withToken($expired)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_password_reset_revokes_tokens_and_increments_session_version(): void
    {
        Notification::fake();
        $u = User::factory()->create();
        $u->createToken('phone');
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $u->email])->assertOk();
        Notification::assertSentTo($u, ResetPassword::class);
        $reset = Password::createToken($u);
        $this->postJson('/api/v1/auth/reset-password', ['email' => $u->email, 'token' => $reset, 'password' => 'NewPassword1234', 'password_confirmation' => 'NewPassword1234'])->assertOk();
        $this->assertSame(0, $u->tokens()->count());
        $this->assertSame(2, $u->fresh()->auth_version);
        $this->postJson('/api/v1/auth/token', ['email' => $u->email, 'password' => 'NewPassword1234'])->assertOk();
    }

    public function test_login_throttling_and_private_response_headers(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/token', ['email' => 'wrong@example.test', 'password' => 'bad'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/token', ['email' => 'wrong@example.test', 'password' => 'bad'])->assertStatus(429);
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_web_login_requires_csrf_when_not_in_test_bypass(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/v1/auth/login', ['email' => 'test@example.test', 'password' => 'password'])->assertStatus(419);
    }

    public function test_unverified_and_anonymous_users_cannot_book(): void
    {
        $this->postJson('/api/v1/rides', [])->assertUnauthorized();
        $u = User::factory()->unverified()->create();
        $this->withToken($u->createToken('phone')->plainTextToken)->postJson('/api/v1/rides', [])->assertForbidden();
    }
}
