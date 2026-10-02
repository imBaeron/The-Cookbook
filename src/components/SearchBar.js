// The search input + the "By Name" / "By Ingredients" toggle. Used only on
// HomeScreen. This is also a controlled component: HomeScreen owns the
// actual text/mode values (query, mode) and passes them in as props, along
// with the setter functions to call when they change.
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography, spacing, radius } from '../constants/theme';

// mode: 'name' | 'ingredients'
export default function SearchBar({
  value,
  onChangeText,
  mode = 'name',
  onModeChange,
  onSubmit,
  placeholder,
}) {
  const defaultPlaceholder =
    mode === 'name' ? 'Search recipes…' : 'Search by ingredients, comma separated…';

  return (
    <View>
      {/* The two pill-shaped toggle buttons */}
      <View style={styles.modeToggle}>
        <ModeButton label="By Name" active={mode === 'name'} onPress={() => onModeChange?.('name')} />
        <ModeButton
          label="By Ingredients"
          active={mode === 'ingredients'}
          onPress={() => onModeChange?.('ingredients')}
        />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.inkLight} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? defaultPlaceholder}
          placeholderTextColor={colors.inkFaint}
          returnKeyType="search" // changes the keyboard's return key to say "search"
          onSubmitEditing={onSubmit} // fires when the user taps that return key
        />
      </View>
    </View>
  );
}

// A small local component used only inside this file, for the two toggle
// buttons. Keeping it here (instead of a separate file) is fine since
// nothing else needs it.
function ModeButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      // style={[a, condition && b]} applies style `a` always, and style `b`
      // only when `condition` is true (React Native ignores `false`).
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[typography.label, active && styles.modeTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modeToggle: {
    flexDirection: 'row', // side by side instead of the default stacked
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  modeButtonActive: {
    backgroundColor: colors.cover,
    borderColor: colors.cover,
  },
  modeTextActive: {
    color: colors.paper,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center', // vertically centers the icon with the text input
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1, // takes up all remaining space in the row, pushing nothing else out
    paddingVertical: 12,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.ink,
  },
});
