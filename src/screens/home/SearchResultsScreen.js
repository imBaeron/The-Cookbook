// Shows search results, reached by submitting the search bar on Home.
// Registered inside RecipeStackNavigator, so it has a back button to Home
// automatically (React Navigation adds that for any screen that isn't
// first in its stack).
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { searchByName, searchByIngredients } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function SearchResultsScreen({ route, navigation }) {
  // route.params holds whatever HomeScreen passed in via navigation.navigate.
  // The ?? {} fallback and = '' / = 'name' defaults mean this won't crash
  // even if this screen was somehow opened with no params at all.
  const { query = '', mode = 'name' } = route.params ?? {};
  const [results, setResults] = useState([]);
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // Re-run the search whenever query or mode changes — which happens every
  // time this screen is opened fresh with new params (navigating here again
  // with a different search updates route.params, which updates query/mode,
  // which re-triggers this effect).
  useEffect(() => {
    const run =
      mode === 'ingredients'
        ? searchByIngredients(query.split(',').map((s) => s.trim()).filter(Boolean))
        : searchByName(query);

    run.then(setResults);
  }, [query, mode]);

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <Text style={[typography.bodyMuted, { marginBottom: spacing.md }]}>
            {query
              ? `Results for "${query}" (${mode === 'ingredients' ? 'by ingredients' : 'by name'})`
              : 'All recipes'}
          </Text>
        }
        // Shown automatically by FlatList instead of renderItem when
        // `data` is an empty array.
        ListEmptyComponent={
          <Text style={[typography.bodyMuted, { marginTop: spacing.lg }]}>
            No recipes match that search. Try a different term.
          </Text>
        }
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
