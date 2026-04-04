<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteVisitNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_visit_id',
        'user_id', // recipient (agent, landlord, or tenant)
        'type', // visit_requested, visit_confirmed, visit_cancelled, visit_reminder, payment_required
        'title',
        'message',
        'is_read',
        'sent_via', 
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    // Relationships
    public function siteVisit(): BelongsTo
    {
        return $this->belongsTo(SiteVisit::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Methods
    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true]);
    }
}
