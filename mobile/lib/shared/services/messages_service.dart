import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_config.dart';
import 'user_service.dart';

class Message {
  final int id;
  final int senderId;
  final int receiverId;
  final String? content;
  final String type;
  final String status;
  final String? readAt;
  final String createdAt;
  final String? editedAt;
  final bool isEdited;
  final int? replyToId;
  final String timeFormatted;
  final bool isFromMe;
  final Sender sender;
  final Property? property;

  Message({
    required this.id,
    required this.senderId,
    required this.receiverId,
    this.content,
    required this.type,
    required this.status,
    this.readAt,
    required this.createdAt,
    this.editedAt,
    required this.isEdited,
    this.replyToId,
    required this.timeFormatted,
    required this.isFromMe,
    required this.sender,
    this.property,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] ?? 0,
      senderId: json['sender_id'] ?? 0,
      receiverId: json['receiver_id'] ?? 0,
      content: json['content'],
      type: json['type'] ?? 'text',
      status: json['status'] ?? 'sent',
      readAt: json['read_at'],
      createdAt: json['created_at'] ?? '',
      editedAt: json['edited_at'],
      isEdited: json['is_edited'] ?? false,
      replyToId: json['reply_to_id'],
      timeFormatted: json['time_formatted'] ?? '',
      isFromMe: json['is_from_me'] ?? false,
      sender: Sender.fromJson(json['sender'] ?? {}),
      property: json['property'] != null ? Property.fromJson(json['property']) : null,
    );
  }
}

class Sender {
  final int id;
  final String name;
  final String userType;
  final String? avatar;

  Sender({
    required this.id,
    required this.name,
    required this.userType,
    this.avatar,
  });

  factory Sender.fromJson(Map<String, dynamic> json) {
    return Sender(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown',
      userType: json['user_type'] ?? 'unknown',
      avatar: json['avatar'],
    );
  }
}

class Property {
  final int id;
  final String title;
  final String? image;

  Property({
    required this.id,
    required this.title,
    this.image,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      image: json['image'],
    );
  }
}

class Conversation {
  final int id;
  final User user;
  final LatestMessage? latestMessage;
  final int unreadCount;
  final dynamic property;
  final String updatedAt;

  Conversation({
    required this.id,
    required this.user,
    this.latestMessage,
    required this.unreadCount,
    this.property,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] ?? 0,
      user: User.fromJson(json['user'] ?? {}),
      latestMessage: json['latest_message'] != null ? LatestMessage.fromJson(json['latest_message']) : null,
      unreadCount: json['unread_count'] ?? 0,
      property: json['property'],
      updatedAt: json['updated_at'] ?? '',
    );
  }
}

class LatestMessage {
  final int id;
  final String? content;
  final String type;
  final String status;
  final String createdAt;
  final int senderId;
  final bool isEdited;

  LatestMessage({
    required this.id,
    this.content,
    required this.type,
    required this.status,
    required this.createdAt,
    required this.senderId,
    required this.isEdited,
  });

  factory LatestMessage.fromJson(Map<String, dynamic> json) {
    return LatestMessage(
      id: json['id'] ?? 0,
      content: json['content'],
      type: json['type'] ?? 'text',
      status: json['status'] ?? 'sent',
      createdAt: json['created_at'] ?? '',
      senderId: json['sender_id'] ?? 0,
      isEdited: json['is_edited'] ?? false,
    );
  }
}

class User {
  final int id;
  final String name;
  final String email;
  final String userType;
  final String? avatar;
  final bool isOnline;
  final String? lastSeenAt;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.userType,
    this.avatar,
    required this.isOnline,
    this.lastSeenAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown User',
      email: json['email'] ?? '',
      userType: json['user_type'] ?? 'unknown',
      avatar: json['avatar'],
      isOnline: json['is_online'] ?? false,
      lastSeenAt: json['last_seen_at'],
    );
  }
}

class MessagesService {
  static Future<String?> _getToken() async {
    final userService = UserService();
    await userService.ensureLoaded();
    return userService.token;
  }

