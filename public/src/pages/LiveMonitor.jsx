import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamilyData } from '../context/FamilyContext';
import elderRoomMonitorVideo from '../../assets/videos/elder-room-monitor.mp4';
import fallMonitorVideo from '../../assets/videos/fall-monitor.mp4';

const trackingKeyframes = {
  normal: [
    { time: 0, top: 0, left: 0, width: 0, height: 0, opacity: 0 },
    { time: 2.4, top: 0, left: 0, width: 0, height: 0, opacity: 0 },
    { time: 3.2, top: 18, left: 33, width: 27, height: 70, opacity: 1 },
    { time: 4.8, top: 26, left: 36, width: 32, height: 66, opacity: 1 },
    { time: 6.4, top: 28, left: 61, width: 31, height: 57, opacity: 1 },
    { time: 8.0, top: 28, left: 61, width: 31, height: 57, opacity: 1 }
  ],
  fall: [
    { time: 0, top: 27, left: 0, width: 31, height: 73, opacity: 1 },
    { time: 1.6, top: 8, left: 6, width: 49, height: 92, opacity: 1 },
    { time: 3.2, top: 0, left: 12, width: 60, height: 100, opacity: 1 },
    { time: 4.8, top: 3, left: 20, width: 55, height: 96, opacity: 1 },
    { time: 6.4, top: 0, left: 16, width: 73, height: 97, opacity: 1 },
    { time: 8.0, top: 0, left: 16, width: 73, height: 97, opacity: 1 }
  ],
  'no-movement': [
    { time: 0, top: 0, left: 0, width: 0, height: 0, opacity: 0 },
    { time: 2.4, top: 0, left: 0, width: 0, height: 0, opacity: 0 },
    { time: 3.2, top: 18, left: 33, width: 27, height: 70, opacity: 1 },
    { time: 4.8, top: 26, left: 36, width: 32, height: 66, opacity: 1 },
    { time: 6.4, top: 28, left: 61, width: 31, height: 57, opacity: 1 },
    { time: 8.0, top: 28, left: 61, width: 31, height: 57, opacity: 1 }
  ]
};

const FALL_DETECTED_AT = 7.05;
const NO_MOVEMENT_DETECTED_AT = 6.4;
const NO_MOVEMENT_HOLD_AT = 7.8;

const detectionStates = {
  normal: { title: "Person Detected", status: "Normal", confidence: "98%", message: "All systems normal", indicator: "All clear" },
  fall: { title: "Fall Detected", status: "Emergency", confidence: "94%", message: "Possible fall detected. Immediate attention required.", indicator: "Emergency" },
  'no-movement': { title: "No Movement Detected", status: "Warning", confidence: "91%", message: "No movement has been detected for an extended period.", indicator: "Warning" }
};

const simulationSources = {
  normal: elderRoomMonitorVideo,
  fall: fallMonitorVideo,
  'no-movement': elderRoomMonitorVideo
};

const interpolateTrackingBox = (frames, currentTime) => {
  const lastFrame = frames[frames.length - 1];
  const duration = lastFrame.time;
  const time = duration > 0 ? currentTime % duration : currentTime;
  const nextIndex = frames.findIndex((frame) => frame.time >= time);

  if (nextIndex <= 0) {
    return frames[0];
  }

  const previous = frames[nextIndex - 1];
  const next = frames[nextIndex] || lastFrame;
  const progress = (time - previous.time) / (next.time - previous.time || 1);
  const mix = (from, to) => from + (to - from) * progress;

  return {
    top: mix(previous.top, next.top),
    left: mix(previous.left, next.left),
    width: mix(previous.width, next.width),
    height: mix(previous.height, next.height),
    opacity: mix(previous.opacity ?? 1, next.opacity ?? 1)
  };
};

