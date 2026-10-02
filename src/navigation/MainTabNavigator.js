// The TOP-LEVEL navigator: the bottom tab bar with 3 tabs. This is what
// App.js renders directly. A TAB navigator shows tabs at the bottom and
// swaps the ENTIRE screen when you tap a different one (unlike a stack,
// where screens pile on top of each other).
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import RecipeStackNavigator from './RecipeStackNavigator';
import SavedRecipesScreen from '../screens/saved/SavedRecipesScreen';
import ShoppingListScreen from '../screens/shoppingList/ShoppingListScreen';
import { colors } from '../constants/colors';
import { fonts, headerAppearance } from '../constants/theme';

const Tab = createBottomTabNavigator();

// Which Ionicons name to use per tab. The "-outline" version (added below)
// is used when a tab isn't the currently selected one.
const ICONS = {
  RecipeStack: 'book',
  Saved: 'bookmark',
  ShoppingList: 'cart',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      // screenOptions as a FUNCTION (instead of a plain object) gives us
      // `route`, so we can look up the right icon per tab below.
      screenOptions={({ route }) => ({
        // The Cookbook tab's header is hidden here because its own nested
        // stack (RecipeStackNavigator) already shows a header per screen —
        // showing both would stack two headers on top of each other.
        headerShown: false,
        tabBarActiveTintColor: colors.paprikaLight,
        tabBarInactiveTintColor: colors.inkFaint,
        // Only colors/border are customized here — height and padding are
        // left alone so React Navigation handles the safe area (notch/home
        // indicator/gesture bar) automatically, the way it's designed to.
        tabBarStyle: { backgroundColor: colors.cover, borderTopWidth: 0 },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 11 },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="RecipeStack" component={RecipeStackNavigator} options={{ title: 'Cookbook' }} />
      {/* Saved and Shopping List each get their own real header here
          (headerShown: true), using the same shared headerAppearance style
          as the recipe stack, so every screen in the app looks consistent. */}
      <Tab.Screen
        name="Saved"
        component={SavedRecipesScreen}
        options={{ title: 'Saved', headerShown: true, ...headerAppearance }}
      />
      <Tab.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: 'Shopping List', headerShown: true, ...headerAppearance }}
      />
    </Tab.Navigator>
  );
}
