// frontend/src/pages/Profile.js

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Container, Row, Col, Modal, ListGroup, Form, Card } from 'react-bootstrap';
import { AuthService, ProfileService, RechargeService, WithdrawalService } from "../services";
import AppHeader from '../components/AppHeader';
import './Profile.css';

const Profile = (props) => {
  // --- STATE MANAGEMENT ---
  const [currentView, setCurrentView] = useState('profile');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [newSignature, setNewSignature] = useState('');

  // Recharge/Withdrawal states
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalChannel, setWithdrawalChannel] = useState('Channel 01');
  const [withdrawalDetails, setWithdrawalDetails] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [fundPassword, setFundPassword] = useState('');

  // Wallet Data State
  const [digitalWallets, setDigitalWallets] = useState([]);
  const [bankWallets, setBankWallets] = useState([]);

  // Add/Edit Wallet Modal State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletModalType, setWalletModalType] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentWalletId, setCurrentWalletId] = useState(null);

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null });

  // Forms
  const [digitalForm, setDigitalForm] = useState({ currency: '', classification: '', address: '' });
  const [bankForm, setBankForm] = useState({ holderName: '', bankName: '', accountNo: '', ifscCode: '' });

  // Crypto Data Options
  const cryptoOptions = [
    { code: 'BTC', name: 'Bitcoin', classifications: ['BTC', 'SegWit'] },
    { code: 'ETH', name: 'Ethereum', classifications: ['ERC20', 'BEP20'] },
    { code: 'USDT', name: 'Tether', classifications: ['TRC20', 'ERC20', 'BEP20'] },
    { code: 'XRP', name: 'XRP', classifications: ['XRP'] },
    { code: 'BCH', name: 'Bitcoin Cash', classifications: ['BCH'] },
    { code: 'BSV', name: 'Bitcoin SV', classifications: ['BSV'] },
    { code: 'LTC', name: 'Litecoin', classifications: ['LTC'] },
    { code: 'BNB', name: 'Binance Coin', classifications: ['BEP2', 'BEP20'] },
    { code: 'EOS', name: 'EOS', classifications: ['EOS'] },
    { code: 'XTZ', name: 'Tezos', classifications: ['XTZ'] },
  ];

  const [userData, setUserData] = useState({
    username: 'Guest',
    balance: '0.00',
    frozen: '0',
    score: '100',
    avatar: 'G',
    gender: 'Male',
    signature: 'Not set',
    invitationCode: 'N/A'
  });

  const currentUser = AuthService.getCurrentUser();
  const isMounted = React.useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- LOAD DATA FROM BACKEND ---
  const loadProfileData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await ProfileService.getProfile();
      if (!isMounted.current) return;
      const data = response.data;

      setUserData({
        username: data.username || currentUser.username,
        balance: data.balance !== undefined ? parseFloat(data.balance).toFixed(2) : "0.00",
        frozen: data.isFrozen ? 'Frozen' : '0',
        score: data.score || '100',
        avatar: (data.username || currentUser.username).charAt(0).toUpperCase(),
        gender: data.gender || 'Male',
        signature: data.signature || 'Not set',
        invitationCode: data.invitationCode || 'N/A'
      });

      // Set Wallets from Database Response
      setDigitalWallets(data.digitalWallets || []);
      setBankWallets(data.bankWallets || []);

      // Update global balance
      window.dispatchEvent(new CustomEvent('balanceUpdate', {
        detail: { newBalance: data.balance }
      }));

    } catch (error) {
      console.error("Error loading profile:", error);
      if (isMounted.current && error.response && error.response.status === 401) {
        AuthService.logout();
        window.location.reload();
      }
    }
  }, [currentUser]);

  // --- FETCH DATA ON MOUNT ---
  useEffect(() => {
    if (!currentUser) {
      props.history.push("/login");
      return;
    }
    loadProfileData();
  }, []);

  // --- HANDLERS ---
  const handleLogout = () => {
    AuthService.logout();
    props.history.push("/login");
  };

  // Recharge Handler
  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert("Please enter a valid recharge amount");
      return;
    }

    try {
      await RechargeService.createRecharge(parseFloat(rechargeAmount));
      if (!isMounted.current) return;
      alert("Recharge request submitted successfully! Please wait for admin approval.");
      setShowRechargeModal(false);
      setRechargeAmount('');
      loadProfileData();
    } catch (error) {
      if (!isMounted.current) return;
      alert("Failed to submit recharge request: " + (error.response?.data?.message || error.message));
    }
  };

  // Withdrawal Handler
  // Updated Withdrawal Handler
  const handleWithdrawal = async () => {
    // ✅ Basic validation
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert("Please enter a valid withdrawal amount");
      return;
    }

    if (!selectedWallet) {
      alert("Please select a wallet");
      return;
    }

    if (!fundPassword) {
      alert("Please enter your fund password");
      return;
    }

    try {
      // ✅ Parse selected wallet safely
      let walletData;
      try {
        walletData = JSON.parse(selectedWallet);
      } catch {
        alert("Invalid wallet selection");
        return;
      }

      const { type: walletType, id: walletId } = walletData;

      // ✅ Locate wallet
      const selectedWalletObj =
        walletType === 'digital'
          ? digitalWallets.find(w => w._id === walletId)
          : bankWallets.find(w => w._id === walletId);

      if (!selectedWalletObj) {
        alert("Selected wallet not found");
        return;
      }

      // ✅ Build walletDetails based on wallet type
      let walletDetails = {};

      if (walletType === 'digital') {
        walletDetails = {
          currency: selectedWalletObj.currency || 'Bitcoin',
          classification: selectedWalletObj.classification || 'Cryptocurrency',
          address: selectedWalletObj.address || ''
        };

        // Validate required fields for digital wallet
        if (!walletDetails.currency || !walletDetails.address) {
          alert("Please ensure wallet has currency and address");
          return;
        }
      } else {
        walletDetails = {
          holderName: selectedWalletObj.holderName || '',
          bankName: selectedWalletObj.bankName || '',
          accountNo: selectedWalletObj.accountNo || '',
          ifscCode: selectedWalletObj.ifscCode || ''
        };

        // Validate required fields for bank wallet
        if (!walletDetails.accountNo || !walletDetails.ifscCode) {
          alert("Please ensure bank account has account number and IFSC code");
          return;
        }
      }

      // ✅ Create the CORRECT payload based on backend requirements
      // Backend expects: amount, walletType, walletDetails, fundPassword
      // userId comes from req.userId (JWT token)
      const payload = {
        amount: parseFloat(withdrawalAmount),
        walletType: walletType,
        walletDetails: walletDetails,
        fundPassword: fundPassword,
        // Optional: withdrawalChannel (if your backend uses it)
        withdrawalChannel: withdrawalChannel || 'Channel 01'
      };

      console.log("📤 Sending withdrawal payload:", JSON.stringify(payload, null, 2));
      console.log("Note: userId should come from JWT token in auth header");

      // ✅ API call
      const response = await WithdrawalService.createWithdrawal(payload);

      if (!isMounted.current) return;

      console.log("✅ Withdrawal successful:", response.data);

      alert("Withdrawal request submitted successfully! Please wait for admin approval.");

      // ✅ Reset form
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setSelectedWallet('');
      setFundPassword('');
      setWithdrawalChannel('Channel 01');

      // ✅ Reload profile data
      await loadProfileData();

    } catch (error) {
      if (!isMounted.current) return;

      console.error("❌ Withdrawal error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 400) {
        if (error.response?.data?.message === "All fields are required for withdrawal") {
          // This means req.userId is undefined in backend
          alert("Authentication error. Please check if your token is valid. User ID not found in request.");
          // Try to refresh token or logout
          AuthService.logout();
          props.history.push("/login");
        } else {
          alert(error.response?.data?.message || "Validation failed");
        }
      } else {
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    }
  };



  const handleGenderSelect = async (selectedGender) => {
    setUserData(prev => ({ ...prev, gender: selectedGender }));
    setShowGenderModal(false);

    try {
      await ProfileService.updateProfile({
        gender: selectedGender,
        signature: userData.signature
      });
    } catch (error) {
      console.error("Failed to save gender", error);
      alert("Failed to update gender. Please try again.");
    }
  };

  // Signature Update Handler
  const handleSignatureUpdate = async () => {
    if (!newSignature.trim()) {
      alert("Signature cannot be empty");
      return;
    }

    try {
      await ProfileService.updateProfile({
        gender: userData.gender,
        signature: newSignature
      });
      if (!isMounted.current) return;
      setUserData(prev => ({ ...prev, signature: newSignature }));
      setShowSignatureModal(false);
      setNewSignature('');
    } catch (error) {
      console.error("Failed to update signature", error);
      alert("Failed to update signature");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // --- WALLET CRUD HANDLERS ---
  const openAddWalletModal = (type) => {
    setWalletModalType(type);
    setIsEditing(false);
    setDigitalForm({ currency: '', classification: '', address: '', comment: '' });
    setBankForm({ holderName: '', bankName: '', accountNo: '', ifscCode: '' });
    setShowWalletModal(true);
  };

  const openEditWalletModal = (type, wallet) => {
    setWalletModalType(type);
    setIsEditing(true);
    setCurrentWalletId(wallet._id || wallet.id);

    if (type === 'digital') {
      setDigitalForm({
        currency: wallet.currency,
        classification: wallet.classification,
        address: wallet.address,
        comment: wallet.comment
      });
    } else {
      setBankForm({
        holderName: wallet.holderName,
        bankName: wallet.bankName,
        accountNo: wallet.accountNo,
        ifscCode: wallet.ifscCode
      });
    }
    setShowWalletModal(true);
  };

  const initiateDelete = (type, id) => {
    setDeleteTarget({ type, id });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await ProfileService.updateWallet({
        [deleteTarget.type === 'digital' ? 'digitalWallets' : 'bankWallets']:
          deleteTarget.type === 'digital'
            ? digitalWallets.filter(w => w._id !== deleteTarget.id)
            : bankWallets.filter(w => w._id !== deleteTarget.id)
      });
      if (!isMounted.current) return;
      loadProfileData();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting wallet:", error);
      alert("Failed to delete wallet. Please try again.");
      if (isMounted.current) setShowDeleteModal(false);
    }
  };

  const handleWalletSubmit = async () => {
    if (walletModalType === 'digital') {
      if (!digitalForm.currency || !digitalForm.address) return alert("Please fill required fields");
    } else {
      if (!bankForm.accountNo) return alert("Account Number is required");
      if (!bankForm.ifscCode) return alert("IFSC Code is required");
      if (!bankForm.holderName || !bankForm.bankName) return alert("Please fill all fields");
    }

    try {
      const walletData = walletModalType === 'digital' ? digitalForm : bankForm;

      if (isEditing) {
        // Update wallet in the list
        const updatedWallets = walletModalType === 'digital'
          ? digitalWallets.map(w => w._id === currentWalletId ? { ...w, ...walletData } : w)
          : bankWallets.map(w => w._id === currentWalletId ? { ...w, ...walletData } : w);

        await ProfileService.updateWallet({
          [walletModalType === 'digital' ? 'digitalWallets' : 'bankWallets']: updatedWallets
        });
      } else {
        // Add new wallet to the list
        const newWallet = { ...walletData, _id: Date.now().toString() };
        const updatedWallets = walletModalType === 'digital'
          ? [...digitalWallets, newWallet]
          : [...bankWallets, newWallet];

        await ProfileService.updateWallet({
          [walletModalType === 'digital' ? 'digitalWallets' : 'bankWallets']: updatedWallets
        });
      }

      if (!isMounted.current) return;
      loadProfileData();
      setShowWalletModal(false);
    } catch (error) {
      console.error("Wallet operation failed:", error);
      alert("Failed to save wallet. Please try again.");
    }
  };

  // --- RENDER HELPERS ---
  const WalletRow = ({ label, value, showCopy }) => (
    <div className="d-flex align-items-center mb-2" style={{ fontSize: '14px' }}>
      <div style={{ minWidth: '100px', color: '#848e9c', fontWeight: 'bold' }}>{label}</div>
      <div className="text-truncate flex-grow-1" style={{ color: 'white', marginRight: '10px' }}>{value}</div>
      {showCopy && (
        <div
          style={{ color: '#f6465d', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          onClick={() => copyToClipboard(value)}
        >
          Copy
        </div>
      )}
    </div>
  );

  const menuItems = [
    { name: "Personal Info", icon: "👤", action: () => setCurrentView('personalInfo') },
    { name: "My Wallet", icon: "💳", action: () => setCurrentView('myWallet') },
    { name: "Security Settings", icon: "🔒", action: () => props.history.push("/security") },
    { name: "Platform Wallet", icon: "📱" },
    { name: "Site Notification", icon: "🔔" },
    { name: "Site Messages", icon: "💬", action: () => props.history.push("/messages") },
    { name: "About Company", icon: "ℹ️" },
  ];

  const renderMainProfile = () => (
    <div className="profile-container">
      <AppHeader />
      <Container className="mt-4">
        <Row className="justify-content-center">
          <Col md={12} lg={8}>
            <div className="page-header mb-3">
              <div className="header-title">Profile</div>
            </div>

            <div className="profile-info-card">
              <div className="user-details">
                <div className="avatar-wrapper"><div className="avatar">{userData.avatar}</div></div>
                <div className="info-text">
                  <p>UserName: <span>{userData.username}</span></p>
                  <p>Real Balance: <span>${userData.balance}</span> <span className="copy-btn" onClick={() => copyToClipboard(userData.balance)}>Copy</span></p>
                  <p>Status: <span className={userData.frozen === 'Frozen' ? 'text-danger fw-bold' : 'text-success'}>{userData.frozen === 'Frozen' ? '❄️ Frozen' : '✅ Active'}</span></p>
                  <p>Credit Score: <span>{userData.score}</span></p>
                </div>
                <div className="eye-icon">👁️</div>
              </div>
              <Row className="mt-3">
                <Col>
                  <Button
                    className="w-100 btn-recharge"
                    onClick={() => setShowRechargeModal(true)}
                    disabled={userData.frozen === 'Frozen'}
                    style={userData.frozen === 'Frozen' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Recharge
                  </Button>
                </Col>
                <Col>
                  <Button
                    className="w-100 btn-withdraw"
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={userData.frozen === 'Frozen'}
                    style={userData.frozen === 'Frozen' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Withdraw
                  </Button>
                </Col>
              </Row>
            </div>

            <div className="profile-menu mt-3">
              {menuItems.map((item, index) => (
                <div className="menu-item" key={index} onClick={item.action || null}>
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-name">{item.name}</span>
                  <span className="menu-arrow">›</span>
                </div>
              ))}
            </div>

            <div className="logout-wrapper mt-4 mb-5">
              <Button className="w-100 btn-logout" onClick={handleLogout}>Logout</Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* RECHARGE MODAL */}
      <Modal show={showRechargeModal} onHide={() => setShowRechargeModal(false)} centered className="dark-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#1e2329', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <Modal.Title>Recharge Account</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#131821', color: 'white' }}>
          <Form.Group>
            <Form.Label>Recharge Amount (USD)</Form.Label>
            <Form.Control
              type="number"
              style={{ backgroundColor: 'white', color: 'black' }}
              placeholder="Enter amount"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
            />
          </Form.Group>
          <div className="mt-3 p-3" style={{ backgroundColor: '#2a2e39', borderRadius: '5px' }}>
            <small className="text-warning">
              💡 Please contact teacher to get the latest channels for recharging.
              Thank you for your support and trust.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#131821', borderTop: '1px solid #2a2e39' }}>
          <Button variant="secondary" onClick={() => setShowRechargeModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleRecharge}>Submit Recharge</Button>
        </Modal.Footer>
      </Modal>

      {/* WITHDRAWAL MODAL */}
      <Modal
        show={showWithdrawalModal}
        onHide={() => setShowWithdrawalModal(false)}
        centered
        className="dark-modal"
      >
        <Modal.Header
          closeButton
          style={{ backgroundColor: '#1e2329', borderBottom: '1px solid #2a2e39', color: 'white' }}
        >
          <Modal.Title>Withdraw Funds</Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: '#131821', color: 'white' }}>
          {/* Withdrawal Amount */}
          <Form.Group>
            <Form.Label>Withdrawal Amount (USD)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              style={{ backgroundColor: 'white', color: 'black' }}
            />
          </Form.Group>

          {/* Withdrawal Channel */}
          <Form.Group className="mt-3">
            <Form.Label>Select Withdrawal Channel</Form.Label>
            <Form.Control
              as="select"
              value={withdrawalChannel}
              onChange={(e) => setWithdrawalChannel(e.target.value)}
              style={{ backgroundColor: 'white', color: 'black' }}
            >
              <option value="Channel 01">Channel 01</option>
              <option value="Channel 02">Channel 02</option>
              <option value="Channel 03">Channel 03</option>
              <option value="Channel 04">Channel 04</option>
              <option value="Channel 05">Channel 05</option>
            </Form.Control>
          </Form.Group>

          {/* Wallet Selection */}
          <Form.Group className="mt-3">
            <Form.Label>Select Wallet</Form.Label>
            <Form.Control
              as="select"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              style={{ backgroundColor: 'white', color: 'black' }}
            >
              <option value="">Select Wallet</option>
              {bankWallets.map(wallet => (
                <option key={wallet._id} value={JSON.stringify({ type: 'bank', id: wallet._id })}>
                  🏦 {wallet.bankName} - {wallet.accountNo}
                </option>
              ))}
              {digitalWallets.map(wallet => (
                <option key={wallet._id} value={JSON.stringify({ type: 'digital', id: wallet._id })}>
                  ₿ {wallet.currency} - {wallet.address ? wallet.address.substring(0, 10) : ''}...
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* Wallet Details Dynamic Fields */}
          {selectedWallet && (() => {
            const walletData = JSON.parse(selectedWallet);
            const walletType = walletData.type;
            const walletId = walletData.id;
            const walletDetails =
              walletType === 'digital'
                ? digitalWallets.find(w => w._id === walletId)
                : bankWallets.find(w => w._id === walletId);

            if (!walletDetails) return null;

            return (
              <>
                {walletType === 'bank' && (
                  <>
                    <Form.Group className="mt-3">
                      <Form.Label>Account Holder Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter account holder name"
                        value={walletDetails.holderName || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                    <Form.Group className="mt-3">
                      <Form.Label>Bank Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Bank Name"
                        value={walletDetails.bankName || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                    <Form.Group className="mt-3">
                      <Form.Label>Account Number</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Account Number"
                        value={walletDetails.accountNo || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                    <Form.Group className="mt-3">
                      <Form.Label>IFSC Code</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="IFSC Code"
                        value={walletDetails.ifscCode || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                  </>
                )}
                {walletType === 'digital' && (
                  <>
                    <Form.Group className="mt-3">
                      <Form.Label>Currency</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Currency"
                        value={walletDetails.currency || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                    <Form.Group className="mt-3">
                      <Form.Label>Classification</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Classification"
                        value={walletDetails.classification || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                    <Form.Group className="mt-3">
                      <Form.Label>Wallet Address</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Wallet Address"
                        value={walletDetails.address || ''}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0', color: 'black' }}
                      />
                    </Form.Group>
                  </>
                )}
              </>
            );
          })()}

          {/* Fund Password */}
          <Form.Group className="mt-3">
            <Form.Label>Fund Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter fund password"
              value={fundPassword}
              onChange={(e) => setFundPassword(e.target.value)}
              style={{ backgroundColor: 'white', color: 'black' }}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: '#131821', borderTop: '1px solid #2a2e39' }}>
          <Button variant="secondary" onClick={() => setShowWithdrawalModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleWithdrawal}>Submit Withdrawal</Button>
        </Modal.Footer>
      </Modal>


    </div>
  );

  const renderPersonalInfo = () => (
    <div className="personal-info-wrapper" style={{ minHeight: '100vh', backgroundColor: '#131821', color: 'white' }}>
      <AppHeader />
      <Container className="p-0 mt-3">
        <div className="d-flex align-items-center p-3 shadow-sm mb-3" style={{ backgroundColor: '#0b0e11', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <span className="mr-3" style={{ fontSize: '20px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => setCurrentView('profile')}>❮ Back</span>
          <div className="flex-grow-1 text-center font-weight-bold" style={{ fontSize: '18px' }}>Personal Info</div>
          <div style={{ width: '60px' }}></div>
        </div>
        <div className="mt-2" style={{ borderTop: '1px solid #2a2e39' }}>
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39' }}>
            <div className="d-flex align-items-center"><span style={{ fontSize: '24px' }}>👤</span><span style={{ color: '#fff', marginLeft: '12px', fontWeight: '500', fontSize: '16px' }}>Avatar</span></div>
            <div className="d-flex align-items-center"><div className="avatar-small mr-2" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3ba30', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{userData.avatar}</div><span className="text-muted">›</span></div>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3" onClick={() => setShowGenderModal(true)} style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39', cursor: 'pointer' }}>
            <div className="d-flex align-items-center"><span style={{ fontSize: '24px' }}>⚥</span><span style={{ color: '#fff', marginLeft: '12px', fontWeight: '500', fontSize: '16px' }}>Gender</span></div>
            <div className="d-flex align-items-center"><span style={{ color: '#848e9c', marginRight: '10px' }}>{userData.gender}</span><span className="text-muted">›</span></div>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39' }}>
            <div className="d-flex align-items-center"><span style={{ fontSize: '24px' }}>📝</span><span style={{ color: '#fff', marginLeft: '12px', fontWeight: '500', fontSize: '16px' }}>UserName</span></div>
            <div className="d-flex align-items-center"><span style={{ color: '#848e9c', marginRight: '10px' }}>{userData.username}</span><span className="text-muted">›</span></div>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3"
            onClick={() => { setNewSignature(userData.signature); setShowSignatureModal(true); }}
            style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39', cursor: 'pointer' }}>
            <div className="d-flex align-items-center"><span style={{ fontSize: '24px' }}>✏️</span><span style={{ color: '#fff', marginLeft: '12px', fontWeight: '500', fontSize: '16px' }}>Signature</span></div>
            <div className="d-flex align-items-center"><span style={{ color: '#848e9c', marginRight: '10px' }}>{userData.signature}</span><span className="text-muted">›</span></div>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3" style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39' }}>
            <div className="d-flex align-items-center"><span style={{ fontSize: '24px' }}>🎟️</span><span style={{ color: '#fff', marginLeft: '12px', fontWeight: '500', fontSize: '16px' }}>Invitation Code</span></div>
            <div className="d-flex align-items-center">
              <span style={{ color: '#848e9c', marginRight: '10px' }}>{userData.invitationCode}</span>
              <span className="copy-btn" onClick={() => copyToClipboard(userData.invitationCode)} style={{ fontSize: '12px', padding: '2px 6px' }}>Copy</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );

  const renderMyWalletMenu = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#131821', color: 'white' }}>
      <AppHeader />
      <Container className="p-0 mt-3">
        <div className="d-flex align-items-center p-3 shadow-sm mb-3" style={{ backgroundColor: '#0b0e11', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <span className="mr-3" style={{ fontSize: '20px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => setCurrentView('profile')}>❮ Back</span>
          <div className="flex-grow-1 text-center font-weight-bold" style={{ fontSize: '18px' }}>My Wallet</div>
          <div style={{ width: '60px' }}></div>
        </div>
        <div className="mt-2">
          <div className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39', cursor: 'pointer', padding: '20px', color: 'white', fontSize: '16px' }} onClick={() => setCurrentView('digitalWallet')}>
            <div><span className="mr-3 text-success">₿</span> Digital Wallet</div><span>›</span>
          </div>
          <div className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#131821', borderBottom: '1px solid #2a2e39', cursor: 'pointer', padding: '20px', color: 'white', fontSize: '16px' }} onClick={() => setCurrentView('bankWallet')}>
            <div><span className="mr-3 text-warning">🏦</span> Bank Wallet</div><span>›</span>
          </div>
        </div>
      </Container>
    </div>
  );

  const renderDigitalWalletList = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#131821', color: 'white' }}>
      <AppHeader />
      <Container className="p-0 mt-3">
        <div className="d-flex align-items-center justify-content-between p-3 shadow-sm mb-3" style={{ backgroundColor: '#0b0e11', borderBottom: '1px solid #2a2e39' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => setCurrentView('myWallet')}>❮</span>
          <div className="font-weight-bold" style={{ fontSize: '18px' }}>Digital Wallet</div>
          <span style={{ fontSize: '24px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => openAddWalletModal('digital')}>+</span>
        </div>
        {digitalWallets.length === 0 && (
          <div className="text-center mt-5 text-muted p-4">
            No digital wallets added yet.
            <div className="mt-2">
              <Button variant="success" onClick={() => openAddWalletModal('digital')}>
                Add Your First Wallet
              </Button>
            </div>
          </div>
        )}

        {digitalWallets.map(wallet => (
          <Card key={wallet._id || wallet.id} className="m-3 p-3" style={{ backgroundColor: '#1e2329', border: 'none', color: 'white', borderRadius: '10px' }}>
            <WalletRow label="Currency" value={`${wallet.currency}/${wallet.classification}`} />
            <WalletRow label="Address" value={wallet.address} showCopy />
            <WalletRow label="Comment" value={wallet.comment} />
            <div className="d-flex mt-3" style={{ gap: '15px' }}>
              <Button className="flex-fill" style={{ backgroundColor: '#5c8a00', border: 'none' }} onClick={() => openEditWalletModal('digital', wallet)}>Modify</Button>
              <Button className="flex-fill" style={{ backgroundColor: '#e74c3c', border: 'none' }} onClick={() => initiateDelete('digital', wallet._id || wallet.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </Container>
    </div>
  );

  const renderBankWalletList = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#131821', color: 'white' }}>
      <AppHeader />
      <Container className="p-0 mt-3">
        <div className="d-flex align-items-center justify-content-between p-3 shadow-sm mb-3" style={{ backgroundColor: '#0b0e11', borderBottom: '1px solid #2a2e39' }}>
          <span style={{ fontSize: '20px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => setCurrentView('myWallet')}>❮</span>
          <div className="font-weight-bold" style={{ fontSize: '18px' }}>Bank Wallet</div>
          <span style={{ fontSize: '24px', cursor: 'pointer', color: '#0ecb81' }} onClick={() => openAddWalletModal('bank')}>+</span>
        </div>
        {bankWallets.length === 0 && (
          <div className="text-center mt-5 text-muted p-4">
            No bank accounts added yet.
            <div className="mt-2">
              <Button variant="success" onClick={() => openAddWalletModal('bank')}>
                Add Your First Bank Account
              </Button>
            </div>
          </div>
        )}

        {bankWallets.map(wallet => (
          <Card key={wallet._id || wallet.id} className="m-3 p-3" style={{ backgroundColor: '#1e2329', border: 'none', color: 'white', borderRadius: '10px' }}>
            <WalletRow label="Holder" value={wallet.holderName} showCopy />
            <WalletRow label="Bank Name" value={wallet.bankName} showCopy />
            <WalletRow label="A/C No" value={wallet.accountNo} showCopy />
            <WalletRow label="IFSC Code" value={wallet.ifscCode} showCopy />
            <div className="d-flex mt-3" style={{ gap: '15px' }}>
              <Button className="flex-fill" style={{ backgroundColor: '#5c8a00', border: 'none' }} onClick={() => openEditWalletModal('bank', wallet)}>Modify</Button>
              <Button className="flex-fill" style={{ backgroundColor: '#e74c3c', border: 'none' }} onClick={() => initiateDelete('bank', wallet._id || wallet.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </Container>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <>
      {currentView === 'profile' && renderMainProfile()}
      {currentView === 'personalInfo' && renderPersonalInfo()}
      {currentView === 'myWallet' && renderMyWalletMenu()}
      {currentView === 'digitalWallet' && renderDigitalWalletList()}
      {currentView === 'bankWallet' && renderBankWalletList()}

      {/* GENDER MODAL */}
      <Modal show={showGenderModal} onHide={() => setShowGenderModal(false)} centered size="sm" className="dark-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#1e2329', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <Modal.Title style={{ fontSize: '16px' }}>Select Gender</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#131821', padding: '0' }}>
          <ListGroup variant="flush">
            <ListGroup.Item action onClick={() => handleGenderSelect('Male')} style={{ backgroundColor: '#131821', color: 'white', borderBottom: '1px solid #2a2e39' }}>👨 Male</ListGroup.Item>
            <ListGroup.Item action onClick={() => handleGenderSelect('Female')} style={{ backgroundColor: '#131821', color: 'white' }}>👩 Female</ListGroup.Item>
          </ListGroup>
        </Modal.Body>
      </Modal>

      {/* SIGNATURE MODAL */}
      <Modal show={showSignatureModal} onHide={() => setShowSignatureModal(false)} centered className="dark-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#1e2329', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <Modal.Title>Update Signature</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#131821', color: 'white' }}>
          <Form.Group>
            <Form.Label>Your Signature</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              style={{ backgroundColor: 'white', color: 'black' }}
              value={newSignature}
              onChange={(e) => setNewSignature(e.target.value)}
              placeholder="Enter your signature..."
              maxLength={100}
            />
            <Form.Text className="text-muted">
              {newSignature.length}/100 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#131821', borderTop: '1px solid #2a2e39' }}>
          <Button variant="secondary" onClick={() => setShowSignatureModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleSignatureUpdate}>Save Signature</Button>
        </Modal.Footer>
      </Modal>

      {/* WALLET ADD/EDIT MODAL */}
      <Modal show={showWalletModal} onHide={() => setShowWalletModal(false)} centered className="dark-modal">
        <Modal.Header closeButton style={{ backgroundColor: '#1e2329', borderBottom: '1px solid #2a2e39', color: 'white' }}>
          <Modal.Title>{isEditing ? 'Modify' : 'Add'} {walletModalType === 'digital' ? 'Digital' : 'Bank'} Wallet</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#131821', color: 'white' }}>
          {walletModalType === 'digital' ? (
            <Form>
              <Form.Group>
                <Form.Label>Currency *</Form.Label>
                <Form.Control
                  as="select"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  value={digitalForm.currency}
                  onChange={(e) => setDigitalForm({ ...digitalForm, currency: e.target.value, classification: '' })}
                >
                  <option value="">Select Currency</option>
                  {cryptoOptions.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                </Form.Control>
              </Form.Group>
              <Form.Group>
                <Form.Label>Classification *</Form.Label>
                <Form.Control
                  as="select"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  value={digitalForm.classification}
                  onChange={(e) => setDigitalForm({ ...digitalForm, classification: e.target.value })}
                  disabled={!digitalForm.currency}
                >
                  <option value="">Select Classification</option>
                  {digitalForm.currency && cryptoOptions.find(c => c.code === digitalForm.currency)?.classifications.map(cl => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group>
                <Form.Label>Address *</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter Wallet Address"
                  value={digitalForm.address}
                  onChange={(e) => setDigitalForm({ ...digitalForm, address: e.target.value })}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Comment</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter Comment (Optional)"
                  value={digitalForm.comment}
                  onChange={(e) => setDigitalForm({ ...digitalForm, comment: e.target.value })}
                />
              </Form.Group>
            </Form>
          ) : (
            <Form>
              <Form.Group>
                <Form.Label>Holder's Name *</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter Name"
                  value={bankForm.holderName}
                  onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Bank Name *</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter Bank Name"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Account No *</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter Account Number"
                  value={bankForm.accountNo}
                  onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>IFSC Code *</Form.Label>
                <Form.Control
                  type="text"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  placeholder="Enter IFSC Code"
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#131821', borderTop: '1px solid #2a2e39' }}>
          <Button variant="secondary" onClick={() => setShowWalletModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleWalletSubmit}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm" className="hint-modal">
        <Modal.Body className="p-4" style={{ backgroundColor: 'white', borderRadius: '5px' }}>
          <h5 className="font-weight-bold mb-3" style={{ color: 'black' }}>Confirm Delete</h5>
          <p className="text-dark mb-4">Are you sure you want to delete this wallet? This action cannot be undone.</p>
          <div className="d-flex justify-content-between" style={{ gap: '10px' }}>
            <Button className="flex-fill" style={{ backgroundColor: '#6c757d', border: 'none' }} onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button className="flex-fill" style={{ backgroundColor: '#e74c3c', border: 'none' }} onClick={confirmDelete}>Delete</Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Profile;