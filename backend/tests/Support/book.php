<?php

use App\Models\User;
use App\Services\Transport;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
try {
    app(Transport::class)->book(User::findOrFail($argv[1]), ['pickupId' => 1, 'dropoffId' => 4, 'passengerCount' => 5], (string) Str::uuid());
    echo 'booked';
} catch (HttpException $e) {
    if ($e->getStatusCode() !== 409) {
        throw $e;
    }
    echo 'conflict';
}
