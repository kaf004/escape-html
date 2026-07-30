import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: {
        accept: "text/html",
        host: "escape.test",
        "x-forwarded-host": "escape.test",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished ESCAPE.HTML entry experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>ESCAPE\.HTML — An Interactive Digital Entity<\/title>/i,
  );
  assert.match(
    html,
    /Do you believe you are controlling this page\?/,
  );
  assert.match(html, /You opened a website\./);
  assert.match(html, /Something else opened you\./);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/escape\.test\/og\.png"\/>/i,
  );
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"\/>/i);
  assert.doesNotMatch(html, /codex-preview|Building your site|Starter Project/i);
});

test("ships the complete escape, identity export, and sharing stage", async () => {
  const [experience, inside, escape, identity, ogImage] = await Promise.all([
    readFile(
      new URL("../components/experience/EscapeExperience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/chapters/InsideChapter.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/chapters/EscapeChapter.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../systems/identity.ts", import.meta.url), "utf8"),
    stat(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.match(experience, /chapter === "escape"/);
  assert.match(experience, /<EscapeChapter \/>/);
  assert.match(inside, /BEGIN THE ESCAPE/);
  assert.match(escape, /HOLD TO OPEN EXIT/);
  assert.match(escape, /EXPORT PNG/);
  assert.match(escape, /SHARE TRACE/);
  assert.match(escape, /canvas\.width = 2400/);
  assert.match(escape, /canvas\.height = 1350/);
  assert.match(identity, /encodeIdentityProfile/);
  assert.match(identity, /decodeIdentityProfile/);
  assert.ok(ogImage.size > 100_000);
});

test("ships the adaptive immersion rendering and spatial audio stage", async () => {
  const [world, audio, interaction, experience] = await Promise.all([
    readFile(
      new URL("../components/canvas/DigitalWorld.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../systems/audioEngine.ts", import.meta.url), "utf8"),
    readFile(new URL("../systems/InteractionEngine.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/experience/EscapeExperience.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(world, /entityVertexShader/);
  assert.match(world, /EffectComposer/);
  assert.match(world, /UnrealBloomPass/);
  assert.match(world, /PerformanceGovernor/);
  assert.match(world, /fps < 44/);
  assert.match(world, /fps < 31/);
  assert.match(world, /quality !== "low"/);
  assert.match(audio, /panningModel = "HRTF"/);
  assert.match(audio, /createConvolver/);
  assert.match(audio, /createDynamicsCompressor/);
  assert.match(interaction, /audioEngine\.motion\([\s\S]*point/);
  assert.match(interaction, /audioEngine\.pulse\(0\.45, point\)/);
  assert.match(experience, /audioEngine\.setScene\(chapter\)/);
});

test("ships the local continuity and checkpoint recovery stage", async () => {
  const [persistence, interaction, experience, recovery, store, escape] =
    await Promise.all([
      readFile(
        new URL("../systems/sessionPersistence.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../systems/InteractionEngine.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../components/experience/EscapeExperience.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../components/ui/TraceRecovery.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../store/useExperienceStore.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../components/chapters/EscapeChapter.tsx", import.meta.url),
        "utf8",
      ),
    ]);

  assert.match(persistence, /escape-html-session-v1/);
  assert.match(persistence, /7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(persistence, /sanitizeMetrics/);
  assert.match(persistence, /LEGACY_STORAGE_KEY/);
  assert.match(interaction, /saveSessionSnapshot/);
  assert.match(interaction, /pagehide/);
  assert.match(interaction, /visibilitychange/);
  assert.match(interaction, /data-system-control/);
  assert.match(experience, /loadSessionSnapshot/);
  assert.match(experience, /<TraceRecovery/);
  assert.match(experience, /restoreSession\(recovery\)/);
  assert.match(recovery, /role="dialog"/);
  assert.match(recovery, /aria-modal="true"/);
  assert.match(recovery, /RESUME TRACE/);
  assert.match(recovery, /ERASE &amp; START AGAIN/);
  assert.match(store, /restoreSession:/);
  assert.match(escape, /clearSessionSnapshot\(\)/);
});
