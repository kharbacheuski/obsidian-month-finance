import { setIcon } from "obsidian";

export type StatTone = "" | "pos" | "neg";

export interface StatCardOptions {
    icon: string;
    label: string;
    value: string;
    tone?: StatTone;
    sub?: string;
}

export class StatCard {
    private opts: StatCardOptions;

    constructor(opts: StatCardOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): HTMLElement {
        const card = parent.createDiv({ cls: "finance-card finance-stat" });

        const labelRow = card.createDiv({ cls: "finance-stat-label" });
        setIcon(labelRow.createSpan({ cls: "finance-stat-icon" }), this.opts.icon);
        labelRow.createSpan({ text: this.opts.label });

        card.createDiv({
            cls: `finance-stat-value ${this.opts.tone ?? ""}`.trim(),
            text: this.opts.value,
        });

        if (this.opts.sub) {
            card.createDiv({ cls: "finance-stat-sub", text: this.opts.sub });
        }

        return card;
    }
}
