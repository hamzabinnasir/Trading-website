// frontend/src/pages/WithdrawalPage.js

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { AuthService, WithdrawalService, ProfileService } from "../services";
import AppHeader from '../components/AppHeader';
import './WithdrawalPage.css';

const WithdrawalPage = (props) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [fundPassword, setFundPassword] = useState('');
  const [userBalance, setUserBalance] = useState(0);
  const [bankWallets, setBankWallets] = useState([]);
  const [digitalWallets, setDigitalWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      props.history.push("/login");
      return;
    }
    loadUserData();
  }, [props.history, currentUser]);

  const loadUserData = () => {
    // Load user profile data (includes balance and wallets)
    ProfileService.getProfile().then(
      (response) => {
        const data = response.data;
        setUserBalance(data.balance || 0);
        setBankWallets(data.bankWallets || []);
        setDigitalWallets(data.digitalWallets || []);
      }
    );

    // Load withdrawal history
    WithdrawalService.getUserWithdrawals().then(
      (response) => {
        setWithdrawals(response.data || []);
      },
      (error) => {
        console.error("Error loading withdrawals:", error);
        setWithdrawals([]);
      }
    );
  };

  const handleWithdrawalSubmit = () => {
    setError('');

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setError("Please enter a valid withdrawal amount");
      return;
    }

    if (withdrawalAmount < 1000 || withdrawalAmount > 10000000) {
      setError("Withdrawal amount must be between $1,000 and $10,000,000");
      return;
    }

    if (withdrawalAmount > userBalance) {
      setError("Insufficient balance for withdrawal");
      return;
    }

    if (!selectedWallet) {
      setError("Please select a wallet");
      return;
    }

    if (!fundPassword) {
      setError("Please enter your fund password");
      return;
    }

    setLoading(true);

    const walletData = JSON.parse(selectedWallet);
    const walletDetails = walletData.type === 'bank'
      ? bankWallets.find(w => w._id === walletData.id)
      : digitalWallets.find(w => w._id === walletData.id);

    WithdrawalService.createWithdrawal(
      parseFloat(withdrawalAmount),
      walletData.type,
      walletDetails,
      fundPassword
    ).then(
      (response) => {
        alert("Withdrawal request submitted successfully! Please wait for admin approval.");
        setShowWithdrawalModal(false);
        setWithdrawalAmount('');
        setSelectedWallet('');
        setFundPassword('');
        setLoading(false);
        loadUserData();
      },
      (error) => {
        setError("Failed to submit withdrawal request: " + (error.response?.data?.message || error.message));
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
    <div className="withdrawal-page">
      <AppHeader />

      <Container className="mt-4">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Withdrawal Management</h2>
            <Button
              variant="primary"
              onClick={() => setShowWithdrawalModal(true)}
              className="btn-withdraw-now"
              disabled={bankWallets.length === 0 && digitalWallets.length === 0}
            >
              💸 New Withdrawal
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-4 balance-card">
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6 className="text-muted">Available Balance</h6>
                <h2 className="text-success mb-0">${userBalance.toFixed(2)}</h2>
              </Col>
              <Col md={6} className="text-end">
                <h6 className="text-muted">Withdrawal Limits</h6>
                <p className="mb-0">$1,000 - $10,000,000</p>
                <small className="text-muted">10 withdrawals per day</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Quick Withdrawal Options */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quick Withdrawal Amounts</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {[1000, 5000, 10000, 25000, 50000, 100000].map(amount => (
                <Col key={amount} xs={6} sm={4} md={3} lg={2} className="mb-2">
                  <Button
                    variant="outline-primary"
                    className="w-100 quick-amount-btn"
                    onClick={() => {
                      if (amount > userBalance) {
                        setError("Insufficient balance for this amount");
                        return;
                      }
                      setWithdrawalAmount(amount);
                      setShowWithdrawalModal(true);
                    }}
                    disabled={amount > userBalance}
                  >
                    ${amount.toLocaleString()}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Wallet Status */}
        {(bankWallets.length === 0 && digitalWallets.length === 0) && (
          <Alert variant="warning" className="mb-4">
            ⚠️ No wallets found. Please add a bank or digital wallet in your profile before making a withdrawal.
          </Alert>
        )}

        {/* Withdrawal History */}
        <Card>
          <Card.Header>
            <h5 className="mb-0">Withdrawal History</h5>
          </Card.Header>
          <Card.Body>
            {withdrawals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No withdrawal history found.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowWithdrawalModal(true)}
                  disabled={bankWallets.length === 0 && digitalWallets.length === 0}
                >
                  Make Your First Withdrawal
                </Button>
              </div>
            ) : (
              <Table responsive hover className="withdrawal-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Wallet Type</th>
                    <th>Status</th>
                    <th>Request Time</th>
                    <th>Processed Time</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(withdrawal => (
                    <tr key={withdrawal._id}>
                      <td>
                        <strong className="text-danger">-${withdrawal.amount}</strong>
                      </td>
                      <td>
                        <span className="text-capitalize">{withdrawal.walletType}</span>
                      </td>
                      <td>{getStatusBadge(withdrawal.status)}</td>
                      <td>{formatDate(withdrawal.createdAt)}</td>
                      <td>
                        {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Withdrawal Modal */}
      <Modal show={showWithdrawalModal} onHide={() => setShowWithdrawalModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>New Withdrawal Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Withdrawal Amount (USD)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                min="1000"
                max="10000000"
              />
              <Form.Text className="text-muted">
                Available: ${userBalance.toFixed(2)} | Limits: $1,000 - $10,000,000
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Wallet</Form.Label>
              <Form.Select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
              >
                <option value="">Choose a wallet...</option>

                {/* Bank Wallets */}
                {bankWallets.length > 0 && (
                  <optgroup label="🏦 Bank Wallets">
                    {bankWallets.map(wallet => (
                      <option key={wallet._id} value={JSON.stringify({ type: 'bank', id: wallet._id })}>
                        {wallet.bankName} - {wallet.accountNo}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Digital Wallets */}
                {digitalWallets.length > 0 && (
                  <optgroup label="₿ Digital Wallets">
                    {digitalWallets.map(wallet => (
                      <option key={wallet._id} value={JSON.stringify({ type: 'digital', id: wallet._id })}>
                        {wallet.currency} - {wallet.address.substring(0, 15)}...
                      </option>
                    ))}
                  </optgroup>
                )}
              </Form.Select>

              {(bankWallets.length === 0 && digitalWallets.length === 0) && (
                <Form.Text className="text-warning">
                  No wallets available. Please add wallets in your profile first.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fund Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your fund password"
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value)}
              />
              <Form.Text className="text-muted">
                Required for security verification
              </Form.Text>
            </Form.Group>

            <div className="withdrawal-info-box p-3 mb-3">
              <h6>📋 Withdrawal Rules:</h6>
              <ul className="mb-0 ps-3">
                <li>Withdrawal time: 24/7 (00:01 - 23:59)</li>
                <li>Maximum 10 withdrawals per day</li>
                <li>Amount range: $1,000 - $10,000,000</li>
                <li>Processing time: 1-2 hours during business days</li>
              </ul>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWithdrawalModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleWithdrawalSubmit}
            disabled={loading || !withdrawalAmount || !selectedWallet || !fundPassword}
          >
            {loading ? 'Processing...' : 'Submit Withdrawal Request'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WithdrawalPage;