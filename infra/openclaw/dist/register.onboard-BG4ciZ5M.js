import "./paths-B4BZAPZh.js";
import { B as theme } from "./utils-CFnnyoTP.js";
import "./thinking-EAliFiVK.js";
import "./reply-oSe13ewW.js";
import "./registry-D74-I5q-.js";
import { f as defaultRuntime } from "./subsystem-oVAQxyhr.js";
import "./exec-i2CMvUxK.js";
import "./agent-scope-CrP-i2MF.js";
import "./model-selection-CqXyRThV.js";
import "./github-copilot-token-D2zp6kMZ.js";
import "./boolean-BsqeuxE6.js";
import "./env-BV0iTNjd.js";
import "./config-F0Q6PyfW.js";
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
import { t as formatDocsLink } from "./links-C8IJn_HH.js";
import { n as runCommandWithRuntime } from "./cli-utils-BqMwAlgf.js";
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
import "./runtime-guard-DLhZHmF6.js";
import "./note-B83Ff5IJ.js";
import "./clack-prompter-DUSORdwR.js";
import "./daemon-runtime-BBz9R8ay.js";
import "./systemd-DRtbohgw.js";
import "./service-UaLMhkKk.js";
import "./health-D6v69hUF.js";
import "./onboarding-B7IbiVQq.js";
import "./shared-JgVAtphM.js";
import "./auth-token-UHqYNb79.js";
import "./logging-9hXqNouw.js";
import { n as formatAuthChoiceChoicesForCli } from "./auth-choice-options-DKI-rxJz.js";
import "./openai-model-default-DIiuA-hW.js";
import "./vllm-setup-BE2F2Ktw.js";
import "./systemd-linger-CAAw6aDS.js";
import "./model-picker-hWi4Z_bB.js";
import "./onboard-custom-Av7o3zqQ.js";
import { n as ONBOARD_PROVIDER_AUTH_FLAGS, t as onboardCommand } from "./onboard-BTCbwPXT.js";

