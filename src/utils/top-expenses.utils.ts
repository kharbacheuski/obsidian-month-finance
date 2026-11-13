import { Transaction } from "../types";

export interface TopExpenseRow {
    /** Description from the table, or the category when the row has no name. */
    label: string;
    /** Full category path, e.g. `Food.Groceries`. */
    category: string;
    /** Sum of all matching operations. */
    amount: number;
    /** How many operations were merged into the row. */
    count: number;
    /** Day of the biggest operation, 0 when unknown. */
    day: number;
}

interface Accumulator {
    label: string;
    category: string;
    amount: number;
    count: number;
    largestAmount: number;
    day: number;
}

function groupKey(label: string, category: string): string {
    return `${label.trim().toLowerCase()}\u0000${category.trim().toLowerCase()}`;
}

/**
 * Collects the heaviest expenses of the month.
 *
 * Operations with the same name and category are merged, so buying groceries
 * three times shows up as one line with the total amount. Savings transfers are
 * skipped: they are not spending. Rows without a name fall back to the category.
 */
export function getTopExpenses(
    transactions: Transaction[],
    limit: number,
    isSavings: (category: string) => boolean,
): TopExpenseRow[] {
    if (!(limit > 0)) return [];

    const groups = new Map<string, Accumulator>();

    for (const transaction of transactions) {
        if (transaction.amount >= 0) continue;
        if (isSavings(transaction.category)) continue;

        const amount = -transaction.amount;
        const category = transaction.category.trim() || "—";
        const label = transaction.name?.trim() || category;
        const key = groupKey(label, category);

        const group = groups.get(key);
        if (!group) {
            groups.set(key, {
                label,
                category,
                amount,
                count: 1,
                largestAmount: amount,
                day: transaction.day,
            });
            continue;
        }

        group.amount += amount;
        group.count += 1;
        if (amount > group.largestAmount) {
            group.largestAmount = amount;
            group.day = transaction.day;
        }
    }

    return [...groups.values()]
        .map((group) => ({
            label: group.label,
            category: group.category,
            amount: group.amount,
            count: group.count,
            day: group.day,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);
}
