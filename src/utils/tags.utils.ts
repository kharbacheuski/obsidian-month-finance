const CATEGORY_PALETTE = [
    "#e74c3c", // red
    "#f39c12", // orange
    "#27ae60", // green
    "#2980b9", // blue
    "#8e44ad", // purple
    "#e91e63", // pink
    "#16a085", // teal
    "#d35400", // dark orange
    "#2c3e50", // navy
    "#c0392b", // dark red
];

function hashString(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export function getCategoryColor(category: string): string {
    return CATEGORY_PALETTE[hashString(category.toLowerCase()) % CATEGORY_PALETTE.length];
}
