<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * Get all conversations for the authenticated user
     */
    public function conversations(): JsonResponse
    {
        $user = Auth::user();
        
        // Get conversations using the model method
        $conversations = Message::getConversationsForUser($user->id);
        $unreadCount = Message::unread($user->id)->count();

        // Sort conversations: online users first, then by recent activity
        $conversations = $conversations->sortByDesc(function ($conversation) {
            // Online users get priority (2), offline users get lower priority (1)
            $onlinePriority = $conversation['user']['is_online'] ? 2 : 1;
            // Combine with timestamp for proper sorting
            return $onlinePriority . strtotime($conversation['updated_at']);
        })->values();

        return response()->json([
            'conversations' => $conversations,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get messages in a conversation
     */
    public function messages(Request $request, $userId): JsonResponse
    {
        $user = Auth::user();
        
        // Verify the other user exists
        $otherUser = User::findOrFail($userId);
        
        $messages = Message::getMessagesBetweenUsers($user->id, $userId);

        // Mark messages as read
        Message::where('sender_id', $userId)
               ->where('receiver_id', $user->id)
               ->where('status', '!=', Message::STATUS_READ)
               ->update([
                   'status' => Message::STATUS_READ,
                   'read_at' => now(),
               ]);

        return response()->json([
            'messages' => $messages->getCollection()->map(function ($message) {
                return [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'content' => $message->content,
                    'type' => $message->type,
                    'attachments' => $message->attachments,
                    'status' => $message->status,
                    'read_at' => $message->read_at,
                    'created_at' => $message->created_at,
                    'edited_at' => $message->edited_at,
                    'is_edited' => $message->is_edited,
                    'reply_to_id' => $message->reply_to_id,
                    'time_formatted' => $message->time_formatted,
                    'is_from_me' => $message->is_from_me,
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->first_name . ' ' . $message->sender->last_name,
                        'user_type' => $message->sender->user_type,
                        'avatar' => $message->sender->profile_image ?? null,
                    ],
                    'property' => $message->property,
                ];
            }),
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Send a new message
     * FIX: content is nullable for property-type messages
     */
    public function send(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'content'     => 'nullable|string|max:5000',   // <-- was 'required', now nullable
            'type'        => 'in:text,file,image,location,property',
            'property_id' => 'nullable|exists:properties,id',
            'reply_to_id' => 'nullable|exists:messages,id',
            'attachments' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        $message = Message::create([
            'sender_id'   => $user->id,
            'receiver_id' => $request->receiver_id,
            'content'     => $request->content,
            'type'        => $request->type ?? Message::TYPE_TEXT,
            'property_id' => $request->property_id,
            'reply_to_id' => $request->reply_to_id,
            'attachments' => $request->attachments,
            'status'      => Message::STATUS_SENT,
        ]);

        $message->load(['sender', 'receiver', 'property', 'replyTo']);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => [
                'id'             => $message->id,
                'sender_id'      => $message->sender_id,
                'receiver_id'    => $message->receiver_id,
                'content'        => $message->content,        // may be null — frontend handles it
                'type'           => $message->type,
                'attachments'    => $message->attachments,
                'status'         => $message->status,
                'created_at'     => $message->created_at,
                'edited_at'      => null,
                'is_edited'      => false,
                'reply_to_id'    => $message->reply_to_id,
                'time_formatted' => $message->time_formatted,
                'is_from_me'     => true,
                'sender'         => [
                    'id'        => $message->sender->id,
                    'name'      => $message->sender->first_name . ' ' . $message->sender->last_name,
                    'user_type' => $message->sender->user_type,
                    'avatar'    => $message->sender->profile_image ?? null,
                ],
                'property'       => $message->property,
            ],
        ], 201);
    }
    /**
     * Edit a message
     */
    public function edit(Request $request, $messageId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        
        $message = Message::where('id', $messageId)
                         ->where('sender_id', $user->id)
                         ->firstOrFail();

        if (!$message->canEdit()) {
            return response()->json([
                'message' => 'This message cannot be edited',
            ], 403);
        }

        $message->update([
            'content' => $request->content,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        return response()->json([
            'message' => 'Message updated successfully',
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'is_edited' => $message->is_edited,
                'edited_at' => $message->edited_at,
                'time_formatted' => $message->time_formatted,
            ],
        ]);
    }

    /**
     * Delete a message
     */
    public function delete($messageId): JsonResponse
    {
        $user = Auth::user();
        
        $message = Message::where('id', $messageId)
                         ->where('sender_id', $user->id)
                         ->firstOrFail();

        if (!$message->canDelete()) {
            return response()->json([
                'message' => 'You cannot delete this message',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Upload file attachment
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('messages', $fileName, 'public');

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => [
                'url' => Storage::url($filePath),
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
            ],
        ]);
    }

    /**
     * Mark messages as read
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $messageIds = $request->input('message_ids', []);
        
        if (empty($messageIds)) {
            // Mark all messages from a specific user as read
            $senderId = $request->input('sender_id');
            if ($senderId) {
                Message::where('sender_id', $senderId)
                       ->where('receiver_id', $user->id)
                       ->where('status', '!=', Message::STATUS_READ)
                       ->update([
                           'status' => Message::STATUS_READ,
                           'read_at' => now(),
                       ]);
            }
        } else {
            // Mark specific messages as read
            Message::whereIn('id', $messageIds)
                   ->where('receiver_id', $user->id)
                   ->where('status', '!=', Message::STATUS_READ)
                   ->update([
                       'status' => Message::STATUS_READ,
                       'read_at' => now(),
                   ]);
        }

        return response()->json([
            'message' => 'Messages marked as read',
        ]);
    }

    /**
     * Get unread count
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();
        
        $count = Message::unread($user->id)->count();

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Search users to start a conversation with (filtered by property connections)
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $user = Auth::user();
        $search = $request->input('search', '');

        // If search is empty, return empty results
        if (empty($search)) {
            return response()->json(['users' => []]);
        }

        // Get user IDs that share property connections with current user
        $connectedUserIds = $this->getUserConnectedUserIds($user);

        $users = User::where('id', '!=', $user->id)
                   ->whereIn('id', $connectedUserIds)
                   ->where(function ($query) use ($search) {
                       // Search by first name
                       $query->where('first_name', 'like', "%{$search}%")
                             // Search by last name
                             ->orWhere('last_name', 'like', "%{$search}%")
                             // Search by full name (concatenated)
                             ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                             // Search by email
                             ->orWhere('email', 'like', "%{$search}%");
                   })
                   ->select(['id', 'first_name', 'last_name', 'email', 'user_type', 'profile_image'])
                   ->limit(20)
                   ->get();

        // Debug: Log the search query and results
        \Log::info('Search users query:', ['search' => $search, 'user_id' => $user->id]);
        \Log::info('Search results count:', ['count' => $users->count()]);

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                    'avatar' => $user->profile_image ?? null,
                ];
            }),
        ]);
    }

    /**
     * Get online users for messaging (filtered by property connections)
     */
    public function getOnlineUsers(): JsonResponse
    {
        $user = Auth::user();
        
        // Get users who are online (active in last 5 minutes) AND share property connections
        $fiveMinutesAgo = now()->subMinutes(5);
        
        // Get user IDs that share property connections with current user
        $connectedUserIds = $this->getUserConnectedUserIds($user);
        
        $onlineUsers = User::where('id', '!=', $user->id)
                          ->whereIn('id', $connectedUserIds)
                          ->where(function ($query) use ($fiveMinutesAgo) {
                              $query->where('is_online', true)
                                    ->orWhere('last_seen_at', '>=', $fiveMinutesAgo);
                          })
                          ->select(['id', 'first_name', 'last_name', 'email', 'user_type', 'profile_image', 'is_online', 'last_seen_at'])
                          ->orderBy('is_online', 'desc')
                          ->orderBy('last_seen_at', 'desc')
                          ->limit(20)
                          ->get();

        return response()->json([
            'users' => $onlineUsers->map(function ($user) use ($fiveMinutesAgo) {
                $isActuallyOnline = $user->is_online || $user->last_seen_at >= $fiveMinutesAgo;
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                    'avatar' => $user->profile_image ?? null,
                    'is_online' => $isActuallyOnline,
                    'last_seen_at' => $user->last_seen_at,
                ];
            }),
        ]);
    }

    /**
     * Get user IDs that share property connections with the current user
     * Checks property connections through applications and property ownership/agent assignments
     */
    private function getUserConnectedUserIds($user): array
    {
        $connectedUserIds = [];
        
        switch ($user->user_type) {
            case 'tenant':
                // Tenants can message agents/landlords for properties they've applied to
                $propertyIds = Application::where('user_id', $user->id)
                                         ->pluck('property_id')
                                         ->toArray();
                
                if (!empty($propertyIds)) {
                    // Get agents of these properties
                    $agentIds = Property::whereIn('id', $propertyIds)
                                       ->whereNotNull('agent_id')
                                       ->where('agent_id', '!=', $user->id)
                                       ->pluck('agent_id')
                                       ->toArray();
                    
                    // Get landlords (owners) of these properties
                    $landlordIds = Property::whereIn('id', $propertyIds)
                                          ->whereNotNull('owner_id')
                                          ->where('owner_id', '!=', $user->id)
                                          ->pluck('owner_id')
                                          ->toArray();
                    
                    $connectedUserIds = array_unique(array_merge($agentIds, $landlordIds));
                }
                break;
                
            case 'agent':
                // Agents can message tenants who applied to properties they manage
                $managedProperties = Property::where('agent_id', $user->id)->pluck('id')->toArray();
                
                if (!empty($managedProperties)) {
                    // Get tenants who applied to these properties
                    $tenantIds = Application::whereIn('property_id', $managedProperties)
                                          ->where('user_id', '!=', $user->id)
                                          ->pluck('user_id')
                                          ->toArray();
                    
                    // Get landlords of these properties
                    $landlordIds = Property::whereIn('id', $managedProperties)
                                          ->whereNotNull('owner_id')
                                          ->where('owner_id', '!=', $user->id)
                                          ->pluck('owner_id')
                                          ->toArray();
                    
                    $connectedUserIds = array_unique(array_merge($tenantIds, $landlordIds));
                }
                break;
                
            case 'landlord':
                // Landlords can message tenants who applied to their properties
                $ownedProperties = Property::where('owner_id', $user->id)->pluck('id')->toArray();
                
                if (!empty($ownedProperties)) {
                    // Get tenants who applied to these properties
                    $tenantIds = Application::whereIn('property_id', $ownedProperties)
                                          ->where('user_id', '!=', $user->id)
                                          ->pluck('user_id')
                                          ->toArray();
                    
                    // Get agents managing these properties
                    $agentIds = Property::whereIn('id', $ownedProperties)
                                       ->whereNotNull('agent_id')
                                       ->where('agent_id', '!=', $user->id)
                                       ->pluck('agent_id')
                                       ->toArray();
                    
                    $connectedUserIds = array_unique(array_merge($tenantIds, $agentIds));
                }
                break;
                
            default:
                // For other user types, return empty array
                $connectedUserIds = [];
                break;
        }
        
        return array_unique($connectedUserIds);
    }

    /**
     * Get all users for testing (remove in production)
     */
    public function getAllUsers(): JsonResponse
    {
        $user = Auth::user();
        $users = User::where('id', '!=', $user->id)
                   ->select(['id', 'first_name', 'last_name', 'email', 'user_type'])
                   ->limit(10)
                   ->get();

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                ];
            }),
        ]);
    }

    /**
     * Start a conversation about a property
     */
    public function startPropertyConversation(Request $request, $propertyId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $property = Property::findOrFail($propertyId);

        // Verify user can message about this property
        if ($property->owner_id !== $user->id && $property->agent_id !== $user->id) {
            // Tenants can message about properties they've applied for
            // This would need additional logic based on your application
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $request->receiver_id,
            'content' => $request->message,
            'type' => Message::TYPE_PROPERTY,
            'property_id' => $propertyId,
            'status' => Message::STATUS_SENT,
        ]);

        $message->load(['sender', 'receiver', 'property']);

        return response()->json([
            'message' => 'Conversation started successfully',
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'type' => $message->type,
                'property' => $message->property,
                'created_at' => $message->created_at,
                'sender' => [
                    'id' => $message->sender->id,
                    'name' => $message->sender->first_name . ' ' . $message->sender->last_name,
                    'user_type' => $message->sender->user_type,
                ],
            ],
        ], 201);
    }
}
