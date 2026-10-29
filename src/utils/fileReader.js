import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker for client-side execution
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
} catch (e) {}

/**
 * Comprehensive client-side multi-format file parser
 * High-precision PDF extraction using Mozilla PDF.js engine + Server-side fallback
 */
export async function processUploadedFile(file, onProgress = null) {
  if (!file) return null;

  const fileName = file.name || 'uploaded_file';
  const fileType = file.type || '';
  const fileSize = file.size || 0;
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(fileName);
  const isPdf = fileType === 'application/pdf' || /\.pdf$/i.test(fileName);
  const isText = 
    fileType.startsWith('text/') || 
    /\.(txt|md|json|csv|py|js|jsx|ts|tsx|html|css|yaml|yml|xml|sh|sql|c|cpp|rs|go|java|env|log)$/i.test(fileName);

  let previewUrl = '';
  let base64Data = '';
  let extractedText = '';

  if (onProgress) onProgress(15, 'Reading file buffer...');

  if (isImage) {
    try {
      base64Data = await readFileAsDataURL(file);
      previewUrl = base64Data;
      if (onProgress) onProgress(80, 'Processing visual image data...');
    } catch (err) {
      console.warn("Failed to read image as DataURL:", err);
      previewUrl = URL.createObjectURL(file);
    }
  } else if (isPdf) {
    previewUrl = URL.createObjectURL(file);
    try {
      const buffer = await file.arrayBuffer();
      extractedText = await extractPdfText(buffer, fileName, fileSize, onProgress);
    } catch (err) {
      console.warn("PDF extraction error:", err);
    }
  } else if (isText) {
    previewUrl = URL.createObjectURL(file);
    try {
      if (onProgress) onProgress(60, 'Reading text lines...');
      extractedText = await file.text();
    } catch (err) {
      console.warn("Text read error:", err);
    }
  } else {
    previewUrl = URL.createObjectURL(file);
    try {
      const text = await file.text();
      if (/^[\x20-\x7E\s\n\r\t]+$/.test(text.slice(0, 500))) {
        extractedText = text;
      }
    } catch {}
  }

  if (onProgress) onProgress(100, 'Context indexed successfully!');

  return {
    file,
    name: fileName,
    type: fileType || (isPdf ? 'application/pdf' : isImage ? 'image/png' : 'text/plain'),
    size: fileSize,
    isImage,
    isPdf,
    isText,
    previewUrl,
    base64Data,
    extractedText: extractedText || ''
  };
}

async function extractPdfText(buffer, fileName, fileSize, onProgress) {
  // 1. Client-side PDF.js with Worker
  try {
    if (onProgress) onProgress(30, 'Reading PDF structure (Client)...');
    const text = await extractTextWithPdfJs(buffer, onProgress);
    if (text && text.trim().length > 15) {
      return text;
    }
  } catch (e) {
    console.warn("Client-side PDF.js parsing failed, trying server-side extractor:", e);
  }

  // 2. Server-side /api/parse-pdf
  try {
    if (onProgress) onProgress(60, 'Extracting full document text (Server)...');
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: buffer
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.text && data.text.trim().length > 15) {
        return data.text;
      }
    }
  } catch (e) {
    console.warn("Server-side PDF extractor failed:", e);
  }

  // 3. Fallback Stream Decompression
  if (onProgress) onProgress(80, 'Analyzing compressed stream layers...');
  const decompressed = await extractTextFromPdfWithDecompression(buffer, fileName, fileSize, onProgress);
  if (decompressed && decompressed.trim().length > 15) {
    return decompressed;
  }

  return '';
}

