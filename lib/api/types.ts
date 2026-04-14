export type UserRole = "SUPER_ADMIN" | "PARTNER";

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  partner: {
    id: string;
    name: string;
    city: string;
    phone: string;
    address: string | null;
    categoryId: string;
    logo: string | null;
    coverImage: string | null;
    isVerified: boolean;
    packId: string | null;
  } | null;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
