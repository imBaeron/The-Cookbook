import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import RecipeStackNavigator from './RecipeStackNavigator';
import SavedRecipesScreen from '../screens/saved/SavedRecipesScreen';
import ShoppingListScreen from '../screens/shoppingList/ShoppingListScreen';
import { colors } from '../constants/colors';
import { fonts, headerAppearance } from '../constants/theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  RecipeStack: 'book',
  Saved: 'bookmark',
  ShoppingList: 'cart',
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
