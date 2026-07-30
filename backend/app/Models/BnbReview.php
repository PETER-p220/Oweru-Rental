<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BnbReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'booking_id',
        'guest_id',
        'rating',
        'comment',
        'response',
        'response_date',
        'helpful_count',
        'verified',
        'private_feedback',
    ];

    protected $casts = [
        'rating' => 'integer',
        'verified' => 'boolean',
        'helpful_count' => 'integer',
        'response_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function property(): BelongsTo
    {
        return $this->belongsTo(BnbProperty::class, 'property_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(BnbBooking::class, 'booking_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_id');
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('verified', true);
    }

    public function scopePublic($query)
    {
        return $query->whereNotNull('comment');
    }

    public function scopeByRating($query, $rating)
    {
        return $query->where('rating', $rating);
    }

    public function scopeByProperty($query, $propertyId)
    {
        return $query->where('property_id', $propertyId);
    }

    public function scopeByGuest($query, $guestId)
    {
        return $query->where('guest_id', $guestId);
    }

    public function scopeWithResponse($query)
    {
        return $query->whereNotNull('response');
    }

    public function scopeWithoutResponse($query)
    {
        return $query->whereNull('response');
    }

    // Methods
    public function getRatingStarsAttribute(): string
    {
        return str_repeat('⭐', $this->rating);
    }

    public function getRatingPercentageAttribute(): int
    {
        return ($this->rating / 5) * 100;
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->rating) {
            5 => 'green',
            4 => 'blue',
            3 => 'yellow',
            2 => 'orange',
            1 => 'red',
            default => 'gray',
        };
    }

    public function getStatusTextAttribute(): string
    {
        return match($this->rating) {
            5 => 'Excellent',
            4 => 'Very Good',
            3 => 'Good',
            2 => 'Fair',
            1 => 'Poor',
            default => 'Not Rated',
        };
    }

    public function canBeEdited(): bool
    {
        return $this->guest_id === auth()->id() && 
               $this->created_at > now()->subDays(7);
    }

    public function canBeResponded(): bool
    {
        return $this->property->owner_id === auth()->id() && 
               is_null($this->response);
    }

    public function markAsHelpful(): void
    {
        $this->increment('helpful_count');
    }

    public function hasResponse(): bool
    {
        return !is_null($this->response);
    }

    public function getFormattedDateAttribute(): string
    {
        return $this->created_at->format('M j, Y');
    }

    public function getRelativeTimeAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeHighRating($query, $minRating = 4)
    {
        return $query->where('rating', '>=', $minRating);
    }

    public function scopeLowRating($query, $maxRating = 2)
    {
        return $query->where('rating', '<=', $maxRating);
    }

    // Static methods for property analytics
    public static function getAverageRatingForProperty($propertyId): float
    {
        return static::where('property_id', $propertyId)
            ->whereNotNull('comment')
            ->avg('rating') ?? 0;
    }

    public static function getReviewCountForProperty($propertyId): int
    {
        return static::where('property_id', $propertyId)
            ->whereNotNull('comment')
            ->count();
    }

    public static function getRatingDistributionForProperty($propertyId): array
    {
        $distribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $distribution[$i] = static::where('property_id', $propertyId)
                ->where('rating', $i)
                ->whereNotNull('comment')
                ->count();
        }
        return $distribution;
    }
}
