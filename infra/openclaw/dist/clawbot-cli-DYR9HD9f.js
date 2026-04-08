import "./auth-profiles-Cn5oo5Dj.js";
import "./exec-CBKBIMpA.js";
import "./agent-scope-F21xRiu_.js";
import "./github-copilot-token-DuFIqfeC.js";
import "./manifest-registry-CYUiqtAr.js";
import "./config-CQx0LPGX.js";
import { n as registerQrCli } from "./qr-cli-3lYcI7mr.js";

//#region src/cli/clawbot-cli.ts
function registerClawbotCli(program) {
	registerQrCli(program.command("clawbot").description("Legacy clawbot command aliases"));
}

//#endregion
export { registerClawbotCli };