import { useState, useCallback, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';
import { cn } from '@/utils';

interface CalculatorAppProps {
  windowId: string;
}

interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
}

function safeEvaluate(expression: string): number {
  const sanitized = expression.replace(/[^0-9+\-*/().%^]/g, '');
  if (!sanitized) throw new Error('Invalid expression');

  const tokens: string[] = [];
  let current = '';
  for (let i = 0; i < sanitized.length; i++) {
    const ch = sanitized[i];
    if ('0123456789.'.includes(ch)) {
      current += ch;
    } else if ('+-*/()^'.includes(ch)) {
      if (current) tokens.push(current);
      tokens.push(ch);
      current = '';
    }
  }
  if (current) tokens.push(current);

  function parseExpr(pos: { value: number }): number {
    let result = parseTerm(pos);
    while (pos.value < tokens.length && (tokens[pos.value] === '+' || tokens[pos.value] === '-')) {
      const op = tokens[pos.value++];
      const right = parseTerm(pos);
      result = op === '+' ? result + right : result - right;
    }
    return result;
  }

  function parseTerm(pos: { value: number }): number {
    let result = parseFactor(pos);
    while (pos.value < tokens.length && (tokens[pos.value] === '*' || tokens[pos.value] === '/')) {
      const op = tokens[pos.value++];
      const right = parseFactor(pos);
      result = op === '*' ? result * right : result / right;
    }
    return result;
  }

  function parseFactor(pos: { value: number }): number {
    if (pos.value >= tokens.length) throw new Error('Unexpected end');
    const token = tokens[pos.value++];

    if (token === '(') {
      const result = parseExpr(pos);
      if (pos.value < tokens.length && tokens[pos.value] === ')') pos.value++;
      return result;
    }

    if (token === '-') return -parseFactor(pos);
    if (token === '+') return parseFactor(pos);

    const num = parseFloat(token);
    if (isNaN(num)) throw new Error('Invalid number');

    if (pos.value < tokens.length && tokens[pos.value] === '^') {
      pos.value++;
      const exp = parseFactor(pos);
      return Math.pow(num, exp);
    }

    return num;
  }

  const pos = { value: 0 };
  const result = parseExpr(pos);
  return result;
}

