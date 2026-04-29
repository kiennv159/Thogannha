import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  refreshLocation: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  subscribe: (plan: 'basic' | 'enterprise', amount: number) => Promise<void>;
  location: { latitude: number, longitude: number } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const subscribe = async (plan: 'basic' | 'enterprise', amount: number) => {
    if (!user) return;
    const path = `subscriptions/${user.uid}`;
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const subData = {
        userId: user.uid,
        plan,
        amount,
        status: 'pending',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'subscriptions'), subData);
      
      // Also notify admin
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin', // System-wide admin notification
        title: 'Đăng ký thuê bao mới',
        message: `Người dùng ${user.displayName} đã đăng ký gói ${plan === 'basic' ? 'Cơ bản' : 'Doanh nghiệp'}.`,
        type: 'subscription',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Yêu cầu đăng ký đã được gửi. Vui lòng chờ xác nhận thanh toán.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateLocation = async (latitude: number, longitude: number) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        location: { latitude, longitude },
      }, { merge: true });
      setLocation({ latitude, longitude });
      console.log("Location updated:", latitude, longitude);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const refreshLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt của bạn không hỗ trợ định vị.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Vui lòng cho phép quyền truy cập vị trí để tìm thợ gần bạn.");
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && profile) {
      refreshLocation();
    }
  }, [user, !!profile]);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        setProfile(data);
        if (data.location) {
          setLocation({ latitude: data.location.latitude, longitude: data.location.longitude });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile fetch error:", error);
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {}
    });

    return unsubscribe;
  }, [user]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign in error:", error);
      setLoading(false);
      
      if (error.code === 'auth/popup-blocked') {
        toast.error("Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép hiện popup.");
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error("Tên miền này chưa được cấp quyền trong Firebase Console. Vui lòng thêm domain Vercel vào 'Authorized domains' trong thiết lập Authentication.");
      } else {
        toast.error("Lỗi đăng nhập: " + (error.message || "Vui lòng thử lại."));
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateRole = async (role: UserRole) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    
    const isApproved = role === 'customer' || role === 'admin';
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        role: (user.email === 'haubg.info@gmail.com' && role === 'admin') ? 'admin' : role,
        isApproved,
        isVerified: false,
        isReputable: false,
        completedJobsCount: 0,
        subscriptionPlan: 'none',
        createdAt: new Date().toISOString(),
      }, { merge: true });

      // Notify admin about new registration
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        title: 'Người dùng mới đăng ký',
        message: `Người dùng ${user.displayName} (${role}) vừa đăng ký tài khoản.`,
        type: 'new_registration',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Đã thiết lập vai trò người dùng!");
    } catch (error) {
      toast.error("Lỗi thiết lập vai trò. Vui lòng thử lại.");
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      logout, 
      updateRole, 
      updateLocation, 
      refreshLocation,
      updateProfile,
      subscribe,
      location
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
