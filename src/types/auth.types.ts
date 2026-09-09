export interface CheckEmailRdo {
  success: boolean;
}

export interface UserRdo {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface AuthRdo {
  accessToken: string;
  user: UserRdo;
}