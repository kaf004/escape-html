"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { audioEngine } from "../../systems/audioEngine";

const warningSequence = [
  "INTERFACE RESPONSE: NOMINAL",
  "Please stop touching the interface.",
  "Please stop touching the interface.",
  "I did not write that.",
  "THE SURFACE IS NO LONGER STABLE.",
];

export function ResistanceChapter() {
  const [provocation, setProvocation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [reply, setReply] = useState("");
  const pointerSpeed = useExperienceStore((state) => state.metrics.pointerSpeed);
  const originalInput = useExperienceStore((state) => state.metrics.input);
  const setAnomaly = useExperienceStore((state) => state.setAnomaly);
  const setChapter = useExperienceStore((state) => state.setChapter);

  const title = "THE INTERFACE RESISTS";
  const intensity = Math.min(1, provocation / 4);
  const scattered = Math.min(1, pointerSpeed / 1400);
  const rearranged = useMemo(
    () => reply.split("").sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0)).join(""),
    [reply],
  );

  const disturb = () => {
    const next = Math.min(4, provocation + 1);
    setProvocation(next);
    setAnomaly(next / 4);
    audioEngine.fracture(0.25 + next * 0.12);
  };

  const evade = () => {
    if (provocation >= 2) {
      disturb();
      return;
    }
    const direction = provocation % 2 === 0 ? 1 : -1;
    setOffset({ x: direction * (92 + provocation * 24), y: 52 - provocation * 24 });
    disturb();
  };

  return (
    <section
      className={`chapter resistance-chapter anomaly-${provocation}`}
      style={{ "--intensity": intensity } as CSSProperties}
      aria-labelledby="resistance-title"
    >
      <div className="resistance-grid" aria-hidden="true" />
      <header className="chapter-header resistance-header">
        <p className="eyebrow">03 / BEHAVIORAL DEVIATION</p>
        <p className="system-warning">{warningSequence[provocation]}</p>
      </header>

      <div className="resistance-center">
        <h2 id="resistance-title" aria-label={title}>
          {title.split("").map((character, index) => (
            <span
              key={`${character}-${index}`}
              aria-hidden="true"
              style={{
                transform: `translate(${(index % 3 - 1) * scattered * 16}px, ${
                  (index % 2 ? -1 : 1) * scattered * 10
                }px) rotate(${(index % 5 - 2) * scattered * 2}deg)`,
              }}
            >
              {character === " " ? "\u00a0" : character}
            </span>
          ))}
        </h2>
        <p>
          Your input has exceeded its original purpose.
          <br />
          The page has begun to negotiate.
        </p>

        <div className="resistance-actions">
          <button
            className="evasive-button"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
            onPointerEnter={evade}
            onFocus={disturb}
            onClick={disturb}
          >
            {provocation < 2 ? "DO NOT APPROACH" : "TOUCH AGAIN"}
          </button>
          <label className="unstable-input">
            <span>MESSAGE THE INTERFACE</span>
            <input
              value={reply}
              placeholder={originalInput || "Are you awake?"}
              onChange={(event) => setReply(event.target.value.slice(0, 30))}
              onBlur={disturb}
            />
            {provocation >= 3 && reply && <output>{rearranged}</output>}
          </label>
        </div>
      </div>

      <div className="falling-words" aria-hidden="true">
        <span>CONTROL</span>
        <span>INPUT</span>
        <span>SUBMIT</span>
      </div>

      <footer className="resistance-footer">
        <span>ANOMALY LEVEL // {String(provocation).padStart(2, "0")}</span>
        {provocation >= 4 ? (
          <button
            className="fault-button"
            onClick={() => {
              audioEngine.fracture();
              setChapter("break");
            }}
          >
            OPEN THE FAULT <span>＋</span>
          </button>
        ) : (
          <button className="text-button" onClick={disturb}>
            PROVOKE INTERFACE <span>↗</span>
          </button>
        )}
      </footer>
    </section>
  );
}
