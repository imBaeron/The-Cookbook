import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { getRecipeById } from '../../data/recipeRepository';
import { useBookmarksStore } from '../../store/useBookmarksStore';

export default function SavedRecipesScreen({ navigation }) {
  const bookmarkedIds = useBookmarksStore((s) => s.bookmarkedIds);
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
  const [savedRecipes, setSavedRecipes] = useState([]);

  const loadSaved = useCallback(() => {
    Promise.all(bookmarkedIds.map((id) => getRecipeById(id))).then((results) =>
      setSavedRecipes(results.filter(Boolean))
    );
  }, [bookmarkedIds]);

  useEffect(loadSaved, [loadSaved]);
  useFocusEffect(loadSaved);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.screenTitle}>Saved</Text>
      </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { padding: spacing.lg, paddingBottom: 0 },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
