import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFamilyData } from '../context/FamilyContext';

export default function Home() {
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const familyState = useFamilyData() || {};
  const { updateFamilyState } = familyState;
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

  const clearSafetyStatus = () => {
    updateFamilyState?.({
      safety: { safetyStatus: "Safe", safetyMessage: "All systems normal", cameraStatus: "Camera Online", battery: 98 },
      activity: { walkingStatus: "Walking", walkingDetail: "Live monitor active" },
      alerts: { unreadAlerts: 0 }
    });
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
        {safety.safetyStatus !== 'Safe' && (
          <button className="clear-status-button" type="button" onClick={clearSafetyStatus}>
            Mark resolved
          </button>
        )}
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
          <button className="action-card" onClick={() => setIsHealthOpen(true)}>
            <span className="action-icon sage">♥</span>
            <strong>Health</strong><small>Vitals summary</small>
          </button>
          <Link className="action-card" to="/settings">
            <span className="action-icon navy">⚙</span>
            <strong>Settings / Me</strong><small>Family profile</small>
          </Link>
        </div>
      </section>

      {isHealthOpen && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-labelledby="health-title">
          <div className="bottom-sheet">
            <div className="sheet-handle" aria-hidden="true"></div>
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Today</span>
                <h2 id="health-title">Health Summary</h2>
              </div>
              <button className="sheet-close" type="button" onClick={() => setIsHealthOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="vitals-grid">
              <div className="vital-card"><span>Heart Rate</span><strong>78</strong><small>bpm</small></div>
              <div className="vital-card"><span>Oxygen</span><strong>97</strong><small>% SpO2</small></div>
              <div className="vital-card"><span>Steps</span><strong>2.4k</strong><small>today</small></div>
              <div className="vital-card"><span>Sleep</span><strong>7.1</strong><small>hours</small></div>
            </div>
            <div className="insight-card">
              <strong>Care insight</strong>
              <p>Vitals are steady. Walking activity is lighter than usual, so check hydration and afternoon movement.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
