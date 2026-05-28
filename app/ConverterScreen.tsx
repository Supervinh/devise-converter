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

function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

export default function ConverterScreen() {
  const [fromCode, setFromCode] = useState('EUR');
  const [toCode, setToCode] = useState('USD');
  const [amount, setAmount] = useState('1');
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  const { rate, loading, error, updatedAt, fetchRate, convert } = useExchangeRate();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const swapScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchRate(fromCode, toCode);
  }, [fromCode, toCode]);

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

  const handleSwap = () => {
    if (Platform.OS !== 'web') Vibration.vibrate(30);
    Animated.sequence([
      Animated.timing(swapScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(swapScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const numericAmount = parseFloat(amount) || 0;
  const from = getCurrency(fromCode);
  const to = getCurrency(toCode);

  const rateLabel =
    rate !== null
      ? `1 ${fromCode} = ${rate.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} ${toCode}`
      : '—';

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

        {/* Rate Badge */}
        <View style={styles.rateBadge}>
          <View>
            <Text style={styles.rateLabel}>TAUX EN DIRECT</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#6c63ff" style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.rateValue}>{rateLabel}</Text>
            )}
          </View>
          <View style={styles.rateRight}>
            {updatedAt && <Text style={styles.rateTime}>{updatedAt}</Text>}
            <TouchableOpacity onPress={() => fetchRate(fromCode, toCode)} style={styles.refreshBtn}>
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

        {/* Swap Button */}
        <Animated.View style={[styles.swapWrapper, { transform: [{ scale: swapScale }] }]}>
          <TouchableOpacity style={styles.swapBtn} onPress={handleSwap} activeOpacity={0.8}>
            <Text style={styles.swapIcon}>⇅</Text>
            <Text style={styles.swapText}>Inverser les devises</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* To Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>J'OBTIENS</Text>
          <View style={styles.currencyRow}>
            <TouchableOpacity
              style={styles.currencyBtn}
              onPress={() => setPickerTarget('to')}
              activeOpacity={0.7}
            >
              <View style={styles.flagCircle}>
                <Text style={styles.flagText}>{to.flag}</Text>
              </View>
              <Text style={styles.currencyCode}>{toCode}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <Animated.Text style={[styles.resultText, { opacity: resultOpacity }]}>
              {convert(numericAmount, toCode)}
            </Animated.Text>
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
      </ScrollView>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={pickerTarget !== null}
        selected={pickerTarget === 'from' ? fromCode : toCode}
        onSelect={(code) => {
          if (pickerTarget === 'from') setFromCode(code);
          else setToCode(code);
        }}
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

  // Rate Badge
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
    gap: 4,
  },
  rateTime: {
    fontSize: 10,
    color: '#3a3a58',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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

  // Cards
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
  resultText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 28,
    fontWeight: '500',
    color: '#6c63ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Swap
  swapWrapper: {
    marginHorizontal: 28,
    marginBottom: 14,
  },
  swapBtn: {
    backgroundColor: '#1e1e35',
    borderWidth: 0.5,
    borderColor: '#2a2a45',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  swapIcon: {
    fontSize: 18,
    color: '#6c63ff',
  },
  swapText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c63ff',
    letterSpacing: 0.3,
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
});
