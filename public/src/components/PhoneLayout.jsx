import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';
import '../styles/style.css';

export default function PhoneLayout() {
  return (
    <main className="app-shell">
      <section className="phone home-screen">
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <div className="status-icons">
            <i></i>
            <i></i>
            <b></b>
          </div>
        </div>

        <Outlet />

        <BottomNav />

        <Toast />
        
      </section>
    </main>
  );
}
