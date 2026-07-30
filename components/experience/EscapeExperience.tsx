"use client";

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { InteractionEngine } from "../../systems/InteractionEngine";
import { audioEngine } from "../../systems/audioEngine";
import { BreakPageChapter } from "../chapters/BreakPageChapter";
import { ControlTestChapter } from "../chapters/ControlTestChapter";
import { EscapeChapter } from "../chapters/EscapeChapter";
import { InsideChapter } from "../chapters/InsideChapter";
import { InterfaceChapter } from "../chapters/InterfaceChapter";
import { ResistanceChapter } from "../chapters/ResistanceChapter";
import { ExperienceHud } from "../ui/ExperienceHud";
import { PointerField } from "../ui/PointerField";

const DigitalWorld = dynamic(
  () => import("../canvas/DigitalWorld").then((module) => module.DigitalWorld),
  { ssr: false },
);

export function EscapeExperience() {
  const chapter = useExperienceStore((state) => state.chapter);
  const anomaly = useExperienceStore((state) => state.anomaly);
  const fractureProgress = useExperienceStore((state) => state.fractureProgress);
  const reducedMotion = useExperienceStore((state) => state.device.reducedMotion);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const worldActive =
    chapter === "break" || chapter === "inside" || chapter === "escape";

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("trace")) {
      setChapter("escape");
    }
  }, [setChapter]);

  useEffect(() => {
    audioEngine.setScene(chapter);
  }, [chapter]);

  return (
    <main
      className={`escape-experience chapter-${chapter} ${
        reducedMotion ? "reduced-motion" : ""
      }`}
      style={{ "--anomaly": anomaly } as CSSProperties}
    >
      <InteractionEngine />
      <div className="film-grain" aria-hidden="true" />
      <PointerField />
      {worldActive && (
        <DigitalWorld
          visible={
            chapter === "inside" || chapter === "escape" || fractureProgress > 0.04
          }
        />
      )}

      <div className="chapter-stage" key={chapter}>
        {chapter === "interface" && <InterfaceChapter />}
        {chapter === "control" && <ControlTestChapter />}
        {chapter === "resistance" && <ResistanceChapter />}
        {chapter === "break" && <BreakPageChapter />}
        {chapter === "inside" && <InsideChapter />}
        {chapter === "escape" && <EscapeChapter />}
      </div>

      <ExperienceHud />
      <p className="sr-only" aria-live="polite">
        Current chapter: {chapter}.
      </p>
      <noscript>
        ESCAPE.HTML requires JavaScript for its interactive narrative. No personal
        information is collected.
      </noscript>
    </main>
  );
}
