import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTERS, COURSE_WORDS } from "../app/data/lessons/course.ts";

const DEFAULT_VOICE = "ko-KR-SunHiNeural";
const DEFAULT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
const args = new Set(process.argv.slice(2));
const scope = args.has("--scope=all") ? "all" : "pilot";
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const voice = process.env.AZURE_SPEECH_VOICE || DEFAULT_VOICE;
const format = process.env.AZURE_SPEECH_FORMAT || DEFAULT_FORMAT;
const region = process.env.AZURE_SPEECH_REGION;
const key = process.env.AZURE_SPEECH_KEY;
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "public", "audio", "ko");
const manifestPath = join(outputDirectory, "manifest.json");

const pilotWordIds = new Set(CHAPTERS[0].lessons[0].words.map((word) => word.id));
const selectedWords = COURSE_WORDS
  .filter((entry) => scope === "all" || pilotWordIds.has(entry.word.id))
  .map((entry) => entry.word);

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function sourceHash(word) {
  return createHash("sha256")
    .update(JSON.stringify({ id: word.id, text: word.korean, voice, format }))
    .digest("hex");
}

async function fileExists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return { version: 1, voice, format, items: {} };
  }
}

async function synthesize(word) {
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const ssml = `<speak version="1.0" xml:lang="ko-KR"><voice name="${escapeXml(voice)}">${escapeXml(word.korean)}</voice></speak>`;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/ssml+xml",
          "Ocp-Apim-Subscription-Key": key,
          "User-Agent": "CubeKoreanAudioGenerator",
          "X-Microsoft-OutputFormat": format,
        },
        body: ssml,
      });
      if (!response.ok) throw new Error(`Azure Speech返回HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") || "";
      const audio = new Uint8Array(await response.arrayBuffer());
      if (!contentType.startsWith("audio/") || audio.byteLength === 0) {
        throw new Error("Azure Speech未返回有效音频");
      }
      return audio;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function main() {
  const ids = new Set(selectedWords.map((word) => word.id));
  if (ids.size !== selectedWords.length) throw new Error(`${scope}范围内存在重复wordId，已停止生成`);

  console.log(`范围: ${scope}; 词数: ${selectedWords.length}; 声音: ${voice}; 格式: ${format}`);
  if (dryRun) return;
  if (!region || !key) {
    throw new Error("请先设置AZURE_SPEECH_REGION和AZURE_SPEECH_KEY；密钥不要写入项目文件");
  }

  await mkdir(outputDirectory, { recursive: true });
  const previousManifest = await readManifest();
  const items = scope === "all" ? {} : { ...previousManifest.items };
  let generated = 0;
  let skipped = 0;

  for (const word of selectedWords) {
    const hash = sourceHash(word);
    const filename = `${encodeURIComponent(word.id)}.mp3`;
    const outputPath = join(outputDirectory, filename);
    const existing = previousManifest.items?.[word.id];
    if (!force && existing?.sourceHash === hash && await fileExists(outputPath)) {
      items[word.id] = existing;
      skipped += 1;
      continue;
    }

    const temporaryPath = `${outputPath}.tmp`;
    const audio = await synthesize(word);
    await writeFile(temporaryPath, audio);
    try {
      await rename(temporaryPath, outputPath);
    } catch (error) {
      await unlink(temporaryPath).catch(() => {});
      throw error;
    }
    items[word.id] = {
      text: word.korean,
      sourceHash: hash,
      path: `/audio/ko/${filename}`,
    };
    generated += 1;
    console.log(`[${generated + skipped}/${selectedWords.length}] ${word.id} ${word.korean}`);
  }

  const manifest = {
    version: 1,
    voice,
    format,
    generatedAt: new Date().toISOString(),
    items,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`完成: 新生成${generated}，跳过${skipped}，清单${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
