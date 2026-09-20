// Mesh IDs from custom-interior, checked against the Gold Package gallery.
// Ribbed inserts are black; the surrounding shells and door skins are cognac.
const blackInserts = new Set([
  "012", "015", "032", "040", "041", "044", "049", "050", "052", "108", "109", "112",
]);
const cognacShells = new Set(["014", "016", "017", "018", "020", "026", "033", "042", "043", "051", "053", "064", "072", "074", "110", "111"]);

export function isReplacedCadInteriorPart(name: string): boolean {
  return /^(ita_mi|miko_ob|miko_mi)_/.test(name) || name === "ita_ob_cabinDisplay";
}

export function goldUpholsteryRole(name: string) {
  const dashboard = /^(?:Куб\.?03[24]|Плоскость\.?(?:021|078|046|047|073)|чсы(?:\.?00[123])?)$/.test(name);
  return dashboard ? undefined : goldCustomRole(name);
}

export function goldSteeringRole(name: string): "steeringBlack" | "steeringAccent" | "cabinTrim" | undefined {
  if (/^\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c\.?029$/.test(name)) return "steeringBlack";
  if (/^\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c\.?031$/.test(name)) return "steeringAccent";
  if (name.includes("_lenkr_voli_amgnap")) return "cabinTrim";
  return undefined;
}

export function goldCustomRole(name: string): "cabinLeather" | "cabinAccent" | "cabinTrim" | "cabinMetal" | "cabinClock" | "cabinClockGlass" | undefined {
  // Original watch: hands, cover glass, bezel, embossed dial respectively.
  if (name === "чсы" || /^чсы\.?002$/.test(name)) return "cabinMetal";
  if (/^чсы\.?001$/.test(name)) return "cabinClockGlass";
  if (/^чсы\.?003$/.test(name)) return "cabinClock";
  const plane = name.match(/^\u041f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c\.?(\d+)$/)?.[1];
  if (plane && blackInserts.has(plane)) return "cabinLeather";
  if (plane && cognacShells.has(plane)) return "cabinAccent";
  if (plane === "021" || plane === "078" || plane === "073") return "cabinTrim";
  if (plane && ["013", "019", "025", "045", "046", "047", "055", "057"].includes(plane)) return "cabinMetal";
  if (/^\u041a\u0443\u0431\.?03[24]$/.test(name)) return "cabinTrim";
  if (/^\u041a\u0443\u0431\.?03[56]$/.test(name)) return "cabinAccent";
  if (/^\u0422\u0435\u0441\u0442\.?00[15]$/.test(name)) return "cabinLeather";
  if (name.startsWith("\u0422\u0435\u043a\u0441\u0442\u0443\u0440\u0430")) return "cabinAccent";
  if (name.includes("_sitz_hi_leki") || name.includes("_miko_lire_flanke")) return "cabinAccent";
  return undefined;
}
