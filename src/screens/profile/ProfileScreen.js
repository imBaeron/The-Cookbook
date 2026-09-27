import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

// STEP 1 placeholder. No accounts yet — this can hold dietary
// preferences/allergy defaults locally (AsyncStorage) until auth exists.
export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.screenTitle}>Profile</Text>
      </View>
      <View style={styles.body}>
        <Text style={typography.bodyMuted}>Dietary preferences & settings will live here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { padding: spacing.lg, paddingBottom: 0 },
  body: { flex: 1, padding: spacing.lg },
});
