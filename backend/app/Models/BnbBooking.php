<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BnbBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'guest_id',
        'check_in',
        'check_out',
        'guests',
        'total_price',
        'status',
        'special_requests',
        'cancellation_reason',
        'payment_status',
        'payment_method',
        'transaction_id',
        'notes',
    ];

    protected $casts = [
        'check_in' => 'date',
        'check_out' => 'date',
        'guests' => 'integer',
        'total_price' => 'decimal:2',
        'special_requests' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function property(): BelongsTo
{
    return $this->belongsTo(\App\Models\BnbProperty::class, 'property_id');
}

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(BnbReview::class, 'booking_id');
    }

    // Scopes
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByProperty($query, $propertyId)
    {
        return $query->where('property_id', $propertyId);
    }

    public function scopeByGuest($query, $guestId)
    {
        return $query->where('guest_id', $guestId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('check_in', [$startDate, $endDate])
              ->orWhereBetween('check_out', [$startDate, $endDate])
              ->where('check_in', '<', $endDate)
              ->where('check_out', '>', $startDate);
        });
    }

    // Methods
    public function getNightsAttribute(): int
    {
        return (strtotime($this->check_out) - strtotime($this->check_in)) / (60 * 60 * 24);
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'confirmed' => 'green',
            'pending' => 'orange',
            'cancelled' => 'red',
            'completed' => 'blue',
            default => 'gray',
        };
    }

    public function getPaymentStatusColorAttribute(): string
    {
        return match($this->payment_status) {
            'paid' => 'green',
            'pending' => 'orange',
            'refunded' => 'red',
            'partial' => 'blue',
            default => 'gray',
        };
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'confirmed']) && 
               $this->check_in > now()->format('Y-m-d');
    }

    public function canBeReviewed(): bool
    {
        return $this->status === 'completed' && 
               $this->check_out < now()->format('Y-m-d') &&
               !$this->review;
    }

    public function calculateRefundAmount(): float
    {
        if (!$this->canBeCancelled()) {
            return 0;
        }

        $daysUntilCheckIn = (strtotime($this->check_in) - strtotime(now())) / (60 * 60 * 24);
        
        // Cancellation policy based on days until check-in
        if ($daysUntilCheckIn >= 30) {
            return $this->total_price; // Full refund
        } elseif ($daysUntilCheckIn >= 14) {
            return $this->total_price * 0.5; // 50% refund
        } elseif ($daysUntilCheckIn >= 7) {
            return $this->total_price * 0.25; // 25% refund
        } else {
            return 0; // No refund
        }
    }

    public function getFormattedDatesAttribute(): string
    {
        return date('M j, Y', strtotime($this->check_in)) . ' - ' . 
               date('M j, Y', strtotime($this->check_out));
    }

    public function getShortDatesAttribute(): string
    {
        return date('M j', strtotime($this->check_in)) . ' - ' . 
               date('M j', strtotime($this->check_out));
    }

    public function isPastBooking(): bool
    {
        return $this->check_out < now()->format('Y-m-d');
    }

    public function isUpcomingBooking(): bool
    {
        return $this->check_in > now()->format('Y-m-d');
    }

    public function isActiveBooking(): bool
    {
        return $this->check_in <= now()->format('Y-m-d') && 
               $this->check_out >= now()->format('Y-m-d') &&
               $this->status === 'confirmed';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'confirmed')
            ->where('check_in', '<=', now()->format('Y-m-d'))
            ->where('check_out', '>=', now()->format('Y-m-d'));
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'confirmed')
            ->where('check_in', '>', now()->format('Y-m-d'));
    }

    public function scopePast($query)
    {
        return $query->where('check_out', '<', now()->format('Y-m-d'));
    }
}
