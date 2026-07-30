"use client";

import { useState } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { audioEngine } from "../../systems/audioEngine";
import type { Chapter } from "../../types/experience";

const chapterNumbers: Record<Chapter, string> = {
  interface: "01",
  control: "02",
  resistance: "03",
  break: "04",
  inside: "05",
  escape: "06",
};

export function ExperienceHud() {
  const chapter = useExperienceStore((state) => state.chapter);
  const muted = useExperienceStore((state) => state.muted);
  const quality = useExperienceStore((state) => state.device.quality);
  const setMuted = useExperienceStore((state) => state.setMuted);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const setFractureProgress = useExperienceStore((state) => state.setFractureProgress);
  const [controlsOpen, setControlsOpen] = useState(false);

  if (chapter === "interface") return null;

  return (
    <aside className="experience-hud" aria-label="Experience controls">
      <button
        className="hud-mark"
        onClick={() => setControlsOpen((value) => !value)}
        aria-expanded={controlsOpen}
        aria-label="Toggle experience controls"
      >
        E<span>/</span>H
      </button>
      <div className="hud-chapter">
        <span>{chapterNumbers[chapter]}</span>
        <i />
        <small>06</small>
      </div>
      <div className={`hud-controls ${controlsOpen ? "is-open" : ""}`}>
        <span className="quality-readout">{quality.toUpperCase()} RENDER</span>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            audioEngine.setMuted(next);
          }}
          aria-pressed={muted}
        >
          {muted ? "SOUND OFF" : "SOUND ON"}
        </button>
        <button
          onClick={() => {
            setFractureProgress(1);
            setChapter("inside");
          }}
        >
          SKIP MOTION
        </button>
      </div>
    </aside>
  );
}
