import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing, radius } from '../../constants/theme';
import SearchBar from '../../components/SearchBar';
import RecipeCard from '../../components/RecipeCard';
import { getRandomRecipes } from '../../data/recipeRepository';
import { useBookmarksStore } from '../../store/useBookmarksStore';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('name');
  const [picks, setPicks] = useState([]);
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked);
  const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);

  const loadPicks = useCallback(() => {
    getRandomRecipes(4).then(setPicks);
  }, []);

  // Re-shuffle each time Home comes into focus (e.g. after backing out of a recipe)
  useFocusEffect(
    useCallback(() => {
      loadPicks();
    }, [loadPicks])
  );

  const handleSubmit = () => {
    navigation.navigate('SearchResults', { query, mode });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={picks}
        keyExtractor={(item) => String(item.id)}
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
              <TouchableOpacity style={styles.shuffleButton} onPress={loadPicks}>
                <Ionicons name="shuffle" size={16} color={colors.sage} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RecipeCard
              recipe={item}
              saved={isBookmarked(item.id)}
              onToggleSave={() => toggleBookmark(item.id)}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pickHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  shuffleButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shuffleText: { color: colors.sage, fontFamily: typography.label.fontFamily, fontSize: 13 },
  cardWrap: { paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xxl },
});
