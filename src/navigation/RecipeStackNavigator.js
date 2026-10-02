// A STACK navigator: screens are stacked like cards. navigate() puts a new
// screen on top, and the back button/gesture removes the top one, revealing
// what was underneath. This stack holds the "recipe browsing flow":
// Home -> Search Results -> Recipe Detail. It's nested INSIDE one tab of
// MainTabNavigator (see that file), which is how the bottom tabs stay
// visible while these three screens push/pop on top of each other.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import SearchResultsScreen from '../screens/home/SearchResultsScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import { colors } from '../constants/colors';
import { headerAppearance } from '../constants/theme';

// createNativeStackNavigator() returns an object with .Navigator and
// .Screen components used below to register this stack's screens.
const Stack = createNativeStackNavigator();

export default function RecipeStackNavigator() {
  return (
    // screenOptions here apply to EVERY screen in this stack, unless a
    // specific <Stack.Screen> below overrides them with its own `options`.
    <Stack.Navigator
      screenOptions={{
        ...headerAppearance, // the shared cocoa/paper header style (theme.js)
        contentStyle: { backgroundColor: colors.paper },
        // No transition animation — screens switch instantly.
        animation: 'none',
      }}
    >
      {/* `name` is the ID used elsewhere to navigate here, e.g.
          navigation.navigate('RecipeDetail', {...}). `component` is what
          renders. `options.title` sets that screen's header text. */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'The Cookbook' }} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ title: 'Results' }} />
      {/* title is empty here because RecipeDetailScreen sets its own title
          dynamically once it knows which recipe it's showing (see
          navigation.setOptions inside that screen). */}
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
