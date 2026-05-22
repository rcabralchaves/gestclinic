import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface ParsedProduct {
  nome: string;
  quantidade: string;
  custoUnitario: string;
  unidade: string;
}

const UNIT_PATTERN = "UN|UND|UNID|CX|PC|PCT|ML|G|KG|LT|L|FR|TB|RL|PAR|KIT|TUBETE|TUBETES|TUBO|AMP|SACHE|SACHÊ";

const UNIT_ALIASES: Record<string, string> = {
  un: "un",
  und: "un",
  unid: "un",
  unidade: "un",
  cx: "cx",
  pc: "pc",
  pct: "pct",
  ml: "ml",
  g: "g",
  kg: "kg",
  lt: "lt",
  l: "l",
  fr: "fr",
  tb: "tb",
  rl: "rl",
  par: "par",
  kit: "kit",
  tubete: "tubete",
  tubetes: "tubetes",
  tubo: "tubo",
  amp: "amp",
  sache: "sache",
};

const HEADER_TOKENS = new Set([
  "item",
  "itens",
  "descricao",
  "produto",
  "produtos",
  "material",
  "materiais",
  "qtd",
  "qtde",
  "quantidade",
  "un",
  "und",
  "unid",
  "unidade",
  "vl",
  "vlr",
  "valor",
  "unitario",
  "total",
  "codigo",
  "cod",
  "ncm",
  "cfop",
]);

const PRODUCT_HINTS = [
  "produto",
  "produtos",
  "material",
  "materiais",
  "descricao",
  "item",
  "itens",
  "qtd",
  "qtde",
  "quantidade",
  "valor",
  "unitario",
  "total",
];

const NOISE_TERMS = [
  "chave de acesso",
  "protocolo de autorizacao",
  "danfe",
  "nfe numero",
  "natureza da operacao",
  "emitente",
  "destinatario",
  "endereco",
  "bairro",
  "municipio",
  "inscricao estadual",
  "cnpj",
  "cpf",
  "ie ",
  "cfop",
  "cst",
  "ncm",
  "icms",
  "ipi",
  "pis",
  "cofins",
  "base de calculo",
  "valor dos tributos",
  "frete",
  "desconto",
  "pagamento",
  "cartao",
  "dinheiro",
  "subtotal",
  "valor total",
  "total da nota",
  "total dos produtos",
  "transportador",
  "peso bruto",
  "peso liquido",
  // Address & location
  "cep",
  "telefone",
  "fone",
  "email",
  "estado",
  "cidade",
  "uf ",
  "logradouro",
  "complemento",
  "numero do documento",
  "rua ",
  "avenida ",
  "av ",
  "rodovia",
  // Company & fiscal info
  "razao social",
  "nome fantasia",
  "serie ",
  "folha ",
  "pagina ",
  "data de emissao",
  "data emissao",
  "data da emissao",
  "hora de emissao",
  "numero da nota",
  "nota fiscal",
  "nf-e",
  "modelo ",
  "versao ",
  "ambiente de",
  "autorizacao de uso",
  "recebemos de",
  "informacoes complementares",
  "dados adicionais",
  "observacoes",
  "observacao",
  // Tax & totals
  "aliquota",
  "tributacao",
  "contribuinte",
  "regime tributario",
  "valor aproximado",
  "valor do seguro",
  "outras despesas",
  "valor liquido",
  "total geral",
  "numero de controle",
  "protocolo",
  "consulta de autenticidade",
  "contingencia",
  "lote ",
  "forma de pagamento",
  "troco",
  "parcela",
  "vencimento",
  "duplicata",
  "fatura",
  "dados do emitente",
  "dados do destinatario",
  "calculo do issqn",
];

function normalizeSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizeText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\t/g, "   ")
    .replace(/\|/g, " | ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseBrazilianNumber(value?: string | null): number | null {
  if (!value) return null;

  let cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    cleaned = cleaned.replace(",", ".");
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function toQuantityString(value: number | null): string {
  if (value === null) return "1";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "");
}

function toMoneyString(value: number | null): string {
  if (value === null) return "0.00";
  return value.toFixed(2);
}

function normalizeUnit(value?: string | null): string {
  if (!value) return "un";

  const normalized = normalizeSearchText(value);
  return UNIT_ALIASES[normalized] || normalized || "un";
}

function cleanProductName(value: string): string {
  return value
    .replace(/^\d{1,4}\s+/, "")
    .replace(/\s+\|\s+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\-–—:;,.]+|[\-–—:;,.]+$/g, "")
    .trim();
}

