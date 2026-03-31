<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class BnbProperty extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'price',
        'location',
        'address',
        'type',
        'bedrooms',
        'bathrooms',
        'amenities',
        'images',
        'owner_id',
        'status',
        'max_guests',
        'min_stay',
        'instant_book',
        'cancellation_policy',
        'house_rules',
        'check_in_time',
        'check_out_time',
        'cleaning_fee',
        'service_fee',
        'security_deposit',
        'weekly_discount',
        'monthly_discount',
        'amenities_bnb',
        'location_highlights',
        'safety_items',
    ];

    protected $casts = [
        'amenities' => 'array',
        'images' => 'array',
        'instant_book' => 'boolean',
        'house_rules' => 'array',
        'amenities_bnb' => 'array',
        'location_highlights' => 'array',
        'safety_items' => 'array',
        'price' => 'decimal:2',
        'cleaning_fee' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'security_deposit' => 'decimal:2',
        'weekly_discount' => 'decimal:2',
        'monthly_discount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(BnbBooking::class, 'property_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(BnbReview::class, 'property_id');
    }

    public function availableBookings(): HasMany
    {
        return $this->hasMany(BnbBooking::class, 'property_id')
            ->where('status', 'confirmed');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }

    public function scopeByLocation($query, $location)
    {
        return $query->where('location', 'LIKE', "%{$location}%");
    }

    public function scopeByPriceRange($query, $minPrice, $maxPrice)
    {
        return $query->whereBetween('price', [$minPrice, $maxPrice]);
    }

    public function scopeByGuests($query, $guests)
    {
        return $query->where('max_guests', '>=', $guests);
    }

    // Methods
    public function getAverageRatingAttribute()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getReviewsCountAttribute()
    {
        return $this->reviews()->count();
    }

    public function getTotalRevenueAttribute()
    {
        return $this->bookings()->where('status', 'confirmed')->sum('total_price');
    }

    public function getOccupancyRateAttribute()
    {
        $totalDays = $this->bookings()
            ->where('status', 'confirmed')
            ->selectRaw('SUM(DATEDIFF(check_out, check_in)) as total_days')
            ->value('total_days') ?? 0;

        $propertyDays = 30; // Assume 30 days for current month
        return $propertyDays > 0 ? ($totalDays / $propertyDays) * 100 : 0;
    }

    public function isAvailableForDates($checkIn, $checkOut): bool
    {
        return !$this->bookings()
            ->where('status', 'confirmed')
            ->where(function ($query) use ($checkIn, $checkOut) {
                $query->whereBetween('check_in', [$checkIn, $checkOut])
                    ->orWhereBetween('check_out', [$checkIn, $checkOut])
                    ->where('check_in', '<', $checkOut)
                    ->where('check_out', '>', $checkIn);
            })
            ->exists();
    }

    public function calculateTotalPrice($checkIn, $checkOut): float
    {
        $days = (strtotime($checkOut) - strtotime($checkIn)) / (60 * 60 * 24);
        $basePrice = $this->price * $days;
        
        // Add cleaning fee
        $total = $basePrice + $this->cleaning_fee;
        
        // Add service fee
        $total += $this->service_fee;
        
        // Apply discounts
        if ($days >= 7 && $this->weekly_discount > 0) {
            $total -= ($basePrice * $this->weekly_discount) / 100;
        }
        
        if ($days >= 30 && $this->monthly_discount > 0) {
            $total -= ($basePrice * $this->monthly_discount) / 100;
        }
        
        return max($total, 0);
    }

    public function getAmenityListAttribute(): array
    {
        $amenities = [];
        
        if ($this->amenities_bnb) {
            foreach ($this->amenities_bnb as $amenity => $enabled) {
                if ($enabled) {
                    $amenities[] = $amenity;
                }
            }
        }
        
        return $amenities;
    }

    public function getMainImageAttribute(): string
    {
        return $this->images[0] ?? '/images/placeholder.jpg';
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'available' => 'green',
            'occupied' => 'red',
            'maintenance' => 'orange',
            default => 'gray',
        };
    }
}
