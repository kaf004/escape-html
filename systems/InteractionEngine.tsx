"use client";

import { useEffect } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import type { QualityLevel } from "../types/experience";
import { audioEngine } from "./audioEngine";
import { saveSessionSnapshot } from "./sessionPersistence";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

function detectQuality(): QualityLevel {
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = matchMedia("(pointer: coarse)").matches;
  if (mobile || memory <= 4 || cores <= 4) return "low";
  if (memory >= 8 && cores >= 8) return "high";
  return "medium";
}

export function InteractionEngine() {
  const recordPointer = useExperienceStore((state) => state.recordPointer);
  const recordClick = useExperienceStore((state) => state.recordClick);
  const recordScroll = useExperienceStore((state) => state.recordScroll);
  const setFocused = useExperienceStore((state) => state.setFocused);
  const tickDwell = useExperienceStore((state) => state.tickDwell);
  const setDevice = useExperienceStore((state) => state.setDevice);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const updateDevice = () =>
      setDevice(detectQuality(), reduced.matches, coarse.matches);
    updateDevice();
    reduced.addEventListener("change", updateDevice);
    coarse.addEventListener("change", updateDevice);
    return () => {
      reduced.removeEventListener("change", updateDevice);
      coarse.removeEventListener("change", updateDevice);
    };
  }, [setDevice]);

  useEffect(() => {
    let previousX = window.innerWidth / 2;
    let previousY = window.innerHeight / 2;
    let previousTime = performance.now();
    let previousSpeed = 0;
    let frame = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const now = performance.now();
        const elapsed = Math.max(8, now - previousTime);
        const distance = Math.hypot(event.clientX - previousX, event.clientY - previousY);
        const rawSpeed = (distance / elapsed) * 1000;
        const speed = previousSpeed * 0.56 + rawSpeed * 0.44;
        const acceleration = ((speed - previousSpeed) / elapsed) * 1000;
        const point = {
          x: event.clientX / window.innerWidth,
          y: event.clientY / window.innerHeight,
        };

        recordPointer(point, distance, speed, acceleration);
        audioEngine.motion(
          speed,
          useExperienceStore.getState().anomaly,
          point,
        );
        previousX = event.clientX;
        previousY = event.clientY;
        previousTime = now;
        previousSpeed = speed;
        frame = 0;
      });
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-system-control]")
      ) {
        return;
      }
      const point = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };
      recordClick(point);
      audioEngine.pulse(0.45, point);
    };

    const onWheel = (event: WheelEvent) => {
      recordScroll(event.deltaY);
      window.setTimeout(() => recordScroll(0), 140);
    };

    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    const persist = () => {
      const state = useExperienceStore.getState();
      if (!state.startedAt || state.chapter === "interface") return;
      saveSessionSnapshot({
        chapter: state.chapter,
        anomaly: state.anomaly,
        fractureProgress: state.fractureProgress,
        muted: state.muted,
        metrics: state.metrics,
      });
    };

    const dwellTimer = window.setInterval(() => {
      tickDwell();
      persist();
    }, 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persist();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("click", onClick);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      persist();
      cancelAnimationFrame(frame);
      clearInterval(dwellTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recordClick, recordPointer, recordScroll, setFocused, tickDwell]);

  return null;
}
