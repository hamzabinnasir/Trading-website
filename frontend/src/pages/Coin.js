import React from "react";
import TradingViewWidget from "react-tradingview-widget";
import { Container, Row, Col, Button, Form, Modal, Dropdown } from "react-bootstrap";
import {
    BTC_logo, ETH_logo, USDT_logo, XRP_logo, BCH_logo,
    BSV_logo, LTC_logo, BNB_logo, EOS_logo, XTZ_logo
} from "../img";
import { UserService, ExchangeService, AuthService, TradeService } from "../services";
import AppHeader from "../components/AppHeader";
import "./Coin.css";

// Define Coin Map outside component to use in helper functions
const COIN_MAP = [
    { code: 'BTC', name: 'bitcoin', symbol: 'BTCUSDT', img: BTC_logo },
    { code: 'ETH', name: 'ethereum', symbol: 'ETHUSDT', img: ETH_logo },
    { code: 'USDT', name: 'tether', symbol: 'USDTUSDT', img: USDT_logo },
    { code: 'XRP', name: 'xrp', symbol: 'XRPUSDT', img: XRP_logo },
    { code: 'BCH', name: 'bitcoinCash', symbol: 'BCHUSDT', img: BCH_logo },
    { code: 'BSV', name: 'bitcoinSV', symbol: 'BSVUSDT', img: BSV_logo },
    { code: 'LTC', name: 'litecoin', symbol: 'LTCUSDT', img: LTC_logo },
    { code: 'BNB', name: 'binancecoin', symbol: 'BNBUSDT', img: BNB_logo },
    { code: 'EOS', name: 'eos', symbol: 'EOSUSDT', img: EOS_logo },
    { code: 'XTZ', name: 'tezos', symbol: 'XTZUSDT', img: XTZ_logo },
];

export default class Coin extends React.Component {
    constructor(props) {
        super(props);

        this.openTradeModal = this.openTradeModal.bind(this);
        this.submitOrder = this.submitOrder.bind(this);
        this.selectTime = this.selectTime.bind(this);
        this.toggleDrawer = this.toggleDrawer.bind(this);
        this.changeCoin = this.changeCoin.bind(this);
        this.getAPIData = this.getAPIData.bind(this);
        this.fetchPriceFromBinance = this.fetchPriceFromBinance.bind(this);
        this.fetchBinance24hrStats = this.fetchBinance24hrStats.bind(this);
        this.updateGlobalBalance = this.updateGlobalBalance.bind(this);
        this.getBalance = this.getBalance.bind(this);
        this.clearCachedData = this.clearCachedData.bind(this);
        this.getCurrentUserWithValidation = this.getCurrentUserWithValidation.bind(this);
        this.redirectToLogin = this.redirectToLogin.bind(this);

        // Initialize state based on URL param
        const urlParam = this.props.match.params.coin || 'btc';
        const initialCoin = this.getCoinDataFromParam(urlParam);

        this.state = {
            symbol: initialCoin.code.toLowerCase(),
            coin: initialCoin.name,
            currentUser: AuthService.getCurrentUser(),
            price: 0,
            logo: initialCoin.img,

            // Stats
            changeD: 0, high24: 0, low24: 0, vol24: 0, volCoin: 0, priceChange: 0, txCount: 0,

            // Trading
            showTradeModal: false, tradeDirection: '', selectedTime: 30, profitPercent: 20, tradeAmount: '',
            loading: false, tradeResult: null, showResultModal: false,
            currentUSD: 0,

            // Navigation Drawer
            showDrawer: false,
            marketData: [],
            
            // Track last API call time to prevent excessive calls
            lastAPICallTime: 0,
            
            // Track if we've already redirected to prevent loops
            hasRedirected: false
        };
    }

    // Helper to find coin data from URL param (e.g. 'btc' or 'bitcoin')
    getCoinDataFromParam(param) {
        const lowerParam = param.toLowerCase();
        const found = COIN_MAP.find(c => c.code.toLowerCase() === lowerParam) ||
            COIN_MAP.find(c => c.name.toLowerCase() === lowerParam);
        return found || COIN_MAP[0];
    }

    redirectToLogin() {
        if (!this.state.hasRedirected) {
            console.log("🔀 Redirecting to login...");
            this.setState({ hasRedirected: true }, () => {
                this.props.history.push("/login");
            });
        }
    }

