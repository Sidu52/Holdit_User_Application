import { useDispatch } from "react-redux";
import { showStatusPopup, hideStatusPopup, PopupType } from "../store/uiSlice";

interface PopupOptions {
  type: PopupType;
  title: string;
  message: string;
  image?: string;
  canClose?: boolean;
  primaryActionLabel?: string;
}

export function useStatusPopup() {
  const dispatch = useDispatch();

  const showPopup = (options: PopupOptions) => {
    dispatch(
      showStatusPopup({
        type: options.type,
        title: options.title,
        message: options.message,
        image: options.image,
        canClose: options.canClose ?? true,
        primaryAction: options.primaryActionLabel
          ? { label: options.primaryActionLabel }
          : undefined,
      })
    );
  };

  const hidePopup = () => {
    dispatch(hideStatusPopup());
  };

  return { showPopup, hidePopup };
}
