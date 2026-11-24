// ====================================================================
// RECIPEDETAILSCREEN  —  ang buong detalye ng isang recipe
// ====================================================================
//
// 1) ANO ANG SCREEN NA ITO?
//    Ipinapakita ang isang recipe nang buo: litrato, pamagat, oras,
//    servings, health score, diet tags, ingredients, at mga hakbang. May
//    bookmark button at "Add to Shopping List" button.
//
// 2) MGA KONEKTADONG FILE
//    - Ang mga screen na nagbubukas nito:
//        HomeScreen at SearchResultsScreen (parehong stack) at
//        SavedRecipesScreen (ibang tab; kaya nested navigate ang gamit niya).
//        Lahat sila ay nagpapadala lang ng { recipeId }.
//    - navigation/RecipeStackNavigator.js
//        Nakarehistro bilang "RecipeDetail" na may BLANGKONG title. Ang
//        title ay inilalagay dito mismo gamit ang navigation.setOptions
//        pagkatapos ma-load ang recipe.
//    - data/recipeRepository.js -> getRecipeById(id)
//        -> services/api/recipeService.js
//             1. Sinusuri muna ang `detailCache` (30 minuto). Ang mga
//                recipe na galing sa getRandomRecipes (Home) ay nailagay
//                na roon, kaya bumubukas agad nang walang bagong request.
//             2. Kung wala: GET /recipes/{id}/information (via apiClient).
//             3. toDetail() ang nag-aayos ng sagot: toIngredients() ->
//                [{ name, amount, unit }] at toSteps() -> ['hakbang 1', ...].
//             4. Kapag 404 (hindi nahanap), `null` ang ibinabalik (hindi
//                error), kaya may hiwalay na mensaheng "not found".
//        -> services/api/apiClient.js (fetch, timeout, `.userMessage`)
//        -> (sample mode) data/mockRecipeRepository.js + mocks/recipes.js
//    - store/useAppStore.js
//        `bookmarks` + `toggleBookmark` (nagse-save ng maliit na SNAPSHOT
//        ng recipe) at `addIngredientsFromRecipe`.
//        -> utils/ingredientMerge.js: ang nagsasama ng mga ingredient sa
//           shopping list (tingnan ang paliwanag sa handleAddToShoppingList).
//    - components/BookmarkButton.js, LoadingView.js, ErrorView.js,
//      PoweredBy.js    mga bahagi ng UI.
//    - screens/shoppingList/ShoppingListScreen.js
//        Siya ang nagpapakita ng mga ingredient na idinagdag mula rito.
//    - constants/colors.js, constants/theme.js    kulay at text styles.
//
// 3) DATA FLOW (hakbang-hakbang)
//    A. PAG-LOAD
//       Pinindot ang card -> dumating ang `route.params.recipeId` ->
//       Unang render: recipe = null, loading = true -> LoadingView
//       (maagang `return`) -> tumakbo ang useEffect -> getRecipeById ->
//       .then: setRecipe(r) + navigation.setOptions({ title }) ->
//       .finally: setLoading(false) -> nag-re-render -> lumabas na ang
//       buong UI.
//       Kapag pumalya: setError -> ErrorView na may "Try again"
//       (setAttempt(n + 1) -> tatakbo ulit ang effect).
//    B. PAG-BOOKMARK
//       Pinindot ang BookmarkButton -> toggleBookmark(recipe) -> sa store,
//       idinagdag/inalis ang SNAPSHOT (id, title, image, oras, tags) sa
//       `bookmarks` -> naka-save sa AsyncStorage -> nag-re-render ang
//       screen (naka-subscribe sa `bookmarks`) -> nagbago ang `saved`.
//       Ang Saved tab ay gagamit ng parehong snapshot.
//    C. ADD TO SHOPPING LIST
//       Pinindot ang button -> handleAddToShoppingList ->
//       addIngredientsFromRecipe(recipe) -> sa store ay tinatawag ang
//       mergeIngredientsIntoList(lumang listahan, recipe.ingredients,
//       recipe.title) -> bagong listahan -> naka-save sa AsyncStorage ->
//       ang ShoppingListScreen (naka-subscribe sa `shoppingListItems`) ay
//       mag-a-update. Ang Alert.alert ay nagpapakita ng native na popup.
//
// 4) SAAN ANG LOGIC AT SAAN ANG UI?
//    LOGIC = mula sa unang `const` hanggang bago ang pinakahuling
//            `return (` (kasama ang useEffect, `tags`, `saved`, at
//            handleAddToShoppingList), PLUS ang mga helper function sa
//            ibaba (getTags at formatAmount). ("=== LOGIC ===")
//    UI    = ang tatlong maagang `return` (loading / error / not found),
//            ang pangunahing `return ( <ScrollView> ... )`, ang maliit na
//            component na MetaItem, at ang `styles`. ("=== UI ===")
//
//    Itsura ng pangunahing UI:
//      ScrollView
//      ├─ View (imageWrap): Image o placeholder icon + BookmarkButton (nakalutang)
//      ├─ Text (pamagat)
//      ├─ View (metaRow): MetaItem oras / servings / health score
//      ├─ View (tagRow): mga tag (Vegan, Gluten-free, ...)
//      ├─ TouchableOpacity "Add to Shopping List"
//      ├─ Ingredients: isang row kada ingredient (.map)
//      ├─ Instructions: isang row kada hakbang (.map)
//      └─ PoweredBy
// ====================================================================

