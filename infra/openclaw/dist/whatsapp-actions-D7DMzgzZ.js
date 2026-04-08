import "./paths-CkkDESQ2.js";
import "./registry-BVeYESaO.js";
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
import "./image-ops-CjLvw22Q.js";
import "./model-auth-XLztKWJW.js";
import "./github-copilot-token-Cxe2rXZ6.js";
import "./message-channel-cdJiiX-Z.js";
import "./config-BNjb0X52.js";
import "./manifest-registry-O6kIoFpa.js";
import "./tool-images-DuFuIO-E.js";
import { i as jsonResult, l as readStringParam, o as readReactionParams, t as createActionGate } from "./common-C2SpRyOM.js";
import "./chunk-CnS1_mOr.js";
import "./markdown-tables-DjjJavbM.js";
import "./fetch-DOaGQfSg.js";
import "./ir-BwD9kRy7.js";
import "./render-DwEu-aCr.js";
import "./tables-CteEQMT9.js";
import { r as sendReactionWhatsApp } from "./outbound-hAFpPUxX.js";

//#region src/agents/tools/whatsapp-actions.ts
async function handleWhatsAppAction(params, cfg) {
	const action = readStringParam(params, "action", { required: true });
	const isActionEnabled = createActionGate(cfg.channels?.whatsapp?.actions);
	if (action === "react") {
		if (!isActionEnabled("reactions")) throw new Error("WhatsApp reactions are disabled.");
		const chatJid = readStringParam(params, "chatJid", { required: true });
		const messageId = readStringParam(params, "messageId", { required: true });
		const { emoji, remove, isEmpty } = readReactionParams(params, { removeErrorMessage: "Emoji is required to remove a WhatsApp reaction." });
		const participant = readStringParam(params, "participant");
		const accountId = readStringParam(params, "accountId");
		const fromMeRaw = params.fromMe;
		await sendReactionWhatsApp(chatJid, messageId, remove ? "" : emoji, {
			verbose: false,
			fromMe: typeof fromMeRaw === "boolean" ? fromMeRaw : void 0,
			participant: participant ?? void 0,
			accountId: accountId ?? void 0
		});
		if (!remove && !isEmpty) return jsonResult({
			ok: true,
			added: emoji
		});
		return jsonResult({
			ok: true,
			removed: true
		});
	}
	throw new Error(`Unsupported WhatsApp action: ${action}`);
}

//#endregion
export { handleWhatsAppAction };