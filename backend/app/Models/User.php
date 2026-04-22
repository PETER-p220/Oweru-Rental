<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Message;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable; 

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'user_type',
        'profile_image',
        'bio',
        'is_active',
        'is_online',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'is_online' => 'boolean',
            'last_seen_at' => 'datetime',
            'user_type' => 'string', // Ensure user_type is always cast to string
        ];
    }

    /**
     * Get the user's type (for frontend compatibility)
     */
    public function getUserTypeAttribute(): string
    {
        return $this->attributes['user_type'] ?? '';
    }

    /**
     * Set the user's type (for frontend compatibility)
     */
    public function setUserTypeAttribute($value): void
    {
        $this->attributes['user_type'] = $value;
    }

    // Relationships
    public function ownedProperties(): HasMany
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    public function agentProperties(): HasMany
    {
        return $this->hasMany(Property::class, 'agent_id');
    }

    public function savedProperties(): BelongsToMany
    {
        return $this->belongsToMany(Property::class, 'saved_properties');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function fullName(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function isTenant(): bool
    {
        return $this->user_type === 'tenant';
    }

    public function isLandlord(): bool
    {
        return $this->user_type === 'landlord';
    }

    public function isAgent(): bool
    {
        return $this->user_type === 'agent';
    }

    public function isBnbOwner(): bool
    {
        return $this->user_type === 'bnb_owner';
    }

    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    // BNB Owner relationships
    public function bnbProperties(): HasMany
    {
        return $this->hasMany(BnbProperty::class, 'owner_id');
    }

    public function bnbBookings(): HasMany
    {
        return $this->hasMany(BnbBooking::class, 'guest_id');
    }

    public function bnbReviews(): HasMany
    {
        return $this->hasMany(BnbReview::class, 'guest_id');
    }
}
