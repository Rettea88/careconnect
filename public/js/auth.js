import { auth, db, isFirebaseConfigPlaceholder } from "./firebase-service.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const LOGIN_KEY = "careconnect_family_logged_in";
const UID_KEY = "careconnect_family_uid";

function getPageName() {
  const path = window.location.pathname;
  return path.substring(path.lastIndexOf("/") + 1) || "index.html";
}

function showAuthMessage(message, type) {
  const element = document.getElementById("authMessage") || document.getElementById("loginMessage");

  if (!element) {
    return;
  }

  element.textContent = message || "";
  element.classList.remove("error", "success", "info");

  if (type) {
    element.classList.add(type);
  }
}

function setButtonLoading(button, isLoading, loadingText, normalText) {
  if (!button) {
    return;
  }

  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
  button.textContent = isLoading ? loadingText : normalText;
}

function getFriendlyError(error) {
  const code = error && (error.code || error.message);

  console.error(error);

  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in instead.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters.";
  }

  if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Email or password is incorrect.";
  }

  if (code === "auth/network-request-failed") {
    return "Network error. Please check your connection.";
  }

  if (code === "permission-denied") {
    return "Permission denied. Please check your Firestore security rules.";
  }

  return "Something went wrong. Please try again.";
}

function getEmailPrefix(email) {
  return String(email || "family").split("@")[0].replace(/[._-]+/g, " ").trim() || "family";
}

function titleCaseName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function createInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "CC";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function stripFirestoreMeta(data) {
  const cleanData = Object.assign({}, data);
  delete cleanData.ownerUid;
  delete cleanData.updatedAt;
  return cleanData;
}

function createDefaultFamilyState(user) {
  const fallbackName = titleCaseName(getEmailPrefix(user && user.email));
  const userName = (user && user.displayName) || fallbackName || "Sarah Chen";

  return {
    user: {
      userName: userName,
      userInitials: createInitials(userName)
    },
    elderly: {
      elderlyName: "Mom",
      room: "Living Room"
    },
    safety: {
      safetyStatus: "Safe",
      safetyMessage: "All systems normal",
      cameraStatus: "Camera Online",
      battery: 98
    },
    activity: {
      walkingStatus: "Walking",
      walkingDetail: "2 min ago · steady pace"
    },
    alerts: {
      unreadAlerts: 2
    }
  };
}

async function saveNewUserProfile(user, displayName) {
  if (!db || !user) {
    throw new Error("Firebase is not ready.");
  }

  const cleanDisplayName = displayName.trim();
  const profileData = {
    uid: user.uid,
    email: user.email || "",
    displayName: cleanDisplayName,
    role: "family",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const familyState = createDefaultFamilyState({
    uid: user.uid,
    email: user.email,
    displayName: cleanDisplayName
  });

  await setDoc(doc(db, "users", user.uid), profileData);
  await setDoc(doc(db, "familyStates", user.uid), Object.assign({}, familyState, {
    ownerUid: user.uid,
    updatedAt: serverTimestamp()
  }));

  if (window.CareConnectData) {
    window.CareConnectData.setFamilyStateFromRemote(familyState);
  }

  return familyState;
}

async function loadFamilyStateFromFirestore(user) {
  if (!db || !user) {
    throw new Error("Firebase is not ready.");
  }

  try {
    const familyStateRef = doc(db, "familyStates", user.uid);
    const familyStateSnapshot = await getDoc(familyStateRef);
    let familyState;

    if (familyStateSnapshot.exists()) {
      familyState = stripFirestoreMeta(familyStateSnapshot.data());
    } else {
      familyState = createDefaultFamilyState(user);
      await setDoc(familyStateRef, Object.assign({}, familyState, {
        ownerUid: user.uid,
        updatedAt: serverTimestamp()
      }));
    }

    if (window.CareConnectData) {
      window.CareConnectData.setFamilyStateFromRemote(familyState);
    } else {
      localStorage.setItem("careconnect_family_state", JSON.stringify(familyState));
    }

    return familyState;
  } catch (error) {
    console.warn("Could not load family state from Firestore. Falling back to local cache.", error);

    if (window.CareConnectData) {
      return window.CareConnectData.getFamilyState();
    }

    return null;
  }
}

function setAuthMode(mode) {
  const isSignUp = mode === "signup";
  const loginForm = document.getElementById("familyLoginForm");
  const signupForm = document.getElementById("familySignupForm");
  const signInButton = document.querySelector("[data-auth-mode='signin']");
  const signUpButton = document.querySelector("[data-auth-mode='signup']");
  const caption = document.querySelector(".screen-caption");

  if (loginForm) {
    loginForm.classList.toggle("hidden", isSignUp);
  }

  if (signupForm) {
    signupForm.classList.toggle("hidden", !isSignUp);
  }

  if (signInButton) {
    signInButton.classList.toggle("active", !isSignUp);
  }

  if (signUpButton) {
    signUpButton.classList.toggle("active", isSignUp);
  }

  if (caption) {
    caption.textContent = isSignUp ? "1. Sign Up" : "1. Login";
  }

  showAuthMessage("", "info");
}

function rememberLogin(user) {
  localStorage.setItem(LOGIN_KEY, "true");
  localStorage.setItem(UID_KEY, user.uid);
}

function clearLoginCache() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(UID_KEY);
}

function requireFirebaseReady() {
  if (!auth || !db || isFirebaseConfigPlaceholder) {
    showAuthMessage("Please paste your Firebase web app config in js/firebase-config.js first.", "info");
    return false;
  }

  return true;
}

