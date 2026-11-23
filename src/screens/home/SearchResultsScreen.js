// Shows search results, reached by submitting the search bar on Home.
// Registered inside RecipeStackNavigator, so it has a back button to Home
// automatically (React Navigation adds that for any screen that isn't
// first in its stack).
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import LoadingView from '../../components/LoadingView';
import ErrorView from '../../components/ErrorView';
import PoweredBy from '../../components/PoweredBy';
import { searchByName, searchByIngredients } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function SearchResultsScreen({ route, navigation }) {
  // route.params holds whatever HomeScreen passed in via navigation.navigate.
  // The ?? {} fallback and = '' / = 'name' defaults mean this won't crash
  // even if this screen was somehow opened with no params at all.
  const { query = '', mode = 'name' } = route.params ?? {};
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // A counter we add 1 to when the user taps "Try again". Because it's in the
  // effect's dependency list below, changing it re-runs the search.
  const [attempt, setAttempt] = useState(0);

  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // Run the search whenever query or mode changes (or on a retry).
  useEffect(() => {
    // `ignore` protects against a "race": if the search changes while an
    // earlier request is still in flight, the OLD answer may arrive last and
    // overwrite the newer one. The cleanup function at the bottom flips
    // `ignore` to true for the old run, so its late answer is thrown away.
    let ignore = false;

    setLoading(true);
    setError(null);
    setResults([]); // clear old results so they don't show under the spinner

    const run =
      mode === 'ingredients'
        ? searchByIngredients(query.split(',').map((s) => s.trim()).filter(Boolean))
        : searchByName(query);

    run
      .then((data) => {
        if (!ignore) setResults(data);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // React runs this cleanup before re-running the effect (and when the
    // screen closes).
    return () => {
      ignore = true;
    };
  }, [query, mode, attempt]);

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <Text style={[typography.bodyMuted, { marginBottom: spacing.md }]}>
            {query
              ? `Results for "${query}" (${mode === 'ingredients' ? 'by ingredients' : 'by name'})`
              : 'Browse recipes'}
          </Text>
        }
        // Shown automatically by FlatList instead of renderItem when
        // `data` is an empty array: loading, failed, or genuinely no matches.
        ListEmptyComponent={
          loading ? (
            <LoadingView label="Searching…" />
          ) : error ? (
            <ErrorView message={error.userMessage} onRetry={() => setAttempt((n) => n + 1)} />
          ) : (
            <Text style={[typography.bodyMuted, { marginTop: spacing.lg }]}>
              No recipes match that search. Try a different term.
            </Text>
          )
        }
        ListFooterComponent={results.length > 0 ? <PoweredBy /> : null}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            saved={bookmarkedIds.includes(item.id)}
            onToggleSave={() => toggleBookmark(item.id)}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listContent: { paddingBottom: spacing.xxl },
});
