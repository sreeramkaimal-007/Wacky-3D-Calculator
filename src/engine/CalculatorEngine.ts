export interface EvaluationOutcome {
  ok: boolean;
  value?: number;
  formatted?: string;
  error?: string;
  reaction?: string;
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; op: '+' | '−' | '×' | '÷' };

const PRECEDENCE: Record<'+' | '−' | '×' | '÷', number> = {
  '+': 1,
  '−': 1,
  '×': 2,
  '÷': 2,
};

/**
 * Normalizes JS IEEE-754 floating-point drift (e.g. 0.1 + 0.2 -> 0.3)
 */
export function cleanFloat(num: number): number {
  if (!Number.isFinite(num)) return num;
  if (Math.abs(num) < 1e-13) return 0;
  return Number(num.toPrecision(12));
}

/**
 * Formats numbers with thousands separators while preserving trailing decimal dots during entry.
 */
export function formatDisplayInput(raw: string): string {
  if (!raw) return '0';
  if (raw === '-') return '-0';
  if (raw.includes('e') || raw.includes('E')) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return raw;
    return parsed.toExponential(5).replace(/\.?0+e/, 'e');
  }

  const isNegative = raw.startsWith('-');
  const unsigned = isNegative ? raw.slice(1) : raw;
  const [intPart, decPart] = unsigned.split('.');

  const intFormatted = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const prefix = isNegative ? '-' : '';

  if (decPart !== undefined) {
    return `${prefix}${intFormatted}.${decPart}`;
  }
  return `${prefix}${intFormatted}`;
}

/**
 * Formats a final computed numeric result nicely for display and history.
 */
export function formatResultNumber(num: number): string {
  const cleaned = cleanFloat(num);
  if (!Number.isFinite(cleaned)) return 'Error';
  const abs = Math.abs(cleaned);

  if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) {
    return cleaned.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const str = cleaned.toString();
  return formatDisplayInput(str);
}

/**
 * Generates playful, non-intrusive reactions for special numeric results.
 */
export function getFunnyReaction(num: number): string | undefined {
  const cleaned = cleanFloat(num);
  if (!Number.isFinite(cleaned)) return undefined;

  if (cleaned === 100) return 'Perfect 100!';
  if (cleaned === 0) return 'Nothing to see here!';
  if (cleaned === 777) return 'Lucky number!';
  if (cleaned === 1234) return 'Nice sequence!';
  if (cleaned === 42) return 'The answer to everything!';
  if (cleaned === 404) return 'Math not found... just kidding!';
  if (cleaned === 3.14 || cleaned === 3.14159) return 'Mmm, fresh pie!';
  if (cleaned < 0) return 'Oops! Below zero!';
  if (Math.abs(cleaned) >= 1_000_000_000) return 'Whoa, astronomical!';
  if (Number.isInteger(cleaned) && cleaned > 10 && String(cleaned).split('').every((c, _, a) => c === a[0])) {
    return 'Repdigit streak!';
  }
  return undefined;
}

/**
 * Tokenizes a human-readable expression string (using +, −, ×, ÷) into numbers and operators.
 * Never uses eval() or Function().
 */
