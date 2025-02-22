export type UserRole = 'nurse' | 'company' | 'individual';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  verified: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}