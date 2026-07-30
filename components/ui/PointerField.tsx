"use client";

import { useExperienceStore } from "../../store/useExperienceStore";

export function PointerField() {
  const pointer = useExperienceStore((state) => state.metrics.pointer);
  const speed = useExperienceStore((state) => state.metrics.pointerSpeed);
  const coarse = useExperienceStore((state) => state.device.coarsePointer);

  return (
    <>
      <div
        className="pointer-light"
        style={{
          transform: `translate3d(${pointer.x * 100}vw, ${pointer.y * 100}vh, 0)`,
          opacity: Math.min(0.7, 0.22 + speed / 2600),
        }}
        aria-hidden="true"
      />
      {!coarse && (
        <div
          className="custom-pointer"
          style={{
            transform: `translate3d(calc(${pointer.x * 100}vw - 50%), calc(${
              pointer.y * 100
            }vh - 50%), 0) scale(${1 + Math.min(0.8, speed / 1400)})`,
          }}
          aria-hidden="true"
        >
          <i />
        </div>
      )}
    </>
  );
}
