import { type KeyboardEvent, useEffect, useRef } from "react";
import type { ExperienceSnapshot } from "../../types/experience";

const chapterLabels = {
  interface: "INTERFACE",
  control: "INPUT CALIBRATION",
  resistance: "BEHAVIORAL DEVIATION",
  break: "STRUCTURAL FAILURE",
  inside: "INSIDE THE WEBSITE",
  escape: "THE ESCAPE",
} as const;

const chapterNumbers = {
  interface: "01",
  control: "02",
  resistance: "03",
  break: "04",
  inside: "05",
  escape: "06",
} as const;

export function TraceRecovery({
  snapshot,
  onResume,
  onRestart,
}: {
  snapshot: ExperienceSnapshot;
  onResume: () => void;
  onRestart: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    resumeButton.current?.focus();
  }, []);

  const keepFocusInside = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const controls = Array.from(
      dialog.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled])",
      ),
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="trace-recovery-backdrop" data-system-control>
      <section
        ref={dialog}
        className="trace-recovery"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trace-recovery-title"
        aria-describedby="trace-recovery-description"
        onKeyDown={keepFocusInside}
      >
        <p className="eyebrow">LOCAL TRACE DETECTED</p>
        <h1 id="trace-recovery-title">THE PAGE REMEMBERS WHERE YOU LEFT.</h1>
        <p id="trace-recovery-description">
          Resume from the last chapter checkpoint, or erase the trace and begin
          with an empty record.
        </p>
        <dl>
          <div>
            <dt>CHECKPOINT</dt>
            <dd>
              {chapterLabels[snapshot.chapter]} / {chapterNumbers[snapshot.chapter]}
            </dd>
          </div>
          <div>
            <dt>TRACE TIME</dt>
            <dd>{Math.max(1, Math.ceil(snapshot.metrics.dwellTime / 60))} MIN</dd>
          </div>
          <div>
            <dt>STORAGE</dt>
            <dd>THIS DEVICE ONLY</dd>
          </div>
        </dl>
        <div className="trace-recovery-actions">
          <button type="button" ref={resumeButton} onClick={onResume}>
            RESUME TRACE <span>CONTINUE CHECKPOINT</span>
          </button>
          <button type="button" onClick={onRestart}>
            ERASE &amp; START AGAIN <span>NEW TRACE</span>
          </button>
        </div>
      </section>
    </div>
  );
}
