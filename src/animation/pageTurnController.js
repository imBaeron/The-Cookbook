import { Animated, Easing } from 'react-native';

// Module-scope Animated values, shared across the root zoom wrapper, the
// overlay, and every screen's navigate calls (no Context needed).
export const rootScale = new Animated.Value(1);
export const overlayOpacity = new Animated.Value(0);
export const pageRotations = [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)];

let isAnimating = false;

// Pub/sub so PageTurnOverlay knows when to mount/unmount its Modal — it
// should ONLY be mounted while an animation is actually playing, so it never
// blocks touches the rest of the time.
const listeners = new Set();
export function subscribeToPageTurn(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setOverlayMounted(active) {
  listeners.forEach((fn) => fn(active));
}

function timing(value, toValue, duration) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.quad),
    useNativeDriver: true,
  });
}

function flutterPages() {
  return Animated.stagger(
    70,
    pageRotations.map((rot) => Animated.sequence([timing(rot, 1, 90), timing(rot, 0, 90)]))
  );
}

/**
 * Plays: zoom out -> page riffle (fully opaque, hides the swap) -> zoom back in.
 * `swapContent` runs the moment the overlay is fully opaque, so the screen
 * change it triggers (navigate/goBack) is invisible to the user.
 */
export function runPageTurn(swapContent) {
  if (isAnimating) {
    swapContent?.();
    return Promise.resolve();
  }
  isAnimating = true;
  setOverlayMounted(true);

  return new Promise((resolve) => {
    Animated.parallel([timing(rootScale, 0.92, 180), timing(overlayOpacity, 1, 180)]).start(() => {
      swapContent?.();

      Animated.sequence([
        flutterPages(),
        Animated.parallel([timing(overlayOpacity, 0, 180), timing(rootScale, 1, 180)]),
      ]).start(() => {
        isAnimating = false;
        setOverlayMounted(false);
        resolve();
      });
    });
  });
}

/**
 * Call BEFORE hiding the splash screen — instantly mounts the overlay
 * already fully opaque, so there's no gap where bare content could flash.
 */
export function prepareIntro() {
  if (isAnimating) return;
  isAnimating = true;
  overlayOpacity.setValue(1);
  rootScale.setValue(0.9);
  setOverlayMounted(true);
}

/**
 * Call AFTER the splash screen has hidden — riffles the pages open and
 * reveals Home underneath.
 */
export function playIntroReveal() {
  return new Promise((resolve) => {
    Animated.sequence([
      flutterPages(),
      Animated.parallel([timing(overlayOpacity, 0, 220), timing(rootScale, 1, 220)]),
    ]).start(() => {
      isAnimating = false;
      setOverlayMounted(false);
      resolve();
    });
  });
}
