// Mesh IDs from custom-interior, checked against the Gold Package gallery.
// Ribbed inserts are black; the surrounding shells and door skins are cognac.
const blackInserts = new Set([
  "012", "015", "032", "040", "041", "044", "049", "050", "052", "108", "109", "112",
]);
const cognacShells = new Set(["014", "016", "017", "026", "033", "042", "043", "051", "053", "064", "072", "074", "110", "111"]);

export function goldCustomRole(name: string): "cabinLeather" | "cabinAccent" | "cabinTrim" | undefined {
  const plane = name.match(/^\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c\.?(\d+)$/)?.[1];
  if (plane && blackInserts.has(plane)) return "cabinLeather";
  if (plane && cognacShells.has(plane)) return "cabinAccent";
  if (plane === "021" || plane === "078") return "cabinTrim";
  if (/^\u041a\u0443\u0431\.?03[24]$/.test(name)) return "cabinTrim";
  if (/^\u041a\u0443\u0431\.?03[56]$/.test(name)) return "cabinAccent";
  if (/^\u0422\u0435\u0441\u0442\.?00[15]$/.test(name)) return "cabinLeather";
  if (name.startsWith("\u0422\u0435\u043a\u0441\u0442\u0443\u0440\u0430")) return "cabinAccent";
  if (name.includes("_sitz_hi_leki") || name.includes("_miko_lire_flanke")) return "cabinAccent";
  return undefined;
}
