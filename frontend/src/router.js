// src/router.js - UPDATED VERSION
import React from "react";
import { Route, Switch, BrowserRouter as Router, Redirect } from "react-router-dom";
import { LandingPage, Login, Register, Dashboard, About, Coin, Asset, Orders, Profile, AdminDashboard, RechargePage, WithdrawalPage, SecuritySettings, SiteMessages, RequestAccess } from "./pages";

// Simple Admin Route (Temporary for testing)
const AdminRoute = ({ component: Component, ...rest }) => {
  console.log('🔐 AdminRoute checking...');

  // Simple check - just see if adminUser exists
  const adminUser = localStorage.getItem('adminUser');
  console.log('📦 Admin user in localStorage:', adminUser);

  const isAuthenticated = !!adminUser;
  console.log('✅ Is admin authenticated:', isAuthenticated);

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Debug component to test routing
const DebugRoute = ({ path, component: Component, ...rest }) => {
  console.log(`🔄 Route accessed: ${path}`);
  return <Route path={path} component={Component} {...rest} />;
};

// export the router
const RouterComp = () => (
  <Router>
    <Switch>
      <DebugRoute exact path="/" component={LandingPage} />
      <DebugRoute path="/login" component={Login} />
      <DebugRoute path="/register" component={Register} />

      <DebugRoute path="/dashboard" component={Dashboard} />
      <DebugRoute path="/about" component={About} />
      <DebugRoute path="/asset" component={Asset} />
      <DebugRoute path="/orders" component={Orders} />
      <DebugRoute path="/profile" component={Profile} />
      <DebugRoute path="/recharge" component={RechargePage} />
      <DebugRoute path="/withdrawal" component={WithdrawalPage} />
      <DebugRoute path="/security-settings" component={SecuritySettings} />
      <DebugRoute path="/site-messages" component={SiteMessages} />

      {/* ✅ ADMIN ROUTE - With debug */}
      <Route
        path="/admin/dashboard"
        render={(props) => {
          console.log('🎯 /admin/dashboard route triggered');
          const adminUser = localStorage.getItem('adminUser');
          console.log('🔐 Admin check:', adminUser);

          if (adminUser) {
            console.log('✅ Rendering AdminDashboard');
            return <AdminDashboard {...props} />;
          } else {
            console.log('❌ Redirecting to login');
            return <Redirect to="/login" />;
          }
        }}
      />

      {/* Dynamic Route sabse last mein rahega */}
      <DebugRoute path="/:coin" component={Coin} />
    </Switch>
  </Router>
);

export default RouterComp;