import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { searchByName, searchByIngredients } from '../../data/recipeRepository';
import { useBookmarksStore } from '../../store/useBookmarksStore';

export default function SearchResultsScreen({ route, navigation }) {
  const { query = '', mode = 'name' } = route.params ?? {};
  const [results, setResults] = useState([]);
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked);
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);

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
        ListEmptyComponent={
          <Text style={[typography.bodyMuted, { marginTop: spacing.lg }]}>
            No recipes match that search. Try a different term.
          </Text>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            saved={isBookmarked(item.id)}
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
