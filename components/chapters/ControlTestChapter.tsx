"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";

export function ControlTestChapter() {
  const metrics = useExperienceStore((state) => state.metrics);
  const recordInput = useExperienceStore((state) => state.recordInput);
  const recordHold = useExperienceStore((state) => state.recordHold);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const [slider, setSlider] = useState(16);
  const [dragX, setDragX] = useState(0);
  const [scrollDone, setScrollDone] = useState(false);
  const [held, setHeld] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const holdStartedAt = useRef(0);

  const moved = metrics.pointerDistance > 140;
  const dragged = dragX > 68;
  const typed = metrics.inputCharacters >= 3;
  const adjusted = slider > 72;
  const complete = [moved, dragged, typed, adjusted, held, scrollDone].filter(Boolean).length;

  const moveObject = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.buttons !== 1) return;
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const bounds = parent.getBoundingClientRect();
    const next = ((event.clientX - bounds.left) / bounds.width) * 100 - 12;
    setDragX(Math.min(82, Math.max(0, next)));
  };

  const beginHold = () => {
    setHolding(true);
    holdStartedAt.current = performance.now();
    holdTimer.current = window.setTimeout(() => {
      setHeld(true);
      setHolding(false);
      recordHold(performance.now() - holdStartedAt.current);
    }, 920);
  };

  const endHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (holding) recordHold(performance.now() - holdStartedAt.current);
    setHolding(false);
  };

  return (
    <section
      className="chapter control-chapter"
      onWheel={() => setScrollDone(true)}
      aria-labelledby="control-title"
    >
      <header className="chapter-header">
        <div>
          <p className="eyebrow">02 / INPUT CALIBRATION</p>
          <h2 id="control-title">CONTROL TEST</h2>
        </div>
        <div className="test-progress" aria-label={`${complete} of 6 tests complete`}>
          <strong>{String(complete).padStart(2, "0")}</strong>
          <span>/ 06</span>
        </div>
      </header>

      <div className="control-grid">
        <article className={`test-cell pointer-cell ${moved ? "is-complete" : ""}`}>
          <span className="cell-number">01</span>
          <p>MOVE THE POINTER</p>
          <div className="pointer-readout">
            <i style={{ width: `${Math.min(100, metrics.pointerDistance / 2.4)}%` }} />
          </div>
          <small>{Math.round(metrics.pointerDistance)} PX TRACED</small>
        </article>

        <article className={`test-cell ${adjusted ? "is-complete" : ""}`}>
          <span className="cell-number">02</span>
          <label htmlFor="signal-range">ADJUST THE SIGNAL</label>
          <input
            id="signal-range"
            type="range"
            min="0"
            max="100"
            value={slider}
            onChange={(event) => setSlider(Number(event.target.value))}
          />
          <small>THRESHOLD {slider}%</small>
        </article>

        <article className={`test-cell ${typed ? "is-complete" : ""}`}>
          <span className="cell-number">03</span>
          <label htmlFor="trace-input">TYPE SOMETHING</label>
          <input
            id="trace-input"
            className="trace-input"
            value={metrics.input}
            onChange={(event) => recordInput(event.target.value.slice(0, 42))}
            placeholder="THE PAGE IS LISTENING"
            autoComplete="off"
          />
          <small>{metrics.inputCharacters} CHARACTERS RETAINED LOCALLY</small>
        </article>

        <article className={`test-cell ${dragged ? "is-complete" : ""}`}>
          <span className="cell-number">04</span>
          <p>DISPLACE THE OBJECT</p>
          <div className="drag-track">
            <button
              className="drag-object"
              style={{ left: `${dragX}%` }}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={moveObject}
              aria-label="Drag geometric object to the right"
            />
          </div>
          <small>POINTER MASS: 0.82</small>
        </article>

        <article className={`test-cell hold-cell ${held ? "is-complete" : ""}`}>
          <span className="cell-number">05</span>
          <button
            className={`hold-button ${holding ? "is-holding" : ""}`}
            onPointerDown={beginHold}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !holding) beginHold();
            }}
            onKeyUp={endHold}
          >
            {held ? "CONFIRMED" : "HOLD TO CONFIRM"}
            <i />
          </button>
          <small>{Math.round(metrics.holdDuration)} MS PRESSURE</small>
        </article>

        <article className={`test-cell scroll-cell ${scrollDone ? "is-complete" : ""}`}>
          <span className="cell-number">06</span>
          <p>SCROLL TO CONTINUE</p>
          <div className="scroll-glyph" aria-hidden="true">
            <i />
          </div>
          <small>VERTICAL INTENT REQUIRED</small>
        </article>
      </div>

      <footer className="control-footer">
        <p>Nothing leaves this browser.</p>
        <button
          className="text-button"
          disabled={complete < 6}
          onClick={() => setChapter("resistance")}
        >
          {complete < 6 ? `CALIBRATING — ${complete}/6` : "CONTINUE"}
          <span aria-hidden="true">↗</span>
        </button>
      </footer>
    </section>
  );
}
