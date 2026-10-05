import { CellData, CellPosition, CellRange, CellValue, SheetData } from '../types/spreadsheet';
import { a1ToPosition, a1ToRange, getCellKey, normalizeRange, parseCellKey, positionToA1 } from './cellUtils';

// Helper to evaluate a cell or range value
export type CellLookup = (row: number, col: number) => CellValue;

// Extract cell references used inside a formula
export function extractFormulaDependencies(formula: string): string[] {
  if (!formula.startsWith('=')) return [];
  const clean = formula.substring(1);
  const deps: Set<string> = new Set();

  // Match ranges like A1:B10
  const rangeRegex = /([A-Za-z]+[0-9]+):([A-Za-z]+[0-9]+)/g;
  let match;
  while ((match = rangeRegex.exec(clean)) !== null) {
    const range = a1ToRange(`${match[1]}:${match[2]}`);
    if (range) {
      const norm = normalizeRange(range);
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        for (let c = norm.startCol; c <= norm.endCol; c++) {
          deps.add(getCellKey(r, c));
        }
      }
    }
  }

  // Match single cells like A1 (not part of range)
  const singleCellRegex = /\b([A-Za-z]+[0-9]+)\b/g;
  while ((match = singleCellRegex.exec(clean)) !== null) {
    // Exclude function names or parts of ranges already handled
    const pos = a1ToPosition(match[1]);
    if (pos) {
      deps.add(getCellKey(pos.row, pos.col));
    }
  }

  return Array.from(deps);
}

// Tokenize formula into tokens
interface Token {
  type: 'NUMBER' | 'STRING' | 'BOOLEAN' | 'CELL' | 'RANGE' | 'FUNCTION' | 'OPERATOR' | 'COMMA' | 'LPAREN' | 'RPAREN';
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expr.length;

  while (i < n) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // String literal "..."
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < n && expr[i] !== quote) {
        if (expr[i] === '\\' && i + 1 < n) {
          i++;
          str += expr[i];
        } else {
          str += expr[i];
        }
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Numbers (e.g. 123, 123.45, .45)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < n && /[0-9]/.test(expr[i + 1]))) {
      let numStr = '';
      while (i < n && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifiers: Functions (SUM, IF, etc.), Booleans (TRUE, FALSE), or Cell/Range (A1, A1:B5)
    if (/[A-Za-z_]/.test(ch)) {
      let ident = '';
      while (i < n && /[A-Za-z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }

      // Check if followed by colon ':' for range e.g. A1:B10
      if (i < n && expr[i] === ':') {
        i++; // skip ':'
        let secondIdent = '';
        while (i < n && /[A-Za-z0-9_]/.test(expr[i])) {
          secondIdent += expr[i];
          i++;
        }
        tokens.push({ type: 'RANGE', value: `${ident.toUpperCase()}:${secondIdent.toUpperCase()}` });
        continue;
      }

      // Check if followed by '(' -> Function call
      if (i < n && expr[i] === '(') {
        tokens.push({ type: 'FUNCTION', value: ident.toUpperCase() });
        continue;
      }

      const upper = ident.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'BOOLEAN', value: upper });
      } else if (a1ToPosition(upper) !== null) {
        tokens.push({ type: 'CELL', value: upper });
      } else {
        // Unknown identifier or variable
        tokens.push({ type: 'FUNCTION', value: upper });
      }
      continue;
    }

    // Two-character operators: <=, >=, <>, !=, ==
    if (i + 1 < n) {
      const two = expr.substring(i, i + 2);
      if (['<=', '>=', '<>', '!=', '=='].includes(two)) {
        tokens.push({ type: 'OPERATOR', value: two });
        i += 2;
        continue;
      }
    }

    // Single character operators & delimiters
    if (['+', '-', '*', '/', '^', '%', '&', '=', '<', '>'].includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Unknown char, skip
    i++;
  }

  return tokens;
}

