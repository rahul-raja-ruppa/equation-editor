import { validateLatex } from 'mathlive/ssr';
import type { LatexSyntaxError } from 'mathlive';

export interface LatexErrorInfo {
  message: string;
  start: number;
  end: number;
}

function describeError(error: LatexSyntaxError): string {
  const a = error.arg ? ` \`${error.arg}\`` : '';
  switch (error.code) {
    case 'unknown-command':
      return `Unknown command${a}`;
    case 'invalid-command':
      return `Invalid command${a}`;
    case 'unknown-environment':
      return `Unknown environment${a}`;
    case 'unbalanced-environment':
      return `Unbalanced \\begin / \\end${a}`;
    case 'unbalanced-mode-shift':
      return 'Unbalanced $ or $$';
    case 'missing-argument':
      return `Missing argument for${a}`;
    case 'too-many-infix-commands':
      return 'Too many infix operators';
    case 'unexpected-command-in-string':
      return `Unexpected command${a}`;
    case 'missing-unit':
      return 'Missing unit (e.g. pt, em)';
    case 'unexpected-delimiter':
      return `Unexpected delimiter${a}`;
    case 'unexpected-token':
      return `Unexpected token${a}`;
    case 'unexpected-end-of-string':
      return 'Unexpected end of input';
    case 'improper-alphabetic-constant':
      return 'Improper character constant';
    default:
      return `Syntax error${a}`;
  }
}

function findErrorPosition(
  latex: string,
  err: LatexSyntaxError
): { start: number; end: number } | null {
  if (err.arg && err.arg.startsWith('\\')) {
    const idx = latex.indexOf(err.arg);
    if (idx >= 0) return { start: idx, end: idx + err.arg.length };
  }
  return null;
}

function checkBraceBalance(latex: string): LatexErrorInfo | null {
  const stack: number[] = [];
  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];
    const escaped = i > 0 && latex[i - 1] === '\\';
    if (escaped) continue;
    if (ch === '{') {
      stack.push(i);
    } else if (ch === '}') {
      if (stack.length === 0) {
        return { message: 'Unbalanced braces — extra }', start: i, end: i + 1 };
      }
      stack.pop();
    }
  }
  if (stack.length > 0) {
    return { message: 'Unbalanced braces — missing }', start: stack[0], end: stack[0] + 1 };
  }
  return null;
}

export function getLatexErrorInfo(latex: string): LatexErrorInfo | null {
  const braceError = checkBraceBalance(latex);
  if (braceError) return braceError;

  let errors: LatexSyntaxError[];
  try {
    errors = validateLatex(latex);
  } catch {
    // validateLatex itself throws on certain malformed inputs (e.g. nested \begin{} environments).
    // Treat the exception as a generic syntax error so the caller gets a non-null result
    // and never passes the string to MathLive's parser.
    return { message: 'Invalid LaTeX', start: -1, end: -1 };
  }

  if (errors.length === 0) return null;
  const err = errors[0];
  const pos = findErrorPosition(latex, err);
  return {
    message: describeError(err),
    start: pos?.start ?? -1,
    end: pos?.end ?? -1,
  };
}
