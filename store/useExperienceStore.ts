"use client";

import { create } from "zustand";
import type {
  Chapter,
  DeviceProfile,
  InteractionMetrics,
  Point,
  QualityLevel,
} from "../types/experience";

const initialMetrics: InteractionMetrics = {
  pointer: { x: 0.5, y: 0.5 },
  pointerDistance: 0,
  pointerSpeed: 0,
  pointerAcceleration: 0,
  maxPointerSpeed: 0,
  clicks: 0,
  clickPositions: [],
  pointerTrail: [],
  scrollVelocity: 0,
  scrollDirection: 0,
  input: "",
  inputCharacters: 0,
  holdDuration: 0,
  dwellTime: 0,
  focused: true,
};

interface ExperienceState {
  chapter: Chapter;
  anomaly: number;
  fractureProgress: number;
  muted: boolean;
  startedAt: number;
  metrics: InteractionMetrics;
  device: DeviceProfile;
  setChapter: (chapter: Chapter) => void;
  setAnomaly: (anomaly: number) => void;
  setFractureProgress: (progress: number) => void;
  setMuted: (muted: boolean) => void;
  setDevice: (quality: QualityLevel, reducedMotion: boolean, coarsePointer: boolean) => void;
  begin: () => void;
  recordPointer: (
    point: Point,
    distance: number,
    speed: number,
    acceleration: number,
  ) => void;
  recordClick: (point: Point) => void;
  recordScroll: (velocity: number) => void;
  recordInput: (input: string) => void;
  recordHold: (duration: number) => void;
  tickDwell: () => void;
  setFocused: (focused: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  chapter: "interface",
  anomaly: 0,
  fractureProgress: 0,
  muted: false,
  startedAt: 0,
  metrics: initialMetrics,
  device: {
    quality: "medium",
    reducedMotion: false,
    coarsePointer: false,
  },
  setChapter: (chapter) => set({ chapter }),
  setAnomaly: (anomaly) => set({ anomaly: Math.min(1, Math.max(0, anomaly)) }),
  setFractureProgress: (fractureProgress) =>
    set({ fractureProgress: Math.min(1, Math.max(0, fractureProgress)) }),
  setMuted: (muted) => set({ muted }),
  setDevice: (quality, reducedMotion, coarsePointer) =>
    set({ device: { quality, reducedMotion, coarsePointer } }),
  begin: () =>
    set((state) => ({
      startedAt: state.startedAt || Date.now(),
    })),
  recordPointer: (point, distance, speed, acceleration) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        pointer: point,
        pointerDistance: state.metrics.pointerDistance + distance,
        pointerSpeed: speed,
        pointerAcceleration: acceleration,
        maxPointerSpeed: Math.max(state.metrics.maxPointerSpeed, speed),
        pointerTrail: [...state.metrics.pointerTrail.slice(-55), point],
      },
    })),
  recordClick: (point) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        clicks: state.metrics.clicks + 1,
        clickPositions: [...state.metrics.clickPositions.slice(-31), point],
      },
    })),
  recordScroll: (velocity) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        scrollVelocity: velocity,
        scrollDirection: velocity === 0 ? 0 : velocity > 0 ? 1 : -1,
      },
    })),
  recordInput: (input) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        input,
        inputCharacters: input.length,
      },
    })),
  recordHold: (holdDuration) =>
    set((state) => ({
      metrics: { ...state.metrics, holdDuration },
    })),
  tickDwell: () =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        dwellTime: state.startedAt
          ? Math.floor((Date.now() - state.startedAt) / 1000)
          : 0,
      },
    })),
  setFocused: (focused) =>
    set((state) => ({
      metrics: { ...state.metrics, focused },
    })),
}));