// AST Node definitions
type ASTNode =
  | { type: 'Literal'; value: CellValue }
  | { type: 'Cell'; a1: string }
  | { type: 'Range'; a1Range: string }
  | { type: 'UnaryOp'; op: string; argument: ASTNode }
  | { type: 'BinaryOp'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] };

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  public parse(): ASTNode {
    const node = this.parseExpression();
    return node;
  }

  private parseExpression(): ASTNode {
    return this.parseComparison();
  }

  private parseComparison(): ASTNode {
    let left = this.parseConcatenation();

    while (this.peek() && this.peek()!.type === 'OPERATOR' && ['=', '==', '!=', '<>', '<', '>', '<=', '>='].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseConcatenation();
      left = { type: 'BinaryOp', op: op === '==' ? '=' : op, left, right };
    }

    return left;
  }

  private parseConcatenation(): ASTNode {
    let left = this.parseAdditive();

    while (this.peek() && this.peek()!.type === 'OPERATOR' && this.peek()!.value === '&') {
      const op = this.consume().value;
      const right = this.parseAdditive();
      left = { type: 'BinaryOp', op, left, right };
    }

    return left;
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.peek() && this.peek()!.type === 'OPERATOR' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: 'BinaryOp', op, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parseExponentiation();

    while (this.peek() && this.peek()!.type === 'OPERATOR' && ['*', '/', '%'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseExponentiation();
      left = { type: 'BinaryOp', op, left, right };
    }

    return left;
  }

  private parseExponentiation(): ASTNode {
    let left = this.parseUnary();

    while (this.peek() && this.peek()!.type === 'OPERATOR' && this.peek()!.value === '^') {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'BinaryOp', op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek() && this.peek()!.type === 'OPERATOR' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const arg = this.parseUnary();
      return { type: 'UnaryOp', op, argument: arg };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();
    if (!token) {
      return { type: 'Literal', value: 0 };
    }

    if (token.type === 'NUMBER') {
      this.consume();
      return { type: 'Literal', value: parseFloat(token.value) };
    }

    if (token.type === 'STRING') {
      this.consume();
      return { type: 'Literal', value: token.value };
    }

    if (token.type === 'BOOLEAN') {
      this.consume();
      return { type: 'Literal', value: token.value === 'TRUE' };
    }

    if (token.type === 'CELL') {
      this.consume();
      return { type: 'Cell', a1: token.value };
    }

    if (token.type === 'RANGE') {
      this.consume();
      return { type: 'Range', a1Range: token.value };
    }

    if (token.type === 'FUNCTION') {
      const fnName = this.consume().value;
      if (this.peek() && this.peek()!.type === 'LPAREN') {
        this.consume(); // eat '('
        const args: ASTNode[] = [];
        if (this.peek() && this.peek()!.type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek() && this.peek()!.type === 'COMMA') {
            this.consume(); // eat ','
            args.push(this.parseExpression());
          }
        }
        if (this.peek() && this.peek()!.type === 'RPAREN') {
          this.consume(); // eat ')'
        }
        return { type: 'FunctionCall', name: fnName, args };
      }
      // If function name without parens, treat as cell or literal
      return { type: 'Literal', value: fnName };
    }

    if (token.type === 'LPAREN') {
      this.consume(); // eat '('
      const expr = this.parseExpression();
      if (this.peek() && this.peek()!.type === 'RPAREN') {
        this.consume(); // eat ')'
      }
      return expr;
    }

    this.consume();
    return { type: 'Literal', value: token.value };
  }
}

// Flat array of values extracted from an AST argument (supports single values or ranges)
function evaluateArgToValues(node: ASTNode, getCell: CellLookup): CellValue[] {
  if (node.type === 'Range') {
    const range = a1ToRange(node.a1Range);
    if (!range) return [];
    const norm = normalizeRange(range);
    const results: CellValue[] = [];
    for (let r = norm.startRow; r <= norm.endRow; r++) {
      for (let c = norm.startCol; c <= norm.endCol; c++) {
        results.push(getCell(r, c));
      }
    }
    return results;
  }

  const single = evaluateAST(node, getCell);
  return [single];
}

