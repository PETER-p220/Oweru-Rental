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
        'location',
        'address',
        'type',
        'bedrooms',
        'bathrooms',
        'area',
        'images',
        'amenities',
        'featured',
        'available',
        'latitude',
        'longitude',
        'owner_id',
        'agent_id',
        'landlord_name', // For agent reference
        'landlord_phone', // For agent reference
        'clicks', // Tracking clicks
        'shares', // Tracking shares
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'images' => 'array',
        'amenities' => 'array',
        'featured' => 'boolean',
        'available' => 'boolean',
    ];

    // Relationships
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

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    // Scopes
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

    // Accessors
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2);
    }

    public function getMainImageAttribute(): string
    {
        $images = $this->images ?? [];
        if (empty($images)) {
            return '/placeholder-property.jpg';
        }
        
        $firstImage = $images[0];
        
        // Check if it's already a full URL
        if (str_starts_with($firstImage, 'http')) {
            return $firstImage;
        }
        
        // Check if it's a storage path
        if (str_starts_with($firstImage, 'properties/')) {
            return '/storage/' . $firstImage;
        }
        
        return $firstImage;
    }

    public function getImageUrlsAttribute(): array
    {
        $images = $this->images ?? [];
        
        return array_map(function ($image) {
            // Check if it's already a full URL
            if (str_starts_with($image, 'http')) {
                return $image;
            }
            
            // Check if it's a storage path
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
