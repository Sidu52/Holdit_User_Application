import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking } from '../auth/authTypes';

interface BookingState {
  activeBooking: Booking | null;
  draftBooking: Partial<Booking>;
}

const initialState: BookingState = {
  activeBooking: null,
  draftBooking: {},
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setActiveBooking: (state, action: PayloadAction<Booking | null>) => {
      state.activeBooking = action.payload;
    },
    updateDraft: (state, action: PayloadAction<Partial<Booking>>) => {
      state.draftBooking = { ...state.draftBooking, ...action.payload };
    },
    clearDraft: (state) => {
      state.draftBooking = {};
    },
  },
});

export const { setActiveBooking, updateDraft, clearDraft } = bookingSlice.actions;
export default bookingSlice.reducer;
