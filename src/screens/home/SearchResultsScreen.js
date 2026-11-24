// ====================================================================
// SEARCHRESULTSSCREEN  —  ang mga resulta ng hinanap
// ====================================================================
//
// 1) ANO ANG SCREEN NA ITO?
//    Lumalabas ito kapag pinindot ang Search sa HomeScreen. Ipinapakita nito
//    ang mga recipe na tumutugma sa tina-type ng user, "By Name" man o "By
//    Ingredients". Mayroon itong tatlong posibleng hitsura: naglo-load,
//    may error, o may listahan (o "walang tugma").
//
// 2) MGA KONEKTADONG FILE
//    - screens/home/HomeScreen.js
//        Siya ang nagpapadala ng { query, mode } sa pamamagitan ng
//        navigation.navigate('SearchResults', { query, mode }).
//    - navigation/RecipeStackNavigator.js
//        Nakarehistro rito bilang "SearchResults" (title: "Results"). Dahil
//        pangalawa siya sa stack, may awtomatikong BACK BUTTON papuntang Home.
//        Kusa ring ibinibigay dito ang `route` at `navigation` props.
//    - data/recipeRepository.js
//        Tinatawag natin ang searchByName() o searchByIngredients().
//        -> services/api/recipeService.js
//             searchByName:        GET /recipes/complexSearch (kasama na ang
//                                  oras at diet tags sa sagot)
//             searchByIngredients: GET /recipes/findByIngredients (walang
//                                  oras/diet tags; kaya blangko ang mga ito
//                                  sa card)
//             May CACHE (services/api/cache.js): kapag inulit ang parehong
//             search sa loob ng 10 minuto, sa memory na kukunin; walang
//             bagong request, walang nagagastos na API points.
//             Kapag walang inilagay na ingredient, [] agad ang sagot at
//             walang request na ipapadala.
//        -> services/api/apiClient.js  (ang nag-fe-fetch at nagko-convert ng
//             mga error sa `.userMessage`)
//        -> (sample mode) data/mockRecipeRepository.js + mocks/recipes.js
//    - components/RecipeCard.js, LoadingView.js, ErrorView.js, PoweredBy.js
//        Mga bahagi ng UI.
//    - store/useAppStore.js
//        `bookmarks` (para malaman kung saved na) at `toggleBookmark`.
//    - constants/colors.js, constants/theme.js   mga kulay at text styles.
//
// 3) DATA FLOW (hakbang-hakbang)
//    1. Pinindot ang Search sa Home -> dumating ang `route.params` =
//       { query, mode }.
//    2. Unang render: results = [], loading = true -> ipinapakita ang
//       spinner (LoadingView).
//    3. Tumatakbo ang useEffect (dahil unang render). Pumipili ito ng
//       function ayon sa `mode`, at tumatawag sa recipeRepository.
//    4. Dumating ang sagot -> setResults(data) -> nag-re-render -> ang
//       FlatList ay gumuguhit ng RecipeCard kada recipe.
//       Kapag pumalya -> setError(err) -> ErrorView. Sa dulo -> setLoading(false).
//    5. "Try again": setAttempt(n + 1) -> nagbago ang dependency na
//       `attempt` -> tumakbo ulit ang useEffect.
//    6. Bookmark: onToggleSave -> toggleBookmark(item) sa store -> nag-update
//       ang `bookmarks` -> nag-re-render -> nagbago ang icon.
//    7. Pagbukas ng recipe: navigate('RecipeDetail', { recipeId }).
//
// 4) SAAN ANG LOGIC AT SAAN ANG UI?
//    LOGIC = ang lahat bago ang `return (`: ang route.params, mga useState,
//            ang store, at ang useEffect ("=== LOGIC ===").
//    UI    = ang `return ( ... )` at ang `styles` ("=== UI ===").
//
//    Itsura ng UI:
//      View (container)
//      └─ FlatList
//         ├─ ListHeaderComponent -> Text: "Results for ..." o "Browse recipes"
//         ├─ ListEmptyComponent  -> LoadingView | ErrorView | "No recipes match..."
//         ├─ renderItem          -> RecipeCard (isa kada resulta)
//         └─ ListFooterComponent -> PoweredBy (kung may resulta)
// ====================================================================

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import RecipeCard from '../../components/RecipeCard';
import LoadingView from '../../components/LoadingView';
import ErrorView from '../../components/ErrorView';
import PoweredBy from '../../components/PoweredBy';
import { searchByName, searchByIngredients } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

