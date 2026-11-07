import { CategoryStat } from "../types";
import { getCategoryColors, getCategoryVariants } from "../utils/tags.utils";

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
        const colorMap = getCategoryColors(categories.map((cat) => cat.category));

        for (const cat of categories) {
            const percent = Math.round((cat.expense / totalExpense) * 100);
            const color = colorMap.get(cat.category) ?? "";
            const segments = this.getSegments(cat);

            const row = bars.createDiv({ cls: "finance-bar-row" });
            row.createDiv({
                cls: "finance-bar-label",
                text: cat.category,
                attr: { title: this.buildGroupTooltip(cat, segments) },
            });

            const track = row.createDiv({ cls: "finance-bar-track" });
            // The fill takes only the category's share of the whole bar,
            // while the segments split that share between subcategories.
            const fill = track.createDiv({
                cls: "finance-bar-fill",
                attr: { style: `width:${Math.max(percent, 2)}%;` },
            });
            const segmentColors = getCategoryVariants(color, segments.length);

            segments.forEach((segment, index) => {
                const share = cat.expense > 0 ? Math.round((segment.expense / cat.expense) * 100) : 0;
                const tooltip = segments.length > 1
                    ? `${segment.label}: ${this.opts.formatAmount(segment.expense)} (${share}%)`
                    : `${segment.category}: ${this.opts.formatAmount(segment.expense)}`;

                fill.createDiv({
                    cls: "finance-bar-segment",
                    attr: {
                        style: `flex:${Math.max(segment.expense, 0.0001)} 1 0;background-color:${segmentColors[index]};`,
                        "aria-label": tooltip,
                    },
                });
            });

            row.createDiv({ cls: "finance-bar-value", text: `${this.opts.formatAmount(cat.expense)} · ${percent}%` });
        }

        return card;
    }

    private getSegments(cat: CategoryStat): CategoryStat[] {
        if (cat?.subcategories?.length) return cat.subcategories;
        return [{ category: cat.category, label: cat.category, expense: cat.expense }];
    }

    private buildGroupTooltip(cat: CategoryStat, segments: CategoryStat[]): string {
        if (segments.length <= 1) return cat.category;
        return segments
            .map((segment) => `${segment.label}: ${this.opts.formatAmount(segment.expense)}`)
            .join("\n");
    }
}
