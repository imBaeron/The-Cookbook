import { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';
import { overlayOpacity, pageRotations, subscribeToPageTurn } from './pageTurnController';

// Render this ONCE at the root (in App.js).
// Uses a real <Modal> instead of a plain absolutely-positioned View — Modal
// is a genuinely separate native layer, so it reliably draws above the tab
// bar and everything else on both iOS and Android. It's only mounted while
// an animation is actually playing (see subscribeToPageTurn), so it never
// blocks touches otherwise.
//
// To swap in a real Lottie animation later instead of these plain rectangles:
// replace the <View style={styles.pagesRow}> block below with a
// <LottieView source={require('../../assets/book-flip.json')} ... /> —
// the mount/unmount + timing logic here doesn't need to change.
export default function PageTurnOverlay() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => subscribeToPageTurn(setMounted), []);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.wrap} pointerEvents="none">
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <View style={styles.pagesRow}>
            {pageRotations.map((rot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.page,
                  {
                    transform: [
                      { perspective: 800 },
                      {
                        rotateY: rot.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '75deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.cover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagesRow: { flexDirection: 'row', gap: 8 },
  page: {
    width: 30,
    height: 100,
    borderRadius: 3,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
