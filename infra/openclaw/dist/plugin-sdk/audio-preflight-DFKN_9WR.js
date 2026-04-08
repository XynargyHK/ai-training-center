import "./accounts-BSywe9Bq.js";
import { G as shouldLogVerbose, H as logVerbose } from "./registry-CvUzfgyU.js";
import "./paths-DJmOcr7Q.js";
import "./model-selection-CB9IIVWU.js";
import "./config-XgvPhLbB.js";
import "./ssrf--zCZt1NJ.js";
import "./subsystem-CPwOCKbN.js";
import "./exec-CBwIXprv.js";
import "./tool-images-DqqvFxSv.js";
import "./agent-scope-BmRbl8vE.js";
import "./skills-CFdAEWMp.js";
import "./redact-BUgsXMP1.js";
import "./errors-7SO55DQM.js";
import "./fetch-CO6Olj9O.js";
import "./chrome-CNaxD22L.js";
import "./env-DNXtq8Zy.js";
import "./thinking-CtxhcKkY.js";
import "./normalize-mEjrgr3H.js";
import "./bindings-BGhRgiFJ.js";
import "./plugins-BBPPyP5O.js";
import "./message-channel-CzbBSsGC.js";
import "./pi-embedded-helpers-W4_kAzJ6.js";
import "./github-copilot-token-Dtvm_sTU.js";
import "./manifest-registry-C0jS6PBU.js";
import "./paths-CyXoO9iV.js";
import { a as runCapability, l as isAudioAttachment, n as createMediaAttachmentCache, r as normalizeMediaAttachments, t as buildProviderRegistry } from "./runner-BFfs01nm.js";
import "./image-CvvaRYEH.js";
import "./pi-model-discovery-C4v6vPae.js";
import "./api-key-rotation-TfmHjOsE.js";

//#region src/media-understanding/audio-preflight.ts
/**
* Transcribes the first audio attachment BEFORE mention checking.
* This allows voice notes to be processed in group chats with requireMention: true.
* Returns the transcript or undefined if transcription fails or no audio is found.
*/
async function transcribeFirstAudio(params) {
	const { ctx, cfg } = params;
	const audioConfig = cfg.tools?.media?.audio;
	if (!audioConfig || audioConfig.enabled === false) return;
	const attachments = normalizeMediaAttachments(ctx);
	if (!attachments || attachments.length === 0) return;
	const firstAudio = attachments.find((att) => att && isAudioAttachment(att) && !att.alreadyTranscribed);
	if (!firstAudio) return;
	if (shouldLogVerbose()) logVerbose(`audio-preflight: transcribing attachment ${firstAudio.index} for mention check`);
	const providerRegistry = buildProviderRegistry(params.providers);
	const cache = createMediaAttachmentCache(attachments);
	try {
		const result = await runCapability({
			capability: "audio",
			cfg,
			ctx,
			attachments: cache,
			media: attachments,
			agentDir: params.agentDir,
			providerRegistry,
			config: audioConfig,
			activeModel: params.activeModel
		});
		if (!result || result.outputs.length === 0) return;
		const audioOutput = result.outputs.find((output) => output.kind === "audio.transcription");
		if (!audioOutput || !audioOutput.text) return;
		firstAudio.alreadyTranscribed = true;
		if (shouldLogVerbose()) logVerbose(`audio-preflight: transcribed ${audioOutput.text.length} chars from attachment ${firstAudio.index}`);
		return audioOutput.text;
	} catch (err) {
		if (shouldLogVerbose()) logVerbose(`audio-preflight: transcription failed: ${String(err)}`);
		return;
	} finally {
		await cache.cleanup();
	}
}

//#endregion
export { transcribeFirstAudio };