import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  Zap, 
  Droplets, 
  Cpu, 
  Home, 
  Sparkles, 
  Hammer, 
  Paintbrush, 
  MoreHorizontal,
  Search,
  MapPin,
  Star,
  Clock,
  User as UserIcon,
  LogOut,
  Bell,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Navigation,
  Send,
  X,
  CreditCard,
  Wallet,
  Crown,
  CheckCircle,
  Users,
  BarChart3,
  XCircle,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useAuth, AuthProvider } from './AuthContext';
import { 
  UserProfile, 
  ServiceRequest, 
  SERVICE_CATEGORIES, 
  Location, 
  ChatMessage, 
  ChatRoom, 
  Subscription, 
  AppNotification, 
  Complaint, 
  RevenueRecord 
} from './types';
import { Modal } from './components/Modal';
import { cn } from './lib/utils';

// Helper to calculate distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const formatPriceRange = (min: number, max: number) => {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Đã có lỗi xảy ra.";
      try {
        const errorData = JSON.parse(this.state.error.message);
        if (errorData.error.includes("insufficient permissions")) {
          errorMessage = "Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra lại tài khoản.";
        }
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi ứng dụng</h2>
          <p className="text-gray-500 mb-6 max-w-xs">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 text-white font-bold py-3 px-8 rounded-xl"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const ServiceIcon = ({ name, className, colorClass }: { name: string, className?: string, colorClass?: string }) => {
  const IconComponent = () => {
    switch (name) {
      case 'Zap': return <Zap className={className} />;
      case 'Droplets': return <Droplets className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Home': return <Home className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      case 'Paintbrush': return <Paintbrush className={className} />;
      default: return <MoreHorizontal className={className} />;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      className={cn("flex items-center justify-center rounded-xl", colorClass)}
    >
      <IconComponent />
    </motion.div>
  );
};

const WorkerCard = ({ worker, onSelect }: { worker: UserProfile, onSelect: (w: UserProfile) => void }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(worker)}
      className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 cursor-pointer flex gap-4 transition-shadow hover:shadow-md relative overflow-hidden"
    >
      {worker.isReputable && (
        <div className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter z-10">
          THỢ UY TÍN
        </div>
      )}
      <div className="relative">
        <img 
          src={worker.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.uid}`} 
          alt={worker.displayName}
          className="w-20 h-20 rounded-xl object-cover shadow-sm"
          referrerPolicy="no-referrer"
        />
        {worker.isOnline && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse-soft" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1 min-w-0">
            <h4 className="font-bold text-gray-900 truncate">{worker.displayName}</h4>
            {worker.isVerified && (
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100 shrink-0">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-yellow-700">{worker.rating?.toFixed(1) || '5.0'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">
          {worker.services?.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.name).join(', ')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            <CreditCard className="w-3 h-3" />
            <span>Từ {formatPrice(Math.min(...(worker.services?.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.minPrice || 0) || [0])))}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>{worker.completedJobsCount || 0} đơn hoàn thành</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            <MapPin className="w-3 h-3 text-orange-500" />
            <span>0.8 km</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>15-20 phút</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RequestCard = ({ request, showCustomer = false, onChat, onComplete, onPay, onComplaint }: { 
  request: ServiceRequest, 
  showCustomer?: boolean,
  onChat?: () => void,
  onComplete?: () => void,
  onPay?: () => void,
  onComplaint?: () => void
}) => {
  const statusColors = {
    pending: 'bg-blue-50 text-blue-700 border-blue-100',
    accepted: 'bg-purple-50 text-purple-700 border-purple-100',
    completed: 'bg-green-50 text-green-700 border-green-100',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cancelled: 'bg-gray-50 text-gray-700 border-gray-100',
  };

  const category = SERVICE_CATEGORIES.find(c => c.id === request.serviceType);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft mb-3"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category?.lightColor || 'bg-orange-100')}>
            <ServiceIcon 
              name={category?.icon || 'MoreHorizontal'} 
              className={cn("w-4 h-4", category?.textColor || 'text-orange-600')} 
            />
          </div>
          <span className="font-bold text-gray-900">{category?.name}</span>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider", statusColors[request.status])}>
          {request.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3 font-medium">{request.description}</p>
      
      {category && (
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg w-fit">
          <CreditCard className="w-3 h-3 text-orange-500" />
          <span>Giá tham khảo: {formatPriceRange(category.minPrice, category.maxPrice)}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
        </div>
        {showCustomer && request.customerName && (
          <div className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            <span>Khách: {request.customerName}</span>
          </div>
        )}
        {!showCustomer && request.workerName && (
          <div className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            <span>Thợ: {request.workerName}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {request.status === 'accepted' && (
          <>
            <button 
              onClick={onChat}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              CHAT
            </button>
            {onComplete && (
              <button 
                onClick={onComplete}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                HOÀN THÀNH
              </button>
            )}
            <button 
              onClick={onComplaint}
              className="px-3 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
              title="Khiếu nại"
            >
              <AlertTriangle className="w-3 h-3" />
            </button>
          </>
        )}
        {request.status === 'completed' && onPay && (
          <button 
            onClick={onPay}
            className="w-full flex items-center justify-center gap-2 py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors"
          >
            <Wallet className="w-3 h-3" />
            THANH TOÁN
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

function MainApp() {
  const { user, profile, loading, signIn, logout, updateRole, updateLocation, refreshLocation, updateProfile, subscribe } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'requests' | 'profile' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [isQuickSearching, setIsQuickSearching] = useState(false);
  const [nearbyWorkers, setNearbyWorkers] = useState<UserProfile[]>([]);
  const [nearbyRequests, setNearbyRequests] = useState<ServiceRequest[]>([]);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingDescription, setBookingDescription] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [chatModal, setChatModal] = useState<{ open: boolean, requestId: string | null, otherPartyId: string | null }>({ open: false, requestId: null, otherPartyId: null });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean, request: ServiceRequest | null }>({ open: false, request: null });
  const [subscriptionModal, setSubscriptionModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [mySubscription, setMySubscription] = useState<Subscription | null>(null);
  const [postRequestModal, setPostRequestModal] = useState(false);
  const [postRequestDescription, setPostRequestDescription] = useState('');
  const [postRequestCategory, setPostRequestCategory] = useState<string>('electrical');
  const [isPostingRequest, setIsPostingRequest] = useState(false);
  const [notificationModal, setNotificationModal] = useState(false);
  const [complaintModal, setComplaintModal] = useState<{ open: boolean, requestId?: string, targetId?: string }>({ open: false });
  const [complaintContent, setComplaintContent] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [address, setAddress] = useState<string>('Đang xác định...');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allRequests, setAllRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [revenueRecords, setRevenueRecords] = useState<RevenueRecord[]>([]);

  // Mock data for initial view if DB is empty
  const mockWorkers: UserProfile[] = [
    { uid: 'w1', email: 'tuan@example.com', displayName: 'Nguyễn Văn Tuấn', photoURL: '', role: 'worker', rating: 4.8, reviewCount: 12, services: ['electrical', 'plumbing'], isOnline: true, isApproved: true, createdAt: '' },
    { uid: 'w2', email: 'hung@example.com', displayName: 'Trần Minh Hùng', photoURL: '', role: 'worker', rating: 4.9, reviewCount: 25, services: ['electronics', 'appliances'], isOnline: true, isApproved: true, createdAt: '' },
    { uid: 'w3', email: 'lan@example.com', displayName: 'Lê Thị Lan', photoURL: '', role: 'worker', rating: 4.7, reviewCount: 8, services: ['cleaning'], isOnline: false, isApproved: true, createdAt: '' },
  ];

  const mockRequests: ServiceRequest[] = [
    { id: 'r1', customerId: 'c1', customerName: 'Anh Hoàng', serviceType: 'electrical', description: 'Sửa ổ điện bị cháy khét ở phòng khách', status: 'pending', location: { latitude: 0, longitude: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r2', customerId: 'c2', customerName: 'Chị Mai', serviceType: 'plumbing', description: 'Vòi nước bồn rửa chén bị rò rỉ mạnh', status: 'pending', location: { latitude: 0, longitude: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'r3', customerId: 'c3', customerName: 'Chú Bảy', serviceType: 'appliances', description: 'Máy giặt không thoát nước được', status: 'pending', location: { latitude: 0, longitude: 0 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  useEffect(() => {
    if (profile?.location) {
      const fetchAddress = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${profile.location!.latitude}&lon=${profile.location!.longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name.split(',').slice(0, 2).join(','));
          } else {
            setAddress(`${profile.location!.latitude.toFixed(4)}, ${profile.location!.longitude.toFixed(4)}`);
          }
        } catch (e) {
          setAddress(`${profile.location!.latitude.toFixed(4)}, ${profile.location!.longitude.toFixed(4)}`);
        }
      };
      fetchAddress();
    }
  }, [profile?.location]);

  useEffect(() => {
    if (!user) return;

    // Fetch nearby workers (for customers)
    let unsubWorkers = () => {};
    if (profile?.role === 'customer') {
      const workersPath = 'users';
      const workersQuery = query(
        collection(db, 'users'), 
        where('role', '==', 'worker'), 
        where('isApproved', '==', true),
        limit(10)
      );
      unsubWorkers = onSnapshot(workersQuery, (snapshot) => {
        const workers = snapshot.docs.map(doc => doc.data() as UserProfile);
        setNearbyWorkers(workers.length > 0 ? workers : mockWorkers);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, workersPath);
      });
    }

    // Fetch nearby requests (for workers)
    let unsubNearbyRequests = () => {};
    if (profile?.role === 'worker' && profile.isApproved) {
      const nearbyRequestsPath = 'requests';
      const nearbyRequestsQuery = query(
        collection(db, 'requests'),
        where('status', '==', 'pending'),
        limit(10)
      );
      unsubNearbyRequests = onSnapshot(nearbyRequestsQuery, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
        setNearbyRequests(requests.length > 0 ? requests : mockRequests);

        // Job notifications for workers
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const request = { id: change.doc.id, ...change.doc.data() } as ServiceRequest;
            const requestTime = new Date(request.createdAt).getTime();
            const now = new Date().getTime();
            if (now - requestTime > 30000) return;

            if (profile?.location && request.location) {
              const dist = getDistance(
                profile.location.latitude,
                profile.location.longitude,
                request.location.latitude,
                request.location.longitude
              );

              if (dist <= 10) {
                addDoc(collection(db, 'notifications'), {
                  userId: user.uid,
                  title: 'Có công việc mới gần bạn!',
                  message: `Yêu cầu ${request.serviceType} mới tại ${request.location.address?.split(',')[0] || 'vị trí gần bạn'}`,
                  type: 'job',
                  isRead: false,
                  createdAt: new Date().toISOString(),
                  requestId: request.id
                }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'notifications'));
              }
            }
          }
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, nearbyRequestsPath);
      });
    }

    // Fetch my requests
    const requestsPath = 'requests';
    const requestsQuery = query(
      collection(db, 'requests'), 
      where(profile?.role === 'worker' ? 'workerId' : 'customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, requestsPath);
    });

    // Fetch all data for admin
    let unsubAllUsers = () => {};
    let unsubAllRequests = () => {};
    let unsubAllSubs = () => {};
    let unsubComplaints = () => {};
    let unsubRevenue = () => {};

    if (profile?.role === 'admin') {
      const usersPath = 'users';
      unsubAllUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, usersPath);
      });

      const allRequestsPath = 'requests';
      unsubAllRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
        setAllRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, allRequestsPath);
      });

      unsubAllSubs = onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
        setAllSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
      });

      unsubComplaints = onSnapshot(collection(db, 'complaints'), (snapshot) => {
        setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
      });

      unsubRevenue = onSnapshot(collection(db, 'revenue'), (snapshot) => {
        setRevenueRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevenueRecord)));
      });
    }

    // Fetch notifications for current user
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', 'in', [user.uid, 'admin']), orderBy('createdAt', 'desc'), limit(20)),
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(newNotifications);
        
        // Show toast for new unread notifications
        const unread = newNotifications.filter(n => !n.isRead);
        if (unread.length > 0 && notifications.length > 0 && unread.length > notifications.filter(n => !n.isRead).length) {
          toast.info(unread[0].title, { description: unread[0].message });
        }
      }
    );

    return () => {
      unsubWorkers();
      unsubNearbyRequests();
      unsubRequests();
      unsubAllUsers();
      unsubAllRequests();
      unsubAllSubs();
      unsubComplaints();
      unsubRevenue();
      unsubNotifications();
    };
  }, [user, profile]);

  useEffect(() => {
    if (!user || !chatModal.open || !chatModal.requestId) return;

    const chatId = [user.uid, chatModal.otherPartyId].sort().join('_');
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    });

    return () => unsubMessages();
  }, [user, chatModal]);

  useEffect(() => {
    if (!user) return;
    const subQuery = query(collection(db, 'subscriptions'), where('userId', '==', user.uid), limit(1));
    const unsubSub = onSnapshot(subQuery, (snapshot) => {
      if (!snapshot.empty) {
        setMySubscription({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription);
      }
    });
    return () => unsubSub();
  }, [user]);

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || !chatModal.requestId) return;
    const chatId = [user.uid, chatModal.otherPartyId].sort().join('_');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  const handleCompleteService = async (requestId: string) => {
    if (!user || !profile || profile.role !== 'worker') return;
    const path = `requests/${requestId}`;
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Đã đánh dấu hoàn thành dịch vụ!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleConfirmPayment = async (requestId: string, method: 'cash' | 'transfer', price: number) => {
    if (!user) return;
    const path = `requests/${requestId}`;
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        status: 'paid',
        price,
        paymentMethod: method,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Thanh toán thành công!');
      setPaymentModal({ open: false, request: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpgradeSubscription = async (plan: 'pro' | 'premium') => {
    if (!user) return;
    const path = 'subscriptions';
    try {
      await addDoc(collection(db, 'subscriptions'), {
        userId: user.uid,
        plan,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success(`Đã nâng cấp lên gói ${plan.toUpperCase()}!`);
      setSubscriptionModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleComplaint = async () => {
    if (!user || !complaintContent.trim()) return;
    setIsSubmittingComplaint(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        userId: user.uid,
        requestId: complaintModal.requestId || null,
        targetId: complaintModal.targetId || null,
        content: complaintContent,
        type: complaintModal.requestId ? 'complaint' : 'feedback',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      toast.success('Cảm ơn bạn đã gửi phản hồi!');
      setComplaintModal({ open: false });
      setComplaintContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'complaints');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleApproveWorker = async (workerId: string, approve: boolean) => {
    if (profile?.role !== 'admin') return;
    const path = `users/${workerId}`;
    try {
      await updateDoc(doc(db, 'users', workerId), {
        isApproved: approve
      });
      toast.success(approve ? "Đã duyệt thợ!" : "Đã từ chối thợ!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedWorker) return;
    setIsBooking(true);
    const path = 'requests';
    try {
      await addDoc(collection(db, 'requests'), {
        customerId: user.uid,
        customerName: user.displayName,
        workerId: selectedWorker.uid,
        workerName: selectedWorker.displayName,
        serviceType: selectedCategory || selectedWorker.services?.[0] || 'other',
        description: bookingDescription,
        status: 'pending',
        location: profile?.location || { latitude: 0, longitude: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Yêu cầu đã được gửi!');
      setBookingModal(false);
      setBookingDescription('');
      setSelectedWorker(null);
      setActiveTab('requests');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsBooking(false);
    }
  };

  const handlePostGeneralRequest = async () => {
    if (!user) return;
    setIsPostingRequest(true);
    const path = 'requests';
    try {
      await addDoc(collection(db, 'requests'), {
        customerId: user.uid,
        customerName: user.displayName,
        serviceType: postRequestCategory,
        description: postRequestDescription,
        status: 'pending',
        location: profile?.location || { latitude: 0, longitude: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Yêu cầu của bạn đã được đăng công khai!');
      setPostRequestModal(false);
      setPostRequestDescription('');
      setActiveTab('requests');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsPostingRequest(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user || !profile || profile.role !== 'worker') return;
    const path = `requests/${requestId}`;
    try {
      await updateDoc(doc(db, 'requests', requestId), {
        workerId: user.uid,
        workerName: user.displayName,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Đã nhận việc thành công!');
      setActiveTab('requests');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60 animate-pulse" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-orange-100 rounded-3xl flex items-center justify-center mb-8 shadow-orange-soft relative z-10"
        >
          <Hammer className="w-12 h-12 text-orange-600 animate-float" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Thợ <span className="text-orange-600">Gần Nhà</span>
          </h1>
          <p className="text-gray-500 mb-12 max-w-xs mx-auto font-medium leading-relaxed">
            Kết nối nhanh chóng với thợ sửa chữa chuyên nghiệp ngay tại khu vực của bạn.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signIn}
          className="w-full max-w-xs bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-orange-soft flex items-center justify-center gap-3 hover:bg-orange-700 transition-all relative z-10"
        >
          <div className="bg-white p-1 rounded-lg">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          </div>
          Đăng nhập với Google
        </motion.button>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-gray-400 font-bold uppercase tracking-widest relative z-10"
        >
          Nhanh chóng • Tin cậy • Gần bạn
        </motion.p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-orange-100/50 rounded-full blur-3xl opacity-50" />
        
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-gray-900 mb-8 tracking-tight relative z-10"
        >
          Bạn là ai?
        </motion.h2>
        
        <div className="grid grid-cols-1 gap-6 w-full max-w-sm relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateRole('customer')}
            className="bg-white p-6 rounded-3xl border-2 border-transparent hover:border-orange-500 shadow-soft flex items-center gap-5 transition-all text-left group"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-xl text-gray-900">Người dùng</p>
              <p className="text-sm text-gray-500 font-medium">Tôi cần tìm thợ sửa chữa</p>
            </div>
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateRole('worker')}
            className="bg-white p-6 rounded-3xl border-2 border-transparent hover:border-orange-500 shadow-soft flex items-center gap-5 transition-all text-left group"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Hammer className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="font-black text-xl text-gray-900">Thợ sửa chữa</p>
              <p className="text-sm text-gray-500 font-medium">Tôi muốn cung cấp dịch vụ</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white px-6 pt-8 pb-4 sticky top-0 z-30 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div onClick={refreshLocation} className="cursor-pointer group">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider group-hover:text-orange-500 transition-colors">Vị trí hiện tại</p>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-orange-600 animate-bounce" />
              <span className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{address || 'Đang xác định...'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setNotificationModal(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full relative transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            </button>
            <button onClick={() => setActiveTab('profile')}>
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                className="w-10 h-10 rounded-full border-2 border-orange-100 object-cover hover:border-orange-500 transition-all" 
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>
        
        {activeTab === 'home' && (
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setIsQuickSearching(true)}
              placeholder="Tìm kiếm thợ, dịch vụ..."
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
            />
            {quickSearchQuery && (
              <button 
                onClick={() => setIsQuickSearching(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-orange-600 text-white p-2 rounded-xl"
              >
                <Navigation className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </header>

      <main className="p-6">
        {activeTab === 'home' && (
          <>
            {/* Quick Find Section */}
            {(profile.role === 'customer' || profile.role === 'admin') && (
              <section className="mb-8">
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-3xl p-6 text-white shadow-orange-soft relative overflow-hidden group">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" 
                  />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <Zap className="w-7 h-7 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Tìm thợ siêu tốc</h3>
                        <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">Thợ gần bạn nhất</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl flex items-center px-4 border border-white/30 focus-within:bg-white/30 transition-all">
                        <Search className="w-4 h-4 text-white/70 mr-2" />
                        <input 
                          type="text" 
                          value={quickSearchQuery}
                          onChange={(e) => setQuickSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && setIsQuickSearching(true)}
                          placeholder="Bạn cần sửa gì hôm nay?"
                          className="w-full bg-transparent border-none text-white placeholder:text-white/50 text-sm py-3 focus:ring-0"
                        />
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsQuickSearching(true)}
                        className="bg-white text-orange-600 px-6 rounded-2xl shadow-lg font-black text-sm flex items-center gap-2"
                      >
                        TÌM NGAY
                      </motion.button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <button 
                        onClick={() => setPostRequestModal(true)}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        TẠO YÊU CẦU MỚI
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Categories */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">Dịch vụ phổ biến</h3>
                <button className="text-xs font-bold text-orange-600">Xem tất cả</button>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {SERVICE_CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-soft relative overflow-hidden",
                      selectedCategory === cat.id 
                        ? cn("text-white shadow-orange-200", cat.color) 
                        : cn("bg-white text-gray-600 hover:bg-gray-50")
                    )}>
                      {selectedCategory === cat.id && (
                        <motion.div 
                          layoutId="activeCategory"
                          className="absolute inset-0 bg-black/10"
                        />
                      )}
                      <ServiceIcon name={cat.icon} className="w-6 h-6 relative z-10" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tight transition-colors",
                      selectedCategory === cat.id ? "text-orange-600" : "text-gray-500"
                    )}>
                      {cat.name}
                    </span>
                    <span className="text-[8px] text-gray-400 font-medium">
                      ~{formatPrice(cat.minPrice / 1000)}k
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Nearby Workers or Requests */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">
                  {profile.role === 'worker' ? 'Yêu cầu gần bạn' : 'Thợ gần bạn'}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Navigation className="w-3 h-3" />
                  <span>Bán kính 2km</span>
                </div>
              </div>
              <div className="space-y-4">
                {profile.role === 'worker' ? (
                  !profile.isApproved ? (
                    <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl p-8 text-center">
                      <ShieldCheck className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
                      <h4 className="font-bold text-orange-900 mb-2">Tài khoản đang chờ duyệt</h4>
                      <p className="text-xs text-orange-700 leading-relaxed">
                        Cảm ơn bạn đã đăng ký làm thợ! Quản trị viên đang kiểm tra hồ sơ của bạn. 
                        Bạn sẽ có thể nhận việc ngay sau khi tài khoản được duyệt (thường trong vòng 24h).
                      </p>
                    </div>
                  ) : nearbyRequests.length === 0 ? (
                    <div className="bg-gray-50 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-medium">Hiện chưa có yêu cầu nào mới trong khu vực của bạn.</p>
                    </div>
                  ) : (
                    nearbyRequests
                      .filter(r => !selectedCategory || r.serviceType === selectedCategory)
                      .map(request => (
                        <div key={request.id} className="relative group">
                          <RequestCard 
                            request={request} 
                            showCustomer={true} 
                            onComplaint={() => setComplaintModal({ open: true, requestId: request.id, targetId: request.customerId })}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-orange-soft"
                            onClick={() => handleAcceptRequest(request.id!)}
                          >
                            NHẬN VIỆC
                          </motion.button>
                        </div>
                      ))
                  )
                ) : (
                  nearbyWorkers
                    .filter(w => !selectedCategory || w.services?.includes(selectedCategory))
                    .map(worker => (
                      <WorkerCard 
                        key={worker.uid} 
                        worker={worker} 
                        onSelect={(w) => {
                          setSelectedWorker(w);
                          setBookingModal(true);
                        }} 
                      />
                    ))
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'requests' && (
          <section>
            <h3 className="font-bold text-xl text-gray-900 mb-6">Yêu cầu của tôi</h3>
            {myRequests.length > 0 ? (
              myRequests.map(req => (
                <RequestCard 
                  key={req.id} 
                  request={req} 
                  showCustomer={profile.role === 'worker'}
                  onChat={() => setChatModal({ 
                    open: true, 
                    requestId: req.id, 
                    otherPartyId: profile.role === 'worker' ? req.customerId : req.workerId || null 
                  })}
                  onComplete={profile.role === 'worker' && req.status === 'accepted' ? () => handleCompleteService(req.id) : undefined}
                  onPay={profile.role === 'customer' && req.status === 'completed' ? () => setPaymentModal({ open: true, request: req }) : undefined}
                  onComplaint={() => setComplaintModal({ open: true, requestId: req.id, targetId: profile.role === 'worker' ? req.customerId : req.workerId || undefined })}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500">Bạn chưa có yêu cầu nào.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'admin' && profile?.role === 'admin' && (
          <section className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-gray-900">Bảng điều khiển Admin</h3>
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Thống kê hệ thống</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{allUsers.length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng người dùng</p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                  <Hammer className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{allUsers.filter(u => u.role === 'worker').length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng thợ</p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{allRequests.filter(r => r.status === 'completed' || r.status === 'paid').length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đã hoàn thành</p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-soft border border-gray-100">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{formatPrice(revenueRecords.reduce((acc, r) => acc + r.amount, 0) / 1000)}k</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doanh thu (VNĐ)</p>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Tăng trưởng thành viên
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'T1', users: 10, workers: 5 },
                    { name: 'T2', users: 25, workers: 12 },
                    { name: 'T3', users: 45, workers: 20 },
                    { name: 'T4', users: 80, workers: 35 },
                    { name: 'T5', users: 120, workers: 50 },
                    { name: 'T6', users: allUsers.length, workers: allUsers.filter(u => u.role === 'worker').length },
                  ]}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EA580C" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#4F46E5" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                    <Area type="monotone" dataKey="workers" stroke="#EA580C" fillOpacity={1} fill="url(#colorWorkers)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Người dùng</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Thợ</span>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Doanh thu ứng dụng
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Tuần 1', amount: 1200 },
                    { name: 'Tuần 2', amount: 2500 },
                    { name: 'Tuần 3', amount: 1800 },
                    { name: 'Tuần 4', amount: revenueRecords.reduce((acc, r) => acc + r.amount, 0) / 1000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="amount" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Distribution */}
            <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-green-600" />
                Phân bổ vị trí
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Hà Nội', value: allUsers.filter(u => u.location?.address?.includes('Hà Nội')).length || 15 },
                        { name: 'TP.HCM', value: allUsers.filter(u => u.location?.address?.includes('Hồ Chí Minh')).length || 25 },
                        { name: 'Đà Nẵng', value: allUsers.filter(u => u.location?.address?.includes('Đà Nẵng')).length || 10 },
                        { name: 'Khác', value: allUsers.filter(u => !u.location?.address?.includes('Hà Nội') && !u.location?.address?.includes('Hồ Chí Minh') && !u.location?.address?.includes('Đà Nẵng')).length || 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f97316" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Hà Nội
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-orange-500" /> TP.HCM
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Đà Nẵng
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Khác
                </div>
              </div>
            </div>

            {/* Worker Approval */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                Duyệt thợ mới
              </h3>
              <div className="space-y-4">
                {allUsers.filter(u => u.role === 'worker' && u.isApproved === false).length === 0 ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">Không có thợ nào đang chờ duyệt</p>
                  </div>
                ) : (
                  allUsers.filter(u => u.role === 'worker' && u.isApproved === false).map(worker => (
                    <div key={worker.uid} className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4">
                      <img 
                        src={worker.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.uid}`} 
                        className="w-12 h-12 rounded-xl object-cover" 
                        alt={worker.displayName}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{worker.displayName}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{worker.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveWorker(worker.uid, false)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleApproveWorker(worker.uid, true)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Complaints & Feedback */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-600" />
                Khiếu nại & Góp ý
              </h3>
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">Chưa có khiếu nại nào</p>
                  </div>
                ) : (
                  complaints.map(complaint => (
                    <div key={complaint.id} className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                          complaint.type === 'complaint' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {complaint.type === 'complaint' ? 'Khiếu nại' : 'Góp ý'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(complaint.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{complaint.content}</p>
                      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                        <button className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Giải quyết</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subscriptions Management */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Quản lý thuê bao
              </h3>
              <div className="space-y-3">
                {allSubscriptions.filter(s => s.status === 'pending').map(sub => (
                  <div key={sub.id} className="bg-white p-4 rounded-2xl shadow-soft border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{allUsers.find(u => u.uid === sub.userId)?.displayName}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Gói {sub.plan === 'basic' ? 'Cơ bản' : 'Doanh nghiệp'} - {formatPrice(sub.amount)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, 'subscriptions', sub.id), { status: 'active' });
                        await updateDoc(doc(db, 'users', sub.userId), { subscriptionPlan: sub.plan });
                        toast.success("Đã xác nhận thanh toán!");
                      }}
                      className="bg-orange-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-orange-soft"
                    >
                      XÁC NHẬN
                    </button>
                  </div>
                ))}
                {allSubscriptions.filter(s => s.status === 'pending').length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Không có yêu cầu thuê bao mới</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="text-center">
            <div className="relative inline-block mb-4">
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg mx-auto object-cover" 
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-2 -right-2 bg-orange-600 text-white p-2 rounded-xl shadow-lg">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
            <p className="text-gray-500 mb-8">
              {profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'worker' ? 'Thợ sửa chữa chuyên nghiệp' : 'Người dùng'}
            </p>
            
            {profile.role === 'customer' && user.email === 'haubg.info@gmail.com' && (
              <button 
                onClick={() => updateRole('admin')}
                className="mb-4 text-xs text-orange-600 font-bold underline"
              >
                Kích hoạt quyền Admin
              </button>
            )}
            {mySubscription && (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 mb-8 text-white text-left shadow-lg relative overflow-hidden">
                <Crown className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12" />
                <div className="relative z-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Gói hiện tại</p>
                  <h4 className="text-xl font-black uppercase mb-2">{mySubscription.plan}</h4>
                  <p className="text-xs opacity-90">Hết hạn: {new Date(mySubscription.endDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4 text-left mb-8">
              <div 
                onClick={refreshLocation}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 block">Cập nhật vị trí</span>
                    <span className="text-[10px] text-gray-400">
                      {profile.location ? `${profile.location.latitude.toFixed(4)}, ${profile.location.longitude.toFixed(4)}` : 'Chưa có vị trí'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
              <div 
                onClick={() => setSubscriptionModal(true)}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-700">Quản lý thuê bao</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-700">Xác minh danh tính</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </section>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-8 py-4 flex justify-between items-center z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        {[
          { id: 'home', label: 'Trang chủ', icon: Home },
          { id: 'requests', label: 'Yêu cầu', icon: Clock },
          ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Quản trị', icon: ShieldCheck }] : []),
          { id: 'profile', label: 'Cá nhân', icon: UserIcon },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 relative transition-all duration-300",
              activeTab === tab.id ? "text-orange-600" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div className="relative">
              <tab.icon className={cn("w-6 h-6 transition-transform duration-300", activeTab === tab.id && "scale-110")} />
              {activeTab === tab.id && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute -top-1 -right-1 w-2 h-2 bg-orange-600 rounded-full border-2 border-white"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-all duration-300",
              activeTab === tab.id ? "opacity-100 transform translate-y-0" : "opacity-70"
            )}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="navGlow"
                className="absolute inset-0 bg-orange-100/50 blur-xl rounded-full -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Notification Modal */}
      <Modal
        isOpen={notificationModal}
        onClose={() => setNotificationModal(false)}
        title="Thông báo"
      >
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Chào mừng bạn đến với Thợ Gần Nhà!</p>
              <p className="text-xs text-gray-500 mt-1">Hãy cập nhật vị trí và hồ sơ để bắt đầu tìm thợ hoặc nhận việc ngay nhé.</p>
              <p className="text-[10px] text-gray-400 mt-2">Vừa xong</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-3 opacity-60">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mẹo nhỏ cho bạn</p>
              <p className="text-xs text-gray-500 mt-1">Bạn có thể sử dụng tính năng "Tạo yêu cầu mới" để thợ chủ động tìm đến bạn.</p>
              <p className="text-[10px] text-gray-400 mt-2">1 giờ trước</p>
            </div>
          </div>

          <div className="text-center py-8">
            <p className="text-xs text-gray-400 italic">Bạn đã xem hết thông báo mới</p>
          </div>
        </div>
      </Modal>

      {/* Post General Request Modal */}
      <Modal
        isOpen={postRequestModal}
        onClose={() => setPostRequestModal(false)}
        title="Tạo yêu cầu mới"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Loại dịch vụ</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setPostRequestCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                    postRequestCategory === cat.id 
                      ? "border-orange-500 bg-orange-50 text-orange-700" 
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                  )}
                >
                  <ServiceIcon name={cat.icon} className="w-4 h-4" />
                  <span className="text-xs font-bold">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</label>
            <textarea
              value={postRequestDescription}
              onChange={(e) => setPostRequestDescription(e.target.value)}
              placeholder="Ví dụ: Vòi nước bồn rửa chén bị rò rỉ, cần thợ đến kiểm tra và thay mới..."
              className="w-full bg-gray-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 min-h-[120px]"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Yêu cầu của bạn sẽ được hiển thị công khai cho các thợ trong bán kính 2km. Thợ sẽ chủ động liên hệ với bạn qua mục Chat.
            </p>
          </div>

          <button
            onClick={handlePostGeneralRequest}
            disabled={isPostingRequest || !postRequestDescription.trim()}
            className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none"
          >
            {isPostingRequest ? 'Đang đăng...' : 'Đăng yêu cầu ngay'}
          </button>
        </div>
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Đặt lịch sửa chữa"
      >
        {selectedWorker && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <img 
                src={selectedWorker.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedWorker.uid}`} 
                className="w-16 h-16 rounded-xl object-cover"
                alt={selectedWorker.displayName}
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="font-bold text-gray-900">{selectedWorker.displayName}</h4>
                <p className="text-xs text-gray-500">Chuyên: {selectedWorker.services?.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.name).join(', ')}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-bold text-yellow-700">{selectedWorker.rating?.toFixed(1) || '5.0'}</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-orange-600">
                  <CreditCard className="w-3 h-3" />
                  <span>Giá tham khảo: {formatPriceRange(Math.min(...(selectedWorker.services?.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.minPrice || 0) || [0])), Math.max(...(selectedWorker.services?.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.maxPrice || 0) || [0])))}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả tình trạng</label>
              <textarea
                value={bookingDescription}
                onChange={(e) => setBookingDescription(e.target.value)}
                placeholder="Ví dụ: Vòi nước bị rò rỉ, cần thay mới..."
                className="w-full bg-gray-100 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 min-h-[120px]"
              />
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                Gọi điện
              </button>
              <button
                onClick={handleBooking}
                disabled={isBooking || !bookingDescription.trim()}
                className="flex-[2] bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none"
              >
                {isBooking ? 'Đang gửi...' : 'Gửi yêu cầu ngay'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      {/* Quick Search Results Modal */}
      <Modal
        isOpen={isQuickSearching}
        onClose={() => setIsQuickSearching(false)}
        title="Thợ phù hợp gần bạn"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {nearbyWorkers
            .filter(w => {
              if (!quickSearchQuery) return true;
              const query = quickSearchQuery.toLowerCase();
              return w.displayName.toLowerCase().includes(query) || 
                     w.bio?.toLowerCase().includes(query) ||
                     w.services?.some(s => s.toLowerCase().includes(query));
            })
            .map(worker => (
              <WorkerCard 
                key={worker.uid} 
                worker={worker} 
                onSelect={(w) => {
                  setSelectedWorker(w);
                  setBookingDescription(quickSearchQuery);
                  setBookingModal(true);
                  setIsQuickSearching(false);
                }} 
              />
            ))}
          {nearbyWorkers.filter(w => {
            if (!quickSearchQuery) return true;
            const query = quickSearchQuery.toLowerCase();
            return w.displayName.toLowerCase().includes(query) || 
                   w.bio?.toLowerCase().includes(query) ||
                   w.services?.some(s => s.toLowerCase().includes(query));
          }).length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">Không tìm thấy thợ phù hợp cho "{quickSearchQuery}"</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Chat Modal */}
      <Modal
        isOpen={chatModal.open}
        onClose={() => setChatModal({ open: false, requestId: null, otherPartyId: null })}
        title="Trò chuyện"
      >
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  msg.senderId === user?.uid ? "bg-orange-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
            />
            <button 
              onClick={sendMessage}
              className="bg-orange-600 text-white p-2 rounded-xl hover:bg-orange-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, request: null })}
        title="Thanh toán dịch vụ"
      >
        {paymentModal.request && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-1">Tổng cộng</p>
              <h3 className="text-3xl font-black text-gray-900">500.000đ</h3>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chọn phương thức</p>
              <button 
                onClick={() => handleConfirmPayment(paymentModal.request!.id, 'cash', 500000)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-orange-500"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-orange-600" />
                  <span className="font-bold text-gray-900">Tiền mặt</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
              <button 
                onClick={() => handleConfirmPayment(paymentModal.request!.id, 'transfer', 500000)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-orange-500"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-gray-900">Chuyển khoản</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Complaint Modal */}
      <Modal
        isOpen={complaintModal.open}
        onClose={() => setComplaintModal({ open: false })}
        title={complaintModal.requestId ? "Gửi khiếu nại" : "Góp ý dịch vụ"}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            {complaintModal.requestId 
              ? "Chúng tôi rất tiếc vì trải nghiệm không tốt của bạn. Vui lòng mô tả chi tiết vấn đề để chúng tôi hỗ trợ giải quyết."
              : "Ý kiến của bạn giúp chúng tôi hoàn thiện dịch vụ tốt hơn mỗi ngày."}
          </p>
          <textarea
            value={complaintContent}
            onChange={(e) => setComplaintContent(e.target.value)}
            placeholder="Nhập nội dung tại đây..."
            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 min-h-[150px]"
          />
          <button
            onClick={handleComplaint}
            disabled={isSubmittingComplaint || !complaintContent.trim()}
            className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-100 disabled:opacity-50"
          >
            {isSubmittingComplaint ? 'Đang gửi...' : 'GỬI PHẢN HỒI'}
          </button>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal
        isOpen={notificationModal}
        onClose={() => setNotificationModal(false)}
        title="Thông báo"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Bạn chưa có thông báo nào.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer",
                  notif.isRead ? "bg-white border-gray-100" : "bg-orange-50 border-orange-100 shadow-sm"
                )}
                onClick={async () => {
                  if (!notif.isRead) {
                    await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
                  }
                }}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    notif.type === 'job_nearby' ? "bg-blue-100 text-blue-600" :
                    notif.type === 'new_registration' ? "bg-green-100 text-green-600" :
                    "bg-orange-100 text-orange-600"
                  )}>
                    {notif.type === 'job_nearby' ? <Zap className="w-5 h-5" /> :
                     notif.type === 'new_registration' ? <Users className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900">{notif.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      {new Date(notif.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Subscription Modal */}
      <Modal
        isOpen={subscriptionModal}
        onClose={() => setSubscriptionModal(false)}
        title="Nâng cấp tài khoản"
      >
        <div className="space-y-6">
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
            <Crown className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-xl font-black text-orange-900 mb-2">Nâng cấp tài khoản</h3>
            <p className="text-sm text-orange-700 leading-relaxed">
              Nhận nhiều việc hơn, ưu tiên hiển thị và mở khóa các tính năng cao cấp dành cho thợ chuyên nghiệp.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className={cn(
              "p-6 rounded-3xl border-2 transition-all relative overflow-hidden",
              profile?.subscriptionPlan === 'basic' ? "border-orange-500 bg-orange-50/30" : "border-gray-100 bg-white"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tighter">GÓI CƠ BẢN</h4>
                  <p className="text-2xl font-black text-orange-600 mt-1">99.000đ<span className="text-xs text-gray-400 font-bold">/tháng</span></p>
                </div>
                {profile?.subscriptionPlan === 'basic' && (
                  <div className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full">ĐANG DÙNG</div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Ưu tiên hiển thị trong tìm kiếm
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Nhận thông báo việc mới tức thì
                </li>
              </ul>
              <button 
                onClick={() => subscribe('basic', 99000)}
                disabled={profile?.subscriptionPlan !== 'none'}
                className="w-full py-3 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                ĐĂNG KÝ NGAY
              </button>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border-2 transition-all relative overflow-hidden",
              profile?.subscriptionPlan === 'enterprise' ? "border-purple-500 bg-purple-50/30" : "border-gray-100 bg-white"
            )}>
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                PHỔ BIẾN
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tighter">DOANH NGHIỆP</h4>
                  <p className="text-2xl font-black text-purple-600 mt-1">399.000đ<span className="text-xs text-gray-400 font-bold">/tháng</span></p>
                </div>
                {profile?.subscriptionPlan === 'enterprise' && (
                  <div className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full">ĐANG DÙNG</div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Tất cả tính năng gói Cơ bản
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                  Quản lý đội ngũ thợ (tối đa 5 người)
                </li>
              </ul>
              <button 
                onClick={() => subscribe('enterprise', 399000)}
                disabled={profile?.subscriptionPlan !== 'none'}
                className="w-full py-3 bg-purple-600 text-white font-black rounded-2xl shadow-lg shadow-purple-100 disabled:opacity-50"
              >
                ĐĂNG KÝ NGAY
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
