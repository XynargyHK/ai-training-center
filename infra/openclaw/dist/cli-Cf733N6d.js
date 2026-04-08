import "./paths-B4BZAPZh.js";
import "./utils-CFnnyoTP.js";
import "./thinking-EAliFiVK.js";
import { kt as loadOpenClawPlugins } from "./reply-oSe13ewW.js";
import "./registry-D74-I5q-.js";
import { t as createSubsystemLogger } from "./subsystem-oVAQxyhr.js";
import "./exec-i2CMvUxK.js";
import { c as resolveDefaultAgentId, s as resolveAgentWorkspaceDir } from "./agent-scope-CrP-i2MF.js";
import "./model-selection-CqXyRThV.js";
import "./github-copilot-token-D2zp6kMZ.js";
import "./boolean-BsqeuxE6.js";
import "./env-BV0iTNjd.js";
import { i as loadConfig } from "./config-F0Q6PyfW.js";
import "./manifest-registry-DoaWeDHN.js";
import "./runner-CtkNTG0l.js";
import "./image-DIIFeXgf.js";
import "./models-config-Bte9XHxc.js";
import "./pi-model-discovery-DaNAekda.js";
import "./pi-embedded-helpers-DNjTU6_I.js";
import "./sandbox-DEFCexaq.js";
import "./chrome-DuvmuAVy.js";
import "./tailscale-B2RP0O39.js";
import "./auth-Kz-t4hed.js";
import "./server-context-lJCfpccv.js";
import "./frontmatter-DrdSsH4-.js";
import "./skills-BCkGHN5q.js";
import "./routes-DJNVqbMy.js";
import "./redact-CjJyQlVU.js";
import "./errors-CdJjJ1Jq.js";
import "./paths-CWc9mjAN.js";
import "./ssrf-Bhv0qRd-.js";
import "./image-ops-ib1_UDIa.js";
import "./store-CHQKN-y-.js";
import "./ports-Dru7vIR6.js";
import "./trash-DhlImRqi.js";
import "./message-channel-B11syIWY.js";
import "./sessions-CHz-yoEe.js";
import "./dock-Bdl338Dx.js";
import "./accounts-BWv_S14y.js";
import "./normalize-C23emibo.js";
import "./accounts-FP3Dx3m5.js";
import "./accounts-CgV6POP2.js";
import "./bindings-CssSUqXx.js";
import "./logging-D3KTM1pH.js";
import "./send-QSP-aBY1.js";
import "./plugins-MECKrdj4.js";
import "./send-CAzpVpjf.js";
import "./paths-gjLMn4eA.js";
import "./tool-images-jk50s7DI.js";
import "./tool-display-BRqP7S2f.js";
import "./fetch-guard-fVA6JVFp.js";
import "./api-key-rotation-DR11cCtW.js";
import "./fetch-DlQT4W4E.js";
import "./model-catalog-B0-YH7XM.js";
import "./tokens-sV_zGSb7.js";
import "./with-timeout-CrJpIPCq.js";
import "./deliver-B1N4QPj7.js";
import "./diagnostic-B81gAc3S.js";
import "./diagnostic-session-state-d6bm-JJd.js";
import "./send-LkrQUW5e.js";
import "./model-Br9l2OSe.js";
import "./reply-prefix-Dk5Tb9So.js";
import "./memory-cli-BdWf9WeK.js";
import "./manager-JQDuyylL.js";
import "./sqlite-DWNRhtfU.js";
import "./retry-CsJdgSl0.js";
import "./common-CmR0t2Y-.js";
import "./chunk-DcqcJHjP.js";
import "./markdown-tables-CQQzFscn.js";
import "./ir-CPmg2HMv.js";
import "./render-CXDO_kgw.js";
import "./commands-registry-CjcFAgGO.js";
import "./client-z7qQOWgJ.js";
import "./call-UGOrZHFc.js";
import "./channel-activity-4gYIj57z.js";
import "./fetch-D_cxmFbk.js";
import "./tables-BJY31-CG.js";
import "./send-B_vZrn0h.js";
import "./pairing-store-CsSXI6EC.js";
import "./proxy-bT3c25cJ.js";
import "./links-C8IJn_HH.js";
import "./cli-utils-BqMwAlgf.js";
import "./help-format-BwCqDl6O.js";
import "./progress-By07Lltm.js";
import "./resolve-route-CMiOzrE9.js";
import "./replies-CugbfuWa.js";
import "./skill-commands-CLVv4uiZ.js";
import "./workspace-dirs-CcREWmBd.js";
import "./pi-tools.policy-dtMy2j5O.js";
import "./send-B3ztcjJe.js";
import "./onboard-helpers-BClizJPp.js";
import "./prompt-style-K932lPCL.js";
import "./outbound-attachment-CO0tbY9_.js";
import "./pairing-labels-DvVTrpil.js";
import "./session-cost-usage-C72DlXmh.js";
import "./nodes-screen-BVo2a8We.js";
import "./control-service-DjL3VC7s.js";
import "./stagger-xzJwPnK6.js";
import "./channel-selection-z5hlR27m.js";
import "./delivery-queue-fx8E3HqU.js";

//#region src/plugins/cli.ts
const log = createSubsystemLogger("plugins");
function registerPluginCliCommands(program, cfg) {
	const config = cfg ?? loadConfig();
	const workspaceDir = resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	const logger = {
		info: (msg) => log.info(msg),
		warn: (msg) => log.warn(msg),
		error: (msg) => log.error(msg),
		debug: (msg) => log.debug(msg)
	};
	const registry = loadOpenClawPlugins({
		config,
		workspaceDir,
		logger
	});
	const existingCommands = new Set(program.commands.map((cmd) => cmd.name()));
	for (const entry of registry.cliRegistrars) {
		if (entry.commands.length > 0) {
			const overlaps = entry.commands.filter((command) => existingCommands.has(command));
			if (overlaps.length > 0) {
				log.debug(`plugin CLI register skipped (${entry.pluginId}): command already registered (${overlaps.join(", ")})`);
				continue;
			}
		}
		try {
			const result = entry.register({
				program,
				config,
				workspaceDir,
				logger
			});
			if (result && typeof result.then === "function") result.catch((err) => {
				log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
			});
			for (const command of entry.commands) existingCommands.add(command);
		} catch (err) {
			log.warn(`plugin CLI register failed (${entry.pluginId}): ${String(err)}`);
		}
	}
}

//#endregion
export { registerPluginCliCommands };