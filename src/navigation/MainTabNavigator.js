import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RecipeStackNavigator from './RecipeStackNavigator';
import SavedRecipesScreen from '../screens/saved/SavedRecipesScreen';
import ShoppingListScreen from '../screens/shoppingList/ShoppingListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CustomTabBar from './CustomTabBar';
import { headerAppearance } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
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
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerShown: true, ...headerAppearance }}
      />
    </Tab.Navigator>
  );
}