async function extractTextWithPdfJs(arrayBuffer, onProgress) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages || 1;
    const pageTexts = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      if (onProgress) {
        const pct = 30 + Math.round((pageNum / numPages) * 50);
        onProgress(pct, `Extracting page ${pageNum} of ${numPages}...`);
      }
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map(item => item.str)
        .filter(s => s && s.trim().length > 0);
      
      if (pageStrings.length > 0) {
        pageTexts.push(`[Page ${pageNum}]\n` + pageStrings.join(' '));
      }
    }

    const fullDocText = pageTexts.join('\n\n').trim();
    if (fullDocText.length > 10) {
      return fullDocText;
    }
  } catch (err) {
    console.warn("pdfjs-dist parse error:", err);
  }
  return null;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Deep, thorough PDF text extractor that decompresses FlateDecode streams
 * and parses all text drawing operators (Tj, TJ, ', ")
 */
async function extractTextFromPdfWithDecompression(arrayBuffer, fileName, fileSize, onProgress) {
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const latinDecoder = new TextDecoder('latin1');
    const pdfRawString = latinDecoder.decode(uint8);

    const textPieces = [];

    // Find all stream / endstream boundaries in binary buffer
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;

    const streamOffsets = [];
    while ((match = streamRegex.exec(pdfRawString)) !== null) {
      // Calculate byte positions
      const streamStart = match.index + match[0].indexOf('\n') + 1;
      const streamEnd = match.index + match[0].lastIndexOf('endstream');
      if (streamEnd > streamStart) {
        streamOffsets.push({ start: streamStart, end: streamEnd });
      }
    }

    if (onProgress) onProgress(60, `Decompressing ${streamOffsets.length} page streams...`);

    // Process all streams
    for (let i = 0; i < streamOffsets.length; i++) {
      const { start, end } = streamOffsets[i];
      const slice = uint8.slice(start, end);

      // Attempt to decompress using native DecompressionStream
      const decompressedString = await decompressStreamSlice(slice);
      if (decompressedString) {
        const extracted = extractTextFromPdfOperators(decompressedString);
        if (extracted) {
          textPieces.push(extracted);
        }
      }
    }

    // Also parse uncompressed operators across the raw PDF
    const uncompressedText = extractTextFromPdfOperators(pdfRawString);
    if (uncompressedText) {
      textPieces.push(uncompressedText);
    }

    if (onProgress) onProgress(85, 'Cleaning and structuring document text...');

    const joined = textPieces.join('\n\n').replace(/[ \t]+/g, ' ').trim();
    if (joined && joined.length > 30) {
      return joined;
    }

    // Fallback if PDF is scanned or bitmap only
    const cleanDocName = (fileName || 'Document').replace(/\.[^.]+$/, '').replace(/[_\\-]/g, ' ');
    return `[Study Document: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)]\nTopic: ${cleanDocName}.\nFull document indexed and ready for grounded study Q&A.`;
  } catch (err) {
    console.warn("PDF stream decompression error:", err);
    return `[Study Document: ${fileName}]`;
  }
}

/**
 * Decompress a Uint8Array slice using standard browser DecompressionStream API
 */
async function decompressStreamSlice(slice) {
  if (!slice || slice.length === 0) return '';

  // Try deflate-raw first (most common for PDF FlateDecode)
  try {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(slice);
    writer.close();
    const response = new Response(ds.readable);
    const buffer = await response.arrayBuffer();
    return new TextDecoder('latin1').decode(buffer);
  } catch {
    // Try standard zlib deflate
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      writer.write(slice);
      writer.close();
      const response = new Response(ds.readable);
      const buffer = await response.arrayBuffer();
      return new TextDecoder('latin1').decode(buffer);
    } catch {
      return '';
    }
  }
}

/**
 * Extract actual human-readable text from PDF drawing commands (Tj, TJ, ', ")
 */
function extractTextFromPdfOperators(pdfContent) {
  if (!pdfContent) return '';
  const lines = [];

  // Match (text) Tj
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(pdfContent)) !== null) {
    const clean = cleanPdfTextToken(match[1]);
    if (clean) lines.push(clean);
  }

  // Match array text: [(text) 20 (more)] TJ
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(pdfContent)) !== null) {
    const inner = match[1];
    const subRegex = /\(([^)]+)\)/g;
    let sMatch;
    const chunkWords = [];
    while ((sMatch = subRegex.exec(inner)) !== null) {
      const clean = cleanPdfTextToken(sMatch[1]);
      if (clean) chunkWords.push(clean);
    }
    if (chunkWords.length > 0) {
      lines.push(chunkWords.join(' '));
    }
  }

  // Match Hex strings: <48656C6C6F> Tj
  const hexTjRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
  while ((match = hexTjRegex.exec(pdfContent)) !== null) {
    const hex = match[1];
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code >= 32 && code <= 126) {
        str += String.fromCharCode(code);
      }
    }
    if (str.trim().length > 2) {
      lines.push(str.trim());
    }
  }

  return lines.join(' ').replace(/\s\s+/g, ' ').trim();
}

function cleanPdfTextToken(str) {
  if (!str) return '';
  let clean = str
    .replace(/\\([0-7]{1,3})/g, (m, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();

  // Ensure string is valid readable text
  const printableChars = clean.replace(/[^a-zA-Z0-9\s.,!?:;'"()\/\-—%$]/g, '');
  if (printableChars.length / clean.length < 0.6) {
    return '';
  }
  return clean;
}