export default function LiveMonitor() {
  const navigate = useNavigate();
  const { updateFamilyState } = useFamilyData() || {};
  const [activeSimulation, setActiveSimulation] = useState('normal');
  const [detectionState, setDetectionState] = useState('normal');
  const [trackingBox, setTrackingBox] = useState(trackingKeyframes.normal[0]);
  const [fallAlert, setFallAlert] = useState({ visible: false, countdown: 5 });
  const [fallAlertDismissed, setFallAlertDismissed] = useState(false);
  const videoRef = useRef(null);

  const currentSim = {
    ...detectionStates[detectionState],
    src: simulationSources[activeSimulation]
  };

  useEffect(() => {
    if (!updateFamilyState) {
      return;
    }

    const sharedState = {
      normal: {
        safety: { safetyStatus: "Safe", safetyMessage: "All systems normal", cameraStatus: "Camera Online", battery: 98 },
        activity: { walkingStatus: "Walking", walkingDetail: "Live monitor active" },
        alerts: { unreadAlerts: 0 }
      },
      fall: {
        safety: { safetyStatus: "Emergency", safetyMessage: "Fall detected in living room", cameraStatus: "Camera Online", battery: 96 },
        activity: { walkingStatus: "Fall detected", walkingDetail: "Immediate review required" },
        alerts: { unreadAlerts: 1 }
      },
      'no-movement': {
        safety: { safetyStatus: "Warning", safetyMessage: "No movement detected", cameraStatus: "Camera Online", battery: 97 },
        activity: { walkingStatus: "No Movement", walkingDetail: "Inactive for an extended period" },
        alerts: { unreadAlerts: 1 }
      }
    };

    updateFamilyState(sharedState[detectionState]);
  }, [detectionState, updateFamilyState]);

  useEffect(() => {
    let animationFrameId;
    const frames = trackingKeyframes[activeSimulation];

    const syncTrackingBox = () => {
      const video = videoRef.current;
      const currentTime = video?.currentTime || 0;

      setTrackingBox(interpolateTrackingBox(frames, currentTime));
      setDetectionState((current) => {
        if (current !== 'normal') {
          return current;
        }

        if (activeSimulation === 'fall' && currentTime >= FALL_DETECTED_AT) {
          return 'fall';
        }

        if (activeSimulation === 'no-movement' && currentTime >= NO_MOVEMENT_DETECTED_AT) {
          return 'no-movement';
        }

        return current;
      });

      if (activeSimulation === 'no-movement' && currentTime >= NO_MOVEMENT_HOLD_AT && video && !video.paused) {
        video.pause();
      }

      animationFrameId = window.requestAnimationFrame(syncTrackingBox);
    };

    syncTrackingBox();

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [activeSimulation]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.load();
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [activeSimulation, currentSim.src]);

  useEffect(() => {
    setDetectionState('normal');
    setFallAlert({ visible: false, countdown: 5 });
    setFallAlertDismissed(false);
  }, [activeSimulation]);

  useEffect(() => {
    if (detectionState !== 'fall') {
      setFallAlert({ visible: false, countdown: 5 });
      return;
    }

    if (!fallAlertDismissed) {
      setFallAlert({ visible: true, countdown: 5 });
    }
  }, [detectionState, fallAlertDismissed]);

  useEffect(() => {
    if (!fallAlert.visible) {
      return;
    }

    if (fallAlert.countdown <= 0) {
      navigate('/alert', { state: { trigger: 'fall-detected' } });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFallAlert((current) => ({ ...current, countdown: current.countdown - 1 }));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [fallAlert, navigate]);

  const handleSimulate = (type) => {
    if (type === activeSimulation) {
      return;
    }

    setActiveSimulation(type);
  };

  const detectionChips = [
    { key: 'motion', label: 'No Motion', detail: detectionState === 'no-movement' ? 'Detected' : 'Not detected', active: detectionState === 'no-movement' },
    { key: 'clock', label: 'Inactive Over 1h', detail: detectionState === 'no-movement' ? 'Detected' : 'Not detected', active: detectionState === 'no-movement' },
    { key: 'gesture', label: 'Pain Gesture', detail: detectionState === 'fall' ? 'Detected' : 'Not detected', active: detectionState === 'fall' },
    { key: 'hand', label: 'Hand-Wave SOS', detail: 'Not detected', active: false }
  ];

  return (
    <div 
      className="phone-shell home-content" 
      data-state={detectionState}
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
        <video ref={videoRef} className="monitor-video" autoPlay loop={activeSimulation === 'normal'} muted playsInline src={currentSim.src} />
        <div className="recording-overlay">
          <span className="rec-label"><span className="rec-dot"></span>REC</span>
          <time>{new Date().toLocaleTimeString()}</time>
        </div>
        <div
          className="ai-box"
          style={{
            '--box-top': `${trackingBox.top}%`,
            '--box-left': `${trackingBox.left}%`,
            '--box-width': `${trackingBox.width}%`,
            '--box-height': `${trackingBox.height}%`,
            '--box-opacity': trackingBox.opacity ?? 1
          }}
        ></div>
        <div className="ai-result">
          <span className="ai-result-icon">✓</span>
          <div>
            <strong>{currentSim.title}</strong>
            <span>{currentSim.status}</span>
          </div>
          <small>Confidence {currentSim.confidence}</small>
        </div>
      </section>

      {fallAlert.visible && (
        <div className="fall-alert-overlay" role="alertdialog" aria-modal="true" aria-labelledby="fall-alert-title">
          <div className="fall-alert-card">
            <div className="fall-alert-icon">!</div>
            <div>
              <span className="eyebrow">Emergency detection</span>
              <h2 id="fall-alert-title">Fall detected</h2>
              <p>Opening alert workflow in {fallAlert.countdown}s.</p>
            </div>
            <div className="fall-alert-actions">
              <button type="button" onClick={() => navigate('/alert', { state: { trigger: 'fall-detected' } })}>Review now</button>
              <button type="button" onClick={() => { setFallAlertDismissed(true); setFallAlert({ visible: false, countdown: 5 }); }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <section className="detection-section">
        <div className="section-heading">
          <div><span className="eyebrow">Smart monitoring</span><h2>AI Detection</h2></div>
          <span className="safe-badge"><span></span>{currentSim.indicator}</span>
        </div>
        <p className="monitoring-message">{currentSim.message}</p>
        <div className="detection-chips">
          {detectionChips.map((chip) => (
            <div className={`detection-chip ${chip.active ? 'is-detected' : ''}`} key={chip.key}>
              <span className={`chip-icon ${chip.key}-icon`}></span>
              <span><strong>{chip.label}</strong><small>{chip.detail}</small></span>
            </div>
          ))}
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
          <button className="talk-button" type="button" onClick={() => setActiveSimulation('no-movement')}>Talk</button>
        </div>

        <div className="message-preview">
          <p className="message outgoing">Mom, did you take your medicine?</p>
          <p className="message incoming">Yes dear, just had it.</p>
        </div>
      </section>
    </div>
  );
}
