// frontend/src/pages/SecuritySettings.js

import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { AuthService, ProfileService } from "../services";
import AppHeader from '../components/AppHeader';
import './SecuritySettings.css';

const SecuritySettings = (props) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Login Password States
  const [currentLoginPassword, setCurrentLoginPassword] = useState('');
  const [newLoginPassword, setNewLoginPassword] = useState('');
  const [confirmLoginPassword, setConfirmLoginPassword] = useState('');

  // Fund Password States
  const [currentFundPassword, setCurrentFundPassword] = useState('');
  const [newFundPassword, setNewFundPassword] = useState('');
  const [confirmFundPassword, setConfirmFundPassword] = useState('');

  const currentUser = AuthService.getCurrentUser();

  if (!currentUser) {
    props.history.push("/login");
    return null;
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (password.length > 20) {
      return "Password cannot exceed 20 characters";
    }
    return null;
  };

  const handleLoginPasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!currentLoginPassword || !newLoginPassword || !confirmLoginPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newLoginPassword !== confirmLoginPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    const passwordError = validatePassword(newLoginPassword);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      return;
    }

    setLoading(true);

    try {
      await ProfileService.changeLoginPassword(
        currentLoginPassword,
        newLoginPassword
      );

      setMessage({ 
        type: 'success', 
        text: 'Login password changed successfully!' 
      });
      
      // Clear form
      setCurrentLoginPassword('');
      setNewLoginPassword('');
      setConfirmLoginPassword('');
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change login password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundPasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!newFundPassword || !confirmFundPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newFundPassword !== confirmFundPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    const passwordError = validatePassword(newFundPassword);
    if (passwordError) {
      setMessage({ type: 'error', text: passwordError });
      return;
    }

    setLoading(true);

    try {
      await ProfileService.changeFundPassword(
        currentFundPassword || '', // Allow empty for first-time setup
        newFundPassword
      );

      setMessage({ 
        type: 'success', 
        text: 'Fund password changed successfully!' 
      });
      
      // Clear form
      setCurrentFundPassword('');
      setNewFundPassword('');
      setConfirmFundPassword('');
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change fund password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderLoginPasswordTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0">🔐 Change Login Password</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleLoginPasswordChange}>
          <Form.Group className="mb-3">
            <Form.Label>Current Login Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter current password"
              value={currentLoginPassword}
              onChange={(e) => setCurrentLoginPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Login Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new password"
              value={newLoginPassword}
              onChange={(e) => setNewLoginPassword(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Password must be 8-20 characters long
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Confirm New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new password"
              value={confirmLoginPassword}
              onChange={(e) => setConfirmLoginPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Login Password'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderFundPasswordTab = () => (
    <Card>
      <Card.Header>
        <h5 className="mb-0">💰 Change Fund Password</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleFundPasswordChange}>
          <Form.Group className="mb-3">
            <Form.Label>Current Fund Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter current fund password (leave blank if not set)"
              value={currentFundPassword}
              onChange={(e) => setCurrentFundPassword(e.target.value)}
            />
            <Form.Text className="text-muted">
              If you haven't set a fund password before, leave this field blank
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Fund Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter new fund password"
              value={newFundPassword}
              onChange={(e) => setNewFundPassword(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Fund password is used for withdrawals and sensitive transactions
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Confirm New Fund Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Confirm new fund password"
              value={confirmFundPassword}
              onChange={(e) => setConfirmFundPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button 
            variant="warning" 
            type="submit" 
            className="w-100"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Fund Password'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderSecurityTips = () => (
    <Card className="security-tips-card">
      <Card.Header>
        <h5 className="mb-0">💡 Security Tips</h5>
      </Card.Header>
      <Card.Body>
        <div className="security-tips">
          <div className="tip-item">
            <strong>🔒 Strong Passwords</strong>
            <p>Use a combination of letters, numbers, and special characters</p>
          </div>
          
          <div className="tip-item">
            <strong>🔄 Regular Updates</strong>
            <p>Change your passwords regularly for better security</p>
          </div>
          
          <div className="tip-item">
            <strong>🎯 Different Passwords</strong>
            <p>Use different passwords for login and fund transactions</p>
          </div>
          
          <div className="tip-item">
            <strong>📱 Secure Device</strong>
            <p>Always access your account from trusted devices</p>
          </div>
          
          <div className="tip-item">
            <strong>🚫 No Sharing</strong>
            <p>Never share your passwords with anyone</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="security-settings-page">
      <AppHeader />
      
      <Container className="mt-4">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Security Settings</h2>
            <div className="security-status">
              <span className="status-badge secure">🛡️ Account Secure</span>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <Alert 
            variant={message.type === 'success' ? 'success' : 'danger'}
            className="mb-4"
          >
            {message.text}
          </Alert>
        )}

        <Row>
          <Col lg={8}>
            {/* Tab Navigation */}
            <div className="security-tabs mb-4">
              <Button
                variant={activeTab === 'login' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('login')}
                className="me-2"
              >
                🔐 Login Password
              </Button>
              <Button
                variant={activeTab === 'fund' ? 'warning' : 'outline-warning'}
                onClick={() => setActiveTab('fund')}
              >
                💰 Fund Password
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'login' && renderLoginPasswordTab()}
            {activeTab === 'fund' && renderFundPasswordTab()}
          </Col>

          <Col lg={4}>
            {renderSecurityTips()}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SecuritySettings;