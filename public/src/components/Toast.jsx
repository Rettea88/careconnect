import React, { useState, useEffect } from 'react';

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
    
    const handleShow = (msg) => {
      setMessage(msg);
      setIsVisible(true);
      
      clearTimeout(timer);
      
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 2600); 
    };

    const unsubscribe = toastEvent.subscribe(handleShow);
    
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
