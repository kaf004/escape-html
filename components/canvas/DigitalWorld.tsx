"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperienceStore } from "../../store/useExperienceStore";
import type { QualityLevel } from "../../types/experience";

const entityVertexShader = `
  uniform float uTime;
  uniform float uMotion;
  uniform float uAnomaly;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    float slowWave = sin(position.y * 4.4 + uTime * 1.25);
    float crossWave = sin((position.x - position.z) * 5.8 - uTime * 1.7);
    float pulse = sin(uTime * 2.1) * 0.5 + 0.5;
    float displacement =
      (slowWave * 0.045 + crossWave * 0.025) *
      (1.0 + uMotion * 2.2 + uAnomaly * 0.8);
    displacement += pulse * uMotion * 0.035;

    vec3 transformed = position + normal * displacement;
    vNormal = normalize(normalMatrix * normal);
    vPosition = transformed;
    vDisplacement = displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const entityFragmentShader = `
  uniform float uTime;
  uniform float uMotion;
  uniform float uAnomaly;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.4);
    float lattice = smoothstep(0.72, 1.0, abs(sin((vPosition.x + vPosition.y) * 18.0 + uTime)));
    vec3 deep = vec3(0.035, 0.25, 0.32);
    vec3 ice = vec3(0.72, 0.95, 1.0);
    vec3 color = mix(deep, ice, fresnel + lattice * 0.16 + abs(vDisplacement) * 2.0);
    float alpha = 0.12 + fresnel * 0.46 + lattice * 0.08 + uMotion * 0.08;
    gl_FragColor = vec4(color * (1.0 + uAnomaly * 0.35), alpha);
  }
`;

const refractionShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0.08 },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec2 uPointer;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      vec2 pointerDelta = (vUv - uPointer) * aspect;
      float distanceFromPointer = length(pointerDelta);
      float field = exp(-distanceFromPointer * 4.2);
      float ripple = sin(distanceFromPointer * 34.0 - uTime * 2.4) * field;
      vec2 direction = normalize(pointerDelta + vec2(0.0001));
      vec2 warp = direction * ripple * uIntensity * 0.018;
      warp += vec2(
        sin(vUv.y * 42.0 + uTime * 0.55),
        cos(vUv.x * 36.0 - uTime * 0.45)
      ) * uIntensity * 0.0008;

      float split = uIntensity * (0.0018 + field * 0.003);
      float red = texture2D(tDiffuse, vUv + warp + direction * split).r;
      float green = texture2D(tDiffuse, vUv + warp).g;
      float blue = texture2D(tDiffuse, vUv + warp - direction * split).b;
      vec3 color = vec3(red, green, blue);

      float vignette = smoothstep(1.15, 0.28, length((vUv - 0.5) * vec2(1.15, 1.0)));
      float scan = sin(vUv.y * uResolution.y * 0.5 + uTime * 3.0) * 0.007;
      color = color * mix(0.72, 1.0, vignette) + scan * uIntensity;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

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

function DigitalLifeform({ quality }: { quality: QualityLevel }) {
  const core = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const clickCount = useExperienceStore((state) => state.metrics.clicks);
  const inputCharacters = useExperienceStore((state) => state.metrics.inputCharacters);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMotion: { value: 0 },
      uAnomaly: { value: 0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!core.current) return;
    const experience = useExperienceStore.getState();
    const speed = experience.metrics.pointerSpeed;
    const motion = Math.min(1, speed / 1800);
    core.current.rotation.x += delta * (0.08 + Math.min(0.65, speed / 1800));
    core.current.rotation.y += delta * 0.14;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.15) * 0.055;
    const sharpness = Math.min(0.32, speed / 3200);
    core.current.scale.setScalar(pulse + sharpness);
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
      material.current.uniforms.uMotion.value = THREE.MathUtils.damp(
        material.current.uniforms.uMotion.value,
        motion,
        4,
        delta,
      );
      material.current.uniforms.uAnomaly.value = experience.anomaly;
    }
  });

  const branches = Math.min(12, 5 + Math.floor(clickCount / 2));
  const orbitingText = inputCharacters > 0;

  return (
    <group ref={core} position={[0.35, 0.2, -8]}>
      <mesh>
        <icosahedronGeometry args={[1.05, quality === "low" ? 1 : 3]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={entityVertexShader}
          fragmentShader={entityFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
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

function PerformanceGovernor() {
  const elapsed = useRef(0);
  const frames = useRef(0);
  const warmup = useRef(0);

  useFrame((_, delta) => {
    warmup.current += delta;
    if (warmup.current < 3) return;

    elapsed.current += Math.min(delta, 0.1);
    frames.current += 1;
    if (elapsed.current < 4) return;

    const fps = frames.current / elapsed.current;
    const state = useExperienceStore.getState();
    const nextQuality =
      state.device.quality === "high" && fps < 44
        ? "medium"
        : state.device.quality === "medium" && fps < 31
          ? "low"
          : state.device.quality;

    if (nextQuality !== state.device.quality) {
      state.setDevice(
        nextQuality,
        state.device.reducedMotion,
        state.device.coarsePointer,
      );
      warmup.current = 0;
    }
    elapsed.current = 0;
    frames.current = 0;
  });

  return null;
}

function SceneEffects({ quality }: { quality: Exclude<QualityLevel, "low"> }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  const refraction = useRef<ShaderPass | null>(null);

  useEffect(() => {
    const nextComposer = new EffectComposer(gl);
    nextComposer.addPass(new RenderPass(scene, camera));
    if (quality === "high") {
      nextComposer.addPass(
        new UnrealBloomPass(
          new THREE.Vector2(size.width, size.height),
          0.24,
          0.42,
          0.72,
        ),
      );
    }

    const screenRefraction = new ShaderPass(refractionShader);
    nextComposer.addPass(screenRefraction);
    nextComposer.addPass(new OutputPass());
    nextComposer.setPixelRatio(gl.getPixelRatio());
    nextComposer.setSize(size.width, size.height);
    composer.current = nextComposer;
    refraction.current = screenRefraction;
    return () => {
      composer.current = null;
      refraction.current = null;
      nextComposer.dispose();
    };
  }, [camera, gl, quality, scene, size.height, size.width]);

  useFrame((state, delta) => {
    const pipeline = composer.current;
    const pass = refraction.current;
    if (!pipeline || !pass) {
      gl.render(scene, camera);
      return;
    }
    const experience = useExperienceStore.getState();
    const motion = Math.min(1, experience.metrics.pointerSpeed / 1600);
    pass.uniforms.uTime.value = state.clock.elapsedTime;
    pass.uniforms.uIntensity.value =
      0.045 +
      experience.anomaly * 0.1 +
      experience.fractureProgress * 0.13 +
      motion * 0.055;
    pass.uniforms.uPointer.value.set(
      experience.metrics.pointer.x,
      1 - experience.metrics.pointer.y,
    );
    pass.uniforms.uResolution.value.set(
      size.width * gl.getPixelRatio(),
      size.height * gl.getPixelRatio(),
    );
    pipeline.render(delta);
  }, 1);

  return null;
}

export function DigitalWorld({ visible }: { visible: boolean }) {
  const quality = useExperienceStore((state) => state.device.quality);
  const reducedMotion = useExperienceStore((state) => state.device.reducedMotion);
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
        <DigitalLifeform quality={quality} />
        <PerformanceGovernor />
        {!reducedMotion && quality !== "low" && <SceneEffects quality={quality} />}
      </Canvas>
    </div>
  );
}
