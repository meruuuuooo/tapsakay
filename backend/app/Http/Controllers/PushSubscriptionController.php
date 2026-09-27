<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PushSubscriptionController extends Controller
{
    public function config(): array
    {
        return ['publicKey' => config('services.web_push.public_key')];
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'platform' => ['required', Rule::in(['expo', 'web'])],
            'token' => ['required_if:platform,expo', 'string', 'max:255'],
            'subscription' => ['required_if:platform,web', 'array'],
            'subscription.endpoint' => ['required_if:platform,web', 'string', 'max:2048'],
            'subscription.keys.p256dh' => ['required_if:platform,web', 'string', 'max:255'],
            'subscription.keys.auth' => ['required_if:platform,web', 'string', 'max:255'],
        ]);
        $platform = $data['platform'];
        $destination = $platform === 'web' ? $data['subscription']['endpoint'] : $data['token'];
        if ($platform === 'web') {
            $host = parse_url($destination, PHP_URL_HOST);
            $allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
            abort_unless(str_starts_with($destination, 'https://') && is_string($host) && (in_array($host, $allowed, true) || str_ends_with($host, '.notify.windows.com') || str_ends_with($host, '.push.apple.com')), 422, 'Unsupported push endpoint.');
        } else {
            abort_unless(preg_match('/^(Exponent|Expo)PushToken\[[^\]]+\]$/', $destination), 422, 'Invalid Expo push token.');
        }
        DB::table('push_subscriptions')->upsert([[
            'destination_hash' => hash('sha256', $destination),
            'user_id' => $request->user()->id, 'platform' => $platform, 'destination' => $destination,
            'subscription' => $platform === 'web' ? Crypt::encryptString(json_encode($data['subscription'], JSON_THROW_ON_ERROR)) : null,
            'updated_at' => now(), 'created_at' => now(),
        ]], ['destination_hash'], ['user_id', 'platform', 'destination', 'subscription', 'updated_at']);

        return response()->json(['registered' => true]);
    }

    public function unsubscribe(Request $request): Response
    {
        $data = $request->validate(['destination' => 'required|string|max:2048']);
        DB::table('push_subscriptions')->where('user_id', $request->user()->id)->where('destination_hash', hash('sha256', $data['destination']))->delete();

        return response()->noContent();
    }
}
