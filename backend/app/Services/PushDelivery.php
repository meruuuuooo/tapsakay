<?php

namespace App\Services;

use App\Jobs\CheckExpoPushReceipt;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use RuntimeException;

class PushDelivery
{
    public function send(int $noticeId, int $subscriptionId): void
    {
        $notice = DB::table('notices')->find($noticeId);
        $subscription = DB::table('push_subscriptions')->find($subscriptionId);
        if (! $notice || ! $subscription || $notice->user_id !== $subscription->user_id) {
            return;
        }
        $payload = ['title' => $notice->title, 'body' => $notice->detail,
            'data' => ['rideId' => $notice->ride_id, 'noticeId' => $notice->id]];
        if ($subscription->platform === 'expo') {
            $response = Http::timeout(10)->post('https://exp.host/--/api/v2/push/send', [
                'to' => $subscription->destination, 'title' => $payload['title'], 'body' => $payload['body'],
                'data' => $payload['data'], 'sound' => 'default', 'channelId' => 'rides',
                'ttl' => $notice->title === 'New ride request' ? 120 : 3600,
            ])->throw()->json('data');
            if (($response['status'] ?? null) === 'error') {
                if (($response['details']['error'] ?? null) === 'DeviceNotRegistered') {
                    DB::table('push_subscriptions')->where('id', $subscriptionId)->delete();

                    return;
                }
                throw new RuntimeException('Expo rejected a push notification.');
            }
            if (! is_string($response['id'] ?? null)) {
                throw new RuntimeException('Expo did not return a push receipt ID.');
            }
            CheckExpoPushReceipt::dispatch($response['id'], $subscriptionId)->delay(now()->addMinutes(15));

            return;
        }
        $key = config('services.web_push');
        if (! $key['subject'] || ! $key['public_key'] || ! $key['private_key']) {
            throw new RuntimeException('Web Push VAPID credentials are not configured.');
        }
        $client = new WebPush(
            ['VAPID' => ['subject' => $key['subject'], 'publicKey' => $key['public_key'], 'privateKey' => $key['private_key']]],
            client: new Client(['timeout' => 10, 'allow_redirects' => false])
        );
        $data = json_decode(Crypt::decryptString($subscription->subscription), true, 512, JSON_THROW_ON_ERROR);
        $report = $client->sendOneNotification(Subscription::create([...$data, 'contentEncoding' => 'aes128gcm']), json_encode($payload, JSON_THROW_ON_ERROR), ['TTL' => $notice->title === 'New ride request' ? 120 : 3600]);
        if ($report->isSubscriptionExpired()) {
            DB::table('push_subscriptions')->where('id', $subscriptionId)->delete();
        } elseif (! $report->isSuccess()) {
            throw new RuntimeException('Web Push delivery failed.');
        }
    }
}
