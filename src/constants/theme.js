// "Design tokens": shared values for fonts, spacing, rounded corners, and
// text styles, used across every screen/component. This is how the app
// stays visually consistent — nobody types a raw font size or padding
// number directly in a screen, they reference a name from here instead.
import { colors } from './colors';

// Font family keys — must match the keys used when loading fonts in App.js.
// React Native identifies a loaded custom font by this exact string name.
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_500Medium_Italic',
  sans: 'LibreFranklin_400Regular',
  sansMedium: 'LibreFranklin_500Medium',
  sansSemiBold: 'LibreFranklin_600SemiBold',
};

// A spacing scale instead of random numbers. Using spacing.md everywhere
// (rather than 16 typed out repeatedly) means changing this one number
// adjusts padding/margins across the whole app consistently.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Corner roundness scale. radius.pill (999) is intentionally huge — on a
// short/narrow element that makes the corners as round as possible,
// producing a fully rounded "pill" shape (used for buttons, tags, search bar).
export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

// Pre-built text styles. Instead of repeating { fontFamily, fontSize, color }
// on every <Text>, a screen does style={typography.screenTitle}.
export const typography = {
  screenTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.ink,
  },
  recipeTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  bodyMuted: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkLight,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.inkLight,
  },
  button: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.paper,
  },
};

export const theme = { colors, fonts, spacing, radius, typography };
export default theme;

// Shared react-navigation header style — used by both RecipeStackNavigator
// (Home/Search Results/Recipe Detail) and MainTabNavigator (Saved/Shopping
// List) so every screen's header is guaranteed to match, from one place.
export const headerAppearance = {
  headerStyle: { backgroundColor: colors.cover },
  headerTintColor: colors.paper,
  headerTitleStyle: { fontFamily: fonts.serif, fontSize: 18 },
  headerShadowVisible: false,
};