//#region src/cli/program/register.onboard.ts
function resolveInstallDaemonFlag(command, opts) {
	if (!command || typeof command !== "object") return;
	const getOptionValueSource = "getOptionValueSource" in command ? command.getOptionValueSource : void 0;
	if (typeof getOptionValueSource !== "function") return;
	if (getOptionValueSource.call(command, "skipDaemon") === "cli") return false;
	if (getOptionValueSource.call(command, "installDaemon") === "cli") return Boolean(opts.installDaemon);
}
const AUTH_CHOICE_HELP = formatAuthChoiceChoicesForCli({
	includeLegacyAliases: true,
	includeSkip: true
});
function registerOnboardCommand(program) {
	const command = program.command("onboard").description("Interactive wizard to set up the gateway, workspace, and skills").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/onboard", "docs.openclaw.ai/cli/onboard")}\n`).option("--workspace <dir>", "Agent workspace directory (default: ~/.openclaw/workspace)").option("--reset", "Reset config + credentials + sessions + workspace before running wizard").option("--non-interactive", "Run without prompts", false).option("--accept-risk", "Acknowledge that agents are powerful and full system access is risky (required for --non-interactive)", false).option("--flow <flow>", "Wizard flow: quickstart|advanced|manual").option("--mode <mode>", "Wizard mode: local|remote").option("--auth-choice <choice>", `Auth: ${AUTH_CHOICE_HELP}`).option("--token-provider <id>", "Token provider id (non-interactive; used with --auth-choice token)").option("--token <token>", "Token value (non-interactive; used with --auth-choice token)").option("--token-profile-id <id>", "Auth profile id (non-interactive; default: <provider>:manual)").option("--token-expires-in <duration>", "Optional token expiry duration (e.g. 365d, 12h)").option("--cloudflare-ai-gateway-account-id <id>", "Cloudflare Account ID").option("--cloudflare-ai-gateway-gateway-id <id>", "Cloudflare AI Gateway ID");
	for (const providerFlag of ONBOARD_PROVIDER_AUTH_FLAGS) command.option(providerFlag.cliOption, providerFlag.description);
	command.option("--custom-base-url <url>", "Custom provider base URL").option("--custom-api-key <key>", "Custom provider API key (optional)").option("--custom-model-id <id>", "Custom provider model ID").option("--custom-provider-id <id>", "Custom provider ID (optional; auto-derived by default)").option("--custom-compatibility <mode>", "Custom provider API compatibility: openai|anthropic (default: openai)").option("--gateway-port <port>", "Gateway port").option("--gateway-bind <mode>", "Gateway bind: loopback|tailnet|lan|auto|custom").option("--gateway-auth <mode>", "Gateway auth: token|password").option("--gateway-token <token>", "Gateway token (token auth)").option("--gateway-password <password>", "Gateway password (password auth)").option("--remote-url <url>", "Remote Gateway WebSocket URL").option("--remote-token <token>", "Remote Gateway token (optional)").option("--tailscale <mode>", "Tailscale: off|serve|funnel").option("--tailscale-reset-on-exit", "Reset tailscale serve/funnel on exit").option("--install-daemon", "Install gateway service").option("--no-install-daemon", "Skip gateway service install").option("--skip-daemon", "Skip gateway service install").option("--daemon-runtime <runtime>", "Daemon runtime: node|bun").option("--skip-channels", "Skip channel setup").option("--skip-skills", "Skip skills setup").option("--skip-health", "Skip health check").option("--skip-ui", "Skip Control UI/TUI prompts").option("--node-manager <name>", "Node manager for skills: npm|pnpm|bun").option("--json", "Output JSON summary", false);
	command.action(async (opts, commandRuntime) => {
		await runCommandWithRuntime(defaultRuntime, async () => {
			const installDaemon = resolveInstallDaemonFlag(commandRuntime, { installDaemon: Boolean(opts.installDaemon) });
			const gatewayPort = typeof opts.gatewayPort === "string" ? Number.parseInt(opts.gatewayPort, 10) : void 0;
			await onboardCommand({
				workspace: opts.workspace,
				nonInteractive: Boolean(opts.nonInteractive),
				acceptRisk: Boolean(opts.acceptRisk),
				flow: opts.flow,
				mode: opts.mode,
				authChoice: opts.authChoice,
				tokenProvider: opts.tokenProvider,
				token: opts.token,
				tokenProfileId: opts.tokenProfileId,
				tokenExpiresIn: opts.tokenExpiresIn,
				anthropicApiKey: opts.anthropicApiKey,
				openaiApiKey: opts.openaiApiKey,
				openrouterApiKey: opts.openrouterApiKey,
				aiGatewayApiKey: opts.aiGatewayApiKey,
				cloudflareAiGatewayAccountId: opts.cloudflareAiGatewayAccountId,
				cloudflareAiGatewayGatewayId: opts.cloudflareAiGatewayGatewayId,
				cloudflareAiGatewayApiKey: opts.cloudflareAiGatewayApiKey,
				moonshotApiKey: opts.moonshotApiKey,
				kimiCodeApiKey: opts.kimiCodeApiKey,
				geminiApiKey: opts.geminiApiKey,
				zaiApiKey: opts.zaiApiKey,
				xiaomiApiKey: opts.xiaomiApiKey,
				qianfanApiKey: opts.qianfanApiKey,
				minimaxApiKey: opts.minimaxApiKey,
				syntheticApiKey: opts.syntheticApiKey,
				veniceApiKey: opts.veniceApiKey,
				togetherApiKey: opts.togetherApiKey,
				huggingfaceApiKey: opts.huggingfaceApiKey,
				opencodeZenApiKey: opts.opencodeZenApiKey,
				xaiApiKey: opts.xaiApiKey,
				litellmApiKey: opts.litellmApiKey,
				customBaseUrl: opts.customBaseUrl,
				customApiKey: opts.customApiKey,
				customModelId: opts.customModelId,
				customProviderId: opts.customProviderId,
				customCompatibility: opts.customCompatibility,
				gatewayPort: typeof gatewayPort === "number" && Number.isFinite(gatewayPort) ? gatewayPort : void 0,
				gatewayBind: opts.gatewayBind,
				gatewayAuth: opts.gatewayAuth,
				gatewayToken: opts.gatewayToken,
				gatewayPassword: opts.gatewayPassword,
				remoteUrl: opts.remoteUrl,
				remoteToken: opts.remoteToken,
				tailscale: opts.tailscale,
				tailscaleResetOnExit: Boolean(opts.tailscaleResetOnExit),
				reset: Boolean(opts.reset),
				installDaemon,
				daemonRuntime: opts.daemonRuntime,
				skipChannels: Boolean(opts.skipChannels),
				skipSkills: Boolean(opts.skipSkills),
				skipHealth: Boolean(opts.skipHealth),
				skipUi: Boolean(opts.skipUi),
				nodeManager: opts.nodeManager,
				json: Boolean(opts.json)
			}, defaultRuntime);
		});
	});
}

//#endregion
export { registerOnboardCommand };