    getCurrentUserWithValidation() {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return null;
        if (AuthService.isAdmin()) return null;
        return currentUser;
    }

    clearCachedData() {
        return new Promise((resolve) => {
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

    async componentDidMount() {
        console.log("🔍 Coin component mounted");
        
        if (this.state.coin !== undefined) {
            try {
                await this.clearCachedData();
                
                const currentUser = AuthService.getCurrentUser();
                if (!currentUser) {
                    console.log("❌ No user found on mount, redirecting to login");
                    this.redirectToLogin();
                    return;
                }

                if (AuthService.isAdmin()) {
                    this.props.history.push("/admin/dashboard");
                    return;
                }

                this.setState({ currentUser });

                this.getBalance();
                this.refreshData();
                this.fetchMarketData();

                this.interval = setInterval(() => {
                    const now = Date.now();
                    // Only call APIs if at least 25 seconds have passed since last call
                    if (now - this.state.lastAPICallTime > 25000) {
                        console.log("🔄 Coin: Refreshing data (30s interval)");
                        this.refreshData();
                        this.fetchMarketData();
                        this.setState({ lastAPICallTime: now });
                    }
                }, 30000); 

            } catch (error) {
                console.error("❌ Auth refresh failed:", error);
                this.redirectToLogin();
            }
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.match.params.coin !== prevProps.match.params.coin) {
            const urlParam = this.props.match.params.coin || 'btc';
            const newCoin = this.getCoinDataFromParam(urlParam);

            this.setState({
                symbol: newCoin.code.toLowerCase(),
                coin: newCoin.name,
                logo: newCoin.img,
                lastAPICallTime: Date.now() // Reset timer on coin change
            }, () => {
                this.refreshData();
                this.getBalance();
            });
        }
    }

    componentWillUnmount() { 
        if (this.interval) clearInterval(this.interval); 
    }

    // --- DATA FETCHING ---
    refreshData() {
        this.getAPIData(this.state.coin);
    }

    fetchMarketData() {
        const cacheBuster = `?t=${Date.now()}`;
        fetch(`https://api.binance.com/api/v3/ticker/24hr${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                // Map over COIN_MAP to create the sidebar list
                const filteredData = COIN_MAP.map(myCoin => {
                    // Match the symbol exactly
                    const apiData = data.find(d => d.symbol === myCoin.symbol) || {};
                    return {
                        ...myCoin,
                        price: parseFloat(apiData.lastPrice || 0).toFixed(4),
                        change: parseFloat(apiData.priceChangePercent || 0).toFixed(2)
                    };
                });
                this.setState({ marketData: filteredData });
            })
            .catch(err => console.log("Market Data Error", err));
    }

    getAPIData(coinName) {
        // Fetch specific coin data
        ExchangeService.getCurrentPrice(coinName).then((response) => {
            this.setState({ price: parseFloat(response).toFixed(2) });
        }).catch(err => {
            console.error("Price fetch error:", err);
            this.fetchPriceFromBinance(coinName);
        });

        ExchangeService.getPercentChange(coinName).then((response) => {
            this.setState({ changeD: response.day });
        }).catch(err => {
            this.setState({ changeD: 0 });
        });

        // Fetch detailed stats
        this.fetchBinance24hrStats(coinName);
    }

    fetchPriceFromBinance(coinName) {
        const coinObj = COIN_MAP.find(c => c.name === coinName) || COIN_MAP[0];
        // ✅ STRICT CLEANING: Uppercase, Remove any non-alphanumeric chars (like spaces/newlines)
        const tickerSymbol = coinObj.symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        const cacheBuster = `?t=${Date.now()}`;
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${tickerSymbol}${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                if(data.price) {
                    this.setState({ price: parseFloat(data.price).toFixed(2) });
                }
            })
            .catch(err => {
                console.error("Binance price fallback failed:", err);
                this.setState({ price: "0.00" });
            });
    }

    fetchBinance24hrStats(coinName) {
        const coinObj = COIN_MAP.find(c => c.name === coinName) || COIN_MAP[0];
        // ✅ STRICT CLEANING: Fixes the -1100 Illegal Characters error
        const tickerSymbol = coinObj.symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

        console.log("Fetching Binance Stats for:", tickerSymbol); // Debug log

        const cacheBuster = `?t=${Date.now()}`;
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${tickerSymbol}${cacheBuster}`)
            .then(res => res.json())
            .then(data => {
                // Check if API returned an error
                if (data.code) {
                    console.error("Binance API Error:", data.msg);
                    throw new Error(data.msg);
                }
                
                this.setState({
                    high24: parseFloat(data.highPrice || 0).toFixed(2),
                    low24: parseFloat(data.lowPrice || 0).toFixed(2),
                    vol24: parseFloat(data.quoteVolume || 0).toFixed(2),
                    volCoin: parseFloat(data.volume || 0).toFixed(2),
                    priceChange: parseFloat(data.priceChange || 0).toFixed(2),
                    txCount: parseInt(data.count || 0).toLocaleString(),
                    changeD: parseFloat(data.priceChangePercent || 0).toFixed(2)
                });
            })
            .catch(err => {
                console.error("Binance Stats Fetch Error:", err);
                this.setState({
                    high24: "0.00",
                    low24: "0.00",
                    vol24: "0.00",
                    volCoin: "0.00",
                    priceChange: "0.00",
                    txCount: "0",
                    changeD: "0.00"
                });
            });
    }

    // --- ACTIONS ---
    toggleDrawer() {
        this.setState({ showDrawer: !this.state.showDrawer });
    }

    changeCoin(selectedCoin) {
        this.setState({ 
            showDrawer: false,
            symbol: selectedCoin.code.toLowerCase(),
            coin: selectedCoin.name,
            logo: selectedCoin.img,
            lastAPICallTime: Date.now() // Reset timer
        }, () => {
            this.refreshData();
            this.props.history.push(`/coin/${selectedCoin.code.toLowerCase()}`);
        });
    }

    updateGlobalBalance(newBalance) {
        const fixedBalance = parseFloat(newBalance).toFixed(2);
        this.setState({ currentUSD: fixedBalance });
        
        const event = new CustomEvent("balanceUpdate", { 
            detail: { newBalance: fixedBalance } 
        });
        window.dispatchEvent(event);
        
        UserService.updateBalance(fixedBalance)
            .then(() => {
                console.log("Balance updated successfully in DB");
            })
            .catch(error => {
                console.error("DB Update Failed:", error);
                this.getBalance();
            });
    }

    getBalance() {
        const currentUser = this.state.currentUser;
        if (!currentUser) return;
        
        UserService.getUserBalance().then((response) => {
            let balance = 0;
            if (response.data && response.data.balance !== undefined) {
                balance = parseFloat(response.data.balance);
            } else if (response.data && typeof response.data === 'number') {
                balance = parseFloat(response.data);
            } else if (response.balance !== undefined) {
                balance = parseFloat(response.balance);
            }
            
            this.setState({ currentUSD: balance.toFixed(2) });
        }).catch(err => {
            this.setState({ currentUSD: "Error" });
        });
    }

    submitOrder() {
        const currentUser = AuthService.getCurrentUser();
        const { tradeAmount, currentUSD, selectedTime, profitPercent, tradeDirection, symbol } = this.state;
        
        if (!currentUser || !currentUser.id) {
            alert("Session expired or invalid. Please log in again.");
            this.redirectToLogin();
            return;
        }

        if (!tradeAmount || tradeAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        
        const amount = parseFloat(tradeAmount);
        const balance = parseFloat(currentUSD);
        
        if (amount > balance) {
            alert("Insufficient balance");
            return;
        }
        
        if (amount < 1) {
            alert("Minimum trade amount is $1");
            return;
        }

        // Optimistic balance update
        const newBalance = balance - amount;
        this.updateGlobalBalance(newBalance);
        this.setState({ showTradeModal: false, loading: true });

        const profitAmount = amount * (profitPercent / 100);
        const result_payout = amount + profitAmount;

        const tradeData = {
            userId: currentUser.id,
            currency: symbol.toUpperCase() + "/USDT",
            orderAmount: amount,
            direction: tradeDirection === 'up' ? 'Buy Up' : 'Buy Down',
            billingTime: selectedTime.toString(),
            result_payout: result_payout,
            status: 'pending'
        };

        console.log("Submitting trade:", tradeData);

        TradeService.createTrade(tradeData)
            .then(response => {
                this.setState({ loading: false });
                
                console.log("Trade created, redirecting to orders...");
                
                // ✅ FIXED: Increased timeout slightly to ensure state settles before redirect
                setTimeout(() => {
                    this.props.history.push({ 
                        pathname: "/orders", 
                        state: { defaultTab: 'Pending' } 
                    });
                }, 500);
            })
            .catch(error => {
                console.error("Trade failed:", error);
                
                let errorMessage = "Failed to create trade. ";
                if (error.response) {
                    errorMessage += error.response.data.message || 'Server Error';
                } else {
                    errorMessage += error.message;
                }
                
                alert(errorMessage);
                this.setState({ loading: false });
                
                // Revert balance
                this.updateGlobalBalance(balance);
            });
    }

    openTradeModal(direction) {
        if (!this.state.currentUser) {
            alert("Please log in to place trades");
            this.redirectToLogin();
            return;
        }

        this.getBalance(); 
        
        this.setState({
            showTradeModal: true,
            tradeDirection: direction,
            tradeAmount: '',
            selectedTime: 30,
            profitPercent: 20
        });
    }

    selectTime(time, profit) {
        this.setState({
            selectedTime: time,
            profitPercent: profit
        });
    }

    render() {
        // ✅ FIXED: Added 'loading' here to prevent the "not defined" error
        const {
            currentUser, currentUSD, price, symbol, logo,
            showTradeModal, tradeDirection, selectedTime, profitPercent,
            changeD, high24, low24, vol24, volCoin, priceChange, txCount,
            showDrawer, marketData, loading 
        } = this.state;

        if (!currentUser) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#131821', color: 'white' }}>
                    <div className="text-center">
                        <h3>Loading...</h3>
                    </div>
                </div>
            );
        }

        const timeOptions = [
            { time: 30, profit: 20 },
            { time: 60, profit: 30 },
            { time: 120, profit: 40 },
            { time: 180, profit: 50 },
            { time: 240, profit: 60 }
        ];
        const isPositive = changeD >= 0;
        const colorClass = isPositive ? "#0ecb81" : "#f6465d";

        return (
            <Container fluid className="coin-page-container">
                <AppHeader />

                {/* === DESKTOP CURRENCY SELECTOR === */}
                <div className="desktop-currency-selector">
                    <Dropdown>
                        <Dropdown.Toggle variant="dark" id="dropdown-basic" className="currency-dropdown">
                            <img src={logo} alt="logo" style={{ width: '20px', marginRight: '8px' }} />
                            {symbol.toUpperCase()}/USDT
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="currency-dropdown-menu">
                            {COIN_MAP.map((coinItem, index) => (
                                <Dropdown.Item
                                    key={index}
                                    onClick={() => this.changeCoin(coinItem)}
                                    className="currency-dropdown-item"
                                >
                                    <div className="d-flex align-items-center">
                                        <img src={coinItem.img} alt={coinItem.code} style={{ width: '20px', marginRight: '10px' }} />
                                        <span>{coinItem.code}/USDT</span>
                                    </div>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                {/* === SIDE MENU DRAWER === */}
                <div className={`side-menu-overlay ${showDrawer ? 'open' : ''}`} onClick={this.toggleDrawer}></div>
                <div className={`side-menu ${showDrawer ? 'open' : ''}`}>
                    <div className="side-menu-header">Market</div>
                    <div className="side-menu-table-header">
                        <span>Currency</span>
                        <span>Real Price</span>
                        <span>Rise Fall</span>
                    </div>
                    <div className="side-menu-list">
                        {marketData.map((item, index) => (
                            <div key={index} className="side-menu-item" onClick={() => this.changeCoin(item)}>
                                <div className="coin-info">
                                    <img src={item.img} alt={item.code} />
                                    <span className="coin-code">{item.code}/USDT</span>
                                </div>
                                <div className="coin-price" style={{ color: parseFloat(item.change) >= 0 ? '#0ecb81' : '#f6465d' }}>
                                    {item.price}
                                </div>
                                <div className="coin-change">
                                    <span className={`change-box ${parseFloat(item.change) >= 0 ? 'up' : 'down'}`}>
                                        {item.change}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === MOBILE HEADER === */}
                <div className="mobile-top-stats">
                    <div className="mobile-nav-row">
                        <button className="hamburger-btn" onClick={this.toggleDrawer}>☰</button>
                        <div className="mobile-stats-header">
                            <strong>{symbol.toUpperCase()}/USDT</strong>
                        </div>
                        <div style={{ width: '24px' }}></div>
                    </div>

                    <div className="mobile-stats-grid">
                        <div className="mobile-price-col">
                            <div className="mobile-label">Latest Price</div>
                            <div className="mobile-main-price" style={{ color: colorClass }}>${price}</div>
                            <div className="mobile-label mt-1">24H Change</div>
                            <div className="mobile-change-val" style={{ color: colorClass }}>{priceChange} ({changeD}%)</div>
                        </div>

                        <div className="mobile-details-col">
                            <div className="m-stat-row"><span>High</span> <span>{high24}</span></div>
                            <div className="m-stat-row"><span>Low</span> <span>{low24}</span></div>
                            <div className="m-stat-row"><span>Vol(USDT)</span> <span>{Number(vol24).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                            <div className="m-stat-row"><span>Vol({symbol.toUpperCase()})</span> <span>{Number(volCoin).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                            <div className="m-stat-row"><span>Txns</span> <span>{txCount}</span></div>
                        </div>
                    </div>
                </div>

                {/* === MAIN LAYOUT === */}
                <Row className="coin-main-row">
                    <Col lg={8} xs={12} className="chart-col m-0 p-0 pb-2 pl-2 bg-dark">
                        <div className="rounded w-100 chart-wrapper">
                            <TradingViewWidget
                                autosize
                                symbol={"BINANCE:" + symbol.toUpperCase() + "USDT"}
                                interval="D"
                                theme="Dark"
                                locale="en"
                                toolbar_bg="#131821"
                                enable_publishing={false}
                                hide_top_toolbar={false}
                                hide_side_toolbar={false}
                                hide_legend={false}
                                allow_symbol_change={true}
                                save_image={false}
                                container_id="tradingview_widget"
                                style="1"
                            />
                        </div>
                    </Col>

                    <Col lg={4} xs={12} className="desktop-sidebar m-0 p-0 pr-2 pb-2 pl-2">
                        {/* Desktop Sidebar with 5 metrics */}
                        <div className="market-stats-container">
                            <div className="d-flex align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid #2a2e39' }}>
                                <img src={logo} alt="logo" style={{ width: '30px', marginRight: '10px' }} />
                                <h4 className="text-light m-0 font-weight-bold">{symbol.toUpperCase()}/USDT</h4>
                            </div>

                            <div className="market-content-wrapper" style={{ display: 'block' }}>
                                <div className="mb-4">
                                    <div className="text-muted mb-1">Latest Price</div>
                                    <div className="main-price-text" style={{ color: colorClass, fontSize: '32px', lineHeight: '1', fontWeight: 'bold' }}>${price}</div>
                                    <div className="mt-1">
                                        <span className="text-muted">24H Rise Fall </span>
                                        <span style={{ color: colorClass, fontWeight: 'bold' }}>{priceChange} ({changeD}%)</span>
                                    </div>
                                </div>

                                <div className="stats-list">
                                    <div className="d-flex justify-content-between mb-2" style={{ borderBottom: '1px solid #2a2e39', paddingBottom: '5px' }}>
                                        <span className="text-muted">24H Highest Price</span>
                                        <span className="text-light font-weight-bold">{high24}</span>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2" style={{ borderBottom: '1px solid #2a2e39', paddingBottom: '5px' }}>
                                        <span className="text-muted">24H Lowest Price</span>
                                        <span className="text-light font-weight-bold">{low24}</span>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2" style={{ borderBottom: '1px solid #2a2e39', paddingBottom: '5px' }}>
                                        <span className="text-muted">24H Volume(USDT)</span>
                                        <span className="text-light font-weight-bold">{Number(vol24).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2" style={{ borderBottom: '1px solid #2a2e39', paddingBottom: '5px' }}>
                                        <span className="text-muted">24H Volume({symbol.toUpperCase()})</span>
                                        <span className="text-light font-weight-bold">{Number(volCoin).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-muted">24H Transactions</span>
                                        <span className="text-light font-weight-bold">{txCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="trading-section rounded p-3" style={{ backgroundColor: "#131821", border: "2px solid #2a2e39" }}>
                            <div className="text-center mb-4"><h5 className="text-light">Fixed Time Trading</h5></div>
                            <Row>
                                <Col>
                                    <Button
                                        className="w-100 btn-buy-up py-3"
                                        onClick={() => this.openTradeModal('up')}
                                        style={{ fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        🔼 Buy Up
                                    </Button>
                                </Col>
                                <Col>
                                    <Button
                                        className="w-100 btn-buy-down py-3"
                                        onClick={() => this.openTradeModal('down')}
                                        style={{ fontSize: '16px', fontWeight: 'bold' }}
                                    >
                                        🔽 Buy Down
                                    </Button>
                                </Col>
                            </Row>
                        </div>
                    </Col>
                </Row>

                <div className="mobile-trade-footer">
                    <Button className="btn-buy-up" onClick={() => this.openTradeModal('up')}>Buy Up</Button>
                    <Button className="btn-buy-down" onClick={() => this.openTradeModal('down')}>Buy Down</Button>
                </div>

                {/* TRADE MODAL */}
                <Modal show={showTradeModal} onHide={() => this.setState({ showTradeModal: false })} centered className="dark-modal">
                    <Modal.Header closeButton style={{ backgroundColor: '#1e2329', color: 'white', borderBottom: '1px solid #444' }}>
                        <Modal.Title>
                            {tradeDirection === 'up' ?
                                <span className="text-success">Buy Up 🔼</span> :
                                <span className="text-danger">Buy Down 🔽</span>
                            }
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ backgroundColor: '#131821', color: 'white' }}>
                        <p>Balance: <b>${currentUSD}</b></p>
                        <p className="mb-2"><b>Select Time</b></p>
                        <Row className="mb-3">
                            {timeOptions.map((opt) => (
                                <Col key={opt.time} xs={4} className="mb-2">
                                    <div
                                        className={`time-selector-box ${selectedTime === opt.time ? 'active' : ''}`}
                                        onClick={() => this.selectTime(opt.time, opt.profit)}
                                        style={{
                                            padding: '8px',
                                            border: selectedTime === opt.time ? '2px solid #0ecb81' : '1px solid #444',
                                            borderRadius: '5px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            backgroundColor: selectedTime === opt.time ? '#0ecb8120' : 'transparent'
                                        }}
                                    >
                                        <div className="time-text" style={{ fontWeight: 'bold' }}>{opt.time}s</div>
                                        <div className="profit-text" style={{ color: '#0ecb81', fontSize: '12px' }}>{opt.profit}%</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                        <Form.Group>
                            <Form.Label><b>Amount (USDT)</b></Form.Label>
                            <Form.Control
                                type="number"
                                className="custom-input"
                                placeholder="Enter Amount"
                                value={this.state.tradeAmount}
                                onChange={(e) => this.setState({ tradeAmount: e.target.value })}
                                style={{ backgroundColor: '#1e2329', color: 'white', border: '1px solid #444' }}
                            />
                        </Form.Group>
                        <div className="summary-row mt-4 d-flex justify-content-between">
                            <span>{symbol.toUpperCase()}</span>
                            <span>Price: ${price}</span>
                            <span>Profit: {profitPercent}%</span>
                        </div>
                        <Button
                            className="w-100 mt-3 font-weight-bold"
                            onClick={this.submitOrder}
                            style={{
                                backgroundColor: tradeDirection === 'up' ? '#0ecb81' : '#f6465d',
                                border: 'none',
                                padding: '12px',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {loading ? 'Processing...' : 'Submit Order'}
                        </Button>
                    </Modal.Body>
                </Modal>

                <Modal show={this.state.showResultModal} onHide={() => this.setState({ showResultModal: false })} centered>
                    <Modal.Body style={{ backgroundColor: '#131821', color: 'white', textAlign: 'center' }}>
                        <h3>{this.state.tradeResult}</h3>
                        <Button onClick={() => this.setState({ showResultModal: false })} className="mt-3">Close</Button>
                    </Modal.Body>
                </Modal>
            </Container>
        );
    }
}