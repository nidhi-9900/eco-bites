'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribe = null;
    let isMounted = true;

    // Check for redirect result first (fallback for mobile)
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && isMounted) {
          console.log('✅ Redirect sign-in successful (fallback):', result.user.email);
        }
      } catch (error) {
        // No redirect result - that's fine, we'll use popup primarily
      }
    };

    checkRedirectResult();

    // Set up auth state listener
    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      setUser(user);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      console.error('❌ Firebase not configured');
      throw new Error('Firebase not configured');
    }
    
    // Try popup first (works better on desktop)
    try {
      console.log('🚀 Attempting Google sign-in with popup...');
      await signInWithPopup(auth, googleProvider);
      console.log('✅ Popup sign-in successful');
    } catch (popupError) {
      // Don't fall back if user closed the popup intentionally
      if (popupError.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ User closed the popup');
        throw popupError;
      }
      
      // If popup is blocked or on mobile, fall back to redirect
      console.log('⚠️ Popup failed, falling back to redirect:', popupError.message);
      
      // Check if it's a popup blocked error or mobile device
      const isPopupBlocked = popupError.code === 'auth/popup-blocked';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isPopupBlocked || isMobile) {
        try {
          console.log('🔄 Using redirect method as fallback...');
          await signInWithRedirect(auth, googleProvider);
          // User will be redirected, so this won't execute
        } catch (redirectError) {
          console.error('❌ Redirect also failed:', redirectError);
          throw redirectError;
        }
      } else {
        // Re-throw the original popup error if it's not a popup-related issue
        throw popupError;
      }
    }
  };

  const signOut = async () => {
    if (!auth) {
      throw new Error('Firebase not configured');
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

