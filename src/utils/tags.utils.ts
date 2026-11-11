const CATEGORY_PALETTE = [
    "#e74c3c", // red
    "#e67e22", // orange
    "#f1c40f", // yellow
    "#2ecc71", // green
    "#16a085", // teal
    "#3498db", // blue
    "#8e44ad", // purple
    "#e91e63", // pink
    "#795548", // brown
    "#607d8b", // blue gray
    "#ff7043", // deep orange
    "#9ccc65", // lime
    "#00897b", // dark teal
    "#5c6bc0", // indigo
    "#ab47bc", // magenta
    "#d81b60", // rose
    "#f9a825", // amber
    "#8d6e63", // taupe
];

function hashString(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
}

function channelToHex(value: number): string {
    return Math.round(Math.min(Math.max(value, 0), 255)).toString(16).padStart(2, "0");
}

/** Darkens a hex color by mixing it with black; amount is 0..1. */
function darkenColor(hex: string, amount: number): string {
    const factor = 1 - Math.min(Math.max(amount, 0), 0.85);
    const { r, g, b } = hexToRgb(hex);
    return `#${channelToHex(r * factor)}${channelToHex(g * factor)}${channelToHex(b * factor)}`;
}

export function getCategoryColor(category: string): string {
    return CATEGORY_PALETTE[hashString(category.toLowerCase()) % CATEGORY_PALETTE.length];
}

function lookupColor(map: Map<string, string>, category: string): string | undefined {
    const direct = map.get(category);
    if (direct) return direct;

    const normalized = category.trim().toLowerCase();
    for (const [key, value] of map) {
        if (key.trim().toLowerCase() === normalized) return value;
    }
    return undefined;
}

/**
 * Finds a category color, falling back to the closest parent category so that
 * `Food.Groceries` inherits the color of `Food`.
 */
export function resolveCategoryColor(colorMap: Map<string, string> | undefined, category: string): string {
    if (colorMap) {
        let current = category.trim();
        while (current) {
            const color = lookupColor(colorMap, current);
            if (color) return color;

            const dot = current.lastIndexOf(".");
            if (dot <= 0) break;
            current = current.slice(0, dot);
        }
    }
    return getCategoryColor(category);
}

export function getCategoryColors(categories: string[]): Map<string, string> {
    const ordered = [...new Set(categories)].sort((a, b) => a.localeCompare(b));
    const result = new Map<string, string>();
    const usedSlots = new Set<number>();
    let generated = 0;

    for (const category of ordered) {
        if (usedSlots.size >= CATEGORY_PALETTE.length) {
            const base = CATEGORY_PALETTE[generated % CATEGORY_PALETTE.length];
            const round = Math.floor(generated / CATEGORY_PALETTE.length) + 1;
            result.set(category, darkenColor(base, Math.min(round * 0.22, 0.66)));
            generated++;
            continue;
        }

        let slot = hashString(category.toLowerCase()) % CATEGORY_PALETTE.length;
        while (usedSlots.has(slot)) {
            slot = (slot + 1) % CATEGORY_PALETTE.length;
        }
        usedSlots.add(slot);
        result.set(category, CATEGORY_PALETTE[slot]);
    }

    return result;
}

/** Subcategory segments use the parent color, each next one slightly darker. */
export function getCategoryVariants(baseColor: string, count: number): string[] {
    const total = Math.max(count, 1);
    return Array.from({ length: total }, (_, index) =>
        index === 0 ? baseColor : darkenColor(baseColor, Math.min(index * 0.3, 0.55)),
    );
}
