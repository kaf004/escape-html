"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperienceStore } from "../../store/useExperienceStore";

function seededNoise(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function Corridor() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const pointer = useExperienceStore.getState().metrics.pointer;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      (pointer.x - 0.5) * 0.16,
      3,
      delta,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      (pointer.y - 0.5) * 0.08,
      3,
      delta,
    );
    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      (pointer.x - 0.5) * 1.2,
      2.4,
      delta,
    );
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      (0.5 - pointer.y) * 0.7,
      2.4,
      delta,
    );
  });

  return (
    <group ref={group}>
      {Array.from({ length: 13 }, (_, index) => {
        const depth = -index * 4;
        const scale = 1 + index * 0.035;
        return (
          <group key={depth} position={[0, 0, depth]} scale={scale}>
            <mesh position={[-4.4, 0, 0]}>
              <boxGeometry args={[0.035, 6.8, 0.035]} />
              <meshBasicMaterial color="#9dc5d1" transparent opacity={0.35} />
            </mesh>
            <mesh position={[4.4, 0, 0]}>
              <boxGeometry args={[0.035, 6.8, 0.035]} />
              <meshBasicMaterial color="#9dc5d1" transparent opacity={0.35} />
            </mesh>
            <mesh position={[0, 3.4, 0]}>
              <boxGeometry args={[8.8, 0.035, 0.035]} />
              <meshBasicMaterial color="#efffff" transparent opacity={0.28} />
            </mesh>
            <mesh position={[0, -3.4, 0]}>
              <boxGeometry args={[8.8, 0.035, 0.035]} />
              <meshBasicMaterial color="#efffff" transparent opacity={0.16} />
            </mesh>
          </group>
        );
      })}
      <gridHelper
        args={[80, 80, new THREE.Color("#31505c"), new THREE.Color("#18282f")]}
        rotation={[0, 0, 0]}
        position={[0, -3.39, -26]}
      />
    </group>
  );
}

function DataDust({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (seededNoise(index, 1) - 0.5) * 18;
      values[index * 3 + 1] = (seededNoise(index, 2) - 0.5) * 9;
      values[index * 3 + 2] = -seededNoise(index, 3) * 54 + 4;
    }
    return values;
  }, [count]);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.z += delta * 0.006;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d6f5ff"
        size={0.026}
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingFragments() {
  const group = useRef<THREE.Group>(null);
  const fragments = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        x: ((index * 37) % 9) - 4,
        y: ((index * 23) % 6) - 3,
        z: -5 - index * 3.2,
        rotation: index * 0.41,
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.children.forEach((child, index) => {
      child.rotation.z = fragments[index].rotation + state.clock.elapsedTime * 0.035;
      child.position.y =
        fragments[index].y + Math.sin(state.clock.elapsedTime * 0.4 + index) * 0.12;
    });
  });

  return (
    <group ref={group}>
      {fragments.map((fragment, index) => (
        <mesh
          key={fragment.z}
          position={[fragment.x, fragment.y, fragment.z]}
          rotation={[0.2, fragment.rotation, fragment.rotation]}
        >
          <boxGeometry args={[index % 3 === 0 ? 1.7 : 0.8, 0.42, 0.035]} />
          <meshPhysicalMaterial
            color="#9eb0b6"
            transparent
            opacity={0.16}
            roughness={0.08}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function DigitalLifeform() {
  const core = useRef<THREE.Group>(null);
  const clickCount = useExperienceStore((state) => state.metrics.clicks);
  const inputCharacters = useExperienceStore((state) => state.metrics.inputCharacters);

  useFrame((state, delta) => {
    if (!core.current) return;
    const speed = useExperienceStore.getState().metrics.pointerSpeed;
    core.current.rotation.x += delta * (0.08 + Math.min(0.65, speed / 1800));
    core.current.rotation.y += delta * 0.14;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.15) * 0.055;
    const sharpness = Math.min(0.32, speed / 3200);
    core.current.scale.setScalar(pulse + sharpness);
  });

  const branches = Math.min(12, 5 + Math.floor(clickCount / 2));
  const orbitingText = inputCharacters > 0;

  return (
    <group ref={core} position={[0.35, 0.2, -8]}>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshPhysicalMaterial
          color="#bbf0ff"
          emissive="#2f9ab8"
          emissiveIntensity={1.4}
          transparent
          opacity={0.32}
          wireframe
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.012, 8, 120]} />
        <meshBasicMaterial color="#e9fbff" transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[0.4, 0.8, 0.2]}>
        <torusGeometry args={[1.25, 0.02, 8, 100]} />
        <meshBasicMaterial color="#75c9dd" transparent opacity={0.42} />
      </mesh>
      {Array.from({ length: branches }, (_, index) => {
        const angle = (index / branches) * Math.PI * 2;
        return (
          <mesh
            key={angle}
            position={[Math.cos(angle) * 1.8, Math.sin(angle) * 1.2, Math.sin(angle) * 0.5]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.8 + (index % 3) * 0.2, 0.014, 0.014]} />
            <meshBasicMaterial color={index % 2 ? "#eaffff" : "#75c9dd"} />
          </mesh>
        );
      })}
      {orbitingText && (
        <mesh position={[0, -1.95, 0]}>
          <planeGeometry args={[2.7, 0.22]} />
          <meshBasicMaterial color="#c8f6ff" transparent opacity={0.2} />
        </mesh>
      )}
      <pointLight color="#a8ecff" intensity={18} distance={11} />
    </group>
  );
}

export function DigitalWorld({ visible }: { visible: boolean }) {
  const quality = useExperienceStore((state) => state.device.quality);
  const count = quality === "high" ? 1400 : quality === "medium" ? 800 : 360;
  const dpr: number | [number, number] =
    quality === "high" ? [1, 1.7] : quality === "medium" ? [1, 1.35] : 1;

  return (
    <div className={`world-canvas ${visible ? "is-visible" : ""}`} aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 8], fov: 52, near: 0.1, far: 120 }}
        gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#020303"]} />
        <fog attach="fog" args={["#020303", 14, 58]} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} color="#d5f7ff" />
        <Corridor />
        <DataDust count={count} />
        <FloatingFragments />
        <DigitalLifeform />
      </Canvas>
    </div>
  );
}
