import { auth, db } from "./firebase-service.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

console.log("CareConnect Live Monitor loaded");

const FALL_DETECTION_TIME = 6;
const NO_MOVEMENT_FRAME_TIME = 6;
const NORMAL_VIDEO_SOURCE = "../assets/videos/elder-room-monitor.mp4";
const FALL_VIDEO_SOURCE = "../assets/videos/fall-monitor.mp4";

const liveClock = document.querySelector("#live-clock");
const phoneShell = document.querySelector(".phone-shell");
const monitorVideo = document.querySelector(".monitor-video");
const backButton = document.querySelector(".back-button");
const aiBox = document.querySelector(".ai-box");
const detectionTitle = document.querySelector("#ai-detection-title");
const aiStatus = document.querySelector("#ai-status");
const confidence = document.querySelector("#ai-confidence");
const resultIcon = document.querySelector("#ai-result-icon");
const monitoringMessage = document.querySelector("#monitoring-message");
const statusIndicatorText = document.querySelector("#status-indicator-text");
const simulationButtons = document.querySelectorAll("[data-simulation]");

const simulationStates = {
  normal: {
    title: "Person Detected",
    status: "Normal",
    confidence: "98%",
    message: "All systems normal",
    indicator: "All clear",
    icon: "\u2713"
  },
  fall: {
    title: "Fall Detected",
    status: "Emergency",
    confidence: "94%",
    message: "Possible fall detected. Immediate attention required.",
    indicator: "Emergency",
    icon: "!"
  },
  "no-movement": {
    title: "No Movement Detected",
    status: "Warning",
    confidence: "91%",
    message: "No movement has been detected for an extended period.",
    indicator: "Warning",
    icon: "!"
  }
};

const NORMAL_TRACKING_KEYFRAMES = [
  { time: 0, visible: false },
  { time: 1, visible: true, left: 2, top: 18, width: 24, height: 58 },
  { time: 2, visible: true, left: 8, top: 17, width: 25, height: 59 },
  { time: 3, visible: true, left: 15, top: 18, width: 25, height: 60 },
  { time: 4, visible: true, left: 23, top: 20, width: 24, height: 59 },
  { time: 5, visible: true, left: 48, top: 26, width: 30, height: 48 },
  { time: 6, visible: true, left: 50, top: 27, width: 30, height: 47 },
  { time: 7, visible: true, left: 51, top: 28, width: 29, height: 46 }
];

const FALL_TRACKING_KEYFRAMES = [
  { time: 0, visible: false },
  { time: 0.5, visible: true, left: 0, top: 14, width: 30, height: 66 },
  { time: 1.5, visible: true, left: 3, top: 15, width: 31, height: 65 },
  { time: 2.5, visible: true, left: 8, top: 17, width: 31, height: 63 },
  { time: 3.5, visible: true, left: 14, top: 20, width: 33, height: 60 },
  { time: 4.5, visible: true, left: 20, top: 28, width: 38, height: 52 },
  { time: 5.5, visible: true, left: 24, top: 42, width: 46, height: 34 }
];

const fixedBoxPositions = {
  fall: { top: "47%", left: "35%", width: "43%", height: "25%" },
  "no-movement": { top: "22%", left: "47%", width: "30%", height: "50%" }
};

let activeSimulation = "normal";
let currentTrackingFrame = -1;
let fallDetected = false;
let fallAlertCreated = false;
let videoSwitchRequest = 0;

function updateLiveClock() {
  if (!liveClock) {
    return;
  }

  const now = new Date();
  liveClock.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  liveClock.dateTime = now.toISOString();
}

function applyBoxPosition(position) {
  if (!aiBox || !position) {
    return;
  }

  aiBox.style.top = position.top;
  aiBox.style.left = position.left;
  aiBox.style.width = position.width;
  aiBox.style.height = position.height;
}

function setBoxVisibility(isVisible) {
  if (!aiBox) {
    return;
  }

  aiBox.classList.toggle("is-tracking-hidden", !isVisible);
}

