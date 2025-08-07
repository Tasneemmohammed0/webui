import { NOTIFICATION_VISIBLE_MILLISECS } from '@/utils/constants/common';
import { useEffect, useState } from 'react';

export const useDisappearingNotification = (initialState: boolean) => {
  const [showNotification, setShowNotification] = useState(initialState);

  useEffect(() => {
    // Only show the notification if the limit was exceeded
    if (initialState) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, NOTIFICATION_VISIBLE_MILLISECS);

      // Cleanup function: This will clear the timer on unmount.
      return () => clearTimeout(timer);
    }
  }, [initialState]);

  return showNotification;
};
