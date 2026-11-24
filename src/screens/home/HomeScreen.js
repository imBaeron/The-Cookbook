// ====================================================================
// HOMESCREEN  —  ang unang screen ng app
// ====================================================================
//
// 1) ANO ANG SCREEN NA ITO?
//    Ito ang unang lumalabas pagbukas ng "Cookbook" tab. Mayroon itong:
//      (a) pagbati ("Good afternoon" — naka-hardcode ito, hindi nagbabago
//          ayon sa oras)
//      (b) search bar (puwedeng "By Name" o "By Ingredients")
//      (c) "Today's picks": 4 na random na recipe galing sa Spoonacular API
//      (d) Shuffle button para kumuha ng bagong 4 na random na recipe
//
// 2) MGA KONEKTADONG FILE (at ano ang ibinibigay nila sa screen na ito)
//    - navigation/RecipeStackNavigator.js
//        Dito nakarehistro ang screen na ito bilang "Home"
//        (<Stack.Screen name="Home" component={HomeScreen} />).
//        Dahil nakarehistro siya, kusang ibinibigay ni React Navigation ang
//        `navigation` prop. Iyon ang gamit natin pang-lipat ng screen.
//    - navigation/MainTabNavigator.js
//        Ang buong stack (Home -> SearchResults -> RecipeDetail) ay nakalagay
//        sa loob ng tab na "RecipeStack" (tinatawag na "Cookbook" sa tab bar).
//    - components/SearchBar.js     UI ng search box at ng toggle na
//                                  "By Name / By Ingredients".
//    - components/RecipeCard.js    UI ng bawat recipe card (litrato, pamagat,
//                                  oras, tags, bookmark icon).
//    - components/LoadingView.js   Spinner habang naghihintay ng data.
//    - components/ErrorView.js     Mensahe ng error + "Try again" button.
//    - components/PoweredBy.js     Credit link papuntang Spoonacular sa baba.
//    - data/recipeRepository.js    ANG TANGING pinagkukunan ng recipe data ng
//                                  screen na ito. Tinatawag natin ang
//                                  getRandomRecipes(). Siya ang pumipili kung
//                                  totoong API o sample data ang gagamitin
//                                  (ayon sa EXPO_PUBLIC_USE_MOCK_DATA sa .env,
//                                  binabasa ng constants/config.js).
//        -> services/api/recipeService.js  (totoong bersyon) gumagawa ng
//           request at inaayos ang hugis ng sagot ng Spoonacular.
//        -> services/api/apiClient.js      ang talagang nag-fe-fetch; may
//           timeout; ginagawang may `.userMessage` ang bawat error.
//        -> services/api/cache.js          pang-tipid ng API points.
//        -> data/mockRecipeRepository.js + mocks/recipes.js  (sample/offline).
//    - store/useAppStore.js
//        Zustand store na SHARED ng lahat ng screen. Dito galing ang
//        `bookmarks` (listahan ng mga naka-save) at ang `toggleBookmark`
//        (pang-save/pang-unsave). Naka-save ito sa phone gamit ang
//        AsyncStorage kaya hindi nawawala kapag isinara ang app.
//    - constants/colors.js at constants/theme.js
//        Mga kulay, spacing, font at text styles (design tokens).
//
// 3) DATA FLOW (hakbang-hakbang)
//    A. PAG-LOAD NG RANDOM NA RECIPE
//       Bumukas ang screen -> unang render -> tumakbo ang useEffect([]) ->
//       loadPicks() -> setLoading(true) -> getRandomRecipes(4)
//       [recipeRepository -> recipeService -> apiClient -> Spoonacular] ->
//       bumalik ang listahan -> .then(setPicks) -> nagbago ang state `picks`
//       -> nag-re-render ang HomeScreen -> ang FlatList ay gumuhit ng
//       RecipeCard para sa bawat recipe.
//       Kapag pumalya: .catch(setError) -> lalabas ang ErrorView.
//       Sa dulo, kahit ano ang nangyari: .finally -> setLoading(false).
//    B. PAG-SEARCH
//       Nagta-type ang user -> tinatawag ng SearchBar ang onChangeText
//       (setQuery) sa bawat titik -> nagbabago ang `query` -> pinindot ang
//       Search/Enter -> onSubmit = handleSubmit ->
//       navigation.navigate('SearchResults', { query, mode }) -> bubukas ang
//       SearchResultsScreen at matatanggap niya ang { query, mode } bilang
//       `route.params`.
//    C. PAG-BOOKMARK
//       Pinindot ang bookmark icon sa card -> onToggleSave ->
//       toggleBookmark(item) sa store -> nagbago ang `bookmarks` sa store
//       (at nai-save sa AsyncStorage) -> dahil naka-subscribe ang screen na
//       ito sa `bookmarks`, nag-re-render ito -> nag-iba ang `saved` na
//       ipinapasa sa RecipeCard -> nagbago ang itsura ng icon.
//    D. PAGBUKAS NG RECIPE
//       Pinindot ang card -> onPress ->
//       navigation.navigate('RecipeDetail', { recipeId }) ->
//       RecipeDetailScreen.
//
// 4) SAAN ANG LOGIC AT SAAN ANG UI SA FILE NA ITO?
//    LOGIC = lahat ng nasa loob ng function BAGO ang `return (`:
//            ang mga useState, ang store, loadPicks, useEffect, handleSubmit.
//            (hanapin ang marker na "=== LOGIC ===")
//    UI    = ang `return ( ... )` at ang `styles` sa pinakababa.
//            (hanapin ang marker na "=== UI ===")
//
//    Ang itsura ng UI (parang puno):
//      View (container, flex: 1)
//      └─ FlatList
//         ├─ ListHeaderComponent -> View (header)
//         │     ├─ Text "Good afternoon"
//         │     ├─ Text "What are you in the mood to cook?"
//         │     ├─ SearchBar
//         │     ├─ View (pickHeaderRow): Text "Today's picks" + Shuffle button
//         │     └─ (kung may error pero may recipe pa) Text ng error
//         ├─ renderItem -> View (cardWrap) -> RecipeCard   (isa kada recipe)
//         ├─ ListEmptyComponent -> LoadingView | ErrorView | wala
//         └─ ListFooterComponent -> PoweredBy (kung may recipe)
// ====================================================================

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import SearchBar from '../../components/SearchBar';
import RecipeCard from '../../components/RecipeCard';
import LoadingView from '../../components/LoadingView';
import ErrorView from '../../components/ErrorView';
import PoweredBy from '../../components/PoweredBy';
import { getRandomRecipes } from '../../data/recipeRepository';
import { useAppStore } from '../../store/useAppStore';

