export type UserRole = 'customer' | 'worker' | 'admin';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  location?: Location;
  services?: string[];
  bio?: string;
  rating?: number;
  reviewCount?: number;
  completedJobsCount?: number;
  isOnline?: boolean;
  isApproved?: boolean;
  isVerified?: boolean;
  isReputable?: boolean;
  subscriptionPlan?: 'none' | 'basic' | 'enterprise';
  subscriptionExpiry?: string;
  createdAt: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'cancelled' | 'paid';

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName?: string;
  workerId?: string;
  workerName?: string;
  serviceType: string;
  description: string;
  status: RequestStatus;
  location: Location;
  price?: number;
  paymentMethod?: 'cash' | 'transfer';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export interface ChatRoom {
  id: string;
  requestId: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'none' | 'basic' | 'enterprise';
  status: 'active' | 'expired' | 'pending';
  amount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Review {
  id: string;
  requestId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  requestId?: string;
  userId: string;
  targetId?: string;
  type: 'complaint' | 'feedback';
  content: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_nearby' | 'new_registration' | 'system' | 'subscription' | 'job';
  isRead: boolean;
  createdAt: string;
  link?: string;
  requestId?: string;
}

export interface RevenueRecord {
  id: string;
  amount: number;
  type: 'subscription' | 'service_fee';
  userId: string;
  createdAt: string;
}

export const SERVICE_CATEGORIES = [
  { id: 'electrical', name: 'Điện', icon: 'Zap', color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-600', minPrice: 150000, maxPrice: 500000 },
  { id: 'plumbing', name: 'Nước', icon: 'Droplets', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600', minPrice: 100000, maxPrice: 400000 },
  { id: 'electronics', name: 'Điện tử', icon: 'Cpu', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600', minPrice: 200000, maxPrice: 1000000 },
  { id: 'appliances', name: 'Gia dụng', icon: 'Home', color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600', minPrice: 150000, maxPrice: 600000 },
  { id: 'cleaning', name: 'Dọn dẹp', icon: 'Sparkles', color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600', minPrice: 80000, maxPrice: 300000 },
  { id: 'carpentry', name: 'Mộc', icon: 'Hammer', color: 'bg-amber-700', lightColor: 'bg-amber-50', textColor: 'text-amber-800', minPrice: 200000, maxPrice: 800000 },
  { id: 'painting', name: 'Sơn sửa', icon: 'Paintbrush', color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600', minPrice: 300000, maxPrice: 2000000 },
  { id: 'other', name: 'Khác', icon: 'MoreHorizontal', color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-600', minPrice: 100000, maxPrice: 500000 },
];
