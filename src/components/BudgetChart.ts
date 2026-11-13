import { setTooltip } from "obsidian";
import { AccordionCard } from "./AccordionCard";
import { BudgetRow, formatBudgetPercent } from "../utils/budget.utils";
import { getCategoryColors, resolveCategoryColor } from "../utils/tags.utils";

export interface BudgetChartOptions {
    title: string;
    emptyText: string;
    totalLabel: string;
    remainingLabel: string;
    overLabel: string;
    doneLabel: string;
    rows: BudgetRow[];
    formatAmount: (value: number) => string;
    colorMap?: Map<string, string>;
    collapsed: boolean;
    onToggle?: (collapsed: boolean) => void;
}

interface BudgetTotals {
    spent: number;
    budget: number;
    percent: number;
    over: boolean;
}

export class BudgetChart {
    private opts: BudgetChartOptions;

    constructor(opts: BudgetChartOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): HTMLElement {
        const rows = this.opts.rows;
        const totals = this.getTotals(rows);

        const { card, body } = new AccordionCard({
            title: this.opts.title,
            cls: "finance-card-budget",
            meta: rows.length ? `${totals.percent}%` : undefined,
            metaCls: totals.over ? "over" : "",
            metaTooltip: rows.length
                ? `${this.opts.totalLabel}: ${this.opts.formatAmount(totals.spent)} / ${this.opts.formatAmount(totals.budget)}`
                : undefined,
            collapsed: this.opts.collapsed,
            onToggle: this.opts.onToggle,
        }).render(parent);

        if (!rows.length) {
            body.createDiv({ cls: "finance-muted", text: this.opts.emptyText });
            return card;
        }

        this.renderSummary(body, totals);

        const chart = body.createDiv({ cls: "finance-budget-chart" });
        const colorMap = this.opts.colorMap ?? getCategoryColors(rows.map((row) => row.category));

        for (const row of rows) {
            // Exceeding a savings goal is a success, not an overrun.
            const reached = row.isSavings && row.ratio >= 1;
            const over = !row.isSavings && row.ratio > 1;
            const percent = formatBudgetPercent(row.ratio);
            const color = resolveCategoryColor(colorMap, row.category);

            const stateClass = over ? " over" : reached ? " done" : "";
            const col = chart.createDiv({ cls: "finance-budget-col" });
            const pctEl = col.createDiv({ cls: `finance-budget-pct${stateClass}`, text: percent });
            if (over) {
                pctEl.createSpan({
                    cls: "finance-budget-over",
                    text: `(−${this.opts.formatAmount(row.spent - row.budget)})`,
                });
            }

            const plot = col.createDiv({ cls: "finance-budget-plot" });
            const track = plot.createDiv({ cls: "finance-budget-track" });
            track.createDiv({
                cls: "finance-budget-spent",
                attr: { style: `height:${Math.max(Math.min(row.ratio, 1), 0) * 100}%;background-color:${color};` },
            });

            col.createDiv({ cls: "finance-budget-name", text: row.category });
            col.createDiv({ cls: "finance-budget-limit", text: this.opts.formatAmount(row.budget) });

            setTooltip(col, this.buildTooltip(row, percent), { placement: "top" });
        }

        return card;
    }

    private buildTooltip(row: BudgetRow, percent: string): string {
        const diff = row.budget - row.spent;
        let diffText: string;

        if (row.isSavings) {
            diffText = diff > 0
                ? `${this.opts.remainingLabel}: ${this.opts.formatAmount(diff)}`
                : this.opts.doneLabel;
        } else {
            diffText = diff >= 0
                ? `${this.opts.remainingLabel}: ${this.opts.formatAmount(diff)}`
                : `${this.opts.overLabel}: ${this.opts.formatAmount(-diff)}`;
        }

        return [
            `${row.category}: ${this.opts.formatAmount(row.spent)} / ${this.opts.formatAmount(row.budget)}`,
            percent,
            diffText,
        ].join(" · ");
    }

    private getTotals(rows: BudgetRow[]): BudgetTotals {
        const spent = rows.reduce((sum, row) => sum + row.spent, 0);
        const budget = rows.reduce((sum, row) => sum + row.budget, 0);
        const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;

        // Savings goals are not spending limits, so only spending rows drive the warning state.
        const spendRows = rows.filter((row) => !row.isSavings);
        const spendTotal = spendRows.reduce((sum, row) => sum + row.spent, 0);
        const spendBudget = spendRows.reduce((sum, row) => sum + row.budget, 0);
        const over = spendBudget > 0 && spendTotal > spendBudget;

        return { spent, budget, percent, over };
    }

    private renderSummary(parent: HTMLElement, totals: BudgetTotals): void {
        const { spent, budget, percent, over } = totals;

        const summary = parent.createDiv({ cls: "finance-budget-summary" });
        summary.createDiv({
            cls: `finance-budget-summary-text${over ? " over" : ""}`,
            text: `${this.opts.totalLabel}: ${this.opts.formatAmount(spent)} / ${this.opts.formatAmount(budget)} · ${percent}%`,
        });

        const track = summary.createDiv({ cls: "finance-budget-summary-track" });
        track.createDiv({
            cls: "finance-budget-summary-fill",
            attr: { style: `width:${Math.min(percent, 100)}%;` },
        });
    }
}
