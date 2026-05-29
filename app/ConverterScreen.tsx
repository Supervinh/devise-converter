import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  ActivityIndicator,
  Vibration,
  Platform,
} from 'react-native';
import { useExchangeRate } from '../hooks/useExchangeRate';
import CurrencyPicker from '../components/CurrencyPicker';
import { CURRENCIES } from '../constants/currencies';

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];
const MAX_CURRENCIES = 10;

function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

export default function ConverterScreen() {
  const [fromCode, setFromCode] = useState('EUR');
  const [toCodes, setToCodes] = useState<string[]>(['USD', 'GBP', 'JPY']);
  const [amount, setAmount] = useState('1');
  const [pickerTarget, setPickerTarget] = useState<'from' | 'add' | number | null>(null);

  const { rates, loading, error, updatedAt, source, fetchRates, convert } = useExchangeRate();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchRates(fromCode, toCodes);
  }, [fromCode, toCodes, fetchRates]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ).start();
      Animated.timing(resultOpacity, { toValue: 0.4, duration: 200, useNativeDriver: true }).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [loading]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const addCurrency = (code: string) => {
    if (toCodes.length >= MAX_CURRENCIES || toCodes.includes(code) || code === fromCode) return;
    setToCodes(prev => [...prev, code]);
  };

  const removeCurrency = (code: string) => {
    setToCodes(prev => prev.filter(c => c !== code));
  };

  const replaceCurrency = (index: number, code: string) => {
    setToCodes(prev => {
      const next = [...prev];
      next[index] = code;
      return next;
    });
  };

  const handlePickerSelect = (code: string) => {
    if (pickerTarget === 'from') {
      setFromCode(code);
      setToCodes(prev => prev.filter(c => c !== code));
    } else if (pickerTarget === 'add') {
      addCurrency(code);
    } else if (typeof pickerTarget === 'number') {
      replaceCurrency(pickerTarget, code);
    }
    setPickerTarget(null);
  };

  const numericAmount = parseFloat(amount) || 0;
  const from = getCurrency(fromCode);

  const sourceLabel =
    source === 'cache' ? 'EN CACHE' :
    source === 'stale-cache' ? 'HORS LIGNE' :
    'EN DIRECT';

  const pickerExclude =
    pickerTarget === 'from' ? [] :
    pickerTarget === 'add' ? [fromCode, ...toCodes] :
    typeof pickerTarget === 'number' ? [fromCode, ...toCodes.filter((_, i) => i !== pickerTarget)] :
    [];

  const pickerSelected =
    pickerTarget === 'from' ? fromCode :
    typeof pickerTarget === 'number' ? toCodes[pickerTarget] :
    '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerDot} />
          <Text style={styles.headerTitle}>Converter</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.rateBadge}>
          <View>
            <Text style={styles.rateLabel}>{sourceLabel}</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#6c63ff" style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.rateValue}>
                {updatedAt ? `Mis à jour à ${updatedAt}` : '—'}
              </Text>
            )}
          </View>
          <View style={styles.rateRight}>
            <TouchableOpacity onPress={() => fetchRates(fromCode, toCodes, true)} style={styles.refreshBtn}>
              <Animated.Text style={[styles.refreshIcon, { transform: [{ rotate: spin }] }]}>↻</Animated.Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBadge}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* From Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>JE CONVERTIS</Text>
          <View style={styles.currencyRow}>
            <TouchableOpacity
              style={styles.currencyBtn}
              onPress={() => setPickerTarget('from')}
              activeOpacity={0.7}
            >
              <View style={styles.flagCircle}>
                <Text style={styles.flagText}>{from.flag}</Text>
              </View>
              <Text style={styles.currencyCode}>{fromCode}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#2a2a45"
              selectTextOnFocus
            />
          </View>
        </View>

        {/* Quick Amounts */}
        <Text style={styles.quickLabel}>MONTANTS RAPIDES</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {QUICK_AMOUNTS.map(a => (
            <TouchableOpacity
              key={a}
              style={styles.quickBtn}
              onPress={() => setAmount(String(a))}
              activeOpacity={0.7}
            >
              <Text style={styles.quickText}>{a} {fromCode}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <Text style={[styles.quickLabel, { marginTop: 16 }]}>J'OBTIENS</Text>
        <View style={styles.resultsList}>
          {toCodes.map((code, index) => {
            const currency = getCurrency(code);
            return (
              <Animated.View key={code} style={[styles.resultRow, { opacity: resultOpacity }]}>
                <TouchableOpacity
                  style={styles.resultCurrencyBtn}
                  onPress={() => setPickerTarget(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.flagCircle}>
                    <Text style={styles.flagText}>{currency.flag}</Text>
                  </View>
                  <View>
                    <Text style={styles.currencyCode}>{code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <Text style={styles.resultAmount} numberOfLines={1} adjustsFontSizeToFit>
                  {convert(numericAmount, code)}
                </Text>
                {toCodes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      if (Platform.OS !== 'web') Vibration.vibrate(20);
                      removeCurrency(code);
                    }}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Add Currency Button */}
        {toCodes.length < MAX_CURRENCIES && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setPickerTarget('add')}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Ajouter une devise</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={pickerTarget !== null}
        selected={pickerSelected}
        exclude={pickerExclude}
        onSelect={handlePickerSelect}
        onClose={() => setPickerTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: { flex: 1 },
  container: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c63ff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e8e8f5',
    letterSpacing: -0.5,
  },

  // Status Badge
  rateBadge: {
    marginHorizontal: 28,
    marginBottom: 20,
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLabel: {
    fontSize: 10,
    color: '#555570',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 13,
    color: '#6c63ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  rateRight: {
    alignItems: 'flex-end',
  },
  refreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e1e35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#6c63ff',
    lineHeight: 20,
  },

  // Error
  errorBadge: {
    marginHorizontal: 28,
    marginBottom: 14,
    backgroundColor: '#1f0f0f',
    borderWidth: 0.5,
    borderColor: '#3a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#cc5555',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // From Card
  card: {
    marginHorizontal: 28,
    marginBottom: 14,
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 20,
    padding: 18,
  },
  cardLabel: {
    fontSize: 10,
    color: '#555570',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 14,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222238',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { fontSize: 20 },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e8e8f5',
    letterSpacing: 0.5,
  },
  currencyName: {
    fontSize: 11,
    color: '#555570',
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    color: '#555570',
    marginLeft: -2,
  },
  amountInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 28,
    fontWeight: '500',
    color: '#e8e8f5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Quick amounts
  quickLabel: {
    paddingHorizontal: 28,
    paddingBottom: 10,
    paddingTop: 4,
    fontSize: 10,
    color: '#555570',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  quickRow: {
    paddingHorizontal: 28,
    gap: 8,
  },
  quickBtn: {
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quickText: {
    fontSize: 13,
    color: '#9898b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Results list
  resultsList: {
    marginHorizontal: 28,
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e1e35',
    gap: 8,
  },
  resultCurrencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultAmount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 22,
    fontWeight: '500',
    color: '#6c63ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeBtnText: {
    fontSize: 12,
    color: '#3a3a58',
  },

  // Add button
  addBtn: {
    marginHorizontal: 28,
    marginTop: 10,
    backgroundColor: '#16162a',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnIcon: {
    fontSize: 18,
    color: '#6c63ff',
    lineHeight: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c63ff',
    letterSpacing: 0.3,
  },
});
