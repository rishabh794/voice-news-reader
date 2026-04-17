import { useContext } from 'react';
import { ToastContext } from '../context/toast-context';

export const useToast = () => {
  const toastContext = useContext(ToastContext);

  if (!toastContext) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return toastContext;
};