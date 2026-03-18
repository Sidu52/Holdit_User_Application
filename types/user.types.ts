export interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

export interface User {
  _id: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  dob?: string;
  address?: string;
  isSignUp: boolean;
  is_serviceable: boolean;
  status: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  dob?: string;
  address?: string;
  lat?: number;
  lng?: number;
}
