<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalContract extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'tenant_id',
        'property_id',
        'file_path',
        'file_name',
        'file_type',
        'file_url',
        'fields',
        'status',
        'created_by',
        'generated_by',
        'uploaded_by',
        'sent_at',
        'signed_at',
    ];

    protected $casts = [
        'fields' => 'array',
        'sent_at' => 'datetime',
        'signed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
