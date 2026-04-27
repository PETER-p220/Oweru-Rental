<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
        'status',
        'message',
        'rejection_reason',
        'offered_rent',
        'landlord_notes',
        'applied_at',
        'responded_at',
        'owner_id',
        'service_fee',
        'payment_status',
        'payment_method',
        'transaction_id',
        'applied_at',

    ];

    protected $casts = [
        'offered_rent' => 'decimal:2',
        'applied_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeWithdrawn($query)
    {
        return $query->where('status', 'withdrawn');
    }

    // Accessors
    public function getFormattedOfferedRentAttribute(): string
    {
        return $this->offered_rent ? number_format($this->offered_rent, 2) : 'N/A';
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            'withdrawn' => 'gray',
            default => 'gray'
        };
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isWithdrawn(): bool
    {
        return $this->status === 'withdrawn';
    }
}