// Ang `HomeScreen` ay isang FUNCTION COMPONENT: isang function na nagbabalik
// ng UI (JSX). Tinatawag ito ni React sa bawat "render".
//
// Ang parameter na `{ navigation }` ay PROPS na may DESTRUCTURING. Ang
// totoong parameter ay isang object ng props (`{ navigation, route }`); dito
// kinukuha lang natin ang `navigation`. Kusa itong ibinibigay ni React
// Navigation sa bawat screen na nakarehistro sa isang navigator. (May
// `route` din, pero hindi natin kailangan dito.)
export default function HomeScreen({ navigation }) {
  // =================== === LOGIC === ===================

  // ---- LOCAL STATE (useState) ----
  // PAANO GUMAGANA ANG useState:
  //   const [query, setQuery] = useState('');
  //   - Ang useState ay isang HOOK ng React. Para itong "alaala" ng component.
  //   - Nagbabalik ito ng ARRAY na may dalawang laman:
  //       [0] ang KASALUKUYANG VALUE   -> `query`
  //       [1] ang FUNCTION na pambago  -> `setQuery`
  //     Ang `const [a, b] = ...` ay "array destructuring": kinukuha ang unang
  //     laman bilang `a` at ang ikalawa bilang `b`. Malaya ang pangalan;
  //     ang kaugalian ay `value` at `setValue`.
  //   - Ang argumento (`''`) ay ang INITIAL VALUE. Ginagamit lang ito sa
  //     UNANG render. Sa mga susunod, ibinibigay na ni React ang value na
  //     naka-imbak sa kanya.
  //   - Bakit hindi ordinaryong variable (`let query = ''`)? Dahil ang
  //     component ay function na TINATAWAG ULIT sa bawat render, kaya
  //     magre-reset ang ordinaryong variable. Ang state ay iniingatan ni
  //     React sa labas ng function.
  //   - Ang `setQuery('pasta')` ay HINDI direktang nagbabago ng `query`.
  //     Humihiling ito kay React na i-update ang state at mag-RE-RENDER
  //     (tawagin ulit ang HomeScreen). Sa bagong render, `query` na ay
  //     'pasta'. Kaya huwag gawin ang `query = 'pasta'`: hindi malalaman ni
  //     React na may nagbago, kaya hindi mag-a-update ang screen.
  //   - Hindi agad nagbabago ang variable sa loob ng KASALUKUYANG render
  //     pagkatawag ng setter; ang bagong value ay makikita sa SUSUNOD na
  //     render.
  //
  // Ang tatlong ito ay LOCAL state: HomeScreen lang ang nangangailangan.
  const [query, setQuery] = useState(''); // ang tina-type sa search box
  const [mode, setMode] = useState('name'); // 'name' o 'ingredients'
  const [picks, setPicks] = useState([]); // ang 4 na random na recipe (simula: walang laman)

  // Ang bawat bagay na kumukuha ng data sa internet ay may tatlong
  // posibleng sitwasyon: naghihintay pa, pumalya, o nagtagumpay. Kaya
  // dalawa pang state ang kailangan:
  //   loading -> naghihintay pa ba? (nagsisimula sa `true` dahil
  //              magla-load agad pagbukas ng screen)
  //   error   -> kung pumalya, ang Error object (kung hindi, `null`)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- SHARED STATE (Zustand store) ----
  // Ang `useAppStore` ay custom hook (galing sa store/useAppStore.js).
  // Ang `(s) => s.bookmarks` ay isang SELECTOR: ang `s` ay ang buong store,
  // at ibinabalik natin ang isang piraso lang.
  // Mahalaga: nagre-re-render ang screen na ito TUWING NAGBABAGO ang
  // pirasong pinili. Kaya kapag may nag-bookmark kahit sa ibang screen,
  // mag-a-update din ang mga icon dito.
  const bookmarks = useAppStore((s) => s.bookmarks);
  // Ito ay ACTION (function). Hindi nagbabago ang reference nito, kaya hindi
  // ito nagti-trigger ng re-render; tinatawag lang natin ito kapag kailangan.
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);

  // ---- FUNCTION NA KUMUKUHA NG RANDOM NA RECIPE ----
  // Ginagamit ito ng tatlong bagay: ng unang load, ng Shuffle button, at ng
  // "Try again" button. Sa isang lugar lang nakasulat ang loading/error
  // handling kaya hindi na inuulit.
  function loadPicks() {
    setLoading(true); // simula na ng paghihintay
    setError(null); // burahin ang lumang error (kung nag-retry)

    // Ang getRandomRecipes ay nagbabalik ng PROMISE: "pangako" na may sagot
    // na darating mamaya (kailangang maghintay sa internet). Ang
    // `.then/.catch/.finally` ay mga paraan para sabihin kung ano ang gagawin
    // kapag dumating na ang sagot:
    getRandomRecipes(4)
      // Tagumpay. Ang `.then(setPicks)` ay maikling anyo ng
      // `.then((data) => setPicks(data))`. Ito ang magpapa-update ng `picks`.
      .then(setPicks)
      // Pumalya (walang internet, naubos ang quota, atbp.). Isinasave ang
      // error para maipakita (tingnan ang `error.userMessage`).
      .catch(setError)
      // Tatakbo KAHIT TAGUMPAY O PUMALYA: tapos na ang paghihintay.
      .finally(() => setLoading(false));
  }

  // ---- useEffect: "gawin ito PAGKATAPOS mag-render" ----
  // Ang useEffect ay para sa SIDE EFFECTS, mga gawaing hindi bahagi ng
  // pagguhit ng UI, tulad ng pag-fetch ng data.
  // Ang ikalawang argumento ay ang DEPENDENCY ARRAY. Ito ang nagsasabi kung
  // KAILAN tatakbo ang effect:
  //   []         -> ISANG BESES LANG, pagkatapos ng unang render (pagbukas
  //                 ng screen). Ito ang ginagamit dito.
  //   [a, b]     -> pagkatapos ng unang render AT tuwing nagbabago ang a o b.
  //   (wala)     -> pagkatapos ng BAWAT render.
  // Bakit hindi ilagay ang `loadPicks()` mismo sa katawan ng component?
  // Dahil magiging walang katapusang loop: ang setPicks ay nagpapa-render
  // -> tatakbo ulit ang loadPicks -> setPicks ulit -> render ulit...
  useEffect(() => {
    loadPicks();
  }, []);

  // Ang pang-lipat sa SearchResults. Ang `navigation.navigate(pangalan,
  // params)`:
  //   - 'SearchResults' ay dapat KATUGMA ng `name="SearchResults"` sa
  //     RecipeStackNavigator.js.
  //   - Ang ikalawang argumento ay PARAMS: datos na dadalhin sa susunod na
  //     screen. Doon, makukuha ito bilang `route.params`.
  //   - `{ query, mode }` ay shorthand ng `{ query: query, mode: mode }`.
  const handleSubmit = () => {
    navigation.navigate('SearchResults', { query, mode });
  };

  // =================== === UI === ===================
  // Ang `return` ay ang inilalarawan ng screen. Ang JSX (mukhang HTML) ay
  // JavaScript pa rin; ang nasa loob ng `{ }` ay JavaScript expression.
  return (
    <View style={styles.container}>
      {/* Ang FlatList ay pang-scroll na listahan. Ang mga row na nakikita
          lang sa screen ang ginuguhit niya (matipid sa memory). */}
      <FlatList
        // `data`: ang array na ililista (dito, ang `picks`). Kapag nagbago
        // ang `picks`, kusang mag-a-update ang listahan.
        data={picks}
        // Kailangan ng bawat row ng natatanging STRING na id para masubaybayan
        // ni React kung alin ang alin. Numero ang id ng recipe kaya
        // String(...) ang ginamit.
        keyExtractor={(item) => String(item.id)}
        // Lahat ng nasa ITAAS ng listahan (pagbati, search bar, "Today's
        // picks"). Sumasama ito sa pag-scroll ng listahan.
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.screenTitle}>Good afternoon</Text>
            {/* Ang style na array ay PINAGSASAMA ang mga style; ang huli
                ang nananaig kapag may magkapareho. */}
            <Text style={[typography.bodyMuted, { marginTop: spacing.xs, marginBottom: spacing.lg }]}>
              What are you in the mood to cook?
            </Text>
            {/* CONTROLLED COMPONENT: ang SearchBar ay walang sariling state.
                Ang HomeScreen ang may hawak ng `query` at `mode`, at ipinapasa
                bilang props kasama ang mga setter:
                  value={query}          -> ito ang ipinapakita sa input
                  onChangeText={setQuery}-> tinatawag sa bawat titik na tina-type
                  mode / onModeChange    -> aling toggle ang aktibo / pagpalit
                  onSubmit               -> kapag pinindot ang Search sa keyboard */}
            <SearchBar
              value={query}
              onChangeText={setQuery}
              mode={mode}
              onModeChange={setMode}
              onSubmit={handleSubmit}
            />
            <View style={styles.pickHeaderRow}>
              <Text style={typography.sectionTitle}>Today's picks</Text>
              {/* `disabled={loading}`: hindi mapipindot habang naglo-load,
                  para hindi makagawa ng dalawang request nang sabay (bawat
                  request ay gumagastos ng API points). Dahil dito, wala
                  nang "race" kaya hindi na kailangan ng `ignore` na gaya
                  sa SearchResultsScreen. */}
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={loadPicks}
                disabled={loading}
              >
                {/* Ternary: kondisyon ? kung-totoo : kung-hindi. Kulay-abo
                    kapag naglo-load, kulay-sage kapag hindi. */}
                <Ionicons name="shuffle" size={16} color={loading ? colors.inkFaint : colors.sage} />
                {/* `loading && {...}` ay nagdaragdag lang ng style kapag
                    `true` ang loading (kapag false, binabalewala ito). */}
                <Text style={[styles.shuffleText, loading && { color: colors.inkFaint }]}>
                  {loading ? 'Loading…' : 'Shuffle'}
                </Text>
              </TouchableOpacity>
            </View>
            {/* CONDITIONAL RENDERING gamit ang `&&`: ipapakita lang ang Text
                kung TOTOO ang lahat ng kondisyon (may error AT may recipe
                pa sa screen). Kung hindi, wala itong ipapakita. Halimbawa:
                pumalya ang Shuffle pero nandoon pa ang lumang recipe;
                iiwan ang mga iyon at babanggitin lang ang problema. */}
            {error && picks.length > 0 && (
              <Text style={[typography.bodyMuted, styles.inlineError]}>{error.userMessage}</Text>
            )}
          </View>
        }
        // Ipinapakita ng FlatList ito KAPAG WALANG LAMAN ang `data`. Dito:
        // naglo-load -> spinner; pumalya -> error + Try again; kung wala
        // namang dahilan (hindi nangyayari rito) -> wala.
        ListEmptyComponent={
          loading ? (
            <LoadingView label="Finding recipes…" />
          ) : error ? (
            // `onRetry={loadPicks}`: ipinapasa ang function bilang prop;
            // tatawagin ito ng ErrorView kapag pinindot ang "Try again".
            <ErrorView message={error.userMessage} onRetry={loadPicks} />
          ) : null
        }
        // Nasa baba ng listahan; ipinapakita lang kung may recipe.
        ListFooterComponent={picks.length > 0 ? <PoweredBy /> : null}
        // Tinatawag ng FlatList ISANG BESES KADA ITEM sa `picks`. Binibigyan
        // niya tayo ng object na `{ item, index }`; kinukuha natin ang
        // `item` (isang recipe) gamit ang destructuring.
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RecipeCard
              recipe={item}
              // `.some(...)` ay nagbabalik ng true kung may kahit isang
              // bookmark na may kaparehong id. Ito ang tumutukoy kung
              // "saved" ang card (kulay/hugis ng icon).
              saved={bookmarks.some((b) => b.id === item.id)}
              // Bakit may `() =>`? Kung isusulat ang `toggleBookmark(item)`
              // nang walang arrow, TATAWAGIN ito AGAD habang nagre-render.
              // Ang arrow function ay "ipagpapaliban": tatawagin lang kapag
              // pinindot talaga.
              onToggleSave={() => toggleBookmark(item)}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            />
          </View>
        )}
        // Mga style para sa loob ng scroll area (dito: dagdag na espasyo sa
        // ilalim ng huling card).
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// StyleSheet.create ay nagsusuri ng mga style at inaayos ang mga ito. Hindi
// ito CSS: mga JavaScript object ito. Camel case ang pangalan
// (`backgroundColor`), at walang unit ang numero (16 = 16 density-independent
// pixels). Para malaman ang epekto ng isang style: palitan ang value, i-save,
// at tingnan ang phone.
const styles = StyleSheet.create({
  // flex: 1 = "kunin ang lahat ng available na espasyo." Kung wala ito,
  // liliit ang View sa laki lang ng laman niya at hindi mapupuno ang screen.
  container: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  pickHeaderRow: {
    flexDirection: 'row', // magkatabi (pahalang) imbes na patong-patong (default: column)
    justifyContent: 'space-between', // itinutulak ang dalawang anak sa magkabilang dulo
    alignItems: 'center', // pantay ang gitna nila sa patayong direksyon
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  shuffleButton: { flexDirection: 'row', alignItems: 'center', gap: 4 }, // gap = espasyo sa pagitan ng icon at text
  shuffleText: { color: colors.sage, fontFamily: typography.label.fontFamily, fontSize: 13 },
  inlineError: { color: colors.paprika, marginBottom: spacing.md },
  cardWrap: { paddingHorizontal: spacing.lg },
  listContent: { paddingBottom: spacing.xxl }, // dagdag na espasyo sa ilalim ng huling card
});
