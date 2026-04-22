<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    const STATUS_SENT = 'sent';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_READ = 'read';
    
    const TYPE_TEXT = 'text';
    const TYPE_IMAGE = 'image';
    const TYPE_FILE = 'file';
    const TYPE_LOCATION = 'location';
    const TYPE_PROPERTY = 'property';

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'property_id',
        'content',
        'type',
        'attachments',
        'status',
        'read_at',
        'reply_to_id', // For threaded conversations
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'read_at' => 'datetime',
        'edited_at' => 'datetime',
        'is_edited' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'time_formatted',
        'is_from_me',
    ];

    // Relationships
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    // Scopes for real chat functionality
    public function scopeBetween($query, $userId1, $userId2)
    {
        return $query->where(function ($q) use ($userId1, $userId2) {
            $q->where('sender_id', $userId1)->where('receiver_id', $userId2);
        })->orWhere(function ($q) use ($userId1, $userId2) {
            $q->where('sender_id', $userId2)->where('receiver_id', $userId1);
        });
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('sender_id', $userId)->orWhere('receiver_id', $userId);
    }

    public function scopeUnread($query, $userId = null)
    {
        $userId = $userId ?? auth()->id();
        return $query->where('receiver_id', $userId)
                    ->where('status', '!=', self::STATUS_READ);
    }

    public function scopeInProperty($query, $propertyId)
    {
        return $query->where('property_id', $propertyId);
    }

    public function scopeWithProperty($query)
    {
        return $query->whereNotNull('property_id');
    }

    // Chat-specific methods
    public function markAsRead()
    {
        $this->update([
            'status' => self::STATUS_READ,
            'read_at' => now(),
        ]);
    }

    public function markAsDelivered()
    {
        if ($this->status === self::STATUS_SENT) {
            $this->update(['status' => self::STATUS_DELIVERED]);
        }
    }

    public function isRead(): bool
    {
        return $this->status === self::STATUS_READ;
    }

    public function isDelivered(): bool
    {
        return in_array($this->status, [self::STATUS_DELIVERED, self::STATUS_READ]);
    }

    public function getOtherUser($currentUserId)
    {
        return $this->sender_id === $currentUserId ? $this->receiver : $this->sender;
    }

    public function canEdit(): bool
    {
        // Can edit if: sent by current user, within 15 minutes, and no replies yet
        $isFromMe = $this->sender_id === auth()->id();
        $isRecent = $this->created_at->diffInMinutes(now()) < 15;
        $hasNoReplies = $this->replies()->count() === 0;
        
        return $isFromMe && $isRecent && $hasNoReplies && $this->type === self::TYPE_TEXT;
    }

    public function canDelete(): bool
    {
        // Can delete if sent by current user
        return $this->sender_id === auth()->id();
    }

    // Accessors for chat UI
    public function getTimeFormattedAttribute(): string
    {
        if ($this->created_at->isToday()) {
            return $this->created_at->format('h:i A');
        } elseif ($this->created_at->isYesterday()) {
            return 'Yesterday ' . $this->created_at->format('h:i A');
        } else {
            return $this->created_at->format('M j, h:i A');
        }
    }

    public function getIsFromMeAttribute(): bool
    {
        return $this->sender_id === auth()->id();
    }

    public function getSenderNameAttribute(): string
    {
        return $this->sender->first_name . ' ' . $this->sender->last_name;
    }

    public function getReceiverNameAttribute(): string
    {
        return $this->receiver->first_name . ' ' . $this->receiver->last_name;
    }

    // Static methods for chat functionality
    public static function getConversationsForUser($userId, $limit = 20)
    {
        return self::where(function ($query) use ($userId) {
                $query->where('sender_id', $userId)
                      ->orWhere('receiver_id', $userId);
            })
            ->with(['sender', 'receiver', 'property', 'replyTo'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy(function ($message) use ($userId) {
                $otherUserId = $message->sender_id === $userId 
                    ? $message->receiver_id 
                    : $message->sender_id;
                return $otherUserId;
            })
            ->map(function ($messages, $otherUserId) use ($userId) {
                $latestMessage = $messages->first();
                $otherUser = $latestMessage->getOtherUser($userId);
                
                return [
                    'id' => $otherUserId,
                    'user' => [
                        'id' => $otherUser->id,
                        'name' => $otherUser->first_name . ' ' . $otherUser->last_name,
                        'email' => $otherUser->email,
                        'user_type' => $otherUser->user_type,
                        'avatar' => $otherUser->profile_image ?? null,
                        'is_online' => $otherUser->is_online ?? false,
                    ],
                    'latest_message' => [
                        'id' => $latestMessage->id,
                        'content' => $latestMessage->content,
                        'type' => $latestMessage->type,
                        'status' => $latestMessage->status,
                        'created_at' => $latestMessage->created_at,
                        'sender_id' => $latestMessage->sender_id,
                        'is_edited' => $latestMessage->is_edited,
                    ],
                    'unread_count' => $messages->where('receiver_id', $userId)
                                           ->where('status', '!=', self::STATUS_READ)
                                           ->count(),
                    'property' => $latestMessage->property,
                    'updated_at' => $latestMessage->created_at,
                ];
            })
            ->sortByDesc('updated_at')
            ->take($limit)
            ->values();
    }

    public static function getMessagesBetweenUsers($userId1, $userId2, $limit = 50)
    {
        return self::between($userId1, $userId2)
            ->with(['sender', 'receiver', 'property', 'replyTo'])
            ->orderBy('created_at', 'asc')
            ->paginate($limit);
    }
}
