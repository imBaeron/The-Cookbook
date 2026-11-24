// ====================================================================
// SAVEDRECIPESSCREEN  —  ang mga naka-bookmark na recipe
// ====================================================================
//
// 1) ANO ANG SCREEN NA ITO?
//    Ang "Saved" tab. Ipinapakita nito ang lahat ng recipe na na-bookmark,
//    ang pinakabago sa itaas. Hindi ito nangangailangan ng internet at hindi
//    gumagastos ng API points, dahil lahat ng kailangan ay nasa phone na.
//
// 2) MGA KONEKTADONG FILE
//    - navigation/MainTabNavigator.js
//        Dito nakarehistro ang screen na ito bilang tab na "Saved"
//        (headerShown: true, kaya may sariling header na "Saved"). Isa itong
//        TOP-LEVEL na tab, kaya walang back button.
//    - store/useAppStore.js   ANG PINAKAMAHALAGANG KONEKSYON ng screen na ito.
//        * `bookmarks`: array ng mga SNAPSHOT ng recipe (id, title, image,
//          readyInMinutes, servings, vegetarian, vegan, glutenFree,
//          healthScore). Sapat na ito para iguhit ang isang RecipeCard.
//        * `toggleBookmark`: nag-aalis o nagdaragdag ng bookmark.
//        * Ginagamit ng store ang Zustand `persist` + AsyncStorage: ang
//          laman nito ay SINISAVE SA PHONE at ibinabalik pagbukas ng app.
//          Ang App.js ay naghihintay (splash screen) hanggang ma-load ang
//          datos (`_hasHydrated`), kaya hindi blangko ang Saved tab pagbukas.
//    - components/RecipeCard.js   ang UI ng bawat card.
//    - screens/recipe/RecipeDetailScreen.js
//        Ang pinupuntahan kapag pinindot ang card. Nasa ibang navigator ito
//        (tingnan ang "nested navigate" sa ibaba).
//    - navigation/RecipeStackNavigator.js   kung saan nakarehistro ang
//        "RecipeDetail".
//    - Mga screen na pinagmumulan ng bookmark: HomeScreen,
//        SearchResultsScreen, RecipeDetailScreen. Lahat sila ay tumatawag ng
//        parehong `toggleBookmark`, kaya lumalabas dito ang bookmark nila.
//    - constants/colors.js, constants/theme.js
//
// 3) DATA FLOW (hakbang-hakbang)
//    A. PAGPAPAKITA
//       store.bookmarks -> `useAppStore((s) => s.bookmarks)` -> `bookmarks`
//       sa screen -> kopyahin at baligtarin ([...bookmarks].reverse()) ->
//       FlatList data -> renderItem -> RecipeCard.
//       Walang fetch, walang loading state, walang error state.
//    B. PAG-BOOKMARK SA IBANG SCREEN
//       toggleBookmark(recipe) sa store -> nagbago ang `bookmarks`.
//       Kung bukas na ang screen na ito, kusa siyang nag-re-render dahil
//       naka-subscribe siya sa `bookmarks`. Kung hindi pa nabubuksan ang
//       tab, pagbukas nito ay ang pinakabagong `bookmarks` na ang
//       mababasa, dahil nasa store ang datos at hindi sa screen.
//    C. PAG-UNBOOKMARK DITO
//       Pinindot ang icon -> toggleBookmark(item) -> inalis sa `bookmarks`
//       -> nag-re-render -> nawala ang card.
//    D. PAGBUKAS NG RECIPE
//       Pinindot ang card -> nested navigate papuntang RecipeStack >
//       RecipeDetail na may { recipeId }. Doon pa lang kukunin ang buong
//       detalye (ingredients at steps), na maaaring gumamit ng internet.
//
// 4) SAAN ANG LOGIC AT SAAN ANG UI?
//    LOGIC = ang dalawang linya ng useAppStore sa itaas ng function
//            ("=== LOGIC ===") at ang mga handler sa loob ng renderItem.
//    UI    = ang `return ( ... )` at ang `styles` ("=== UI ===").
//
//    Itsura ng UI:
//      View (container)
//      └─ FlatList
//         ├─ ListEmptyComponent -> Text "No saved recipes yet..."
//         └─ renderItem         -> RecipeCard (isa kada bookmark)
// ====================================================================

