import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { getRecipeById } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function SavedRecipesScreen({ navigation }) {
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Re-fetch the full recipe details whenever the list of bookmarked IDs
  // changes (this runs on every screen, since they all share the same store —
  // no need to also refresh "on focus").
  useEffect(() => {
    Promise.all(bookmarkedIds.map((id) => getRecipeById(id))).then((results) =>
      setSavedRecipes(results.filter(Boolean))
    );
  }, [bookmarkedIds]);

  return (
    <View style={styles.container}>
      <FlatList
        data={savedRecipes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.body}
        ListEmptyComponent={
          <Text style={typography.bodyMuted}>
            No saved recipes yet. Tap the bookmark icon on any recipe to save it here.
          </Text>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            saved
            onToggleSave={() => toggleBookmark(item.id)}
            onPress={() => navigation.navigate('RecipeStack', {
              screen: 'RecipeDetail',
              params: { recipeId: item.id },
            })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
