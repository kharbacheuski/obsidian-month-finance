import { CategoryStat, FinanceStats, Transaction } from "./types";

const DEFAULT_SAVINGS = ["сбережен", "накоплен", "savings", "сэйвинг", "сейвинг", "вклад", "инвест", "копилка"];

export type SavingsMatcher = (category: string) => boolean;

export interface ComputeStatsOptions {
    savingsCategories?: string[];
    excludeSavingsFromAverage?: boolean;
    daysInMonth?: number;
}

/**
 * Builds a reusable savings check. Keywords are normalized once instead of on
 * every transaction, which matters for long tables.
 */
export function createSavingsMatcher(custom?: string[]): SavingsMatcher {
    const keywords = [...DEFAULT_SAVINGS, ...(custom ?? [])]
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean);

    return (category) => {
        const normalized = category.trim().toLowerCase();
        return keywords.some((keyword) => normalized.includes(keyword));
    };
}

function splitCategory(category: string): { parent: string; label: string } {
    const trimmed = category.trim().replace(/^\.+/, "").replace(/\.+$/, "").trim();
    if (!trimmed) {
        const fallback = category.trim();
        return { parent: fallback, label: fallback };
    }

    const dot = trimmed.indexOf(".");
    if (dot <= 0) return { parent: trimmed, label: trimmed };

    const parent = trimmed.slice(0, dot).trim();
    const label = trimmed.slice(dot + 1).trim();
    if (!parent || !label) return { parent: trimmed, label: trimmed };

    return { parent, label };
}

interface CategoryGroup {
    category: string;
    expense: number;
    subcategories: Map<string, CategoryStat>;
}

function addToGroups(groups: Map<string, CategoryGroup>, category: string, amount: number): void {
    const { parent, label } = splitCategory(category);

    let group = groups.get(parent);
    if (!group) {
        group = { category: parent, expense: 0, subcategories: new Map() };
        groups.set(parent, group);
    }
    group.expense += amount;

    let sub = group.subcategories.get(label);
    if (!sub) {
        sub = { category, label, expense: 0 };
        group.subcategories.set(label, sub);
    }
    sub.expense += amount;
}

function toCategoryStats(groups: Map<string, CategoryGroup>): CategoryStat[] {
    return [...groups.values()]
        .map((group) => ({
            category: group.category,
            label: group.category,
            expense: group.expense,
            subcategories: [...group.subcategories.values()].sort((a, b) => b.expense - a.expense),
        }))
        .sort((a, b) => b.expense - a.expense);
}

function isValidDay(day: number): boolean {
    return day >= 1 && day <= 31;
}

export function computeStats(transactions: Transaction[], options?: ComputeStatsOptions): FinanceStats {
    let totalIncome = 0;
    let totalExpense = 0;
    let savings = 0;
    let expenseExclSavings = 0;
    let daysElapsed = 0;
    const catMap = new Map<string, CategoryGroup>();
    const savingsMap = new Map<string, CategoryGroup>();
    const spendDaysExclSavings = new Set<number>();
    const spendDaysAll = new Set<number>();
    const isSavings = createSavingsMatcher(options?.savingsCategories);

    for (const t of transactions) {
        if (isValidDay(t.day)) {
            daysElapsed = Math.max(daysElapsed, t.day);
        }

        if (t.amount > 0) {
            totalIncome += t.amount;
            if (isSavings(t.category)) {
                // Income in a savings category means money was taken back out of savings.
                savings -= t.amount;
                addToGroups(savingsMap, t.category, -t.amount);
            }
            continue;
        }

        const amt = -t.amount;
        totalExpense += amt;
        if (isValidDay(t.day)) spendDaysAll.add(t.day);

        if (isSavings(t.category)) {
            savings += amt;
            addToGroups(savingsMap, t.category, amt);
            continue;
        }

        expenseExclSavings += amt;
        if (isValidDay(t.day)) spendDaysExclSavings.add(t.day);

        addToGroups(catMap, t.category, amt);
    }

    const categories = toCategoryStats(catMap);
    const savingsCategories = toCategoryStats(savingsMap);

    const count = transactions.length;
    const days = daysElapsed || (options?.daysInMonth ?? 30);
    const excludeSavings = options?.excludeSavingsFromAverage ?? true;
    const avgBase = excludeSavings ? expenseExclSavings : totalExpense;
    const spendDays = excludeSavings ? spendDaysExclSavings : spendDaysAll;
    const avgDailyExpense = avgBase / days;
    const nonZeroAvgDailyExpense = spendDays.size ? avgBase / spendDays.size : 0;

    return {
        totalIncome,
        totalExpense,
        expenseExclSavings,
        savings,
        avgDailyExpense,
        nonZeroAvgDailyExpense,
        count,
        daysElapsed: daysElapsed || 0,
        spendDaysCount: spendDays.size,
        categories,
        savingsCategories,
    };
}
