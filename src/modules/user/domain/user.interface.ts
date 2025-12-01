// Enums
export enum UserRole {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  USER = "USER",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

// Interfaces principais
export interface User {
  id: string;
  clerkId: string; // ID do usuário no Clerk
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithSubscription extends User {
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    planName: string;
    startDate: string;
    endDate?: string;
    nextBillingDate?: string;
  };
}

export interface CurrentUserAuthenticated extends UserWithSubscription {
  appointmentsCount: number;
  hasActiveSubscription: boolean;
  accessibleEbooksCount: number;
}

// DTOs
export interface CreateUserDTO {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  email?: string;
}

export interface UpdateUserProfileDTO {
  name?: string;
  phone?: string;
}

export interface SyncUserFromClerkDTO {
  clerkId: string;
  email: string;
  name: string;
  phone?: string;
}

// Interfaces de listagem
export interface ListUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserAppointmentsSummary {
  userId: string;
  userName: string;
  userEmail: string;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  lastAppointmentDate?: string;
}

// Interface para estatísticas de usuários (para admin)
export interface UserStats {
  totalUsers: number;
  activeSubscriptions: number;
  newUsersThisMonth: number;
  totalAppointments: number;
  totalRevenue: number;
}

// Interface para perfil completo do usuário
export interface UserProfile extends UserWithSubscription {
  appointments: {
    id: string;
    date: string;
    startTime: string;
    status: AppointmentStatus;
    patientName: string;
    type: string;
  }[];
  downloadedEbooks: {
    id: string;
    title: string;
    downloadedAt: string;
  }[];
}

// Interface para busca de usuários
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string;
  appointmentsCount: number;
  hasActiveSubscription: boolean;
}