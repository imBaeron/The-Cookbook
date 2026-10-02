// A reusable recipe preview card: photo, title, cook time, diet tags, and a
// bookmark button. Used on Home, Search Results, and Saved — written once
// here instead of being copy-pasted into all three screens.
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography, spacing, radius } from '../constants/theme';
import BookmarkButton from './BookmarkButton';

// Shape expected: { id, title, image, readyInMinutes, vegetarian, vegan,
// glutenFree, healthScore } — matches Spoonacular's recipe object so this
// component doesn't change when Step 3 swaps dummy data for the real API.
export default function RecipeCard({ recipe, onPress, saved = false, onToggleSave }) {
  const tags = getTags(recipe);

  return (
    // The whole card is one big tappable area — tapping anywhere on it
    // (except the bookmark icon, which has its own onPress) opens the recipe.
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
        {/* Our mock data has no real photos, so image is always null right
            now — this shows a placeholder icon instead of a broken image. */}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant-outline" size={28} color={colors.inkFaint} />
          </View>
        )}
        <BookmarkButton saved={saved} onToggle={onToggleSave} style={styles.bookmark} />
      </View>

      <View style={styles.info}>
        <Text style={typography.recipeTitle} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Only show cook time if we actually have it (ingredient-search
            results don't include it until the detail screen fills it in). */}
        {recipe.readyInMinutes != null && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.inkLight} />
            <Text style={[typography.label, { marginLeft: 4 }]}>{recipe.readyInMinutes} min</Text>
          </View>
        )}

        {/* tags.length > 0 && <X /> only renders <X /> when the condition
            is true — nothing shows if there are no tags to display. */}
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {/* .map turns each tag string into a small pill element.
                key={tag} gives React a unique ID to track each one. */}
            {tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Builds the list of tag labels (Vegan, Vegetarian, Gluten-free, Healthy)
// to display, based on the recipe's boolean fields.
function getTags(recipe) {
  const tags = [];
  if (recipe.vegan) tags.push('Vegan');
  else if (recipe.vegetarian) tags.push('Vegetarian');
  if (recipe.glutenFree) tags.push('Gluten-free');
  if (recipe.healthScore >= 70) tags.push('Healthy');
  return tags;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Clips the image's square corners to match the card's rounded corners
    // — without this, the photo would poke out past the rounded edge.
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrap: {
    height: 140,
    backgroundColor: colors.paperDark,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center', // centers horizontally (this is a column, so this is the cross axis)
    justifyContent: 'center', // centers vertically (the main axis, since default direction is column)
  },
  bookmark: {
    // Taking it out of normal layout flow and pinning it to a corner,
    // floating on top of the photo, using the nearest positioned parent
    // (imageWrap) as the reference point.
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  info: { padding: spacing.md },
  metaRow: {
    flexDirection: 'row', // icon and text side by side instead of stacked
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // lets tags drop to a second line instead of overflowing
    marginTop: spacing.sm,
    gap: 6,
  },
  tagPill: {
    backgroundColor: colors.sageBg,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.sage,
  },
});