// Dalawang props ang gamit dito (kusang ibinibigay ni React Navigation):
//   `route`      -> impormasyon tungkol sa screen na ito, kasama ang `params`
//   `navigation` -> pang-lipat sa ibang screen
export default function SearchResultsScreen({ route, navigation }) {
  // =================== === LOGIC === ===================

  // ---- PAGKUHA NG PARAMS ----
  // Ang `route.params` ay ang { query, mode } na ipinadala ng HomeScreen.
  //   `route.params ?? {}`  -> ang `??` (nullish coalescing) ay gagamit ng
  //      `{}` KUNG ang kaliwa ay `null` o `undefined`. Para hindi mag-crash
  //      kung bumukas ang screen na walang params.
  //   `const { query = '', mode = 'name' } = ...` -> DESTRUCTURING na may
  //      DEFAULT VALUES: kukunin ang `query` at `mode` sa object; kung
  //      wala ang isa, `''` at `'name'` ang gagamitin.
  const { query = '', mode = 'name' } = route.params ?? {};

  // ---- STATE ----
  // Tandaan: ang useState ay nagbabalik ng [kasalukuyang value, setter].
  // Ang argumento ay ang INITIAL VALUE para sa unang render lang. Kapag
  // tinawag ang setter, mag-re-render ang component gamit ang bagong value.
  const [results, setResults] = useState([]); // ang listahan ng recipe
  const [loading, setLoading] = useState(true); // naghihintay pa ba?
  const [error, setError] = useState(null); // Error object kung pumalya

  // Isang COUNTER na dinadagdagan ng 1 kapag pinindot ang "Try again".
  // Hindi mahalaga ang halaga niya; ang mahalaga ay NAGBABAGO siya. Dahil
  // nakalista siya sa dependency array ng useEffect sa ibaba, ang
  // pagbabago niya ay nagpapatakbo ulit ng search.
  const [attempt, setAttempt] = useState(0);

  // Shared state mula sa Zustand store. Pumipili tayo ng DATA (`bookmarks`)
  // kaya nagre-re-render ang screen kapag nagbago ito, at ng ACTION
  // (`toggleBookmark`) na tatawagin lang.
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // ---- useEffect: ang paghahanap ----
  // Tatakbo ito pagkatapos ng unang render AT tuwing magbabago ang `query`,
  // `mode`, o `attempt` (iyon ang laman ng dependency array sa dulo).
  useEffect(() => {
    // PROBLEMANG nilulutas ng `ignore` (tinatawag na "race condition"):
    // Halimbawa: hinanap ang "chicken" (mabagal ang sagot), tapos agad
    // hinanap ang "beef" (mabilis ang sagot). Kung dumating nang huli ang
    // sagot ng "chicken", mapapalitan nito ang tamang resulta ng "beef" na
    // lumabas na. Para maiwasan: bawat takbo ng effect ay may sariling
    // `ignore`. Ang CLEANUP function sa ibaba ang gagawa nitong `true` para
    // sa LUMANG takbo, kaya itatapon ang huling dating na sagot niya.
    let ignore = false;

    // Simulan ang paghihintay at linisin ang nakaraan.
    setLoading(true);
    setError(null);
    setResults([]); // para hindi maipakita ang lumang resulta sa ilalim ng spinner

    // Pumili ng search function ayon sa mode. Parehong nagbabalik ng PROMISE.
    //   Ingredients mode: ang "egg, rice" ay ginagawang ['egg', 'rice']:
    //     .split(',')        -> hatiin sa kuwit: ['egg', ' rice']
    //     .map(s => s.trim())-> alisin ang espasyo sa magkabilang dulo
    //     .filter(Boolean)   -> alisin ang mga walang laman (ang '' ay
    //                           "falsy", kaya natatanggal)
    //   Name mode: ipinapasa ang buong query.
    const run =
      mode === 'ingredients'
        ? searchByIngredients(query.split(',').map((s) => s.trim()).filter(Boolean))
        : searchByName(query);

    // Ang Promise chain. Sa bawat hakbang, sinusuri muna ang `ignore` para
    // hindi magamit ang sagot ng lumang takbo.
    run
      .then((data) => {
        if (!ignore) setResults(data);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    // CLEANUP FUNCTION: ang ibinabalik ng effect. Tatakbo ito (1) BAGO
    // tumakbo ulit ang effect dahil may nagbago sa dependencies, at (2)
    // kapag isinara/inalis ang screen. Dito natin ginagawang `true` ang
    // `ignore` ng lumang takbo.
    return () => {
      ignore = true;
    };
  }, [query, mode, attempt]);

  // =================== === UI === ===================
  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        // Ang pamagat sa itaas ng listahan. Gumagamit ng TEMPLATE LITERAL
        // (backticks `...${expression}...`) para isingit ang mga value sa
        // loob ng text, at ng TERNARY (kondisyon ? A : B). Kung may `query`,
        // ipakita ang "Results for ..."; kung wala, "Browse recipes".
        ListHeaderComponent={
          <Text style={[typography.bodyMuted, { marginBottom: spacing.md }]}>
            {query
              ? `Results for "${query}" (${mode === 'ingredients' ? 'by ingredients' : 'by name'})`
              : 'Browse recipes'}
          </Text>
        }
        // Lumalabas ito kapag WALANG LAMAN ang `results`. Tatlong dahilan
        // ang posible, kaya may nested ternary:
        //   naglo-load -> spinner
        //   may error  -> mensahe + "Try again" (na nagpapataas ng `attempt`)
        //   kung hindi -> talagang walang tumugma
        // `setAttempt((n) => n + 1)` ay FUNCTIONAL UPDATE: ang `n` ay ang
        // pinakabagong value ng state, kaya tama kahit sunod-sunod ang pindot.
        ListEmptyComponent={
          loading ? (
            <LoadingView label="Searching…" />
          ) : error ? (
            <ErrorView message={error.userMessage} onRetry={() => setAttempt((n) => n + 1)} />
          ) : (
            <Text style={[typography.bodyMuted, { marginTop: spacing.lg }]}>
              No recipes match that search. Try a different term.
            </Text>
          )
        }
        ListFooterComponent={results.length > 0 ? <PoweredBy /> : null}
        // Tinatawag ng FlatList kada item sa `results`.
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            // true kung may bookmark na kapareho ang id (`.some`)
            saved={bookmarks.some((b) => b.id === item.id)}
            // Arrow function para hindi agad tawagin habang nagre-render
            onToggleSave={() => toggleBookmark(item)}
            // Ipinapasa ang `recipeId` lang (hindi ang buong recipe). Ang
            // RecipeDetailScreen ang kukuha ng buong detalye.
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// Mga style (hindi CSS; mga JavaScript object). `flex: 1` = punuin ang
// available na espasyo; ang `padding...` ay espasyo SA LOOB ng View.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  listContent: { paddingBottom: spacing.xxl },
});
