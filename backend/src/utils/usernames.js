export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function cleanUsername(value) {
  return String(value || "").trim();
}