function isHeaderOnlyLine(line: string): boolean {
  const tokens = normalizeSearchText(line)
    .replace(/[|/\\,:;()\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return tokens.length > 0 && tokens.length <= 12 && tokens.every((token) => HEADER_TOKENS.has(token));
}

function isNoiseLine(line: string): boolean {
  const normalized = normalizeSearchText(line);
  return NOISE_TERMS.some((term) => normalized.includes(term));
}

function hasProductHint(line: string): boolean {
  const normalized = normalizeSearchText(line);
  return PRODUCT_HINTS.some((term) => normalized.includes(term));
}

function isLongCode(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}

function looksLikeDate(value: string): boolean {
  return /\d{2}[\/.\-]\d{2}[\/.\-]\d{2,4}/.test(value);
}

function getMoneyMatches(value: string): string[] {
  return [...value.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})/gi)]
    .map((match) => match[1])
    .filter((m) => !isLongCode(m) && !looksLikeDate(m));
}

function extractPdfLines(items: any[]): string[] {
  const positionedItems = items
    .filter((item) => typeof item?.str === "string" && item.str.trim())
    .map((item) => ({
      str: item.str.trim(),
      x: Number(item.transform?.[4]) || 0,
      y: Number(item.transform?.[5]) || 0,
      width: Number(item.width) || 0,
    }))
    .sort((a, b) => {
      if (Math.abs(b.y - a.y) > 2) return b.y - a.y;
      return a.x - b.x;
    });

  const lines: Array<{ y: number; items: typeof positionedItems }> = [];

  for (const item of positionedItems) {
    const currentLine = lines[lines.length - 1];
    if (!currentLine || Math.abs(currentLine.y - item.y) > 3) {
      lines.push({ y: item.y, items: [item] });
      continue;
    }

    currentLine.items.push(item);
  }

  return lines
    .map((line) => {
      const sortedItems = [...line.items].sort((a, b) => a.x - b.x);
      return sortedItems
        .reduce((text, item, index) => {
          if (index === 0) return item.str;

          const previousItem = sortedItems[index - 1];
          const gap = item.x - (previousItem.x + previousItem.width);
          const separator = gap > 12 ? "   " : " ";
          return `${text}${separator}${item.str}`;
        }, "")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
}

function hasUsefulInvoiceText(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  const letterCount = (normalized.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  const numberCount = (normalized.match(/\d/g) || []).length;
  const moneyCount = getMoneyMatches(normalized).length;
  const normalizedSearch = normalizeSearchText(normalized);

  return normalized.length > 100 && letterCount > 25 && numberCount > 6 && (moneyCount > 0 || normalizedSearch.includes("produto"));
}

async function createOcrWorker(
  onProgress?: (pct: number) => void,
  resolveProgress?: (progress: number) => number,
) {
  const { createWorker } = await import("tesseract.js");

  return createWorker("por+eng", 1, {
    logger: (message: any) => {
      if (message.status !== "recognizing text" || !onProgress) return;
      const progress = resolveProgress ? resolveProgress(message.progress) : Math.round(message.progress * 100);
      onProgress(Math.max(1, Math.min(100, progress)));
    },
  });
}

/** Extract text from a PDF file */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const fullText: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageLines = extractPdfLines(content.items as any[]);
    fullText.push(pageLines.join("\n"));
    page.cleanup();
  }

  return normalizeText(fullText.join("\n\n"));
}

/** OCR an image file using Tesseract.js */
export async function ocrImage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const worker = await createOcrWorker(onProgress);

  try {
    const { data } = await worker.recognize(file);
    onProgress?.(100);
    return normalizeText(data.text);
  } finally {
    await worker.terminate();
  }
}

async function ocrPdf(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  let currentPage = 0;

  const worker = await createOcrWorker(onProgress, (progress) =>
    Math.round(((currentPage + progress) / Math.max(pdf.numPages, 1)) * 100),
  );

  try {
    const pagesText: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      currentPage = pageNumber - 1;

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) continue;

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) continue;

      const { data } = await worker.recognize(blob);
      pagesText.push(data.text);
      page.cleanup();
    }

    onProgress?.(100);
    return normalizeText(pagesText.join("\n\n"));
  } finally {
    await worker.terminate();
  }
}