export function tokenizeExpression(expr: string): Token[] {
  const normalized = expr
    .replace(/,/g, '')
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−')
    .trim();

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];
    if (ch === ' ') {
      i++;
      continue;
    }

    // Unary negative sign at start or directly after an operator
    const prev = tokens[tokens.length - 1];
    const isUnaryMinus =
      ch === '−' && (tokens.length === 0 || (prev && prev.type === 'op'));

    if (isUnaryMinus || (ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = isUnaryMinus ? '-' : '';
      if (isUnaryMinus) i++;

      let hasDot = false;
      while (i < normalized.length) {
        const c = normalized[i];
        if ((c >= '0' && c <= '9') || (c === '.' && !hasDot)) {
          if (c === '.') hasDot = true;
          numStr += c;
          i++;
        } else if ((c === 'e' || c === 'E') && numStr.length > 0) {
          numStr += c;
          i++;
          if (normalized[i] === '+' || normalized[i] === '-' || normalized[i] === '−') {
            numStr += normalized[i] === '−' ? '-' : normalized[i];
            i++;
          }
        } else {
          break;
        }
      }

      const parsed = Number(numStr);
      if (Number.isNaN(parsed)) {
        throw new Error('Invalid number');
      }
      tokens.push({ type: 'number', value: parsed });
      continue;
    }

    if (ch === '+' || ch === '−' || ch === '×' || ch === '÷') {
      tokens.push({ type: 'op', op: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

/**
 * Evaluates a tokenized expression using Shunting-yard RPN conversion with proper operator precedence.
 */
export function evaluateExpression(expr: string): EvaluationOutcome {
  try {
    const tokens = tokenizeExpression(expr);
    if (tokens.length === 0) {
      return { ok: true, value: 0, formatted: '0' };
    }

    // Drop trailing operator if user hits '=' prematurely
    while (tokens.length > 0 && tokens[tokens.length - 1].type === 'op') {
      tokens.pop();
    }

    if (tokens.length === 0) {
      return { ok: true, value: 0, formatted: '0' };
    }

    const outputQueue: Token[] = [];
    const opStack: Array<'+' | '−' | '×' | '÷'> = [];

    for (const token of tokens) {
      if (token.type === 'number') {
        outputQueue.push(token);
      } else {
        while (
          opStack.length > 0 &&
          PRECEDENCE[opStack[opStack.length - 1]] >= PRECEDENCE[token.op]
        ) {
          outputQueue.push({ type: 'op', op: opStack.pop()! });
        }
        opStack.push(token.op);
      }
    }

    while (opStack.length > 0) {
      outputQueue.push({ type: 'op', op: opStack.pop()! });
    }

    const evalStack: number[] = [];
    for (const token of outputQueue) {
      if (token.type === 'number') {
        evalStack.push(token.value);
      } else {
        const b = evalStack.pop();
        const a = evalStack.pop();
        if (a === undefined || b === undefined) {
          return { ok: false, error: 'Malformed expression' };
        }
        switch (token.op) {
          case '+':
            evalStack.push(cleanFloat(a + b));
            break;
          case '−':
            evalStack.push(cleanFloat(a - b));
            break;
          case '×':
            evalStack.push(cleanFloat(a * b));
            break;
          case '÷':
            if (b === 0) {
              return { ok: false, error: 'Cannot divide by 0' };
            }
            evalStack.push(cleanFloat(a / b));
            break;
        }
      }
    }

    const finalVal = cleanFloat(evalStack[0] ?? 0);
    if (!Number.isFinite(finalVal)) {
      return { ok: false, error: 'Number too large' };
    }

    return {
      ok: true,
      value: finalVal,
      formatted: formatResultNumber(finalVal),
      reaction: getFunnyReaction(finalVal),
    };
  } catch {
    return { ok: false, error: 'Invalid input' };
  }
}

/**
 * Computes smart calculator percentage for the active operand given the pending expression.
 * For '+' or '−', converts e.g. 200 + 10% -> 20 (10% of 200).
 * For '×', '÷', or standalone, converts 10% -> 0.1.
 */
export function computeSmartPercentage(
  activeOperandStr: string,
  expressionPrefix: string
): string {
  const num = Number(activeOperandStr.replace(/,/g, ''));
  if (!Number.isFinite(num)) return activeOperandStr;

  const trimmed = expressionPrefix.trim();
  const lastOp = trimmed.slice(-1);

  if ((lastOp === '+' || lastOp === '−') && trimmed.length > 1) {
    const leftExpr = trimmed.slice(0, -1).trim();
    const leftEval = evaluateExpression(leftExpr);
    if (leftEval.ok && leftEval.value !== undefined) {
      const pctVal = cleanFloat((leftEval.value * num) / 100);
      return pctVal.toString();
    }
  }

  return cleanFloat(num / 100).toString();
}