function interpolateValue(start, end, progress) {
  return start + (end - start) * progress;
}

function updateNormalTracking() {
  if (!monitorVideo || activeSimulation !== "normal") {
    return;
  }

  const currentTime = monitorVideo.currentTime;
  let currentKeyframe = NORMAL_TRACKING_KEYFRAMES[0];
  let nextKeyframe = NORMAL_TRACKING_KEYFRAMES[1];

  for (let index = 0; index < NORMAL_TRACKING_KEYFRAMES.length; index += 1) {
    if (NORMAL_TRACKING_KEYFRAMES[index].time <= currentTime) {
      currentKeyframe = NORMAL_TRACKING_KEYFRAMES[index];
      nextKeyframe =
        NORMAL_TRACKING_KEYFRAMES[index + 1] || NORMAL_TRACKING_KEYFRAMES[index];
    } else {
      break;
    }
  }

  if (!currentKeyframe.visible) {
    setBoxVisibility(false);
    return;
  }

  setBoxVisibility(true);

  const interval = nextKeyframe.time - currentKeyframe.time;
  const progress =
    interval > 0
      ? Math.min(1, Math.max(0, (currentTime - currentKeyframe.time) / interval))
      : 0;

  applyBoxPosition({
    left: `${interpolateValue(currentKeyframe.left, nextKeyframe.left, progress)}%`,
    top: `${interpolateValue(currentKeyframe.top, nextKeyframe.top, progress)}%`,
    width: `${interpolateValue(currentKeyframe.width, nextKeyframe.width, progress)}%`,
    height: `${interpolateValue(currentKeyframe.height, nextKeyframe.height, progress)}%`
  });
}

function updateFallTracking() {
  if (!monitorVideo || activeSimulation !== "fall" || fallDetected) {
    return;
  }

  const currentTime = monitorVideo.currentTime;
  let currentKeyframe = FALL_TRACKING_KEYFRAMES[0];
  let nextKeyframe = FALL_TRACKING_KEYFRAMES[1];

  for (let index = 0; index < FALL_TRACKING_KEYFRAMES.length; index += 1) {
    if (FALL_TRACKING_KEYFRAMES[index].time <= currentTime) {
      currentKeyframe = FALL_TRACKING_KEYFRAMES[index];
      nextKeyframe =
        FALL_TRACKING_KEYFRAMES[index + 1] || FALL_TRACKING_KEYFRAMES[index];
    } else {
      break;
    }
  }

  if (!currentKeyframe.visible) {
    setBoxVisibility(false);
    return;
  }

  setBoxVisibility(true);

  const interval = nextKeyframe.time - currentKeyframe.time;
  const progress =
    interval > 0
      ? Math.min(1, Math.max(0, (currentTime - currentKeyframe.time) / interval))
      : 0;

  applyBoxPosition({
    left: `${interpolateValue(currentKeyframe.left, nextKeyframe.left, progress)}%`,
    top: `${interpolateValue(currentKeyframe.top, nextKeyframe.top, progress)}%`,
    width: `${interpolateValue(currentKeyframe.width, nextKeyframe.width, progress)}%`,
    height: `${interpolateValue(currentKeyframe.height, nextKeyframe.height, progress)}%`
  });
}

function runNormalTrackingAnimation() {
  updateNormalTracking();
  window.requestAnimationFrame(runNormalTrackingAnimation);
}

function runFallTrackingAnimation() {
  updateFallTracking();
  window.requestAnimationFrame(runFallTrackingAnimation);
}

function applyVisualState(stateName) {
  const state = simulationStates[stateName];

  if (!state || !phoneShell) {
    return;
  }

  phoneShell.dataset.state = stateName;
  detectionTitle.textContent = state.title;
  aiStatus.textContent = state.status;
  confidence.textContent = `Confidence ${state.confidence}`;
  monitoringMessage.textContent = state.message;
  statusIndicatorText.textContent = state.indicator;
  resultIcon.textContent = state.icon;
}