function detectUnit(line: string): string | null {
  const tokens = normalizeSearchText(line).split(/[^a-z0-9]+/).filter(Boolean);
  const foundToken = tokens.find((token) => token in UNIT_ALIASES);
  return foundToken ? normalizeUnit(foundToken) : null;
}

function isReasonableQuantity(value: number): boolean {
  return value > 0 && value <= 99999 && !isLongCode(String(value));
}

function extractQuantityFromLine(line: string): number | null {
  // 1. Explicit keyword match (qtd, quantidade, etc.)
  const quantityKeywordMatch = line.match(/(?:qtd|qtde|quantidade|quant)\s*[:=-]?\s*(\d+[.,]?\d*)/i);
  if (quantityKeywordMatch) {
    const val = parseBrazilianNumber(quantityKeywordMatch[1]);
    if (val !== null && isReasonableQuantity(val)) return val;
  }

  const normalized = normalizeSearchText(line);
  const normalizedUnitPattern = Object.keys(UNIT_ALIASES).join("|");

  // 2. Number adjacent to a unit keyword (e.g. "UN 10" or "10 UN")
  const unitAfterMatch = normalized.match(new RegExp(`\\b(?:${normalizedUnitPattern})\\b\\s*(\\d+[.,]?\\d*)`, "i"));
  if (unitAfterMatch) {
    const val = parseBrazilianNumber(unitAfterMatch[1]);
    if (val !== null && isReasonableQuantity(val)) return val;
  }

  const unitBeforeMatch = normalized.match(new RegExp(`(\\d+[.,]?\\d*)\\s*\\b(?:${normalizedUnitPattern})\\b`, "i"));
  if (unitBeforeMatch) {
    const val = parseBrazilianNumber(unitBeforeMatch[1]);
    if (val !== null && isReasonableQuantity(val)) return val;
  }

  // 3. Heuristic: find non-monetary numbers that appear before the first money value
  const moneyMatches = [...line.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})/gi)];
  const firstMoneyIndex = moneyMatches[0]?.index ?? Number.MAX_SAFE_INTEGER;

  const numberMatches = [...line.matchAll(/\b(\d{1,5})\b/g)]
    .filter((match) => {
      const idx = match.index ?? 0;
      if (idx >= firstMoneyIndex) return false;
      const val = Number(match[1]);
      // Skip line-item index (first number if it's 1-4 digits at start of line)
      // Skip dates and long codes
      if (looksLikeDate(line.slice(Math.max(0, idx - 3), idx + 12))) return false;
      if (val === 0) return false;
      return isReasonableQuantity(val);
    });

  // Skip the first number if it looks like a line-item index (e.g. "1 RESINA...")
  if (/^\d{1,4}\s+[A-Za-zÀ-ÿ]/.test(line) && numberMatches.length > 1) {
    numberMatches.shift();
  }

  const quantityCandidate = numberMatches[numberMatches.length - 1];
  if (!quantityCandidate) return null;

  const val = Number(quantityCandidate[1]);
  return isReasonableQuantity(val) ? val : null;
}

function extractMoneySummary(line: string): { unitPrice: number | null; total: number | null } {
  const moneyValues = getMoneyMatches(line)
    .map((value) => parseBrazilianNumber(value))
    .filter((value): value is number => value !== null && value > 0 && value < 1_000_000);

  if (moneyValues.length === 0) return { unitPrice: null, total: null };

  if (moneyValues.length === 1) {
    return { unitPrice: moneyValues[0], total: moneyValues[0] };
  }

  // With 2+ values: smaller is unit price, largest is total
  const sorted = [...moneyValues].sort((a, b) => a - b);
  const unitPrice = sorted[0];
  const total = sorted[sorted.length - 1];

  return { unitPrice, total };
}

function looksLikeAddress(text: string): boolean {
  const normalized = normalizeSearchText(text);
  const addressPatterns = [
    /\bcep\b/,
    /\bn[°º]?\s*\d/,
    /\brua\b/,
    /\bavenida\b/,
    /\bav\b\./,
    /\bbairro\b/,
    /\bcidade\b/,
    /\bestado\b/,
    /\bfone\b/,
    /\btelefone\b/,
    /\bcnpj\b/,
    /\bcpf\b/,
    /\binscricao\b/,
    /\bserie\b.*\d/,
    /\bdata\s*(de\s*)?emissao/,
    /\d{2}[/.]\d{2}[/.]\d{2,4}/,  // dates
    /\d{2,5}[-.]?\d{3}[-.]?\d{3}[/.]?\d{4}[-.]?\d{2}/,  // CNPJ pattern
    /\d{3}[.]?\d{3}[.]?\d{3}[-.]?\d{2}/,  // CPF pattern
  ];
  return addressPatterns.some((pattern) => pattern.test(normalized));
}