  static Map<String, String> _getHeaders(String? token) {
    return {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      if (token != null) 'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  static Future<Map<String, dynamic>> _request(
    String endpoint, {
    String method = 'GET',
    Map<String, dynamic>? body,
  }) async {
    final token = await _getToken();
    final url = '$kApiBase/$endpoint';
    final headers = _getHeaders(token);

    http.Response response;

    if (method == 'GET') {
      response = await http.get(Uri.parse(url), headers: headers);
    } else if (method == 'POST') {
      response = await http.post(Uri.parse(url), headers: headers, body: jsonEncode(body));
    } else if (method == 'PATCH') {
      response = await http.patch(Uri.parse(url), headers: headers, body: jsonEncode(body));
    } else if (method == 'DELETE') {
      response = await http.delete(Uri.parse(url), headers: headers);
    } else {
      throw Exception('Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('HTTP error! status: ${response.statusCode}');
    }
  }

  // Get all conversations for the current user
  static Future<Map<String, dynamic>> getConversations() async {
    return await _request('messages');
  }

  // Get messages in a conversation
  static Future<Map<String, dynamic>> getMessages(int userId, {int page = 1}) async {
    return await _request('messages/$userId?page=$page');
  }

  // Send a new message
  static Future<Message> sendMessage({
    required int receiverId,
    required String content,
    String type = 'text',
    int? propertyId,
    int? replyToId,
    List<dynamic>? attachments,
  }) async {
    final response = await _request('messages', method: 'POST', body: {
      'receiver_id': receiverId,
      'content': content,
      'type': type,
      if (propertyId != null) 'property_id': propertyId,
      if (replyToId != null) 'reply_to_id': replyToId,
      if (attachments != null) 'attachments': attachments,
    });
    return Message.fromJson(response['data']);
  }

  // Edit a message
  static Future<Map<String, dynamic>> editMessage(int messageId, String content) async {
    return await _request('messages/$messageId', method: 'PATCH', body: {
      'content': content,
    });
  }

  // Delete a message
  static Future<void> deleteMessage(int messageId) async {
    await _request('messages/$messageId', method: 'DELETE');
  }

  // Upload file attachment
  static Future<Map<String, dynamic>> uploadFile(String filePath) async {
    final token = await _getToken();
    final url = '$kApiBase/messages/upload';
    final request = http.MultipartRequest('POST', Uri.parse(url));
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    final response = await request.send();
    if (response.statusCode == 200) {
      final responseBody = await response.stream.bytesToString();
      return jsonDecode(responseBody);
    } else {
      throw Exception('Upload failed');
    }
  }

  // Mark messages as read
  static Future<void> markAsRead({List<int>? messageIds, int? senderId}) async {
    await _request('messages/mark-read', method: 'POST', body: {
      if (messageIds != null) 'message_ids': messageIds,
      if (senderId != null) 'sender_id': senderId,
    });
  }

  // Get unread count
  static Future<int> getUnreadCount() async {
    final response = await _request('messages/unread-count');
    return response['unread_count'] ?? 0;
  }

  // Search users to start conversation
  static Future<List<User>> searchUsers(String search) async {
    final response = await _request('messages/search-users?search=$search');
    final usersList = response['users'] as List?;
    return usersList?.map((json) => User.fromJson(json)).toList() ?? [];
  }

  // Get online users for messaging
  static Future<List<User>> getOnlineUsers() async {
    try {
      final response = await _request('messages/online-users');
      final usersList = response['users'] as List?;
      return usersList?.map((json) => User.fromJson(json)).toList() ?? [];
    } catch (e) {
      print('Failed to fetch online users: $e');
      return [];
    }
  }

  // Get all users
  static Future<List<User>> getAllUsers() async {
    final response = await _request('messages/all-users');
    final usersList = response['users'] as List?;
    return usersList?.map((json) => User.fromJson(json)).toList() ?? [];
  }

  // Start conversation about a property
  static Future<Map<String, dynamic>> startPropertyConversation({
    required int propertyId,
    required int receiverId,
    required String message,
  }) async {
    return await _request('messages/property/$propertyId', method: 'POST', body: {
      'receiver_id': receiverId,
      'message': message,
    });
  }
}