function setActiveControl(stateName) {
  simulationButtons.forEach((button) => {
    const isActive = button.dataset.simulation === stateName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function waitForVideoReady(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(video.error || new Error("The video could not be loaded."));
    };
    const cleanup = () => {
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("canplay", handleReady, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(video.error || new Error("The video could not seek to the requested frame."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.currentTime = time;
  });
}

async function playVideoSafely() {
  try {
    await monitorVideo.play();
  } catch (error) {
    console.error("CareConnect monitor video could not autoplay:", error);
  }
}

async function switchVideo(source, shouldLoop) {
  if (!monitorVideo) {
    return false;
  }

  const requestId = ++videoSwitchRequest;
  monitorVideo.pause();
  monitorVideo.loop = shouldLoop;
  monitorVideo.muted = true;
  monitorVideo.playsInline = true;
  monitorVideo.src = source;
  monitorVideo.load();

  try {
    await waitForVideoReady(monitorVideo);
  } catch (error) {
    if (requestId === videoSwitchRequest) {
      console.error(`CareConnect monitor video failed to load: ${source}`, error);
    }
    return false;
  }

  if (requestId !== videoSwitchRequest) {
    return false;
  }

  monitorVideo.currentTime = 0;
  return true;
}

function updateTrackingFrame(frames, progress) {
  const frameIndex = frames.findIndex(
    (frame) => progress >= frame.start && progress < frame.end
  );

  if (frameIndex !== -1 && frameIndex !== currentTrackingFrame) {
    currentTrackingFrame = frameIndex;
    applyBoxPosition(frames[frameIndex]);
  }
}

async function updateFamilyEmergencyState(familyUid) {
  const familyStateReference = doc(db, "familyStates", familyUid);
  const familyStateSnapshot = await getDoc(familyStateReference);

  if (familyStateSnapshot.exists()) {
    const currentUnreadAlerts = Number(
      familyStateSnapshot.data()?.alerts?.unreadAlerts
    );
    const nextUnreadAlerts =
      Number.isFinite(currentUnreadAlerts) && currentUnreadAlerts >= 0
        ? currentUnreadAlerts + 1
        : 1;

    await updateDoc(familyStateReference, {
      "safety.safetyStatus": "Emergency",
      "safety.safetyMessage": "Fall detected",
      "activity.walkingStatus": "Fall detected",
      "activity.walkingDetail": "Just now · Living Room",
      "alerts.unreadAlerts": nextUnreadAlerts,
      updatedAt: serverTimestamp()
    });
    return;
  }

  await setDoc(familyStateReference, {
    safety: {
      safetyStatus: "Emergency",
      safetyMessage: "Fall detected"
    },
    activity: {
      walkingStatus: "Fall detected",
      walkingDetail: "Just now · Living Room"
    },
    alerts: {
      unreadAlerts: 1
    },
    updatedAt: serverTimestamp()
  });
}

async function createFallAlert() {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    console.warn(
      "CareConnect fall alert was not created because no authenticated user is signed in."
    );
    return;
  }

  if (!db) {
    console.error(
      "CareConnect fall alert could not be created because Firestore is unavailable."
    );
    return;
  }

  try {
    const alertDocument = await addDoc(collection(db, "alerts"), {
      familyUid: currentUser.uid,
      residentName: "Mom",
      emergencyType: "Fall Detected",
      location: "Living Room",
      confidence: 94,
      status: "Pending",
      videoType: "fall",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`CareConnect fall alert created: ${alertDocument.id}`);

    try {
      await updateFamilyEmergencyState(currentUser.uid);
      console.log("CareConnect family dashboard updated for the fall alert.");
    } catch (error) {
      console.error(
        "CareConnect family dashboard could not be updated for the fall alert:",
        error
      );
    }
  } catch (error) {
    console.error("CareConnect fall alert could not be created:", error);
  }
}

function triggerFallDetection() {
  if (activeSimulation !== "fall" || fallDetected) {
    return;
  }

  fallDetected = true;
  currentTrackingFrame = -1;
  setBoxVisibility(true);
  applyVisualState("fall");
  const finalKeyframe = FALL_TRACKING_KEYFRAMES[FALL_TRACKING_KEYFRAMES.length - 1];
  applyBoxPosition({
    left: `${finalKeyframe.left}%`,
    top: `${finalKeyframe.top}%`,
    width: `${finalKeyframe.width}%`,
    height: `${finalKeyframe.height}%`
  });

  if (!fallAlertCreated) {
    fallAlertCreated = true;
    void createFallAlert();
  }
}

function resetFallTrackingState() {
  fallDetected = false;
  currentTrackingFrame = -1;
  applyVisualState("normal");
  monitoringMessage.textContent = "Monitoring movement";
  setBoxVisibility(false);
}

function updateFakeTracking() {
  if (!monitorVideo || !Number.isFinite(monitorVideo.currentTime)) {
    return;
  }

  if (activeSimulation === "fall") {
    if (monitorVideo.currentTime >= FALL_DETECTION_TIME) {
      triggerFallDetection();
      return;
    }

    updateFallTracking();
    return;
  }

  if (activeSimulation === "normal") {
    updateNormalTracking();
  }
}

async function simulateNormal() {
  activeSimulation = "normal";
  fallDetected = false;
  fallAlertCreated = false;
  currentTrackingFrame = -1;
  setActiveControl("normal");
  applyVisualState("normal");
  setBoxVisibility(false);

  if (await switchVideo(NORMAL_VIDEO_SOURCE, true)) {
    updateFakeTracking();
    await playVideoSafely();
  }
}

async function simulateFall() {
  activeSimulation = "fall";
  fallAlertCreated = false;
  setActiveControl("fall");

  // The fall clip begins in the safe state and turns red at FALL_DETECTION_TIME.
  resetFallTrackingState();

  if (await switchVideo(FALL_VIDEO_SOURCE, false)) {
    updateFakeTracking();
    await playVideoSafely();
  }
}

async function simulateNoMovement() {
  activeSimulation = "no-movement";
  fallDetected = false;
  currentTrackingFrame = -1;
  setActiveControl("no-movement");
  applyVisualState("no-movement");
  setBoxVisibility(true);
  applyBoxPosition(fixedBoxPositions["no-movement"]);

  if (await switchVideo(NORMAL_VIDEO_SOURCE, false)) {
    try {
      await seekVideo(monitorVideo, NO_MOVEMENT_FRAME_TIME);

      if (activeSimulation === "no-movement") {
        monitorVideo.loop = false;
        monitorVideo.pause();
      }
    } catch (error) {
      console.error(
        `CareConnect monitor could not seek to ${NO_MOVEMENT_FRAME_TIME} seconds:`,
        error
      );
    }
  }
}

simulationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const simulation = button.dataset.simulation;

    if (simulation === "normal") {
      simulateNormal();
    } else if (simulation === "fall") {
      simulateFall();
    } else if (simulation === "no-movement") {
      simulateNoMovement();
    }
  });
});

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "home.html";
  });
}

if (monitorVideo) {
  monitorVideo.addEventListener("timeupdate", updateFakeTracking);
  monitorVideo.addEventListener("seeked", updateFakeTracking);
  monitorVideo.addEventListener("play", () => {
    if (activeSimulation === "no-movement") {
      monitorVideo.pause();
    }
  });
  monitorVideo.addEventListener("seeking", () => {
    if (
      activeSimulation === "fall" &&
      monitorVideo.currentTime < 0.1
    ) {
      resetFallTrackingState();
    }
  });
  monitorVideo.addEventListener("ended", () => {
    if (activeSimulation === "fall") {
      if (monitorVideo.currentTime >= FALL_DETECTION_TIME) {
        triggerFallDetection();
      }
      monitorVideo.pause();
    }
  });
}

updateLiveClock();
setInterval(updateLiveClock, 1000);
window.requestAnimationFrame(runNormalTrackingAnimation);
window.requestAnimationFrame(runFallTrackingAnimation);
simulateNormal();