// Evaluate AST node
function evaluateAST(node: ASTNode, getCell: CellLookup): CellValue {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Cell': {
      const pos = a1ToPosition(node.a1);
      if (!pos) return '#REF!';
      return getCell(pos.row, pos.col);
    }

    case 'Range': {
      // If a range is evaluated as a single value, return top-left cell
      const range = a1ToRange(node.a1Range);
      if (!range) return '#REF!';
      const norm = normalizeRange(range);
      return getCell(norm.startRow, norm.startCol);
    }

    case 'UnaryOp': {
      const val = evaluateAST(node.argument, getCell);
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(num)) return '#VALUE!';
      return node.op === '-' ? -num : num;
    }

    case 'BinaryOp': {
      const left = evaluateAST(node.left, getCell);
      const right = evaluateAST(node.right, getCell);

      if (node.op === '&') {
        return `${left ?? ''}${right ?? ''}`;
      }

      // Comparison operators
      if (['=', '<>', '!=', '<', '>', '<=', '>='].includes(node.op)) {
        if (node.op === '=') return left == right;
        if (node.op === '<>' || node.op === '!=') return left != right;

        const numL = Number(left);
        const numR = Number(right);
        if (!isNaN(numL) && !isNaN(numR)) {
          if (node.op === '<') return numL < numR;
          if (node.op === '>') return numL > numR;
          if (node.op === '<=') return numL <= numR;
          if (node.op === '>=') return numL >= numR;
        }
        if (node.op === '<') return String(left) < String(right);
        if (node.op === '>') return String(left) > String(right);
        if (node.op === '<=') return String(left) <= String(right);
        if (node.op === '>=') return String(left) >= String(right);
        return false;
      }

      const numL = typeof left === 'number' ? left : parseFloat(String(left));
      const numR = typeof right === 'number' ? right : parseFloat(String(right));

      if (isNaN(numL) || isNaN(numR)) {
        return '#VALUE!';
      }

      switch (node.op) {
        case '+': return numL + numR;
        case '-': return numL - numR;
        case '*': return numL * numR;
        case '/':
          if (numR === 0) return '#DIV/0!';
          return numL / numR;
        case '^': return Math.pow(numL, numR);
        case '%': return numL % numR;
        default: return '#ERROR!';
      }
    }

    case 'FunctionCall': {
      return executeFunction(node.name, node.args, getCell);
    }
  }
}

