// A small reusable component: just the bookmark icon + tap behavior.
// Used inside RecipeCard (on Home/Search/Saved) and directly on
// RecipeDetailScreen.
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

// This is a "controlled component": it has NO state of its own (no
// useState here). `saved` (true/false) and `onToggle` (what to do when
// tapped) are passed in as PROPS by whichever screen uses it, and that
// screen reads the real saved/unsaved status from useAppStore. This keeps
// every copy of this button in sync — tapping it on one screen updates
// every other screen too, because they all read the same shared source.
export default function BookmarkButton({ saved, onToggle, size = 22, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onToggle}
      // hitSlop extends the tappable area beyond the icon's visible edges,
      // making a small icon easier to tap accurately.
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Filled icon + accent color when saved, outline + white when not. */}
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={size}
        color={saved ? colors.paprika : colors.white}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    // Semi-transparent dark circle behind the icon, so it's readable
    // whether it's sitting on a light photo or a dark one.
    backgroundColor: 'rgba(43, 33, 24, 0.55)',
    borderRadius: 999, // fully rounded — makes this a circle
    padding: 6,
  },
});
