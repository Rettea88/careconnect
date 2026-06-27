import React from 'react';
import { Link } from 'react-router-dom';
import { useFamilyData } from '../context/FamilyContext';
import { toastEvent } from '../components/Toast';

export default function Home() {
  const familyState = useFamilyData() || {};
  const user = familyState.user || { userName: 'Sarah Chen', userInitials: 'SC' };
  const safety = familyState.safety || { safetyStatus: 'Safe', safetyMessage: 'All systems normal', battery: 98, cameraStatus: 'Camera Online' };
  const activity = familyState.activity || { walkingStatus: 'Walking', walkingDetail: '2 min ago · steady pace' };
  const alerts = familyState.alerts || { unreadAlerts: 2 };
  const elderly = familyState.elderly || { elderlyName: 'Mom', room: 'Living Room' };

  const getStatusClass = () => {
    if (safety.safetyStatus === 'Emergency') return 'status-emergency';
    if (safety.safetyStatus === 'Warning') return 'status-warning';
    return 'status-safe';
  };

  return (
    <div className="home-content">
      <header className="home-header">
        <div>
          <p className="greeting">Good morning</p>
          <h1>{user.userName}</h1>
        </div>
        <button className="avatar-button profile-menu-button" type="button">
          <span>{user.userInitials}</span>
          {alerts.unreadAlerts > 0 && <strong className="notification-dot">{alerts.unreadAlerts}</strong>}
        </button>
      </header>

      <section className={`status-card ${getStatusClass()}`}>
        <div className="status-card-top">
          <p>{elderly.elderlyName.toUpperCase()} · {elderly.room.toUpperCase()}</p>
          <span className="live-tag">● LIVE</span>
        </div>
        <div className="safe-summary">
          <div className="check-circle">{safety.safetyStatus === 'Safe' ? '✓' : '!'}</div>
          <div>
            <h2>{safety.safetyStatus}</h2>
            <p>{safety.safetyMessage}</p>
          </div>
        </div>
        <div className="status-pills">
          <span>{safety.cameraStatus}</span>
          <span><strong>{safety.battery}</strong>% battery</span>
        </div>
      </section>

      <section className="walking-card">
        <div className="walking-icon">👣</div>
        <div className="walking-copy">
          <h2>{activity.walkingStatus}</h2>
          <p>{activity.walkingDetail}</p>
        </div>
        <div className="trend-icon">⌁</div>
      </section>

      <section className="quick-actions">
        <div className="section-title-row">
          <h2>Quick Actions</h2>
        </div>
        <div className="action-grid">
          <Link className="action-card" to="/live">
            <span className="action-icon coral">▶</span>
            <strong>Live View</strong><small>Check camera</small>
          </Link>
          <Link className="action-card" to="/alert">
            <span className="action-icon warning">!</span>
            <strong>Alerts</strong><small>Review updates</small>
            {alerts.unreadAlerts > 0 && <em className="card-badge">{alerts.unreadAlerts}</em>}
          </Link>
          <button className="action-card" onClick={() => toastEvent.show("Health summary is a placeholder.")}>
            <span className="action-icon sage">♥</span>
            <strong>Health</strong><small>Vitals summary</small>
          </button>
          <Link className="action-card" to="/settings">
            <span className="action-icon navy">⚙</span>
            <strong>Settings / Me</strong><small>Family profile</small>
          </Link>
        </div>
      </section>
    </div>
  );
}