// Built-in function registry
function executeFunction(name: string, args: ASTNode[], getCell: CellLookup): CellValue {
  const upper = name.toUpperCase();

  // SUM
  if (upper === 'SUM') {
    let sum = 0;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) sum += n;
      }
    }
    return sum;
  }

  // AVERAGE / AVG
  if (upper === 'AVERAGE' || upper === 'AVG') {
    let sum = 0;
    let count = 0;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) {
          sum += n;
          count++;
        }
      }
    }
    return count === 0 ? '#DIV/0!' : sum / count;
  }

  // COUNT (counts numbers)
  if (upper === 'COUNT') {
    let count = 0;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        if (typeof v === 'number' || (!isNaN(parseFloat(String(v))) && String(v).trim() !== '')) {
          count++;
        }
      }
    }
    return count;
  }

  // COUNTA (counts non-empty)
  if (upper === 'COUNTA') {
    let count = 0;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        if (v !== null && v !== undefined && v !== '') {
          count++;
        }
      }
    }
    return count;
  }

  // COUNTBLANK
  if (upper === 'COUNTBLANK') {
    let count = 0;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        if (v === null || v === undefined || v === '') {
          count++;
        }
      }
    }
    return count;
  }

  // COUNTIF(range, criteria)
  if (upper === 'COUNTIF') {
    if (args.length < 2) return '#ERROR!';
    const vals = evaluateArgToValues(args[0], getCell);
    const criteria = evaluateAST(args[1], getCell);
    let count = 0;

    const critStr = String(criteria).trim();
    const isOp = critStr.match(/^(>=|<=|<>|>|<|=)(.*)$/);

    for (const v of vals) {
      if (isOp) {
        const op = isOp[1];
        const target = parseFloat(isOp[2]);
        const numV = parseFloat(String(v));
        if (!isNaN(target) && !isNaN(numV)) {
          if (op === '>' && numV > target) count++;
          else if (op === '>=' && numV >= target) count++;
          else if (op === '<' && numV < target) count++;
          else if (op === '<=' && numV <= target) count++;
          else if (op === '<>' && numV !== target) count++;
          else if (op === '=' && numV === target) count++;
        }
      } else {
        if (String(v).toLowerCase() === critStr.toLowerCase()) {
          count++;
        }
      }
    }
    return count;
  }

  // MIN / MAX
  if (upper === 'MIN' || upper === 'MAX') {
    let best: number | null = null;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) {
          if (best === null) best = n;
          else if (upper === 'MIN' && n < best) best = n;
          else if (upper === 'MAX' && n > best) best = n;
        }
      }
    }
    return best === null ? 0 : best;
  }

  // PRODUCT
  if (upper === 'PRODUCT') {
    let prod = 1;
    let hasNum = false;
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) {
          prod *= n;
          hasNum = true;
        }
      }
    }
    return hasNum ? prod : 0;
  }

  // MEDIAN
  if (upper === 'MEDIAN') {
    const nums: number[] = [];
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) nums.push(n);
      }
    }
    if (nums.length === 0) return '#NUM!';
    nums.sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }

  // STDEV
  if (upper === 'STDEV' || upper === 'STDEVP') {
    const nums: number[] = [];
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (!isNaN(n)) nums.push(n);
      }
    }
    if (nums.length < 2) return '#DIV/0!';
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (upper === 'STDEVP' ? nums.length : nums.length - 1);
    return Math.sqrt(variance);
  }

  // ROUND, ROUNDUP, ROUNDDOWN, ABS, SQRT, POWER, MOD
  if (upper === 'ROUND' || upper === 'ROUNDUP' || upper === 'ROUNDDOWN') {
    if (args.length === 0) return '#ERROR!';
    const val = Number(evaluateAST(args[0], getCell));
    const dec = args.length > 1 ? Number(evaluateAST(args[1], getCell)) : 0;
    if (isNaN(val) || isNaN(dec)) return '#VALUE!';
    const factor = Math.pow(10, dec);
    if (upper === 'ROUNDUP') return Math.ceil(val * factor) / factor;
    if (upper === 'ROUNDDOWN') return Math.floor(val * factor) / factor;
    return Math.round(val * factor) / factor;
  }

  if (upper === 'ABS') {
    const val = Number(evaluateAST(args[0], getCell));
    return isNaN(val) ? '#VALUE!' : Math.abs(val);
  }

  if (upper === 'SQRT') {
    const val = Number(evaluateAST(args[0], getCell));
    if (isNaN(val) || val < 0) return '#NUM!';
    return Math.sqrt(val);
  }

  if (upper === 'POWER') {
    if (args.length < 2) return '#ERROR!';
    const base = Number(evaluateAST(args[0], getCell));
    const exp = Number(evaluateAST(args[1], getCell));
    return isNaN(base) || isNaN(exp) ? '#VALUE!' : Math.pow(base, exp);
  }

  if (upper === 'MOD') {
    if (args.length < 2) return '#ERROR!';
    const n = Number(evaluateAST(args[0], getCell));
    const d = Number(evaluateAST(args[1], getCell));
    if (isNaN(n) || isNaN(d)) return '#VALUE!';
    if (d === 0) return '#DIV/0!';
    return ((n % d) + d) % d;
  }

  // IF(condition, value_if_true, [value_if_false])
  if (upper === 'IF') {
    if (args.length < 2) return '#ERROR!';
    const cond = evaluateAST(args[0], getCell);
    const isTrue = Boolean(cond && cond !== 'FALSE' && cond !== 0);
    if (isTrue) {
      return evaluateAST(args[1], getCell);
    }
    return args.length > 2 ? evaluateAST(args[2], getCell) : false;
  }

  // IFS(cond1, val1, cond2, val2, ...)
  if (upper === 'IFS') {
    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 < args.length) {
        const cond = evaluateAST(args[i], getCell);
        if (Boolean(cond && cond !== 'FALSE' && cond !== 0)) {
          return evaluateAST(args[i + 1], getCell);
        }
      }
    }
    return '#N/A';
  }

  // IFERROR(value, [value_if_error])
  if (upper === 'IFERROR') {
    if (args.length === 0) return '#ERROR!';
    try {
      const val = evaluateAST(args[0], getCell);
      if (typeof val === 'string' && val.startsWith('#')) {
        return args.length > 1 ? evaluateAST(args[1], getCell) : '';
      }
      return val;
    } catch {
      return args.length > 1 ? evaluateAST(args[1], getCell) : '';
    }
  }

  // AND(...) & OR(...) & NOT(...)
  if (upper === 'AND') {
    for (const arg of args) {
      const v = evaluateAST(arg, getCell);
      if (!v || v === 'FALSE' || v === 0) return false;
    }
    return true;
  }

  if (upper === 'OR') {
    for (const arg of args) {
      const v = evaluateAST(arg, getCell);
      if (Boolean(v && v !== 'FALSE' && v !== 0)) return true;
    }
    return false;
  }

  if (upper === 'NOT') {
    if (args.length === 0) return '#ERROR!';
    const v = evaluateAST(args[0], getCell);
    return !Boolean(v && v !== 'FALSE' && v !== 0);
  }

  // VLOOKUP(lookup_value, range, col_index, [is_sorted])
  if (upper === 'VLOOKUP') {
    if (args.length < 3) return '#ERROR!';
    const lookupVal = evaluateAST(args[0], getCell);
    const rangeNode = args[1];
    if (rangeNode.type !== 'Range') return '#REF!';
    const range = a1ToRange(rangeNode.a1Range);
    if (!range) return '#REF!';
    const colIndex = Number(evaluateAST(args[2], getCell));
    if (isNaN(colIndex) || colIndex < 1) return '#VALUE!';

    const norm = normalizeRange(range);
    const targetCol = norm.startCol + colIndex - 1;
    if (targetCol > norm.endCol) return '#REF!';

    const lookupStr = String(lookupVal).toLowerCase();

    for (let r = norm.startRow; r <= norm.endRow; r++) {
      const firstCell = getCell(r, norm.startCol);
      if (String(firstCell).toLowerCase() === lookupStr) {
        return getCell(r, targetCol);
      }
    }
    return '#N/A';
  }

  // HLOOKUP(lookup_value, range, row_index, [is_sorted])
  if (upper === 'HLOOKUP') {
    if (args.length < 3) return '#ERROR!';
    const lookupVal = evaluateAST(args[0], getCell);
    const rangeNode = args[1];
    if (rangeNode.type !== 'Range') return '#REF!';
    const range = a1ToRange(rangeNode.a1Range);
    if (!range) return '#REF!';
    const rowIndex = Number(evaluateAST(args[2], getCell));
    if (isNaN(rowIndex) || rowIndex < 1) return '#VALUE!';

    const norm = normalizeRange(range);
    const targetRow = norm.startRow + rowIndex - 1;
    if (targetRow > norm.endRow) return '#REF!';

    const lookupStr = String(lookupVal).toLowerCase();

    for (let c = norm.startCol; c <= norm.endCol; c++) {
      const firstCell = getCell(norm.startRow, c);
      if (String(firstCell).toLowerCase() === lookupStr) {
        return getCell(targetRow, c);
      }
    }
    return '#N/A';
  }

  // INDEX(range, row_num, [col_num])
  if (upper === 'INDEX') {
    if (args.length < 2) return '#ERROR!';
    const rangeNode = args[0];
    if (rangeNode.type !== 'Range') return '#REF!';
    const range = a1ToRange(rangeNode.a1Range);
    if (!range) return '#REF!';
    const rowNum = Number(evaluateAST(args[1], getCell));
    const colNum = args.length > 2 ? Number(evaluateAST(args[2], getCell)) : 1;

    const norm = normalizeRange(range);
    const r = norm.startRow + rowNum - 1;
    const c = norm.startCol + colNum - 1;

    if (r < norm.startRow || r > norm.endRow || c < norm.startCol || c > norm.endCol) {
      return '#REF!';
    }
    return getCell(r, c);
  }

  // MATCH(lookup_value, range, [match_type])
  if (upper === 'MATCH') {
    if (args.length < 2) return '#ERROR!';
    const lookupVal = evaluateAST(args[0], getCell);
    const rangeVals = evaluateArgToValues(args[1], getCell);
    const lookupStr = String(lookupVal).toLowerCase();

    for (let i = 0; i < rangeVals.length; i++) {
      if (String(rangeVals[i]).toLowerCase() === lookupStr) {
        return i + 1; // 1-indexed
      }
    }
    return '#N/A';
  }

  // CONCATENATE / CONCAT
  if (upper === 'CONCATENATE' || upper === 'CONCAT') {
    let res = '';
    for (const arg of args) {
      const vals = evaluateArgToValues(arg, getCell);
      for (const v of vals) {
        res += v ?? '';
      }
    }
    return res;
  }

  // TEXT functions: LEFT, RIGHT, MID, LEN, LOWER, UPPER, PROPER, TRIM
  if (upper === 'LEFT') {
    const text = String(evaluateAST(args[0], getCell) ?? '');
    const len = args.length > 1 ? Number(evaluateAST(args[1], getCell)) : 1;
    return text.substring(0, Math.max(0, len));
  }

  if (upper === 'RIGHT') {
    const text = String(evaluateAST(args[0], getCell) ?? '');
    const len = args.length > 1 ? Number(evaluateAST(args[1], getCell)) : 1;
    return text.substring(Math.max(0, text.length - len));
  }

  if (upper === 'MID') {
    if (args.length < 3) return '#ERROR!';
    const text = String(evaluateAST(args[0], getCell) ?? '');
    const start = Number(evaluateAST(args[1], getCell)) - 1;
    const len = Number(evaluateAST(args[2], getCell));
    return text.substring(Math.max(0, start), Math.max(0, start + len));
  }

  if (upper === 'LEN') {
    const text = String(evaluateAST(args[0], getCell) ?? '');
    return text.length;
  }

  if (upper === 'LOWER') {
    return String(evaluateAST(args[0], getCell) ?? '').toLowerCase();
  }

  if (upper === 'UPPER') {
    return String(evaluateAST(args[0], getCell) ?? '').toUpperCase();
  }

  if (upper === 'PROPER') {
    const text = String(evaluateAST(args[0], getCell) ?? '');
    return text.replace(/\b\w/g, c => c.toUpperCase());
  }

  if (upper === 'TRIM') {
    return String(evaluateAST(args[0], getCell) ?? '').trim();
  }

  // TODAY() / NOW()
  if (upper === 'TODAY') {
    const d = new Date();
    return d.toLocaleDateString();
  }

  if (upper === 'NOW') {
    return new Date().toLocaleString();
  }

  if (upper === 'YEAR') {
    const v = evaluateAST(args[0], getCell);
    const d = new Date(String(v));
    return isNaN(d.getFullYear()) ? '#VALUE!' : d.getFullYear();
  }

  if (upper === 'MONTH') {
    const v = evaluateAST(args[0], getCell);
    const d = new Date(String(v));
    return isNaN(d.getMonth()) ? '#VALUE!' : d.getMonth() + 1;
  }

  if (upper === 'DAY') {
    const v = evaluateAST(args[0], getCell);
    const d = new Date(String(v));
    return isNaN(d.getDate()) ? '#VALUE!' : d.getDate();
  }

  return '#NAME?';
}

