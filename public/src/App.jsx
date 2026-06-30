import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamilyData } from './context/FamilyContext';

import PhoneLayout from './components/PhoneLayout';
import LoginLayout from './components/LoginLayout';

import Login from './pages/Login';
import Home from './pages/Home';
import Alert from './pages/Alert';
import LiveMonitor from './pages/LiveMonitor';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useFamilyData();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff7ef' }}>
        <p style={{ color: '#ff5f6d', fontWeight: 'bold' }}>Loading CareConnect...</p>
      </div>
    );
  }
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <FamilyProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginLayout><Login /></LoginLayout>} />

          <Route element={<ProtectedRoute><PhoneLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/live" element={<LiveMonitor />} />
          </Route>

          <Route path="/alert" element={<ProtectedRoute><Alert /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </FamilyProvider>
  );
}
