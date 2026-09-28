import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing, radius } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

export default function ShoppingListScreen() {
  const items = useAppStore((s) => s.shoppingListItems);
  const toggleChecked = useAppStore((s) => s.toggleItemChecked);
  const removeItem = useAppStore((s) => s.removeItem);
  const clearChecked = useAppStore((s) => s.clearCheckedItems);
  const clearAll = useAppStore((s) => s.clearAllItems);

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <View style={styles.container}>
      {items.length > 0 && (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={clearChecked} disabled={checkedCount === 0}>
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.body}
        ListEmptyComponent={
          <Text style={typography.bodyMuted}>
            Your list is empty. Open a recipe and tap "Add to Shopping List" to add ingredients here.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rowMain}
              onPress={() => toggleChecked(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.checked ? colors.sage : colors.inkLight}
              />
              <View style={styles.rowText}>
                <Text style={[typography.body, item.checked && styles.checkedText]}>
                  {formatAmount(item.amount)} {item.unit} {item.name}
                </Text>
                <Text style={typography.label}>from: {item.fromRecipes.join(', ')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

function formatAmount(amount) {
  return Number.isInteger(amount) ? amount : amount.toFixed(2).replace(/\.?0+$/, '');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  actionsRow: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  actionText: { color: colors.paprika, fontFamily: typography.label.fontFamily, fontSize: 12 },
  actionTextDisabled: { color: colors.inkFaint },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
