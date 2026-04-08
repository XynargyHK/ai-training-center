import "./paths-CkkDESQ2.js";
import "./registry-BVeYESaO.js";
import { c as resolveDefaultAgentId, r as resolveAgentDir, s as resolveAgentWorkspaceDir } from "./agent-scope-C7eW-ntH.js";
import "./subsystem-D5Ceunbp.js";
import "./exec-Bx7QVAB1.js";
import "./workspace-yaPyeH-7.js";
import "./tokens-OrzXQ-4r.js";
import { t as runEmbeddedPiAgent } from "./pi-embedded-D8n0vmxL.js";
import "./accounts-BScLsshE.js";
import "./normalize-CBJSRI13.js";
import "./boolean-CE7i9tBR.js";
import "./env-Dxd9mJn7.js";
import "./bindings-BPV5W4ZI.js";
import "./send-D0SAMQ1Z.js";
import "./plugins-DSZtXzTw.js";
import "./send-BwmoncfZ.js";
import "./deliver-CHEVUMg8.js";
import "./diagnostic-Chq55ucO.js";
import "./diagnostic-session-state-C1vRJs5w.js";
import "./accounts-Cw-VBrQm.js";
import "./send-jxA1TeNr.js";
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
import "./reply-prefix-Gu2ZyBJA.js";
import "./manager-BAb3-ZSw.js";
import "./gemini-auth-BYm97Nj7.js";
import "./sqlite-DBTu4LtV.js";
import "./retry-DgcNb435.js";
import "./common-C2SpRyOM.js";
import "./chunk-CnS1_mOr.js";
import "./markdown-tables-DjjJavbM.js";
import "./fetch-DOaGQfSg.js";
import "./ir-BwD9kRy7.js";
import "./render-DwEu-aCr.js";
import "./commands-registry-yDgpybLt.js";
import "./runner-Cg70cGAY.js";
import "./skill-commands-DsSH9W9O.js";
import "./fetch-BBkSX75a.js";
import "./send-DDU01FQx.js";
import "./outbound-attachment-qBfaVH2h.js";
import "./send-BYB8fOBI.js";
import "./resolve-route-CFaGeYIT.js";
import "./channel-activity-C1Xw_p45.js";
import "./tables-CteEQMT9.js";
import "./proxy-DVy9foH0.js";
import "./replies-DuNDb_If.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

//#region src/hooks/llm-slug-generator.ts
/**
* LLM-based slug generator for session memory filenames
*/
/**
* Generate a short 1-2 word filename slug from session content using LLM
*/
async function generateSlugViaLLM(params) {
	let tempSessionFile = null;
	try {
		const agentId = resolveDefaultAgentId(params.cfg);
		const workspaceDir = resolveAgentWorkspaceDir(params.cfg, agentId);
		const agentDir = resolveAgentDir(params.cfg, agentId);
		const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-slug-"));
		tempSessionFile = path.join(tempDir, "session.jsonl");
		const prompt = `Based on this conversation, generate a short 1-2 word filename slug (lowercase, hyphen-separated, no file extension).

Conversation summary:
${params.sessionContent.slice(0, 2e3)}

Reply with ONLY the slug, nothing else. Examples: "vendor-pitch", "api-design", "bug-fix"`;
		const result = await runEmbeddedPiAgent({
			sessionId: `slug-generator-${Date.now()}`,
			sessionKey: "temp:slug-generator",
			agentId,
			sessionFile: tempSessionFile,
			workspaceDir,
			agentDir,
			config: params.cfg,
			prompt,
			timeoutMs: 15e3,
			runId: `slug-gen-${Date.now()}`
		});
		if (result.payloads && result.payloads.length > 0) {
			const text = result.payloads[0]?.text;
			if (text) return text.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || null;
		}
		return null;
	} catch (err) {
		console.error("[llm-slug-generator] Failed to generate slug:", err);
		return null;
	} finally {
		if (tempSessionFile) try {
			await fs.rm(path.dirname(tempSessionFile), {
				recursive: true,
				force: true
			});
		} catch {}
	}
}

//#endregion
export { generateSlugViaLLM };