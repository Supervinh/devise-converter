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

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export default function CurrencyPicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

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
            placeholderTextColor="#555570"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a45',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e8e8f5',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16162a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#9898b8',
    fontSize: 14,
  },
  searchWrapper: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
  },
  searchInput: {
    padding: 14,
    color: '#e8e8f5',
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
    backgroundColor: '#16162a',
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
    color: '#e8e8f5',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 12,
    color: '#555570',
    marginTop: 2,
  },
  checkmark: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#1e1e30',
    marginLeft: 62,
  },
});
