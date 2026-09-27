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
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
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

        {recipe.readyInMinutes != null && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.inkLight} />
            <Text style={[typography.label, { marginLeft: 4 }]}>{recipe.readyInMinutes} min</Text>
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.tagRow}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  info: { padding: spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
