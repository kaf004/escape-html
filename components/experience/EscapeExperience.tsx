"use client";

import {
  type CSSProperties,
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { InteractionEngine } from "../../systems/InteractionEngine";
import { audioEngine } from "../../systems/audioEngine";
import {
  clearSessionSnapshot,
  loadSessionSnapshot,
} from "../../systems/sessionPersistence";
import type { ExperienceSnapshot } from "../../types/experience";
import { BreakPageChapter } from "../chapters/BreakPageChapter";
import { ControlTestChapter } from "../chapters/ControlTestChapter";
import { EscapeChapter } from "../chapters/EscapeChapter";
import { InsideChapter } from "../chapters/InsideChapter";
import { InterfaceChapter } from "../chapters/InterfaceChapter";
import { ResistanceChapter } from "../chapters/ResistanceChapter";
import { ExperienceHud } from "../ui/ExperienceHud";
import { PointerField } from "../ui/PointerField";
import { TraceRecovery } from "../ui/TraceRecovery";

const DigitalWorld = lazy(
  () =>
    import("../canvas/DigitalWorld").then((module) => ({
      default: module.DigitalWorld,
    })),
);

export function EscapeExperience() {
  const chapter = useExperienceStore((state) => state.chapter);
  const anomaly = useExperienceStore((state) => state.anomaly);
  const fractureProgress = useExperienceStore((state) => state.fractureProgress);
  const reducedMotion = useExperienceStore((state) => state.device.reducedMotion);
  const muted = useExperienceStore((state) => state.muted);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const restoreSession = useExperienceStore((state) => state.restoreSession);
  const reset = useExperienceStore((state) => state.reset);
  const [recovery, setRecovery] = useState<ExperienceSnapshot | null>(null);
  const worldActive =
    chapter === "break" || chapter === "inside" || chapter === "escape";

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("trace")) {
      setChapter("escape");
      return;
    }

    const snapshot = loadSessionSnapshot();
    if (!snapshot || snapshot.chapter === "interface") return;
    const frame = requestAnimationFrame(() => setRecovery(snapshot));
    return () => cancelAnimationFrame(frame);
  }, [setChapter]);

  useEffect(() => {
    audioEngine.setScene(chapter);
  }, [chapter]);

  useEffect(() => {
    audioEngine.setMuted(muted);
  }, [muted]);

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
        <Suspense fallback={null}>
          <DigitalWorld
            visible={
              chapter === "inside" ||
              chapter === "escape" ||
              fractureProgress > 0.04
            }
          />
        </Suspense>
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
      {recovery && (
        <TraceRecovery
          snapshot={recovery}
          onResume={() => {
            restoreSession(recovery);
            void audioEngine.start();
            setRecovery(null);
          }}
          onRestart={() => {
            clearSessionSnapshot();
            reset();
            setRecovery(null);
          }}
        />
      )}
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
