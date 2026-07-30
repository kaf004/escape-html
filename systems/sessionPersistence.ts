import type {
  Chapter,
  ExperienceSnapshot,
  InteractionMetrics,
  Point,
} from "../types/experience";

export const SESSION_STORAGE_KEY = "escape-html-session-v1";
const LEGACY_STORAGE_KEY = "escape-html-trace";
const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const chapters = new Set<Chapter>([
  "interface",
  "control",
  "resistance",
  "break",
  "inside",
  "escape",
]);

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback = 0,
) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}

function sanitizePoint(value: unknown): Point | null {
  if (!value || typeof value !== "object") return null;
  const point = value as Record<string, unknown>;
  return {
    x: clampNumber(point.x, 0, 1, 0.5),
    y: clampNumber(point.y, 0, 1, 0.5),
  };
}

function sanitizePoints(value: unknown, maximum: number) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-maximum)
    .map(sanitizePoint)
    .filter((point): point is Point => point !== null);
}

function sanitizeMetrics(value: unknown): InteractionMetrics | null {
  if (!value || typeof value !== "object") return null;
  const metrics = value as Record<string, unknown>;
  const pointer = sanitizePoint(metrics.pointer);
  if (!pointer) return null;
  const input =
    typeof metrics.input === "string" ? metrics.input.slice(0, 42) : "";
  const scrollDirection = clampNumber(metrics.scrollDirection, -1, 1);

  return {
    pointer,
    pointerDistance: clampNumber(metrics.pointerDistance, 0, 1_000_000),
    pointerSpeed: clampNumber(metrics.pointerSpeed, 0, 100_000),
    pointerAcceleration: clampNumber(
      metrics.pointerAcceleration,
      -1_000_000,
      1_000_000,
    ),
    maxPointerSpeed: clampNumber(metrics.maxPointerSpeed, 0, 100_000),
    clicks: Math.round(clampNumber(metrics.clicks, 0, 10_000)),
    clickPositions: sanitizePoints(metrics.clickPositions, 32),
    pointerTrail: sanitizePoints(metrics.pointerTrail, 56),
    scrollVelocity: clampNumber(metrics.scrollVelocity, -100_000, 100_000),
    scrollDirection:
      scrollDirection === 0 ? 0 : scrollDirection > 0 ? 1 : -1,
    input,
    inputCharacters: input.length,
    holdDuration: clampNumber(metrics.holdDuration, 0, 60_000),
    dwellTime: Math.round(clampNumber(metrics.dwellTime, 0, 86_400)),
    focused:
      typeof metrics.focused === "boolean" ? metrics.focused : true,
  };
}

function parseSnapshot(value: string, legacy: boolean): ExperienceSnapshot | null {
  try {
    const candidate = JSON.parse(value) as Record<string, unknown>;
    if (!chapters.has(candidate.chapter as Chapter)) return null;
    const metrics = sanitizeMetrics(candidate.metrics);
    if (!metrics) return null;

    const savedAt = legacy
      ? Date.now()
      : clampNumber(candidate.savedAt, 0, Number.MAX_SAFE_INTEGER);
    if (
      !legacy &&
      (candidate.version !== 1 || Date.now() - savedAt > MAX_SESSION_AGE_MS)
    ) {
      return null;
    }

    return {
      version: 1,
      savedAt,
      chapter: candidate.chapter as Chapter,
      anomaly: clampNumber(candidate.anomaly, 0, 1),
      fractureProgress: clampNumber(candidate.fractureProgress, 0, 1),
      muted: typeof candidate.muted === "boolean" ? candidate.muted : false,
      metrics,
    };
  } catch {
    return null;
  }
}

export function loadSessionSnapshot(): ExperienceSnapshot | null {
  try {
    const current = localStorage.getItem(SESSION_STORAGE_KEY);
    if (current) {
      const snapshot = parseSnapshot(current, false);
      if (snapshot) return snapshot;
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return null;
    const snapshot = parseSnapshot(legacy, true);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    if (snapshot) saveSessionSnapshot(snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

export function saveSessionSnapshot(
  snapshot: Omit<ExperienceSnapshot, "version" | "savedAt">,
) {
  try {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        version: 1,
        savedAt: Date.now(),
      } satisfies ExperienceSnapshot),
    );
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Persistence is an enhancement; the experience remains fully playable.
  }
}

export function clearSessionSnapshot() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // A blocked storage API must not block restarting the experience.
  }
}
