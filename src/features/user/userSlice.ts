import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, Address } from './userTypes';

interface UserState {
  profile: UserProfile | null;
  addresses: Address[];
}

const initialState: UserState = {
  profile: null,
  addresses: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
  },
});

export const { setProfile, setAddresses } = userSlice.actions;
export default userSlice.reducer;
