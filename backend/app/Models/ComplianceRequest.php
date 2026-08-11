<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplianceRequest extends Model
{
    public const CATEGORIES = [
        'maintenance',
        'compliance',
        'safety',
        'utilities',
        'noise',
        'other',
    ];

    public const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

    public const STATUSES = [
        'submitted',
        'acknowledged',
        'in_progress',
        'resolved',
        'closed',
    ];

    protected $fillable = [
        'reference',
        'tenant_user_id',
        'property_id',
        'owner_id',
        'category',
        'priority',
        'status',
        'title',
        'description',
        'location_in_property',
        'preferred_date',
        'owner_response',
        'resolution_notes',
        'acknowledged_at',
        'resolved_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function tenantUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_user_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }
}