export function CalculatorApp({ windowId: _windowId }: CalculatorAppProps) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleNumber = useCallback((num: string) => {
    if (justEvaluated) {
      setDisplay(num);
      setExpression(num);
      setJustEvaluated(false);
    } else {
      setDisplay((prev) => prev === '0' && num !== '.' ? num : prev + num);
      setExpression((prev) => prev + num);
    }
  }, [justEvaluated]);

  const handleOperator = useCallback((op: string) => {
    setJustEvaluated(false);
    setDisplay(op);
    setExpression((prev) => prev + op);
  }, []);

  const handleEquals = useCallback(() => {
    try {
      const result = safeEvaluate(expression);
      const resultStr = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
      setDisplay(resultStr);
      setHistory((prev) => [{ expression, result: resultStr, timestamp: Date.now() }, ...prev].slice(0, 50));
      setExpression(resultStr);
      setJustEvaluated(true);
    } catch {
      setDisplay('Error');
      setJustEvaluated(true);
    }
  }, [expression]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setJustEvaluated(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (justEvaluated) {
      setDisplay('0');
      setExpression('');
      setJustEvaluated(false);
    } else {
      setDisplay((prev) => prev.length > 1 ? prev.slice(0, -1) : '0');
      setExpression((prev) => prev.length > 1 ? prev.slice(0, -1) : '');
    }
  }, [justEvaluated]);

  const handlePercent = useCallback(() => {
    const num = parseFloat(display);
    if (!isNaN(num)) {
      const result = num / 100;
      setDisplay(result.toString());
      setExpression(result.toString());
    }
  }, [display]);

  const handleNegate = useCallback(() => {
    if (display !== '0' && display !== 'Error') {
      const negated = display.startsWith('-') ? display.slice(1) : '-' + display;
      setDisplay(negated);
      setExpression(negated);
    }
  }, [display]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleNumber('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('-');
      else if (e.key === '*') handleOperator('*');
      else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === '%') handlePercent();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperator, handleEquals, handleClear, handleDelete, handlePercent]);

  const buttons = [
    [
      { label: 'C', action: handleClear, variant: 'danger' },
      { label: '( )', action: () => { handleOperator('('); setTimeout(() => handleOperator(')'), 0); }, variant: 'secondary' },
      { label: '%', action: handlePercent, variant: 'secondary' },
      { label: '/', action: () => handleOperator('/'), variant: 'accent' },
    ],
    [
      { label: '7', action: () => handleNumber('7') },
      { label: '8', action: () => handleNumber('8') },
      { label: '9', action: () => handleNumber('9') },
      { label: '*', action: () => handleOperator('*'), variant: 'accent' },
    ],
    [
      { label: '4', action: () => handleNumber('4') },
      { label: '5', action: () => handleNumber('5') },
      { label: '6', action: () => handleNumber('6') },
      { label: '-', action: () => handleOperator('-'), variant: 'accent' },
    ],
    [
      { label: '1', action: () => handleNumber('1') },
      { label: '2', action: () => handleNumber('2') },
      { label: '3', action: () => handleNumber('3') },
      { label: '+', action: () => handleOperator('+'), variant: 'accent' },
    ],
    [
      { label: '+/-', action: handleNegate },
      { label: '0', action: () => handleNumber('0') },
      { label: '.', action: () => handleNumber('.') },
      { label: '=', action: handleEquals, variant: 'primary' },
    ],
  ];

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-sm font-medium text-text">Calculator</span>
        <div className="flex items-center gap-1">
          <button
            className={cn('p-1.5 rounded-lg transition-colors', showHistory ? 'bg-primary/15 text-primary' : 'text-text-muted hover:bg-surface-hover')}
            onClick={() => setShowHistory(!showHistory)}
            aria-label="History"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-end px-4 py-3">
            <div className="text-right text-sm text-text-muted h-6 truncate font-mono">{expression || '\u00A0'}</div>
            <div className="text-right text-3xl font-light text-text truncate font-mono">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-1 p-2">
            {buttons.map((row, rowIdx) =>
              row.map((btn, btnIdx) => (
                <button
                  key={`${rowIdx}-${btnIdx}`}
                  className={cn(
                    'h-14 rounded-xl text-lg font-medium transition-all duration-100 active:scale-95',
                    btn.variant === 'primary' && 'bg-primary text-text-inverse hover:bg-primary-light',
                    btn.variant === 'accent' && 'bg-accent/20 text-accent-dark hover:bg-accent/30',
                    btn.variant === 'secondary' && 'bg-surface-active text-text hover:bg-border',
                    btn.variant === 'danger' && 'bg-danger/15 text-danger hover:bg-danger/25',
                    !btn.variant && 'bg-surface-active text-text hover:bg-border',
                  )}
                  onClick={btn.action}
                  aria-label={btn.label}
                >
                  {btn.label}
                </button>
              ))
            )}
          </div>
        </div>

        {showHistory && (
          <div className="w-48 border-l border-border bg-surface-hover flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-medium text-text-muted uppercase">History</span>
              <button className="text-text-muted hover:text-text" onClick={() => setHistory([])}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {history.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">No history</p>
              ) : (
                history.map((entry) => (
                  <button
                    key={entry.timestamp}
                    className="w-full text-right p-2 rounded-lg hover:bg-surface-hover transition-colors"
                    onClick={() => { setDisplay(entry.result); setExpression(entry.result); setJustEvaluated(true); }}
                  >
                    <div className="text-xs text-text-muted font-mono truncate">{entry.expression}</div>
                    <div className="text-sm font-medium text-text font-mono">= {entry.result}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}