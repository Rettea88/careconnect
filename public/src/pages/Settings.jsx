import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toastEvent } from '../components/Toast';

import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

import '../styles/settings.css';

export default function Settings() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      toastEvent.show("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="settings-content">
      <header className="settings-header">
        <button className="icon-button" onClick={() => navigate('/home')} aria-label="Go back">
          <span aria-hidden="true">←</span>
        </button>
        
        <h1>Settings</h1>
        
        <button className="icon-button logout" onClick={handleLogout} aria-label="Sign out">
          <span aria-hidden="true">🚪</span>
        </button>
      </header>

      <div className="section-header">
        <span className="section-title">Emergency Contacts</span>
        <div className="add-btn" aria-label="Add contact" onClick={() => toastEvent.show("Add contact feature coming soon.")}>+</div>
      </div>
      
      <div className="list-card">
        <div className="list-item">
          <div className="item-avatar avatar-red">DC</div>
          <div className="item-info">
            <h3>David Chen <span className="primary-star" aria-hidden="true">★</span></h3>
            <p>Son · Primary</p>
          </div>
          <div className="item-arrow">›</div>
        </div>
        
        <div className="list-item">
          <div className="item-avatar avatar-teal">LC</div>
          <div className="item-info">
            <h3>Lily Chen</h3>
            <p>Daughter</p>
          </div>
          <div className="item-arrow">›</div>
        </div>
        
        <div className="list-item">
          <div className="item-avatar avatar-yellow">
            <span aria-hidden="true">🏢</span>
          </div>
          <div className="item-info">
            <h3>Sunshine Center</h3>
            <p>Community</p>
          </div>
          <div className="item-arrow">›</div>
        </div>
        
        <div className="list-item">
          <div className="item-avatar avatar-hospital">
            <span aria-hidden="true">🏥</span>
          </div>
          <div className="item-info">
            <h3>St. Mary Hospital</h3>
            <p>24/7 Emergency</p>
          </div>
          <div className="item-arrow">›</div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Community Staff Permissions</span>
        <div className="bound-badge">
          <span aria-hidden="true">🛡️</span> BOUND
        </div>
      </div>

      <div className="list-card">
        <div className="permission-header">
          Sunshine Community · Admin Lin Wei
        </div>
        
        <div className="permission-item">
          <div className="permission-icon">
            <span aria-hidden="true">📹</span>
          </div>
          <div className="permission-info">
            <h3>Live Camera Access</h3>
            <p>Allow staff to view the live feed anytime</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="permission-item">
          <div className="permission-icon">
            <span aria-hidden="true">⚠️</span>
          </div>
          <div className="permission-info">
            <h3>Alert-Triggered Access</h3>
            <p>Allow staff to view feed only during alerts</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
}
