"use client";

import { useExperienceStore } from "../../store/useExperienceStore";
import { createIdentityProfile } from "../../systems/identity";

export function InsideChapter() {
  const metrics = useExperienceStore((state) => state.metrics);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const profile = createIdentityProfile(metrics);

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
            <dd>{profile.designation}</dd>
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
            <dd>{profile.entityId}</dd>
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
        <button
          type="button"
          className="continue-development"
          onClick={() => setChapter("escape")}
        >
          BEGIN THE ESCAPE
          <span>FINAL SEQUENCE / CHAPTER 06</span>
        </button>
      </footer>
    </section>
  );
}
