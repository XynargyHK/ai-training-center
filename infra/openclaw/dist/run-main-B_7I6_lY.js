import { _ as defaultRuntime, an as getPrimaryCommand, c as enableConsoleCapture, cn as hasHelpOrVersion, en as normalizeWindowsArgv, i as normalizeEnv, in as getPositiveIntFlagValue, n as isTruthyEnvValue, nn as getCommandPath, on as getVerboseFlag, rn as getFlagValue, sn as hasFlag } from "./entry.js";
import "./auth-profiles-Cn5oo5Dj.js";
import "./exec-CBKBIMpA.js";
import "./agent-scope-F21xRiu_.js";
import "./github-copilot-token-DuFIqfeC.js";
import "./model-CAOd95Vl.js";
import "./pi-model-discovery-Do3xMEtM.js";
import "./frontmatter-DRl3Sa-X.js";
import "./skills-BDAyXEfy.js";
import "./manifest-registry-CYUiqtAr.js";
import { L as VERSION, R as loadDotEnv } from "./config-CQx0LPGX.js";
import "./client-B0TEt50q.js";
import "./call-DETrZKco.js";
import "./message-channel-B9mgJ1nn.js";
import "./subagent-registry-DN6TUJw4.js";
import "./sessions-cLfvirnw.js";
import "./tokens-MGcNqlE_.js";
import "./accounts-BSDGn_Eo.js";
import "./normalize-BOd1bq0W.js";
import "./bindings-D1UzUf2-.js";
import "./logging-CcxUDNcI.js";
import "./send-B3cNBurL.js";
import "./plugins-skOiRwEk.js";
import "./send-YkE1T1ys.js";
import "./with-timeout-qnpLqckm.js";
import "./deliver-CkuuwqYG.js";
import "./diagnostic-CBjdyWIE.js";
import "./diagnostic-session-state-DqgfGYqZ.js";
import "./accounts-Cavy4S5h.js";
import "./send-C1DPz5bm.js";
import "./image-ops-DOCAfk8A.js";
import "./pi-embedded-helpers-BKS_5Gh6.js";
import "./sandbox-DOMEmZAG.js";
import "./chrome-BjOblpOF.js";
import "./tailscale-ByXUFHKh.js";
import "./auth-QhLPyF5J.js";
import "./server-context-BEuO2lgK.js";
import "./routes-ChQCcH6s.js";
import "./redact-BHDVlHmj.js";
import { r as formatUncaughtError } from "./errors-BtWNsPzQ.js";
import "./paths-DGpfJD4j.js";
import "./ssrf-MofQSeTB.js";
import "./store-DM25NjFE.js";
import "./ports-B-sNNAH_.js";
import "./trash-CkoTsduV.js";
import "./dock-BoYjClAF.js";
import "./accounts-CYoNNt2n.js";
import "./paths-CJeHSIux.js";
import "./tool-images-D6c_0ySf.js";
import "./thinking-BMF5Lj9k.js";
import "./models-config-QXP5sEUp.js";
import "./reply-prefix-D0pmm6mE.js";
import "./memory-cli-CIekPqKj.js";
import "./manager-y6B5FtH_.js";
import "./gemini-auth-Btd_r0sl.js";
import "./sqlite-D5NWcoFL.js";
import "./retry-BqINXZ-d.js";
import "./common-CqPpwLxe.js";
import "./chunk-CSqoZaa2.js";
import "./markdown-tables-C-U6wHaa.js";
import "./fetch-guard-CFsdMv4v.js";
import "./fetch-zMf2in8v.js";
import "./ir-DrrI_z93.js";
import "./render-BvFSFJZW.js";
import "./commands-registry-D7DNJSuh.js";
import "./image-ecroz6qY.js";
import "./tool-display-VGkGf5S9.js";
import { c as installUnhandledRejectionHandler } from "./runner-CIcjU-JD.js";
import "./model-catalog-d5K0907t.js";
import "./session-utils-BRFnL9HI.js";
import "./skill-commands-CwUsNtLP.js";
import "./workspace-dirs-DbV1rwga.js";
import "./pairing-store-CWbTPkUY.js";
import "./fetch-RhTQDQbf.js";
import "./nodes-screen-DcirdJP7.js";
import "./session-cost-usage-BR5wNTCV.js";
import "./control-service-Mf7xI3KO.js";
import "./stagger-BCQzFuQi.js";
import "./channel-selection-CZ7KSohZ.js";
import "./send-G_j90bUr.js";
import "./outbound-attachment-DUd64aSq.js";
import "./delivery-queue-BTFZ_82k.js";
import "./send-El1OFyDw.js";
import "./resolve-route-tL4VOGBX.js";
import "./channel-activity-DmCSK7Gk.js";
import "./tables-BEnNqdOL.js";
import "./proxy-1gf4gtkD.js";
import "./links-rnbUL9h5.js";
import "./cli-utils-f9j-_1VT.js";
import "./help-format-5GFCgEVf.js";
import "./progress-Clpi3Ckj.js";
import "./replies-By_6vjNK.js";
import "./pi-tools.policy-BEtFxTGS.js";
import "./onboard-helpers-Wi2a0F-c.js";
import "./prompt-style-B_yUCLn4.js";
import "./pairing-labels-3nsEq_HC.js";
import { t as ensureOpenClawCliOnPath } from "./path-env-C6L51Z2a.js";
import "./catalog-DrXj_7vG.js";
import "./note-3kkap1pu.js";
import "./plugin-auto-enable-C-zE_nz9.js";
import { t as ensurePluginRegistryLoaded } from "./plugin-registry-DV7dsm80.js";
import { t as assertSupportedRuntime } from "./runtime-guard-kzIyHhvr.js";
import { t as emitCliBanner } from "./banner-CD_kfxWw.js";
import "./doctor-config-flow-B-sydP6S.js";
import { n as ensureConfigReady } from "./config-guard-s0ZS_rNK.js";
import process$1 from "node:process";
import { fileURLToPath } from "node:url";

