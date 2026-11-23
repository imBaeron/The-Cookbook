// Shows every bookmarked recipe. This is one of the bottom tabs, so it has
// no "back" button — it's a top-level destination, not pushed onto a stack.
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import LoadingView from '../../components/LoadingView';
import { getRecipeById } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function SavedRecipesScreen({ navigation }) {
  // The store only remembers IDs, not full recipe objects — this screen
  // has to look up the full details for each one itself.
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failedCount, setFailedCount] = useState(0); // how many couldn't be loaded

  // Re-fetch the full recipe details whenever the list of bookmarked IDs
  // changes (this runs on every screen, since they all share the same store —
  // no need to also refresh "on focus"). Recipes we've already loaded are
  // answered from the cache in recipeService.js, so this rarely costs a request.
  useEffect(() => {
    let ignore = false; // drop the answer if the list changed again meanwhile

    if (bookmarkedIds.length === 0) {
      setSavedRecipes([]);
      setFailedCount(0);
      return;
    }

    setLoading(true);

    // Promise.allSettled waits for EVERY lookup and reports each one's outcome
    // (fulfilled or rejected). Unlike Promise.all, one failure (e.g. a lost
    // connection) doesn't throw away the recipes that did load.
    Promise.allSettled(bookmarkedIds.map((id) => getRecipeById(id))).then((outcomes) => {
      if (ignore) return;
      const loaded = outcomes
        .filter((o) => o.status === 'fulfilled' && o.value) // .value is null if not found
        .map((o) => o.value);
      setSavedRecipes(loaded);
      setFailedCount(outcomes.filter((o) => o.status === 'rejected').length);
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [bookmarkedIds]);

  return (
    <View style={styles.container}>
      <FlatList
        data={savedRecipes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.body}
        // Only shown when some recipes couldn't be loaded.
        ListHeaderComponent={
          failedCount > 0 ? (
            <Text style={[typography.bodyMuted, styles.notice]}>
              {failedCount === 1
                ? "1 saved recipe couldn't be loaded right now."
                : `${failedCount} saved recipes couldn't be loaded right now.`}{' '}
              Check your connection and reopen this tab.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <LoadingView label="Loading saved recipes…" />
          ) : (
            <Text style={typography.bodyMuted}>
              No saved recipes yet. Tap the bookmark icon on any recipe to save it here.
            </Text>
          )
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
  notice: { color: colors.paprika, marginBottom: spacing.md },
});
