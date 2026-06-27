import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/alert.css'; // 引入专属样式

export default function Alert() {
  const navigate = useNavigate();

  return (
    <div className="alert-wrapper">
      <div className="alert-phone">
        
        {/* 红色警报头部 */}
        <div className="alert-header">
          <div className="alert-top-nav">
            <div className="alert-badge">
              <span className="dot"></span> CRITICAL ALERT
            </div>
            <button className="close-btn" onClick={() => navigate('/home')} aria-label="Close Alert">
              &times;
            </button>
          </div>
          <div className="alert-title-row">
            <div className="alert-icon-wrapper">
              <svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2z" fill="white" /></svg>
            </div>
            <div className="alert-text">
              <h1>Fall Detected</h1>
              <p>Mom may need help</p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="content-area">
          <div className="card">
            <div className="info-row">
              <div className="info-label">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Time
              </div>
              <div className="info-value">14:32, just now</div>
            </div>
            <div className="info-row">
              <div className="info-label green">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Location
              </div>
              <div className="info-value green">Living Room ›</div>
            </div>
          </div>

          <div className="community-card">
            <div className="card-header">
              <svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              COMMUNITY NOTIFIED
            </div>
            <p>Sunshine Community staff can now access the live camera to verify Mom's condition.</p>
          </div>

          <div class="instruction-card">
            <div className="card-header">
              {/* 注意：在 React 中 stroke-width 必须写成驼峰命名 strokeWidth */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              ACTION REQUIRED
            </div>
            <p>Contact the community admin for immediate on-site help, or call the hospital if needed.</p>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="action-footer">
          <div className="action-grid">
            <button className="btn-action btn-community" onClick={() => window.location.href='tel:+1234567890'}>
              <svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-4h3v2z"/><path d="M3 19a2 2 0 0 0 2 2h1v-4H3v2z"/></svg>
              <span>Contact<br/>Community</span>
            </button>
            <button className="btn-action btn-hospital">
              <svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
              <span>Call<br/>Hospital</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}