export interface User {
  id: number;
  email: string;
  password: string;
  created_at: string;
}

export interface UserCreateData {
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}