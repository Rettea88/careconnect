import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Family app navigation">
      
      {/* NavLink 接收一个回调，自动判断 isActive 并应用类名 */}
      <NavLink 
        to="/home" 
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span aria-hidden="true">⌂</span>
        Home
      </NavLink>
      
      <NavLink 
        to="/live" 
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span aria-hidden="true">▶</span>
        Live
      </NavLink>
      
      <NavLink 
        to="/alert" 
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span aria-hidden="true">!</span>
        Alerts
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        <span aria-hidden="true">◉</span>
        Me
      </NavLink>
      
    </nav>
  );
}