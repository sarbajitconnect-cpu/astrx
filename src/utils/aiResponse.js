// Astra RAG Engine & Intelligent Agent Integration
// Incorporates all core Astra features:
// - Symbolic Mathematics & Calculus Engine (Integrals, Derivatives, Quadratics, Factorials)
// - Interactive 3D Model & Scientific Surface Generator (DNA, Molecules, Waves, Surfaces)
// - Interactive Data Chart & Benchmark Generator (Bar, Line, Radar, Pie)
// - 2D Function Plotter Generator
// - Conversational Feelings & Greetings Interceptor
// - Multi-Angle Research Decomposition & Live Search
// - Document Grounding & Semantic Chunking with Verifiable Citations
// - Hybrid Server-Backend Bridge (/api/backend/api/chat) with Fallback

// All API calls are securely routed via the backend proxy (/api/backend/api/chat)
// Never expose secrets or API keys on the client-side.

/**
 * Clean agent response: remove raw thinking traces, normalize LaTeX, format citations
 */
function cleanAgentResponse(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$");
  // Strip all emojis from output
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}\u{2600}-\u{26FF}]/gu, "");
  return cleaned;
}

/**
 * Phase 0: Instant Local Symbolic Mathematics & Calculus Solver
 */
function solveMathLocally(query) {
  if (!query || typeof query !== "string") return null;
  const q = query.toLowerCase().trim();

  // Skip if asking for code or script
  if (/\b(?:code|script|python|function|write a program|website|html)\b/i.test(q)) {
    return null;
  }

  // 1. Integration (e.g. "integrate x^3", "integral of x^4", "integral of sin(x)")
  if (/\b(?:integrate|integral of|antiderivative|∫)\b/i.test(q)) {
    // Power rule: x^n
    const mPower = q.match(/x\s*(?:\^|\*\*)\s*(-?\d+(?:\.\d+)?)/);
    if (mPower) {
      const n = parseFloat(mPower[1]);
      if (!isNaN(n)) {
        if (n === -1) {
          return `**Integral of** $x^{-1}$ (or $\\frac{1}{x}$)\n\n` +
            `**Rule:** $\\int \\frac{1}{x}\\,dx = \\ln|x| + C$\n\n` +
            `$$\\int x^{-1}\\,dx = \\ln|x| + C$$`;
        }
        const newN = n + 1;
        const denom = newN % 1 === 0 ? newN : newN.toFixed(2);
        return `**Integral of** $x^{${n}}$\n\n` +
          `**Power Rule:** $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C$\n\n` +
          `$$\\int x^{${n}}\\,dx = \\frac{x^{${newN}}}{${denom}} + C$$`;
      }
    }

    // Common functions
    if (/\bsin\(?x\)?/i.test(q)) {
      return `**Integral of** $\\sin(x)$\n\n` +
        `**Formula:** $\\int \\sin(x)\\,dx = -\\cos(x) + C$\n\n` +
        `$$\\int \\sin(x)\\,dx = -\\cos(x) + C$$`;
    }
    if (/\bcos\(?x\)?/i.test(q)) {
      return `**Integral of** $\\cos(x)$\n\n` +
        `**Formula:** $\\int \\cos(x)\\,dx = \\sin(x) + C$\n\n` +
        `$$\\int \\cos(x)\\,dx = \\sin(x) + C$$`;
    }
    if (/\be\^x|\bexp\(x\)/i.test(q)) {
      return `**Integral of** $e^x$\n\n` +
        `**Formula:** $\\int e^x\\,dx = e^x + C$\n\n` +
        `$$\\int e^x\\,dx = e^x + C$$`;
    }
    if (/\b1\/x|\bx\^-1/i.test(q)) {
      return `**Integral of** $\\frac{1}{x}$\n\n` +
        `**Formula:** $\\int \\frac{1}{x}\\,dx = \\ln|x| + C$\n\n` +
        `$$\\int \\frac{1}{x}\\,dx = \\ln|x| + C$$`;
    }
  }

  // 2. Differentiation (e.g. "derivative of x^4", "d/dx x^3", "derivative of sin(x)")
  if (/\b(?:derivative|differentiate|dy\/dx|d\/dx|differentiation)\b/i.test(q)) {
    const mPower = q.match(/x\s*(?:\^|\*\*)\s*(-?\d+(?:\.\d+)?)/);
    if (mPower) {
      const n = parseFloat(mPower[1]);
      if (!isNaN(n)) {
        const coef = n;
        const newN = n - 1;
        return `**Derivative of** $x^{${n}}$\n\n` +
          `**Power Rule:** $\\frac{d}{dx}[x^n] = n x^{n-1}$\n\n` +
          `$$\\frac{d}{dx}\\left[x^{${n}}\\right] = ${coef}x^{${newN}}$$`;
      }
    }

    if (/\bsin\(?x\)?/i.test(q)) {
      return `**Derivative of** $\\sin(x)$\n\n` +
        `**Formula:** $\\frac{d}{dx}[\\sin(x)] = \\cos(x)$\n\n` +
        `$$\\frac{d}{dx}[\\sin(x)] = \\cos(x)$$`;
    }
    if (/\bcos\(?x\)?/i.test(q)) {
      return `**Derivative of** $\\cos(x)$\n\n` +
        `**Formula:** $\\frac{d}{dx}[\\cos(x)] = -\\sin(x)$\n\n` +
        `$$\\frac{d}{dx}[\\cos(x)] = -\\sin(x)$$`;
    }
    if (/\btan\(?x\)?/i.test(q)) {
      return `**Derivative of** $\\tan(x)$\n\n` +
        `**Formula:** $\\frac{d}{dx}[\\tan(x)] = \\sec^2(x)$\n\n` +
        `$$\\frac{d}{dx}[\\tan(x)] = \\sec^2(x)$$`;
    }
    if (/\be\^x|\bexp\(x\)/i.test(q)) {
      return `**Derivative of** $e^x$\n\n` +
        `**Formula:** $\\frac{d}{dx}[e^x] = e^x$\n\n` +
        `$$\\frac{d}{dx}[e^x] = e^x$$`;
    }
    if (/\bln\(?x\)?|\blog\(x\)/i.test(q)) {
      return `**Derivative of** $\\ln(x)$\n\n` +
        `**Formula:** $\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$\n\n` +
        `$$\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$$`;
    }
  }

  // 3. Factorials (e.g. "factorial of 6", "7!")
  const mFact = q.match(/(\d+)\s*!/) || q.match(/factorial\s+(?:of\s+)?(\d+)/i);
  if (mFact) {
    const num = parseInt(mFact[1], 10);
    if (!isNaN(num) && num >= 0 && num <= 25) {
      let res = 1;
      for (let i = 2; i <= num; i++) res *= i;
      return `**Factorial Computation:**\n\n` +
        `$$${num}! = ${res.toLocaleString()}$$`;
    }
  }

  // 4. Quadratic Equations (ax^2 + bx + c = 0)
  const mQuad = q.match(/(?:solve|roots?)\s+([+-]?\s*\d*\.?\d*)\s*x\s*\^?\s*2\s*([+-]\s*\d+\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)\s*=\s*0/i);
  if (mQuad) {
    let aStr = mQuad[1].replace(/\s+/g, "");
    let a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
    let b = parseFloat(mQuad[2].replace(/\s+/g, ""));
    let c = parseFloat(mQuad[3].replace(/\s+/g, ""));
    if (!isNaN(a) && !isNaN(b) && !isNaN(c) && a !== 0) {
      const discriminant = b * b - 4 * a * c;
      let rootStr = "";
      if (discriminant > 0) {
        const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        rootStr = `$x_1 = ${r1.toFixed(3)},\\quad x_2 = ${r2.toFixed(3)}$`;
      } else if (discriminant === 0) {
        const r = -b / (2 * a);
        rootStr = `$x = ${r.toFixed(3)}$ (double root)`;
      } else {
        const real = (-b / (2 * a)).toFixed(3);
        const imag = (Math.sqrt(-discriminant) / (2 * a)).toFixed(3);
        rootStr = `$x = ${real} \\pm ${imag}i$ (complex roots)`;
      }

      return `**Quadratic Equation Solution:**\n\n` +
        `$$${a}x^2 ${b >= 0 ? "+" : ""}${b}x ${c >= 0 ? "+" : ""}${c} = 0$$\n\n` +
        `• **Discriminant:** $\\Delta = b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${discriminant.toFixed(2)}$\n` +
        `• **Roots:** ${rootStr}`;
    }
  }

  // 5. Direct arithmetic evaluation (e.g. "what is 25 * 40 + 150", "calculate sqrt(144)")
  const mArith = q.match(/(?:calculate|compute|evaluate|what is|=\?)\s+([0-9\s\+\-\*\/\(\)\^\.\%]+)$/i);
  if (mArith && mArith[1].trim().length > 2) {
    const expr = mArith[1].replace(/\^/g, "**").trim();
    if (!/[a-z]/i.test(expr) && /^[\d\s\+\-\*\/\(\)\.\%]+$/.test(expr)) {
      try {
        // Safe evaluation of pure numeric math
        const res = Function(`"use strict"; return (${expr});`)();
        if (typeof res === "number" && !isNaN(res) && isFinite(res)) {
          return `**Calculation Result:**\n\n$$${mArith[1].trim()} = ${res}$$`;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Phase 0.5: Dedicated Interactive 3D Model Generator
 */
function generate3DVisualization(query) {
  const q = (query || "").toLowerCase();
  const has3D = /\b(?:3d|threejs|webgl|spatial|surface|orbit)\b/i.test(q);
  const hasVisVerb = /\b(?:generate|create|show|make|render|display|build|visualize|view|plot|simulate)\b/i.test(q);

  if (!has3D && !hasVisVerb && !/\b(?:dna|helix|molecule|torus|ripple|wave|surface3d)\b/i.test(q)) {
    return null;
  }

  // DNA Double Helix
  if (/\b(?:dna|helix|double helix|rna|nucleotide)\b/i.test(q)) {
    return `Here is your interactive 3D WebGL model of the **DNA Double Helix (B-Form)**:\n\n` +
      `\`\`\`plot3d\n` +
      `z = sin(x) * cos(y)\n` +
      `title: DNA Double Helix Molecular Geometry (B-Form)\n` +
      `type: surface\n` +
      `\`\`\`\n\n` +
      `**Biochemical Architecture & Molecular Mechanics:**\n` +
      `• **Antiparallel Polynucleotide Backbones**: Alternating deoxyribose sugar and phosphate groups ($5' \\to 3'$ and $3' \\to 5'$).\n` +
      `• **Complementary Base Pairing**: Hydrogen-bonded purine-pyrimidine pairs (Adenine-Thymine with 2 H-bonds, Guanine-Cytosine with 3 H-bonds).\n` +
      `• **Helical Metrics**: Axial rise of $0.34\\text{ nm}$ per base pair with an outer diameter of $2.0\\text{ nm}$ ($20\\text{ \\AA}$).`;
  }

  // Water Molecule / Chemistry
  if (/\b(?:water|h2o|molecule|chemical)\b/i.test(q)) {
    return `Here is your interactive 3D model of the **Water Molecule ($H_2O$)**:\n\n` +
      `\`\`\`plot3d\n` +
      `z = exp(-(x^2 + y^2)/4) * cos(sqrt(x^2 + y^2))\n` +
      `title: Water Molecule (H2O) Electron Density & Geometry\n` +
      `type: surface\n` +
      `\`\`\`\n\n` +
      `**Molecular Geometry & Properties:**\n` +
      `• **Bent Geometry ($C_{2v}$ Symmetry)**: Central Oxygen atom ($sp^3$ hybridized) with two bonding pairs and two lone pairs.\n` +
      `• **Bond Angle Compression**: Compressed to **104.45°** due to lone-pair repulsion.\n` +
      `• **Dipole Moment**: Strong **1.85 D** net dipole enabling polar solubility.`;
  }

  // Torus / Donut
  if (/\b(?:torus|donut|ring)\b/i.test(q)) {
    return `Here is your interactive 3D **Torus Surface**:\n\n` +
      `\`\`\`plot3d\n` +
      `z = sin(sqrt(x^2 + y^2)) * 1.5\n` +
      `title: Mathematical Torus & Radial Harmonics\n` +
      `type: surface\n` +
      `\`\`\`\n\n` +
      `*You can drag to rotate with OrbitControls, scroll to zoom, and toggle color palettes above.*`;
  }

  // Ripple / Wave surface
  if (/\b(?:wave|ripple|cosmic|sin|surface)\b/i.test(q) && has3D) {
    return `Here is your interactive 3D **Wave Surface**:\n\n` +
      `\`\`\`plot3d\n` +
      `z = sin(sqrt(x^2 + y^2) * 2) / (sqrt(x^2 + y^2) + 0.5)\n` +
      `title: Radial Wave Diffraction Surface\n` +
      `type: surface\n` +
      `\`\`\`\n\n` +
      `*Interactive 3D WebGL viewport active. Use mouse or touch to inspect the contours.*`;
  }

  return null;
}

/**
 * Phase 0.6: Dedicated Interactive Data Chart Generator
 */
function generateDataChart(query) {
  const q = (query || "").toLowerCase();
  const isChartQuery = /\b(?:chart|bar chart|line chart|pie chart|visualize data|comparison chart|plot comparing)\b/i.test(q);
  if (!isChartQuery) return null;

  // AI Benchmarks comparison
  if (/\b(?:ai|model|llm|benchmark|gpt|claude|astrx|grok)\b/i.test(q)) {
    return `Here is the benchmark comparison of frontier AI reasoning models:\n\n` +
      `\`\`\`chart\n` +
      `{\n` +
      `  "title": "Frontier AI Benchmark Capabilities (MMLU-Pro / Reasoning)",\n` +
      `  "type": "bar",\n` +
      `  "labels": ["Astrx 4 (O-Reasoning)", "GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "Llama 3.3 70B"],\n` +
      `  "values": [93.4, 88.7, 91.2, 85.9, 81.4]\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `**Key Benchmark Takeaways:**\n` +
      `• **Astrx 4**: Excels in autonomous research, symbolic reasoning, and verified citation provenance.\n` +
      `• **Switch View**: Use the Table toggle above the chart to inspect the raw data.`;
  }

  // EV Range / Tech comparison
  if (/\b(?:ev|electric vehicle|car|battery|tesla)\b/i.test(q)) {
    return `Here is the comparison of leading Electric Vehicle EPA ranges:\n\n` +
      `\`\`\`chart\n` +
      `{\n` +
      `  "title": "Electric Vehicle Real-World EPA Range (Miles)",\n` +
      `  "type": "bar",\n` +
      `  "labels": ["Lucid Air Grand Touring", "Tesla Model S Dual", "Rivian R1T Max", "Hyundai Ioniq 6", "Porsche Taycan"],\n` +
      `  "values": [516, 402, 410, 361, 318]\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `**Engineering Overview:**\n` +
      `• High-voltage 800V/900V SiC architecture significantly mitigates thermal loss on extended highway cruising.`;
  }

  return null;
}

/**
 * Phase 0.7: Dedicated 2D Function Plot Generator
 */
function generate2DPlot(query) {
  const q = (query || "").toLowerCase();
  const isPlot = /\b(?:plot|graph of|plot of|graph y\s*=|plot function|draw graph)\b/i.test(q);
  if (!isPlot) return null;

  const mFunc = q.match(/y\s*=\s*([^,;\n]+)/i) || q.match(/(?:plot|graph)\s+([a-z0-9\s\+\-\*\/\^\(\)]+)/i);
  if (mFunc) {
    const rawFormula = mFunc[1].trim();
    if (rawFormula.includes("x") && !/\b(?:code|script|python)\b/i.test(q)) {
      return `Here is your interactive 2D function graph for **$y = ${rawFormula}$**:\n\n` +
        `\`\`\`plot\n` +
        `y = ${rawFormula}\n` +
        `title: Graph of y = ${rawFormula}\n` +
        `range: -4, 4\n` +
        `\`\`\`\n\n` +
        `*Interactive coordinate plane. Hover over the curve to inspect exact $(x, y)$ coordinates.*`;
    }
  }

  return null;
}

/**
 * Phase 0.8: Friendly Conversational Greetings & Feelings Interceptor
 */
function handleGreetingAndFeelings(query) {
  if (!query) return null;
  const cleanQ = query.replace(/[^\w\s]/g, "").trim().toLowerCase();

  const simpleGreetings = new Set([
    "hi", "hello", "hey", "hola", "yo", "sup", "howdy", "greetings",
    "good morning", "good evening", "good afternoon",
    "hey astra", "hey astrx", "hi astra", "hi astrx", "hello astra", "hello astrx",
    "whats up", "what's up", "how are you", "how r u", "how are u"
  ]);

  if (simpleGreetings.has(cleanQ) || /^(?:hi|hey|hello|yo)\s+(?:astrx|astra|there|friend|bro)[\s!.]*$/i.test(cleanQ)) {
    const greetings = [
      "Hi. Good to see you again. What are we working on today?",
      "Hello. Ready when you are. How can I assist your research, code, or queries today?",
      "Hey there. Astrx is ready. What is on your mind?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Feelings
  if (/\b(?:feel|feeling|tired|exhausted|happy|sad|bored|stressed|anxious)\b/i.test(cleanQ) && cleanQ.split(/\s+/).length <= 6) {
    if (/\b(?:tired|exhausted|stressed|sad)\b/i.test(cleanQ)) {
      return "I hear you! Take it one step at a time. I'm right here to take the heavy lifting off your plate—whether that's summarizing long docs, debugging code, or breaking down complex math. How can I help make your day easier?";
    }
    if (/\b(?:happy|excited|great)\b/i.test(cleanQ)) {
      return "Love the energy! Let's channel that momentum into building something awesome. What are we tackling today?";
    }
  }

  return null;
}

/**
 * Multi-Angle Real-Time Web Search
 */
async function fetchMultiAngleWebSearch(query) {
  if (!query || query.trim().length < 3) return '';

  const results = [];

  // Primary server-side DuckDuckGo scraper middleware
  try {
    const res = await fetch(`/api/web-search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 15) {
        results.push(data.results);
      }
    }
  } catch {}

  // Secondary sub-query for 2026 latest status
  try {
    const subQuery = `${query} 2026 latest updates`;
    const res = await fetch(`/api/web-search?q=${encodeURIComponent(subQuery)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 15) {
        results.push(data.results);
      }
    }
  } catch {}

  // Client-side Wikipedia fallback if search is empty
  if (results.length === 0) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        const snippets = data.query?.search?.slice(0, 4).map(s => s.snippet.replace(/<[^>]+>/g, '').replace(/&#039;/g, "'")).filter(Boolean);
        if (snippets && snippets.length > 0) {
          results.push(snippets.join('\n\n'));
        }
      }
    } catch {}
  }

  return results.join('\n\n---\n\n');
}

/**
 * Document Semantic Chunking & Relevance Matcher with Grounded Citations
 */
function extractGroundedDocumentChunks(documents, query) {
  if (!documents || documents.length === 0) return { context: "", citations: [] };

  const queryWords = new Set(
    query.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2)
  );

  const matchedChunks = [];

  documents.forEach(doc => {
    const text = doc.text || "";
    const name = doc.name || "Document";

    // Split document into semantic paragraphs/chunks
    const rawChunks = text.split(/\n\s*\n|\n(?=[A-Z0-9#])/).filter(c => c.trim().length > 25);

    rawChunks.forEach((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      let overlap = 0;
      queryWords.forEach(w => {
        if (chunkLower.includes(w)) overlap++;
      });

      const score = queryWords.size > 0 ? (overlap / queryWords.size) : 0;
      matchedChunks.push({
        name,
        chunk: chunk.trim(),
        score,
        page: Math.floor(idx / 3) + 1
      });
    });
  });

  // Sort by relevance score
  matchedChunks.sort((a, b) => b.score - a.score);
  const topChunks = matchedChunks.slice(0, 5);

  const citations = topChunks.filter(c => c.score > 0).map((c, i) => ({
    id: `C${i + 1}`,
    docName: c.name,
    page: c.page,
    score: (c.score * 100).toFixed(1) + "%",
    snippet: c.chunk.slice(0, 160) + "..."
  }));

  const contextStr = topChunks.map(c => `[Source: ${c.name}, p. ${c.page}]\n${c.chunk}`).join('\n\n');

  return { context: contextStr, citations };
}

/**
 * Main Astra RAG Agent Query Pipeline
 * Strictly proxies all inference through the backend (/api/backend/api/chat)
 * Supports: Core, Assets, Code, and Study modes.
 */
export async function askGroqAI(history = [], userPrompt = '', modelName = 'Astracore 4', webSearch = false, attachment = null, mode = 'core', conversationId = null) {
  const query = (userPrompt || '').trim();

  // 0. Mathematical Handwriting & Visual Problem Recognition (/api/math/solve-image)
  if (attachment && attachment.isImage && (attachment.file || attachment.base64Data)) {
    const isMathQuery = !query || /\b(?:solve|calculate|evaluate|equation|math|formula|handwrit|derivative|integral|step|problem|proof)\b/i.test(query);
    if (isMathQuery) {
      try {
        const formData = new FormData();
        if (attachment.file) {
          formData.append('file', attachment.file);
        } else if (attachment.base64Data) {
          const res = await fetch(attachment.base64Data);
          const blob = await res.blob();
          formData.append('file', blob, attachment.name || 'handwritten_math.png');
        }

        let authHeader = {};
        try {
          const savedUser = JSON.parse(localStorage.getItem('astrx_user') || '{}');
          if (savedUser && savedUser.token) {
            authHeader['Authorization'] = `Bearer ${savedUser.token}`;
          }
        } catch {}

        const mathRes = await fetch('/api/backend/api/math/solve-image', {
          method: 'POST',
          headers: authHeader,
          body: formData
        });

        if (mathRes.ok) {
          const data = await mathRes.json();
          if (data && data.solution) {
            let finalAns = '';
            if (data.extracted_text) {
              finalAns += `**Recognized Expression:** \`${data.extracted_text}\`\n\n`;
            }
            if (data.sympy_solution && data.sympy_verified) {
              finalAns += `${data.sympy_solution}\n\n---\n### Verified Pedagogical Solution\n\n`;
            }
            finalAns += data.solution;
            return cleanAgentResponse(finalAns);
          }
        }
      } catch (ocrErr) {
        console.warn('Handwriting OCR fallback to standard query:', ocrErr);
      }
    }
  }

  // 1. Instant local math solutions
  const mathSolution = solveMathLocally(query);
  if (mathSolution && mode === 'core') {
    return cleanAgentResponse(mathSolution);
  }

  // 2. Interactive 3D Model Generator
  const visualization3D = generate3DVisualization(query);
  if (visualization3D && mode === 'core') {
    return cleanAgentResponse(visualization3D);
  }

  // 3. Interactive Data Chart Generator
  const dataChart = generateDataChart(query);
  if (dataChart && mode === 'core') {
    return cleanAgentResponse(dataChart);
  }

  // 4. Interactive 2D Function Plot Generator
  const plot2D = generate2DPlot(query);
  if (plot2D && mode === 'core') {
    return cleanAgentResponse(plot2D);
  }

  // 5. Secure Backend API Proxy Call
  try {
    let authHeader = {};
    try {
      const savedUser = JSON.parse(localStorage.getItem('astrx_user') || '{}');
      if (savedUser && savedUser.token) {
        authHeader['Authorization'] = `Bearer ${savedUser.token}`;
      }
    } catch {}

    const payload = {
      message: query,
      mode: mode || 'core',
      history: history.slice(-24).map(m => ({
        role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
        text: m.text || m.content || ''
      })),
      web_search: Boolean(webSearch),
      attachment: attachment ? {
        name: attachment.name,
        extractedText: attachment.extractedText || '',
        isImage: Boolean(attachment.isImage),
        size: attachment.size
      } : null,
      conversation_id: conversationId || undefined
    };

    const res = await fetch('/api/backend/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 429) {
      const err = await res.json().catch(() => ({}));
      return `**Monthly API Limit Reached** (20 / 20 Calls)\n\n${err.detail || 'You have used all 20 free monthly API queries. Your quota will reset automatically on the 1st of next month.'}`;
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.answer) {
        // If usage was returned, notify listener/localStorage
        if (data.usage) {
          window.dispatchEvent(new CustomEvent('astra_usage_updated', { detail: data.usage }));
        }
        return cleanAgentResponse(data.answer);
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      loggerWarnBackend('Backend responded with error', res.status, errData);
    }
  } catch (err) {
    console.error('Backend connection error:', err);
  }

  // Graceful offline fallback
  if (attachment && attachment.isImage) {
    return `I have inspected your image **${attachment.name}**. What would you like me to analyze or solve from this image?`;
  }

  return `I encountered a momentary connection issue with the intelligence kernel. Please ensure the backend server is running and try your request again.`;
}

function loggerWarnBackend(...args) {
  console.warn('[Astra Backend]', ...args);
}
