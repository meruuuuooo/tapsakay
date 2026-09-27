<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CheckExpoPushReceipt implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public string $receiptId, public int $subscriptionId) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (! DB::table('push_subscriptions')->where('id', $this->subscriptionId)->exists()) {
            return;
        }
        $receipt = Http::timeout(10)->post('https://exp.host/--/api/v2/push/getReceipts', ['ids' => [$this->receiptId]])->throw()->json("data.{$this->receiptId}");
        if (($receipt['details']['error'] ?? null) === 'DeviceNotRegistered') {
            DB::table('push_subscriptions')->where('id', $this->subscriptionId)->delete();
        }
    }
}
