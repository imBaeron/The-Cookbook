// The full recipe view: photo, meta info, diet tags, ingredients, steps,
// bookmark button, and "Add to Shopping List". Opened from a RecipeCard's
// onPress on Home, Search Results, or Saved.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing, radius } from '../../constants/theme';
import BookmarkButton from '../../components/BookmarkButton';
import { getRecipeById } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function RecipeDetailScreen({ route, navigation }) {
  // Only recipeId is passed in (not the whole recipe object) — this screen
  // looks up the full details itself via getRecipeById. Keeping params
  // small like this is cleaner than passing a big object through navigation.
  const { recipeId } = route.params ?? {};
  const [recipe, setRecipe] = useState(null);

  // All hooks are called at the TOP of the component, before any
  // conditional `return` below. This is a strict rule in React — hooks
  // must run in the exact same order on every render, so none of them can
  // be inside an `if` or after an early return.
  const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const addIngredientsFromRecipe = useAppStore((s) => s.addIngredientsFromRecipe);

  // Re-fetch if a different recipeId is opened (e.g. tapping a different
  // card while this screen type is already on the stack).
  useEffect(() => {
    getRecipeById(recipeId).then((r) => {
      setRecipe(r);
      // The header's title isn't known until the recipe loads, so it
      // starts blank (see RecipeStackNavigator) and gets set here once we
      // actually have the title.
      navigation.setOptions({ title: r?.title ?? '' });
    });
  }, [recipeId]);

  // Before the fetch finishes, `recipe` is still null — show a fallback
  // instead of crashing on recipe.title etc. below.
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={typography.bodyMuted}>Recipe not found.</Text>
      </View>
    );
  }

  const tags = getTags(recipe);
  const saved = bookmarkedIds.includes(recipe.id);

  const handleAddToShoppingList = () => {
    addIngredientsFromRecipe(recipe);
    Alert.alert('Added to Shopping List', `${recipe.ingredients.length} ingredients added.`);
  };

  return (
    // ScrollView (not FlatList) because this is one fixed block of content,
    // not a long scrolling list of many similar rows.
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="restaurant-outline" size={40} color={colors.inkFaint} />
        <BookmarkButton
          saved={saved}
          onToggle={() => toggleBookmark(recipe.id)}
          size={24}
          style={styles.bookmarkOverlay}
        />
      </View>

      <Text style={[typography.screenTitle, { marginTop: spacing.lg }]}>{recipe.title}</Text>

      <View style={styles.metaRow}>
        <MetaItem icon="time-outline" label={`${recipe.readyInMinutes} min`} />
        <MetaItem icon="people-outline" label={`${recipe.servings} servings`} />
        <MetaItem icon="pulse-outline" label={`Health score ${recipe.healthScore}`} />
      </View>

      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleAddToShoppingList} activeOpacity={0.85}>
        <Ionicons name="cart-outline" size={18} color={colors.paper} />
        <Text style={typography.button}>Add to Shopping List</Text>
      </TouchableOpacity>

      <Text style={[typography.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Ingredients
      </Text>
      {/* .map turns the ingredients array into one row per ingredient. */}
      {recipe.ingredients.map((ing) => (
        <View key={`${ing.name}-${ing.unit}`} style={styles.ingredientRow}>
          <View style={styles.bullet} />
          <Text style={typography.body}>
            {formatAmount(ing.amount)} {ing.unit} {ing.name}
          </Text>
        </View>
      ))}

      <Text style={[typography.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Instructions
      </Text>
      {/* index is available as the 2nd argument to .map — used here both as
          the key and to display "1.", "2." etc. */}
      {recipe.steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={[typography.body, styles.stepText]}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// A small local component for one row of meta info (time/servings/health).
// Avoids repeating the same Ionicons+Text layout 3 times above.
function MetaItem({ icon, label }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.inkLight} />
      <Text style={[typography.label, { marginLeft: 4 }]}>{label}</Text>
    </View>
  );
}

function getTags(recipe) {
  const tags = [];
  if (recipe.vegan) tags.push('Vegan');
  else if (recipe.vegetarian) tags.push('Vegetarian');
  if (recipe.glutenFree) tags.push('Gluten-free');
  if (recipe.healthScore >= 70) tags.push('Healthy');
  return tags;
}

// Shows "1.5" but also turns something like 1.00 into just "1" — avoids
// awkward ingredient amounts like "1.00 cup garlic".
function formatAmount(amount) {
  return Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/\.?0+$/, '');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imagePlaceholder: {
    height: 180,
    backgroundColor: colors.paperDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkOverlay: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tagPill: {
    backgroundColor: colors.sageBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { fontFamily: typography.label.fontFamily, fontSize: 11, color: colors.sage },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.paprika,
    borderRadius: radius.pill,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3, // half the width/height = a perfect circle
    backgroundColor: colors.sage,
    marginRight: spacing.sm,
  },
  stepRow: { flexDirection: 'row', marginBottom: spacing.md },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cover,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: { color: colors.paper, fontSize: 12, fontFamily: typography.label.fontFamily },
  stepText: { flex: 1 }, // lets the step text wrap onto multiple lines instead of overflowing
});
