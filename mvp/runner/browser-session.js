import puppeteer from "puppeteer";

const browserMode = () => process.env.BROWSER_MODE?.trim() || "local";
const remoteProvider = () =>
  process.env.REMOTE_BROWSER_PROVIDER?.trim() || "browserless";

function appendQuery(url, params) {
  if (url.includes("{sessionId}")) {
    return url.replaceAll("{sessionId}", encodeURIComponent(params.sessionId));
  }
  const result = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value) result.searchParams.set(key, value);
  }
  return result.toString();
}

function buildRemoteViewUrl(sessionId) {
  const base = process.env.REMOTE_BROWSER_VIEW_URL_BASE?.trim();
  if (!base) return "";
  return appendQuery(base, { sessionId });
}

function buildRemoteWsUrl(sessionId) {
  const base = process.env.REMOTE_BROWSER_WS_URL?.trim();
  if (!base) {
    throw new Error(
      "BROWSER_MODE=remote requires REMOTE_BROWSER_WS_URL so the worker can connect to the remote browser.",
    );
  }
  return appendQuery(base, { sessionId });
}

/**
 * Launch or connect to one browser session for a single DS-160 job.
 *
 * Local mode preserves the current Puppeteer launch behavior. Remote mode uses
 * a generic CDP/WebSocket endpoint so Browserless, noVNC sidecars, or another
 * provider can be swapped without changing the runner.
 */
export async function createBrowserSession({ headless, chromeChannel, log }) {
  if (browserMode() === "remote") {
    const sessionId =
      process.env.REMOTE_BROWSER_SESSION_ID?.trim() ||
      `ds160-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const browserWSEndpoint = buildRemoteWsUrl(sessionId);
    const browserUrl = buildRemoteViewUrl(sessionId);
    const browser = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: null,
    });
    log(
      `Connected to remote ${remoteProvider()} browser session ${sessionId}.`,
    );
    return {
      browser,
      browserUrl,
      mode: "remote",
      sessionId,
    };
  }

  const options = {
    headless,
    defaultViewport: headless ? { width: 1280, height: 900 } : null,
    args: headless ? ["--disable-dev-shm-usage"] : ["--start-maximized"],
  };
  try {
    return {
      browser: await puppeteer.launch({ ...options, channel: chromeChannel }),
      browserUrl: "",
      mode: "local",
      sessionId: null,
    };
  } catch (error) {
    log(
      `Could not launch Chrome channel="${chromeChannel}": ${error.message}. Falling back to bundled Chrome.`,
    );
    return {
      browser: await puppeteer.launch(options),
      browserUrl: "",
      mode: "local",
      sessionId: null,
    };
  }
}

export function browserCheckTimeoutMs() {
  return (
    Number(process.env.BROWSER_CHECK_TIMEOUT_MS) ||
    Number(process.env.DS160_CLOUDFLARE_MS) ||
    (browserMode() === "remote" || process.env.HEADLESS === "false"
      ? 10 * 60_000
      : 90_000)
  );
}
