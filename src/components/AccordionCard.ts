import { setIcon, setTooltip } from "obsidian";

export interface AccordionCardOptions {
    title: string;
    /** Extra classes for the card, e.g. `finance-card-budget`. */
    cls?: string;
    /** Right-aligned text in the header, e.g. a sum or a percentage. */
    meta?: string;
    metaTooltip?: string;
    /** Extra class for the meta text, e.g. `over` for an exceeded budget. */
    metaCls?: string;
    collapsed: boolean;
    onToggle?: (collapsed: boolean) => void;
}

export interface AccordionCardParts {
    card: HTMLElement;
    body: HTMLElement;
}

/**
 * Shared collapsible card used by the dashboard sections, so every accordion
 * looks and behaves the same. Content is rendered into the returned `body`.
 */
export class AccordionCard {
    private opts: AccordionCardOptions;

    constructor(opts: AccordionCardOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): AccordionCardParts {
        const card = parent.createDiv({
            cls: `finance-card finance-accordion-card ${this.opts.cls ?? ""}`.trim(),
        });
        if (this.opts.collapsed) card.addClass("is-collapsed");

        const header = card.createEl("button", {
            cls: "finance-accordion-header",
            attr: { type: "button", "aria-expanded": String(!this.opts.collapsed) },
        });

        const chevron = header.createSpan({ cls: "finance-accordion-chevron" });
        setIcon(chevron, "chevron-down");
        header.createSpan({ cls: "finance-accordion-title", text: this.opts.title });

        if (this.opts.meta) {
            const meta = header.createSpan({
                cls: `finance-accordion-meta ${this.opts.metaCls ?? ""}`.trim(),
                text: this.opts.meta,
            });
            if (this.opts.metaTooltip) setTooltip(meta, this.opts.metaTooltip, { placement: "bottom" });
        }

        header.addEventListener("click", () => {
            const collapsed = card.classList.toggle("is-collapsed");
            header.setAttribute("aria-expanded", String(!collapsed));
            this.opts.onToggle?.(collapsed);
        });

        const body = card.createDiv({ cls: "finance-accordion-body" });
        return { card, body };
    }
}
