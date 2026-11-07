import { CategoryStat, FinanceStats, Transaction } from "./types";

const DEFAULT_SAVINGS = ["сбережен", "накоплен", "savings", "сэйвинг", "сейвинг", "вклад", "инвест", "копилка"];

export interface ComputeStatsOptions {
    savingsCategories?: string[];
}

export function isSavingsCategory(category: string, custom?: string[]): boolean {
    const c = category.trim().toLowerCase();
    const list = [...(custom ?? []), ...DEFAULT_SAVINGS].map((k) => k.trim().toLowerCase()).filter(Boolean);
    return list.some((k) => c.includes(k));
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
    const spendDays = new Set<number>();

    for (const t of transactions) {
        if (isValidDay(t.day)) {
            daysElapsed = Math.max(daysElapsed, t.day);
        }

        if (t.amount > 0) {
            totalIncome += t.amount;
            continue;
        }

        const amt = -t.amount;
        totalExpense += amt;

        if (isSavingsCategory(t.category, options?.savingsCategories)) {
            savings += amt;
            continue;
        }

        expenseExclSavings += amt;
        if (isValidDay(t.day)) spendDays.add(t.day);

        const { parent, label } = splitCategory(t.category);
        let group = catMap.get(parent);
        if (!group) {
            group = { category: parent, expense: 0, subcategories: new Map() };
            catMap.set(parent, group);
        }
        group.expense += amt;

        let sub = group.subcategories.get(label);
        if (!sub) {
            sub = { category: t.category, label, expense: 0 };
            group.subcategories.set(label, sub);
        }
        sub.expense += amt;
    }

    const categories: CategoryStat[] = [...catMap.values()]
        .map((group) => ({
            category: group.category,
            label: group.category,
            expense: group.expense,
            subcategories: [...group.subcategories.values()].sort((a, b) => b.expense - a.expense),
        }))
        .sort((a, b) => b.expense - a.expense);

    const count = transactions.length;
    const days = daysElapsed || 30;
    const avgDailyExpense = expenseExclSavings / days;
    const nonZeroAvgDailyExpense = spendDays.size ? expenseExclSavings / spendDays.size : 0;

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
    };
}
