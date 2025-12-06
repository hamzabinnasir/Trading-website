// frontend/src/pages/SiteMessages.js

import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Badge, Button, Modal, Alert } from 'react-bootstrap';
import { AuthService, ProfileService } from "../services";
import AppHeader from '../components/AppHeader';
import './SiteMessages.css';

const SiteMessages = (props) => {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      props.history.push("/login");
      return;
    }
    loadMessages();
  }, [props.history, currentUser]);

  const loadMessages = () => {
    setLoading(true);
    ProfileService.getSiteMessages().then(
      (response) => {
        setMessages(response.data || []);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading messages:", error);
        setMessages([]);
        setLoading(false);
      }
    );
  };

  const markAsRead = async (messageId) => {
    try {
      await ProfileService.markMessageAsRead(messageId);
      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadMessages = messages.filter(msg => !msg.isRead);
    
    for (const message of unreadMessages) {
      try {
        await ProfileService.markMessageAsRead(message._id);
      } catch (error) {
        console.error(`Error marking message ${message._id} as read:`, error);
      }
    }
    
    // Update all messages to read
    setMessages(messages.map(msg => ({ ...msg, isRead: true })));
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
    
    // Mark as read if unread
    if (!message.isRead) {
      markAsRead(message._id);
    }
  };

  const getFilteredMessages = () => {
    switch (filter) {
      case 'unread':
        return messages.filter(msg => !msg.isRead);
      case 'read':
        return messages.filter(msg => msg.isRead);
      default:
        return messages;
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'recharge':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'trade':
        return '📊';
      case 'system':
        return '⚙️';
      case 'admin':
        return '👨‍💼';
      default:
        return '✉️';
    }
  };

  const getMessageTypeBadge = (type) => {
    switch (type) {
      case 'recharge':
        return <Badge bg="success">Recharge</Badge>;
      case 'withdrawal':
        return <Badge bg="info">Withdrawal</Badge>;
      case 'trade':
        return <Badge bg="warning">Trade</Badge>;
      case 'system':
        return <Badge bg="secondary">System</Badge>;
      case 'admin':
        return <Badge bg="primary">Admin</Badge>;
      default:
        return <Badge bg="dark">General</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getUnreadCount = () => {
    return messages.filter(msg => !msg.isRead).length;
  };

  const filteredMessages = getFilteredMessages();

  return (
    <div className="site-messages-page">
      <AppHeader />
      
      <Container className="mt-4">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Site Messages</h2>
              <p className="text-muted mb-0">
                Manage your notifications and system messages
              </p>
            </div>
            
            <div className="message-actions">
              {getUnreadCount() > 0 && (
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="me-2"
                >
                  📬 Mark All as Read
                </Button>
              )}
              <Badge bg="primary" className="unread-count">
                {getUnreadCount()} unread
              </Badge>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Card className="mb-4">
          <Card.Body className="p-3">
            <div className="filter-tabs">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline-primary'}
                onClick={() => setFilter('all')}
                className="me-2"
              >
                All Messages ({messages.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'warning' : 'outline-warning'}
                onClick={() => setFilter('unread')}
                className="me-2"
              >
                Unread ({getUnreadCount()})
              </Button>
              <Button
                variant={filter === 'read' ? 'success' : 'outline-success'}
                onClick={() => setFilter('read')}
              >
                Read ({messages.length - getUnreadCount()})
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Messages List */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              {filter === 'all' && 'All Messages'}
              {filter === 'unread' && 'Unread Messages'}
              {filter === 'read' && 'Read Messages'}
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-5">
                <div className="empty-state-icon">📭</div>
                <h5 className="text-muted mt-3">No messages found</h5>
                <p className="text-muted">
                  {filter === 'all' 
                    ? "You don't have any messages yet." 
                    : `No ${filter} messages found.`
                  }
                </p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {filteredMessages.map(message => (
                  <ListGroup.Item 
                    key={message._id}
                    className={`message-item ${!message.isRead ? 'unread' : ''}`}
                    onClick={() => openMessage(message)}
                  >
                    <div className="d-flex align-items-start">
                      <div className="message-icon me-3">
                        {getMessageTypeIcon(message.messageType)}
                      </div>
                      
                      <div className="message-content flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="message-title mb-0">
                            {message.title}
                            {!message.isRead && (
                              <Badge bg="danger" className="ms-2">New</Badge>
                            )}
                          </h6>
                          <small className="message-time text-muted">
                            {formatDate(message.createdAt)}
                          </small>
                        </div>
                        
                        <p className="message-preview mb-1">
                          {message.message && message.message.length > 100 
                            ? message.message.substring(0, 100) + '...' 
                            : message.message || 'No content'
                          }
                        </p>
                        
                        <div className="message-meta">
                          {getMessageTypeBadge(message.messageType)}
                          <small className="text-muted ms-2">
                            Click to read full message
                          </small>
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Message Detail Modal */}
      <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedMessage && (
              <>
                <span className="me-2">
                  {getMessageTypeIcon(selectedMessage.messageType)}
                </span>
                {selectedMessage.title}
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMessage && (
            <>
              <div className="message-header mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  {getMessageTypeBadge(selectedMessage.messageType)}
                  <small className="text-muted">
                    {formatDate(selectedMessage.createdAt)}
                  </small>
                </div>
              </div>
              
              <div className="message-body">
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.message || 'No content available'}
                </p>
              </div>
              
              {selectedMessage.relatedId && (
                <Alert variant="info" className="mt-3 mb-0">
                  <small>
                    <strong>Related Transaction:</strong> {selectedMessage.relatedId}
                  </small>
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
            Close
          </Button>
          {selectedMessage && !selectedMessage.isRead && (
            <Button 
              variant="success" 
              onClick={() => {
                markAsRead(selectedMessage._id);
                setShowMessageModal(false);
              }}
            >
              Mark as Read & Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SiteMessages;