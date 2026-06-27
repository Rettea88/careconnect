import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LiveMonitor() {
  const navigate = useNavigate();
  const [activeSimulation, setActiveSimulation] = useState('normal');
  const videoRef = useRef(null);

  const simulations = {
    normal: { title: "Person Detected", status: "Normal", confidence: "98%", message: "All systems normal", indicator: "All clear", src: "/assets/videos/elder-room-monitor.mp4" },
    fall: { title: "Fall Detected", status: "Emergency", confidence: "94%", message: "Possible fall detected. Immediate attention required.", indicator: "Emergency", src: "/assets/videos/fall-monitor.mp4" },
    'no-movement': { title: "No Movement Detected", status: "Warning", confidence: "91%", message: "No movement has been detected for an extended period.", indicator: "Warning", src: "/assets/videos/elder-room-monitor.mp4" }
  };

  const currentSim = simulations[activeSimulation];

  const handleSimulate = (type) => {
    setActiveSimulation(type);
    if (videoRef.current) {
      videoRef.current.src = simulations[type].src;
      videoRef.current.play().catch(e => console.log("Autoplay prevented"));
    }
  };

  return (
    // 👇 注意这里：增加了 home-content 类名，并用 style 重置了高度和宽度限制 👇
    <div 
      className="phone-shell home-content" 
      data-state={activeSimulation}
      style={{ minHeight: 'auto', width: '100%', margin: 0 }}
    >
      <header className="app-header">
        <button className="back-button" onClick={() => navigate('/home')}>←</button>
        <div className="header-title">
          <h1>Live Monitor</h1>
          <div className="live-status"><span className="status-dot"></span> Live</div>
        </div>
        <div className="header-spacer"></div>
      </header>

      <section className="monitor">
        <video ref={videoRef} className="monitor-video" autoPlay loop muted playsInline src={currentSim.src} />
        <div className="recording-overlay">
          <span className="rec-label"><span className="rec-dot"></span>REC</span>
          <time>{new Date().toLocaleTimeString()}</time>
        </div>
        <div className="ai-box"></div>
        <div className="ai-result">
          <span className="ai-result-icon">✓</span>
          <div>
            <strong>{currentSim.title}</strong>
            <span>{currentSim.status}</span>
          </div>
          <small>Confidence {currentSim.confidence}</small>
        </div>
      </section>

      <section className="detection-section">
        <div className="section-heading">
          <div><span className="eyebrow">Smart monitoring</span><h2>AI Detection</h2></div>
          <span className="safe-badge"><span></span>{currentSim.indicator}</span>
        </div>
        <p className="monitoring-message">{currentSim.message}</p>
        <div className="detection-chips">
          <div className="detection-chip"><span className="chip-icon motion-icon"></span><span><strong>No Motion</strong><small>Not detected</small></span></div>
          <div className="detection-chip"><span className="chip-icon clock-icon"></span><span><strong>Inactive Over 1h</strong><small>Not detected</small></span></div>
          <div className="detection-chip"><span className="chip-icon gesture-icon"></span><span><strong>Pain Gesture</strong><small>Not detected</small></span></div>
          <div className="detection-chip"><span className="chip-icon hand-icon"></span><span><strong>Hand-Wave SOS</strong><small>Not detected</small></span></div>
        </div>
      </section>

      <section className="prototype-controls">
        <div><span className="eyebrow">Local demo</span><h2>Prototype Controls</h2></div>
        <div className="control-buttons">
          <button className={`state-button ${activeSimulation === 'normal' ? 'is-active' : ''}`} onClick={() => handleSimulate('normal')}>Simulate Normal</button>
          <button className={`state-button ${activeSimulation === 'fall' ? 'is-active' : ''}`} onClick={() => handleSimulate('fall')}>Simulate Fall</button>
          <button className={`state-button ${activeSimulation === 'no-movement' ? 'is-active' : ''}`} onClick={() => handleSimulate('no-movement')}>Simulate No Movement</button>
        </div>
      </section>

      <section className="talk-card" aria-labelledby="talk-title">
        <div className="talk-card-header">
          <div className="camera-icon" aria-hidden="true">
            <span></span>
          </div>
          <div>
            <span className="eyebrow">Two-way audio</span>
            <h2 id="talk-title">Talk to Camera</h2>
          </div>
          <button className="talk-button" type="button">Talk</button>
        </div>

        <div className="message-preview">
          <p className="message outgoing">Mom, did you take your medicine?</p>
          <p className="message incoming">Yes dear, just had it.</p>
        </div>
      </section>
    </div>
  );
}