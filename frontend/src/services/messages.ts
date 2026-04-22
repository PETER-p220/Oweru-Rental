import { TOKEN_KEY } from './api';

const API_BASE_URL = 'http://rental.oweru.com'; // Hardcoded for now to fix the issue

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
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
    content: string;
    type: string;
    status: string;
    created_at: string;
    sender_id: number;
    is_edited: boolean;
  };
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
}

class MessagesService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> {
    const url = `${API_BASE_URL}/api/${endpoint}`;

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
    const response = await this.request<{ conversations: Conversation[]; unread_count: number }>('/messages');
    return response.data;
  }

  // Get messages in a conversation
  static async getMessages(userId: number, page = 1) {
    const response = await this.request<{ messages: Message[]; pagination: any }>(`/messages/${userId}?page=${page}`);
    return response.data;
  }

  // Send a new message
  static async sendMessage(data: {
    receiver_id: number;
    content: string;
    type?: string;
    property_id?: number;
    reply_to_id?: number;
    attachments?: any[];
  }) {
    const response = await this.request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Edit a message
  static async editMessage(messageId: number, content: string) {
    const response = await this.request(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  // Delete a message
  static async deleteMessage(messageId: number) {
    await this.request(`/messages/${messageId}`, {
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
    await this.request('/messages/mark-read', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get unread count
  static async getUnreadCount() {
    const response = await this.request<{ unread_count: number }>('/messages/unread-count');
    return response.data.unread_count;
  }

  // Search users to start conversation
  static async searchUsers(search: string) {
    const response = await this.request<{ users: User[] }>(`/messages/search-users?search=${search}`);
    return response.data.users;
  }

  // Test method to get all users (remove in production)
  static async getAllUsers() {
    const response = await this.request<{ users: User[] }>('/messages/all-users');
    return response.data.users;
  }

  // Start conversation about a property
  static async startPropertyConversation(propertyId: number, receiverId: number, message: string) {
    const response = await this.request(`/messages/property/${propertyId}`, {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        message,
      }),
    });
    return response.data;
  }
}

export default MessagesService;
