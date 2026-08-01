import { TOKEN_KEY } from './api';

const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (import.meta.env.VITE_API_URL || 'https://rental.oweru.com');

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string | null;
  type: 'text' | 'image' | 'file' | 'location' | 'property';
  attachments?: any[];
  status: 'sent' | 'delivered' | 'read';
  read_at?: string;
  created_at: string;
  edited_at?: string;
  is_edited: boolean;
  reply_to_id?: number;
  time_formatted: string;
  is_from_me: boolean;
  sender: {
    id: number;
    name: string;
    user_type: string;
    avatar?: string;
  };
  property?: {
    id: number;
    title: string;
    image?: string;
  };
}

export interface Conversation {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    user_type: string;
    avatar?: string;
    is_online: boolean;
  };
  latest_message: {
    id: number;
    content: string | null;
    type: string;
    status: string;
    created_at: string;
    sender_id: number;
    is_edited: boolean;
  } | null;
  unread_count: number;
  property?: any;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
  avatar?: string;
  is_online?: boolean;
  last_seen_at?: string;
}

class MessagesService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${API_BASE_URL}/api/${cleanEndpoint}`;

    const isFormData = options.body instanceof FormData;

    const defaultHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all conversations for the current user
  static async getConversations() {
    const response = await this.request<{ conversations: Conversation[]; unread_count: number }>('messages');
    return response;
  }

  // Get messages in a conversation
  static async getMessages(userId: number, page = 1) {
    const response = await this.request<{ messages: Message[]; pagination: any }>(`messages/${userId}?page=${page}`);
    return response;
  }

  // Send a new message
  // NOTE: Backend returns { message: string, data: Message } — we unwrap .data here
  static async sendMessage(data: {
    receiver_id: number;
    content: string;
    type?: string;
    property_id?: number;
    reply_to_id?: number;
    attachments?: any[];
  }): Promise<Message> {
    const response = await this.request<{ message: string; data: Message }>('messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Edit a message
  static async editMessage(messageId: number, content: string) {
    const response = await this.request<{ message: string; data: any }>(`messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return response;
  }

  // Delete a message
  static async deleteMessage(messageId: number) {
    await this.request(`messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Upload file attachment
  static async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/messages/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  // Mark messages as read
  static async markAsRead(data: { message_ids?: number[]; sender_id?: number }) {
    await this.request('messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get unread count
  static async getUnreadCount() {
    const response = await this.request<{ unread_count: number }>('messages/unread-count');
    return response.unread_count;
  }

  // Search users to start conversation
  static async searchUsers(search: string) {
    const response = await this.request<{ users: User[] }>(`messages/search-users?search=${encodeURIComponent(search)}`);
    return response.users ?? [];
  }

  // Get online users for messaging
  static async getOnlineUsers(): Promise<User[]> {
    try {
      const response = await this.request<{ users: User[] }>('messages/online-users');
      return (response.users ?? []).map(user => ({
        ...user,
        name: user.name || 'Unknown User',
        user_type: user.user_type || 'Unknown',
        is_online: user.is_online ?? false,
      }));
    } catch (error) {
      console.error('Failed to fetch online users:', error);
      return [];
    }
  }

  // Get all users (for testing — remove in production)
  static async getAllUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('messages/all-users');
    return response.users ?? [];
  }

  // Start conversation about a property
  static async startPropertyConversation(propertyId: number, receiverId: number, message: string) {
    const response = await this.request(`messages/property/${propertyId}`, {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        message,
      }),
    });
    return response;
  }
}

export default MessagesService;