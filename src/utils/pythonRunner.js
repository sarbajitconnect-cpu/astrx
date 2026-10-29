/**
 * Browser-native Python Execution Engine
 * Evaluates Python syntax, control flow, functions, built-ins, and standard modules
 * Captures stdout in real-time with timing metrics.
 */

export async function runPythonCode(code) {
  const startTime = performance.now();
  const logs = [];

  const log = (text) => {
    logs.push(String(text));
  };

  try {
    const jsTranspiled = transpilePythonToJS(code);
    const pythonEnv = createPythonEnvironment(log);
    
    // Execute transpiled script
    const runner = new Function(...Object.keys(pythonEnv), `
      return (async () => {
        ${jsTranspiled}
      })();
    `);
    await runner(...Object.values(pythonEnv));

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    return {
      success: true,
      logs,
      duration
    };
  } catch (err) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    return {
      success: false,
      logs,
      error: formatPythonError(err, code),
      duration
    };
  }
}

function createPythonEnvironment(log) {
  // Prototype enhancements for list methods
  if (!Array.prototype.append) {
    Array.prototype.append = function(item) { this.push(item); return this; };
  }
  if (!Array.prototype.extend) {
    Array.prototype.extend = function(items) { this.push(...items); return this; };
  }
  if (!Array.prototype.insert) {
    Array.prototype.insert = function(idx, item) { this.splice(idx, 0, item); return this; };
  }
  if (!Array.prototype.remove) {
    Array.prototype.remove = function(item) {
      const idx = this.indexOf(item);
      if (idx > -1) this.splice(idx, 1);
      return this;
    };
  }

  // String methods
  if (!String.prototype.lower) {
    String.prototype.lower = function() { return this.toLowerCase(); };
  }
  if (!String.prototype.upper) {
    String.prototype.upper = function() { return this.toUpperCase(); };
  }
  if (!String.prototype.strip) {
    String.prototype.strip = function() { return this.trim(); };
  }
  if (!String.prototype.splitlines) {
    String.prototype.splitlines = function() { return this.split(/\r\n|\r|\n/); };
  }

  return {
    print: (...args) => {
      const output = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          if (Array.isArray(arg)) {
            return '[' + arg.map(x => typeof x === 'string' ? `'${x}'` : String(x)).join(', ') + ']';
          }
          try { return JSON.stringify(arg); } catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      log(output);
    },
    range: (start, stop, step = 1) => {
      if (stop === undefined) {
        stop = start;
        start = 0;
      }
      const arr = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) arr.push(i);
      } else if (step < 0) {
        for (let i = start; i > stop; i += step) arr.push(i);
      }
      return arr;
    },
    len: (obj) => obj ? (obj.length ?? Object.keys(obj).length ?? 0) : 0,
    sum: (arr) => Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0,
    max: (...args) => Array.isArray(args[0]) ? Math.max(...args[0]) : Math.max(...args),
    min: (...args) => Array.isArray(args[0]) ? Math.min(...args[0]) : Math.min(...args),
    abs: Math.abs,
    round: (num, dec = 0) => Number(Math.round(num + 'e' + dec) + 'e-' + dec),
    int: (v) => parseInt(v, 10),
    float: (v) => parseFloat(v),
    str: (v) => String(v),
    bool: (v) => Boolean(v),
    list: (v) => Array.from(v || []),
    dict: (entries) => Object.fromEntries(entries || []),
    set: (v) => new Set(v || []),
    type: (v) => typeof v,
    enumerate: (arr) => arr.map((item, idx) => [idx, item]),
    zip: (a, b) => a.map((k, i) => [k, b[i]]),
    math: {
      pi: Math.PI,
      e: Math.E,
      sqrt: Math.sqrt,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      floor: Math.floor,
      ceil: Math.ceil,
      log: Math.log,
      log10: Math.log10,
      pow: Math.pow
    },
    random: {
      random: () => Math.random(),
      randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
      choice: (arr) => arr[Math.floor(Math.random() * arr.length)]
    },
    time: {
      time: () => Date.now() / 1000,
      sleep: (sec) => new Promise(r => setTimeout(r, sec * 1000))
    },
    json: {
      dumps: (obj) => JSON.stringify(obj, null, 2),
      loads: (str) => JSON.parse(str)
    }
  };
}

