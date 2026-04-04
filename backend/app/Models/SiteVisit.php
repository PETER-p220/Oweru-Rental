<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SiteVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'tenant_id',
        'agent_id',
        'landlord_id',
        'requested_date',
        'preferred_time',
        'status', // pending, confirmed, cancelled, completed
        'notes',
        'contact_phone',
        'contact_email',
        'payment_status', // pending, paid, failed, refunded
        'payment_amount',
        'payment_transaction_id',
        'payment_method', // selcom, mobile_money, cash
        'confirmation_code',
        'reminded_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'preferred_time' => 'datetime',
        'reminded_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'payment_amount' => 'decimal:2',
    ];

    // Relationships
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(SiteVisitNotification::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeForAgent($query, $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    public function scopeForLandlord($query, $landlordId)
    {
        return $query->where('landlord_id', $landlordId);
    }

    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('requested_date', '>=', now())
                    ->where('status', '!=', 'cancelled');
    }

    // Methods
    public function generateConfirmationCode(): string
    {
        $code = 'SV' . strtoupper(substr(md5($this->id . time()), 0, 6));
        $this->update(['confirmation_code' => $code]);
        return $code;
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function canBeConfirmed(): bool
    {
        return $this->status === 'pending' && $this->isPaid();
    }

    public function confirm(): bool
    {
        if (!$this->canBeConfirmed()) {
            return false;
        }

        return $this->update([
            'status' => 'confirmed',
            'confirmation_code' => $this->generateConfirmationCode(),
        ]);
    }

    public function cancel(string $reason): bool
    {
        return $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancel_reason' => $reason,
        ]);
    }

    public function complete(): bool
    {
        return $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }
}
