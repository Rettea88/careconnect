import React, { useState, useEffect } from 'react';

// 轻量级事件总线，用于在任何页面触发 Toast 消息
export const toastEvent = {
  listeners: [],
  show(message) {
    this.listeners.forEach(listener => listener(message));
  },
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
};

export default function Toast() {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer;
    
    // 监听到事件后的处理函数
    const handleShow = (msg) => {
      setMessage(msg);
      setIsVisible(true);
      
      // 清除之前的定时器，防止连续点击导致闪烁
      clearTimeout(timer);
      
      // 保持和你原有逻辑相同的 2.6 秒消失时间
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 2600); 
    };

    // 订阅事件
    const unsubscribe = toastEvent.subscribe(handleShow);
    
    // 组件卸载时清理定时器和订阅
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      className={`toast ${isVisible ? 'show' : ''}`} 
      role="status" 
      aria-live="polite"
    >
      {message}
    </div>
  );
}