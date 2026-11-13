import { setTooltip } from "obsidian";
import { AccordionCard } from "./AccordionCard";
import { TopExpenseRow } from "../utils/top-expenses.utils";
import { getCategoryColors, resolveCategoryColor } from "../utils/tags.utils";

export interface TopExpensesTableOptions {
    title: string;
    emptyText: string;
    columnExpense: string;
    columnDay: string;
    columnAmount: string;
    operationsLabel: string;
    shownSumLabel: string;
    rows: TopExpenseRow[];
    totalExpense: number;
    formatAmount: (value: number) => string;
    colorMap?: Map<string, string>;
    collapsed: boolean;
    onToggle?: (collapsed: boolean) => void;
}

/**
 * Collapsible "top expenses" card. Rows are already ranked by amount,
 * so the table only handles the presentation and the accordion state.
 */
export class TopExpensesTable {
    private opts: TopExpensesTableOptions;

    constructor(opts: TopExpensesTableOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): HTMLElement {
        const { rows } = this.opts;
        const sum = rows.reduce((acc, row) => acc + row.amount, 0);

        const { card, body } = new AccordionCard({
            title: this.opts.title,
            cls: "finance-card-top-expenses",
            meta: rows.length ? this.opts.formatAmount(sum) : undefined,
            metaTooltip: rows.length ? this.opts.shownSumLabel : undefined,
            collapsed: this.opts.collapsed,
            onToggle: this.opts.onToggle,
        }).render(parent);

        if (!rows.length) {
            body.createDiv({ cls: "finance-muted", text: this.opts.emptyText });
            return card;
        }

        this.renderTable(body, rows);
        return card;
    }

    private renderTable(parent: HTMLElement, rows: TopExpenseRow[]): void {
        const colorMap = this.opts.colorMap ?? getCategoryColors(rows.map((row) => row.category));

        const table = parent.createEl("table", { cls: "finance-top-table" });
        const headRow = table.createEl("thead").createEl("tr");
        headRow.createEl("th", { cls: "finance-top-rank", text: "№" });
        headRow.createEl("th", { text: this.opts.columnExpense });
        headRow.createEl("th", { cls: "finance-top-day", text: this.opts.columnDay });
        headRow.createEl("th", { cls: "finance-top-amount", text: this.opts.columnAmount });

        const tbody = table.createEl("tbody");

        rows.forEach((row, index) => {
            const tr = tbody.createEl("tr");
            tr.createEl("td", { cls: "finance-top-rank", text: String(index + 1) });

            const labelCell = tr.createEl("td", { cls: "finance-top-name-cell" });
            const labelWrap = labelCell.createDiv({ cls: "finance-top-label" });
            labelWrap.createSpan({
                cls: "finance-top-dot",
                attr: { style: `background-color:${resolveCategoryColor(colorMap, row.category)};` },
            });

            const textWrap = labelWrap.createDiv({ cls: "finance-top-text" });
            textWrap.createSpan({ cls: "finance-top-name", text: row.label });
            if (row.category.toLowerCase() !== row.label.toLowerCase()) {
                textWrap.createSpan({ cls: "finance-top-cat", text: row.category });
            }
            setTooltip(
                labelCell,
                `${row.label} · ${row.category}: ${this.opts.formatAmount(row.amount)}`,
                { placement: "top" },
            );

            const dayCell = tr.createEl("td", { cls: "finance-top-day" });
            if (row.count > 1) {
                dayCell.setText(`×${row.count}`);
                setTooltip(dayCell, `${this.opts.operationsLabel}: ${row.count}`, { placement: "top" });
            } else {
                dayCell.setText(row.day > 0 ? String(row.day).padStart(2, "0") : "—");
            }

            const amountCell = tr.createEl("td", { cls: "finance-top-amount" });
            amountCell.createSpan({ cls: "finance-top-sum", text: this.opts.formatAmount(row.amount) });
            if (this.opts.totalExpense > 0) {
                const percent = Math.round((row.amount / this.opts.totalExpense) * 100);
                amountCell.createSpan({ cls: "finance-top-share", text: `${percent}%` });
            }
        });
    }
}
