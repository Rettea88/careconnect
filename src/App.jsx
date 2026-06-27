import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FamilyProvider, useFamilyData } from './context/FamilyContext';

// 引入组件
import PhoneLayout from './components/PhoneLayout';

// 引入页面
import Login from './pages/Login';
import Home from './pages/Home';
import Alert from './pages/Alert';
import LiveMonitor from './pages/LiveMonitor';
import Settings from './pages/Settings';

// 路由守卫
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
          {/* 开放路由：登录与注册 */}
          <Route path="/login" element={<Login />} />

          {/* 📱 带有底部导航栏的页面群组 (Home, Settings, LiveMonitor) */}
          <Route element={<ProtectedRoute><PhoneLayout /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
            {/* 👇 将 LiveMonitor 移到了这里，它就会自动获得底部导航栏 👇 */}
            <Route path="/live" element={<LiveMonitor />} />
          </Route>

          {/* 🚀 独立的全屏页面 (Alert) - 依然无底部导航栏 */}
          <Route path="/alert" element={<ProtectedRoute><Alert /></ProtectedRoute>} />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </FamilyProvider>
  );
}