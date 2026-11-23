// A small credit line linking back to Spoonacular. Spoonacular's free plan
// asks apps that show its data to link back to it, so this sits at the bottom
// of the screens that display recipes. It's hidden when running on the
// built-in sample data, since nothing came from Spoonacular then.
import { Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing } from '../constants/theme';
import { USE_MOCK_DATA } from '../constants/config';

export default function PoweredBy() {
  if (USE_MOCK_DATA) return null;

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => Linking.openURL('https://spoonacular.com/food-api')}
      activeOpacity={0.7}
    >
      <Text style={[typography.label, styles.text]}>Recipe data by spoonacular</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.lg },
  text: { color: colors.inkFaint, textDecorationLine: 'underline' },
});
