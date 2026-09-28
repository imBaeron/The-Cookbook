import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

// Controlled component: `saved` and `onToggle` come from whichever store
// the parent screen reads (useAppStore), so this button always
// reflects real state instead of guessing with its own internal useState.
export default function BookmarkButton({ saved, onToggle, size = 22, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onToggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
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
    backgroundColor: 'rgba(43, 33, 24, 0.55)',
    borderRadius: 999,
    padding: 6,
  },
});
