import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastEvent } from '../components/Toast';

import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

import '../styles/settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([
    { initials: "DC", name: "David Chen", role: "Son · Primary", avatar: "avatar-red", primary: true },
    { initials: "LC", name: "Lily Chen", role: "Daughter", avatar: "avatar-teal" },
    { initials: "SC", name: "Sunshine Center", role: "Community", avatar: "avatar-yellow" },
    { initials: "SM", name: "St. Mary Hospital", role: "24/7 Emergency", avatar: "avatar-hospital" }
  ]);
  const [community, setCommunity] = useState({ name: "Sunshine Community", admin: "Admin Lin Wei", bound: true });
  const [permissions, setPermissions] = useState({ liveCamera: false, alertAccess: true });
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [communityCode, setCommunityCode] = useState('CC-SUNSHINE-2048');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      toastEvent.show("Failed to sign out. Please try again.");
    }
  };

  const addContact = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactRole.trim()) {
      toastEvent.show("Enter a name and role.");
      return;
    }

    const initials = contactName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    setContacts((current) => [
      ...current,
      { initials: initials || "CC", name: contactName.trim(), role: contactRole.trim(), avatar: "avatar-teal" }
    ]);
    setContactName('');
    setContactRole('');
    setIsContactOpen(false);
    toastEvent.show("Emergency contact added.");
  };

  const bindCommunity = () => {
    if (!communityCode.trim()) {
      toastEvent.show("Scan or enter a community code.");
      return;
    }

    setCommunity({ name: "Sunshine Community", admin: "Admin Lin Wei", bound: true });
    setPermissions({ liveCamera: false, alertAccess: true });
    setIsScanOpen(false);
    toastEvent.show("Community endpoint bound.");
  };

  return (
    <div className="settings-content">
      <header className="settings-header">
        <button className="icon-button" onClick={() => navigate('/home')} aria-label="Go back">
          <span aria-hidden="true">←</span>
        </button>
        
        <h1>Settings</h1>
        
        <button className="header-scan-button" onClick={() => setIsScanOpen(true)} aria-label="Scan community code">
          Scan
        </button>
      </header>

      <div className="section-header">
        <span className="section-title">Emergency Contacts</span>
        <button className="add-btn" type="button" aria-label="Add contact" onClick={() => setIsContactOpen(true)}>+</button>
      </div>
      
      <div className="list-card">
        {contacts.map((contact) => (
          <div className="list-item" key={`${contact.name}-${contact.role}`}>
            <div className={`item-avatar ${contact.avatar}`}>{contact.initials}</div>
            <div className="item-info">
              <h3>{contact.name} {contact.primary && <span className="primary-star" aria-hidden="true">★</span>}</h3>
              <p>{contact.role}</p>
            </div>
            <button className="item-call-button" type="button" onClick={() => window.location.href='tel:+1234567890'}>Call</button>
          </div>
        ))}
      </div>

      <div className="section-header">
        <span className="section-title">Community Staff Permissions</span>
        <button className={`bound-badge ${community.bound ? 'is-bound' : ''}`} type="button" onClick={() => setIsScanOpen(true)}>
          {community.bound ? 'BOUND' : 'BIND'}
        </button>
      </div>

      <div className="list-card">
        <div className="permission-header">
          {community.name} · {community.admin}
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
            <input
              type="checkbox"
              checked={permissions.liveCamera}
              onChange={(e) => setPermissions((current) => ({ ...current, liveCamera: e.target.checked }))}
            />
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
            <input
              type="checkbox"
              checked={permissions.alertAccess}
              onChange={(e) => setPermissions((current) => ({ ...current, alertAccess: e.target.checked }))}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="account-card">
        <div>
          <strong>Signed in family account</strong>
          <p>Manage access from this device.</p>
        </div>
        <button className="signout-button" type="button" onClick={handleLogout}>Sign out</button>
      </div>

      {isContactOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="contact-title">
          <form className="settings-modal" onSubmit={addContact}>
            <div className="modal-header">
              <h2 id="contact-title">Add Contact</h2>
              <button type="button" onClick={() => setIsContactOpen(false)} aria-label="Close">×</button>
            </div>
            <label>
              <span>Name</span>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Alex Chen" />
            </label>
            <label>
              <span>Role</span>
              <input value={contactRole} onChange={(e) => setContactRole(e.target.value)} placeholder="Neighbor · Backup" />
            </label>
            <button className="modal-primary-button" type="submit">Add contact</button>
          </form>
        </div>
      )}

      {isScanOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="scan-title">
          <div className="settings-modal">
            <div className="modal-header">
              <h2 id="scan-title">Bind Community Endpoint</h2>
              <button type="button" onClick={() => setIsScanOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="scan-frame">
              <div className="scan-corners"></div>
              <span>CC</span>
            </div>
            <label>
              <span>Community code</span>
              <input value={communityCode} onChange={(e) => setCommunityCode(e.target.value)} />
            </label>
            <button className="modal-primary-button" type="button" onClick={bindCommunity}>Bind endpoint</button>
          </div>
        </div>
      )}
    </div>
  );
}
