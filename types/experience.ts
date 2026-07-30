export type Chapter =
  | "interface"
  | "control"
  | "resistance"
  | "break"
  | "inside"
  | "escape";

export type QualityLevel = "low" | "medium" | "high";

export interface Point {
  x: number;
  y: number;
}

export interface InteractionMetrics {
  pointer: Point;
  pointerDistance: number;
  pointerSpeed: number;
  pointerAcceleration: number;
  maxPointerSpeed: number;
  clicks: number;
  clickPositions: Point[];
  pointerTrail: Point[];
  scrollVelocity: number;
  scrollDirection: -1 | 0 | 1;
  input: string;
  inputCharacters: number;
  holdDuration: number;
  dwellTime: number;
  focused: boolean;
}

export interface DeviceProfile {
  quality: QualityLevel;
  reducedMotion: boolean;
  coarsePointer: boolean;
}

export interface ExperienceSnapshot {
  version: 1;
  savedAt: number;
  chapter: Chapter;
  anomaly: number;
  fractureProgress: number;
  muted: boolean;
  metrics: InteractionMetrics;
}
