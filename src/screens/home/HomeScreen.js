// The app's starting screen: a greeting, the search bar, and 4 random
// "Today's picks" recipes. Registered as the first screen in
// RecipeStackNavigator, so it's what shows when the Cookbook tab opens.
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import SearchBar from '../../components/SearchBar';
import RecipeCard from '../../components/RecipeCard';
import LoadingView from '../../components/LoadingView';
import ErrorView from '../../components/ErrorView';
import PoweredBy from '../../components/PoweredBy';
import { getRandomRecipes } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

// Every screen registered with React Navigation automatically receives a
// `navigation` prop (used to move to other screens) and a `route` prop
// (info about how this screen was opened) — this screen only needs navigation.
export default function HomeScreen({ navigation }) {
  // Local state — only HomeScreen needs to know the current search text,
  // the search mode, and which random recipes are showing right now.
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('name');
  const [picks, setPicks] = useState([]);

  // Anything that loads from the internet can be in one of three situations,
  // so we track two extra things: are we waiting (loading)? did it fail (error)?
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shared state — read from useAppStore so the bookmark icon on every
  // card here matches what's actually saved, kept in sync across screens.
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // Fetches 4 random recipes. Used by the first load, the Shuffle button, and
  // the "Try again" button, so the loading/error handling lives in one place.
  function loadPicks() {
    setLoading(true);
    setError(null);
    getRandomRecipes(4)
      .then(setPicks) // success: show the recipes
      .catch(setError) // failure: remember the error so we can display it
      .finally(() => setLoading(false)); // either way, we're done waiting
  }

  // Load once, when the screen first appears. The empty dependency array []
  // means "run only once, right after the first render" — without it,
  // setting state in here would re-render, run this again, and loop forever.
  useEffect(() => {
    loadPicks();
  }, []);

  // Navigates to the Search Results screen, passing the current query/mode
  // along as params so that screen knows what to search for.
  const handleSubmit = () => {
    navigation.navigate('SearchResults', { query, mode });
  };

  return (
    <View style={styles.container}>
      {/* FlatList efficiently renders a scrolling list — only the rows
          currently visible on screen are actually drawn. */}
      <FlatList
        data={picks}
        // Every item needs a unique STRING id so React can track which row
        // is which; our ids are numbers, so String(...) converts them.
        keyExtractor={(item) => String(item.id)}
        // Everything above the actual recipe list (greeting, search bar,
        // "Today's picks" heading) — scrolls together with the list below it.
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.screenTitle}>Good afternoon</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
              What are you in the mood to cook?
            </Text>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              mode={mode}
              onModeChange={setMode}
              onSubmit={handleSubmit}
            />
            <View style={styles.pickHeaderRow}>
              <Text style={typography.sectionTitle}>Today's picks</Text>
              {/* Disabled while loading so a double tap can't fire two
                  requests (each one costs API points). */}
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={loadPicks}
                disabled={loading}
              >
                <Ionicons name="shuffle" size={16} color={loading ? colors.inkFaint : colors.sage} />
                <Text style={[styles.shuffleText, loading && { color: colors.inkFaint }]}>
                  {loading ? 'Loading…' : 'Shuffle'}
                </Text>
              </TouchableOpacity>
            </View>
            {/* If a Shuffle fails but we still have recipes on screen, keep
                them and just mention the problem here. */}
            {error && picks.length > 0 && (
              <Text style={[typography.bodyMuted, styles.inlineError]}>{error.userMessage}</Text>
            )}
          </View>
        }
        // FlatList shows this instead of rows when `data` is empty — here
        // that means "still loading" or "loading failed".
        ListEmptyComponent={
          loading ? (
            <LoadingView label="Finding recipes…" />
          ) : error ? (
            <ErrorView message={error.userMessage} onRetry={loadPicks} />
          ) : null
        }
        ListFooterComponent={picks.length > 0 ? <PoweredBy /> : null}
        // Called once per item in `picks` to build each row.
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RecipeCard
              recipe={item}
              saved={bookmarks.some((b) => b.id === item.id)}
              onToggleSave={() => toggleBookmark(item)}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // flex: 1 makes this View expand to fill all available space — without
  // it, the View would shrink down to only as big as its content needs.
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pickHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // pushes the two children to opposite ends
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  shuffleButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shuffleText: { color: colors.sage, fontFamily: typography.label.fontFamily, fontSize: 13 },
  inlineError: { color: colors.paprika, marginBottom: spacing.md },
  cardWrap: { paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xxl }, // extra space below the last card
});