import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing, radius } from '../../constants/theme';
import BookmarkButton from '../../components/BookmarkButton';
import LoadingView from '../../components/LoadingView';
import ErrorView from '../../components/ErrorView';
import PoweredBy from '../../components/PoweredBy';
import { getRecipeById } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

export default function RecipeDetailScreen({ route, navigation }) {
  // =================== === LOGIC === ===================

  // `route.params` ay ang { recipeId } na ipinadala ng nagbukas ng screen.
  // Ang `?? {}` ay panangga kung walang params. Ang `{ recipeId }` ay
  // destructuring. `recipeId` lang ang ipinapasa (hindi ang buong recipe)
  // dahil mas malinis at laging sariwa ang datos kapag ang screen na ito
  // mismo ang kumukuha ng detalye.
  const { recipeId } = route.params ?? {};

  // ---- STATE (useState) ----
  // `const [value, setValue] = useState(initial)`: ang `value` ay ang
  // kasalukuyang halaga; ang `setValue` ay ang function na pambago. Kapag
  // tinawag ang setter, mag-re-render ang component. Ang `initial` ay para
  // sa unang render lang.
  const [recipe, setRecipe] = useState(null); // ang recipe (wala pa -> null)
  const [loading, setLoading] = useState(true); // naghihintay pa ba?
  const [error, setError] = useState(null); // Error object kung pumalya
  const [attempt, setAttempt] = useState(0); // +1 sa "Try again" para tumakbo ulit ang effect

  // ---- ANG "RULES OF HOOKS" ----
  // Ang lahat ng hook (useState, useEffect, useAppStore) ay dapat tawagin
  // sa PINAKATAAS ng component at SA PAREHONG PAGKAKASUNOD-SUNOD sa bawat
  // render. Hindi puwede sa loob ng `if`, loop, o pagkatapos ng maagang
  // `return`, dahil sa pagkakasunod-sunod nila sinusubaybayan ni React
  // kung alin ang alin. Kaya NANDITO LAHAT bago ang mga `if (...) return`
  // sa ibaba.
  const bookmarks = useAppStore((s) => s.bookmarks); // DATA (nagti-trigger ng re-render)
  const toggleBookmark = useAppStore((s) => s.toggleBookmark); // ACTION
  const addIngredientsFromRecipe = useAppStore((s) => s.addIngredientsFromRecipe); // ACTION

  // ---- useEffect: pagkuha ng recipe ----
  // Tumatakbo pagkatapos ng unang render at tuwing magbabago ang `recipeId`
  // (ibang recipe ang binuksan) o `attempt` (nag-retry).
  useEffect(() => {
    // Panangga sa "race condition": kung nagbago ang recipeId o naisara
    // ang screen habang naghihintay pa, itatapon ang lumang sagot.
    // (Tingnan ang mas detalyadong paliwanag sa SearchResultsScreen.)
    let ignore = false;

    setLoading(true);
    setError(null);

    // Ang getRecipeById ay nagbabalik ng PROMISE (sagot na darating pa).
    getRecipeById(recipeId)
      .then((r) => {
        if (ignore) return;
        setRecipe(r);
        // Hindi pa alam ng header ang pamagat habang wala pang data, kaya
        // blangko ito sa RecipeStackNavigator at dito itinatakda.
        // `navigation.setOptions` ay nagbabago ng options ng screen na ito.
        // `r?.title` (OPTIONAL CHAINING) ay hindi mag-e-error kung `null`
        // ang `r`; ibabalik lang nito ang `undefined`. Ang `?? ''` ay
        // maglalagay ng blangkong text bilang panghalili.
        navigation.setOptions({ title: r?.title ?? '' });
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // CLEANUP: tatakbo bago ulit ang effect o kapag inalis ang screen.
    return () => {
      ignore = true;
    };
  }, [recipeId, attempt]);

  // =================== === UI (mga maagang return) ===================
  // Tatlong "maagang labas" (early return), ayon sa pagkakasunod: (1)
  // naglo-load pa, (2) pumalya, (3) wala ang recipe. Kapag tumama ang isa,
  // iyon lang ang ipapakita at hindi na aabot sa pangunahing UI sa ibaba.
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingView label="Loading recipe…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {/* `error.userMessage` ay nanggaling sa apiClient.js (mensaheng
            para sa tao). Ang onRetry ay nagpapataas ng `attempt`. */}
        <ErrorView message={error.userMessage} onRetry={() => setAttempt((n) => n + 1)} />
      </View>
    );
  }

  // Natapos ang pag-load nang walang error pero `null` ang recipe (404).
  if (!recipe) {
    return (
      <View style={styles.container}>
        <ErrorView message="That recipe couldn't be found." />
      </View>
    );
  }

  // =================== === LOGIC (mga kalkulasyon bago ang UI) ===================
  // Hindi ito mga state; MGA KINUKUWENTANG HALAGA ito na nire-recompute sa
  // bawat render mula sa `recipe` at `bookmarks`.
  const tags = getTags(recipe); // hal. ['Vegan', 'Gluten-free']
  const saved = bookmarks.some((b) => b.id === recipe.id); // true kung naka-bookmark na

  // Tinatawag kapag pinindot ang "Add to Shopping List".
  // `addIngredientsFromRecipe(recipe)` (sa store) ang nagsasama sa listahan.
  // Paano ang pagsasama (utils/ingredientMerge.js): bawat ingredient ay may
  // "key" = pangalan (maliliit na titik) + "__" + unit, hal. "garlic__cloves".
  //   - Kung may kaparehong key na sa listahan: IDINADAGDAG ang amount at
  //     idinaragdag ang pamagat ng recipe sa `fromRecipes`.
  //   - Kung wala pa: bagong row ang idinaragdag (checked: false).
  // Ang Alert.alert ay nagpapakita ng native na popup (pamagat, mensahe).
  const handleAddToShoppingList = () => {
    addIngredientsFromRecipe(recipe);
    Alert.alert('Added to Shopping List', `${recipe.ingredients.length} ingredients added.`);
  };

  // =================== === UI (pangunahing screen) ===================
  return (
    // ScrollView (hindi FlatList) dahil ito ay ISANG buong bloke ng
    // nilalaman, hindi mahabang listahan ng magkakahawig na row.
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageWrap}>
        {/* Ternary: kung may URL ng litrato, ipakita ang totoong litrato;
            kung wala, placeholder icon. `source={{ uri: ... }}` ang anyo
            para sa larawang galing sa internet. */}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="restaurant-outline" size={40} color={colors.inkFaint} />
        )}
        {/* CONTROLLED COMPONENT: ang BookmarkButton ay walang sariling
            state. Sinasabi natin sa kanya kung `saved` na at kung ano ang
            gagawin (`onToggle`) kapag pinindot. */}
        <BookmarkButton
          saved={saved}
          onToggle={() => toggleBookmark(recipe)}
          size={24}
          style={styles.bookmarkOverlay}
        />
      </View>

      <Text style={[typography.screenTitle, { marginTop: spacing.lg }]}>{recipe.title}</Text>

      {/* Bawat item ay ipinapakita lang KUNG MAY DATOS (`!= null` ay sumusuri
          sa parehong null at undefined). Hindi laging may oras o servings
          ang bawat recipe. */}
      <View style={styles.metaRow}>
        {recipe.readyInMinutes != null && (
          <MetaItem icon="time-outline" label={`${recipe.readyInMinutes} min`} />
        )}
        {recipe.servings != null && (
          <MetaItem icon="people-outline" label={`${recipe.servings} servings`} />
        )}
        {recipe.healthScore != null && (
          <MetaItem icon="pulse-outline" label={`Health score ${recipe.healthScore}`} />
        )}
      </View>

      {/* Ipinapakita lang ang hanay ng tags kung may kahit isa. */}
      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {/* `.map` ay ginagawang UI element ang bawat laman ng array.
              `key` ay natatanging pangalan ng bawat elemento para
              masubaybayan ni React. */}
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
      {/* `.map` -> isang row kada ingredient. Ang `key` ay may kasamang
          `index` dahil puwedeng dalawang beses lumabas ang parehong
          ingredient sa isang recipe (hal. butter sa sauce at butter sa
          kawali); kung pangalan lang ang key, magkakapareho ang key. */}
      {recipe.ingredients.map((ing, index) => (
        <View key={`${ing.name}-${index}`} style={styles.ingredientRow}>
          <View style={styles.bullet} />
          <Text style={typography.body}>
            {formatAmount(ing.amount)} {ing.unit} {ing.name}
          </Text>
        </View>
      ))}

      <Text style={[typography.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>
        Instructions
      </Text>
      {/* May recipe na walang nakasulat na hakbang; sabihin iyon imbes na
          mag-iwan ng blangkong espasyo. */}
      {recipe.steps.length === 0 && (
        <Text style={typography.bodyMuted}>No instructions were provided for this recipe.</Text>
      )}
      {/* Ang ikalawang parameter ng `.map` ay ang `index` (0, 1, 2...).
          Ginamit itong `key` at pang-numero ng hakbang (`index + 1`). */}
      {recipe.steps.map((step, index) => (
        <View key={index} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={[typography.body, styles.stepText]}>{step}</Text>
        </View>
      ))}

      <PoweredBy />
    </ScrollView>
  );
}

