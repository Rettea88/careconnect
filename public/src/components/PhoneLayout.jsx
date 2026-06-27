import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Toast from './Toast';
import '../styles/style.css'; // 引入你原有的 CSS

export default function PhoneLayout() {
  return (
    <main className="app-shell">
      {/* 这里的 home-screen 类主要是为了继承你原有的背景样式，如果需要可以做成动态的 */}
      <section className="phone home-screen">
        
        {/* 顶部状态栏 - 全局复用，不可见于屏幕阅读器 */}
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <div className="status-icons">
            <i></i>
            <i></i>
            <b></b>
          </div>
        </div>

        {/* 核心区域：React Router 会将匹配到的子页面（如 Home, Settings 等）渲染在这里 */}
        <Outlet />

        {/* 底部导航栏 */}
        <BottomNav />

        {/* 全局消息提示框 */}
        <Toast />
        
      </section>
    </main>
  );
}