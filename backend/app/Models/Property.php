<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'price',
        'price_type',
        'payment_duration_months',
        'location',
        'address',
        'type',
        'bedrooms',
        'bathrooms',
        'parking_spaces',
        'area',
        'furnished',
        'available_from',
        'contact_phone',
        'contact_email',
        'featured',
        'available',
        'status',
        'views',
        'latitude',
        'longitude',
        'owner_id',
        'agent_id',
        'dalali',
        'landlord_name',
        'landlord_phone',
        'clicks',
        'shares',
        'images',
        'videos',
        'amenities',
    ];

    protected $casts = [
        'price'                   => 'decimal:2',
        'payment_duration_months' => 'integer',
        'area'            => 'decimal:2',
        'latitude'        => 'decimal:8',
        'longitude'       => 'decimal:8',
        'featured'        => 'boolean',
        'available'       => 'boolean',
        'furnished'       => 'boolean',
        'available_from'  => 'date',
        'images'          => 'array',
        'videos'          => 'array',
        'amenities'       => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function savedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_properties');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Relationship to PropertyImage model (separate images table).
     * Renamed to propertyImages() to avoid conflict with the
     * 'images' JSON column and its array cast above.
     */
    public function propertyImages(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    /**
     * Relationship to Amenity model via pivot table.
     * Renamed to propertyAmenities() to avoid conflict with the
     * 'amenities' JSON column and its array cast above.
     */
    public function propertyAmenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class, 'amenity_property');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeAvailable($query)
    {
        return $query->where('available', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeByLocation($query, $location)
    {
        return $query->where('location', 'like', "%{$location}%");
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPriceRange($query, $minPrice = null, $maxPrice = null)
    {
        if ($minPrice) {
            $query->where('price', '>=', $minPrice);
        }
        if ($maxPrice) {
            $query->where('price', '<=', $maxPrice);
        }
        return $query;
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2);
    }

    public function getPaymentDurationMonths(): int
    {
        $months = (int) ($this->payment_duration_months ?? 1);

        return max(1, $months);
    }

    public function getMainImageAttribute(): string
    {
        // 'images' is now cast to array automatically
        $images = $this->images ?? [];

        if (empty($images)) {
            return '/placeholder-property.jpg';
        }

        $firstImage = $images[0];

        if (str_starts_with($firstImage, 'http')) {
            return $firstImage;
        }

        if (str_starts_with($firstImage, 'properties/')) {
            return '/storage/' . $firstImage;
        }

        return $firstImage;
    }

    public function getImageUrlsAttribute(): array
    {
        // 'images' is now cast to array automatically
        $images = $this->images ?? [];

        return array_map(function ($image) {
            if (str_starts_with($image, 'http')) {
                return $image;
            }

            if (str_starts_with($image, 'properties/')) {
                return '/storage/' . $image;
            }

            return $image;
        }, $images);
    }

    public function getOwnerNameAttribute(): string
    {
        return $this->owner ? $this->owner->fullName() : 'Unknown';
    }

    public function getAgentNameAttribute(): ?string
    {
        return $this->agent ? $this->agent->fullName() : null;
    }
}