//#region src/cli/program/routes.ts
const routeHealth = {
	match: (path) => path[0] === "health",
	loadPlugins: true,
	run: async (argv) => {
		const json = hasFlag(argv, "--json");
		const verbose = getVerboseFlag(argv, { includeDebug: true });
		const timeoutMs = getPositiveIntFlagValue(argv, "--timeout");
		if (timeoutMs === null) return false;
		const { healthCommand } = await import("./health-B-qxkTBH.js").then((n) => n.i);
		await healthCommand({
			json,
			timeoutMs,
			verbose
		}, defaultRuntime);
		return true;
	}
};
const routeStatus = {
	match: (path) => path[0] === "status",
	loadPlugins: true,
	run: async (argv) => {
		const json = hasFlag(argv, "--json");
		const deep = hasFlag(argv, "--deep");
		const all = hasFlag(argv, "--all");
		const usage = hasFlag(argv, "--usage");
		const verbose = getVerboseFlag(argv, { includeDebug: true });
		const timeoutMs = getPositiveIntFlagValue(argv, "--timeout");
		if (timeoutMs === null) return false;
		const { statusCommand } = await import("./status-B2wE-vYz.js").then((n) => n.t);
		await statusCommand({
			json,
			deep,
			all,
			usage,
			timeoutMs,
			verbose
		}, defaultRuntime);
		return true;
	}
};
const routeSessions = {
	match: (path) => path[0] === "sessions",
	run: async (argv) => {
		const json = hasFlag(argv, "--json");
		const store = getFlagValue(argv, "--store");
		if (store === null) return false;
		const active = getFlagValue(argv, "--active");
		if (active === null) return false;
		const { sessionsCommand } = await import("./sessions-e1nRESTz.js").then((n) => n.n);
		await sessionsCommand({
			json,
			store,
			active
		}, defaultRuntime);
		return true;
	}
};
const routeAgentsList = {
	match: (path) => path[0] === "agents" && path[1] === "list",
	run: async (argv) => {
		const json = hasFlag(argv, "--json");
		const bindings = hasFlag(argv, "--bindings");
		const { agentsListCommand } = await import("./agents-QkkdhU7I.js").then((n) => n.t);
		await agentsListCommand({
			json,
			bindings
		}, defaultRuntime);
		return true;
	}
};
const routeMemoryStatus = {
	match: (path) => path[0] === "memory" && path[1] === "status",
	run: async (argv) => {
		const agent = getFlagValue(argv, "--agent");
		if (agent === null) return false;
		const json = hasFlag(argv, "--json");
		const deep = hasFlag(argv, "--deep");
		const index = hasFlag(argv, "--index");
		const verbose = hasFlag(argv, "--verbose");
		const { runMemoryStatus } = await import("./memory-cli-CIekPqKj.js").then((n) => n.t);
		await runMemoryStatus({
			agent,
			json,
			deep,
			index,
			verbose
		});
		return true;
	}
};
function getCommandPositionals(argv) {
	const out = [];
	const args = argv.slice(2);
	for (const arg of args) {
		if (!arg || arg === "--") break;
		if (arg.startsWith("-")) continue;
		out.push(arg);
	}
	return out;
}
function getFlagValues(argv, name) {
	const values = [];
	const args = argv.slice(2);
	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (!arg || arg === "--") break;
		if (arg === name) {
			const next = args[i + 1];
			if (!next || next === "--" || next.startsWith("-")) return null;
			values.push(next);
			i += 1;
			continue;
		}
		if (arg.startsWith(`${name}=`)) {
			const value = arg.slice(name.length + 1).trim();
			if (!value) return null;
			values.push(value);
		}
	}
	return values;
}
const routes = [
	routeHealth,
	routeStatus,
	routeSessions,
	routeAgentsList,
	routeMemoryStatus,
	{
		match: (path) => path[0] === "config" && path[1] === "get",
		run: async (argv) => {
			const pathArg = getCommandPositionals(argv)[2];
			if (!pathArg) return false;
			const json = hasFlag(argv, "--json");
			const { runConfigGet } = await import("./config-cli-CTOxHczl.js");
			await runConfigGet({
				path: pathArg,
				json
			});
			return true;
		}
	},
	{
		match: (path) => path[0] === "config" && path[1] === "unset",
		run: async (argv) => {
			const pathArg = getCommandPositionals(argv)[2];
			if (!pathArg) return false;
			const { runConfigUnset } = await import("./config-cli-CTOxHczl.js");
			await runConfigUnset({ path: pathArg });
			return true;
		}
	},
	{
		match: (path) => path[0] === "models" && path[1] === "list",
		run: async (argv) => {
			const provider = getFlagValue(argv, "--provider");
			if (provider === null) return false;
			const all = hasFlag(argv, "--all");
			const local = hasFlag(argv, "--local");
			const json = hasFlag(argv, "--json");
			const plain = hasFlag(argv, "--plain");
			const { modelsListCommand } = await import("./models-B6A_4eIA.js").then((n) => n.t);
			await modelsListCommand({
				all,
				local,
				provider,
				json,
				plain
			}, defaultRuntime);
			return true;
		}
	},
	{
		match: (path) => path[0] === "models" && path[1] === "status",
		run: async (argv) => {
			const probeProvider = getFlagValue(argv, "--probe-provider");
			if (probeProvider === null) return false;
			const probeTimeout = getFlagValue(argv, "--probe-timeout");
			if (probeTimeout === null) return false;
			const probeConcurrency = getFlagValue(argv, "--probe-concurrency");
			if (probeConcurrency === null) return false;
			const probeMaxTokens = getFlagValue(argv, "--probe-max-tokens");
			if (probeMaxTokens === null) return false;
			const agent = getFlagValue(argv, "--agent");
			if (agent === null) return false;
			const probeProfileValues = getFlagValues(argv, "--probe-profile");
			if (probeProfileValues === null) return false;
			const probeProfile = probeProfileValues.length === 0 ? void 0 : probeProfileValues.length === 1 ? probeProfileValues[0] : probeProfileValues;
			const json = hasFlag(argv, "--json");
			const plain = hasFlag(argv, "--plain");
			const check = hasFlag(argv, "--check");
			const probe = hasFlag(argv, "--probe");
			const { modelsStatusCommand } = await import("./models-B6A_4eIA.js").then((n) => n.t);
			await modelsStatusCommand({
				json,
				plain,
				check,
				probe,
				probeProvider,
				probeProfile,
				probeTimeout,
				probeConcurrency,
				probeMaxTokens,
				agent
			}, defaultRuntime);
			return true;
		}
	}
];
function findRoutedCommand(path) {
	for (const route of routes) if (route.match(path)) return route;
	return null;
}

