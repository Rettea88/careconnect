import React from 'react';
import Toast from './Toast';
import '../styles/style.css';

export default function LoginLayout({ children }) {
  return (
    <main className="app-shell login-shell">
      <section className="phone login-phone">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <div className="status-icons">
            <i></i>
            <i></i>
            <b></b>
          </div>
        </div>

        {children}

        <Toast />
      </section>
    </main>
  );
}
