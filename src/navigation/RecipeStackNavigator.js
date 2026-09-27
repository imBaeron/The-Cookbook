import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import SearchResultsScreen from '../screens/home/SearchResultsScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import { colors } from '../constants/colors';
import { fonts } from '../constants/theme';

const Stack = createNativeStackNavigator();

export default function RecipeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.cover },
        headerTintColor: colors.paper,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.paper },
        // No transition animation — screens switch instantly.
        animation: 'none',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'The Cookbook' }} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ title: 'Results' }} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
