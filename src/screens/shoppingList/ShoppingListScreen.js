// ====================================================================
// SHOPPINGLISTSCREEN  —  ang listahan ng bibilhin
// ====================================================================
//
// 1) ANO ANG SCREEN NA ITO?
//    Ang "Shopping List" tab. Ipinapakita nito ang mga ingredient na
//    idinagdag mula sa iba't ibang recipe, pinagsama-sama sa isang
//    listahan. Puwedeng i-tsek (nabili na), alisin ang isa, alisin ang mga
//    naka-tsek, o alisin lahat.
//
// 2) MGA KONEKTADONG FILE
//    - navigation/MainTabNavigator.js
//        Nakarehistro bilang tab na "ShoppingList" (title: "Shopping List",
//        may sariling header). Top-level na tab ito, kaya walang back button.
//    - store/useAppStore.js   ANG PINAGMUMULAN NG LAHAT NG DATOS dito.
//        * `shoppingListItems`: ang listahan. Ang bawat item ay may hugis
//          { id, name, amount, unit, checked, fromRecipes: [mga pamagat] }.
//        * Mga action: toggleItemChecked, removeItem, clearCheckedItems,
//          clearAllItems.
//        * Naka-save sa phone (Zustand `persist` + AsyncStorage), kaya
//          nananatili ang listahan at ang mga tsek kahit isara ang app.
//    - utils/ingredientMerge.js
//        Ang function na gumagawa ng mga item (mergeIngredientsIntoList).
//        Ang `id` ng bawat item ay "key" na binubuo ng pangalan + unit sa
//        maliliit na titik (hal. "garlic__cloves"). Kapag may recipe na may
//        parehong key, hindi gagawa ng bagong row: DADAGDAGAN ang `amount`
//        at idadagdag ang pamagat ng recipe sa `fromRecipes`.
//    - screens/recipe/RecipeDetailScreen.js
//        Ang PINAGMUMULAN ng mga item: ang button na "Add to Shopping
//        List" ay tumatawag ng addIngredientsFromRecipe(recipe).
//    - App.js   naghihintay na ma-load ang naka-save na datos
//        (`_hasHydrated`) bago ipakita ang app.
//    - constants/colors.js, constants/theme.js   mga kulay at text styles.
//
// 3) DATA FLOW (hakbang-hakbang)
//    A. PAGDAGDAG NG ITEM (nangyayari sa ibang screen)
//       RecipeDetail: "Add to Shopping List" -> addIngredientsFromRecipe ->
//       mergeIngredientsIntoList -> bagong `shoppingListItems` sa store
//       (nai-save sa AsyncStorage) -> kusang nag-re-render ang screen na ito
//       dahil naka-subscribe siya sa `shoppingListItems`.
//    B. PAGPAPAKITA
//       `items` -> FlatList `data` -> renderItem -> isang row kada item.
//    C. PAG-TSEK
//       Pinindot ang row -> toggleChecked(item.id) -> sa store, ang item
//       na may kapareho ang id ay pinapalitan ng kopya na baliktad ang
//       `checked` -> nag-re-render -> nag-iba ang checkbox at nagkaroon ng
//       guhit sa gitna ng text.
//    D. PAG-ALIS
//       "X" -> removeItem(item.id); "Clear checked" -> clearCheckedItems()
//       (aalisin ang may tsek); "Clear all" -> clearAllItems().
//
// 4) SAAN ANG LOGIC AT SAAN ANG UI?
//    LOGIC = ang mga linya ng useAppStore at ang `checkedCount` sa itaas ng
//            function, ang mga handler (`onPress`) sa loob ng UI, at ang
//            helper na formatAmount. ("=== LOGIC ===")
//    UI    = ang `return ( ... )` at ang `styles`. ("=== UI ===")
//
//    Itsura ng UI:
//      View (container)
//      ├─ (kung may item) View (actionsRow): "Clear checked" + "Clear all"
//      └─ FlatList
//         ├─ ListEmptyComponent -> Text "Your list is empty..."
//         └─ renderItem -> View (row)
//              ├─ TouchableOpacity (rowMain): checkbox + text + "from: ..."
//              └─ TouchableOpacity: icon na "X"
// ====================================================================

import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing, radius } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

