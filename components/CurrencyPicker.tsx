import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CURRENCIES, Currency } from '../constants/currencies';
import { useTheme, Theme } from '../constants/theme';

type Props = {
  visible: boolean;
  selected: string;
  exclude?: string[];
  onSelect: (code: string) => void;
  onClose: () => void;
};

export default function CurrencyPicker({ visible, selected, exclude = [], onSelect, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const base = exclude.length > 0 ? CURRENCIES.filter(c => !exclude.includes(c.code)) : CURRENCIES;
    if (!q) return base;
    return base.filter(
      c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [search, exclude]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.statusBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choisir une devise</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher (EUR, Dollar...)"
            placeholderTextColor={theme.textDim}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="characters"
          />
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.code}
          renderItem={({ item }: { item: Currency }) => (
            <TouchableOpacity
              style={[styles.item, item.code === selected && styles.itemSelected]}
              onPress={() => handleSelect(item.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemFlag}>{item.flag}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemCode}>{item.code}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              {item.code === selected && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: t.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: t.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: t.textMuted,
    fontSize: 14,
  },
  searchWrapper: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: t.surface,
    borderWidth: 0.5,
    borderColor: t.border,
  },
  searchInput: {
    padding: 14,
    color: t.text,
    fontSize: 15,
    fontFamily: 'System',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  itemSelected: {
    backgroundColor: t.surfaceActive,
  },
  itemFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: 15,
    fontWeight: '600',
    color: t.text,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 12,
    color: t.textDim,
    marginTop: 2,
  },
  checkmark: {
    color: t.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: t.borderSubtle,
    marginLeft: 62,
  },
});
