import { CategoryStat } from "../types";
import { getCategoryColor } from "../utils/tags.utils";

export interface CategoryChartOptions {
    title: string;
    emptyText: string;
    categories: CategoryStat[];
    totalExpense: number;
    formatAmount: (value: number) => string;
}

export class CategoryChart {
    private opts: CategoryChartOptions;

    constructor(opts: CategoryChartOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): HTMLElement {
        const card = parent.createDiv({ cls: "finance-card finance-card-categories" });
        card.createDiv({ cls: "finance-card-title", text: this.opts.title });

        const { categories, totalExpense } = this.opts;

        if (!categories.length || totalExpense <= 0) {
            card.createDiv({ cls: "finance-muted", text: this.opts.emptyText });
            return card;
        }

        const bars = card.createDiv({ cls: "finance-bars" });

        for (const cat of categories) {
            const percent = Math.round((cat.expense / totalExpense) * 100);
            const color = getCategoryColor(cat.category);

            const row = bars.createDiv({ cls: "finance-bar-row" });
            row.createDiv({ cls: "finance-bar-label", text: cat.category, attr: { title: cat.category } });

            const track = row.createDiv({ cls: "finance-bar-track" });
            track.createDiv({
                cls: "finance-bar-fill",
                attr: { style: `width:${Math.max(percent, 2)}%;background-color:${color};` },
            });

            row.createDiv({ cls: "finance-bar-value", text: `${this.opts.formatAmount(cat.expense)} · ${percent}%` });
        }

        return card;
    }
}
