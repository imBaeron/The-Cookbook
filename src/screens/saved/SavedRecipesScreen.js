// Shows every bookmarked recipe. This is one of the bottom tabs, so it has
// no "back" button — it's a top-level destination, not pushed onto a stack.
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { getRecipeById } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function SavedRecipesScreen({ navigation }) {
  // The store only remembers IDs, not full recipe objects — this screen
  // has to look up the full details for each one itself.
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const [savedRecipes, setSavedRecipes] = useState([]);

  // Re-fetch the full recipe details whenever the list of bookmarked IDs
  // changes (this runs on every screen, since they all share the same store —
  // no need to also refresh "on focus").
  useEffect(() => {
    // Promise.all waits for every lookup to finish, then gives back all the
    // results together as one array, in the same order as bookmarkedIds.
    Promise.all(bookmarkedIds.map((id) => getRecipeById(id))).then((results) =>
      // .filter(Boolean) drops any nulls (in case a bookmarked recipe
      // somehow no longer exists).
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
            saved // every recipe on THIS screen is, by definition, saved
            onToggleSave={() => toggleBookmark(item.id)}
            // RecipeDetail lives inside the Cookbook tab's own stack, not
            // this tab's — so from here we have to say "go to the
            // RecipeStack tab, then inside it open RecipeDetail".
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