/**
 * Transpiles common Python syntax to executable JS in sandbox
 */
function transpilePythonToJS(code) {
  const lines = code.split('\n');
  const jsLines = [];
  const indentStack = [0];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) {
      continue;
    }

    const indent = rawLine.search(/\S/);
    const line = rawLine.trim();

    // Close blocks when indentation decreases
    while (indent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push('}');
    }

    // Python constructs transpilation
    if (line.startsWith('for ') && line.includes(' in ') && line.endsWith(':')) {
      const match = line.match(/^for\s+([a-zA-Z0-9_,\s()]+)\s+in\s+(.+):$/);
      if (match) {
        const iterVar = match[1].trim();
        const iterable = match[2].trim();
        jsLines.push(`for (const ${iterVar} of ${iterable}) {`);
        indentStack.push(indent + 4);
        continue;
      }
    }

    if (line.startsWith('while ') && line.endsWith(':')) {
      const cond = line.slice(6, -1).trim();
      jsLines.push(`while (${transpileCondition(cond)}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    if (line.startsWith('if ') && line.endsWith(':')) {
      const cond = line.slice(3, -1).trim();
      jsLines.push(`if (${transpileCondition(cond)}) {`);
      indentStack.push(indent + 4);
      continue;
    }

    if (line.startsWith('elif ') && line.endsWith(':')) {
      const cond = line.slice(5, -1).trim();
      jsLines.push(`} else if (${transpileCondition(cond)}) {`);
      continue;
    }

    if (line === 'else:') {
      jsLines.push(`} else {`);
      continue;
    }

    if (line.startsWith('def ') && line.endsWith(':')) {
      const funcMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\((.*?)\):$/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const params = funcMatch[2];
        jsLines.push(`function ${funcName}(${params}) {`);
        indentStack.push(indent + 4);
        continue;
      }
    }

    if (line.startsWith('return ') || line === 'return') {
      jsLines.push(line + ';');
      continue;
    }

    // Standard assignments & statements
    let transLine = line
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!')
      .replace(/f"([^"]*)"/g, (_, s) => '`' + s.replace(/{([^}]+)}/g, '${$1}') + '`')
      .replace(/f'([^']*)'/g, (_, s) => '`' + s.replace(/{([^}]+)}/g, '${$1}') + '`');

    // Handle variable declarations
    if (/^[a-zA-Z0-9_,\s()]+\s*=[^=]/.test(transLine) && !transLine.startsWith('let ') && !transLine.startsWith('const ') && !transLine.startsWith('var ')) {
      // Multiple assignment e.g. a, b = 0, 1
      if (transLine.includes(',') && transLine.split('=')[0].includes(',')) {
        const [lhs, rhs] = transLine.split('=');
        const vars = lhs.split(',').map(v => v.trim());
        const vals = rhs.split(',').map(v => v.trim());
        transLine = `var [${vars.join(', ')}] = [${vals.join(', ')}];`;
      } else {
        transLine = `var ${transLine};`;
      }
    } else if (!transLine.endsWith(';') && !transLine.endsWith('{') && !transLine.endsWith('}')) {
      transLine += ';';
    }

    jsLines.push(transLine);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push('}');
  }

  return jsLines.join('\n');
}

function transpileCondition(cond) {
  return cond
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/==/g, '===')
    .replace(/!=/g, '!==');
}

function formatPythonError(err, code) {
  const message = err.message || String(err);
  return `Traceback (most recent call last):\n  File "main.py", in <module>\nRuntimeError: ${message}`;
}
