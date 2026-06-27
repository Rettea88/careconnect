import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 统一引入你原有的精美 CSS 样式
// 请确保之前提取的样式文件放在 src/styles/ 目录下
import './styles/style.css';
import './styles/live-monitor.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);