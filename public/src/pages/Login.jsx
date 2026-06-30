import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { toastEvent } from '../components/Toast';
import { useFamilyData } from '../context/FamilyContext';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, sendPasswordResetEmail, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function Login() {
  const navigate = useNavigate();
  const { currentUser } = useFamilyData() || {};
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isPhoneLoginOpen, setIsPhoneLoginOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  if (currentUser) {
    return <Navigate to="/home" replace />;
  }

  const getFriendlyError = (error) => {
    const code = error.code;
    if (code === "auth/email-already-in-use") return "This email is already registered. Please sign in instead.";
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Email or password is incorrect.";
    if (code === "auth/network-request-failed") return "Network error. Please check your connection.";
    if (code === "auth/invalid-phone-number") return "Enter a phone number with country code.";
    if (code === "auth/invalid-verification-code") return "The verification code is incorrect.";
    if (code === "auth/operation-not-allowed") return "This sign-in method is not enabled in Firebase.";
    return "Something went wrong. Please try again.";
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toastEvent.show("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toastEvent.show("Signed in successfully!");
      navigate('/home');
    } catch (error) {
      toastEvent.show(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toastEvent.show("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toastEvent.show("Password should be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(cred.user, { displayName: fullName });

      const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CC';

      const familyStateRef = doc(db, "familyStates", cred.user.uid);
      await setDoc(familyStateRef, {
        user: { userName: fullName, userInitials: initials },
        elderly: { elderlyName: "Mom", room: "Living Room" },
        safety: { safetyStatus: "Safe", safetyMessage: "All systems normal", cameraStatus: "Camera Online", battery: 98 },
        activity: { walkingStatus: "Walking", walkingDetail: "2 min ago · steady pace" },
        alerts: { unreadAlerts: 2 },
        ownerUid: cred.user.uid,
        updatedAt: serverTimestamp()
      });

      toastEvent.show("Account created successfully!");
      navigate('/home');
    } catch (error) {
      toastEvent.show(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toastEvent.show("Enter your email first, then request a reset link.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toastEvent.show("Password reset email sent.");
    } catch (error) {
      toastEvent.show(getFriendlyError(error));
    }
  };

  const getRecaptchaVerifier = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phone-recaptcha', {
        size: 'invisible'
      });
    }

    return window.recaptchaVerifier;
  };

  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      toastEvent.show("Enter a phone number with country code.");
      return;
    }

    setIsLoading(true);
    try {
      const verifier = getRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, phoneNumber.trim(), verifier);
      setConfirmationResult(result);
      toastEvent.show("Verification code sent.");
    } catch (error) {
      toastEvent.show(getFriendlyError(error));
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!confirmationResult || !phoneCode.trim()) {
      toastEvent.show("Enter the verification code.");
      return;
    }

    setIsLoading(true);
    try {
      await confirmationResult.confirm(phoneCode.trim());
      toastEvent.show("Phone sign-in successful.");
      navigate('/home');
    } catch (error) {
      toastEvent.show(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-content">
      <div className="login-brand">
        <div className="brand-logo" aria-hidden="true">
          <span className="brand-heart">♥</span>
          <span className="verified-badge">✓</span>
        </div>
        <h1>CareConnect</h1>
        <p>Care, connected.</p>

        <div className="auth-mode-switch">
          <button 
            className={`auth-mode-button ${!isSignUp ? 'active' : ''}`} 
            onClick={() => { setIsSignUp(false); setEmail(''); setPassword(''); }}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={`auth-mode-button ${isSignUp ? 'active' : ''}`} 
            onClick={() => { setIsSignUp(true); setEmail(''); setPassword(''); setFullName(''); }}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </div>

      {!isSignUp ? (
        <form className="login-form" onSubmit={handleLoginSubmit}>
          <label className="input-pill" htmlFor="email">
            <span className="input-icon">✉</span>
            <input 
              id="email" 
              type="email" 
              placeholder="sarah@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="input-pill" htmlFor="password">
            <span className="input-icon">🔒</span>
            <input 
              id="password" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          
          <button className={`primary-button ${isLoading ? 'is-loading' : ''}`} type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
          
          <div className="login-links">
            <p>New here? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(true); }}>Sign Up</a></p>
            <button className="secondary-text-button" type="button" onClick={handlePasswordReset}>Forgot password?</button>
          </div>
        </form>
      ) : (
        <form className="login-form auth-extra-fields" onSubmit={handleSignupSubmit}>
          <label className="input-pill" htmlFor="fullName">
            <span className="input-icon">👤</span>
            <input 
              id="fullName" 
              type="text" 
              placeholder="Full name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="input-pill" htmlFor="signupEmail">
            <span className="input-icon">✉</span>
            <input 
              id="signupEmail" 
              type="email" 
              placeholder="sarah@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="input-pill" htmlFor="signupPassword">
            <span className="input-icon">🔒</span>
            <input 
              id="signupPassword" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          
          <button className={`primary-button ${isLoading ? 'is-loading' : ''}`} type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Account"}
          </button>
          
          <div className="login-links single-link">
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(false); }}>Sign In</a></p>
          </div>
        </form>
      )}

      <div className="divider" aria-hidden="true">
        <span></span><strong>OR</strong><span></span>
      </div>

      {!isPhoneLoginOpen ? (
        <button className="phone-login-button" type="button" onClick={() => setIsPhoneLoginOpen(true)}>
          Login with Phone Number
        </button>
      ) : (
        <div className="phone-auth-panel">
          <label className="input-pill" htmlFor="phoneNumber">
            <span className="input-icon">☎</span>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="+1 555 010 1234"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </label>
          {confirmationResult && (
            <label className="input-pill" htmlFor="phoneCode">
              <span className="input-icon">#</span>
              <input
                id="phoneCode"
                inputMode="numeric"
                placeholder="Verification code"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
              />
            </label>
          )}
          <div id="phone-recaptcha"></div>
          <div className="phone-auth-actions">
            <button type="button" onClick={() => setIsPhoneLoginOpen(false)}>Cancel</button>
            <button type="button" onClick={confirmationResult ? handleVerifyPhoneCode : handleSendPhoneCode} disabled={isLoading}>
              {confirmationResult ? "Verify" : "Send code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
