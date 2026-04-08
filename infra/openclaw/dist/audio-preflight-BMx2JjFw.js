import "./paths-CkkDESQ2.js";
import { X as shouldLogVerbose, q as logVerbose } from "./registry-BVeYESaO.js";
import "./agent-scope-C7eW-ntH.js";
import "./subsystem-D5Ceunbp.js";
import "./exec-Bx7QVAB1.js";
import "./workspace-yaPyeH-7.js";
import "./accounts-BScLsshE.js";
import "./normalize-CBJSRI13.js";
import "./boolean-CE7i9tBR.js";
import "./env-Dxd9mJn7.js";
import "./bindings-BPV5W4ZI.js";
import "./plugins-DSZtXzTw.js";
import "./accounts-Cw-VBrQm.js";
import "./image-ops-CjLvw22Q.js";
import "./model-auth-XLztKWJW.js";
import "./github-copilot-token-Cxe2rXZ6.js";
import "./pi-model-discovery-DIA4gIzW.js";
import "./message-channel-cdJiiX-Z.js";
import "./pi-embedded-helpers-Bn983kLW.js";
import "./config-BNjb0X52.js";
import "./manifest-registry-O6kIoFpa.js";
import "./chrome-B4TkRag4.js";
import "./frontmatter-B82dKz9V.js";
import "./skills-CUSbMCKQ.js";
import "./redact-9hYpOXID.js";
import "./errors-pj0CRkCB.js";
import "./store-ugiSLvrA.js";
import "./thinking-DRMTMy-D.js";
import "./accounts-hscXw7_x.js";
import "./paths-B4zRLe0K.js";
import "./tool-images-DuFuIO-E.js";
import "./image-Dww8bcWM.js";
import "./gemini-auth-BYm97Nj7.js";
import "./fetch-DOaGQfSg.js";
import { a as runCapability, l as isAudioAttachment, n as createMediaAttachmentCache, r as normalizeMediaAttachments, t as buildProviderRegistry } from "./runner-Cg70cGAY.js";

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