function isProductNameTooLong(name: string): boolean {
  return name.length > 150;
}

function buildProduct(name: string, quantity: number | null, unitPrice: number | null, unit = "un"): ParsedProduct | null {
  const cleanedName = cleanProductName(name);

  if (!cleanedName || cleanedName.length < 3) return null;
  if (!/[A-Za-zÀ-ÿ]{3,}/.test(cleanedName)) return null;
  if (isHeaderOnlyLine(cleanedName) || isNoiseLine(cleanedName)) return null;
  if (looksLikeAddress(cleanedName)) return null;
  if (isProductNameTooLong(cleanedName)) return null;

  return {
    nome: cleanedName,
    quantidade: toQuantityString(quantity),
    custoUnitario: toMoneyString(unitPrice),
    unidade: normalizeUnit(unit),
  };
}

function tryParseStructuredLine(line: string): ParsedProduct | null {
  const compactLine = line.replace(/\s+/g, " ").trim();

  let match = compactLine.match(
    new RegExp(`^(?:\\d{1,4}\\s+)?(.{3,120}?)\\s+(${UNIT_PATTERN})\\s+(\\d+[.,]?\\d*)\\s+(\\d+[.,]\\d{2})(?:\\s+(\\d+[.,]\\d{2}))?$`, "i"),
  );
  if (match) {
    const qty = parseBrazilianNumber(match[3]);
    const val1 = parseBrazilianNumber(match[4]);
    const val2 = match[5] ? parseBrazilianNumber(match[5]) : null;
    // If two money values: first is unit price, second is total
    const unitPrice = val2 !== null ? val1 : (qty && qty > 0 && val1 ? val1 / qty : val1);
    return buildProduct(match[1], qty, unitPrice, match[2]);
  }

  match = compactLine.match(
    new RegExp(`^(?:\\d{1,4}\\s+)?(.{3,120}?)\\s+(\\d+[.,]?\\d*)\\s+(${UNIT_PATTERN})\\s+(\\d+[.,]\\d{2})(?:\\s+(\\d+[.,]\\d{2}))?$`, "i"),
  );
  if (match) {
    return buildProduct(match[1], parseBrazilianNumber(match[2]), parseBrazilianNumber(match[4]), match[3]);
  }

  match = compactLine.match(
    new RegExp(`^(.+?)\\s*\\|\\s*(${UNIT_PATTERN})?\\s*\\|\\s*(\\d+[.,]?\\d*)\\s*\\|\\s*(?:R\\$\\s*)?(\\d+[.,]\\d{2})`, "i"),
  );
  if (match) {
    return buildProduct(match[1], parseBrazilianNumber(match[3]), parseBrazilianNumber(match[4]), match[2] || "un");
  }

  match = compactLine.match(
    /(.+?)\s+(?:qtd|qtde|quantidade|quant)\s*[:=-]?\s*(\d+[.,]?\d*).{0,40}?(?:valor\s*unit(?:[áa]rio)?|vl\.?\s*unit|v\.?\s*unit|unit[áa]rio|valor)\s*[:=-]?\s*(?:R\$\s*)?(\d+[.,]\d{2})/i,
  );
  if (match) {
    return buildProduct(match[1], parseBrazilianNumber(match[2]), parseBrazilianNumber(match[3]), detectUnit(compactLine) || "un");
  }

  return null;
}

