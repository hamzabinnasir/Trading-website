// src/components/AppHeader.js

import React from "react";
import { withRouter } from "react-router-dom";
import { Button, Navbar, Nav, Container } from "react-bootstrap";
import { Logo } from "../img";
import { AuthService } from "../services";
import './AppHeader.css';

class AppHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: 'User'
        };
    }

    componentDidMount() {
        this.fetchUserData();
    }

    // UPDATED: Removed balance related code
    fetchUserData = () => {
        const currentUser = AuthService.getCurrentUser();
        console.log("Header - Current User:", currentUser); // Debug
        
        if (currentUser) {
            this.setState({ username: currentUser.username });
        }
    };

    handleLogout = (e) => {
        e.preventDefault();
        AuthService.logout();
        this.props.history.push("/login");
    };

    isActive = (path) => {
        return this.props.location.pathname === path ? 'active' : '';
    };

    // Market button click handler - redirect to BTC trading page
    handleMarketClick = (e) => {
        e.preventDefault();
        this.props.history.push('/coin/btc');
    };

    render() {
        const { username } = this.state;
        const currentPath = this.props.location.pathname;

        // Determine page title based on current route
        let pageTitle = "Home";
        if (currentPath.includes('/coin/')) {
            pageTitle = "Market";
        } else if (currentPath === '/orders') {
            pageTitle = "Order";
        } else if (currentPath === '/asset') {
            pageTitle = "Asset";
        } else if (currentPath === '/profile') {
            pageTitle = "Profile";
        }

        return (
            <>
                {/* ==========================
                    DESKTOP NAVBAR (Hidden on Mobile)
                   ========================== */}
                <div className="desktop-nav-wrapper">
                    <Navbar collapseOnSelect expand="lg" className="z-100" id="navbar" variant="dark" style={{ backgroundColor: '#0b0e11', borderBottom: '1px solid #2a2e39' }}>
                        <Container fluid>
                            <Navbar.Brand href="/">
                                <img src={Logo} alt="SuperCoin" style={{ height: '40px' }} />
                            </Navbar.Brand>
                            <Navbar.Toggle aria-controls="responsive-navbar-nav" style={{ border: '1px solid #444' }} />
                            <Navbar.Collapse id="responsive-navbar-nav">
                                <Nav className="mr-auto w-100 align-items-center">
                                    <Button href="/dashboard" className="nav-custom-btn" variant="primary">Dashboard</Button>
                                    <Button href="/orders" className="nav-custom-btn" variant="primary">Order</Button>
                                    {/* Market button for desktop */}
                                    <Button href="/coin/btc" className="nav-custom-btn" variant="primary">Market</Button>
                                    <Button href="/asset" className="nav-custom-btn" variant="primary">Asset</Button>
                                    <Button href="/profile" className="nav-custom-btn" variant="primary">Profile</Button>
                                </Nav>
                                <Nav className="align-items-center mt-3 mt-lg-0">
                                    <Navbar.Text className="text-light mr-3">Welcome, <b>{username}</b></Navbar.Text>
                                    <Button className="nav-custom-btn btn-danger" onClick={this.handleLogout} variant="danger">Logout</Button>
                                </Nav>
                            </Navbar.Collapse>
                        </Container>
                    </Navbar>
                </div>

                {/* ==========================
                    MOBILE TOP BAR (Only visible on Mobile)
                   ========================== */}
                <div className="mobile-top-header">
                    <div className="user-info">
                        <div className="avatar-circle">{username.charAt(0).toUpperCase()}</div>
                        <span className="username-text">{username}</span>
                    </div>
                    <div className="page-title">{pageTitle}</div>
                    {/* REMOVED: Balance info from mobile header */}
                    <div className="balance-info" style={{ visibility: 'hidden' }}>
                        {/* Empty space for alignment */}
                    </div>
                </div>

                {/* ==========================
                    MOBILE BOTTOM NAVIGATION (Fixed Footer)
                   ========================== */}
                <div className="mobile-bottom-nav">

                    <a href="/dashboard" className={`nav-item ${this.isActive('/dashboard')}`}>
                        <div className="nav-icon">🏠</div>
                        <span className="nav-label">Home</span>
                    </a>

                    <a href="/orders" className={`nav-item ${this.isActive('/orders')}`}>
                        <div className="nav-icon">📄</div>
                        <span className="nav-label">Order</span>
                    </a>

                    {/* Market button - direct to BTC trading page */}
                    <a href="/coin/btc" className={`nav-item ${currentPath.includes('/coin/') ? 'active' : ''}`}>
                        <div className="nav-icon">📊</div>
                        <span className="nav-label">Market</span>
                    </a>

                    <a href="/asset" className={`nav-item ${this.isActive('/asset')}`}>
                        <div className="nav-icon">💼</div>
                        <span className="nav-label">Asset</span>
                    </a>

                    <a href="/profile" className={`nav-item ${this.isActive('/profile')}`}>
                        <div className="nav-icon">👤</div>
                        <span className="nav-label">Profile</span>
                    </a>

                </div>
            </>
        );
    }
}

export default withRouter(AppHeader);