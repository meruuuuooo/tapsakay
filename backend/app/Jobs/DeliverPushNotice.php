<?php

namespace App\Jobs;

use App\Services\PushDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeliverPushNotice implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $noticeId, public int $subscriptionId) {}

    /**
     * Execute the job.
     */
    public function handle(PushDelivery $delivery): void
    {
        $delivery->send($this->noticeId, $this->subscriptionId);
    }
}
