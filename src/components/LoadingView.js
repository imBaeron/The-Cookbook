// A centered spinner with a short message. Shown while a screen waits for
// recipes to arrive from the internet. Used by Home, Search Results, Recipe
// Detail and Saved, so they all look the same while loading.
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing } from '../constants/theme';

export default function LoadingView({ label = 'Loading…' }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.cover} />
      <Text style={[typography.bodyMuted, styles.label]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  label: { marginTop: spacing.md },
});
