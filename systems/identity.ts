import type { InteractionMetrics } from "../types/experience";

export interface IdentityProfile {
  entityId: string;
  designation: string;
  signature: string;
  movement: number;
  impulse: number;
  patience: number;
  entropy: number;
  traits: [string, string, string];
  issuedAt: string;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function classifyTrace(speed: number, clicks: number, dwell: number) {
  if (speed > 1100) return "THE IMPATIENT ONE";
  if (clicks > 14) return "THE DISRUPTOR";
  if (dwell > 150) return "THE OBSERVER";
  if (clicks < 7) return "THE CAREFUL ONE";
  return "THE SEEKER";
}

export function createIdentityProfile(
  metrics: InteractionMetrics,
): IdentityProfile {
  const movement = clamp(
    metrics.pointerDistance / 18000 + metrics.maxPointerSpeed / 7000,
  );
  const impulse = clamp(metrics.clicks / 24 + metrics.holdDuration / 5000);
  const patience = clamp(metrics.dwellTime / 190);
  const entropy = clamp(
    Math.abs(metrics.pointerAcceleration) / 9000 +
      metrics.inputCharacters / 80 +
      metrics.clickPositions.length / 50,
  );
  const seed = [
    Math.round(metrics.pointerDistance),
    Math.round(metrics.maxPointerSpeed),
    metrics.clicks,
    metrics.inputCharacters,
    metrics.dwellTime,
  ].join(":");
  const hash = hashText(seed);
  const entityId = `EH-${hash.toString(36).toUpperCase().padStart(7, "0").slice(-7)}`;
  const traits: IdentityProfile["traits"] = [
    movement > 0.62 ? "KINETIC" : "DELIBERATE",
    impulse > 0.58 ? "VOLATILE" : "CONTROLLED",
    patience > 0.48 ? "OBSERVANT" : entropy > 0.52 ? "UNPREDICTABLE" : "DIRECT",
  ];

  return {
    entityId,
    designation: classifyTrace(
      metrics.maxPointerSpeed,
      metrics.clicks,
      metrics.dwellTime,
    ),
    signature: `${(hash % 0xffffff).toString(16).toUpperCase().padStart(6, "0")}—${(
      (hash >>> 8) %
      0xffff
    )
      .toString(16)
      .toUpperCase()
      .padStart(4, "0")}`,
    movement,
    impulse,
    patience,
    entropy,
    traits,
    issuedAt: new Date().toISOString().slice(0, 10),
  };
}

export function encodeIdentityProfile(profile: IdentityProfile) {
  const compact = {
    i: profile.entityId,
    d: profile.designation,
    s: profile.signature,
    m: Math.round(profile.movement * 1000),
    p: Math.round(profile.impulse * 1000),
    w: Math.round(profile.patience * 1000),
    e: Math.round(profile.entropy * 1000),
    t: profile.traits,
    a: profile.issuedAt,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}

export function decodeIdentityProfile(value: string): IdentityProfile | null {
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const compact = JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
    if (
      typeof compact.i !== "string" ||
      typeof compact.d !== "string" ||
      typeof compact.s !== "string" ||
      !Array.isArray(compact.t) ||
      compact.t.length !== 3
    ) {
      return null;
    }

    return {
      entityId: compact.i.slice(0, 16),
      designation: compact.d.slice(0, 32),
      signature: compact.s.slice(0, 16),
      movement: clamp(Number(compact.m) / 1000),
      impulse: clamp(Number(compact.p) / 1000),
      patience: clamp(Number(compact.w) / 1000),
      entropy: clamp(Number(compact.e) / 1000),
      traits: compact.t.map((trait) => String(trait).slice(0, 20)) as [
        string,
        string,
        string,
      ],
      issuedAt:
        typeof compact.a === "string"
          ? compact.a.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}
