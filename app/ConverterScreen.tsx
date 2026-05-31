import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useExchangeRate } from '../hooks/useExchangeRate';
import CurrencyPicker from '../components/CurrencyPicker';
import { CURRENCIES } from '../constants/currencies';
import { useTheme, Theme } from '../constants/theme';

const MAX_CURRENCIES = 10;
const STORAGE_CODES = 'converter_codes';
const STORAGE_ACTIVE = 'converter_active';
const VALID_CODES = new Set(CURRENCIES.map(c => c.code));

function getCurrency(code: string) {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

export default function ConverterScreen() {
  const { theme, mode, toggle } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [codes, setCodes] = useState<string[]>(['EUR', 'USD', 'GBP']);
  const [activeCode, setActiveCode] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [pickerTarget, setPickerTarget] = useState<'add' | number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const { rates, loading, error, updatedAt, source, fetchRates, convert } = useExchangeRate();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(1)).current;

  const targets = codes.filter(c => c !== activeCode);

  // Load persisted selection on mount
  useEffect(() => {
    (async () => {
      try {
        const [rawCodes, rawActive] = await Promise.all([
          AsyncStorage.getItem(STORAGE_CODES),
          AsyncStorage.getItem(STORAGE_ACTIVE),
        ]);
        if (rawCodes) {
          const parsed = JSON.parse(rawCodes);
          if (Array.isArray(parsed)) {
            const valid = parsed.filter((c: unknown): c is string => typeof c === 'string' && VALID_CODES.has(c));
            if (valid.length >= 2) {
              setCodes(valid.slice(0, MAX_CURRENCIES));
              if (rawActive && valid.includes(rawActive)) {
                setActiveCode(rawActive);
              } else {
                setActiveCode(valid[0]);
              }
            }
          }
        }
      } catch {
        // ignore corrupt storage
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist selection on change
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_CODES, JSON.stringify(codes)).catch(() => {});
  }, [codes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_ACTIVE, activeCode).catch(() => {});
  }, [activeCode, hydrated]);

  useEffect(() => {
    if (targets.length > 0) {
      fetchRates(activeCode, targets);
    }
  }, [activeCode, codes, fetchRates]);

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

  const numericAmount = parseFloat(amount) || 0;

  const getDisplayValue = (code: string): string => {
    if (code === activeCode) return amount;
    return convert(numericAmount, code);
  };

  const handleAmountChange = (code: string, text: string) => {
    setActiveCode(code);
    setAmount(text);
  };

  const addCurrency = (code: string) => {
    if (codes.length >= MAX_CURRENCIES || codes.includes(code)) return;
    setCodes(prev => [...prev, code]);
  };

  const removeCurrency = (code: string) => {
    if (codes.length <= 2) return;
    setCodes(prev => prev.filter(c => c !== code));
    if (activeCode === code) {
      setActiveCode(codes.find(c => c !== code) ?? codes[0]);
    }
  };

  const replaceCurrency = (index: number, code: string) => {
    setCodes(prev => {
      const next = [...prev];
      const old = next[index];
      next[index] = code;
      if (activeCode === old) setActiveCode(code);
      return next;
    });
  };

  const handlePickerSelect = (code: string) => {
    if (pickerTarget === 'add') {
      addCurrency(code);
    } else if (typeof pickerTarget === 'number') {
      replaceCurrency(pickerTarget, code);
    }
    setPickerTarget(null);
  };

  const sourceLabel =
    source === 'cache' ? 'EN CACHE' :
    source === 'stale-cache' ? 'HORS LIGNE' :
    'EN DIRECT';

  const pickerExclude =
    pickerTarget === 'add' ? codes :
    typeof pickerTarget === 'number' ? codes.filter((_, i) => i !== pickerTarget) :
    [];

  const pickerSelected =
    typeof pickerTarget === 'number' ? codes[pickerTarget] : '';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>Converter</Text>
          </View>
          <TouchableOpacity
            onPress={toggle}
            style={styles.themeBtn}
            activeOpacity={0.7}
            accessibilityLabel="Basculer le thème"
          >
            <Text style={styles.themeBtnIcon}>{mode === 'dark' ? '☀' : '☾'}</Text>
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View style={styles.rateBadge}>
          <View>
            <Text style={styles.rateLabel}>{sourceLabel}</Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.rateValue}>
                {updatedAt ? `Mis à jour à ${updatedAt}` : '—'}
              </Text>
            )}
          </View>
          <View style={styles.rateRight}>
            <TouchableOpacity onPress={() => fetchRates(activeCode, targets, true)} style={styles.refreshBtn}>
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

        {/* Currency Rows */}
        <View style={styles.resultsList}>
          {codes.map((code, index) => {
            const currency = getCurrency(code);
            const isActive = code === activeCode;
            return (
              <Animated.View
                key={code}
                style={[
                  styles.resultRow,
                  isActive && styles.resultRowActive,
                  !isActive && { opacity: resultOpacity },
                ]}
              >
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

                <TextInput
                  style={[styles.amountInput, isActive && styles.amountInputActive]}
                  value={getDisplayValue(code)}
                  onChangeText={(text) => handleAmountChange(code, text)}
                  onFocus={() => {
                    if (code !== activeCode) {
                      const currentDisplay = getDisplayValue(code);
                      setActiveCode(code);
                      setAmount(currentDisplay.replace(/\s/g, '').replace(',', '.'));
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  selectTextOnFocus
                />

                {codes.length > 2 && (
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
        {codes.length < MAX_CURRENCIES && (
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

const createStyles = (t: Theme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: t.bg,
  },
  scroll: { flex: 1 },
  container: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: t.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: t.text,
    letterSpacing: -0.5,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.surface,
    borderWidth: 0.5,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnIcon: {
    fontSize: 16,
    color: t.primary,
  },

  // Status Badge
  rateBadge: {
    marginHorizontal: 28,
    marginBottom: 20,
    backgroundColor: t.surface,
    borderWidth: 0.5,
    borderColor: t.border,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLabel: {
    fontSize: 10,
    color: t.textDim,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 13,
    color: t.primary,
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
    backgroundColor: t.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 18,
    color: t.primary,
    lineHeight: 20,
  },

  // Error
  errorBadge: {
    marginHorizontal: 28,
    marginBottom: 14,
    backgroundColor: t.errorBg,
    borderWidth: 0.5,
    borderColor: t.errorBorder,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: t.errorText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // Currency rows
  resultsList: {
    marginHorizontal: 28,
    backgroundColor: t.surface,
    borderWidth: 0.5,
    borderColor: t.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: t.borderSubtle,
    gap: 8,
  },
  resultRowActive: {
    backgroundColor: t.surfaceActive,
  },
  resultCurrencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: t.accent,
    borderWidth: 0.5,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { fontSize: 20 },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: t.text,
    letterSpacing: 0.5,
  },
  currencyName: {
    fontSize: 11,
    color: t.textDim,
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    color: t.textDim,
    marginLeft: -2,
  },
  amountInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 22,
    fontWeight: '500',
    color: t.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  amountInputActive: {
    color: t.text,
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
    color: t.textDim,
  },

  // Add button
  addBtn: {
    marginHorizontal: 28,
    marginTop: 10,
    backgroundColor: t.surface,
    borderWidth: 0.5,
    borderColor: t.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnIcon: {
    fontSize: 18,
    color: t.primary,
    lineHeight: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: t.primary,
    letterSpacing: 0.3,
  },
});