function handleLoginPage() {
  if (getPageName() !== "login.html") {
    return;
  }

  const loginForm = document.getElementById("familyLoginForm");
  const signupForm = document.getElementById("familySignupForm");
  const forgotPasswordButton = document.getElementById("forgotPasswordButton");
  const switchToSignup = document.getElementById("switchToSignupLink");
  const switchToSignin = document.getElementById("switchToSigninLink");
  const signInModeButton = document.querySelector("[data-auth-mode='signin']");
  const signUpModeButton = document.querySelector("[data-auth-mode='signup']");
  let authActionInProgress = false;

  setAuthMode("signin");

  if (!auth || !db) {
    showAuthMessage("Firebase could not start. Please check js/firebase-config.js.", "error");
    return;
  }

  signInModeButton && signInModeButton.addEventListener("click", function () {
    setAuthMode("signin");
  });

  signUpModeButton && signUpModeButton.addEventListener("click", function () {
    setAuthMode("signup");
  });

  switchToSignup && switchToSignup.addEventListener("click", function (event) {
    event.preventDefault();
    setAuthMode("signup");
  });

  switchToSignin && switchToSignin.addEventListener("click", function (event) {
    event.preventDefault();
    setAuthMode("signin");
  });

  onAuthStateChanged(auth, async function (user) {
    if (!user || getPageName() !== "login.html") {
      return;
    }

    if (authActionInProgress) {
      return;
    }

    try {
      rememberLogin(user);
      await loadFamilyStateFromFirestore(user);
      window.location.replace("home.html");
    } catch (error) {
      showAuthMessage(getFriendlyError(error), "error");
    }
  });

  loginForm && loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = loginForm.querySelector("button[type='submit']");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAuthMessage("Please enter both email and password.", "error");
      return;
    }

    if (!requireFirebaseReady()) {
      return;
    }

    setButtonLoading(button, true, "Signing In...", "Sign In");
    authActionInProgress = true;
    let signedIn = false;

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      rememberLogin(credential.user);
      await loadFamilyStateFromFirestore(credential.user);
      showAuthMessage("Signed in successfully. Opening dashboard...", "success");
      signedIn = true;
      window.setTimeout(function () {
        window.location.href = "home.html";
      }, 450);
    } catch (error) {
      authActionInProgress = false;
      showAuthMessage(getFriendlyError(error), "error");
    } finally {
      if (!signedIn) {
        authActionInProgress = false;
      }
      setButtonLoading(button, false, "Signing In...", "Sign In");
    }
  });

  signupForm && signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = signupForm.querySelector("button[type='submit']");
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!fullName) {
      showAuthMessage("Please enter your full name.", "error");
      return;
    }

    if (!email) {
      showAuthMessage("Please enter your email.", "error");
      return;
    }

    if (password.length < 6) {
      showAuthMessage("Password should be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showAuthMessage("Confirm password must match your password.", "error");
      return;
    }

    if (!requireFirebaseReady()) {
      return;
    }

    setButtonLoading(button, true, "Creating...", "Create Account");
    authActionInProgress = true;
    let accountCreated = false;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName });
      await saveNewUserProfile(credential.user, fullName);
      rememberLogin(credential.user);
      showAuthMessage("Account created. Opening dashboard...", "success");
      accountCreated = true;
      window.setTimeout(function () {
        window.location.href = "home.html";
      }, 450);
    } catch (error) {
      authActionInProgress = false;
      showAuthMessage(getFriendlyError(error), "error");
    } finally {
      if (!accountCreated) {
        authActionInProgress = false;
      }
      setButtonLoading(button, false, "Creating...", "Create Account");
    }
  });

  forgotPasswordButton && forgotPasswordButton.addEventListener("click", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
      showAuthMessage("Please enter your email first.", "info");
      return;
    }

    if (!requireFirebaseReady()) {
      return;
    }

    setButtonLoading(forgotPasswordButton, true, "Sending...", "Forgot password?");

    try {
      await sendPasswordResetEmail(auth, email);
      showAuthMessage("Password reset email sent. Please check your inbox.", "success");
    } catch (error) {
      showAuthMessage(getFriendlyError(error), "error");
    } finally {
      setButtonLoading(forgotPasswordButton, false, "Sending...", "Forgot password?");
    }
  });
}

function handleHomeAuthGuard() {
  if (getPageName() !== "home.html") {
    return;
  }

  if (!auth || !db) {
    console.warn("Firebase could not start. Home will use local demo data only.");
    window.CareConnectFamily && window.CareConnectFamily.renderHomeDashboard();
    return;
  }

  onAuthStateChanged(auth, async function (user) {
    if (!user) {
      clearLoginCache();
      window.location.replace("login.html");
      return;
    }

    try {
      rememberLogin(user);
      const familyState = await loadFamilyStateFromFirestore(user);

      if (familyState && familyState.user && !familyState.user.userName) {
        familyState.user.userName = user.displayName || titleCaseName(getEmailPrefix(user.email));
      }

      if (window.CareConnectFamily) {
        window.CareConnectFamily.renderHomeDashboard();
      }
    } catch (error) {
      console.warn("Home auth guard fell back to local demo data.", error);

      if (window.CareConnectFamily) {
        window.CareConnectFamily.renderHomeDashboard();
        window.CareConnectFamily.showToast("Using local demo data because Firestore could not be loaded.");
      }
    }
  });
}

function handleLogout() {
  const logoutButton = document.getElementById("logoutButton");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async function () {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    } finally {
      clearLoginCache();
      window.location.href = "login.html";
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  handleLoginPage();
  handleHomeAuthGuard();
  handleLogout();
});

export {
  getPageName,
  showAuthMessage,
  setButtonLoading,
  createDefaultFamilyState,
  saveNewUserProfile,
  loadFamilyStateFromFirestore,
  handleLoginPage,
  handleHomeAuthGuard,
  handleLogout
};
