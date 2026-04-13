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
      // Claim the touch immediately so the ScrollView below doesn't steal it.
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder:         (_, g) =>
        g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),

      onPanResponderMove: (_, g) => {
        // Only track downward drag — no offset math, just direct value.
        if (g.dy > 0) dragY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          // Dismiss — the parent's onClose will handle the exit animation.
          dragY.setValue(0);
          onCloseRef.current();
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
