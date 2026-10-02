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

  // Shared state — read from useAppStore so the bookmark icon on every
  // card here matches what's actually saved, kept in sync across screens.
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // Pick 4 random recipes once, when the screen first loads. The empty
  // dependency array [] means "run only once, right after the first render"
  // — without it, calling setPicks here would trigger a re-render, which
  // would run this code again, forever (an infinite loop).
  useEffect(() => {
    getRandomRecipes(4).then(setPicks);
  }, []);

  // Re-runs the same random pick, triggered by the Shuffle button instead
  // of automatically.
  const handleShuffle = () => {
    getRandomRecipes(4).then(setPicks);
  };

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
              <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffle}>
                <Ionicons name="shuffle" size={16} color={colors.sage} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        // Called once per item in `picks` to build each row.
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RecipeCard
              recipe={item}
              saved={bookmarkedIds.includes(item.id)}
              onToggleSave={() => toggleBookmark(item.id)}
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
  cardWrap: { paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xxl }, // extra space below the last card
});