import { View, StyleSheet, FlatList, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import { useAppStore } from '../../store/useAppStore';

// Ang `{ navigation }` ay PROPS na may DESTRUCTURING: kusang ibinibigay ni
// React Navigation sa bawat screen na nakarehistro sa navigator.
export default function SavedRecipesScreen({ navigation }) {
  // =================== === LOGIC === ===================

  // Walang useState o useEffect sa screen na ito, at sinasadya iyon: ang
  // datos ay nasa STORE, hindi sa screen. Ang `useAppStore` ay custom hook
  // (Zustand). Ang `(s) => s.bookmarks` ay SELECTOR: `s` ang buong store, at
  // pinipili natin ang isang piraso. Nagre-re-render ang screen TUWING
  // NAGBABAGO ang pirasong iyon, kaya laging napapanahon ang listahan.
  //
  // PAGKAKAIBA ng dalawang linya sa ibaba:
  //   `bookmarks`      -> DATA: kapag nagbago, mag-re-render ang screen.
  //   `toggleBookmark` -> ACTION (function): hindi nagbabago ang reference
  //                       nito, kaya hindi nagti-trigger ng re-render;
  //                       tinatawag lang natin kapag kailangan.
  // (Isang bug na naayos natin noon: ang pagpili ng function imbes na ng
  // data para tukuyin kung naka-bookmark ay hindi nag-a-update ng screen.)
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // =================== === UI === ===================
  return (
    <View style={styles.container}>
      <FlatList
        // Ang store ay nag-iimbak ng bookmark mula pinakaluma hanggang
        // pinakabago; gusto nating pinakabago ang nasa itaas kaya
        // binabaligtad.
        // BAKIT `[...bookmarks]` MUNA? Ang `.reverse()` ay BINABAGO ang
        // array na tinatawagan niya. Hindi dapat direktang baguhin ang
        // datos ng store, kaya gumagawa muna ng KOPYA gamit ang SPREAD
        // (`...`), at ang kopya ang binabaligtad.
        data={[...bookmarks].reverse()}
        // Natatanging STRING na id kada row (numero ang id kaya String()).
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.body}
        // Ipinapakita ng FlatList ito kapag WALANG LAMAN ang `data`.
        ListEmptyComponent={
          <Text style={typography.bodyMuted}>
            No saved recipes yet. Tap the bookmark icon on any recipe to save it here.
          </Text>
        }
        // Tinatawag kada item. `{ item }` ay destructuring ng object na
        // ibinibigay ng FlatList.
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            // `saved` na walang `=` ay shorthand ng `saved={true}`. Lahat ng
            // recipe sa screen na ito ay naka-bookmark na sa kahulugan.
            saved
            // Dahil `saved` na ang mga ito, ang pagpindot sa icon ay
            // UNBOOKMARK. Arrow function (`() =>`) para hindi agad tawagin
            // habang nagre-render, kundi kapag pinindot lang.
            onToggleSave={() => toggleBookmark(item)}
            // NESTED NAVIGATE: Ang RecipeDetail ay nakarehistro sa
            // RecipeStackNavigator, na nasa loob ng ibang tab ("RecipeStack").
            // Ang screen na ito ay nasa tab na "Saved", kaya hindi niya
            // direktang makita ang "RecipeDetail". Kaya sinasabi natin ang
            // dalawang antas: "pumunta sa tab na RecipeStack, at sa loob
            // niyon buksan ang screen na RecipeDetail na may ganitong
            // params." (Ihambing sa Home: `navigate('RecipeDetail', ...)`
            // lang, dahil nasa iisang stack sila.)
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

// Mga style (JavaScript object, hindi CSS). `flex: 1` = punuin ang available
// na espasyo ng screen. Ang `padding` ay espasyo SA LOOB ng elemento.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
