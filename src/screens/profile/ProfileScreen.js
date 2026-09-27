import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

// No accounts yet — this can hold dietary preferences/allergy defaults
// locally (AsyncStorage) until auth exists.
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.bodyMuted}>Dietary preferences & settings will live here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg },
});
