// frontend/src/pages/RechargePage.js

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { AuthService, RechargeService } from "../services";
import AppHeader from '../components/AppHeader';
import './RechargePage.css';

const RechargePage = (props) => {
  const [recharges, setRecharges] = useState([]);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Channel 01');
  const [loading, setLoading] = useState(false);

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      props.history.push("/login");
      return;
    }
    loadUserRecharges();
  }, [props.history, currentUser]);

  const loadUserRecharges = () => {
    RechargeService.getUserRecharges().then(
      (response) => {
        setRecharges(response.data || []);
      },
      (error) => {
        console.error("Error loading recharges:", error);
        setRecharges([]);
      }
    );
  };

  const handleRechargeSubmit = () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert("Please enter a valid recharge amount");
      return;
    }

    setLoading(true);

    RechargeService.createRecharge(
      parseFloat(rechargeAmount),
      selectedChannel
    ).then(
      (response) => {
        alert("Recharge request submitted successfully! Please wait for admin approval.");
        setShowRechargeModal(false);
        setRechargeAmount('');
        setLoading(false);
        loadUserRecharges();
      },
      (error) => {
        alert("Failed to submit recharge request: " + (error.response?.data?.message || error.message));
        setLoading(false);
      }
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="recharge-page">
      <AppHeader />
      
      <Container className="mt-4">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Recharge Management</h2>
            <Button 
              variant="success" 
              onClick={() => setShowRechargeModal(true)}
              className="btn-recharge-now"
            >
              + New Recharge
            </Button>
          </div>
        </div>

        {/* Quick Recharge Options */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quick Recharge Amounts</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {[1000, 3000, 5000, 7000, 10000, 15000, 30000, 50000].map(amount => (
                <Col key={amount} xs={6} sm={4} md={3} lg={2} className="mb-2">
                  <Button
                    variant="outline-primary"
                    className="w-100 quick-amount-btn"
                    onClick={() => {
                      setRechargeAmount(amount);
                      setShowRechargeModal(true);
                    }}
                  >
                    ${amount}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Recharge History */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Recharge History</h5>
          </Card.Header>
          <Card.Body>
            {recharges.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No recharge history found.</p>
                <Button variant="primary" onClick={() => setShowRechargeModal(true)}>
                  Make Your First Recharge
                </Button>
              </div>
            ) : (
              <Table responsive hover className="recharge-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Request Time</th>
                    <th>Processed Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map(recharge => (
                    <tr key={recharge._id}>
                      <td>
                        <strong className="text-success">${recharge.amount}</strong>
                      </td>
                      <td>{recharge.channel}</td>
                      <td>{getStatusBadge(recharge.status)}</td>
                      <td>{formatDate(recharge.createdAt)}</td>
                      <td>
                        {recharge.processedAt ? formatDate(recharge.processedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Recharge Modal */}
      <Modal show={showRechargeModal} onHide={() => setShowRechargeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>New Recharge Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Recharge Amount (USD)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                min="100"
                max="100000"
              />
              <Form.Text className="text-muted">
                Minimum: $100, Maximum: $100,000
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Recharge Channel</Form.Label>
              <Form.Select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="Channel 01">Channel 01 (100-100,000)</option>
                <option value="Channel 02">Channel 02 (500-50,000)</option>
                <option value="Channel 03">Channel 03 (1000-100,000)</option>
              </Form.Select>
            </Form.Group>

            <div className="recharge-info-box p-3 mb-3">
              <h6>💡 Recharge Instructions:</h6>
              <small className="text-muted">
                • Please contact teacher to get the latest channels for recharging.<br/>
                • Your recharge will be processed within 24 hours.<br/>
                • You will receive notification once approved by admin.
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRechargeModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={handleRechargeSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Recharge Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RechargePage;