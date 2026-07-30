"use client";

import { useState } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { audioEngine } from "../../systems/audioEngine";

export function InterfaceChapter() {
  const [loading, setLoading] = useState(false);
  const begin = useExperienceStore((state) => state.begin);
  const setChapter = useExperienceStore((state) => state.setChapter);

  const enter = async () => {
    if (loading) return;
    setLoading(true);
    begin();
    await audioEngine.start();
    window.setTimeout(() => setChapter("control"), 720);
  };

  return (
    <section className={`chapter interface-chapter ${loading ? "is-entering" : ""}`}>
      <div className="interface-index" aria-hidden="true">
        <span>ESCAPE.HTML</span>
        <span>INTERFACE / 01</span>
      </div>

      <div className="interface-center">
        <p className="eyebrow">A CONTROLLED ENVIRONMENT</p>
        <h1>Do you believe you are controlling this page?</h1>
        <button className="enter-button" onClick={enter} disabled={loading}>
          <span>{loading ? "OPENING" : "ENTER"}</span>
          <i aria-hidden="true" />
        </button>
        <div className="load-line" aria-label={loading ? "Loading experience" : undefined}>
          <span />
        </div>
      </div>

      <p className="interface-footnote">
        You opened a website.
        <br />
        Something else opened you.
      </p>
    </section>
  );
}
