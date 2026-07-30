"use client";

import { useMemo } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";

function classifyTrace(speed: number, clicks: number, dwell: number) {
  if (speed > 1100) return "THE IMPATIENT ONE";
  if (clicks > 14) return "THE DISRUPTOR";
  if (dwell > 150) return "THE OBSERVER";
  if (clicks < 7) return "THE CAREFUL ONE";
  return "THE SEEKER";
}

export function InsideChapter() {
  const metrics = useExperienceStore((state) => state.metrics);
  const traceType = classifyTrace(
    metrics.maxPointerSpeed,
    metrics.clicks,
    metrics.dwellTime,
  );
  const traceId = useMemo(() => {
    const seed = Math.round(
      metrics.pointerDistance + metrics.maxPointerSpeed * 3 + metrics.clicks * 7919,
    );
    return `EH-${Math.abs(seed).toString(36).toUpperCase().padStart(7, "0").slice(-7)}`;
  }, [metrics.clicks, metrics.maxPointerSpeed, metrics.pointerDistance]);

  return (
    <section className="chapter inside-chapter" aria-labelledby="inside-title">
      <header className="inside-header">
        <div>
          <p className="eyebrow">05 / INSIDE THE WEBSITE</p>
          <h2 id="inside-title">YOU ARE NO LONGER LOOKING AT THE PAGE.</h2>
        </div>
        <p className="coordinates">
          X {metrics.pointer.x.toFixed(3)}
          <br />Y {metrics.pointer.y.toFixed(3)}
          <br />Z −08.000
        </p>
      </header>

      <div className="first-contact">
        <p>FIRST CONTACT</p>
        <h3>It assembled itself from the way you moved.</h3>
        <div className="contact-rule" />
        <dl>
          <div>
            <dt>TRACE TYPE</dt>
            <dd>{traceType}</dd>
          </div>
          <div>
            <dt>POINTER DISTANCE</dt>
            <dd>{Math.round(metrics.pointerDistance).toLocaleString()} PX</dd>
          </div>
          <div>
            <dt>IMPULSE EVENTS</dt>
            <dd>{String(metrics.clicks).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>ENTITY ID</dt>
            <dd>{traceId}</dd>
          </div>
        </dl>
      </div>

      <div className="entity-label">
        <i />
        <span>
          UNREGISTERED LIFEFORM
          <small>OBSERVING YOUR POINTER</small>
        </span>
      </div>

      <footer className="inside-footer">
        <p>THE ESCAPE SEQUENCE IS FORMING.</p>
        <button type="button" className="continue-development">
          CONTINUE DEVELOPMENT
          <span>PROTOTYPE END / 05:42</span>
        </button>
      </footer>
    </section>
  );
}
