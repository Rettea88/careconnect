import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const FamilyContext = createContext();

const defaultFamilyState = {
  user: { userName: "Sarah Chen", userInitials: "SC" },
  elderly: { elderlyName: "Mom", room: "Living Room" },
  safety: { safetyStatus: "Safe", safetyMessage: "All systems normal", cameraStatus: "Camera Online", battery: 98 },
  activity: { walkingStatus: "Walking", walkingDetail: "2 min ago · steady pace" },
  alerts: { unreadAlerts: 2 }
};

export function FamilyProvider({ children }) {
  const [familyState, setFamilyState] = useState(defaultFamilyState);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateFamilyState = useCallback(async (updates) => {
    setFamilyState((current) => ({ ...current, ...updates }));

    if (!currentUser) {
      return;
    }

    try {
      await updateDoc(doc(db, "familyStates", currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to update family state:", error);
    }
  }, [currentUser]);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      setCurrentUser(user);

      if (user) {
        try {
          const familyStateRef = doc(db, "familyStates", user.uid);
          const docSnap = await getDoc(familyStateRef);

          if (!docSnap.exists()) {
            await setDoc(familyStateRef, {
              ...defaultFamilyState,
              ownerUid: user.uid,
              updatedAt: serverTimestamp()
            });
          }

          unsubscribeDoc = onSnapshot(
            familyStateRef,
            (docSnapshot) => {
              if (docSnapshot.exists()) {
                setFamilyState({ ...defaultFamilyState, ...docSnapshot.data() });
              }
              setLoading(false);
            },
            (error) => {
              console.error("Family state subscription failed:", error);
              setFamilyState(defaultFamilyState);
              setLoading(false);
            }
          );
        } catch (error) {
          console.error("Failed to load family state:", error);
          setFamilyState(defaultFamilyState);
          setLoading(false);
        }
      } else {
        setFamilyState(defaultFamilyState);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
      unsubscribeAuth();
    };
  }, []);

  const value = { ...familyState, currentUser, loading, updateFamilyState };

  return (
    <FamilyContext.Provider value={value}>
      {!loading && children}
    </FamilyContext.Provider>
  );
}

export const useFamilyData = () => useContext(FamilyContext);
