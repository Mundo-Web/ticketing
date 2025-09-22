# Mobile App API Guide - Member Features

## Overview
Este documento describe todas las APIs y funcionalidades disponibles para miembros (tenants) en la aplicación móvil de ticketing, incluyendo las funcionalidades web que deben implementarse en React Native.

## Autenticación
Todas las APIs requieren autenticación mediante Bearer Token (Sanctum).

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 🎫 Ticket Management APIs

### 1. Get User Tickets
**Endpoint:** `GET /api/tenant/tickets`
**Query Parameters:**
- `status` (opcional): `open`, `in_progress`, `resolved`, `closed`, `cancelled`, `reopened`

```javascript
const response = await fetch('/api/tenant/tickets?status=open', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. Get Ticket Detail
**Endpoint:** `GET /api/tenant/tickets/{ticketId}`

```javascript
const response = await fetch(`/api/tenant/tickets/${ticketId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Create Ticket (Form Data)
**Endpoint:** `POST /api/tenant/tickets`

```javascript
const formData = new FormData();
formData.append('device_id', deviceId);
formData.append('category', 'Hardware');
formData.append('title', 'Device Issue');
formData.append('description', 'Description here');
formData.append('priority', 'medium'); // opcional

// Para attachments (archivos)
files.forEach((file, index) => {
  formData.append('attachments[]', file);
});

const response = await fetch('/api/tenant/tickets', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### 4. Create Ticket Android (Base64)
**Endpoint:** `POST /api/tenant/tickets/android`

```javascript
const ticketData = {
  device_id: 1,
  category: "Hardware",
  title: "Device not working",
  description: "The device stopped working this morning",
  priority: "medium",
  attachments_base64: [
    {
      name: "image1.jpg",
      type: "image/jpeg",
      data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
      size: 1234567
    }
  ]
};

const response = await fetch('/api/tenant/tickets/android', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(ticketData)
});
```

## 💬 Communication with Technician

### 5. Send Message to Technician
**Endpoint:** `POST /api/tenant/tickets/{ticketId}/send-message-to-technical`

```javascript
const messageData = {
  message: "Hi, I need an update on this ticket status."
};

const response = await fetch(`/api/tenant/tickets/${ticketId}/send-message-to-technical`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(messageData)
});

// Response
{
  "success": true,
  "message": "Message sent successfully",
  "ticket_id": 123
}
```

**✅ IMPLEMENTADO**: Esta API está disponible en TenantController para uso móvil.

## ⭐ Feedback & Rating System

### 6. Add Member Feedback
**Endpoint:** `POST /api/tenant/tickets/{ticketId}/member-feedback`

```javascript
const feedbackData = {
  comment: "Great service, very professional technician!",
  rating: 5, // 1-5 stars
  is_feedback: true
};

const response = await fetch(`/api/tenant/tickets/${ticketId}/member-feedback`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(feedbackData)
});

// Response
{
  "success": true,
  "message": "Feedback submitted successfully",
  "ticket_id": 123,
  "rating": 5
}
```

**✅ IMPLEMENTADO**: Esta API está disponible en TenantController para uso móvil.

### 7. Get Ticket Attachments
**Endpoint:** `GET /api/tenant/tickets/{ticketId}/attachments`

```javascript
const response = await fetch(`/api/tenant/tickets/${ticketId}/attachments`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Response
{
  "success": true,
  "attachments": [
    {
      "original_name": "broken_device.jpg",
      "file_name": "unique_filename.jpg",
      "file_path": "tickets/unique_filename.jpg",
      "full_url": "https://yourapp.com/storage/tickets/unique_filename.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245760,
      "uploaded_at": "2025-09-22T10:00:00Z",
      "is_image": true,
      "is_video": false
    }
  ],
  "count": 1
}
```

**✅ IMPLEMENTADO**: Esta API proporciona URLs completas para acceso directo desde móvil.

## 📱 Device Management

### 8. Get User Devices
**Endpoint:** `GET /api/tenant/devices`

```javascript
const response = await fetch('/api/tenant/devices', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Respuesta incluye own_devices y shared_devices
```

## 🔔 Notifications

### 9. Get Notifications
**Endpoint:** `GET /api/tenant/notifications`

```javascript
const response = await fetch('/api/tenant/notifications', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 10. Mark Notification as Read
**Endpoint:** `POST /api/tenant/notifications/{notificationId}/read`

### 11. Mark All Notifications as Read
**Endpoint:** `POST /api/tenant/notifications/mark-all-read`

## 🏠 Building & Apartment Info

### 12. Get Apartment Info
**Endpoint:** `GET /api/tenant/apartment`

### 13. Get Building Info
**Endpoint:** `GET /api/tenant/building`

### 14. Get Doormen
**Endpoint:** `GET /api/tenant/doormen`

### 15. Get Owner
**Endpoint:** `GET /api/tenant/owner`

---

## 🎨 UI Design Structure for Ticket Detail

### Component Hierarchy para React Native

```
TicketDetailScreen
├── HeaderSection
│   ├── TicketCodeBadge
│   ├── StatusBadge
│   └── PriorityBadge
├── DeviceInformationSection
│   ├── DeviceIcon
│   ├── DeviceName
│   ├── DeviceSpecs (brand, model, system)
│   └── Location
├── TechnicalAssignmentSection
│   ├── TechnicalAvatar
│   ├── TechnicalInfo (name, email, phone)
│   └── CommunicationButton
├── AttachmentsSection
│   ├── AttachmentList
│   ├── AttachmentPreview
│   └── DownloadButton
├── TimelineSection
│   ├── HistoryItem
│   │   ├── ActionIcon
│   │   ├── Description
│   │   ├── Timestamp
│   │   └── ActorInfo
│   └── MessageItem (member_message type)
├── ActionButtons
│   ├── SendMessageButton
│   ├── AddFeedbackButton
│   └── RateServiceButton
└── FeedbackModal
    ├── StarRating
    ├── CommentInput
    └── SubmitButton
```

### 📋 Data Structure Examples

#### Ticket Detail Response
```json
{
  "ticket": {
    "id": 123,
    "code": "TCK-20250922-00001",
    "title": "Laptop not turning on",
    "description": "The laptop stopped working suddenly",
    "category": "Hardware",
    "status": "in_progress",
    "priority": "medium",
    "created_at": "2025-09-22T10:00:00Z",
    "updated_at": "2025-09-22T14:30:00Z",
    "device": {
      "id": 1,
      "name": "MacBook Pro 2023",
      "brand": "Apple",
      "model": "MacBook Pro",
      "system": "macOS",
      "device_type": "Laptop",
      "ubicacion": "Office Room",
      "icon_id": 1,
      "name_device": {
        "id": 1,
        "name": "Laptop",
        "status": true
      }
    },
    "technical": {
      "id": 5,
      "name": "John Doe",
      "email": "john@tech.com",
      "phone": "+1234567890"
    },
    "histories": [
      {
        "id": 1,
        "action": "created",
        "description": "Ticket created by Maria Garcia",
        "user_name": "Maria Garcia", 
        "created_at": "2025-09-22T10:00:00Z"
      },
      {
        "id": 2,
        "action": "assigned_technical",
        "description": "Ticket assigned to John Doe",
        "user_name": "System",
        "created_at": "2025-09-22T10:15:00Z"
      },
      {
        "id": 3,
        "action": "member_message",
        "description": "Hi, when can you come to check this?",
        "user_name": "Maria Garcia",
        "created_at": "2025-09-22T11:00:00Z"
      },
      {
        "id": 4,
        "action": "status_updated",
        "description": "Status updated to in_progress by John Doe",
        "user_name": "John Doe",
        "created_at": "2025-09-22T14:30:00Z"
      }
    ],
    "attachments": [
      {
        "original_name": "broken_laptop.jpg",
        "file_name": "unique_filename.jpg",
        "file_path": "tickets/unique_filename.jpg",
        "mime_type": "image/jpeg",
        "file_size": 245760,
        "uploaded_at": "2025-09-22T10:00:00Z"
      }
    ]
  }
}
```

### 🎨 React Native Design Implementation

#### 1. Device Information Section
```jsx
const DeviceInfoSection = ({ device }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Device Information</Text>
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <Icon name="laptop" size={24} color="#3B82F6" />
        <Text style={styles.deviceName}>{device.name}</Text>
        <StatusBadge status={device.status} />
      </View>
      <View style={styles.deviceSpecs}>
        <SpecItem label="Brand" value={device.brand} />
        <SpecItem label="Model" value={device.model} />
        <SpecItem label="System" value={device.system} />
        <SpecItem label="Type" value={device.device_type} />
        <SpecItem label="Location" value={device.ubicacion} />
      </View>
    </View>
  </View>
);
```

#### 2. Technical Assignment Section
```jsx
const TechnicalSection = ({ technical, onCommunicate }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Assigned Technician</Text>
    {technical ? (
      <View style={styles.technicalCard}>
        <View style={styles.technicalHeader}>
          <Avatar source={{ uri: technical.photo }} size={50} />
          <View style={styles.technicalInfo}>
            <Text style={styles.technicalName}>{technical.name}</Text>
            <Text style={styles.technicalEmail}>{technical.email}</Text>
            <Text style={styles.technicalPhone}>{technical.phone}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.communicateButton}
          onPress={onCommunicate}
        >
          <Icon name="message-circle" size={20} color="white" />
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <Text style={styles.noTechnical}>No technician assigned yet</Text>
    )}
  </View>
);
```

#### 3. Attachments Section
```jsx
const AttachmentsSection = ({ attachments }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Attachments ({attachments.length})</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {attachments.map((attachment, index) => (
        <AttachmentItem key={index} attachment={attachment} />
      ))}
    </ScrollView>
  </View>
);

const AttachmentItem = ({ attachment }) => {
  const isImage = attachment.mime_type.startsWith('image/');
  const isVideo = attachment.mime_type.startsWith('video/');
  
  return (
    <TouchableOpacity style={styles.attachmentItem}>
      {isImage && (
        <Image 
          source={{ uri: `${BASE_URL}/storage/${attachment.file_path}` }}
          style={styles.attachmentPreview}
        />
      )}
      {isVideo && (
        <View style={styles.videoPreview}>
          <Icon name="play-circle" size={40} color="white" />
        </View>
      )}
      <Text style={styles.attachmentName} numberOfLines={1}>
        {attachment.original_name}
      </Text>
    </TouchableOpacity>
  );
};
```

#### 4. Timeline Section
```jsx
const TimelineSection = ({ histories }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Timeline</Text>
    {histories.map((history, index) => (
      <TimelineItem key={history.id} history={history} isLast={index === histories.length - 1} />
    ))}
  </View>
);

const TimelineItem = ({ history, isLast }) => {
  const getIconAndColor = (action) => {
    const iconMap = {
      'created': { icon: 'plus-circle', color: '#10B981' },
      'assigned_technical': { icon: 'user-check', color: '#3B82F6' },
      'status_updated': { icon: 'refresh-cw', color: '#F59E0B' },
      'member_message': { icon: 'message-circle', color: '#8B5CF6' },
      'member_feedback': { icon: 'star', color: '#F59E0B' },
      'evidence_uploaded': { icon: 'camera', color: '#EF4444' }
    };
    return iconMap[action] || { icon: 'circle', color: '#6B7280' };
  };

  const { icon, color } = getIconAndColor(history.action);

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIconContainer}>
        <Icon name={icon} size={16} color={color} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineDescription}>{history.description}</Text>
        <Text style={styles.timelineDate}>
          {formatDate(history.created_at)} by {history.user_name}
        </Text>
      </View>
    </View>
  );
};
```

#### 5. Action Buttons
```jsx
const ActionButtons = ({ ticket, onSendMessage, onAddFeedback }) => (
  <View style={styles.actionContainer}>
    {ticket.technical && (
      <TouchableOpacity 
        style={[styles.actionButton, styles.primaryButton]}
        onPress={onSendMessage}
      >
        <Icon name="message-circle" size={20} color="white" />
        <Text style={styles.buttonText}>Message Technician</Text>
      </TouchableOpacity>
    )}
    
    {['resolved', 'closed'].includes(ticket.status) && (
      <TouchableOpacity 
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onAddFeedback}
      >
        <Icon name="star" size={20} color="#3B82F6" />
        <Text style={[styles.buttonText, { color: '#3B82F6' }]}>Rate Service</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

### � React Native Implementation Examples

#### Complete TicketDetailScreen Example
```jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  StyleSheet
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchTicketDetail();
  }, []);

  const fetchTicketDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`/api/tenant/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToTechnical = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`/api/tenant/tickets/${ticketId}/send-message-to-technical`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Message sent successfully');
        setShowMessageModal(false);
        setMessage('');
        fetchTicketDetail(); // Refresh to show new message in timeline
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const submitFeedback = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`/api/tenant/tickets/${ticketId}/member-feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating,
          comment,
          is_feedback: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Alert.alert('Thank you!', 'Your feedback has been submitted');
        setShowFeedbackModal(false);
        setRating(0);
        setComment('');
        fetchTicketDetail();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading ticket details...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text>Ticket not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.ticketCode}>{ticket.code}</Text>
        <View style={styles.badges}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </View>
      </View>

      {/* Title and Description */}
      <View style={styles.section}>
        <Text style={styles.title}>{ticket.title}</Text>
        <Text style={styles.description}>{ticket.description}</Text>
        <Text style={styles.category}>Category: {ticket.category}</Text>
      </View>

      {/* Device Information */}
      <DeviceInfoSection device={ticket.device} />

      {/* Technical Assignment */}
      <TechnicalSection 
        technical={ticket.technical} 
        onSendMessage={() => setShowMessageModal(true)}
      />

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <AttachmentsSection attachments={ticket.attachments} />
      )}

      {/* Timeline */}
      <TimelineSection histories={ticket.histories} />

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {ticket.technical && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setShowMessageModal(true)}
          >
            <Icon name="message-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Message Technician</Text>
          </TouchableOpacity>
        )}
        
        {['resolved', 'closed'].includes(ticket.status) && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowFeedbackModal(true)}
          >
            <Icon name="star" size={20} color="#3B82F6" />
            <Text style={[styles.buttonText, { color: '#3B82F6' }]}>Rate Service</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message Modal */}
      <Modal visible={showMessageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message to {ticket.technical?.name}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message here..."
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{message.length}/500</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={sendMessageToTechnical}
                disabled={!message.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal visible={showFeedbackModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Our Service</Text>
            <StarRating rating={rating} onRatingChange={setRating} />
            <TextInput
              style={styles.textInput}
              placeholder="Share your experience (optional)..."
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={1000}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={submitFeedback}
                disabled={rating === 0}
              >
                <Text style={styles.sendButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange }) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => onRatingChange(star)}
      >
        <Icon
          name={star <= rating ? "star" : "star-o"}
          size={30}
          color={star <= rating ? "#FFD700" : "#E5E5E5"}
          style={styles.star}
        />
      </TouchableOpacity>
    ))}
    <Text style={styles.ratingText}>
      {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Tap to rate'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  category: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  starContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default TicketDetailScreen;
```

### 📋 Complete API Integration Service

```javascript
// services/TicketService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://yourapp.com/api';

class TicketService {
  static async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get all user tickets
  static async getUserTickets(status = null) {
    try {
      const headers = await this.getAuthHeaders();
      const url = status ? `${BASE_URL}/tenant/tickets?status=${status}` : `${BASE_URL}/tenant/tickets`;
      
      const response = await fetch(url, { headers });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to fetch tickets');
    }
  }

  // Get ticket detail
  static async getTicketDetail(ticketId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/tenant/tickets/${ticketId}`, { headers });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to fetch ticket detail');
    }
  }

  // Create ticket with base64 attachments
  static async createTicketAndroid(ticketData) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/tenant/tickets/android`, {
        method: 'POST',
        headers,
        body: JSON.stringify(ticketData)
      });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to create ticket');
    }
  }

  // Send message to technician
  static async sendMessageToTechnical(ticketId, message) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/tenant/tickets/${ticketId}/send-message-to-technical`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message })
      });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to send message');
    }
  }

  // Submit feedback
  static async submitFeedback(ticketId, rating, comment = '') {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/tenant/tickets/${ticketId}/member-feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          comment,
          is_feedback: true
        })
      });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to submit feedback');
    }
  }

  // Get ticket attachments
  static async getTicketAttachments(ticketId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${BASE_URL}/tenant/tickets/${ticketId}/attachments`, { headers });
      return await response.json();
    } catch (error) {
      throw new Error('Failed to get attachments');
    }
  }
}

export default TicketService;
```

### ✅ Implementation Status

**APIs Completamente Implementadas:**
1. ✅ **Send Message to Technician** - Comunicación directa con técnico asignado
2. ✅ **Add Member Feedback** - Sistema de calificaciones y comentarios
3. ✅ **Get Ticket Attachments** - URLs completas para archivos adjuntos
4. ✅ **Create Ticket Android** - Soporte para attachments base64
5. ✅ **All Tenant APIs** - Dispositivos, notificaciones, edificio, etc.

**Rutas Disponibles:**
- `POST /api/tenant/tickets/{ticket}/send-message-to-technical`
- `POST /api/tenant/tickets/{ticket}/member-feedback`  
- `GET /api/tenant/tickets/{ticket}/attachments`
- `POST /api/tenant/tickets/android`

### 🎯 Ready for Mobile Implementation

Todas las APIs necesarias para replicar la experiencia web en React Native están implementadas y documentadas. La app móvil puede ofrecer la misma funcionalidad completa que está disponible para members en la versión web.