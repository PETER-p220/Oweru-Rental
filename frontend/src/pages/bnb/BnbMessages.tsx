import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, MessageCircle, Search, Phone, Video, MoreVertical, Check, CheckCheck, Circle, Reply, Edit2, Trash2, Paperclip, Smile, Home, X } from 'lucide-react';
import MessagesService, { type Message, type Conversation } from '../../services/messages';

const BnbMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: number; content: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadConversations();
      loadUnreadCount();
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      // Mark messages as read
      MessagesService.markAsRead({ sender_id: selectedConversation.id });
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await MessagesService.getConversations();
      setConversations(data.conversations);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const data = await MessagesService.getMessages(userId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await MessagesService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const message = await MessagesService.sendMessage({
        receiver_id: selectedConversation.id,
        content: newMessage.trim(),
        reply_to_id: replyingTo?.id,
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setReplyingTo(null);
      
      // Update conversation
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
      textareaRef.current?.focus();
    }
  };

  const searchForUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchUsers([]);
      return;
    }

    try {
      const users = await MessagesService.searchUsers(term);
      setSearchUsers(users);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const startNewConversation = (user: any) => {
    const newConv: Conversation = {
      id: user.id,
      user,
      latest_message: {
        id: 0,
        content: 'Start a conversation',
        type: 'text',
        status: 'sent',
        created_at: new Date().toISOString(),
        sender_id: 0,
        is_edited: false,
      },
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    
    setSelectedConversation(newConv);
    setShowUserSearch(false);
    setSearchUsers([]);
    setSearchTerm('');
    setMessages([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (timeStr: string) => {
    const time = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.latest_message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessage = (message: Message) => {
    const isMe = message.is_from_me;
    const isEditing = editingMessage?.id === message.id;

    return (
      <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
          {!isMe && (
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                <span className="text-xs font-medium">
                  {message.sender.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600">{message.sender.name}</span>
            </div>
          )}
          
          {replyingTo && (
            <div className={`p-2 rounded-lg mb-1 text-sm ${isMe ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <div className="flex items-center text-gray-600 mb-1">
                <Reply size={12} className="mr-1" />
                Replying to {replyingTo.sender.name}
              </div>
              <div className="truncate">{replyingTo.content}</div>
            </div>
          )}

          <div className={`relative px-4 py-2 rounded-lg ${
            isMe 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            {message.type === 'property' && message.property && (
              <div className="flex items-center mb-2">
                <Home size={16} className="mr-2" />
                <div>
                  <div className="font-medium">{message.property.title}</div>
                  <div className="text-xs opacity-75">Property inquiry</div>
                </div>
              </div>
            )}
            
            {isEditing ? (
              <div className="flex items-center">
                <textarea
                  className="w-full p-1 rounded bg-white text-gray-900 text-sm resize-none"
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                  autoFocus
                />
                <button
                  onClick={() => handleEditMessage(message.id, editingMessage.content)}
                  className="ml-2 text-green-500"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="ml-1 text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            <div className={`flex items-center justify-end mt-1 text-xs ${
              isMe ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>{formatMessageTime(message.created_at)}</span>
              {message.is_edited && <span className="ml-1">(edited)</span>}
              {isMe && (
                <span className="ml-1">{getStatusIcon(message.status)}</span>
              )}
            </div>
          </div>

          {!isEditing && isMe && (
            <div className="flex items-center mt-1 space-x-2">
              <button
                onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDeleteMessage(message.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      await MessagesService.editMessage(messageId, content);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, is_edited: true, edited_at: new Date().toISOString() }
          : msg
      ));
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await MessagesService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MessageCircle className="w-6 h-6 text-blue-500 mr-2" />
              <h1 className="text-xl font-semibold">BNB Messages</h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Search size={20} />
            </button>
          </div>
          
          {showUserSearch && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchForUsers(e.target.value);
                }}
              />
              
              {searchUsers.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                  {searchUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => startNewConversation(user)}
                      className="w-full px-3 py-2 hover:bg-gray-50 flex items-center text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.user_type}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start messaging with your BnB guests</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 flex items-center hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative mr-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-lg font-medium">
                        {conv.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {conv.user.is_online && (
                      <Circle size={12} className="absolute bottom-0 right-0 text-green-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{conv.user.name}</h3>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conv.updated_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conv.latest_message.type === 'property' ? (
                          <span className="flex items-center">
                            <span className="w-4 h-4 bg-blue-100 rounded mr-1 flex items-center justify-center">
                              <span className="text-xs">P</span>
                            </span>
                            Property inquiry
                          </span>
                        ) : (
                          conv.latest_message.content
                        )}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    
                    {conv.property && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {conv.property.title}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {selectedConversation.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {selectedConversation.user.is_online && (
                      <Circle size={10} className="absolute bottom-0 right-0 text-green-500 fill-current" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-medium">{selectedConversation.user.name}</h2>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.user.is_online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Video size={20} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div>
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {replyingTo && (
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg mb-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Reply size={14} className="mr-2" />
                    Replying to {replyingTo.sender.name}: {replyingTo.content}
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Paperclip size={20} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Smile size={20} />
                </button>
                
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={1}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BnbMessages;
