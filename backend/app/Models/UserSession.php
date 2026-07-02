<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    protected $fillable = [
        'user_id',
        'device_fingerprint',
        'token_hash',
        'ip_address',
        'user_agent',
        'is_active',
        'login_at',
        'last_seen_at',
        'logout_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'login_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'logout_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
