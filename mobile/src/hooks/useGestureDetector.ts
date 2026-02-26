import { useEffect, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

interface UseGestureDetectorProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useGestureDetector = ({
  onSwipeUp,
  onSwipeDown,
  threshold = 1.5,
  enabled = true,
}: UseGestureDetectorProps) => {
  const [data, setData] = useState<AccelerometerData>({ x: 0, y: 0, z: 0 });
  const [lastTrigger, setLastTrigger] = useState<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let subscription: any;
    
    const subscribe = async () => {
      // Set update interval to 100ms
      Accelerometer.setUpdateInterval(100);
      
      subscription = Accelerometer.addListener((accelerometerData) => {
        setData(accelerometerData);
        
        const now = Date.now();
        // Prevent multiple triggers within 500ms
        if (now - lastTrigger < 500) return;
        
        // Detect swipe up (phone moved upward quickly)
        if (accelerometerData.y < -threshold && onSwipeUp) {
          setLastTrigger(now);
          onSwipeUp();
        }
        
        // Detect swipe down (phone moved downward quickly)
        if (accelerometerData.y > threshold && onSwipeDown) {
          setLastTrigger(now);
          onSwipeDown();
        }
      });
    };

    subscribe();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, onSwipeUp, onSwipeDown, threshold, lastTrigger]);

  return { data };
};
