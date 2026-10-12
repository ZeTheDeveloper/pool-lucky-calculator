import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const rows = [
  ['AC', '+/-', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['DEL', '0', '.', '='],
];

const operators = {
  '÷': (left, right) => right === 0 ? null : left / right,
  '×': (left, right) => left * right,
  '−': (left, right) => left - right,
  '+': (left, right) => left + right,
};

const formatNumber = (value) => `${Number(value.toPrecision(10))}`;

export default function App() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [storedValue, setStoredValue] = useState(null);
  const [pendingOperator, setPendingOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const clear = () => {
    setDisplay('0');
    setHistory('');
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(false);
  };

  const enterDigit = (digit) => {
    if (display === '-0') {
      setDisplay(`-${digit}`);
      return;
    }

    if (display === 'Error' || waitingForOperand || justEvaluated) {
      setDisplay(digit);
      setHistory('');
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }

    setDisplay(display === '0' ? digit : `${display}${digit}`);
  };

  const enterDecimal = () => {
    if (display === 'Error' || justEvaluated || waitingForOperand) {
      setDisplay('0.');
      setHistory('');
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }

    if (!display.includes('.')) setDisplay(`${display}.`);
  };

  const chooseOperator = (operator) => {
    if (display === 'Error') return;
    const value = Number(display);

    if (pendingOperator && storedValue !== null && !waitingForOperand) {
      const result = operators[pendingOperator](storedValue, value);
      if (result === null || !Number.isFinite(result)) {
        setDisplay('Error');
        setHistory('Cannot divide by zero');
        setStoredValue(null);
        setPendingOperator(null);
        setWaitingForOperand(true);
        return;
      }
      const formatted = formatNumber(result);
      setDisplay(formatted);
      setStoredValue(result);
      setHistory(`${formatted} ${operator}`);
    } else if (storedValue === null || !pendingOperator) {
      setStoredValue(value);
      setHistory(`${formatNumber(value)} ${operator}`);
    } else {
      setHistory(`${formatNumber(storedValue)} ${operator}`);
    }

    setPendingOperator(operator);
    setWaitingForOperand(true);
    setJustEvaluated(false);
  };

  const evaluate = () => {
    if (storedValue === null || !pendingOperator || waitingForOperand || display === 'Error') return;

    const result = operators[pendingOperator](storedValue, Number(display));
    if (result === null || !Number.isFinite(result)) {
      setDisplay('Error');
      setHistory('Cannot divide by zero');
      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);
      return;
    }

    setHistory(`${formatNumber(storedValue)} ${pendingOperator} ${display} =`);
    setDisplay(formatNumber(result));
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  };

  const pressKey = (key) => {
    if (/^\d$/.test(key)) return enterDigit(key);
    if (key === '.') return enterDecimal();
    if (key === 'AC') return clear();
    if (key === 'DEL') {
      if (display === 'Error' || justEvaluated || waitingForOperand) return;
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
      return;
    }
    if (key === '+/-') {
      if (display === 'Error') return;
      if (waitingForOperand) {
        setDisplay('-0');
        setHistory('');
        setWaitingForOperand(false);
        setJustEvaluated(false);
        return;
      }
      setDisplay(formatNumber(Number(display) * -1));
      return;
    }
    if (key === '%') {
      if (display !== 'Error') setDisplay(formatNumber(Number(display) / 100));
      return;
    }
    if (key === '=') return evaluate();
    chooseOperator(key);
  };

  const getKeyStyle = (key) => {
    if (key === '=') return [styles.key, styles.equalsKey];
    if (['÷', '×', '−', '+'].includes(key)) return [styles.key, styles.operatorKey];
    if (['AC', '+/-', '%', 'DEL'].includes(key)) return [styles.key, styles.utilityKey];
    return [styles.key, styles.numberKey];
  };

  const getTextStyle = (key) => {
    if (key === '=') return [styles.keyText, styles.equalsText];
    if (['÷', '×', '−', '+'].includes(key)) return [styles.keyText, styles.operatorText];
    if (['AC', '+/-', '%', 'DEL'].includes(key)) return [styles.keyText, styles.utilityText];
    return [styles.keyText, styles.numberText];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0E8" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>POCKET</Text>
          </View>
          <Text style={styles.headerLabel}>CALCULATOR</Text>
        </View>

        <View style={styles.displayPanel}>
          <Text style={styles.history} numberOfLines={1}>
            {history || ' '}
          </Text>
          <Text
            style={styles.display}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.45}
            accessibilityLabel={`Result ${display}`}
          >
            {display}
          </Text>
          <View style={styles.displayRule} />
          <Text style={styles.displayCaption}>READY WHEN YOU ARE</Text>
        </View>

        <View style={styles.keypad}>
          {rows.map((row) => (
            <View key={row.join('')} style={styles.keyRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key === 'DEL' ? 'Delete last digit' : key}
                  onPress={() => pressKey(key)}
                  style={({ pressed }) => [
                    ...getKeyStyle(key),
                    pressed && styles.keyPressed,
                  ]}
                >
                  <Text style={getTextStyle(key)}>{key}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F0E8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B5D95D',
  },
  brand: {
    color: '#222821',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  headerLabel: {
    color: '#898C81',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  displayPanel: {
    flex: 1,
    minHeight: 145,
    maxHeight: 300,
    marginTop: 12,
    marginBottom: 18,
    paddingHorizontal: 22,
    paddingVertical: 20,
    borderRadius: 8,
    backgroundColor: '#202721',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  history: {
    minHeight: 23,
    color: '#A7B1A2',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'right',
  },
  display: {
    color: '#F8F8F1',
    fontSize: 64,
    fontWeight: '300',
    textAlign: 'right',
    includeFontPadding: false,
    marginTop: 6,
  },
  displayRule: {
    height: 1,
    backgroundColor: '#414A3E',
    marginTop: 18,
    marginBottom: 11,
  },
  displayCaption: {
    color: '#B5D95D',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  keypad: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: 420,
    gap: 10,
  },
  keyRow: {
    flex: 1,
    minHeight: 48,
    maxHeight: 76,
    flexDirection: 'row',
    gap: 10,
  },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
  },
  numberKey: {
    backgroundColor: '#FFFFFF',
  },
  utilityKey: {
    backgroundColor: '#E4E5DC',
  },
  operatorKey: {
    backgroundColor: '#E9B36E',
  },
  equalsKey: {
    backgroundColor: '#B5D95D',
  },
  keyPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },
  keyText: {
    fontWeight: '600',
    includeFontPadding: false,
  },
  numberText: {
    color: '#242922',
    fontSize: 27,
  },
  utilityText: {
    color: '#4F564C',
    fontSize: 16,
    fontWeight: '700',
  },
  operatorText: {
    color: '#33271D',
    fontSize: 29,
    fontWeight: '500',
  },
  equalsText: {
    color: '#202721',
    fontSize: 30,
    fontWeight: '700',
  },
});