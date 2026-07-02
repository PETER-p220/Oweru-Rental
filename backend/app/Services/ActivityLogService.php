<?php

namespace App\Services;

use App\Models\UserActivityLog;
use Illuminate\Http\Request;

class ActivityLogService
{
    public static function log(
        ?int $userId,
        string $action,
        string $description,
        ?Request $request = null,
        array $metadata = []
    ): void {
        try {
            UserActivityLog::create([
                'user_id' => $userId,
                'action' => $action,
                'description' => $description,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'device_fingerprint' => $request?->header('X-Device-Fingerprint'),
                'metadata' => $metadata ?: null,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
