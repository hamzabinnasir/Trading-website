// src/pages/Dashboard.js

import React from "react";
import { UserService, ExchangeService, AuthService } from "../services";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Card,
} from "react-bootstrap";
import {
  BTC_logo,
  ETH_logo,
  USDT_logo,
  XRP_logo,
  BCH_logo,
  BSV_logo,
  LTC_logo,
  BNB_logo,
  EOS_logo,
  XTZ_logo,
  ETC_logo,
  BTS_logo,
} from "../img";

import AppHeader from "../components/AppHeader";
import "./Dashboard.css";

export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.getBalance = this.getBalance.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleBalanceUpdate = this.handleBalanceUpdate.bind(this);
    this.updateGlobalBalance = this.updateGlobalBalance.bind(this);
    this.clearCachedData = this.clearCachedData.bind(this);

    this.state = {
      currentUser: AuthService.getCurrentUser(),
      userValue: "0.00",
      currentUSD: "0.00",
      portfolio: [],
      prices: new Map(),
      message: "",
      loading: true,
    };
  }

  // ✅ NEW: Clear cached data method
  clearCachedData() {
    return new Promise((resolve) => {
      // Clear any service worker caches if used
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      resolve();
    });
  }

  // ✅ UPDATED FIXED: Added authentication verification on component mount
  async componentDidMount() {
    console.log("🔍 Dashboard mounted - Checking authentication...");

    try {
      // ✅ Clear any cached data first
      await this.clearCachedData();

      // ✅ FIX: Check ALL possible user storage locations
      const userStr = localStorage.getItem('user');
      const adminStr = localStorage.getItem('admin'); // Legacy check
      const adminUserStr = localStorage.getItem('adminUser');

      console.log("📦 Storage check:");
      console.log("- user:", userStr ? "Exists" : "Empty");

      // ✅ FIX: If NO user at all, redirect to login
      if (!userStr && !adminStr && !adminUserStr) {
        console.log("❌ No user found in any storage, redirecting to login");
        this.props.history.push("/login");
        return;
      }

      // ✅ FIX: If admin exists but user doesn't, redirect to admin
      if ((adminStr || adminUserStr) && !userStr) {
        console.log("⚠️ Admin user detected on regular dashboard, redirecting to admin...");
        this.props.history.push("/admin/dashboard");
        return;
      }

      // ✅ FIX: Load user data from localStorage directly
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        console.log("✅ Regular user detected:", currentUser.username);

        this.setState({ currentUser }, () => {
          this.getBalance();
          this.getAPIData();
        });
      }

    } catch (error) {
      console.error("❌ Auth verification failed:", error);
      this.props.history.push("/login");
    }

    window.addEventListener("balanceUpdate", this.handleBalanceUpdate);
  }

  componentWillUnmount() {
    window.removeEventListener("balanceUpdate", this.handleBalanceUpdate);
  }

  handleBalanceUpdate(event) {
    console.log("Balance update event received:", event.detail);
    if (event.detail && event.detail.newBalance) {
      this.setState({
        userValue: parseFloat(event.detail.newBalance).toFixed(2),
        currentUSD: parseFloat(event.detail.newBalance).toFixed(2),
        loading: false
      });
    }
  }

  // ✅ FIXED: Updated updateGlobalBalance method
  updateGlobalBalance(newBalance) {
    const fixedBalance = parseFloat(newBalance).toFixed(2);
    this.setState({ currentUSD: fixedBalance });

    // Dispatch balance update event for Dashboard
    const event = new CustomEvent("balanceUpdate", {
      detail: { newBalance: fixedBalance }
    });
    window.dispatchEvent(event);

    // ✅ FIXED: Remove username parameter
    UserService.updateBalance(fixedBalance)
      .then(() => {
        console.log("Balance updated successfully in DB");
      })
      .catch(error => {
        console.error("DB Update Failed:", error);
        this.getBalance(); // Refresh balance from server
      });
  }

  // FIXED: Better balance loading with proper backend integration
  getBalance() {
    console.log("Getting balance from API...");
    // Safety check
    if (!this.state.currentUser) return;

    UserService.getUserBalance()
      .then((response) => {
        let balance = 0;

        if (response.data && response.data.balance !== undefined) {
          balance = parseFloat(response.data.balance);
        } else {
          // If response format is unexpected but contains data
          console.log("Standard balance format not found, attempting fallback", response);
        }

        this.setState({
          userValue: balance.toFixed(2),
          currentUSD: balance.toFixed(2),
          loading: false,
          message: ""
        });

        const event = new CustomEvent("balanceUpdate", {
          detail: { newBalance: balance.toFixed(2) }
        });
        window.dispatchEvent(event);
      })
      .catch((error) => {
        console.error("Balance API Error:", error);
        this.setState({
          userValue: "Error",
          currentUSD: "Error",
          loading: false,
          message: "Failed to load balance"
        });
      });
  }

  getAPIData() {
    var pricesMap = new Map();
    var n = 0;

    const coins = [
      "bitcoin", "ethereum", "tether", "xrp", "bitcoinCash",
      "bitcoinSV", "litecoin", "binancecoin", "eos", "tezos",
      "ethereumClassic", "bitshares",
    ];

    coins.forEach((coin) => {
      ExchangeService.getCurrentPrice(coin).then((response) => {
        let price = parseFloat(response).toFixed(2);
        pricesMap.set(coin, price);
        n++;
        if (n === 12) {
          this.setState({ prices: pricesMap });
        }
      }).catch(() => {
        n++;
        if (n === 12) {
          this.setState({ prices: pricesMap });
        }
      });
    });
  }


  handleLogout(e) {
    e.preventDefault();
    AuthService.logout();
    this.props.history.push("/login");
  }

  // ✅ ADDED: Authentication check in render method
  render() {
    const { currentUser, userValue, prices, loading, message } = this.state;

    // ✅ CRITICAL FIX: If no user, show loading/redirect screen instead of crashing
    if (!currentUser) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#131821',
          color: 'white'
        }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Verifying session...</p>
          </div>
        </div>
      );
    }

    return (
      <Container fluid>
        <AppHeader />

        {/* === INTRO TEXT SECTION === */}
        <Row className="justify-content-center mt-3 mb-3">
          <Col xs={12} md={10} className="text-center">
            <div className="p-4 rounded" style={{ backgroundColor: '#131821', border: '2px solid #2a2e39', color: '#fff' }}>
              <h2 style={{ color: '#f3ba30' }}>Super Coin</h2>
              <p className="text-muted mt-2" style={{ fontSize: '16px', maxWidth: '700px', margin: '0 auto' }}>
                This is a cryptocurrency simulation app designed for practice.
                Experience the real market environment, test your trading strategies,
                and learn how to manage a portfolio without risking real money.
              </p>
            </div>
          </Col>
        </Row>

        <Row style={{ minHeight: "calc(100vh - 250px)", marginBottom: "20px" }}>

          {/* === LEFT COLUMN: TOTAL VALUE CARD === */}
          <Col xs={12} lg={6} className="mb-3">
            <div
              className="rounded w-100 h-100 dashboard-panel d-flex flex-column justify-content-center align-items-center"
              style={{ border: "2px solid #2a2e39", minHeight: '300px', backgroundColor: '#131821' }}
            >
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-2">Loading balance...</p>
                </div>
              ) : (
                <>
                  <h4 className="text-secondary mb-3">Total Balance</h4>
                  <h1 style={{
                    fontSize: '4rem',
                    color: userValue === 'Error' ? '#f6465d' : '#0ecb81',
                    fontWeight: 'bold'
                  }}>
                    {userValue === 'Error' ? 'Error' : `$${userValue}`}
                  </h1>
                  <p className="text-muted">
                    {userValue === 'Error' ? 'Failed to load balance' : 'Available Trading Balance'}
                  </p>

                  {message && (
                    <p className="text-warning small">{message}</p>
                  )}

                  <button
                    className="btn btn-sm btn-outline-secondary mt-2"
                    onClick={this.getBalance}
                  >
                    🔄 Refresh
                  </button>
                </>
              )}
            </div>
          </Col>

          {/* === RIGHT COLUMN: LIVE PRICES LIST === */}
          <Col xs={12} lg={6} className="mb-3">
            <div
              className="rounded w-100 h-100"
              style={{ border: "2px solid #2a2e39" }}
            >
              <Card className="h-100 dashboard-panel">
                <Card.Body style={{ flex: '0 0 auto', padding: '15px' }}>
                  <Card.Title className="text-center dashboard-title mb-0">
                    <h3>Live Market Prices</h3>
                  </Card.Title>
                </Card.Body>

                <ListGroup variant="flush" style={{ overflowY: 'auto', maxHeight: '500px' }}>
                  {[
                    { name: 'BTC/USDT', img: BTC_logo, priceKey: 'bitcoin' },
                    { name: 'ETH/USDT', img: ETH_logo, priceKey: 'ethereum' },
                    { name: 'USDT', img: USDT_logo, priceKey: 'tether' },
                    { name: 'XRP/USDT', img: XRP_logo, priceKey: 'xrp' },
                    { name: 'BCH/USDT', img: BCH_logo, priceKey: 'bitcoinCash' },
                    { name: 'BSV/USDT', img: BSV_logo, priceKey: 'bitcoinSV' },
                    { name: 'LTC/USDT', img: LTC_logo, priceKey: 'litecoin' },
                    { name: 'BNP/USDT', img: BNB_logo, priceKey: 'binancecoin' },
                    { name: 'EOS/USDT', img: EOS_logo, priceKey: 'eos' },
                    { name: 'XTZ/USDT', img: XTZ_logo, priceKey: 'tezos' },
                    { name: 'ETC/USDT', img: ETC_logo, priceKey: 'ethereumClassic' },
                    { name: 'BTS/USDT', img: BTS_logo, priceKey: 'bitshares' },

                  ].map((coin, idx) => (
                    <ListGroup.Item key={idx} className="coin-list-item d-flex justify-content-between align-items-center" style={{ cursor: 'default', backgroundColor: '#131821', borderColor: '#2a2e39', color: 'white', padding: '15px' }}>
                      <div className="d-flex align-items-center">
                        <span className="h5 mr-3 mb-0 text-secondary" style={{ width: '30px' }}>{idx < 9 ? `0${idx + 1}` : idx + 1}</span>
                        <img src={coin.img} alt={coin.code} style={{ width: '24px', height: '24px', marginRight: '10px' }} />
                        <div className="d-flex flex-column">
                          <span className="h6 mb-0">{coin.name}</span>
                          <small className="text-secondary">{coin.code}</small>
                        </div>
                      </div>
                      <div className="h5 mb-0 dashboard-number" style={{ color: prices.get(coin.priceKey) ? '#0ecb81' : 'white' }}>
                        ${prices.get(coin.priceKey) || '0.00'}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}