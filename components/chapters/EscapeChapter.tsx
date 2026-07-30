"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { audioEngine } from "../../systems/audioEngine";
import {
  createIdentityProfile,
  decodeIdentityProfile,
  encodeIdentityProfile,
  type IdentityProfile,
} from "../../systems/identity";

type EscapePhase = "threshold" | "release" | "identity";

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="identity-metric">
      <span>{label}</span>
      <i>
        <b style={{ width: `${Math.round(value * 100)}%` }} />
      </i>
      <strong>{String(Math.round(value * 100)).padStart(2, "0")}</strong>
    </div>
  );
}

function EntityGlyph({ profile }: { profile: IdentityProfile }) {
  const branchCount = 4 + Math.round(profile.impulse * 4);
  return (
    <div
      className="identity-glyph"
      style={
        {
          "--glyph-rotation": `${Math.round(profile.entropy * 80 - 40)}deg`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <i className="glyph-ring glyph-ring-one" />
      <i className="glyph-ring glyph-ring-two" />
      <i className="glyph-core" />
      {Array.from({ length: branchCount }, (_, index) => (
        <i
          className="glyph-branch"
          key={index}
          style={
            {
              "--branch-angle": `${(index / branchCount) * 360}deg`,
              "--branch-length": `${30 + ((index * 17) % 26)}%`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function IdentityCard({ profile }: { profile: IdentityProfile }) {
  return (
    <article className="identity-card" aria-label="Your digital identity card">
      <header className="identity-card-header">
        <p>ESCAPE.HTML / EXIT RECORD</p>
        <span>SPECIMEN 06—FINAL</span>
      </header>
      <div className="identity-card-body">
        <div className="identity-card-copy">
          <p className="identity-kicker">BEHAVIORAL ENTITY</p>
          <h2>{profile.designation}</h2>
          <p className="identity-id">{profile.entityId}</p>
          <div className="identity-traits">
            {profile.traits.map((trait) => (
              <span key={trait}>{trait}</span>
            ))}
          </div>
        </div>
        <EntityGlyph profile={profile} />
        <div className="identity-metrics">
          <MetricBar label="MOVEMENT" value={profile.movement} />
          <MetricBar label="IMPULSE" value={profile.impulse} />
          <MetricBar label="PATIENCE" value={profile.patience} />
          <MetricBar label="ENTROPY" value={profile.entropy} />
        </div>
      </div>
      <footer className="identity-card-footer">
        <span>SIGNATURE {profile.signature}</span>
        <span>ISSUED {profile.issuedAt}</span>
        <span>STATUS / ESCAPED</span>
      </footer>
    </article>
  );
}

function drawIdentityCard(profile: IdentityProfile) {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = "#050707";
  context.fillRect(0, 0, width, height);

  const glow = context.createRadialGradient(1780, 560, 20, 1780, 560, 650);
  glow.addColorStop(0, "rgba(167, 235, 255, 0.22)");
  glow.addColorStop(0.45, "rgba(81, 155, 177, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(214, 246, 251, 0.12)";
  context.lineWidth = 2;
  for (let x = 100; x < width; x += 160) {
    context.beginPath();
    context.moveTo(x, 80);
    context.lineTo(x, height - 80);
    context.stroke();
  }
  for (let y = 80; y < height; y += 130) {
    context.beginPath();
    context.moveTo(100, y);
    context.lineTo(width - 100, y);
    context.stroke();
  }

  context.strokeStyle = "#d8f7ff";
  context.lineWidth = 3;
  context.strokeRect(92, 72, width - 184, height - 144);
  context.strokeStyle = "rgba(216, 247, 255, 0.3)";
  context.strokeRect(116, 96, width - 232, height - 192);

  context.fillStyle = "#d8f7ff";
  context.font = "500 28px Consolas, monospace";
  context.fillText("ESCAPE.HTML / EXIT RECORD", 150, 160);
  context.textAlign = "right";
  context.fillText("SPECIMEN 06—FINAL", width - 150, 160);
  context.textAlign = "left";

  context.fillStyle = "rgba(216, 247, 255, 0.54)";
  context.font = "500 24px Consolas, monospace";
  context.fillText("BEHAVIORAL ENTITY", 170, 365);
  context.fillStyle = "#f1f7f5";
  context.font = "300 104px Arial, sans-serif";
  const words = profile.designation.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  context.fillText(words.slice(0, midpoint).join(" "), 165, 500);
  context.fillText(words.slice(midpoint).join(" "), 165, 605);
  context.fillStyle = "#a9eaff";
  context.font = "500 34px Consolas, monospace";
  context.fillText(profile.entityId, 174, 682);

  profile.traits.forEach((trait, index) => {
    const x = 170 + index * 230;
    context.strokeStyle = "rgba(216, 247, 255, 0.4)";
    context.strokeRect(x, 750, 190, 52);
    context.fillStyle = "#d8f7ff";
    context.font = "500 20px Consolas, monospace";
    context.textAlign = "center";
    context.fillText(trait, x + 95, 784);
  });
  context.textAlign = "left";

  const centerX = 1745;
  const centerY = 555;
  context.save();
  context.translate(centerX, centerY);
  context.rotate((profile.entropy - 0.5) * 0.8);
  context.strokeStyle = "rgba(190, 241, 255, 0.8)";
  context.lineWidth = 3;
  [120, 190, 265].forEach((radius, index) => {
    context.beginPath();
    context.ellipse(
      0,
      0,
      radius,
      radius * (0.55 + index * 0.1),
      index * 0.72,
      0,
      Math.PI * 2,
    );
    context.stroke();
  });
  const branches = 6 + Math.round(profile.impulse * 6);
  for (let index = 0; index < branches; index += 1) {
    const angle = (index / branches) * Math.PI * 2;
    const length = 230 + ((index * 43) % 160);
    context.beginPath();
    context.moveTo(Math.cos(angle) * 75, Math.sin(angle) * 75);
    context.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
    context.stroke();
  }
  context.fillStyle = "#dffaff";
  context.shadowColor = "#84dcf5";
  context.shadowBlur = 60;
  context.beginPath();
  context.arc(0, 0, 54 + profile.movement * 30, 0, Math.PI * 2);
  context.fill();
  context.restore();
  context.shadowBlur = 0;

  const metrics = [
    ["MOVEMENT", profile.movement],
    ["IMPULSE", profile.impulse],
    ["PATIENCE", profile.patience],
    ["ENTROPY", profile.entropy],
  ] as const;
  metrics.forEach(([label, value], index) => {
    const y = 945 + index * 55;
    context.fillStyle = "rgba(216, 247, 255, 0.64)";
    context.font = "500 20px Consolas, monospace";
    context.fillText(label, 170, y);
    context.fillStyle = "rgba(216, 247, 255, 0.16)";
    context.fillRect(360, y - 13, 590, 3);
    context.fillStyle = "#bdeeff";
    context.fillRect(360, y - 13, 590 * value, 3);
    context.textAlign = "right";
    context.fillText(String(Math.round(value * 100)).padStart(2, "0"), 1010, y);
    context.textAlign = "left";
  });

  context.strokeStyle = "rgba(216, 247, 255, 0.32)";
  context.beginPath();
  context.moveTo(145, 1160);
  context.lineTo(width - 145, 1160);
  context.stroke();
  context.fillStyle = "rgba(216, 247, 255, 0.72)";
  context.font = "500 22px Consolas, monospace";
  context.fillText(`SIGNATURE ${profile.signature}`, 150, 1215);
  context.textAlign = "center";
  context.fillText(`ISSUED ${profile.issuedAt}`, width / 2, 1215);
  context.textAlign = "right";
  context.fillStyle = "#bdeeff";
  context.fillText("STATUS / ESCAPED", width - 150, 1215);

  return canvas;
}

export function EscapeChapter() {
  const metrics = useExperienceStore((state) => state.metrics);
  const setChapter = useExperienceStore((state) => state.setChapter);
  const reset = useExperienceStore((state) => state.reset);
  const reducedMotion = useExperienceStore((state) => state.device.reducedMotion);
  const localProfile = useMemo(() => createIdentityProfile(metrics), [metrics]);
  const [sharedProfile] = useState<IdentityProfile | null>(() => {
    if (typeof window === "undefined") return null;
    const trace = new URLSearchParams(window.location.search).get("trace");
    return trace ? decodeIdentityProfile(trace) : null;
  });
  const [phase, setPhase] = useState<EscapePhase>(() =>
    sharedProfile ? "identity" : "threshold",
  );
  const [holdProgress, setHoldProgress] = useState(0);
  const [message, setMessage] = useState(
    sharedProfile ? "SHARED TRACE RESTORED" : "",
  );
  const frameRef = useRef(0);
  const holdStartRef = useRef(0);
  const profile = sharedProfile ?? localProfile;

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const finishHold = () => {
    cancelAnimationFrame(frameRef.current);
    setHoldProgress(1);
    setPhase("release");
    audioEngine.fracture(0.72);
    window.setTimeout(() => {
      setPhase("identity");
      audioEngine.pulse(0.32);
    }, reducedMotion ? 40 : 2500);
  };

  const startHold = () => {
    if (phase !== "threshold" || frameRef.current) return;
    holdStartRef.current = performance.now() - holdProgress * 1700;
    const tick = (now: number) => {
      const next = Math.min(1, (now - holdStartRef.current) / 1700);
      setHoldProgress(next);
      if (next >= 1) {
        frameRef.current = 0;
        finishHold();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const stopHold = () => {
    if (phase !== "threshold") return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    setHoldProgress(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    startHold();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      startHold();
    }
  };

  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      stopHold();
    }
  };

  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("trace", encodeIdentityProfile(profile));
    return url.toString();
  };

  const share = async () => {
    const url = shareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.designation} / ESCAPE.HTML`,
          text: `A digital entity classified me as ${profile.designation}.`,
          url,
        });
        setMessage("TRACE RELEASED");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("SHARE LINK COPIED");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        setMessage("SHARE LINK COPIED");
      } catch {
        setMessage("COPY BLOCKED — USE THE ADDRESS BAR");
      }
    }
  };

  const download = () => {
    const canvas = drawIdentityCard(profile);
    if (!canvas) {
      setMessage("EXPORT UNAVAILABLE");
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage("EXPORT UNAVAILABLE");
        return;
      }
      const link = document.createElement("a");
      link.download = `escape-html-${profile.entityId.toLowerCase()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setMessage("2400 × 1350 PNG EXPORTED");
    }, "image/png");
  };

  if (phase === "release") {
    return (
      <section className="chapter escape-chapter release-phase" aria-live="polite">
        <div className="release-scan" aria-hidden="true" />
        <p className="escape-chapter-number">06 / THE ESCAPE</p>
        <div className="release-copy">
          <p>BOUNDARY STATUS / OPEN</p>
          <h1>YOU WERE THE EXIT.</h1>
          <span>ASSEMBLING THE TRACE YOU LEFT BEHIND</span>
        </div>
      </section>
    );
  }

  if (phase === "identity") {
    return (
      <section className="chapter escape-chapter identity-phase">
        <header className="identity-page-header">
          <div>
            <p className="eyebrow">06 / AFTER THE ESCAPE</p>
            <h1>THE PAGE ENDS. YOUR TRACE DOES NOT.</h1>
          </div>
          <p>
            THIS RECORD CONTAINS NO NAME.
            <br />
            ONLY THE SHAPE OF YOUR ATTENTION.
          </p>
        </header>
        <div className="identity-card-wrap">
          <IdentityCard profile={profile} />
        </div>
        <footer className="identity-actions">
          <p aria-live="polite">{message || "YOUR EXIT RECORD IS READY."}</p>
          <div>
            <button type="button" onClick={download}>
              EXPORT PNG <span>2400 × 1350</span>
            </button>
            <button type="button" onClick={share}>
              SHARE TRACE <span>REPLAYABLE LINK</span>
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                window.history.replaceState({}, "", window.location.pathname);
                setChapter("interface");
              }}
            >
              ERASE &amp; RE-ENTER <span>NEW TRACE</span>
            </button>
          </div>
        </footer>
      </section>
    );
  }

  return (
    <section className="chapter escape-chapter threshold-phase">
      <div className="escape-rings" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="escape-threshold-header">
        <p className="eyebrow">06 / THE ESCAPE</p>
        <p>CONTAINMENT IS A USER INTERFACE.</p>
      </header>
      <div className="escape-threshold-copy">
        <p>ONE FINAL INPUT IS REQUIRED.</p>
        <h1>
          DO NOT CLICK.
          <br />
          DO NOT LEAVE.
          <br />
          HOLD.
        </h1>
      </div>
      <button
        type="button"
        className="escape-hold"
        onPointerDown={onPointerDown}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        style={{ "--hold": holdProgress } as CSSProperties}
      >
        <span>HOLD TO OPEN EXIT</span>
        <strong>{Math.round(holdProgress * 100).toString().padStart(3, "0")}</strong>
      </button>
      <p className="escape-threshold-foot">
        RELEASE EARLY AND THE BOUNDARY RESTORES ITSELF.
      </p>
    </section>
  );
}
