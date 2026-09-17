export interface CheckEmailRdo {
  success: boolean;
}

export interface UserRdo {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string;
}

export interface AuthRdo {
  accessToken: string;
  user: UserRdo;
}
