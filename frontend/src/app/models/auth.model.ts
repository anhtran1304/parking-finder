export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  userId: number;
  email: string;
  fullName: string;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface UserSession {
  accessToken: string;
  expiresAt: number;
  userId: number;
  email: string;
  fullName: string;
}
