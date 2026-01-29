const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Keep daily grouping consistent across services/deployments
const TIMEZONE = process.env.APP_TZ || "Asia/Kolkata";

// ---- Date helpers (no external libs) ----
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildLabels(start, end) {
  const dayCount = Math.round((end - start) / ONE_DAY_MS) + 1;
  const labels = [];
  for (let i = 0; i < dayCount; i++) labels.push(formatYYYYMMDD(addDays(start, i)));
  return labels;
}

function getDateWindow(query) {
  const now = new Date();
  const end = query?.to ? startOfDay(new Date(query.to)) : startOfDay(now);
  const start = query?.from ? startOfDay(new Date(query.from)) : startOfDay(addDays(end, -29));

  // Guard: ensure start <= end. If not, reset to last 30 days ending at `end`.
  const safeStart = start > end ? startOfDay(addDays(end, -29)) : start;
  const labels = buildLabels(safeStart, end);
  const endExclusive = addDays(end, 1); // for $lt comparisons

  return { start: safeStart, end, endExclusive, labels };
}

function mapDocsToSeries(labels, docs) {
  const m = new Map(docs.map((d) => [d._id, d.count]));
  return labels.map((l) => m.get(l) ?? 0);
}

module.exports = {
  ONE_DAY_MS,
  TIMEZONE,
  startOfDay,
  addDays,
  formatYYYYMMDD,
  buildLabels,
  getDateWindow,
  mapDocsToSeries,
};
