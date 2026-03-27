import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import bookingReducer from '../features/booking/bookingSlice';
import userReducer from '../features/user/userSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  booking: bookingReducer,
  user: userReducer,
});
