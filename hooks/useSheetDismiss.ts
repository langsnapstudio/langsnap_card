import { useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

/**
 * Adds swipe-down-to-dismiss behaviour to any bottom sheet.
 *
 * Usage:
 *   const { dragY, panHandlers } = useSheetDismiss(onClose);
 *
 *   1. Add dragY to the sheet panel's translateY:
 *      transform: [{ translateY: Animated.add(slideAnim, dragY) }]
 *
 *   2. Spread panHandlers onto the handle bar:
 *      <View style={styles.handle} {...panHandlers} />
 *
 *   3. In the visibility useEffect's `if (visible)` branch, reset BOTH
 *      before starting the open animation:
 *        dragY.setValue(0);
 *        slideAnim.setValue(EXIT_VALUE); // ensures animation always plays
 */
export function useSheetDismiss(onClose: () => void) {
  const dragY = useRef(new Animated.Value(0)).current;

  // Ref keeps onClose fresh without recreating the PanResponder each render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim on start — lets buttons/switches inside the sheet work.
      // Only claim once the gesture is clearly a downward drag.
      onStartShouldSetPanResponder:        () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Capture phase fires before children — needed when panHandlers is on the
      // whole sheet panel so interactive children don't swallow the drag.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponder:        (_, g) =>
        g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),

      onPanResponderMove: (_, g) => {
        // Only track downward drag — no offset math, just direct value.
        if (g.dy > 0) dragY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          // Slide the sheet off the bottom of the screen, then dismiss.
          // Use gesture velocity so a fast flick feels instant, slow drag feels smooth.
          const duration = Math.max(100, Math.min(280, 220 - g.vy * 120));
          Animated.timing(dragY, {
            toValue:         900,
            duration,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current();
            // Reset so the sheet is in the right position when it reopens.
            // (Parents also call dragY.setValue(0) in their open branch, but
            //  doing it here avoids any flash if the parent skips that step.)
            dragY.setValue(0);
          });
        } else {
          // Snap back to resting position.
          Animated.spring(dragY, {
            toValue:         0,
            friction:        8,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue:         0,
          friction:        8,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return { dragY, panHandlers: panResponder.panHandlers };
}
