// What a screen shows when loading failed: the friendly message from
// apiClient.js (error.userMessage) and a "Try again" button.
// `onRetry` is optional — leave it out to show just the message.
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography, spacing, radius } from '../constants/theme';

export default function ErrorView({ message, onRetry }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.inkFaint} />
      <Text style={[typography.body, styles.message]}>
        {message || 'Something went wrong. Please try again.'}
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.85}>
          <Text style={typography.button}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl },
  message: { textAlign: 'center', marginTop: spacing.sm },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.cover,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
});
