import { Transaction, TransactionType } from "./types";

type ColumnKey = "type" | "category" | "name" | "amount" | "day";

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
    type: ["тип", "type", "движение", "приход/расход"],
    category: ["категория", "category", "кат", "статья"],
    name: ["название", "name", "название траты", "описание", "трата", "детали"],
    amount: ["сумма", "amount", "sum", "цена", "стоимость"],
    day: ["день", "day", "день месяца", "число", "дата"],
};

function normalizeHeader(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}/]/gu, "");
}

function matchHeader(header: string): ColumnKey | null {
    const norm = normalizeHeader(header);
    for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [ColumnKey, string[]][]) {
        for (const alias of aliases) {
            if (norm.includes(normalizeHeader(alias))) return key;
        }
    }
    return null;
}

function splitRow(row: string): string[] {
    const trimmed = row.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
    return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(row: string): boolean {
    return splitRow(row).every((cell) => /^:?-+:?$/.test(cell));
}

function parseType(text: string): TransactionType | null {
    const t = text.trim().toLowerCase();
    if (["доход", "приход", "income", "in", "+", "плюс"].includes(t)) return "income";
    if (["расход", "уход", "expense", "out", "-", "минус", "трата"].includes(t)) return "expense";
    return null;
}

function parseAmount(text: string): number {
    let cleaned = text.replace(/\s/g, "").replace(/[^\d.,\-+]/g, "");
    if (!cleaned) return 0;

    if (cleaned.includes(",") && cleaned.includes(".")) {
        // 1.200,50 -> 1200.50
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (cleaned.includes(",")) {
        cleaned = cleaned.replace(",", ".");
    }

    return parseFloat(cleaned) || 0;
}

function parseDay(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

function tryParseTable(rows: string[]): Transaction[] | null {
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        if (!isSeparatorRow(rows[i])) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) return null;

    const headerCells = splitRow(rows[headerIdx]);
    const columns = new Map<ColumnKey, number>();
    headerCells.forEach((cell, idx) => {
        const key = matchHeader(cell);
        if (key && !columns.has(key)) columns.set(key, idx);
    });

    if (!columns.has("amount")) return null;
    if (!columns.has("type") && !columns.has("category") && !columns.has("name")) return null;

    const transactions: Transaction[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
        if (isSeparatorRow(rows[i])) continue;
        const cells = splitRow(rows[i]);
        if (cells.length < 2) continue;

        const get = (key: ColumnKey): string => {
            const idx = columns.get(key);
            return idx === undefined ? "" : (cells[idx] ?? "").trim();
        };

        let type = parseType(get("type"));
        let amount = parseAmount(get("amount"));
        if (amount === 0 && !type) continue;

        if (type === "income" && amount < 0) amount = Math.abs(amount);
        if (type === "expense" && amount > 0) amount = -Math.abs(amount);
        if (!type) type = amount >= 0 ? "income" : "expense";

        const category = get("category") || "Без категории";
        const day = parseDay(get("day"));

        transactions.push({ day, type, category, amount });
    }

    return transactions;
}

export function parseTransactions(content: string): Transaction[] {
    const lines = content.split(/\r?\n/);
    const tables: string[][] = [];
    let current: string[] | null = null;

    for (const line of lines) {
        const trimmed = line.trim();
        const isRow = trimmed.startsWith("|") && (trimmed.match(/\|/g)?.length ?? 0) >= 2;

        if (isRow) {
            if (!current) current = [];
            current.push(trimmed);
        } else if (current) {
            tables.push(current);
            current = null;
        }
    }
    if (current) tables.push(current);

    for (const table of tables) {
        const parsed = tryParseTable(table);
        if (parsed) return parsed;
    }

    return [];
}
