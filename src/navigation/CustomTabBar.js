import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fonts } from '../constants/theme';

const ICONS = {
  RecipeStack: 'book',
  Saved: 'bookmark',
  ShoppingList: 'cart',
  Profile: 'person-circle',
};

// A fully custom tab bar (passed via <Tab.Navigator tabBar={...}>) instead of
// styling the built-in one via tabBarStyle. This guarantees there's no gap
// between the bar and the bottom of the screen: the background color is
// painted on ONE container that already includes the safe-area padding,
// rather than us trying to reverse-engineer how the library merges a custom
// height/padding with its own internal safe-area handling.
export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (isFocused || event.defaultPrevented) return;
            navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? ICONS[route.name] : `${ICONS[route.name]}-outline`}
                size={22}
                color={isFocused ? colors.paprikaLight : colors.inkFaint}
              />
              <Text style={[styles.label, { color: isFocused ? colors.paprikaLight : colors.inkFaint }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.cover },
  row: { flexDirection: 'row', height: 56, paddingTop: 6 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.sansMedium, fontSize: 11 },
});