//#endregion
//#region src/cli/route.ts
async function prepareRoutedCommand(params) {
	emitCliBanner(VERSION, { argv: params.argv });
	await ensureConfigReady({
		runtime: defaultRuntime,
		commandPath: params.commandPath
	});
	if (params.loadPlugins) ensurePluginRegistryLoaded();
}
async function tryRouteCli(argv) {
	if (isTruthyEnvValue(process.env.OPENCLAW_DISABLE_ROUTE_FIRST)) return false;
	if (hasHelpOrVersion(argv)) return false;
	const path = getCommandPath(argv, 2);
	if (!path[0]) return false;
	const route = findRoutedCommand(path);
	if (!route) return false;
	await prepareRoutedCommand({
		argv,
		commandPath: path,
		loadPlugins: route.loadPlugins
	});
	return route.run(argv);
}

//#endregion
//#region src/cli/run-main.ts
function rewriteUpdateFlagArgv(argv) {
	const index = argv.indexOf("--update");
	if (index === -1) return argv;
	const next = [...argv];
	next.splice(index, 1, "update");
	return next;
}
function shouldSkipPluginCommandRegistration(params) {
	if (params.hasBuiltinPrimary) return true;
	if (!params.primary) return hasHelpOrVersion(params.argv);
	return false;
}
function shouldEnsureCliPath(argv) {
	if (hasHelpOrVersion(argv)) return false;
	const [primary, secondary] = getCommandPath(argv, 2);
	if (!primary) return true;
	if (primary === "status" || primary === "health" || primary === "sessions") return false;
	if (primary === "config" && (secondary === "get" || secondary === "unset")) return false;
	if (primary === "models" && (secondary === "list" || secondary === "status")) return false;
	return true;
}
async function runCli(argv = process$1.argv) {
	const normalizedArgv = normalizeWindowsArgv(argv);
	loadDotEnv({ quiet: true });
	normalizeEnv();
	if (shouldEnsureCliPath(normalizedArgv)) ensureOpenClawCliOnPath();
	assertSupportedRuntime();
	if (await tryRouteCli(normalizedArgv)) return;
	enableConsoleCapture();
	const { buildProgram } = await import("./program-Bcd9I-eU.js");
	const program = buildProgram();
	installUnhandledRejectionHandler();
	process$1.on("uncaughtException", (error) => {
		console.error("[openclaw] Uncaught exception:", formatUncaughtError(error));
		process$1.exit(1);
	});
	const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
	const primary = getPrimaryCommand(parseArgv);
	if (primary) {
		const { getProgramContext } = await import("./program-context-Ccaxp4DE.js").then((n) => n.n);
		const ctx = getProgramContext(program);
		if (ctx) {
			const { registerCoreCliByName } = await import("./command-registry-BQqvjyWT.js").then((n) => n.t);
			await registerCoreCliByName(program, ctx, primary, parseArgv);
		}
		const { registerSubCliByName } = await import("./register.subclis-COKbecz0.js").then((n) => n.a);
		await registerSubCliByName(program, primary);
	}
	if (!shouldSkipPluginCommandRegistration({
		argv: parseArgv,
		primary,
		hasBuiltinPrimary: primary !== null && program.commands.some((command) => command.name() === primary)
	})) {
		const { registerPluginCliCommands } = await import("./cli-ES2Lyv1o.js");
		const { loadConfig } = await import("./config-CQx0LPGX.js").then((n) => n.t);
		registerPluginCliCommands(program, loadConfig());
	}
	await program.parseAsync(parseArgv);
}

//#endregion
export { runCli };