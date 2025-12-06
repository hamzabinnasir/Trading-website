import React, { useState, useEffect, useCallback } from 'react';
import { Container } from 'react-bootstrap';
import AppHeader from '../components/AppHeader'; 
import { AuthService, TradeService, UserService } from "../services";
import './Orders.css';

const Orders = (props) => {
  // ✅ FIX: Determine tab based on incoming props history state
  const getInitialTab = () => {
      const state = props.location && props.location.state;
      if (state && state.defaultTab) {
          return state.defaultTab;
      }
      return 'Pending';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [allOrders, setAllOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // ✅ FIX: Listen for history state changes to switch tabs automatically
  useEffect(() => {
      if (props.location.state && props.location.state.defaultTab) {
          console.log("📍 Orders Tab Changed:", props.location.state.defaultTab);
          setActiveTab(props.location.state.defaultTab);
      }
  }, [props.location.state]);

  // ✅ FIXED: Memoized function to prevent unnecessary re-renders
  const loadOrdersFromBackend = useCallback(() => {
    const now = Date.now();
    
    // ✅ Prevent API calls if last call was less than 5 seconds ago
    if (now - lastRefreshTime < 5000) {
      return;
    }

    setLoading(true);
    // Use the latest user ID available
    const user = AuthService.getCurrentUser();
    if (!user) return;

    TradeService.getUserTrades(user.id, 'all')
      .then(response => {
        const orders = response.data || [];
        setAllOrders(orders);
        setLastRefreshTime(now);
        checkAndUpdateBalance(orders);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to load orders:", error);
        setAllOrders([]);
        setLoading(false);
      });
  }, [lastRefreshTime]);

  // ✅ FIXED: Memoized balance check function
  const checkAndUpdateBalance = useCallback((orders) => {
    const newlyCompletedTrades = orders.filter(order => 
      order.status === 'Closed' && 
      order.balanceUpdated === false
    );
    
    if (newlyCompletedTrades.length > 0) {
      UserService.getUserBalance()
        .then(response => {
          let balance = 0;
          if (response.data && response.data.balance !== undefined) {
            balance = parseFloat(response.data.balance);
          } else if (response.data && typeof response.data === 'number') {
            balance = parseFloat(response.data);
          }
          
          const event = new CustomEvent("balanceUpdate", { 
            detail: { newBalance: balance.toFixed(2) } 
          });
          window.dispatchEvent(event);
          
          newlyCompletedTrades.forEach(trade => {
            TradeService.markTradeBalanceUpdated(trade._id).catch(console.error);
          });
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    
    if (!user) {
      props.history.push("/login");
      return;
    }

    console.log("🔄 Orders: Initial load");
    loadOrdersFromBackend();

    const normalInterval = setInterval(() => {
      loadOrdersFromBackend();
    }, 15000);

    const fastInterval = setInterval(() => {
      const hasPendingTrades = allOrders.some(order => order.status === 'Pending');
      if (hasPendingTrades) {
        loadOrdersFromBackend();
      }
    }, 5000);

    return () => {
      clearInterval(normalInterval);
      clearInterval(fastInterval);
    };
  }, [props.history, loadOrdersFromBackend, allOrders]);

  const handleManualRefresh = () => {
    setLastRefreshTime(0); // Force refresh
    loadOrdersFromBackend();
  };

  // Fixed: Proper status filtering
  const filteredOrders = allOrders.filter(order => {
    if (activeTab === 'Pending') return order.status === 'Pending';
    if (activeTab === 'Closed') return order.status === 'Closed';
    if (activeTab === 'Cancelled') return order.status === 'Cancelled';
    return false;
  });

  const getRemainingTime = (endTime) => {
    if (!endTime) return "Processing...";
    try {
      const end = new Date(endTime);
      const now = new Date();
      const left = Math.max(0, Math.ceil((end - now) / 1000));
      return left > 0 ? `${left}s` : "Closing...";
    } catch (error) {
      return "Processing...";
    }
  };

  const shouldAutoClose = (order) => {
    if (order.status !== 'Pending') return false;
    try {
      const end = new Date(order.endTime);
      return new Date() >= end;
    } catch (error) {
      return false;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'Closed': return 'Closed';
      case 'Cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const calculateProfit = (order) => {
    if (order.status === 'Closed' && order.result_payout) {
      const orderAmount = parseFloat(order.orderAmount) || 0;
      const resultPayout = parseFloat(order.result_payout) || 0;
      return resultPayout - orderAmount;
    }
    return 0;
  };

  return (
    <div className="orders-container">
      <AppHeader />

      <Container className="mt-0">
        <div className="page-header">
            <div className="header-title">Order History</div>
            <div className="header-filter">
              <button 
                onClick={handleManualRefresh}
                className="refresh-btn"
                style={{
                  background: 'none',
                  border: '1px solid #2a2e39',
                  color: '#848e9c',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
        </div>

        <div className="tabs-header">
            {['Pending', 'Closed', 'Cancelled'].map((tab) => (
            <div 
                key={tab}
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
            >
                {tab}
            </div>
            ))}
        </div>

        <div className="orders-list">
            {loading && filteredOrders.length === 0 ? (
              <div className="empty-state">
                <h4 style={{color: '#848e9c'}}>Loading orders...</h4>
              </div>
            ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
                <h4 style={{color: '#848e9c'}}>No {activeTab} Orders</h4>
            </div>
            ) : (
            filteredOrders.map((item) => {
              const profit = calculateProfit(item);
              const isAutoClose = shouldAutoClose(item);
              
              return (
                <div className="order-card" key={item._id || item.id}>
                <div className="card-row">
                    <span className="label">Currency</span>
                    <span className="value" style={{color: 'white', fontWeight: 'bold'}}>
                      {item.currency || 'BTC/USDT'}
                    </span>
                </div>
                <div className="card-row">
                    <span className="label">Order No.</span>
                    <span className="value small-text">
                      {item.orderNo || item._id} 
                      <span className="copy-btn" onClick={() => copyToClipboard(item.orderNo || item._id)}>COPY</span>
                    </span>
                </div>
                <div className="card-row">
                    <span className="label">Order Amount</span>
                    <span className="value">${parseFloat(item.orderAmount || 0).toFixed(2)}</span>
                </div>
                
                <div className="card-row">
                    <span className="label">
                      {item.status === 'Pending' ? 'Time Left' : 'Profit Amount'}
                    </span>
                    
                    {item.status === 'Pending' ? (
                      <span className="value bold text-warning">
                        {isAutoClose ? (
                          <span style={{color: '#0ecb81'}}>Processing...</span>
                        ) : (
                          getRemainingTime(item.endTime)
                        )}
                      </span>
                    ) : (
                      <span className={`value bold ${profit > 0 ? 'text-green' : profit < 0 ? 'text-red' : ''}`}>
                        {profit > 0 ? '+' : ''}${profit.toFixed(2)}
                      </span>
                    )}
                </div>

                <div className="card-row">
                    <span className="label">Direction</span>
                    <span className={`value ${item.direction === 'Buy Up' ? 'text-green' : 'text-red'}`}>
                    {item.direction || 'Buy Up'}
                    </span>
                </div>
                
                <div className="card-row">
                    <span className="label">Scale</span>
                    <span className="value">{item.scale || '20%'}</span>
                </div>
                
                <div className="card-row">
                    <span className="label">Billing Time</span>
                    <span className="value">{item.billingTime || '30s'}</span>
                </div>

                <div style={{borderTop: '1px solid #2a2e39', margin: '10px 0'}}></div>
                <div className="card-row">
                    <span className="label">Order Time</span>
                    <span className="value small-text">
                      {item.orderTime ? new Date(item.orderTime).toLocaleString() : 'N/A'}
                    </span>
                </div>

                <div className="card-row">
                    <span className="label">Status</span>
                    <span className={`value ${getStatusDisplay(item.status) === 'Pending' ? 'text-warning' : getStatusDisplay(item.status) === 'Closed' ? 'text-green' : 'text-red'}`}>
                      {getStatusDisplay(item.status)}
                      {isAutoClose && " ⏳"}
                    </span>
                </div>
                </div>
              );
            })
            )}
        </div>
      </Container>
    </div>
  );
};

export default Orders;