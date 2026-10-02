// ENTRY POINT of the whole app. Expo looks for this file first.
// Jobs this file does, in order: load custom fonts, keep the splash screen
// up until they're ready, then set up navigation for the rest of the app.
import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import {
  LibreFranklin_400Regular,
  LibreFranklin_500Medium,
  LibreFranklin_600SemiBold,
} from '@expo-google-fonts/libre-franklin';

import MainTabNavigator from './src/navigation/MainTabNavigator';
import { colors } from './src/constants/colors';

// Tell the OS "don't auto-hide the splash screen" — we'll hide it ourselves,
// manually, once fonts are ready. Without this, the splash could disappear
// before fonts finish loading, showing text in the wrong font for a flash.
SplashScreen.preventAutoHideAsync();

export default function App() {
  // useFonts is a hook (see store/useAppStore.js for what "hook" means in
  // general) that downloads/loads the custom fonts we picked and tells us
  // when they're ready. fontsLoaded starts false and flips to true once done.
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium_Italic,
    LibreFranklin_400Regular,
    LibreFranklin_500Medium,
    LibreFranklin_600SemiBold,
  });

  // useEffect = "run this code after rendering, when something changes."
  // Dependency array [fontsLoaded] means: run again whenever fontsLoaded
  // changes. The moment it flips to true, we hide the splash screen.
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // While fonts are still loading, render nothing (the splash screen is
  // still covering everything anyway, so this is invisible to the user).
  if (!fontsLoaded) {
    return null;
  }

  // Everything below is "providers" — components that wrap the whole app
  // and make something available to every screen inside them, without
  // needing to pass it down manually through props.
  return (
    // SafeAreaProvider measures the notch / status bar / home-indicator
    // sizes on this specific phone, so navigation headers and tab bars can
    // avoid drawing underneath them.
    <SafeAreaProvider>
      {/* Required by react-native-gesture-handler (used internally by React
          Navigation) for swipe gestures to work anywhere in the app. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* NavigationContainer is the "brain" that tracks which screen
            you're on. Everything screen-related must live inside it. */}
        <NavigationContainer
          theme={{
            // Spreading ...DefaultTheme first keeps every setting React
            // Navigation expects (including a `fonts` object it needs
            // internally) — we only override the specific colors we want.
            ...DefaultTheme,
            dark: false,
            colors: {
              ...DefaultTheme.colors,
              primary: colors.paprika,
              background: colors.paper,
              card: colors.cover,
              text: colors.ink,
              border: colors.border,
              notification: colors.paprika,
            },
          }}
        >
          <StatusBar style="light" />
          <MainTabNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