// Maliit na LOCAL COMPONENT para sa isang hilera ng impormasyon (icon +
// text). Para hindi ulit-ulitin ang parehong layout nang tatlong beses.
// `{ icon, label }` ay mga props na may destructuring.
function MetaItem({ icon, label }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.inkLight} />
      <Text style={[typography.label, { marginLeft: 4 }]}>{label}</Text>
    </View>
  );
}

// HELPER (logic): bumubuo ng listahan ng tag batay sa mga boolean ng recipe.
// Vegan ang inuuna; kung hindi vegan pero vegetarian, "Vegetarian".
// "Healthy" kung ang health score ay 70 pataas.
function getTags(recipe) {
  const tags = [];
  if (recipe.vegan) tags.push('Vegan');
  else if (recipe.vegetarian) tags.push('Vegetarian');
  if (recipe.glutenFree) tags.push('Gluten-free');
  if (recipe.healthScore >= 70) tags.push('Healthy');
  return tags;
}

// HELPER (logic): inaayos ang pagpapakita ng bilang. Ang buong numero (2)
// ay ipapakita nang ganoon; ang may decimal ay gagawing 2 decimal at aalisin
// ang sobrang zero (1.50 -> "1.5"). Ang regex na `/\.?0+$/` ay "alisin ang
// mga zero (at ang tuldok kung may kasama) sa dulo."
function formatAmount(amount) {
  return Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/\.?0+$/, '');
}

// Mga style. `position: 'absolute'` ay naglalabas ng elemento sa normal na
// daloy at inilalagay ito ayon sa `top/right` ng magulang (kaya "nakalutang"
// ang bookmark sa ibabaw ng litrato). `overflow: 'hidden'` ay pumuputol sa
// anumang lumalampas sa magulang (para sumunod ang litrato sa bilugang
// sulok).
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageWrap: {
    height: 180,
    backgroundColor: colors.paperDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // pinuputol ang litrato ayon sa bilugang sulok
  },
  image: { width: '100%', height: '100%' },
  bookmarkOverlay: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.sm }, // flexWrap: lilipat sa susunod na linya kapag kulang ang espasyo
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tagPill: {
    backgroundColor: colors.sageBg,
    borderRadius: radius.pill, // napakalaking radius = ganap na bilog ang dulo ("pill")
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
    borderRadius: 3, // kalahati ng lapad/taas = perpektong bilog
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
  stepText: { flex: 1 }, // pinapayagan ang mahabang text na mag-wrap sa ilang linya imbes na lumampas
});
