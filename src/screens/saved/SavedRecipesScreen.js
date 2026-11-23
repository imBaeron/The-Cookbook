// Shows every bookmarked recipe. This is one of the bottom tabs, so it has
// no "back" button — it's a top-level destination, not pushed onto a stack.
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { useAppStore } from '../../store/useAppStore';

export default function SavedRecipesScreen({ navigation }) {
  // The store keeps a small snapshot of every bookmarked recipe (title, photo,
  // time, diet tags — see toSnapshot in useAppStore.js), saved on the phone.
  // That's everything a card needs, so this screen has nothing to fetch: no
  // loading spinner, no internet needed, no API points spent. (Before saving
  // to the phone existed, this screen had to look every bookmark up again.)
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  return (
    <View style={styles.container}>
      <FlatList
        // The store keeps bookmarks oldest-first; show the newest on top.
        // [...bookmarks] makes a copy first, because .reverse() changes the
        // array it's called on, and we must never modify store data directly.
        data={[...bookmarks].reverse()}
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
            onToggleSave={() => toggleBookmark(item)}
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
