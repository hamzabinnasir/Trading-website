// frontend/src/pages/Asset.js

import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import AppHeader from '../components/AppHeader'; 
import { FundHistoryService, RechargeService, WithdrawalService, AuthService } from "../services";
import './Asset.css';

const Asset = (props) => {
  const [activeTab, setActiveTab] = useState('Recharges');
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  const tabTitles = ['Recharges', 'Withdraws', 'Funds'];

  // Load data based on active tab
  useEffect(() => {
    if (!currentUser) {
      props.history.push("/login");
      return;
    }
    loadAssetData();
  }, [activeTab, currentUser]);

  const loadAssetData = async () => {
    setLoading(true);
    try {
      let response;
      
      switch (activeTab) {
        case 'Recharges':
          response = await RechargeService.getUserRecharges();
          setAssetData(response.data.map(item => ({
            id: item._id,
            type: 'Recharges',
            amount: item.amount,
            status: item.status,
            time: new Date(item.createdAt).toLocaleString(),
            statusColor: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'orange'
          })));
          break;
        
        case 'Withdraws':
          response = await WithdrawalService.getUserWithdrawals();
          setAssetData(response.data.map(item => ({
            id: item._id,
            type: 'Withdraws',
            amount: item.amount,
            status: item.status,
            time: new Date(item.createdAt).toLocaleString(),
            statusColor: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'orange'
          })));
          break;
        
        case 'Funds':
          response = await FundHistoryService.getUserFundHistory();
          setAssetData(response.data.map(item => ({
            id: item._id,
            type: 'Funds',
            amount: item.amount >= 0 ? `+${item.amount}` : `${item.amount}`,
            fundType: item.type,
            time: new Date(item.createdAt).toLocaleString(),
            statusColor: item.amount >= 0 ? 'red' : 'blue'
          })));
          break;
        
        default:
          setAssetData([]);
      }
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
      setAssetData([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = assetData;

  return (
    <div className="asset-container">
      <AppHeader />

      <Container className="mt-0">
        <div className="page-header">
          <div className="header-title">Asset</div>
          <div className="header-filter">All Records <span className="arrow-down">▼</span></div>
        </div>

        {/* Tabs */}
        <div className="tabs-header">
          {tabTitles.map((tab) => (
            <div 
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* List Content */}
        <div className="asset-list">
          {loading ? (
            <div className="empty-state">
              <h4 style={{color: '#848e9c'}}>Loading...</h4>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <h4 style={{color: '#848e9c'}}>No Records Found</h4>
            </div>
          ) : (
            filteredData.map((item) => (
              <div className="asset-card" key={item.id}>
                {item.type === 'Funds' ? (
                  /* Funds Layout */
                  <>
                    <div className="card-row">
                      <span className="label">Fund Amount</span>
                      <span className={`value fund-amount ${item.amount.startsWith('+') ? 'text-red' : 'text-blue'}`}>
                        {item.amount}
                      </span>
                    </div>
                    <div className="card-row">
                      <span className="label">Fund Type</span>
                      <span className="value text-red">{item.fundType}</span> 
                    </div>
                    <div className="card-row">
                      <span className="label">Fund Time</span>
                      <span className="value text-gray">{item.time}</span>
                    </div>
                  </>
                ) : (
                  /* Recharges/Withdraws Layout */
                  <>
                    <div className="card-row">
                      <span className="label">Amount</span>
                      <span className="value">${item.amount}</span>
                    </div>
                    <div className="card-row">
                      <span className="label">Status</span>
                      <span className={`value status-text ${item.statusColor}`}>
                        {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                      </span>
                    </div>
                    <div className="card-row">
                      <span className="label">Apply Time</span>
                      <span className="value text-gray">{item.time}</span>
                    </div>
                  </>
                )}
                <div className="card-arrow">›</div>
              </div>
            ))
          )}
        </div>
      </Container>
    </div>
  );
};

export default Asset;