// Walang props na ginagamit ang screen na ito (hindi na kailangang
// `navigation`) dahil hindi ito lumilipat sa ibang screen.
export default function ShoppingListScreen() {
  // =================== === LOGIC === ===================

  // Walang useState/useEffect dito; lahat ng datos ay nasa STORE. Ang
  // `useAppStore((s) => s.xxx)` ay SELECTOR: `s` ang buong store at pinipili
  // natin ang isang piraso. Nagre-re-render ang screen kapag nagbago ang
  // PIRASONG PINILI.
  //   `items`  -> DATA (array). Kapag nagbago (nadagdagan, natsekan, naalis),
  //               mag-re-render ang screen.
  //   ang iba  -> mga ACTION (function). Hindi nagbabago ang reference nila,
  //               kaya hindi sila nagti-trigger ng re-render; tinatawag lang
  //               natin kapag pinindot ng user.
  const items = useAppStore((s) => s.shoppingListItems);
  const toggleChecked = useAppStore((s) => s.toggleItemChecked);
  const removeItem = useAppStore((s) => s.removeItem);
  const clearChecked = useAppStore((s) => s.clearCheckedItems);
  const clearAll = useAppStore((s) => s.clearAllItems);

  // KINUKUWENTANG HALAGA (derived value): bilang ng mga naka-tsek. Hindi ito
  // state; binibilang ulit sa bawat render mula sa `items`. Hindi natin ito
  // ginawang useState dahil makukuha naman ito mula sa `items`; ang
  // pagkakaroon ng dalawang bersyon ng parehong datos ay madaling magkaiba
  // (mawawalan ng sync). Ang `.filter` ay nagbabalik ng array ng mga item
  // na `checked`; ang `.length` ay ang bilang.
  const checkedCount = items.filter((i) => i.checked).length;

  // =================== === UI === ===================
  return (
    <View style={styles.container}>
      {/* CONDITIONAL RENDERING gamit ang `&&`: ipapakita lang ang hanay ng
          Clear buttons kung may laman ang listahan. */}
      {items.length > 0 && (
        <View style={styles.actionsRow}>
          {/* `disabled`: hindi mapipindot kung walang naka-tsek.
              `onPress={clearChecked}`: ipinapasa ang function mismo (walang
              panaklong) para tawagin ng button kapag pinindot. */}
          <TouchableOpacity onPress={clearChecked} disabled={checkedCount === 0}>
            {/* Style na array: ang ikalawa ay idinadagdag LANG kung totoo
                ang kondisyon (kulay-abo kapag walang naka-tsek). */}
            <Text style={[styles.actionText, checkedCount === 0 && styles.actionTextDisabled]}>
              Clear checked
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.actionText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        // Ang `item.id` ay natatanging STRING na gawa ng ingredientMerge
        // (hal. "garlic__cloves"), kaya hindi na kailangan ng String().
        keyExtractor={(item) => item.id} // (tingnan ang utils/ingredientMerge.js)
        // Array ng style: laging `styles.body`; at kapag WALANG LAMAN ang
        // listahan, idinaragdag ang `styles.emptyBody` (dagdag na espasyo sa
        // itaas para hindi dikit sa gilid ang mensahe, dahil nakatago ang
        // Clear buttons kapag walang item).
        contentContainerStyle={[styles.body, items.length === 0 && styles.emptyBody,]}
        // Lumalabas kapag WALANG LAMAN ang `data`.
        ListEmptyComponent={
          <Text style={typography.bodyMuted}>
            Your list is empty. Open a recipe and tap "Add to Shopping List" to add ingredients here.
          </Text>
        }
        // Tinatawag kada item. `{ item }` ay destructuring ng ibinibigay ng
        // FlatList.
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Ang checkbox at text ay ISANG pindutan; ang "X" sa kanan ay
                hiwalay at mas maliit na pindutan. Ang `() =>` ay "ipinagpapaliban"
                ang tawag: tatawagin lang ang toggleChecked kapag pinindot,
                hindi habang nagre-render. */}
            <TouchableOpacity
              style={styles.rowMain}
              onPress={() => toggleChecked(item.id)}
              activeOpacity={0.7}
            >
              {/* Ternary: iba ang icon at kulay kapag naka-tsek. */}
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.checked ? colors.sage : colors.inkLight}
              />
              <View style={styles.rowText}>
                {/* Kapag `checked`, idinaragdag ang style na may guhit sa
                    gitna ng text (`line-through`) at kulay-abo. */}
                <Text style={[typography.body, item.checked && styles.checkedText]}>
                  {formatAmount(item.amount)} {item.unit} {item.name}
                </Text>
                {/* `.join(', ')` ay pinagdudugtong ang array ng mga pamagat
                    ng recipe sa isang text: "Pasta, Soup". */}
                <Text style={typography.label}>from: {item.fromRecipes.join(', ')}</Text>
              </View>
            </TouchableOpacity>
            {/* `hitSlop` ay pinalalawak ang lugar na tumatanggap ng pindot
                lampas sa nakikitang icon (mas madaling pindutin ang maliit
                na "X"). */}
            <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// HELPER (logic): inaayos ang pagpapakita ng bilang. Ang buong numero (2)
// ay ipapakita nang ganoon; ang may decimal ay gagawing 2 decimal at aalisin
// ang sobrang zero (1.50 -> "1.5"). Ang regex na `/\.?0+$/` ay "alisin ang
// mga zero (at ang tuldok kung may kasama) sa dulo." Ang amount ay maaaring
// may decimal dahil nagsasama-sama ang bilang mula sa maraming recipe.
function formatAmount(amount) {
  return Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/\.?0+$/, '');
}

// Mga style (JavaScript object, hindi CSS). Paalala sa mga mahalagang style:
//   `flexDirection: 'row'`            magkatabi imbes na patong-patong
//   `justifyContent: 'space-between'` itinutulak sa magkabilang dulo
//   `flex: 1`                         kunin ang lahat ng natitirang espasyo
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  actionsRow: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end', // itinutulak ang dalawang button sa kanang gilid
    gap: spacing.md,
  },
  actionText: { color: colors.paprika, fontFamily: typography.label.fontFamily, fontSize: 12 },
  actionTextDisabled: { color: colors.inkFaint },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  // Dagdag na espasyo sa itaas kapag walang laman ang listahan.
  emptyBody: {
    paddingTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // checkbox/text sa kaliwa, "X" sa kanan
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  rowText: { flex: 1 },
  checkedText: { textDecorationLine: 'line-through', color: colors.inkFaint },
});