function createPartialProductFromLine(line: string): ParsedProduct | null {
  if (isHeaderOnlyLine(line) || isNoiseLine(line)) return null;
  if (looksLikeAddress(line)) return null;

  const quantity = extractQuantityFromLine(line);
  const { unitPrice: extractedUnitPrice, total } = extractMoneySummary(line);
  const detectedUnit = detectUnit(line);

  // Require at least a money value — lines with only a bare number are not products
  const hasMoney = extractedUnitPrice !== null || total !== null;
  if (!hasMoney) return null;

  const normalizedLine = normalizeSearchText(line);
  let unitPrice = extractedUnitPrice;

  // If we have both unitPrice and total and a quantity, derive the real unit price
  if (unitPrice !== null && total !== null && quantity && quantity > 0) {
    // If unit and total differ, total/qty gives unit price
    if (Math.abs(unitPrice - total) > 0.01) {
      unitPrice = total / quantity;
    }
    // If they're the same (only one money value found), check context
    const lineMentionsTotal = normalizedLine.includes("total");
    const lineMentionsUnitPrice = normalizedLine.includes("unitario") || normalizedLine.includes("vl unit") || normalizedLine.includes("valor unit");

    if (lineMentionsTotal && !lineMentionsUnitPrice) {
      unitPrice = total / quantity;
    }
  } else if (unitPrice === null && total !== null && quantity && quantity > 0) {
    unitPrice = total / quantity;
  }

  const cleanedName = cleanProductName(
    line
      .replace(/(?:qtd|qtde|quantidade|quant)\s*[:=-]?\s*\d+[.,]?\d*/gi, "")
      .replace(/(?:valor\s*unit(?:[áa]rio)?|vl\.?\s*unit|v\.?\s*unit|unit[áa]rio|valor\s*total|total)\s*[:=-]?\s*(?:R\$\s*)?\d+[.,]\d{2}/gi, "")
      .replace(/(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|(?:R\$\s*)?\d+[.,]\d{2}/gi, "")
      .replace(/\b\d+(?:[.,]\d+)?\b/g, " "),
  );

  return buildProduct(cleanedName, quantity ?? 1, unitPrice ?? 0, detectedUnit || "un");
}

function scoreLine(line: string): number {
  if (isNoiseLine(line)) return -5;
  if (looksLikeAddress(line)) return -5;

  let score = 0;

  if (/[A-Za-zÀ-ÿ]{3,}/.test(line)) score += 1;
  if (getMoneyMatches(line).length > 0) score += 2;
  if (extractQuantityFromLine(line) !== null) score += 1;
  if (detectUnit(line)) score += 1;
  if (hasProductHint(line)) score += 1;
  if (isHeaderOnlyLine(line)) score += 1;

  return score;
}

function extractRelevantLines(text: string): string[] {
  const normalizedLines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const uniqueLines = normalizedLines.filter((line, index, lines) => lines.indexOf(line) === index);
  const relevantLines = uniqueLines.filter((line) => scoreLine(line) >= 2 || isHeaderOnlyLine(line));

  if (relevantLines.length > 0) return relevantLines;

  return uniqueLines.filter((line) => !isNoiseLine(line) && !looksLikeAddress(line) && /[A-Za-zÀ-ÿ]{3,}/.test(line) && getMoneyMatches(line).length > 0).slice(0, 12);
}

function dedupeProducts(products: ParsedProduct[]): ParsedProduct[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = [
      normalizeSearchText(product.nome).replace(/\s+/g, " "),
      product.quantidade,
      product.custoUnitario,
      product.unidade,
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parse Brazilian NF-e / invoice text to extract products.
 * Looks for common patterns in nota fiscal line items.
 */
export function parseInvoiceText(text: string): ParsedProduct[] {
  const products: ParsedProduct[] = [];
  const relevantLines = extractRelevantLines(text);

  for (const line of relevantLines) {
    if (isHeaderOnlyLine(line) || isNoiseLine(line)) continue;

    const parsedProduct = tryParseStructuredLine(line) || createPartialProductFromLine(line);
    if (parsedProduct) {
      products.push(parsedProduct);
    }
  }

  return dedupeProducts(products).slice(0, 50);
}

/** Full pipeline: extract text then parse products */
export async function processInvoiceFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ products: ParsedProduct[]; rawText: string }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  let text = "";
  let products: ParsedProduct[] = [];

  if (isPdf) {
    let nativeText = "";

    try {
      nativeText = await extractTextFromPdf(file);
    } catch {
      nativeText = "";
    }

    text = nativeText;
    products = parseInvoiceText(nativeText);

    if (!hasUsefulInvoiceText(nativeText) || products.length === 0) {
      try {
        const ocrText = await ocrPdf(file, onProgress);
        text = normalizeText([nativeText, ocrText].filter(Boolean).join("\n\n"));
        products = parseInvoiceText(text);
      } catch {
        text = normalizeText(nativeText);
      }
    }
  } else if (isImage) {
    try {
      text = await ocrImage(file, onProgress);
      products = parseInvoiceText(text);
    } catch {
      text = "";
      products = [];
    }
  } else {
    throw new Error("Formato não suportado. Envie PDF ou imagem (JPG/PNG).");
  }

  const normalizedText = normalizeText(text);
  return { products: products.length > 0 ? products : parseInvoiceText(normalizedText), rawText: normalizedText };
}
