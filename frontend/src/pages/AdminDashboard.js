// frontend/src/pages/AdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Nav } from 'react-bootstrap';
import { AdminService } from "../services";
import AccessRequestService from "../services/accessRequest.service";
import './AdminDashboard.css';

const AdminDashboard = (props) => {
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    frozenUsers: 0,
    pendingRecharges: 0,
    pendingWithdrawals: 0,
    pendingTrades: 0,
    totalBalance: 0
  });

  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [balanceMode, setBalanceMode] = useState('deduct'); // 'add' or 'deduct'

  // Recharge & Withdrawal State
  const [recharges, setRecharges] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processType, setProcessType] = useState(''); // 'recharge' or 'withdrawal'
  const [processAction, setProcessAction] = useState(''); // 'approve' or 'reject'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  // Access Requests State
  const [accessRequests, setAccessRequests] = useState([]);

  // Move getCurrentAdmin outside useEffect and memoize it
  const getCurrentAdmin = useCallback(() => {
    try {
      const adminData = localStorage.getItem('adminUser');
      if (!adminData) {
        return null;
      }

      const admin = JSON.parse(adminData);

      if (!admin.accessToken && !admin.token) {
        return null;
      }

      return admin;
    } catch (error) {
      return null;
    }
  }, []);

  // Memoize loadDashboardData to prevent infinite re-renders
  const loadDashboardData = useCallback(() => {
    setLoading(true);
    AdminService.getAdminDashboard()
      .then((response) => {
        setDashboardStats(response.data || {});
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        if (error.response?.status === 401) {
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminToken');
          props.history.push("/login");
        }
      });
  }, [props.history]);

  // Memoize loadUsers to prevent infinite re-renders
  const loadUsers = useCallback(() => {
    AdminService.getAllUsers()
      .then((response) => {
        setUsers(response.data || []);
      })
      .catch((error) => {
        setUsers([]);
      });
  }, []);

  const loadRecharges = useCallback(() => {
    AdminService.getAllRecharges()
      .then((response) => {
        setRecharges(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading recharges", error);
      });
  }, []);

  const loadWithdrawals = useCallback(() => {
    AdminService.getAllWithdrawals()
      .then((response) => {
        setWithdrawals(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading withdrawals", error);
      });
  }, []);

  const loadAccessRequests = useCallback(() => {
    AccessRequestService.getAllRequests()
      .then((response) => {
        setAccessRequests(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading access requests", error);
      });
  }, []);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    const currentAdmin = getCurrentAdmin();

    if (!currentAdmin) {
      props.history.push("/login");
      return;
    }

    loadDashboardData();
    loadUsers();
    loadRecharges();
    loadWithdrawals();
    loadAccessRequests();
  }, [props.history, getCurrentAdmin, loadDashboardData, loadUsers, loadRecharges, loadWithdrawals, loadAccessRequests]); // Add all dependencies

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminSession');
    props.history.push("/login");
  };

  const toggleUserFreeze = (userId) => {
    AdminService.toggleUserFreeze(userId)
      .then((response) => {
        alert("User status updated successfully");
        loadUsers();
        loadDashboardData();
      })
      .catch((error) => {
        alert("Failed to update user status: " + (error.response?.data?.message || error.message));
      });
  };

  const setUserOffline = (userId) => {
    AdminService.setUserOffline(userId)
      .then((response) => {
        alert("User set to offline successfully");
        loadUsers();
        loadDashboardData();
      })
      .catch((error) => {
        alert("Failed to set user offline");
      });
  };

  const openBalanceModal = (user, mode) => {
    setSelectedUser(user);
    setBalanceMode(mode);
    setDeductionAmount('');
    setDeductionReason('');
    setShowUserModal(true);
  };

  const handleBalanceUpdate = () => {
    if (!deductionAmount || deductionAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!selectedUser) {
      alert("No user selected");
      return;
    }

    const apiCall = balanceMode === 'add' ? AdminService.addToUser : AdminService.deductFromUser;
    const actionName = balanceMode === 'add' ? 'added' : 'deducted';

    apiCall(selectedUser._id, parseFloat(deductionAmount), deductionReason)
      .then((response) => {
        alert(`Amount ${actionName} successfully`);
        setShowUserModal(false);
        setDeductionAmount('');
        setDeductionReason('');
        setSelectedUser(null);
        loadDashboardData();
        loadUsers();
      })
      .catch((error) => {
        alert(`Failed to ${balanceMode} amount: ` + (error.response?.data?.message || error.message));
      });
  };

  const sendMessageToUser = (user) => {
    if (!messageTitle || !messageContent) {
      alert("Please enter both title and message");
      return;
    }

    AdminService.sendMessageToUser(user._id, messageTitle, messageContent)
      .then((response) => {
        alert("Message sent successfully");
        setMessageTitle('');
        setMessageContent('');
        setSelectedUser(null);
      })
      .catch((error) => {
        alert("Failed to send message");
      });
  };

  // --- RECHARGE & WITHDRAWAL HANDLERS ---
  const openProcessModal = (item, type, action) => {
    setSelectedRequest(item);
    setProcessType(type);
    setProcessAction(action);
    setAdminNote('');
    setShowProcessModal(true);
  };

  const handleProcessRequest = () => {
    if (!selectedRequest) return;

    const apiCall = processType === 'recharge'
      ? (processAction === 'approve' ? AdminService.approveRecharge : AdminService.rejectRecharge)
      : (processAction === 'approve' ? AdminService.approveWithdrawal : AdminService.rejectWithdrawal);

    apiCall(selectedRequest._id, adminNote)
      .then(() => {
        alert(`${processType === 'recharge' ? 'Recharge' : 'Withdrawal'} ${processAction}ed successfully`);
        setShowProcessModal(false);
        if (processType === 'recharge') loadRecharges();
        else loadWithdrawals();
        loadDashboardData();
      })
      .catch(error => {
        alert(`Failed to ${processAction} request: ` + (error.response?.data?.message || error.message));
      });
  };

  const handleAccessRequestStatus = (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;

    AccessRequestService.updateRequestStatus(id, status)
      .then((response) => {
        let msg = `Request ${status} successfully`;
        if (response.data.invitationCode) {
          msg += `\n\nInvitation Code: ${response.data.invitationCode}\n(Please share this code with the user)`;
        }
        alert(msg);
        loadAccessRequests();
        loadUsers(); // Reload users as a new user might have been created
      })
      .catch(error => {
        alert(`Failed to ${status} request: ` + (error.response?.data?.message || error.message));
      });
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h2 className="mb-4">Admin Dashboard</h2>

      <Row className="mb-4">
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon users">👥</div>
              <h3>{dashboardStats.totalUsers}</h3>
              <p>Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon online">🟢</div>
              <h3>{dashboardStats.onlineUsers}</h3>
              <p>Online Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon frozen">❄️</div>
              <h3>{dashboardStats.frozenUsers}</h3>
              <p>Frozen Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon recharge">💰</div>
              <h3>{dashboardStats.pendingRecharges}</h3>
              <p>Pending Recharges</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon withdrawal">💸</div>
              <h3>{dashboardStats.pendingWithdrawals}</h3>
              <p>Pending Withdrawals</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} sm={4} xs={6}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon trades">📊</div>
              <h3>{dashboardStats.pendingTrades}</h3>
              <p>Pending Trades</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <div className="stats-icon requests">📝</div>
              <h3>{accessRequests.filter(r => r.status === 'pending').length}</h3>
              <p>Pending Access Requests</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <h4 className="mb-0">Platform Statistics</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="stat-item">
                <strong>Total Platform Balance:</strong>
                <span className="text-success">${(dashboardStats.totalBalance || 0).toFixed(2)}</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="stat-item">
                <strong>Active Trading Sessions:</strong>
                <span>{dashboardStats.pendingTrades}</span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );

  const renderUserManagement = () => (
    <div className="user-management">
      <h2 className="mb-4">User Management</h2>

      {users.length === 0 ? (
        <div className="text-center py-5">
          <h4>No users found</h4>
          <p className="text-muted">There are no users in the system yet.</p>
        </div>
      ) : (
        <Table striped bordered hover responsive className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Invitation Code</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Frozen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.invitationCode || 'N/A'}</td>
                <td>${(user.balance || 0).toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${user.isOnline ? 'online' : 'offline'}`}>
                    {user.isOnline ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isFrozen ? 'frozen' : 'active'}`}>
                    {user.isFrozen ? '❄️ Frozen' : '✅ Active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <Button
                      size="sm"
                      variant={user.isFrozen ? "success" : "warning"}
                      onClick={() => toggleUserFreeze(user._id)}
                      className="me-1 mb-1"
                    >
                      {user.isFrozen ? 'Unfreeze' : 'Freeze'}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setUserOffline(user._id)}
                      disabled={!user.isOnline}
                      className="me-1 mb-1"
                    >
                      Set Offline
                    </Button>

                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => openBalanceModal(user, 'add')}
                      className="me-1 mb-1"
                    >
                      Add
                    </Button>

                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => openBalanceModal(user, 'deduct')}
                      className="me-1 mb-1"
                    >
                      Deduct
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedUser(user);
                        setMessageTitle('Admin Message');
                        setMessageContent('');
                      }}
                      className="mb-1"
                    >
                      Message
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );

  const renderRechargeManagement = () => (
    <div className="recharge-management">
      <h2 className="mb-4">Recharge Management</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>User</th>
            <th>Amount</th>
            <th>Channel</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recharges.map(item => (
            <tr key={item._id}>
              <td>{item.username}</td>
              <td className="text-success fw-bold">${item.amount}</td>
              <td>{item.channel}</td>
              <td>
                <span className={`badge bg-${item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}`}>
                  {item.status}
                </span>
              </td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>
                {item.status === 'Pending' && (
                  <>
                    <Button size="sm" variant="success" className="me-2" onClick={() => openProcessModal(item, 'recharge', 'approve')}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => openProcessModal(item, 'recharge', 'reject')}>Reject</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderWithdrawalManagement = () => (
    <div className="withdrawal-management">
      <h2 className="mb-4">Withdrawal Management</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>User</th>
            <th>Amount</th>
            <th>Wallet</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map(item => (
            <tr key={item._id}>
              <td>{item.username}</td>
              <td className="text-danger fw-bold">-${item.amount}</td>
              <td>
                {item.walletType === 'bank' ? '🏦 Bank' : '₿ Digital'}
                <br />
                <small className="text-muted">
                  {item.walletType === 'bank'
                    ? `${item.walletDetails?.bankName} - ${item.walletDetails?.accountNo}`
                    : `${item.walletDetails?.currency} - ${item.walletDetails?.address}`
                  }
                </small>
              </td>
              <td>
                <span className={`badge bg-${item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'}`}>
                  {item.status}
                </span>
              </td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td>
                {item.status === 'Pending' && (
                  <>
                    <Button size="sm" variant="success" className="me-2" onClick={() => openProcessModal(item, 'withdrawal', 'approve')}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => openProcessModal(item, 'withdrawal', 'reject')}>Reject</Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  const renderAccessRequests = () => (
    <div className="access-requests-management">
      <h2 className="mb-4">Access Requests</h2>
      {accessRequests.length === 0 ? (
        <div className="text-center py-5">
          <h4>No access requests found</h4>
          <p className="text-muted">There are no pending or processed access requests.</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Request Type</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessRequests.map(request => (
              <tr key={request._id}>
                <td>{request.username}</td>
                <td>{request.email}</td>
                <td>{request.requestType}</td>
                <td>
                  <span className={`badge bg-${request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}`}>
                    {request.status}
                  </span>
                </td>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
                <td>
                  {request.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" className="me-2" onClick={() => handleAccessRequestStatus(request._id, 'accepted')}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handleAccessRequestStatus(request._id, 'rejected')}>Reject</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );

  // Get current admin for display
  const currentAdmin = getCurrentAdmin();

  return (
    <Container fluid className="admin-container">
      {/* Admin Header */}
      <div className="admin-header">
        <div className="d-flex justify-content-between align-items-center p-3">
          <h1 className="mb-0">SuperCoin Admin Panel</h1>
          <div>
            <span className="me-3">Welcome, {currentAdmin?.username || 'Admin'}</span>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <Nav variant="tabs" className="admin-nav">
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'dashboard'}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'users'}
            onClick={() => setActiveSection('users')}
          >
            👥 User Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'recharges'}
            onClick={() => setActiveSection('recharges')}
          >
            💰 Recharge Management
            {dashboardStats.pendingRecharges > 0 && (
              <span className="badge bg-danger ms-2">{dashboardStats.pendingRecharges}</span>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'withdrawals'}
            onClick={() => setActiveSection('withdrawals')}
          >
            💸 Withdrawal Management
            {dashboardStats.pendingWithdrawals > 0 && (
              <span className="badge bg-danger ms-2">{dashboardStats.pendingWithdrawals}</span>
            )}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'trades'}
            onClick={() => setActiveSection('trades')}
          >
            📊 Trade Management
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSection === 'accessRequests'}
            onClick={() => setActiveSection('accessRequests')}
          >
            📝 Access Requests
            {accessRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="badge bg-danger ms-2">{accessRequests.filter(r => r.status === 'pending').length}</span>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <div className="admin-content p-4">
        {activeSection === 'dashboard' && renderDashboard()}
        {activeSection === 'users' && renderUserManagement()}
        {activeSection === 'recharges' && renderRechargeManagement()}
        {activeSection === 'withdrawals' && renderWithdrawalManagement()}
        {activeSection === 'trades' && <div className="text-center py-5"><h3>Trade Management</h3><p>Trade management features are coming soon.</p></div>}
        {activeSection === 'accessRequests' && renderAccessRequests()}
      </div>

      {/* Balance Modal (Add/Deduct) */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{balanceMode === 'add' ? 'Add to User Balance' : 'Deduct from User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>User: <strong>{selectedUser.username}</strong></p>
              <p>Current Balance: <strong>${(selectedUser.balance || 0).toFixed(2)}</strong></p>

              <Form.Group className="mb-3">
                <Form.Label>Amount to {balanceMode === 'add' ? 'Add' : 'Deduct'}</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter reason for ${balanceMode === 'add' ? 'addition' : 'deduction'}`}
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button variant={balanceMode === 'add' ? 'success' : 'danger'} onClick={handleBalanceUpdate}>
            {balanceMode === 'add' ? 'Add Amount' : 'Deduct Amount'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Message Modal */}
      <Modal show={!!selectedUser && !!messageTitle} onHide={() => setSelectedUser(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Message to {selectedUser?.username}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Message Title</Form.Label>
            <Form.Control
              type="text"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              placeholder="Enter message title"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter your message..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedUser(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => sendMessageToUser(selectedUser)}>
            Send Message
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Process Request Modal */}
      <Modal show={showProcessModal} onHide={() => setShowProcessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{processAction === 'approve' ? 'Approve' : 'Reject'} {processType === 'recharge' ? 'Recharge' : 'Withdrawal'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to {processAction} this request?</p>
          {selectedRequest && (
            <div className="alert alert-info">
              <strong>User:</strong> {selectedRequest.username}<br />
              <strong>Amount:</strong> ${selectedRequest.amount}
            </div>
          )}
          <Form.Group>
            <Form.Label>Admin Note (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Enter reason or note..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProcessModal(false)}>Cancel</Button>
          <Button
            variant={processAction === 'approve' ? 'success' : 'danger'}
            onClick={handleProcessRequest}
          >
            Confirm {processAction === 'approve' ? 'Approval' : 'Rejection'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;