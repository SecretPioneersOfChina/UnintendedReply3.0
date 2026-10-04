/**
 * Unintended Reply - LAN community server watchdog (cross platform).
 *
 *   node server/community-guard.js            keep the server alive
 *   node server/community-guard.js --open     ...and open the browser once it is up
 *   node server/community-guard.js --quiet    no console output (used at logon)
 *
 * A desktop shortcut must not leave a black console window open, yet the server has to
 * survive crashes. So the .vbs launcher hides the window and this file does the real work:
 * it starts community.js, asks its HTTP API whether it answers, and restarts it if not.
 *
 * Each watchdog tick is a short decision: "is it answering? if it has had enough time and
 * still is not, restart it." Nothing ever blocks the tick, so killing the server at any
 * moment still gets it restarted within a few seconds.
 */
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, 'community.js');
const PORT = Number(process.env.PORT || process.env.UR_PORT || 8787);
const OPEN = process.argv.indexOf('--open') >= 0;
const QUIET = process.argv.indexOf('--quiet') >= 0 || process.argv.indexOf('/auto') >= 0;
const TICK_MS = 3000;
const GRACE_MS = 8000;      // time given to a freshly started server before declaring it dead

function log(msg) { if (!QUIET) console.log('[community] ' + msg); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Answers the only question users care about: "is the community server there?".
 * A plain TCP connect can lie while Windows recycles sockets, so ask the API instead.
 */
function serverAnswers() {
    return new Promise((resolve) => {
        const req = http.get({ host: '127.0.0.1', port: PORT, path: '/api/info', timeout: 2000 }, (res) => {
            let body = '';
            res.on('data', d => { body += d; });
            res.on('end', () => {
                try {
                    const j = JSON.parse(body);
                    resolve(!!(j && j.ok && j.service === 'unintended-reply-community'));
                } catch (e) { resolve(false); }
            });
        });
        req.on('timeout', () => { try { req.destroy(); } catch (e) { /* ignore */ } resolve(false); });
        req.on('error', () => resolve(false));
    });
}

let child = null;
let startedAt = 0;

function startServer() {
    if (child) {
        try { child.kill(); } catch (e) { /* ignore */ }
        child = null;
    }
    log('starting server on port ' + PORT);
    try {
        child = spawn(process.execPath, [ENTRY], {
            cwd: ROOT,
            stdio: QUIET ? 'ignore' : 'inherit',
            windowsHide: true,
            env: Object.assign({}, process.env, { PORT: String(PORT) })
        });
        startedAt = Date.now();
        child.on('exit', (code) => { log('server exited (' + code + ')'); child = null; });
        child.on('error', (err) => { log('spawn failed: ' + err.message); child = null; });
    } catch (e) {
        log('could not start: ' + e.message);
        child = null;
    }
}

function openBrowser(url) {
    try {
        if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true, windowsHide: true }).unref();
        } else if (process.platform === 'darwin') {
            spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
        } else {
            spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
        }
    } catch (e) { /* ignore */ }
}

// One watchdog pass: short, never blocks, safe to run every tick.
async function tick() {
    if (await serverAnswers()) return true;
    if (child && (Date.now() - startedAt) < GRACE_MS) return false;   // give it time to boot
    log('server not answering - restarting');
    startServer();
    return false;
}

(async function main() {
    const url = 'http://127.0.0.1:' + PORT + '/';
    if (await serverAnswers()) {
        log('port ' + PORT + ' already serves the community - nothing to start');
        if (OPEN) openBrowser(url);
        process.exit(0);
    }

    startServer();
    const watcher = setInterval(() => { tick().catch(() => {}); }, TICK_MS);

    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
        await sleep(700);
        up = await serverAnswers();
    }
    if (!up) {
        log('server never came up - giving up');
        clearInterval(watcher);
        process.exit(2);
    }
    log('server is up at ' + url);
    if (OPEN) openBrowser(url);
})();
