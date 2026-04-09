import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PopupType = "info" | "warning" | "update" | "coming_soon";

interface StatusPopupConfig {
  type: PopupType;
  title: string;
  message: string;
  image?: string;
  primaryAction?: {
    label: string;
    onPress?: string; // We use a string key or handle it via a specific registry if needed, 
                     // but for now we'll handle the actual callback in the component or via predefined actions.
  };
  canClose: boolean;
}

interface UIState {
  statusPopup: {
    visible: boolean;
    config: StatusPopupConfig | null;
  };
}

const initialState: UIState = {
  statusPopup: {
    visible: false,
    config: null,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showStatusPopup: (state, action: PayloadAction<StatusPopupConfig>) => {
      state.statusPopup.visible = true;
      state.statusPopup.config = action.payload;
    },
    hideStatusPopup: (state) => {
      state.statusPopup.visible = false;
      state.statusPopup.config = null;
    },
  },
});

export const { showStatusPopup, hideStatusPopup } = uiSlice.actions;
export default uiSlice.reducer;