// Top-level formula evaluator for a single expression
export function evaluateFormula(rawFormula: string, getCell: CellLookup): { computed: CellValue; error: string | null } {
  if (!rawFormula.startsWith('=')) {
    // Treat as primitive value
    const trimmed = rawFormula.trim();
    if (trimmed === '') return { computed: '', error: null };
    if (trimmed.toUpperCase() === 'TRUE') return { computed: true, error: null };
    if (trimmed.toUpperCase() === 'FALSE') return { computed: false, error: null };
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return { computed: num, error: null };
    return { computed: rawFormula, error: null };
  }

  try {
    const tokens = tokenize(rawFormula.substring(1));
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = evaluateAST(ast, getCell);

    if (typeof result === 'string' && result.startsWith('#')) {
      return { computed: result, error: result };
    }
    return { computed: result, error: null };
  } catch (err: any) {
    return { computed: '#ERROR!', error: err?.message || '#ERROR!' };
  }
}

// Recalculates all cells in a sheet handling dependency order and cycle detection
export function recalculateSheet(sheet: SheetData): SheetData {
  const newCells = { ...sheet.cells };
  const evaluatedValues: Record<string, CellValue> = {};
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const getCellValue: CellLookup = (row, col) => {
    const key = getCellKey(row, col);
    if (evaluatedValues[key] !== undefined) {
      return evaluatedValues[key];
    }
    const cell = newCells[key];
    if (!cell || !cell.raw) return null;

    if (!cell.raw.startsWith('=')) {
      const num = Number(cell.raw);
      if (!isNaN(num) && cell.raw.trim() !== '') return num;
      if (cell.raw.toUpperCase() === 'TRUE') return true;
      if (cell.raw.toUpperCase() === 'FALSE') return false;
      return cell.raw;
    }

    // Circular reference check
    if (visiting.has(key)) {
      return '#REF!'; // Circular reference!
    }

    visiting.add(key);
    const { computed, error } = evaluateFormula(cell.raw, getCellValue);
    visiting.delete(key);
    visited.add(key);
    evaluatedValues[key] = computed;
    return computed;
  };

  for (const [key, cell] of Object.entries(newCells)) {
    if (!cell.raw) continue;
    if (cell.raw.startsWith('=')) {
      visiting.clear();
      visiting.add(key);
      const { computed, error } = evaluateFormula(cell.raw, getCellValue);
      visiting.delete(key);
      visited.add(key);
      evaluatedValues[key] = computed;
      newCells[key] = {
        ...cell,
        computed,
        error,
      };
    } else {
      const num = Number(cell.raw);
      let computed: CellValue = cell.raw;
      if (!isNaN(num) && cell.raw.trim() !== '') {
        computed = num;
      } else if (cell.raw.toUpperCase() === 'TRUE') {
        computed = true;
      } else if (cell.raw.toUpperCase() === 'FALSE') {
        computed = false;
      }
      evaluatedValues[key] = computed;
      newCells[key] = {
        ...cell,
        computed,
        error: null,
      };
    }
  }

  return {
    ...sheet,
    cells: newCells,
  };
}
