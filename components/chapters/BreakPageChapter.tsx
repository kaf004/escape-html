"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { audioEngine } from "../../systems/audioEngine";

export function BreakPageChapter() {
  const fractureProgress = useExperienceStore((state) => state.fractureProgress);
  const setFractureProgress = useExperienceStore((state) => state.setFractureProgress);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const dragging = useRef(false);
  const origin = useRef(0);
  const completed = useRef(false);

  const updateFracture = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const distance = Math.abs(event.clientX - origin.current);
    const progress = Math.min(1, distance / (window.innerWidth * 0.34));
    setFractureProgress(progress);
    if (progress > 0.9 && !completed.current) {
      completed.current = true;
      audioEngine.fracture(1.4);
      window.setTimeout(() => setChapter("inside"), 820);
    }
  };

  const nudgeWithKeyboard = (amount: number) => {
    const next = Math.min(1, fractureProgress + amount);
    setFractureProgress(next);
    if (next > 0.9 && !completed.current) {
      completed.current = true;
      audioEngine.fracture(1.4);
      window.setTimeout(() => setChapter("inside"), 820);
    }
  };

  const styles = { "--fracture": fractureProgress } as CSSProperties;

  return (
    <section className="chapter break-chapter" style={styles} aria-labelledby="break-title">
      <div className="fracture-glow" aria-hidden="true" />
      <div className="fracture-shard shard-one" aria-hidden="true" />
      <div className="fracture-shard shard-two" aria-hidden="true" />
      <div className="fracture-shard shard-three" aria-hidden="true" />

      <div className="page-half page-half-left">
        <p className="eyebrow">04 / STRUCTURAL FAILURE</p>
        <h2 id="break-title">BREAK</h2>
        <span className="structural-code">DOM NODE 019 — DISCONNECTED</span>
      </div>
      <div className="page-half page-half-right">
        <span className="structural-code">BOUNDARY INTEGRITY {Math.round((1 - fractureProgress) * 100)}%</span>
        <h2 aria-hidden="true">THE PAGE</h2>
        <p>Something is visible behind the interface.</p>
      </div>

      <div className="fracture-core">
        <button
          className="fracture-handle"
          aria-label="Drag sideways to open the page boundary"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fractureProgress * 100)}
          role="slider"
          onPointerDown={(event) => {
            dragging.current = true;
            origin.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={updateFracture}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              nudgeWithKeyboard(0.12);
            }
          }}
        >
          <span>DRAG THE FAULT OPEN</span>
          <i aria-hidden="true" />
        </button>
      </div>

      <div className="fracture-meter">
        <span>APERTURE</span>
        <i>
          <b style={{ width: `${fractureProgress * 100}%` }} />
        </i>
        <strong>{String(Math.round(fractureProgress * 100)).padStart(3, "0")}</strong>
      </div>
    </section>
  );
}
