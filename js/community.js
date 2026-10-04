/**
 * 无心之举 — 局域网故事社区（客户端 v2）
 * 全局变量 COMMUNITY。依赖：I18N / SAVE / DESIGNER / GAME（同页全局），IMGDB 可选。
 *
 * 服务器：server/community.js（零依赖 Node 脚本）
 *   node server/community.js   →  http://<局域网IP>:8787
 *
 * 能力：
 *   - 首页（主菜单）直接进入社区；界面与「选择故事」一致（卡片网格渲染进 #messages）
 *   - 自动识别服务器：页面由社区服务器提供 → 同源；否则用 localStorage 记住的手动地址
 *   - 身份：昵称 + 头像（emoji 预设 或 上传图片，存 localStorage）
 *   - 浏览所有公开故事 + 团队故事（🔒 需密码或申请加入）
 *   - 故事详情：下载 JSON / 存到本地 / 协作编辑 / 打赏世界之种 / 评论区 / 团队聊天室
 *   - 管理员面板：可见性（公开 ⇄ 团队）、团队密码、成员与编辑权限、加入申请审批
 *   - SSE 实时刷新：评论/聊天/打赏/申请/成员/设置/保存/删除
 *
 * 设计器协作约定（与 js/designer.js 对接）：
 *   - DESIGNER.open(design, { id, version })  第二参为协作上下文 → 进入协作模式
 *   - 设计器 save() → COMMUNITY.pushDesign(serialize, community)（409 冲突时提示）
 *   - COMMUNITY.onRemoteChange(fn)  设计器注册远程变更回调
 */
const COMMUNITY = (function () {

    const LS_SERVER = 'ur-community-server';
    const LS_CLOUD = 'ur-community-cloud';
    const LS_NAME = 'ur-community-name';
    const LS_AVATAR = 'ur-community-avatar';
    const LS_UID = 'ur-community-uid';           // 稳定身份标识（改名也不变）
    const LS_ALIASES = 'ur-community-aliases';   // 用过的历史昵称（用于认领旧数据）
    const LS_CLAIMS = 'ur-community-claims';     // 我分享过的故事的认领码 { [storyId]: token }
    const LS_ACCOUNT = 'ur-community-account';   // 社区账号名（登录后才写入）
    const LS_TOKEN = 'ur-community-token';       // 登录令牌（服务端签发，30 天有效）
    const AVATAR_PRESETS = ['🙂', '😎', '🤠', '👽', '🤖', '🐱', '🦊', '🐼', '🦄', '👻', '🎭', '🌙', '🔥', '🍀', '🎧', '📚'];

    let _server = '';
    let _serverName = '';
    let _serverInfo = null;
    let _es = null;
    let _connected = false;
    let _remoteHandlers = [];
    let _view = null;        // null | { story: id }
    let _detail = null;      // 当前详情数据
    let _filter = 'all';     // all | public | team | mine
    let _metaCache = {};     // id → 故事元信息快照（判断 owner 用）
    let _wallet = null;      // 我的世界之种钱包（服务器账户，社区内权威余额）
    let _chatOverlay = null; // 协作聊天浮窗 { id, el }
    let _profile = null;     // 个人中心数据（等级 / 种子 / 设备 IP / 创作统计）

    // ══════════════ 身份 ══════════════
    function getName() {
        try {
            let n = localStorage.getItem(LS_NAME);
            if (!n) {
                const tpl = (I18N && I18N.t) ? I18N.t('communityDefaultName') : '故事作者{n}';
                n = (tpl || '故事作者{n}').replace('{n}', String(1000 + Math.floor(Math.random() * 9000)));
                localStorage.setItem(LS_NAME, n);
            }
            return n;
        } catch (e) { return '用户'; }
    }
    // 稳定身份：只在首次生成一次，之后改昵称也不变 → 管理员身份 / 钱包 / 团队成员都跟着人走
    function getUid() {
        try {
            let u = localStorage.getItem(LS_UID);
            if (!u) { u = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem(LS_UID, u); }
            return u;
        } catch (e) { return 'u_local'; }
    }
    // 历史昵称列表：改名时把旧名记下来，进社区时一起上报 → 服务器把这些名字下的旧数据认领给当前 uid
    function getAliases() {
        try {
            const a = JSON.parse(localStorage.getItem(LS_ALIASES) || '[]');
            return Array.isArray(a) ? a.filter(x => typeof x === 'string' && x) : [];
        } catch (e) { return []; }
    }
    function rememberAlias(n) {
        n = String(n || '').trim().slice(0, 20);
        if (!n) return;
        try {
            const a = getAliases();
            if (a.indexOf(n) < 0) { a.push(n); localStorage.setItem(LS_ALIASES, JSON.stringify(a.slice(-12))); }
        } catch (e) {}
    }
    // 每次改名：先记住旧昵称，再写入新昵称并记住它
    function setName(n) {
        const next = (n || '').trim().slice(0, 20);
        if (!next) return;
        let prev = '';
        try { prev = localStorage.getItem(LS_NAME) || ''; } catch (e) {}
        if (prev && prev !== next) rememberAlias(prev);
        try { localStorage.setItem(LS_NAME, next); } catch (e) {}
        rememberAlias(next);
    }
    function getAvatar() { try { return localStorage.getItem(LS_AVATAR) || '🙂'; } catch (e) { return '🙂'; } }
    function setAvatar(a) { try { localStorage.setItem(LS_AVATAR, a || '🙂'); } catch (e) {} }
    function identityReady() { try { return !!localStorage.getItem(LS_NAME); } catch (e) { return true; } }

    // ── 账号 / 登录态 ──────────────────────────────────────
    function getToken() { try { return localStorage.getItem(LS_TOKEN) || ''; } catch (e) { return ''; } }
    function setToken(t) { try { if (t) localStorage.setItem(LS_TOKEN, t); else localStorage.removeItem(LS_TOKEN); } catch (e) {} }
    function getAccount() { try { return localStorage.getItem(LS_ACCOUNT) || ''; } catch (e) { return ''; } }
    function setAccount(a) { try { if (a) localStorage.setItem(LS_ACCOUNT, a); else localStorage.removeItem(LS_ACCOUNT); } catch (e) {} }
    // 登录后服务端返回权威 uid（账号绑定的那个）：换设备登录同一个账号也能拿回种子和作品
    function setUid(u) { try { if (u) localStorage.setItem(LS_UID, u); } catch (e) {} }
    function isLoggedIn() { return !!getToken(); }
    function logout() { setToken(''); setAccount(''); _profile = null; }
    // 身份三件套：所有 API 调用都带上，服务器据此判定归属 / 权限 / 钱包（含登录令牌）
    function ident() {
        const o = { uid: getUid(), nick: getName(), aliases: getAliases() };
        const t = getToken();
        if (t) o.token = t;
        return o;
    }
    // 认领码：分享时服务器下发，存在本机。换设备/改名后凭它证明「这是我发的」
    function getClaims() {
        try {
            const o = JSON.parse(localStorage.getItem(LS_CLAIMS) || '{}');
            return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
        } catch (e) { return {}; }
    }
    function rememberClaim(id, token) {
        if (!id || !token) return;
        try {
            const o = getClaims();
            o[id] = token;
            localStorage.setItem(LS_CLAIMS, JSON.stringify(o));
        } catch (e) {}
    }
    // 手抄的认领码（从服务器那台机器上抄过来 / 别人转交），不带故事 id 也能认领
    function rememberClaimCode(code) {
        code = String(code || '').trim().toUpperCase().slice(0, 16);
        if (!code) return;
        try {
            const o = getClaims();
            o['manual_' + code] = code;
            localStorage.setItem(LS_CLAIMS, JSON.stringify(o));
        } catch (e) {}
    }
    // 本地保存的、由我分享出去的作品（design.communityId）。认领旧作品的凭据之一
    function mineIds() {
        const out = [];
        try {
            if (typeof SAVE !== 'undefined' && SAVE.getDesigns) {
                SAVE.getDesigns().forEach(d => { if (d && d.communityId) out.push(d.communityId); });
            }
        } catch (e) {}
        return out;
    }

    // ══════════════ 连接 ══════════════
    function isConnected() { return _connected; }
    function getServer() { return _server; }
    function getServerName() { return _serverName; }
    // 断开连接（换服务器 / 重新搜索）
    function disconnect() {
        stopSSE();
        _connected = false; _server = ''; _serverName = ''; _serverInfo = null;
        _wallet = null;
        closeChatOverlay();
    }

    async function connect(base, silent) {
        base = (base || '').trim().replace(/\/+$/, '');
        if (base && !/^https?:\/\//i.test(base)) base = 'http://' + base;   // 手动输入 192.168.1.5:8787 也能用
        // 只填了 IP / 域名（没写端口）时补上社区端口，否则浏览器会去敲 80 端口，必然连不上。
        // ⚠️ 但 https 的公网地址不能补（它的端口就是 443），否则会变成 https://xxx:8787 直接失败。
        if (base && !/^https:/i.test(base)) {
            try {
                const u = new URL(base);
                if (!u.port) { u.port = String(getPort()); base = u.origin; }
            } catch (e) {}
        }
        if (!base) return false;
        try {
            const r = await fetch(base + '/api/info', { method: 'GET', cache: 'no-store' });
            const j = await r.json();
            if (!r.ok || !j.ok) throw new Error('bad');
            _server = base; _serverName = j.name || ''; _connected = true; _serverInfo = j;
            try { localStorage.setItem(LS_SERVER, base); } catch (e) {}
            if (j.port) setPort(j.port);                                     // 记住端口，下次扫描直接用
            if (j.unified) { try { localStorage.setItem(LS_UNIFIED, j.unified); } catch (e) {} }
            startSSE();
            getMe(); // 同步「我的世界之种」钱包（服务器账户为社区内的权威余额）
            if (!silent) toast('🌐 ' + (j.name || base));
            return true;
        } catch (e) {
            _server = ''; _serverName = ''; _connected = false; _serverInfo = null; stopSSE();
            if (!silent) toast('⚠ ' + I18N.t('communityConnectFail') + ' · ' + base);
            return false;
        }
    }
    // 快速自动连接：同源 → 上次用过的地址 → 统一地址 → 本机。不做网段扫描（扫描由社区面板驱动）
    async function autoConnect() {
        const found = await discover({ quickOnly: true });
        if (found.length) return connect(found[0].url, true);
        return false;
    }

    // ══════════════ 局域网自动发现 ══════════════
    // 目标：不用手填 IP。先试「同一个地址」（服务器用 mDNS 广播的 http://wuxin.local:8787），
    // 再探测本机与上次用过的地址，最后按常见网段并发扫描（可取消、可加深）。
    const DEFAULT_PORT = 8787;
    const DEFAULT_MDNS = 'wuxin.local';
    const LS_PORT = 'ur-community-port';
    const LS_UNIFIED = 'ur-community-unified';
    // 常见家用/热点网段（覆盖面从高到低）
    const SWEEP_PREFIXES = [
        '192.168.1', '192.168.0', '192.168.2', '192.168.3', '192.168.4',
        '192.168.31', '192.168.50', '192.168.43', '192.168.137', '192.168.8',
        '192.168.100', '10.0.0', '10.0.1', '172.20.10'
    ];
    const QUICK_PREFIX_COUNT = 5;    // 默认只扫最可能的几个网段（够用且快）
    const PROBE_TIMEOUT = 700;       // 单个地址探测超时（局域网内 700ms 足够）
    const SWEEP_CONCURRENCY = 48;    // 并发探测数
    const MAX_FOUND = 3;             // 找到这么多个就提前收工

    let _scanHandle = null;
    let _deepScan = false;
    let _scannedOnce = false;        // 本次会话是否已自动扫过一遍（避免每次回首页都重扫）
    let _autoConnecting = false;

    function getPort() {
        try { return parseInt(localStorage.getItem(LS_PORT), 10) || DEFAULT_PORT; }
        catch (e) { return DEFAULT_PORT; }
    }
    function setPort(p) { try { if (p) localStorage.setItem(LS_PORT, String(p)); } catch (e) {} }
    // 统一地址用的主机名：优先用上次服务器上报的（管理员可能改过 MDNS_NAME）
    function mdnsHost() {
        try {
            const u = localStorage.getItem(LS_UNIFIED) || '';
            const m = u.match(/^https?:\/\/([^:\/]+)/);
            if (m && m[1]) return m[1];
        } catch (e) {}
        return DEFAULT_MDNS;
    }
    function unifiedUrl() { return 'http://' + mdnsHost() + ':' + getPort(); }
    function getServerInfo() { return _serverInfo; }
    function isMdnsName(u) { try { return /\.local$/i.test(new URL(u).hostname); } catch (e) { return false; } }

    // 探测一个地址：命中返回服务器信息，否则 null
    function probeOnce(base, timeoutMs) {
        return new Promise((resolve) => {
            let settled = false;
            const ctrl = new AbortController();
            const handle = _scanHandle;
            const timer = setTimeout(() => { try { ctrl.abort(); } catch (e) {} settle(null); }, timeoutMs);
            const onGlobal = () => { try { ctrl.abort(); } catch (e) {} settle(null); };
            function settle(v) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (handle) handle.ctrl.signal.removeEventListener('abort', onGlobal);
                resolve(v);
            }
            if (handle) handle.ctrl.signal.addEventListener('abort', onGlobal, { once: true });
            fetch(base.replace(/\/+$/, '') + '/api/info', { signal: ctrl.signal, cache: 'no-store' })
                .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
                .then(j => {
                    if (!j || !j.ok) return settle(null);
                    settle({
                        url: base.replace(/\/+$/, ''),
                        name: j.name || '', port: j.port || 0,
                        host: j.host || '', unified: j.unified || '',
                        stories: j.stories || 0, mdns: !!j.mdns,
                        service: j.service || ''
                    });
                })
                .catch(() => settle(null));
        });
    }

    // 扫描网段：优先「当前页面所在网段」（若页面就是从某台机器提供的）
    function sweepPrefixes() {
        const out = [];
        const push = (p) => { if (p && out.indexOf(p) < 0) out.push(p); };
        const hn = location.hostname;
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hn) && !hn.startsWith('127.')) push(hn.split('.').slice(0, 3).join('.'));
        SWEEP_PREFIXES.forEach(push);
        return out;
    }

    // ── 本机局域网 IP（WebRTC 主机候选）─────────────────────
    // 手机/平板上页面是 file:// 或 App WebView，location.hostname 拿不到网段，
    // 只能靠 WebRTC 的 host candidate 反查本机 IP，再据此扫自己所在 /24。
    let _localIps = null;
    function localIps() {
        return new Promise((resolve) => {
            if (_localIps) return resolve(_localIps);
            let settled = false;
            const ips = [];
            const finish = () => {
                if (settled) return;
                settled = true;
                _localIps = ips;
                resolve(ips);
            };
            try {
                const PC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
                if (!PC) return finish();
                const pc = new PC({ iceServers: [] });
                try { pc.createDataChannel('ip'); } catch (e) {}
                pc.onicecandidate = (ev) => {
                    const c = ev && ev.candidate && ev.candidate.candidate;
                    if (!c) return;
                    const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(c);
                    if (!m) return;
                    const ip = m[1];
                    if (ip === '0.0.0.0' || ip.indexOf('127.') === 0) return;
                    if (ips.indexOf(ip) < 0) ips.push(ip);
                };
                setTimeout(() => { try { pc.close(); } catch (e) {} finish(); }, 1200);
                try {
                    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => {});
                } catch (e) { finish(); }
            } catch (e) { finish(); }
        });
    }
    // 要扫的网段顺序：本机网段 → 上次连过的服务器网段 → 页面网段 → 常见网段
    async function subnetsToScan() {
        const out = [];
        // 环回网段不在扫描范围（阶段 1 已经试过；扫 127.0.0.x 只会命中自己）
        const push = (p) => { if (p && p.indexOf('127.') !== 0 && out.indexOf(p) < 0) out.push(p); };
        const ips = await localIps();
        ips.forEach(ip => push(ip.split('.').slice(0, 3).join('.')));
        try {
            const saved = localStorage.getItem(LS_SERVER) || '';
            const m = /^https?:\/\/(\d+\.\d+\.\d+)\./.exec(saved);
            if (m) push(m[1]);
        } catch (e) {}
        sweepPrefixes().forEach(push);
        return out;
    }

    // 并发池
    async function runPool(items, worker, concurrency, handle) {
        let idx = 0;
        const runners = [];
        for (let k = 0; k < concurrency; k++) {
            runners.push((async () => {
                for (;;) {
                    if (handle.cancelled || handle.done) return;
                    const i = idx++;
                    if (i >= items.length) return;
                    await worker(items[i]);
                }
            })());
        }
        await Promise.all(runners);
    }

    function cancelDiscovery() {
        if (_scanHandle) {
            _scanHandle.cancelled = true;
            try { _scanHandle.ctrl.abort(); } catch (e) {}
            _scanHandle = null;
        }
    }

    /**
     * 自动发现社区服务器。
     * opts: { quickOnly, skipQuick, deep, maxFound,
     *         onFound(info, handle), onProgress(handle), onPhase(name, handle) }
     * 返回找到的服务器数组。同一台服务器即使有多个地址（127.0.0.1 / localhost / wuxin.local /
     * 局域网 IP）也只算一个 —— 按服务器自报的 host:port 去重。
     */
    async function discover(opts) {
        opts = opts || {};
        cancelDiscovery();
        const maxFound = opts.maxFound || MAX_FOUND;
        const handle = { cancelled: false, done: false, ctrl: new AbortController(), scanned: 0, total: 0, found: [], phase: 'quick' };
        _scanHandle = handle;
        const seen = {};
        const fire = (fn, a, b) => { try { if (fn) fn(a, b); } catch (e) {} };
        // 服务器身份（host:port）优先；拿不到就退回 URL
        function keyOf(info) { return (info.host && info.port) ? ('ip:' + info.host + ':' + info.port) : ('url:' + info.url); }
        function add(info) {
            if (!info) return;
            const k = keyOf(info);
            if (seen[k]) return;
            seen[k] = 1;
            seen['url:' + info.url] = 1;
            handle.found.push(info);
            fire(opts.onFound, info, handle);
        }
        function step() {
            handle.scanned++;
            if (handle.scanned % 8 === 0) fire(opts.onProgress, handle);
        }
        const enough = () => { if (handle.found.length >= maxFound) handle.done = true; };

        // ── 阶段 1：快速候选（几乎瞬时）──
        if (opts.skipQuick) {
            handle.total = 0;
        } else {
            fire(opts.onPhase, 'quick', handle);
            const quick = [];
            if (/^https?:$/.test(location.protocol) && location.origin && location.origin !== 'null') quick.push(location.origin);
            let saved = '';
            try { saved = localStorage.getItem(LS_SERVER) || ''; } catch (e) {}
            if (saved) quick.push(saved.replace(/\/+$/, ''));
            quick.push(unifiedUrl());
            quick.push('http://127.0.0.1:' + getPort());
            quick.push('http://localhost:' + getPort());
            const uniqQuick = quick.filter((u, i) => u && quick.indexOf(u) === i);
            handle.total = uniqQuick.length;
            await runPool(uniqQuick, async (u) => {
                const info = await probeOnce(u, PROBE_TIMEOUT);
                step();
                if (info) add(info);
            }, 8, handle);
            fire(opts.onProgress, handle);
        }
        if (handle.cancelled || handle.done || opts.quickOnly) {
            handle.done = true;
            if (_scanHandle === handle) _scanHandle = null;
            return handle.found;
        }

        // ── 阶段 2：网段扫描（本机网段优先；手机/平板靠 WebRTC 反查）──
        fire(opts.onPhase, 'sweep', handle);
        const allPrefixes = await subnetsToScan();
        const limit = (opts.deep || _deepScan) ? allPrefixes.length : Math.min(QUICK_PREFIX_COUNT, allPrefixes.length);
        async function sweepRange(list) {
            const hosts = [];
            list.forEach(p => {
                for (let i = 1; i <= 254; i++) {
                    const u = 'http://' + p + '.' + i + ':' + getPort();
                    if (!seen['url:' + u]) hosts.push(u);
                }
            });
            if (!hosts.length) return;
            handle.total = handle.scanned + hosts.length;
            fire(opts.onProgress, handle);
            await runPool(hosts, async (u) => {
                const info = await probeOnce(u, PROBE_TIMEOUT);
                step();
                if (info) { add(info); enough(); }
            }, SWEEP_CONCURRENCY, handle);
        }
        await sweepRange(allPrefixes.slice(0, limit));
        // 默认只扫最可能的几个网段；一个都没找到就自动扩展剩余网段（不用手动点深度扫描）
        if (!handle.cancelled && !handle.done && !handle.found.length && allPrefixes.length > limit) {
            fire(opts.onPhase, 'deep', handle);
            await sweepRange(allPrefixes.slice(limit));
        }

        handle.done = true;
        fire(opts.onProgress, handle);
        if (_scanHandle === handle) _scanHandle = null;
        return handle.found;
    }

    function isScanning() { return !!(_scanHandle && !_scanHandle.cancelled && !_scanHandle.done); }
    function getScan() { return _scanHandle; }
    function setDeepScan(v) { _deepScan = !!v; }
    function getDeepScan() { return _deepScan; }
    function startSSE() {
        stopSSE();
        if (!_server || typeof EventSource === 'undefined') return;
        try {
            _es = new EventSource(_server + '/api/events');
            _es.addEventListener('story', (ev) => {
                let d = null;
                try { d = JSON.parse(ev.data); } catch (e) { return; }
                _remoteHandlers.forEach(fn => { try { fn(d); } catch (e) { console.error(e); } });
                onRemoteEvent(d);
            });
            _es.onerror = () => {};
        } catch (e) { console.error('[COMMUNITY] SSE 启动失败', e); }
    }
    function stopSSE() { if (_es) { try { _es.close(); } catch (e) {} _es = null; } }
    function onRemoteChange(fn) { if (typeof fn === 'function') _remoteHandlers.push(fn); }

    // 收到广播：正在看该故事 → 刷新；否则轻提示
    function onRemoteEvent(d) {
        if (!d || !d.id) return;
        // 协作聊天浮窗（设计器里）也跟着实时刷新
        if (_chatOverlay && _chatOverlay.id === d.id &&
            ['chat', 'tip', 'member', 'request', 'settings', 'save', 'join'].indexOf(d.action) >= 0) {
            refreshChatOverlay();
        }
        // 打赏广播 → 重新拉一次钱包（打赏者是我就扣钱，被赏者是我则进账）
        if (d.action === 'tip') { getMe(); }
        // 学生交卷 → 同步刷新自己的钱包（及格当场发了世界之种）
        if (d.action === 'examsubmit' || d.action === 'examaward') { getMe(); }
        const viewing = _view && _view.story === d.id;
        // 自己发出的广播不再自动重刷：本地代码已经显式刷新过，
        // 再刷一遍会把刚展开的「成绩统计」面板冲掉（也避免重复请求）
        const byMe = d.by && d.by === getName();
        if (viewing && ['comment', 'chat', 'tip', 'member', 'request', 'settings', 'save', 'exam', 'examsubmit', 'examaward'].indexOf(d.action) >= 0) {
            if (byMe && ['exam', 'examsubmit', 'examaward'].indexOf(d.action) >= 0) return;
            refreshDetail(true);
            return;
        }
        if (d.action === 'delete' && viewing) {
            toast('⚠ ' + I18N.t('communityDeleted'));
            showHome();
            return;
        }
        const meta = _metaCache[d.id];
        if (d.action === 'request' && meta && (meta.mine || meta.owner === getUid()) && d.by !== getName()) {
            toast('📨 ' + d.by + ' ' + (I18N.t('communityAppliedTip') || '申请加入你的团队'));
        }
    }

    // ══════════════ API ══════════════
    async function api(path, opts) {
        if (!_server) throw new Error(I18N.t('communityNeedServer'));
        const o = Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {});
        const t = getToken();
        // 令牌两条路都带上：GET 走查询串、写操作走 body，服务端取其一
        if (t) {
            o.headers['x-community-token'] = t;
            if (typeof o.body === 'string') {
                try { const b = JSON.parse(o.body); b.token = t; o.body = JSON.stringify(b); } catch (e) {}
            }
            path += (path.indexOf('?') >= 0 ? '&' : '?') + 'token=' + encodeURIComponent(t);
        }
        const res = await fetch(_server + path, o);
        let j = null;
        try { j = await res.json(); } catch (e) {}
        return { status: res.status, data: j || {} };
    }
    // GET 请求的身份查询串：uid（身份）+ nick（显示名）+ aliases（曾用昵称）
    // + mine（本地作品清单）+ claims（认领码）→ 后两项是认领旧作品的凭据
    // （token 由 api() 统一注入，这里不再重复拼）
    function identQuery() {
        const i = ident();
        return 'uid=' + encodeURIComponent(i.uid) + '&nick=' + encodeURIComponent(i.nick)
            + '&aliases=' + encodeURIComponent(JSON.stringify(i.aliases))
            + '&mine=' + encodeURIComponent(JSON.stringify(mineIds()))
            + '&claims=' + encodeURIComponent(JSON.stringify(getClaims()));
    }

    // ── 账号 API ──────────────────────────────────────────
    async function registerAccount(account, password, nick, avatar) {
        const r = await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                account: account, password: password, nick: nick, avatar: avatar,
                uid: getUid(), aliases: getAliases(),
                mine: mineIds(), claims: getClaims()
            })
        });
        if (r.status === 200 && r.data.ok) { setAccount(account); applyLogin(r.data); }
        return r;
    }
    async function loginAccount(account, password) {
        const r = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                account: account, password: password, nick: getName(), avatar: getAvatar(),
                uid: getUid(), aliases: getAliases(), mine: mineIds(), claims: getClaims()
            })
        });
        if (r.status === 200 && r.data.ok) { setAccount(account); applyLogin(r.data); }
        return r;
    }
    // 登录/注册成功：落 token、接管服务端给的权威 uid、同步昵称头像
    function applyLogin(d) {
        if (!d || !d.ok) return;
        setToken(d.token || '');
        const p = d.profile || {};
        setAccount(p.account || getAccount());
        if (d.uid) setUid(d.uid);
        if (d.nick || p.nick) setName(d.nick || p.nick);
        if (d.avatar || p.avatar) setAvatar(d.avatar || p.avatar);
        if (d.profile) { _profile = d.profile; if (p.wallet) applyWallet(p.wallet); }
    }
    // 这台设备进社区前要不要先注册登录？（服务器按请求来源判定：本机免登录，其他设备要）
    async function authRequired() {
        if (!_server) return false;
        try {
            const r = await api('/api/auth/required');
            return !!(r.data && r.data.required);
        } catch (e) { return false; }
    }
    async function logoutServer() {
        try { await api('/api/auth/logout', { method: 'POST', body: JSON.stringify({ token: getToken() }) }); } catch (e) {}
        logout();
    }
    async function fetchProfile() {
        if (!isLoggedIn()) return null;
        try {
            const r = await api('/api/auth/me');
            if (r.status === 200 && r.data && r.data.ok && r.data.profile) {
                _profile = r.data.profile;
                if (r.data.profile.wallet) applyWallet(r.data.profile.wallet);
                return _profile;
            }
            // 令牌失效（服务器重启 / 过期）→ 退回登录页
            if (r.status === 401) { logout(); }
        } catch (e) {}
        return null;
    }
    async function saveProfile(patch) {
        const r = await api('/api/auth/profile', {
            method: 'POST', body: JSON.stringify(Object.assign({ token: getToken() }, patch || {}))
        });
        if (r.status === 200 && r.data.ok) {
            if (r.data.nick) setName(r.data.nick);
            if (r.data.avatar) setAvatar(r.data.avatar);
            if (r.data.profile) _profile = r.data.profile;
        }
        return r;
    }
    function getProfile() { return _profile; }
    async function listStories() {
        const r = await api('/api/stories?' + identQuery());
        if (r.status !== 200 || !r.data.ok) return [];
        const list = r.data.stories || [];
        list.forEach(s => { _metaCache[s.id] = s; });
        return list;
    }
    async function fetchStory(id) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '?' + identQuery());
        if (r.data && r.data.story) _metaCache[id] = r.data.story;
        return r.data || {}; // {ok, story, design, comments, chat, tips, requests, myRole, isMember, canEdit, wallet} | {ok:false,error:'locked',story}
    }
    async function shareDesign(design, opts) {
        opts = opts || {};
        const r = await api('/api/stories', {
            method: 'POST',
            body: JSON.stringify(Object.assign(ident(), {
                author: getName(), avatar: getAvatar(), design,
                visibility: opts.visibility || (opts.mode === 'private' ? 'team' : 'public'),
                mode: opts.mode || (opts.visibility === 'team' ? 'private' : 'open'),
                password: opts.password || ''
            }))
        });
        if (r.status === 200 && r.data.ok) {
            if (r.data.claimToken) rememberClaim(r.data.id, r.data.claimToken);
            return { id: r.data.id, version: r.data.version, claimToken: r.data.claimToken };
        }
        return null;
    }
    async function pushDesign(design, community) {
        try {
            const r = await api('/api/stories/' + encodeURIComponent(community.id), {
                method: 'PUT',
                body: JSON.stringify(Object.assign(ident(), { author: getName(), design, baseVersion: community.version || 0 }))
            });
            if (r.status === 200 && r.data.ok) { community.version = r.data.version; return { ok: true, version: r.data.version }; }
            if (r.status === 409) return { ok: false, conflict: true, version: r.data.version || 0, by: r.data.by || '' };
            if (r.status === 403) return { ok: false, denied: true };
            return { ok: false, error: r.data.error || ('http ' + r.status) };
        } catch (e) { return { ok: false, error: e.message }; }
    }
    // 返回 { ok, reason }：reason = 'denied'(不是我的/没权限) | 'login'(令牌失效) | 'error'
    // ⚠️ 以前只回 true/false，调用方直接 showHome() → 删不掉时界面上毫无反应
    async function deleteStory(id) {
        let r;
        try {
            r = await api('/api/stories/' + encodeURIComponent(id) + '?' + identQuery(), { method: 'DELETE' });
        } catch (e) { return { ok: false, reason: 'offline' }; }   // 没连上服务器：单独给提示，别只说「删除失败」
        if (r.status === 200 && r.data.ok) return { ok: true };
        return { ok: false, reason: r.status === 401 ? 'login' : r.status === 403 ? 'denied' : 'error' };
    }
    async function joinStory(id) {
        await api('/api/stories/' + encodeURIComponent(id) + '/join', { method: 'POST', body: JSON.stringify(Object.assign(ident(), { name: getName(), avatar: getAvatar() })) });
    }
    async function unlock(id, password) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/unlock', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), password: password || '' }))
        });
        return r.data || {};
    }
    async function requestJoin(id, message) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/request', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), message: message || '' }))
        });
        return !!(r.data && r.data.ok);
    }
    // target = { uid, nick }（成员身份稳定标识 + 显示名）
    async function memberAction(id, target, action, role) {
        target = target || {};
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/member', {
            method: 'POST', body: JSON.stringify({
                actor: getName(), actorUid: getUid(),
                targetUid: target.uid || '', nick: target.nick || '',
                action: action, role: role || 'editor'
            })
        });
        return !!(r.data && r.data.ok);
    }
    async function saveSettings(id, patch) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/settings', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { actor: getName(), actorUid: getUid() }, patch))
        });
        return r.data || {};
    }
    async function postComment(id, text) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/comment', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), text: text }))
        });
        return r.data || {};
    }
    async function postChat(id, text) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/chat', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), text: text }))
        });
        return r.data || {};
    }
    // ── 协作在线状态（光标 / 正在编辑哪个节点）──────────────────────
    // 设计器里每 ~90ms 上报一次（只在指针移动或动作变化时），服务器合并广播给别人，
    // 于是画布上能看到别人的指针、名字和「正在编辑这个节点」的彩色描边。
    async function reportPresence(id, state) {
        if (!_server || !id) return null;
        try {
            const r = await api('/api/stories/' + encodeURIComponent(id) + '/presence', {
                method: 'POST', body: JSON.stringify(Object.assign(ident(), state || {}))
            });
            return (r.status === 200 && r.data && r.data.ok) ? (r.data.self || r.data) : null;
        } catch (e) { return null; }
    }
    async function fetchPresence(id) {
        if (!_server || !id) return [];
        try {
            const r = await api('/api/stories/' + encodeURIComponent(id) + '/presence');
            return (r.status === 200 && r.data && Array.isArray(r.data.peers)) ? r.data.peers : [];
        } catch (e) { return []; }
    }
    // 关掉设计器 / 关页面时主动离场，别人画布上的指针立刻消失（不用等 12s 超时）
    async function leavePresence(id) {
        if (!_server || !id) return;
        try {
            await api('/api/stories/' + encodeURIComponent(id) + '/presence', {
                method: 'POST', body: JSON.stringify(Object.assign(ident(), { leave: 1 }))
            });
        } catch (e) {}
    }

    async function postTip(id, amount) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/tip', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), amount: amount }))
        });
        return r.data || {};
    }

    // ── 限时线上考试 ───────────────────────────────────────
    // GET 试卷+状态+成绩统计（教师组可见全班，学生只见自己）
    async function getExam(id) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/exam?' + identQuery());
        return r.data || {};
    }
    // 出题 / 改考试（仅教师出题组）
    async function saveExam(id, exam) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/exam', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar(), exam: exam }))
        });
        return r.data || {};
    }
    async function removeExam(id) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/exam?' + identQuery(), {
            method: 'DELETE', body: JSON.stringify(ident())
        });
        return r.data || {};
    }
    // 学生交卷：GAME 到达结局 / 超时自动调用
    async function submitExam(id, payload) {
        if (!_connected) return { ok: false, error: 'offline' };
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/exam/submit', {
            method: 'POST', body: JSON.stringify(Object.assign(ident(), { avatar: getAvatar() }, payload || {}))
        });
        return r.data || {};
    }
    // 教师组：给所有及格但还没发过种子的学生补发
    async function awardExam(id) {
        const r = await api('/api/stories/' + encodeURIComponent(id) + '/exam/award?' + identQuery(), {
            method: 'POST', body: JSON.stringify(ident())
        });
        return r.data || {};
    }
    // 从社区直接开考：编译蓝图 → 进入剧情（并挂上倒计时）
    async function startExam(id) {
        if (!ensureConnected()) return false;
        const data = await fetchStory(id);
        if (!data.ok || !data.design) { toast('⚠ ' + T('communityFetchFail', '获取失败')); return false; }
        const ex = await getExam(id);
        if (!ex.ok || !ex.exam) { toast('⚠ ' + T('examNone', '当前没有考试')); return false; }
        if (!ex.canTake) { toast('⏰ ' + T('examNotNow', '现在不是考试时间')); return false; }
        const chapter = compileStoryDesign(data.design);
        if (!chapter) { toast('⚠ ' + T('examCompileFail', '故事无法运行')); return false; }
        STORY.addDynamicChapters([chapter]);
        // 单次限时 = min(考试结束时间, 开始时间 + durationMin)
        const now = Date.now();
        let deadline = ex.exam.closeAt || 0;
        if (ex.exam.durationMin) deadline = Math.min(deadline || Infinity, now + ex.exam.durationMin * 60000) || 0;
        GAME.startCustomStory(chapter);
        if (GAME.setExamContext) {
            GAME.setExamContext({ storyId: id, title: ex.exam.title || '', deadline: deadline, startAt: now });
        }
        return true;
    }

    // 服务器里存的是 v3 紧凑 JSON，compileBlueprint 只吃完整格式 —— 必须先 normalizeDesign
    function compileStoryDesign(design) {
        try {
            return DESIGNER.compileBlueprint(DESIGNER.normalizeDesign(JSON.parse(JSON.stringify(design))));
        } catch (e) {
            console.warn('[COMMUNITY] 故事编译失败', e);
            return null;
        }
    }

    // 点故事卡片 = 直接开玩（不是进详情页）。
    // 有限时考试且我不是出题老师时，一律走考试流程：这样「学生只能在时间窗内看题」才管用。
    async function playStory(id) {
        if (!ensureConnected()) return false;
        const data = await fetchStory(id);
        if (!data.ok || !data.design) {
            if (data.error === 'locked') { toast('🔒 ' + T('communityLocked', '该故事仅团队成员可见')); showDetail(id); }
            else toast('⚠ ' + T('communityFetchFail', '获取失败'));
            return false;
        }
        // 考试中的故事：学生 → 考试模式（计时 + 自动交卷）；老师/管理员 → 自由试玩
        try {
            const ex = await getExam(id);
            if (ex.ok && ex.exam && !ex.canManage) {
                if (!ex.canTake) {
                    toast('⏰ ' + (ex.status === 'upcoming' ? T('examNotStart', '考试还没开始') : T('examOver', '考试已结束')));
                    showDetail(id);
                    return false;
                }
                if (ex.my) { toast('📝 ' + T('examAlreadyDone', '你已经交过卷了，可以再看一次题目')); }
                return await startExam(id);
            }
        } catch (e) { /* 取不到考试信息就按普通故事处理 */ }

        const chapter = compileStoryDesign(data.design);
        if (!chapter) { toast('⚠ ' + T('examCompileFail', '故事无法运行')); return false; }
        if (GAME.setExamContext) GAME.setExamContext(null); // 普通游玩不挂考试
        STORY.addDynamicChapters([chapter]);
        GAME.startCustomStory(chapter);
        return true;
    }

    // ── 世界之种钱包（服务器账户）──────────────────────────
    async function getMe() {
        try {
            const r = await api('/api/me?' + identQuery() + '&avatar=' + encodeURIComponent(getAvatar()));
            if (r.status === 200 && r.data && r.data.ok) return applyWallet(r.data.user);
        } catch (e) {}
        return null;
    }
    // 排障：服务器看到的我（IP）+ 服务器自己的局域网地址
    async function whoAmI() {
        try {
            const r = await api('/api/whoami');
            return (r.status === 200 && r.data && r.data.ok) ? r.data : null;
        } catch (e) { return null; }
    }
    async function getUsers(limit) {
        try {
            const r = await api('/api/users?limit=' + (limit || 20));
            return (r.data && r.data.users) || [];
        } catch (e) { return []; }
    }
    // 服务器账户是社区内的权威余额：拿到后同步到本地存档，顶栏 💠 数字保持一致
    function applyWallet(w) {
        if (!w) return null;
        _wallet = { uid: w.uid || getUid(), nick: w.nick, seeds: w.seeds, received: w.received || 0, sent: w.sent || 0 };
        try {
            if (typeof SAVE !== 'undefined' && SAVE.getSeeds && SAVE.addSeeds) {
                const diff = _wallet.seeds - SAVE.getSeeds();
                if (diff !== 0) SAVE.addSeeds(diff);
            }
        } catch (e) {}
        refreshSeedDisplay();
        return _wallet;
    }
    // 直接刷新顶栏「世界之种」文字（不依赖 game.js 的内部函数）
    function refreshSeedDisplay() {
        try {
            const el = document.getElementById('seed-display');
            if (!el || typeof SAVE === 'undefined') return;
            const name = (typeof I18N !== 'undefined' && I18N.t) ? I18N.t('worldSeed') : '世界之种';
            el.textContent = '💠 ' + name + ' x' + SAVE.getSeeds();
        } catch (e) {}
    }
    function getWallet() { return _wallet; }

    // ══════════════ 动作 ══════════════
    async function downloadStory(id) {
        const data = await fetchStory(id);
        if (!data.ok || !data.design) { toast('⚠ ' + I18N.t('communityFetchFail')); return false; }
        const d = JSON.parse(JSON.stringify(data.design));
        delete d.communityId;
        d.id = 'dl_' + Date.now();
        SAVE.saveDesign(d);
        toast('⬇ ' + I18N.t('communityDownloaded'));
        return true;
    }
    async function downloadJson(id) {
        const data = await fetchStory(id);
        if (!data.ok || !data.design) { toast('⚠ ' + I18N.t('communityFetchFail')); return false; }
        let out = JSON.parse(JSON.stringify(data.design));
        // 本地 IndexedDB 里有引用的图片素材就一起内嵌，保证单文件可用
        try {
            if (window.IMGDB && IMGDB.collectRefsInDesign) {
                const ids = IMGDB.collectRefsInDesign(out);
                const assets = {};
                for (const aid of ids) { const url = await IMGDB.getImage(aid); if (url) assets[aid] = url; }
                if (Object.keys(assets).length) out.assets = assets;
            }
        } catch (e) {}
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ((out.title || 'story').replace(/[\\/:*?"<>|]/g, '_')) + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast('⬇ JSON');
        return true;
    }
    async function openSharedInDesigner(id) {
        const data = await fetchStory(id);
        if (!data.ok) {
            if (data.error === 'locked') { toast('🔒 ' + I18N.t('communityLocked')); showDetail(id); return false; }
            toast('⚠ ' + I18N.t('communityFetchFail'));
            return false;
        }
        if (!data.canEdit) { toast('🔒 ' + I18N.t('communityEditDenied')); return false; }
        const design = JSON.parse(JSON.stringify(data.design));
        design.communityId = data.story.id;
        design.id = 'comm_' + data.story.id;
        try { joinStory(data.story.id); } catch (e) {}
        DESIGNER.open(design, { id: data.story.id, version: data.story.version || 1 });
        return true;
    }
    // 打赏世界之种：真正的转账 —— 从我的钱包转到故事管理员（作者）账户
    async function tipStory(id, amount) {
        if (!_wallet) await getMe();
        const r = await postTip(id, amount);
        if (r.ok) {
            applyWallet({
                uid: getUid(),
                nick: getName(),
                seeds: r.seeds,
                received: (_wallet && _wallet.received) || 0,
                sent: ((_wallet && _wallet.sent) || 0) + amount
            });
            const ownerName = (r.owner && r.owner.nick) || '';
            toast('💠 ' + T('communityTipSent', '已打赏') + ' ' + amount + (ownerName ? ' → ' + ownerName : ''));
            // 作者本人可能就在旁边（同一浏览器/另一台设备）→ 广播会让他刷新
            return true;
        }
        if (r.error === 'self') toast('ℹ ' + T('communityTipSelf', '这是你自己的故事，心意收下啦'));
        else if (r.error === 'insufficient') toast('⚠ ' + T('communityTipNoSeeds', '世界之种不足'));
        else toast('⚠ ' + T('communityTipFail', '打赏失败'));
        return false;
    }

    // ══════════════ UI 基础 ══════════════
    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }
    function T(key, fallback) { const v = (I18N && I18N.t) ? I18N.t(key) : ''; return v || fallback || key; }
    // 故事名 / 梗概按当前语言取（服务器已把 titleEn·titleJa / descriptionEn·descriptionJa 一起发来）
    function storyTitle(s) {
        if (!s) return '';
        if (typeof STORY !== 'undefined' && STORY.cardTitle) return STORY.cardTitle(s);
        return s.title || '';
    }
    function storyDesc(s) {
        if (!s) return '';
        if (typeof STORY !== 'undefined' && STORY.cardDesc) return STORY.cardDesc(s);
        return s.description || '';
    }
    function iconHTML(icon, size, radius) {
        if (window.IMGDB && IMGDB.renderIconHTML) return IMGDB.renderIconHTML(icon || '✨', size || 24, radius === undefined ? 6 : radius);
        return esc(icon || '✨');
    }
    function mk(tag, css, html) {
        const el = document.createElement(tag);
        if (css) el.style.cssText = css;
        if (html !== undefined) el.innerHTML = html;
        return el;
    }
    function btn(label, color, onClick, css) {
        const b = mk('button', (css || '') + 'flex:1 1 auto;min-width:70px;background:' + color + '22;border:1px solid ' + color + ';color:' + color + ';border-radius:var(--radius-sm);padding:6px 10px;font-size:0.78rem;cursor:pointer;');
        b.textContent = label;
        b.addEventListener('click', (e) => { e.stopPropagation(); onClick(b); });
        return b;
    }
    function host() { return document.getElementById('messages'); }
    function beginScreen() {
        const h = host();
        if (!h) return null;
        h.innerHTML = '';
        if (typeof GAME !== 'undefined' && GAME.setScreen) GAME.setScreen('community');
        const ca = document.getElementById('choice-area');
        if (ca) ca.style.display = 'none';
        const hud = document.getElementById('bp-variable-hud');
        if (hud) hud.style.display = 'none';
        const app = document.getElementById('app');
        if (app) app.classList.add('active');
        const sp = document.getElementById('splash-screen');
        if (sp) sp.classList.add('hidden');
        return h;
    }
    let _toastEl = null, _toastTimer = null;
    // 未连服务器时 api() 会抛错，await 又没有 catch → 点击「毫无反应」。
    // 所有需要联网的按钮先过这道闸，给用户明确反馈。
    function ensureConnected() {
        if (_connected && _server) return true;
        toast('⚠ ' + T('communityNeedServer', '请先连接社区服务器'));
        return false;
    }
    function toast(msg) {
        if (typeof document === 'undefined') return;
        if (!_toastEl) {
            _toastEl = mk('div', 'position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:10101;background:rgba(15,23,42,0.95);color:#e2e8f0;border:1px solid rgba(148,163,184,0.4);border-radius:10px;padding:9px 16px;font-size:0.85rem;pointer-events:none;transition:opacity .25s;opacity:0;max-width:80vw;');
            document.body.appendChild(_toastEl);
        }
        _toastEl.textContent = msg;
        _toastEl.style.opacity = '1';
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => { if (_toastEl) _toastEl.style.opacity = '0'; }, 2400);
    }

    // ══════════════ 身份设置界面 ══════════════
    function showIdentitySetup(then) {
        const h = beginScreen();
        if (!h) return;
        const card = mk('div', 'background:var(--bg-card);border:1px solid var(--accent-blue);border-radius:var(--radius-md);padding:18px;max-width:520px;margin:0 auto;');
        card.innerHTML = `
            <div style="font-size:1.2rem;font-weight:700;margin-bottom:6px;">🌐 ${esc(T('communityIdentity', '设置你的身份'))}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px;">${esc(T('communityIdentityHint', '昵称和头像会显示在你分享的故事、评论和聊天里'))}</div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
                <div id="comm-avatar-preview" style="width:56px;height:56px;border-radius:50%;background:var(--bg-page);border:2px solid var(--accent-blue);display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;"></div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">${esc(T('communityName', '昵称'))}</div>
                    <input id="comm-name-input" maxlength="20" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.9rem;">
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">${esc(T('communityPickAvatar', '选择头像'))}</div>
            <div id="comm-avatar-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;"></div>
            <div style="margin-bottom:12px;background:var(--bg-page);border:1px dashed var(--border-color);border-radius:8px;padding:10px;">
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:5px;">${esc(T('communityAliasLabel', '曾用昵称（可选，认领旧作品）'))}</div>
                <input id="comm-alias-input" maxlength="140" placeholder="${esc(T('communityAliasPh', '以前用过的昵称，多个用逗号隔开'))}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:0.82rem;">
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:5px;line-height:1.5;">${esc(T('communityAliasHint', '改名不会丢身份和世界之种。如果以前的名字下还有作品，填上旧昵称就能认领回来。'))}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin:9px 0 5px;">${esc(T('communityCodeLabel', '认领码（可选）'))}</div>
                <input id="comm-code-input" maxlength="32" placeholder="${esc(T('communityCodePh', '旧作品的认领码，多个用逗号隔开'))}" style="width:100%;background:var(--bg-card);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:0.82rem;">
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:5px;line-height:1.5;">${esc(T('communityCodeHint', '为防止冒名：光填别人的曾用昵称抢不走作品。认领需要其一 —— ①你在这台开服务器的电脑上 ②这台机器上还留着你分享的那篇作品 ③填对认领码（分享时服务器给的）。'))}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <label style="font-size:0.78rem;background:rgba(148,163,184,0.15);border:1px solid var(--border-color);color:var(--text-secondary);border-radius:8px;padding:7px 12px;cursor:pointer;">
                    🖼 ${esc(T('communityUploadAvatar', '上传图片'))}
                    <input id="comm-avatar-file" type="file" accept="image/*" style="display:none;">
                </label>
                <button id="comm-avatar-ok" style="flex:1;background:rgba(59,130,246,0.18);border:1px solid var(--accent-blue);color:var(--accent-blue);border-radius:8px;padding:9px 14px;cursor:pointer;font-size:0.9rem;font-weight:600;">${esc(T('communitySave', '保存并进入社区'))}</button>
            </div>`;
        h.appendChild(card);

        const preview = card.querySelector('#comm-avatar-preview');
        const nameInput = card.querySelector('#comm-name-input');
        let picked = getAvatar();
        nameInput.value = getName();
        function paint() { preview.innerHTML = iconHTML(picked, 40, 9999); }
        paint();

        const grid = card.querySelector('#comm-avatar-grid');
        AVATAR_PRESETS.forEach(a => {
            const b = mk('button', 'width:38px;height:38px;border-radius:50%;border:1px solid var(--border-color);background:var(--bg-page);font-size:1.2rem;cursor:pointer;');
            b.textContent = a;
            b.addEventListener('click', () => { picked = a; paint(); });
            grid.appendChild(b);
        });
        card.querySelector('#comm-avatar-file').addEventListener('change', async (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f || !window.IMGDB) return;
            try {
                const up = await IMGDB.uploadImageFile(f, f.name);
                if (up && up.id) { picked = 'ur-img:' + up.id; paint(); }
            } catch (err) { toast('⚠ ' + err.message); }
        });
        card.querySelector('#comm-avatar-ok').addEventListener('click', () => {
            // 曾用昵称 → 记入身份别名历史，服务器据此认领旧作品/旧账户
            const aliasRaw = (card.querySelector('#comm-alias-input') || {}).value || '';
            aliasRaw.split(/[,，、]+/).forEach(n => { n = n.trim(); if (n) rememberAlias(n.slice(0, 24)); });
            const codeRaw = (card.querySelector('#comm-code-input') || {}).value || '';
            codeRaw.split(/[,，、\s]+/).forEach(c => { if (c.trim()) rememberClaimCode(c); });
            setName(nameInput.value);
            setAvatar(picked);
            // 已登录 → 昵称/头像同步回账号（换设备登录还是这个显示名）
            if (isLoggedIn()) saveProfile({ nick: nameInput.value.trim(), avatar: picked }).catch(() => {});
            if (then) then(); else showHome();
        });
    }

    // ══════════════ 登录 / 注册（进入社区的门）══════════════
    // 账号是社区里的权威身份：注册一次，换设备登录还是同一个人（种子 / 作品 / 团队都跟着走）
    function showAuth(then) {
        const h = beginScreen();
        if (!h) return;
        let mode = 'login';            // login | register
        let picked = getAvatar();
        const card = mk('div', 'background:var(--bg-card);border:1px solid var(--accent-blue);border-radius:var(--radius-md);padding:18px;max-width:520px;margin:0 auto;');
        card.innerHTML = `
            <div style="font-size:1.2rem;font-weight:700;margin-bottom:6px;">🔐 ${esc(T('communityAuthTitle', '登录社区'))}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.6;">${esc(T('communityAuthHint', '注册一个账号并设好密码再进社区。之后世界之种、你发布的故事、团队身份都会跟着这个账号走——换手机登录也还是同一个人。'))}</div>
            <div id="comm-auth-tabs" style="display:flex;gap:8px;margin-bottom:14px;"></div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">${esc(T('communityAccount', '账号'))}</div>
            <input id="comm-auth-account" maxlength="20" autocomplete="username" placeholder="${esc(T('communityAccountPh', '3-20 个字符'))}" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:9px 10px;font-size:0.9rem;margin-bottom:10px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">${esc(T('communityAccountPassword', '密码'))}</div>
            <input id="comm-auth-pass" type="password" maxlength="64" autocomplete="current-password" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:9px 10px;font-size:0.9rem;">
            <div id="comm-auth-extra" style="display:none;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin:10px 0 4px;">${esc(T('communityPassword2', '确认密码'))}</div>
                <input id="comm-auth-pass2" type="password" maxlength="64" autocomplete="new-password" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:9px 10px;font-size:0.9rem;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin:10px 0 4px;">${esc(T('communityName', '昵称'))}</div>
                <input id="comm-auth-nick" maxlength="20" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:9px 10px;font-size:0.9rem;">
                <div style="font-size:0.75rem;color:var(--text-muted);margin:10px 0 6px;">${esc(T('communityPickAvatar', '选择头像'))}</div>
                <div id="comm-auth-avatars" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
            </div>
            <button id="comm-auth-go" style="width:100%;background:rgba(59,130,246,0.18);border:1px solid var(--accent-blue);color:var(--accent-blue);border-radius:8px;padding:10px 14px;cursor:pointer;font-size:0.95rem;font-weight:600;margin-top:14px;">${esc(T('communityLoginGo', '登录并进入社区'))}</button>
            <div id="comm-auth-err" style="font-size:0.78rem;color:var(--accent-red);margin-top:8px;min-height:1.1em;line-height:1.5;"></div>`;
        h.appendChild(card);
        if (!_connected) card.appendChild(mk('div', 'margin-top:14px;', '')).appendChild(discoveryPanel());

        const tabs = card.querySelector('#comm-auth-tabs');
        const accountEl = card.querySelector('#comm-auth-account');
        const passEl = card.querySelector('#comm-auth-pass');
        const pass2El = card.querySelector('#comm-auth-pass2');
        const nickEl = card.querySelector('#comm-auth-nick');
        const extra = card.querySelector('#comm-auth-extra');
        const goBtn = card.querySelector('#comm-auth-go');
        const errEl = card.querySelector('#comm-auth-err');
        nickEl.value = getName();

        const grid = card.querySelector('#comm-auth-avatars');
        AVATAR_PRESETS.forEach(a => {
            const b = mk('button', 'width:34px;height:34px;border-radius:50%;border:1px solid ' + (a === picked ? 'var(--accent-blue)' : 'var(--border-color)') + ';background:var(--bg-page);font-size:1.1rem;cursor:pointer;');
            b.textContent = a;
            b.addEventListener('click', () => {
                picked = a;
                grid.querySelectorAll('button').forEach(x => { x.style.borderColor = (x.textContent === a ? 'var(--accent-blue)' : 'var(--border-color)'); });
            });
            grid.appendChild(b);
        });

        function paintTabs() {
            tabs.innerHTML = '';
            [['login', T('communityAuthLogin', '登录')], ['register', T('communityAuthReg', '注册')]].forEach(pair => {
                const on = mode === pair[0];
                const b = mk('button', 'flex:1;background:' + (on ? 'rgba(59,130,246,0.2)' : 'transparent') + ';border:1px solid ' + (on ? 'var(--accent-blue)' : 'var(--border-color)') + ';color:' + (on ? 'var(--accent-blue)' : 'var(--text-secondary)') + ';border-radius:8px;padding:7px 10px;font-size:0.85rem;cursor:pointer;');
                b.textContent = pair[1];
                b.addEventListener('click', () => { mode = pair[0]; errEl.textContent = ''; paintTabs(); });
                tabs.appendChild(b);
            });
            extra.style.display = mode === 'register' ? 'block' : 'none';
            goBtn.textContent = mode === 'register' ? T('communityRegGo', '注册并进入社区') : T('communityLoginGo', '登录并进入社区');
        }
        paintTabs();

        const errText = (code) => ({
            'account taken': T('communityAccountTaken', '这个账号已经有人用了，换一个试试'),
            'bad credentials': T('communityLoginFail', '账号或密码不对'),
            'account too short': T('communityAccountBad', '账号要 3-20 个字符'),
            'password too short': T('communityPasswordShort', '密码至少 4 位')
        }[code] || T('communityAuthFail', '没能进入社区，请重试'));

        async function submit() {
            errEl.textContent = '';
            if (!_connected) { toast('⚠ ' + T('communityNeedServer', '请先连接社区服务器')); return; }
            const acc = (accountEl.value || '').trim();
            const pw = passEl.value || '';
            if (acc.length < 3) { errEl.textContent = T('communityAccountBad', '账号要 3-20 个字符'); return; }
            if (pw.length < 4) { errEl.textContent = T('communityPasswordShort', '密码至少 4 位'); return; }
            let r;
            goBtn.disabled = true;
            try {
                if (mode === 'register') {
                    if (pw !== (pass2El.value || '')) {
                        errEl.textContent = T('communityPasswordMismatch', '两次输入的密码不一致');
                        return;
                    }
                    r = await registerAccount(acc, pw, (nickEl.value || '').trim() || acc, picked);
                } else {
                    r = await loginAccount(acc, pw);
                }
            } catch (e) { r = { status: 0, data: {} }; }
            goBtn.disabled = false;
            if (r.status === 200 && r.data.ok) {
                toast('✓ ' + (mode === 'register' ? T('communityRegOk', '注册成功') : T('communityLoginOk', '登录成功')));
                if (then) then(); else showHome();
                return;
            }
            errEl.textContent = errText(r.data && r.data.error);
        }
        goBtn.addEventListener('click', submit);
        [passEl, pass2El, nickEl].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
        accountEl.focus();
    }

    // ══════════════ 个人中心 ══════════════
    function fmtDate(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
    function levelTitle(lv) {
        const p = _profile && _profile.level;
        const k = (lv && lv.titleKey) || (p && p.titleKey) || '';
        const t = (I18N && I18N.t) ? I18N.t(k) : '';
        return (t && t !== k) ? t : ((lv && lv.title) || '');
    }
    async function showProfile() {
        const h = beginScreen();
        if (!h) return;
        const p = (await fetchProfile()) || _profile;
        if (!p) { showAuth(showHome); return; }

        const lv = p.level || {};
        const w = p.wallet || {};
        const st = p.stats || {};
        const card = mk('div', 'background:var(--bg-card);border:1px solid var(--accent-blue);border-radius:var(--radius-md);padding:18px;max-width:560px;margin:0 auto;');
        const ipRows = (p.ips || []).slice(0, 12).map(x => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:0.78rem;padding:6px 0;border-bottom:1px dashed var(--border-color);">
                <span style="font-family:monospace;color:var(--text-primary);">🖥 ${esc(x.ip)}</span>
                <span style="color:var(--text-muted);">${esc(T('communityDeviceTimes', '{n} 次').replace('{n}', x.times || 1))} · ${esc(fmtDate(x.last))}</span>
            </div>`).join('') || `<div style="font-size:0.78rem;color:var(--text-muted);">—</div>`;

        card.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
                <div style="font-size:1.15rem;font-weight:700;">👤 ${esc(T('communityProfile', '个人中心'))}</div>
                <button id="comm-profile-back" style="background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:8px;padding:5px 12px;font-size:0.78rem;cursor:pointer;">${esc(T('communityBack', '返回社区'))}</button>
            </div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
                ${iconHTML(p.avatar || getAvatar(), 52, 9999)}
                <div style="flex:1;min-width:0;">
                    <div style="font-size:1.05rem;font-weight:600;">${esc(p.nick || getName())}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">@${esc(p.account || '')} · ${esc(T('communityRegisteredAt', '注册于 {d}').replace('{d}', fmtDate(p.createdAt)))}</div>
                </div>
            </div>
            <div style="background:var(--bg-page);border:1px solid var(--border-color);border-radius:10px;padding:12px;margin-bottom:12px;">
                <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px;">
                    <div style="font-size:0.95rem;font-weight:700;color:var(--accent-yellow);">${esc(T('communityLevel', '等级'))} Lv.${lv.lv || 1} · ${esc(levelTitle(lv))}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">${lv.max ? esc(T('communityLevelMax', '已满级')) : esc(T('communityNextLevel', '距下一级还差 {n}').replace('{n}', lv.need || 0))}</div>
                </div>
                <div style="height:8px;background:rgba(148,163,184,0.2);border-radius:999px;overflow:hidden;">
                    <div style="height:100%;width:${Math.max(2, Math.min(100, lv.pct || 0))}%;background:linear-gradient(90deg,var(--accent-yellow),var(--accent-blue));border-radius:999px;"></div>
                </div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;">${esc(T('communityExp', '经验'))} ${lv.exp || 0}${lv.next ? ' / ' + lv.next : ''}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                ${statChip('💠', T('communitySeedBalance', '余额'), w.seeds || 0)}
                ${statChip('📥', T('communitySeedsGot', '累计获得'), w.received || 0)}
                ${statChip('📤', T('communitySeedsSent', '累计送出'), w.sent || 0)}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
                ${statChip('📖', T('communityMyStories', '我发布的'), (st.own || 0) + ' ' + T('communityUnitStory', '篇'))}
                ${statChip('🤝', T('communityCollabStories', '参与协作'), (st.collab || 0) + ' ' + T('communityUnitStory', '篇'))}
                ${statChip('💬', T('communityComments', '评论'), (st.comments || 0) + ' ' + T('communityUnitTime', '次'))}
                ${statChip('🎁', T('communityTips', '打赏'), (st.tipsSent || 0) + ' ' + T('communityUnitTime', '次'))}
            </div>
            <div style="font-size:0.8rem;font-weight:600;margin-bottom:6px;">🖥 ${esc(T('communityDevices', '登录过的设备'))}</div>
            <div style="background:var(--bg-page);border:1px solid var(--border-color);border-radius:10px;padding:10px 12px;margin-bottom:12px;">${ipRows}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:14px;line-height:1.6;">
                ${esc(T('communityLoginCount', '累计登录 {n} 次').replace('{n}', p.logins || 0))} · ${esc(T('communityLastLogin', '最近登录 {d}').replace('{d}', fmtDate(p.lastLoginAt)))}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button id="comm-profile-edit" style="flex:1;background:rgba(59,130,246,0.15);border:1px solid var(--accent-blue);color:var(--accent-blue);border-radius:8px;padding:9px 12px;font-size:0.85rem;cursor:pointer;">✏️ ${esc(T('communityEditProfile', '改昵称 / 头像'))}</button>
                <button id="comm-profile-out" style="flex:1;background:rgba(239,68,68,0.12);border:1px solid var(--accent-red);color:var(--accent-red);border-radius:8px;padding:9px 12px;font-size:0.85rem;cursor:pointer;">🚪 ${esc(T('communityLogout', '退出登录'))}</button>
            </div>`;
        h.appendChild(card);
        card.querySelector('#comm-profile-back').addEventListener('click', () => showHome());
        card.querySelector('#comm-profile-edit').addEventListener('click', () => showIdentitySetup(showProfile));
        card.querySelector('#comm-profile-out').addEventListener('click', async () => {
            await logoutServer();
            toast('👋 ' + T('communityLoggedOut', '已退出登录'));
            showAuth(showHome);
        });
    }
    function statChip(icon, label, value) {
        return `<div style="flex:1 1 30%;min-width:96px;background:var(--bg-page);border:1px solid var(--border-color);border-radius:10px;padding:8px 10px;">
            <div style="font-size:0.7rem;color:var(--text-muted);">${icon} ${esc(label)}</div>
            <div style="font-size:0.95rem;font-weight:700;margin-top:2px;">${esc(String(value))}</div>
        </div>`;
    }

    // ══════════════ 自动发现面板 ══════════════
    let _discoState = { running: false, done: false, found: [], scanned: 0, total: 0 };
    let _discoTimer = null;
    let _discoUserStop = false;      // 用户手动点了「停止」→ 不再自动连接

    function copyText(text) {
        const done = () => toast('📋 ' + T('communityCopied', '已复制'));
        const fb = () => {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                done();
            } catch (e) { toast('⚠ ' + text); }
        };
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, fb);
                return;
            }
        } catch (e) {}
        fb();
    }

    // 面板每次重建都从这里重绘（扫描在后台持续推进，退到别的页面再回来也不会断）
    function syncDiscoUI() {
        const statusEl = document.getElementById('comm-disco-status');
        if (!statusEl) return false;
        const fillEl = document.getElementById('comm-disco-fill');
        const stopEl = document.getElementById('comm-disco-stop');
        const listEl = document.getElementById('comm-disco-list');
        const st = _discoState;
        if (st.running) {
            const pct = st.total ? Math.max(3, Math.round(st.scanned / st.total * 100)) : 3;
            statusEl.textContent = '⏳ ' + T('communitySearching', '正在自动搜索附近的社区服务器…') + '  ' + st.scanned + '/' + st.total;
            statusEl.className = 'comm-disco-status is-busy';
            fillEl.style.width = pct + '%';
            stopEl.style.display = '';
            stopEl.textContent = T('communitySearchStop', '停止');
            const hintEl = document.getElementById('comm-disco-offhint');
            if (hintEl) hintEl.style.display = 'none';
        } else {
            stopEl.style.display = 'none';
            if (st.found.length) {
                statusEl.textContent = '✅ ' + T('communitySearchFound', '找到 {n} 个社区服务器').replace('{n}', st.found.length);
                statusEl.className = 'comm-disco-status is-ok';
                fillEl.style.width = '100%';
            } else {
                statusEl.textContent = '⚠ ' + T('communitySearchNone', '附近没有找到社区服务器');
                statusEl.className = 'comm-disco-status is-none';
                fillEl.style.width = '0%';
                // 扫完一个都没找到 → 直接把「手动输入地址」摊开，并提示服务器要先开着
                // （注意：必须等扫描真正结束 st.done，面板首次渲染时别急着摊开）
                const hintEl = document.getElementById('comm-disco-offhint');
                if (st.done) {
                    const moreEl = document.querySelector('.comm-disco-more');
                    if (moreEl && !st.found.length) moreEl.open = true;
                    if (hintEl && !st.found.length) hintEl.style.display = '';
                }
            }
        }
        // 结果列表：内容变了才重建
        const sig = st.found.map(x => x.url).join('|');
        if (listEl && listEl.getAttribute('data-sig') !== sig) {
            listEl.setAttribute('data-sig', sig);
            listEl.innerHTML = '';
            st.found.forEach(info => {
                const item = mk('div', '');
                item.className = 'comm-disco-item';
                const tag = info.mdns ? ' <span class="comm-disco-tag">' + esc(T('communityUnifiedTag', '统一地址')) + '</span>' : '';
                item.innerHTML = `<div class="comm-disco-item-main">
                        <div class="comm-disco-item-name">🌐 ${esc(info.name || info.url)}${tag}</div>
                        <div class="comm-disco-item-url">${esc(info.url)} · ${info.stories} ${esc(T('communityStoryCount', '个故事'))}</div>
                    </div>`;
                item.appendChild(btn(T('communityConnect', '连接'), 'var(--accent-blue)', async () => {
                    cancelDiscovery();
                    _discoState.running = false; _discoState.done = true;
                    if (await connect(info.url, false)) showHome();
                }, 'flex:0 0 auto;min-width:64px;'));
                listEl.appendChild(item);
            });
        }
        return true;
    }

    // 扫描进行中时按固定节奏重绘（面板被重建/离开页面会自动停）
    function ensureDiscoTicker() {
        if (_discoTimer) return;
        const t = setInterval(() => {
            if (_discoTimer !== t) { clearInterval(t); return; }      // 已被新面板替换
            const alive = syncDiscoUI();
            if (!alive || !_discoState.running) {
                clearInterval(t);
                if (_discoTimer === t) _discoTimer = null;
            }
        }, 260);
        _discoTimer = t;
    }

    async function runDiscovery(deep) {
        if (_discoState.running) return;
        _discoState = { running: true, done: false, found: [], scanned: 0, total: 0 };
        _discoUserStop = false;
        syncDiscoUI();
        ensureDiscoTicker();
        const found = await discover({
            deep: deep,
            onProgress: (hd) => { _discoState.scanned = hd.scanned; _discoState.total = hd.total; },
            onFound: (info, hd) => { _discoState.found = hd.found.slice(); }
        });
        _scannedOnce = true;
        _discoState.running = false;
        _discoState.done = true;
        _discoState.found = found;
        syncDiscoUI();
        // 只找到一个 → 直接连上，用户什么都不用点（除非他刚点了「停止」）
        if (found.length === 1 && !_connected && !_autoConnecting && !_discoUserStop) {
            _autoConnecting = true;
            const ok = await connect(found[0].url, false);
            _autoConnecting = false;
            if (ok) showHome();
        }
    }

    // ══════════════ 在线社区（公网）══════════════
    // 云端部署的那台服务器：不在同一个 WiFi 也进得去，手机用流量也可以。
    // 它不参与局域网扫描结果（避免「扫不到」的判定被它救活），单独作为一个入口。
    const CLOUD_URL = 'https://unintended-reply.app.workbuddy.host';
    function cloudUrl() {
        try { return (localStorage.getItem(LS_CLOUD) || '').trim() || CLOUD_URL; }
        catch (e) { return CLOUD_URL; }
    }

    function cloudPanel() {
        const box = mk('div', '');
        box.className = 'comm-selfhost';
        box.innerHTML = `
            <div class="comm-selfhost-row">
                <span class="comm-selfhost-dot" style="background:var(--accent-blue);"></span>
                <span class="comm-selfhost-text">☁ ${esc(T('communityOnlineTitle', '在线社区（公网）'))}</span>
                <span style="flex:1 1 auto;"></span>
                <button id="comm-cloud-go" class="comm-disco-mini">${esc(T('communityOnlineGo', '连接'))}</button>
            </div>
            <div class="comm-disco-hint">${esc(T('communityOnlineHint', '不用连同一个 WiFi，手机用流量也能进；故事保存在云端，任何设备都能看到。'))}</div>`;
        box.querySelector('#comm-cloud-go').addEventListener('click', async () => {
            const url = cloudUrl();
            cancelDiscovery();
            if (await connect(url, false)) showHome();
            else toast('⚠ ' + T('communityConnectFail', '连接失败') + '：' + url);
        });
        return box;
    }

    // ══════════════ 本机服务器状态条 ══════════════
    // 桌面：探测 127.0.0.1，没跑就给一个真正的「一键启动」按钮（靠 unintended-reply:// 协议拉起无窗启动器）
    // 手机/平板 App：网页层没法监听端口，所以不开服务器，只需和开服的电脑同 WiFi
    function isDesktopHost() {
        let inApp = false;
        try { inApp = (typeof plus !== 'undefined'); } catch (e) {}
        if (inApp) return false;
        const ua = navigator.userAgent || '';
        if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Windows Phone|Mobile/i.test(ua)) return false;
        return true;
    }

    function selfHostPanel() {
        const box = mk('div', '');
        box.className = 'comm-selfhost';
        box.innerHTML = `
            <div class="comm-selfhost-row">
                <span id="comm-selfhost-dot" class="comm-selfhost-dot is-scan"></span>
                <span id="comm-selfhost-text" class="comm-selfhost-text">${esc(T('communitySelfScan', '正在检测本机服务器…'))}</span>
                <span style="flex:1 1 auto;"></span>
                <button id="comm-selfhost-start" class="comm-disco-mini comm-disco-primary" style="display:none;">▶ ${esc(T('communitySelfStart', '一键启动本机服务器'))}</button>
                <button id="comm-selfhost-open" class="comm-disco-mini" style="display:none;">${esc(T('communitySelfOpen', '打开本机社区'))}</button>
            </div>
            <div id="comm-selfhost-hint" class="comm-disco-hint" style="display:none;"></div>`;

        const dot = box.querySelector('#comm-selfhost-dot');
        const txt = box.querySelector('#comm-selfhost-text');
        const bStart = box.querySelector('#comm-selfhost-start');
        const bOpen = box.querySelector('#comm-selfhost-open');
        const hint = box.querySelector('#comm-selfhost-hint');
        const localBase = () => 'http://127.0.0.1:' + getPort();

        bStart.addEventListener('click', async () => {
            bStart.disabled = true;
            dot.className = 'comm-selfhost-dot is-scan';
            txt.textContent = T('communitySelfStarting', '正在启动，几秒后自动连上…');
            askOsToStartServer();
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1500));
                const info = await probeOnce(localBase(), 1200);
                if (info && await connect(info.url, false)) { showHome(); return; }
            }
            bStart.disabled = false;
            dot.className = 'comm-selfhost-dot is-down';
            txt.textContent = '○ ' + T('communitySelfDown', '本机还没启动服务器');
            hint.style.display = '';
            hint.textContent = T('communitySelfFallbackHint', '没反应？双击桌面上的「无心之举 社区服务器」快捷方式就行，以后开机也会自动启动。');
        });
        bOpen.addEventListener('click', async () => {
            if (await connect(localBase(), false)) showHome();
        });

        setTimeout(() => refreshSelfHost(box), 0);
        return box;
    }

    async function refreshSelfHost(box) {
        if (!box || !box.isConnected) return;
        const dot = box.querySelector('#comm-selfhost-dot');
        const txt = box.querySelector('#comm-selfhost-text');
        const bStart = box.querySelector('#comm-selfhost-start');
        const bOpen = box.querySelector('#comm-selfhost-open');
        const hint = box.querySelector('#comm-selfhost-hint');
        const localBase = () => 'http://127.0.0.1:' + getPort();
        const info = await probeOnce(localBase(), 1200);
        if (!box.isConnected) return;
        if (info) {
            dot.className = 'comm-selfhost-dot is-up';
            txt.textContent = '● ' + T('communitySelfUp', '本机服务器正在运行');
            bStart.style.display = 'none';
            bOpen.style.display = '';
            hint.style.display = 'none';
            if (!_connected) {
                cancelDiscovery();
                if (await connect(info.url, false)) showHome();
            }
            return;
        }
        dot.className = 'comm-selfhost-dot is-down';
        txt.textContent = '○ ' + T('communitySelfDown', '本机还没启动服务器');
        bOpen.style.display = 'none';
        hint.style.display = '';
        if (isDesktopHost()) {
            bStart.style.display = '';
            hint.textContent = T('communitySelfStartHint', '让这台电脑当服务器：点右边按钮，或双击桌面上的「无心之举 社区服务器」快捷方式。');
        } else {
            bStart.style.display = 'none';
            hint.textContent = T('communitySelfMobileHint', '手机/平板不用开服务器：和开着《无心之举》的电脑连同一个 WiFi，就会被自动发现。');
        }
    }

    // 通过自定义 URL 协议让操作系统拉起本机启动器（Windows 由 server/install-one-click.ps1 注册）
    function askOsToStartServer() {
        const href = 'unintended-reply://start';
        try {
            const fr = document.createElement('iframe');
            fr.style.display = 'none';
            fr.src = href;
            document.body.appendChild(fr);
            setTimeout(() => { try { fr.remove(); } catch (e) {} }, 4000);
        } catch (e) {}
        try { window.location.href = href; } catch (e) {}
    }

    function discoveryPanel() {
        const box = mk('div', '');
        box.className = 'comm-disco';
        box.innerHTML = `
            <div class="comm-disco-head">
                <span id="comm-disco-status" class="comm-disco-status">…</span>
                <div style="display:flex;gap:6px;flex:0 0 auto;">
                    <button id="comm-disco-retry" class="comm-disco-mini">🔄 ${esc(T('communityRescan', '重新扫描'))}</button>
                    <button id="comm-disco-stop" class="comm-disco-mini" style="display:none;"></button>
                </div>
            </div>
            <div id="comm-disco-offhint" class="comm-disco-hint" style="display:none;">${esc(T('communityServerOffHint', '连不上多半是服务器那台电脑没开着服务：在它上面双击项目里的 start-community-server.bat（窗口别关），再点上面的「重新扫描」。'))}</div>
            <div class="comm-disco-bar"><i id="comm-disco-fill"></i></div>
            <div id="comm-disco-list" class="comm-disco-list" data-sig=""></div>
            <div class="comm-disco-unified">
                <span class="comm-disco-unified-k">🔗 ${esc(T('communityUnified', '统一内网地址'))}</span>
                <code class="comm-disco-code">${esc(unifiedUrl())}</code>
                <button id="comm-disco-copy" class="comm-disco-mini">${esc(T('communityCopy', '复制'))}</button>
                <div class="comm-disco-hint">${esc(T('communityUnifiedHint', '同一 WiFi 下所有人打开这个网址就能进入同一个社区，不用记 IP'))}</div>
                <div id="comm-disco-ip" class="comm-disco-hint">${esc(T('communityDetectingIp', '正在识别本机地址…'))}</div>
            </div>
            <details class="comm-disco-more">
                <summary>${esc(T('communityManualToggle', '没找到？手动输入地址 / 深度扫描'))}</summary>
                <div class="comm-disco-manual">
                    <input id="comm-disco-input" class="comm-disco-input" autocomplete="off" spellcheck="false">
                    <button id="comm-disco-connect" class="comm-disco-mini comm-disco-primary">${esc(T('communityConnect', '连接'))}</button>
                </div>
                <div class="comm-disco-hint">${esc(T('communityManualHint', '知道 WiFi 名字并不能推出服务器地址：需要开服务器那台电脑的 IP。在它上面看服务器启动日志，或命令行运行 ipconfig，把 IPv4 地址填进来，如 http://192.168.1.5:8787'))}</div>
                <label class="comm-disco-deep">
                    <input type="checkbox" id="comm-disco-deep"> ${esc(T('communitySearchDeep', '深度扫描更多网段（更慢，覆盖 10.x / 手机热点等）'))}
                </label>
            </details>`;

        // 「本机服务器」状态条放在最上面，「在线社区」入口紧随其后
        // （都在 innerHTML 赋值之后再插入，避免被重建）
        const selfHostEl = selfHostPanel();
        box.insertBefore(selfHostEl, box.firstChild);
        box.insertBefore(cloudPanel(), selfHostEl.nextSibling);

        const inputEl = box.querySelector('#comm-disco-input');
        const deepEl = box.querySelector('#comm-disco-deep');
        inputEl.placeholder = T('communityServerPh', '服务器地址，如 http://192.168.1.5:8787');
        try { inputEl.value = localStorage.getItem(LS_SERVER) || ''; } catch (e) {}
        deepEl.checked = _deepScan;

        box.querySelector('#comm-disco-stop').addEventListener('click', () => {
            cancelDiscovery();
            _discoUserStop = true;
            _discoState.running = false;
            _discoState.done = true;
            _scannedOnce = true;
            syncDiscoUI();
        });
        box.querySelector('#comm-disco-copy').addEventListener('click', () => copyText(unifiedUrl()));
        box.querySelector('#comm-disco-retry').addEventListener('click', () => {
            _scannedOnce = false;          // 允许再来一遍
            _discoUserStop = false;
            runDiscovery(_deepScan);
        });
        // 手机/平板上页面是 file://，拿不到自己网段 → 用 WebRTC 反查本机 IP，
        // 显示出来既能让用户核对网段，也能解释「为什么扫的是这些地址」
        localIps().then(ips => {
            const el = box.querySelector('#comm-disco-ip');
            if (!el) return;
            el.textContent = ips.length
                ? '📱 ' + T('communityMyIp', '你的地址') + '：' + ips.join(' / ') + '（' + T('communityScanHint', '将优先扫描这些网段') + '）'
                : '⚠ ' + T('communityNoIp', '没识别到本机地址，将扫描常见网段；也可在下面手动填服务器地址');
        });
        deepEl.addEventListener('change', () => { _deepScan = !!deepEl.checked; });
        const doConnect = async () => {
            const v = (inputEl.value || '').trim();
            if (!v) return;
            cancelDiscovery();
            _discoState.running = false; _discoState.done = true;
            if (await connect(v, false)) showHome();
        };
        box.querySelector('#comm-disco-connect').addEventListener('click', doConnect);
        inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConnect(); });

        // 面板装好后立即同步一次；没扫过就自动开扫
        setTimeout(() => {
            if (_discoTimer) { clearInterval(_discoTimer); _discoTimer = null; }
            syncDiscoUI();
            ensureDiscoTicker();
            if (!_scannedOnce && !_discoState.running && !_connected) runDiscovery(_deepScan);
        }, 0);
        return box;
    }

    // 判断一个地址是不是「能发给外人的公网地址」（局域网 / 本机 / .local 都不算）
    function isPublicUrl(u) {
        try {
            if (!u) return false;
            const p = new URL(u);
            if (p.protocol !== 'http:' && p.protocol !== 'https:') return false;
            const h = p.hostname || '';
            const priv = !h || h === 'localhost' || h === '::1' ||
                /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
                /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || /\.local$/i.test(h);
            return !priv;
        } catch (e) { return false; }
    }
    // 用户此刻打开的地址本身就是公网地址的话，它就是最好用的分享链接
    function pagePublicOrigin() {
        try {
            const o = location.origin;
            if (!o || o === 'null') return '';
            return isPublicUrl(o) ? o.replace(/\/+$/, '') : '';
        } catch (e) { return ''; }
    }

    // 已连接时告诉用户「怎么把别人拉进来」
    function inviteBar() {
        const box = mk('div', '');
        box.className = 'comm-invite';
        const uni = (_serverInfo && _serverInfo.unified) || '';
        const lan = (_serverInfo && _serverInfo.lan && _serverInfo.lan[0]) || '';
        // 公网部署时，别人真正能打开的地址：优先「我自己当前打开的地址」，
        // 其次是服务器回报的公网地址，最后是当前连接的地址（如果它也是公网的话）
        const pub = pagePublicOrigin() ||
            ((_serverInfo && _serverInfo.public) || '') ||
            (isPublicUrl(_server) ? _server : '');
        const first = pub || uni || unifiedUrl();
        box.innerHTML = `
            <div class="comm-invite-line">
                <span class="comm-invite-k">${pub ? '🌍 ' + esc(T('communityInviteOnline', '在线地址')) : '🔗 ' + esc(T('communityInviteUnified', '统一地址'))}</span>
                <code class="comm-disco-code">${esc(first)}</code>
                <button class="comm-disco-mini" id="comm-invite-copy1">${esc(T('communityCopy', '复制'))}</button>
            </div>
            ${lan ? `<div class="comm-invite-line">
                <span class="comm-invite-k">🖥 ${esc(T('communityInviteLan', '本机地址'))}</span>
                <code class="comm-disco-code">${esc(lan)}</code>
                <button class="comm-disco-mini" id="comm-invite-copy2">${esc(T('communityCopy', '复制'))}</button>
            </div>` : ''}
            <div class="comm-disco-hint">${esc(pub
                ? T('communityInviteOnlineHint', '把这个链接发给任何人，他不用连 WiFi、用手机流量也能进来')
                : T('communityInviteHint', '让其他人连同一个 WiFi，打开上面的地址就能进入这个社区'))}</div>`;
        box.querySelector('#comm-invite-copy1').addEventListener('click', () => copyText(first));
        const c2 = box.querySelector('#comm-invite-copy2');
        if (c2) c2.addEventListener('click', () => copyText(lan));
        return box;
    }

    // ══════════════ 顶部状态条 ══════════════
    function headerBar(h) {
        const bar = mk('div', 'background:var(--bg-card);border:1px solid var(--accent-blue);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:12px;');
        const status = _connected
            ? '🟢 ' + T('communityConnected', '已连接') + ' · ' + esc(_server)
            : '🔴 ' + T('communityNotConnected', '未连接社区服务器');
        const mySeeds = (_wallet && typeof _wallet.seeds === 'number') ? _wallet.seeds
            : ((typeof SAVE !== 'undefined' && SAVE.getSeeds) ? SAVE.getSeeds() : 0);
        bar.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="font-size:1.2rem;font-weight:700;">🌐 ${esc(T('communityTitle', '故事社区'))}</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;color:var(--text-secondary);">
                        ${iconHTML(getAvatar(), 26, 9999)}
                        <span>${esc(getName())}</span>
                        <span id="comm-me-seeds" style="font-size:0.72rem;color:var(--accent-yellow);background:rgba(250,204,21,0.12);border:1px solid rgba(250,204,21,0.35);border-radius:999px;padding:2px 8px;">💠 ${mySeeds}</span>
                    </div>
                    <button id="comm-me-profile" style="background:rgba(148,163,184,0.12);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:5px 10px;font-size:0.75rem;cursor:pointer;">👤<span id="comm-me-lv" style="color:var(--accent-yellow);margin-left:4px;"></span></button>
                    <button id="comm-edit-me" style="background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:8px;padding:5px 10px;font-size:0.75rem;cursor:pointer;">✏️</button>
                </div>
            </div>
            <div style="font-size:0.75rem;color:${_connected ? 'var(--accent-green)' : 'var(--text-muted)'};margin-top:6px;">${status}${_serverName ? ' · ' + esc(_serverName) : ''}</div>`;
        bar.appendChild(_connected ? inviteBar() : discoveryPanel());
        h.appendChild(bar);
        bar.querySelector('#comm-edit-me').addEventListener('click', () => showIdentitySetup(showHome));
        bar.querySelector('#comm-me-profile').addEventListener('click', () => showProfile());
        paintLevelChip();
        return bar;
    }
    // 顶栏等级徽章（登录后才有；没拿到就留空，不阻塞首屏）
    async function paintLevelChip() {
        const el = document.getElementById('comm-me-lv');
        if (!el) return;
        if (!isLoggedIn()) { el.textContent = ''; return; }
        const p = _profile || (await fetchProfile());
        if (p && p.level) el.textContent = 'Lv.' + p.level.lv;
    }

    function filterRow(h, onPick) {
        const row = mk('div', 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;');
        const tabs = [
            ['all', T('communityFilterAll', '全部')],
            ['public', T('communityFilterPublic', '公开')],
            ['team', T('communityFilterTeam', '团队')],
            ['mine', T('communityFilterMine', '我的')]
        ];
        tabs.forEach(pair => {
            const k = pair[0], label = pair[1];
            const b = mk('button', 'background:' + (_filter === k ? 'rgba(59,130,246,0.2)' : 'transparent') + ';border:1px solid ' + (_filter === k ? 'var(--accent-blue)' : 'var(--border-color)') + ';color:' + (_filter === k ? 'var(--accent-blue)' : 'var(--text-secondary)') + ';border-radius:8px;padding:6px 14px;font-size:0.8rem;cursor:pointer;');
            b.textContent = label;
            b.addEventListener('click', () => { _filter = k; onPick(); });
            row.appendChild(b);
        });
        h.appendChild(row);
    }

    // ══════════════ 社区首页 ══════════════
    // 进社区后后台同步「我的世界之种」，只刷新顶栏种子数，不阻塞首屏渲染
    function refreshSeedChip() {
        const chip = document.getElementById('comm-me-seeds');
        if (!chip) return;
        const mySeeds = (_wallet && typeof _wallet.seeds === 'number') ? _wallet.seeds
            : ((typeof SAVE !== 'undefined' && SAVE.getSeeds) ? SAVE.getSeeds() : 0);
        chip.textContent = '💠 ' + mySeeds;
    }

    async function showHome() {
        const h = beginScreen();
        if (!h) return;
        _view = null; _detail = null;
        // 先立即渲染首页（顶栏 + 网格骨架），钱包同步放后台，避免网络往返期间白屏
        headerBar(h);
        filterRow(h, showHome);

        const grid = mk('div', '');
        grid.className = 'story-card-grid';
        h.appendChild(grid);

        if (!_connected) {
            // 文案固定、无外部输入，直接作为 HTML 以支持换行
            grid.appendChild(mk('div', 'grid-column:1/-1;font-size:0.82rem;color:var(--text-muted);line-height:1.8;',
                T('communityNeedServerHint', '连上社区服务器后，这里就会列出所有人的故事。<br>还没人开服务器？随便找一台电脑运行 <code>node server/community.js</code>，其他人打开它给出的统一地址即可。')));
        } else {
            grid.appendChild(mk('div', 'grid-column:1/-1;font-size:0.8rem;color:var(--text-muted);', '…'));
            if (_connected) {
                // 后台同步钱包，拿到后只刷新顶栏种子数
                getMe().then(refreshSeedChip).catch(() => {});
                const list = await listStories();
                grid.innerHTML = '';
                const me = getName();
                const myUid = getUid();
                const shown = list.filter(s =>
                    _filter === 'all' ? true :
                    _filter === 'public' ? s.visibility === 'public' :
                    _filter === 'team' ? s.visibility === 'team' :
                    !!(s.mine || s.owner === myUid || s.author === me));
                if (!shown.length) grid.appendChild(mk('div', 'grid-column:1/-1;font-size:0.85rem;color:var(--text-muted);', esc(T('communityEmpty', '还没有人分享故事'))));
                shown.forEach(s => grid.appendChild(storyCard(s)));
            }
        }

        const shareBtn = btn('🌐 ' + T('communityShareMy', '分享我的故事'), 'var(--accent-yellow)', () => showSharePicker(), 'flex:0 0 auto;width:100%;padding:10px;font-size:0.85rem;margin-top:14px;');
        h.appendChild(shareBtn);

        const back = mk('button', 'margin-top:8px;width:100%;padding:12px;', '');
        back.className = 'ending-btn';
        back.textContent = '← ' + T('mainMenu', '返回主菜单');
        back.addEventListener('click', () => { if (typeof GAME !== 'undefined' && GAME.showMainMenu) GAME.showMainMenu(); });
        h.appendChild(back);
    }

    function storyCard(s) {
        const mine = !!(s.mine || s.owner === getUid() || s.author === getName());
        const theme = s.themeColor || 'var(--accent-yellow)';
        const card = mk('div', 'background:var(--bg-card);border:1px solid ' + theme + ';border-radius:var(--radius-md);padding:14px;cursor:pointer;' + (s.lockedTeam ? 'border-style:dashed;' : ''));
        card.className = 'story-card story-card-custom';
        card.innerHTML = `
            <div style="font-size:1.7rem;margin-bottom:4px;min-height:2rem;">${iconHTML(s.icon || '✨', 30)}</div>
            <div style="font-size:1.05rem;font-weight:700;color:${theme};overflow-wrap:break-word;word-break:break-word;">${esc(storyTitle(s))} ${s.lockedTeam ? '🔒' : ''}</div>
            ${storyDesc(s) ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin:4px 0;overflow-wrap:break-word;word-break:break-word;">${esc(storyDesc(s))}</div>` : ''}
            <div style="font-size:0.72rem;color:var(--text-muted);line-height:1.7;">
                ${iconHTML(s.avatar || '👤', 14, 9999)} ${esc(s.author || '—')} · v${s.version || 1}<br>
                💠 ${s.tipTotal || 0} · 💬 ${s.comments || 0} · 👥 ${(s.members || []).length}
                ${s.lockedTeam ? ' · 🔒 ' + esc(T('communityVisTeam', '仅团队')) : ''}
            </div>
            ${s.exam ? `<div style="margin-top:6px;font-size:0.72rem;">🎓 ${esc(examStatusText(s.exam.status))} · 👥 ${s.examCount || 0}${s.exam.title ? ' · ' + esc(s.exam.title) : ''}</div>` : ''}`;
        const row = mk('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;');
        // 注意：btn() 内部已经 e.stopPropagation()，所以点按钮不会连带触发卡片的「开始游玩」
        row.appendChild(btn('▶ ' + T('communityPlay', '游玩'), 'var(--accent-green)', () => playStory(s.id)));
        row.appendChild(btn('👁 ' + T('communityDetail', '详情'), 'var(--accent-blue)', () => showDetail(s.id)));
        row.appendChild(btn('⬇ ' + T('communityDownload', '下载'), 'var(--accent-green)', async () => {
            if (s.lockedTeam) { showDetail(s.id); return; }
            await downloadStory(s.id);
        }));
        if (mine) row.appendChild(btn('🗑', 'var(--accent-red)', async () => {
            if (!confirm(T('communityDeleteConfirm', '确定删除？'))) return;
            const r = await deleteStory(s.id);
            if (r.ok) { toast('🗑 ' + T('communityDeleteDone', '已删除')); showHome(); return; }
            toast('⚠ ' + (r.reason === 'login' ? T('communityNeedLogin', '请先登录')
                : r.reason === 'denied' ? T('communityDeleteDenied', '删不掉：这篇不是你的作品')
                    : r.reason === 'offline' ? T('communityNeedServer', '请先连接社区服务器（运行 node server/community.js）')
                        : T('communityDeleteFailed', '删除失败')));
            showHome();
        }, 'flex:0 0 auto;'));
        card.appendChild(row);
        // 点卡片 = 直接开始玩（不是进详情页）；锁定的团队故事才进详情
        card.addEventListener('click', () => playStory(s.id));
        return card;
    }

    function showSharePicker() {
        const h = beginScreen();
        if (!h) return;
        headerBar(h);
        const wrap = mk('div', '');
        wrap.innerHTML = `<div style="font-size:0.9rem;font-weight:700;margin-bottom:10px;">🌐 ${esc(T('communityPickLocal', '选择要分享的本地故事'))}</div>`;
        h.appendChild(wrap);
        let designs = [];
        try { designs = SAVE.getDesigns(); } catch (e) {}
        if (!designs.length) wrap.appendChild(mk('div', 'font-size:0.82rem;color:var(--text-muted);', esc(T('communityNoLocal', '还没有本地自创故事'))));
        designs.forEach(d => {
            const row = mk('div', 'display:flex;align-items:center;gap:10px;padding:10px;border:1px dashed var(--border-color);border-radius:10px;margin-bottom:8px;flex-wrap:wrap;');
            row.innerHTML = `<div style="font-size:1.3rem;">${iconHTML(d.storyIcon || '✨', 24)}</div>
                <div style="flex:1;min-width:0;font-weight:600;overflow-wrap:break-word;">${esc(d.title || T('unnamedStory', '未命名'))}</div>`;
            const opts = mk('select', 'background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:6px;font-size:0.75rem;');
            // 三态模式：open=所有人可玩可自由编辑 / teamedit=所有人可玩仅团队编辑 / private=仅团队
            opts.innerHTML = `<option value="open">🌍 ${esc(T('communityModeOpen', '所有人可玩 · 可自由编辑'))}</option>
                <option value="teamedit">🤝 ${esc(T('communityModeTeamEdit', '所有人可玩 · 仅团队可编辑'))}</option>
                <option value="private">🔒 ${esc(T('communityModePrivate', '仅团队 · 密码才能进'))}</option>`;
            opts.value = 'open';
            const pwd = mk('input', 'width:120px;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:6px 8px;font-size:0.75rem;');
            pwd.placeholder = T('communityPasswordPh', '团队密码(可选)');
            pwd.style.display = 'none'; // 只有 private 模式才需要密码
            opts.addEventListener('change', () => { pwd.style.display = opts.value === 'private' ? '' : 'none'; });
            const b = btn(T('communityShare', '分享'), 'var(--accent-yellow)', async () => {
                if (!ensureConnected()) return;
                const r = await shareDesign(d, { mode: opts.value, password: pwd.value });
                if (r) {
                    d.communityId = r.id;
                    SAVE.saveDesign(d);
                    toast('🌐 ' + T('communityShareOk', '已分享到社区'));
                    showHome();
                } else toast('⚠ ' + T('communityShareFail', '分享失败'));
            }, 'flex:0 0 auto;');
            row.appendChild(opts); row.appendChild(pwd); row.appendChild(b);
            wrap.appendChild(row);
        });
        h.appendChild(backBtn(showHome));
    }

    // ══════════════ 限时线上考试 ══════════════
    // 老师出题组编辑试卷与时间窗；学生只有在时间窗内能看题、答题；
    // 成绩＝到达的结局等级；管理员像看问卷结果一样看全班比例，并给及格学生发世界之种。
    function fmtTime(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const p = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
    function gradeLabel(g) {
        if (!g) return '';
        if (typeof g === 'string') return g;
        const l = g.label || g;
        if (typeof l === 'string') return l;
        const lang = (typeof I18N !== 'undefined' && I18N.getLanguage) ? I18N.getLanguage() : 'zh';
        return l[lang] || l.zh || l.en || '';
    }
    function examStatusText(st) {
        if (st === 'open') return '🟢 ' + T('examStatusOpen', '进行中');
        if (st === 'upcoming') return '⏳ ' + T('examStatusUpcoming', '未开始');
        if (st === 'ended') return '⏹ ' + T('examStatusEnded', '已结束');
        return '⚪ ' + T('examStatusOff', '未开启');
    }
    const EXAM_GRADE_ORDER = ['perfect', 'hidden', 'good', 'bad', 'none'];
    // 成绩统计面板的展开状态（按故事记）—— 详情页重绘后要恢复，
    // 否则任何一次 refreshDetail 都会把老师正在看的统计表关掉
    const _examStatsOpen = {};
    // 等级默认值（必须与 server/community.js 的 EXAM_GRADES 保持一致）
    const EXAM_GRADE_DEFAULTS = {
        perfect: { label: { zh: 'A · 完美结局', en: 'A · Perfect', ja: 'A · 完璧' }, pass: true, seeds: 5 },
        hidden:  { label: { zh: 'S · 隐藏结局', en: 'S · Hidden',  ja: 'S · 隠密' }, pass: true, seeds: 5 },
        good:    { label: { zh: 'B · 良好结局', en: 'B · Good',    ja: 'B · 良好' }, pass: true, seeds: 3 },
        bad:     { label: { zh: 'C · 不及格',   en: 'C · Failed',   ja: 'C · 不合格' }, pass: false, seeds: 0 },
        none:    { label: { zh: '未交卷',       en: 'Not submitted', ja: '未提出' }, pass: false, seeds: 0 }
    };

    // 考试卡片（详情页网格里的一块）
    async function examPanel(id, s, data) {
        const ex = await getExam(id);
        if (!ex.ok) return null;
        const canManage = !!ex.canManage;
        if (!ex.exam && !canManage) return null;   // 没考试且我不是老师 → 不显示

        const box = mk('details', 'background:var(--bg-card);border:1px solid var(--accent-purple);border-radius:var(--radius-md);padding:12px 14px;');
        const status = ex.status || 'off';
        const sum = mk('summary', 'cursor:pointer;font-size:0.9rem;font-weight:700;display:flex;align-items:center;gap:6px;flex-wrap:wrap;');
        sum.innerHTML = `🎓 ${esc(T('examTitle', '限时考试'))}
            <span style="font-size:0.7rem;font-weight:400;color:var(--text-muted);">${examStatusText(status)}</span>
            ${ex.exam ? `<span style="font-size:0.7rem;font-weight:400;color:var(--text-muted);">👥 ${ex.total || 0}</span>` : ''}`;
        box.appendChild(sum);
        const body = mk('div', 'margin-top:10px;');
        box.appendChild(body);

        if (!ex.exam) {
            body.innerHTML = `<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;">${esc(T('examNone', '这个故事还没有安排考试'))}</div>`;
            body.appendChild(btn('🎓 ' + T('examCreate', '开设限时考试'), 'var(--accent-purple)', async () => {
                if (!ensureConnected()) return;
                const now = Date.now();
                const ok = await openExamEditor(id, {
                    enabled: true, title: '', desc: '',
                    openAt: now, closeAt: now + 24 * 3600 * 1000, durationMin: 30
                });
                if (ok) { box.open = true; await refreshDetail(true); }
            }));
            return box;
        }

        const e = ex.exam;
        const info = mk('div', 'font-size:0.8rem;color:var(--text-secondary);line-height:1.9;');
        info.innerHTML = `
            <div style="font-size:0.95rem;font-weight:700;color:var(--accent-purple);">${esc(e.title || T('examUntitled', '未命名考试'))}</div>
            ${e.desc ? `<div style="margin:4px 0 6px;overflow-wrap:break-word;">${esc(e.desc)}</div>` : ''}
            <div>🕒 ${esc(T('examWindow', '开放时间'))}: ${fmtTime(e.openAt)} → ${fmtTime(e.closeAt)}</div>
            <div>⏱ ${esc(T('examDuration', '单次限时'))}: ${e.durationMin ? e.durationMin + ' ' + esc(T('examMinutes', '分钟')) : '—'}</div>
            <div>🎯 ${esc(T('examGrades', '等级与奖励'))}: ${EXAM_GRADE_ORDER.filter(k => k !== 'none').map(k => {
                const g = (e.grades || {})[k] || {};
                return esc(gradeLabel({ label: g.label })) + (g.pass ? ` ✓+${g.seeds || 0}💠` : '');
            }).join(' · ')}</div>`;
        body.appendChild(info);

        const row = mk('div', 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center;');
        if (ex.canTake) {
            row.appendChild(btn('▶ ' + T('examStart', '开始考试'), 'var(--accent-green)', async () => {
                if (!ensureConnected()) return;
                const ok = await startExam(id);
                if (ok) toast('🎓 ' + T('examStarted', '考试开始，加油'));
            }));
        } else {
            row.appendChild(mk('div', 'font-size:0.78rem;color:var(--accent-red);', '⏰ ' + esc(status === 'upcoming' ? T('examNotStart', '考试还没开始') : T('examOver', '考试已结束'))));
        }
        if (canManage) {
            row.appendChild(btn('✏️ ' + T('examEdit', '编辑试卷'), 'var(--accent-blue)', async () => {
                const ok = await openExamEditor(id, e);
                if (ok) await refreshDetail(true);
            }));
            row.appendChild(btn('📊 ' + T('examResults', '成绩统计'), 'var(--accent-cyan)', () => {
                // 就地开合（不整页重绘，点了立刻出结果）；同时记住状态，详情页重绘后能恢复
                const exist = box.querySelector('.exam-result-holder');
                if (exist) { exist.remove(); delete _examStatsOpen[id]; return; }
                _examStatsOpen[id] = true;
                const h = mk('div', 'margin-top:10px;');
                h.className = 'exam-result-holder';   // ⚠️ mk() 的第二个参数是内联样式，class 要单独设
                box.appendChild(h);
                renderExamResults(id, h);
            }));
            row.appendChild(btn('🗑 ' + T('examRemove', '取消考试'), 'var(--accent-red)', async () => {
                if (!confirm(T('examRemoveConfirm', '确定取消这场考试？已交卷的成绩会保留。'))) return;
                if (!ensureConnected()) return;
                await removeExam(id);
                await refreshDetail(true);
            }));
        }
        body.appendChild(row);

        // 我的成绩
        if (ex.my) {
            const mine = mk('div', 'margin-top:10px;padding:8px 10px;border:1px dashed var(--border-color);border-radius:10px;font-size:0.8rem;');
            mine.innerHTML = `${esc(T('examMyResult', '我的成绩'))}: <b style="color:var(--accent-green)">${esc(gradeLabel(ex.my))}</b>
                ${ex.my.awarded ? ` · 💠+${ex.my.awarded}` : ''}
                ${ex.my.timedOut ? ' · ⏰' : ''}`;
            body.appendChild(mine);
        }
        // 恢复「成绩统计」展开状态（教师视角）
        if (canManage && _examStatsOpen[id]) {
            const h = mk('div', 'margin-top:10px;');
            h.className = 'exam-result-holder';
            box.appendChild(h);
            renderExamResults(id, h);
        }
        return box;
    }

    // 成绩统计（像问卷结果一样：各等级人数 + 比例条 + 名单）
    async function renderExamResults(id, holder) {
        holder.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);">${esc(T('examLoading', '统计中…'))}</div>`;
        const ex = await getExam(id);
        if (!ex.ok) { holder.innerHTML = '<div style="font-size:0.8rem;color:var(--accent-red);">⚠</div>'; return; }
        const total = ex.total || 0;
        const grades = (ex.exam && ex.exam.grades) || {};
        let html = `<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px;">
            👥 ${esc(T('examTotalPeople', '参与人数'))}: <b>${total}</b></div>`;
        if (!total) {
            html += `<div style="font-size:0.78rem;color:var(--text-muted);">${esc(T('examNoResult', '还没有人交卷'))}</div>`;
        } else {
            EXAM_GRADE_ORDER.forEach(k => {
                const g = (ex.byGrade || {})[k] || { count: 0, ratio: 0 };
                const conf = grades[k] || {};
                const color = k === 'perfect' ? 'var(--accent-green)' : k === 'hidden' ? 'var(--accent-purple)'
                    : k === 'good' ? 'var(--accent-cyan)' : k === 'bad' ? 'var(--accent-red)' : 'var(--text-muted)';
                html += `<div style="margin-bottom:7px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-secondary);">
                        <span>${esc(gradeLabel({ label: conf.label }))}${conf.pass ? ' ✓' : ''}</span>
                        <span><b>${g.count}</b> · ${g.ratio}%</span>
                    </div>
                    <div style="height:8px;border-radius:999px;background:var(--bg-page);overflow:hidden;margin-top:3px;">
                        <div style="height:100%;width:${Math.max(0, Math.min(100, g.ratio))}%;background:${color};"></div>
                    </div>
                </div>`;
            });
            html += `<div style="margin-top:10px;font-size:0.78rem;color:var(--text-secondary);font-weight:700;">${esc(T('examList', '名单'))}</div>`;
            (ex.participants || []).forEach(p => {
                html += `<div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-top:1px solid var(--border-color);font-size:0.78rem;flex-wrap:wrap;">
                    ${iconHTML(p.avatar || '👤', 18, 9999)}
                    <b style="flex:1;min-width:60px;overflow-wrap:break-word;">${esc(p.nick || '')}</b>
                    <span style="color:var(--text-secondary);">${esc(gradeLabel(p))}</span>
                    <span style="color:var(--text-muted);">${p.elapsedMs ? Math.max(1, Math.round(p.elapsedMs / 60000)) + '′' : ''}</span>
                    ${p.awarded ? `<span style="color:var(--accent-yellow);">💠+${p.awarded}</span>` : ''}
                </div>`;
            });
        }
        holder.innerHTML = html;
        const bar = mk('div', 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;');
        bar.appendChild(btn('💠 ' + T('examAward', '给及格学生发世界之种'), 'var(--accent-yellow)', async () => {
            if (!ensureConnected()) return;
            const r = await awardExam(id);
            const n = (r.given || []).length;
            toast(n ? `💠 ${n} ${T('examAwarded', '位学生已发放')}` : 'ℹ ' + T('examAwardNone', '没有需要发放的'));
            await renderExamResults(id, holder);
        }));
        bar.appendChild(btn('🔄 ' + T('examRefresh', '刷新'), 'var(--accent-blue)', () => renderExamResults(id, holder)));
        holder.appendChild(bar);
    }

    // 出题 / 改试卷（仅教师出题组）
    function openExamEditor(id, exam) {
        return new Promise((resolve) => {
            const now = Date.now();
            const e = Object.assign({ enabled: true, title: '', desc: '', openAt: now, closeAt: now + 86400000, durationMin: 30, grades: {} }, exam || {});
            const toLocal = ts => {
                if (!ts) return '';
                const d = new Date(ts - new Date().getTimezoneOffset() * 60000);
                return d.toISOString().slice(0, 16);
            };
            const fromLocal = s => { const t = new Date(s).getTime(); return isNaN(t) ? 0 : t; };
            const g = k => e.grades[k] || {};
            const mask = document.createElement('div');
            mask.id = 'exam-editor';
            mask.style.cssText = 'position:fixed;inset:0;z-index:10080;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:14px;';
            mask.innerHTML = `
                <div style="width:min(760px,100%);max-height:88vh;overflow-y:auto;background:var(--bg-card);border:1px solid var(--accent-purple);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.65);padding:16px;">
                    <div style="font-size:1rem;font-weight:700;margin-bottom:12px;">🎓 ${esc(T('examEditTitle', '编辑限时考试'))}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${esc(T('examName', '考试名称'))}</div>
                    <input id="ex-title" value="${esc(e.title || '')}" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.85rem;">
                    <div style="font-size:0.75rem;color:var(--text-secondary);margin:10px 0 4px;">${esc(T('examDesc', '考试说明'))}</div>
                    <textarea id="ex-desc" rows="2" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.85rem;font-family:inherit;">${esc(e.desc || '')}</textarea>
                    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:190px;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${esc(T('examOpenAt', '开始时间'))}</div>
                            <input id="ex-open" type="datetime-local" value="${toLocal(e.openAt)}" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px;font-size:0.8rem;">
                        </div>
                        <div style="flex:1;min-width:190px;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${esc(T('examCloseAt', '结束时间'))}</div>
                            <input id="ex-close" type="datetime-local" value="${toLocal(e.closeAt)}" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px;font-size:0.8rem;">
                        </div>
                        <div style="flex:1;min-width:120px;">
                            <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${esc(T('examDuration', '单次限时(分)'))}</div>
                            <input id="ex-dur" type="number" min="0" max="600" value="${e.durationMin || 0}" style="width:100%;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px;font-size:0.8rem;">
                        </div>
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);margin:12px 0 6px;">${esc(T('examGradeRule', '等级规则：勾选＝及格，数字＝奖励世界之种'))}</div>
                    <div id="ex-grades"></div>
                    <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;align-items:center;">
                        <label style="font-size:0.8rem;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
                            <input id="ex-enabled" type="checkbox" ${e.enabled !== false ? 'checked' : ''} style="accent-color:var(--accent-purple);"> ${esc(T('examEnabled', '启用考试'))}
                        </label>
                        <button id="ex-cancel" style="margin-left:auto;background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);border-radius:8px;padding:8px 18px;font-size:0.82rem;cursor:pointer;">${esc(T('cancel', '取消'))}</button>
                        <button id="ex-ok" style="background:var(--accent-purple);color:#fff;border:none;border-radius:8px;padding:8px 22px;font-size:0.85rem;cursor:pointer;">${esc(T('communitySave', '保存'))}</button>
                    </div>
                </div>`;
            document.body.appendChild(mask);
            const close = (v) => { if (mask.parentNode) mask.remove(); resolve(v); };
            // ⚠️ 出题弹窗里任何一处抛错都会让 promise 永远不 resolve → 弹窗卡住关不掉。
            //    这里兜底：出错就撤掉弹窗并当作取消。
            try {
            const gbox = mask.querySelector('#ex-grades');
            gbox.innerHTML = EXAM_GRADE_ORDER.filter(k => k !== 'none').map(k => {
                const cfg = g(k) || {};
                const def = EXAM_GRADE_DEFAULTS[k] || {};
                const lab = cfg.label || def.label || { zh: k };
                const isPass = cfg.pass === undefined ? (def.pass !== false) : !!cfg.pass;
                const seeds = cfg.seeds === undefined ? (def.seeds || 0) : cfg.seeds;
                return `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;flex-wrap:wrap;">
                    <span style="flex:1;min-width:120px;font-size:0.8rem;">${esc(gradeLabel({ label: lab }))}</span>
                    <label style="font-size:0.76rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
                        <input type="checkbox" data-gk="${k}" data-gf="pass" ${isPass ? 'checked' : ''} style="accent-color:var(--accent-green);"> ${esc(T('examPass', '及格'))}
                    </label>
                    <label style="font-size:0.76rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
                        💠 <input type="number" min="0" max="999" data-gk="${k}" data-gf="seeds" value="${seeds}" style="width:64px;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:6px;padding:4px 6px;font-size:0.78rem;">
                    </label>
                </div>`;
            }).join('');
            // 等级名称沿用服务器默认（客户端只改及格与奖励，名称保持一致）
            gbox.insertAdjacentHTML('beforeend',
                `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">${esc(T('examGradeNameHint', '等级名称由系统按结局类型自动对应'))}</div>`);
            mask.querySelector('#ex-cancel').addEventListener('click', () => close(false));
            mask.addEventListener('mousedown', (e2) => { if (e2.target === mask) close(false); });
            mask.querySelector('#ex-ok').addEventListener('click', async () => {
                const grades = {};
                gbox.querySelectorAll('[data-gk]').forEach(el => {
                    const k = el.dataset.gk, f = el.dataset.gf;
                    grades[k] = grades[k] || {};
                    grades[k][f] = (f === 'pass') ? el.checked : (parseInt(el.value, 10) || 0);
                });
                const payload = {
                    enabled: mask.querySelector('#ex-enabled').checked,
                    title: mask.querySelector('#ex-title').value.trim(),
                    desc: mask.querySelector('#ex-desc').value.trim(),
                    openAt: fromLocal(mask.querySelector('#ex-open').value),
                    closeAt: fromLocal(mask.querySelector('#ex-close').value),
                    durationMin: parseInt(mask.querySelector('#ex-dur').value, 10) || 0,
                    grades: grades
                };
                if (payload.closeAt && payload.openAt && payload.closeAt <= payload.openAt) {
                    toast('⚠ ' + T('examTimeBad', '结束时间必须晚于开始时间'));
                    return;
                }
                if (!ensureConnected()) { close(false); return; }
                const r = await saveExam(id, payload);
                close(!!r.ok);
            });
            } catch (err) {
                console.error('[COMMUNITY] 出题弹窗渲染失败：', err);
                toast('⚠ ' + ((err && err.message) || err));
                close(false);
            }
        });
    }

    // ══════════════ 故事详情 ══════════════
    async function showDetail(id) {
        const h = beginScreen();
        if (!h) return;
        _view = { story: id };
        headerBar(h);
        h.appendChild(mk('div', 'font-size:0.85rem;color:var(--text-muted);', '…'));
        await refreshDetail(false);
    }

    async function refreshDetail(silent) {
        const h = host();
        if (!_view || !h) return;
        const id = _view.story;
        const data = await fetchStory(id);
        h.innerHTML = '';
        headerBar(h);

        if (!data.ok) {
            // 🔒 团队故事且非成员
            const meta = data.story || _metaCache[id] || {};
            const card = mk('div', 'background:var(--bg-card);border:1px solid var(--accent-purple);border-radius:var(--radius-md);padding:16px;');
            card.innerHTML = `
                <div style="font-size:1.6rem;">${iconHTML(meta.icon || '✨', 32)}</div>
                <div style="font-size:1.1rem;font-weight:700;margin-top:4px;">${esc(meta.title || '')} 🔒</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin:6px 0;">${esc(meta.description || '')}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${esc(T('communityAuthor', '作者'))}: ${esc(meta.author || '—')} · 💠 ${meta.tipTotal || 0}</div>
                <div style="font-size:0.85rem;color:var(--accent-purple);margin-top:10px;">🔒 ${esc(T('communityLocked', '该故事仅团队成员可见'))}</div>`;
            const row = mk('div', 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center;');
            const pwd = mk('input', 'flex:1;min-width:120px;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.82rem;');
            pwd.type = 'password';
            pwd.placeholder = T('communityAccountPassword', '团队密码');
            const ub = btn(T('communityUnlock', '解锁'), 'var(--accent-purple)', async () => {
                const r = await unlock(id, pwd.value);
                if (r.ok) { toast('🔓'); await refreshDetail(true); }
                else toast('⚠ ' + T('communityUnlockFail', '密码错误'));
            }, 'flex:0 0 auto;');
            const msg = mk('input', 'flex:1;min-width:140px;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.82rem;');
            msg.placeholder = T('communityApplyMsgPh', '申请留言（可不填）');
            const ab = btn(T('communityApply', '申请加入'), 'var(--accent-blue)', async () => {
                const ok = await requestJoin(id, msg.value);
                toast(ok ? '📨 ' + T('communityApplied', '申请已发送') : '⚠');
            }, 'flex:0 0 auto;');
            row.appendChild(pwd); row.appendChild(ub); row.appendChild(msg); row.appendChild(ab);
            card.appendChild(row);
            h.appendChild(card);
            h.appendChild(backBtn(showHome));
            return;
        }

        _detail = data;
        const s = data.story || {};
        // 归属 / 成员身份一律由服务器按 uid 判定 → 改昵称也仍然认得出
        const isOwner = !!(s.mine || data.myRole === 'admin');
        const canEdit = !!data.canEdit;
        const theme = s.themeColor || 'var(--accent-yellow)';
        if (data.wallet) applyWallet(data.wallet);
        const canChat = isOwner || !!data.isMember || canEdit;
        // 三态模式徽标
        const modeBadge = s.mode === 'private' ? '🔒 ' + esc(T('communityModePrivate', '仅团队 · 密码才能进'))
            : s.mode === 'teamedit' ? '🤝 ' + esc(T('communityModeTeamEdit', '所有人可玩 · 仅团队可编辑'))
            : '🌍 ' + esc(T('communityModeOpen', '所有人可玩 · 可自由编辑'));

        const info = mk('div', 'background:var(--bg-card);border:1px solid ' + theme + ';border-radius:var(--radius-md);padding:14px 16px;margin-bottom:12px;');
        info.innerHTML = `
            <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;">
                <div style="font-size:2rem;">${iconHTML(s.icon || '✨', 40)}</div>
                <div style="flex:1;min-width:180px;">
                    <div style="font-size:1.15rem;font-weight:700;color:${theme};overflow-wrap:break-word;">${esc(storyTitle(s))} ${s.lockedTeam ? '🔒' : ''}</div>
                    ${storyDesc(s) ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin:4px 0;">${esc(storyDesc(s))}</div>` : ''}
                    <div style="font-size:0.75rem;color:var(--text-muted);line-height:1.8;">
                        ${iconHTML(s.avatar || '👤', 14, 9999)} ${esc(s.author || '—')} ${isOwner ? '👑 ' + esc(T('communityAdmin', '管理员')) : ''} · v${s.version || 1}
                        · 💬 ${(data.comments || []).length} · 👥 ${(s.members || []).length}
                        · ${modeBadge}
                    </div>
                </div>
                <div style="flex:0 0 auto;text-align:right;font-size:0.72rem;color:var(--text-muted);line-height:1.9;">
                    <div style="color:var(--accent-yellow);font-size:1rem;font-weight:700;">💠 ${s.tipTotal || 0}</div>
                    <div>${esc(T('communityTipTotal', '世界之种'))}</div>
                    <div>${esc(T('communityOwnerGot', '作者已收到'))} 💠 ${s.ownerReceived || 0}</div>
                </div>
            </div>`;
        h.appendChild(info);

        // ② 区块卡片网格：复用「选择故事」页的 .story-card-grid，
        //    宽屏自动多列 → 不再把所有区块纵向堆成一条超长列表
        const grid = mk('div', '');
        grid.className = 'story-card-grid';
        h.appendChild(grid);

        // 操作 + 打赏卡
        const act = mk('div', 'background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:14px;');
        act.innerHTML = `<div style="font-size:0.85rem;font-weight:700;margin-bottom:10px;">⚙ ${esc(T('communityActions', '操作'))}</div>`;
        const ops = mk('div', 'display:flex;gap:8px;flex-wrap:wrap;');
        ops.appendChild(btn('⬇ ' + T('communityDownloadJson', '下载 JSON'), 'var(--accent-purple)', () => downloadJson(id)));
        ops.appendChild(btn('💾 ' + T('communitySaveLocal', '存到本地'), 'var(--accent-green)', () => downloadStory(id)));
        ops.appendChild(btn('✏️ ' + T('communityCollab', '协作编辑'), 'var(--accent-blue)', () => openSharedInDesigner(id)));
        if (canChat) {
            // 浮窗已经开着同一个故事时，按钮变成「收起聊天」；否则这里只保留浮窗入口，
            // 详情页下方那个内嵌团队聊天会自动隐藏 —— 避免同一屏出现两个「团队聊天」
            const overlayOn = !!(isChatOverlayOpen() && _chatOverlay && _chatOverlay.id === id);
            ops.appendChild(btn(overlayOn ? '💬 ' + T('examHideChat', '收起聊天') : '💬 ' + T('communityTeamChat', '团队聊天'),
                'var(--accent-cyan)', async () => {
                    if (overlayOn) { closeChatOverlay(); await refreshDetail(true); return; }
                    await openChatOverlay(id);
                    if (_view && _view.story === id) await refreshDetail(true);
                }));
        }
        // teamedit / private 模式下非成员：给个「申请加入」入口（private 在锁定页也有）
        if (!isOwner && !data.isMember && !canEdit && s.mode !== 'private') {
            ops.appendChild(btn('📨 ' + T('communityApply', '申请加入'), 'var(--accent-purple)', async () => {
                const ok2 = await requestJoin(id, '');
                toast(ok2 ? '📨 ' + T('communityApplied', '申请已发送') : '⚠ ' + T('communityApplyFail', '申请失败'));
            }));
        }
        act.appendChild(ops);

        const tipBox = mk('div', 'margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);');
        const mySeeds = (_wallet && typeof _wallet.seeds === 'number') ? _wallet.seeds
            : ((typeof SAVE !== 'undefined' && SAVE.getSeeds) ? SAVE.getSeeds() : 0);
        tipBox.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:0.78rem;color:var(--text-secondary);">
                <span>💠 ${esc(T('communityTip', '打赏世界之种'))}</span>
                <span style="margin-left:auto;color:var(--text-muted);">${esc(T('communityMySeeds', '我的世界之种'))}:
                    <b style="color:var(--accent-yellow);">${mySeeds}</b></span>
            </div>`;
        const tipRow = mk('div', 'display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap;');
        [1, 5, 10].forEach(n => {
            tipRow.appendChild(btn('+' + n, 'var(--accent-yellow)', async () => { await tipStory(id, n); await refreshDetail(true); }, 'flex:0 0 auto;min-width:52px;'));
        });
        tipBox.appendChild(tipRow);
        if (isOwner) tipBox.appendChild(mk('div', 'font-size:0.7rem;color:var(--text-muted);margin-top:6px;',
            '👑 ' + esc(T('communityOwnerTipHint', '打赏会转入作者账户；自己的故事不能打赏自己'))));
        act.appendChild(tipBox);
        if (!canEdit) act.appendChild(mk('div', 'font-size:0.75rem;color:var(--text-muted);margin-top:8px;',
            '🔒 ' + esc(T('communityEditDenied', '你没有编辑权限（管理员可授权）'))));
        grid.appendChild(act);

        if (isOwner) grid.appendChild(adminPanel(id, s, data));
        // 🎓 限时考试卡片（没考试时只有教师组看得到「开设」入口）
        try {
            const ep = await examPanel(id, s, data);
            if (ep) grid.appendChild(ep);
        } catch (e) { /* 未连接 / 无权限：静默跳过 */ }
        // 团队聊天浮窗开着时不再重复渲染一个内嵌版（同一屏两个「团队聊天」很迷惑）
        const chatOverlayOn = !!(isChatOverlayOpen() && _chatOverlay && _chatOverlay.id === id);
        if (canChat && !chatOverlayOn) grid.appendChild(chatPanel(id, data, true));
        grid.appendChild(chatPanel(id, data, false));
        h.appendChild(backBtn(showHome));
        if (!silent && h.scrollTo) h.scrollTo(0, 0);
    }

    function backBtn(then) {
        const b = mk('button', 'margin-top:12px;width:100%;padding:11px;', '');
        b.className = 'ending-btn';
        b.textContent = '← ' + T('communityBack', '返回');
        b.addEventListener('click', () => { if (then) then(); else showHome(); });
        return b;
    }

    // 管理员面板：可见性 / 密码 / 成员 / 申请
    function adminPanel(id, s, data) {
        // 默认折叠：详情页改成网格后，管理面板内容多，展开会撑高整张卡片
        const box = mk('details', 'background:var(--bg-card);border:1px solid var(--accent-yellow);border-radius:var(--radius-md);padding:12px 14px;');
        const sum = mk('summary', 'cursor:pointer;font-size:0.9rem;font-weight:700;display:flex;align-items:center;gap:6px;');
        sum.innerHTML = `👑 ${esc(T('communityAdminPanel', '管理面板'))}
            <span style="font-size:0.7rem;font-weight:400;color:var(--text-muted);">📨 ${(data.requests || []).length} · 👥 ${(s.members || []).length}</span>`;
        box.appendChild(sum);
        const body = mk('div', 'margin-top:10px;');

        const visRow = mk('div', 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;');
        const sel = mk('select', 'background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:7px;font-size:0.8rem;');
        // 三态模式：open=所有人可玩可自由编辑 / teamedit=所有人可玩仅团队编辑 / private=仅团队
        sel.innerHTML = `<option value="open">🌍 ${esc(T('communityModeOpen', '所有人可玩 · 可自由编辑'))}</option>
            <option value="teamedit">🤝 ${esc(T('communityModeTeamEdit', '所有人可玩 · 仅团队可编辑'))}</option>
            <option value="private">🔒 ${esc(T('communityModePrivate', '仅团队 · 密码才能进'))}</option>`;
        sel.value = s.mode || (s.visibility === 'team' ? 'private' : ((s.allowEdit || []).length ? 'teamedit' : 'open'));
        const pwd = mk('input', 'flex:1;min-width:120px;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:0.8rem;');
        pwd.placeholder = T('communityPasswordPh', '团队密码(可留空)');
        pwd.style.display = sel.value === 'private' ? '' : 'none';
        sel.addEventListener('change', () => { pwd.style.display = sel.value === 'private' ? '' : 'none'; });
        const saveB = btn(T('communitySave', '保存设置'), 'var(--accent-yellow)', async () => {
            const r = await saveSettings(id, { mode: sel.value, password: pwd.value });
            toast(r.ok ? '✓ ' + T('communitySettingsSaved', '设置已保存') : '⚠');
            await refreshDetail(true);
        }, 'flex:0 0 auto;');
        visRow.appendChild(sel); visRow.appendChild(pwd); visRow.appendChild(saveB);
        body.appendChild(visRow);

        const reqs = data.requests || [];
        const reqBox = mk('div', 'margin-bottom:10px;');
        reqBox.innerHTML = `<div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:6px;">📨 ${esc(T('communityRequests', '加入申请'))} (${reqs.length})</div>`;
        if (!reqs.length) reqBox.appendChild(mk('div', 'font-size:0.75rem;color:var(--text-muted);', '—'));
        reqs.forEach(r => {
            const row = mk('div', 'display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border-color);flex-wrap:wrap;');
            row.innerHTML = `<div style="flex:1;min-width:0;font-size:0.8rem;">${iconHTML(r.avatar || '👤', 20, 9999)} <b>${esc(r.nick)}</b> <span style="color:var(--text-muted);">${esc(r.message || '')}</span></div>`;
            row.appendChild(btn(T('communityApprove', '同意'), 'var(--accent-green)', async () => { await memberAction(id, { uid: r.uid, nick: r.nick }, 'approve'); await refreshDetail(true); }, 'flex:0 0 auto;min-width:56px;'));
            row.appendChild(btn(T('communityReject', '拒绝'), 'var(--accent-red)', async () => { await memberAction(id, { uid: r.uid, nick: r.nick }, 'reject'); await refreshDetail(true); }, 'flex:0 0 auto;min-width:56px;'));
            reqBox.appendChild(row);
        });
        body.appendChild(reqBox);

        const memBox = mk('div', '');
        memBox.innerHTML = `<div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:6px;">👥 ${esc(T('communityMembers', '团队成员'))}</div>`;
        // memberDetails 带 uid（身份）+ nick（显示名）；成员管理按 uid 操作，改昵称也认得同一个人
        const members = (s.memberDetails && s.memberDetails.length) ? s.memberDetails
            : (s.members || []).map(n => ({ uid: n, nick: n }));
        if (!members.length) memBox.appendChild(mk('div', 'font-size:0.75rem;color:var(--text-muted);', '—'));
        members.forEach(m => {
            const row = mk('div', 'display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border-color);flex-wrap:wrap;');
            row.innerHTML = `<div style="flex:1;min-width:0;font-size:0.8rem;">${iconHTML(m.avatar || '👤', 20, 9999)} <b>${esc(m.nick)}</b></div>`;
            const roleSel = mk('select', 'background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:6px;padding:4px;font-size:0.72rem;');
            // teacher = 教师出题组：可编辑蓝图 + 能开设/编辑限时考试
            roleSel.innerHTML = `<option value="editor">✏️ ${esc(T('communityRoleEditor', '可编辑'))}</option>
                <option value="teacher">🎓 ${esc(T('examRoleTeacher', '教师 · 出题组'))}</option>
                <option value="viewer">👁 ${esc(T('communityRoleViewer', '只读'))}</option>`;
            roleSel.value = (m.role === 'teacher') ? 'teacher'
                : (((s.allowEdit || []).indexOf(m.uid) >= 0) ? 'editor' : 'viewer');
            roleSel.addEventListener('change', async () => { await memberAction(id, m, 'setrole', roleSel.value); await refreshDetail(true); });
            row.appendChild(roleSel);
            row.appendChild(btn(T('communityRemove', '移除'), 'var(--accent-red)', async () => { await memberAction(id, m, 'remove'); await refreshDetail(true); }, 'flex:0 0 auto;min-width:52px;'));
            memBox.appendChild(row);
        });
        body.appendChild(memBox);
        box.appendChild(body);
        return box;
    }

    // 消息面板（team=true 团队聊天 / false 评论区）
    function chatPanel(id, data, isTeam) {
        const list = isTeam ? (data.chat || []) : (data.comments || []);
        const box = mk('div', 'background:var(--bg-card);border:1px solid ' + (isTeam ? 'var(--accent-green)' : 'var(--border-color)') + ';border-radius:var(--radius-md);padding:12px;margin-bottom:12px;');
        box.innerHTML = `<div style="font-size:0.85rem;font-weight:700;margin-bottom:8px;">${isTeam ? '💬 ' + esc(T('communityTeamChat', '团队聊天')) : '💬 ' + esc(T('communityComments', '评论'))} (${list.length})</div>`;
        const scroll = mk('div', 'max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px;');
        if (!list.length) scroll.appendChild(mk('div', 'font-size:0.75rem;color:var(--text-muted);', '—'));
        list.forEach(m => scroll.appendChild(bubble(m)));
        box.appendChild(scroll);

        const row = mk('div', 'display:flex;gap:8px;margin-top:10px;');
        const inp = mk('input', 'flex:1;min-width:0;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:8px 10px;font-size:0.82rem;');
        inp.placeholder = isTeam ? T('communityChatPh', '和团队说点什么…') : T('communityCommentPh', '说点什么…');
        const send = btn(T('communitySend', '发送'), isTeam ? 'var(--accent-green)' : 'var(--accent-blue)', async () => {
            const text = (inp.value || '').trim();
            if (!text) return;
            if (!ensureConnected()) return;
            inp.value = '';
            if (isTeam) await postChat(id, text); else await postComment(id, text);
            await refreshDetail(true);
        }, 'flex:0 0 auto;min-width:64px;');
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send.click(); });
        row.appendChild(inp); row.appendChild(send);
        box.appendChild(row);
        return box;
    }

    // 微信风格气泡：自己靠右
    function bubble(m) {
        const mine = (m.uid && m.uid === getUid()) || m.nick === getName();
        const wrap = mk('div', 'display:flex;gap:8px;align-items:flex-start;' + (mine ? 'flex-direction:row-reverse;' : ''));
        const av = mk('div', 'width:32px;height:32px;border-radius:50%;background:var(--bg-page);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;');
        av.innerHTML = iconHTML(m.avatar || '👤', 26, 9999);
        const body = mk('div', 'max-width:74%;');
        const name = mk('div', 'font-size:0.68rem;color:var(--text-muted);margin-bottom:3px;' + (mine ? 'text-align:right;' : ''), esc(m.nick || ''));
        const b = mk('div', 'padding:8px 12px;border-radius:12px;font-size:0.85rem;line-height:1.5;overflow-wrap:break-word;word-break:break-word;background:' + (mine ? 'rgba(59,130,246,0.22)' : 'var(--bg-page)') + ';border:1px solid ' + (mine ? 'var(--accent-blue)' : 'var(--border-color)') + ';' + (mine ? 'border-top-right-radius:3px;' : 'border-top-left-radius:3px;') + 'color:var(--text-primary);', esc(m.text || ''));
        body.appendChild(name); body.appendChild(b);
        wrap.appendChild(av); wrap.appendChild(body);
        return wrap;
    }

    // ══════════════ 协作聊天浮窗 ══════════════
    // 在设计器里协作编辑时使用：独立小窗，不占用画布，随时和团队说话。
    let _chatTimer = null;
    async function openChatOverlay(storyId) {
        if (!_connected) { toast('⚠ ' + T('communityNeedServer', '请先连接社区服务器')); return null; }
        const id = storyId || (_chatOverlay && _chatOverlay.id);
        if (!id) return null;
        // 已开着同一个故事 → 只是重新显示并刷新
        if (_chatOverlay && _chatOverlay.id === id) {
            _chatOverlay.el.style.display = '';
            await refreshChatOverlay();
            return _chatOverlay.el;
        }
        closeChatOverlay();

        const el = mk('div', 'position:fixed;right:14px;bottom:14px;width:300px;max-width:calc(100vw - 20px);height:400px;max-height:66vh;background:var(--bg-card);border:1px solid var(--accent-cyan);border-radius:var(--radius-md);box-shadow:0 12px 40px rgba(0,0,0,0.55);display:flex;flex-direction:column;z-index:10050;overflow:hidden;');
        el.id = 'comm-chat-overlay';
        el.innerHTML = `
            <div id="comm-chat-head" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--border-color);cursor:move;background:var(--bg-secondary);">
                <span style="font-size:0.85rem;font-weight:700;">💬 ${esc(T('communityTeamChat', '团队聊天'))}</span>
                <span id="comm-chat-online" style="font-size:0.68rem;color:var(--text-muted);"></span>
                <button id="comm-chat-close" style="margin-left:auto;background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer;line-height:1;">✕</button>
            </div>
            <div id="comm-chat-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:10px;"></div>
            <div style="display:flex;gap:6px;padding:8px;border-top:1px solid var(--border-color);">
                <input id="comm-chat-input" style="flex:1;min-width:0;background:var(--bg-page);border:1px solid var(--border-color);color:var(--text-primary);border-radius:8px;padding:7px 10px;font-size:0.8rem;">
                <button id="comm-chat-send" style="background:rgba(34,197,94,0.15);border:1px solid var(--accent-green);color:var(--accent-green);border-radius:8px;padding:7px 12px;font-size:0.78rem;cursor:pointer;">${esc(T('communitySend', '发送'))}</button>
            </div>`;
        document.body.appendChild(el);
        _chatOverlay = { id: id, el: el };

        const inp = el.querySelector('#comm-chat-input');
        inp.placeholder = T('communityChatPh', '和团队说点什么…');
        el.querySelector('#comm-chat-close').addEventListener('click', closeChatOverlay);
        const send = async () => {
            const text = (inp.value || '').trim();
            if (!text) return;
            if (!ensureConnected()) return;
            inp.value = '';
            await postChat(id, text);
            await refreshChatOverlay();
        };
        el.querySelector('#comm-chat-send').addEventListener('click', send);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
        makeChatDraggable(el, el.querySelector('#comm-chat-head'));

        await refreshChatOverlay();
        // 轮询兜底：SSE 不通（App WebView / 网络抖动）时也能看到新消息
        if (_chatTimer) clearInterval(_chatTimer);
        _chatTimer = setInterval(() => {
            if (_chatOverlay) refreshChatOverlay();
            else { clearInterval(_chatTimer); _chatTimer = null; }
        }, 8000);
        return el;
    }

    async function refreshChatOverlay() {
        if (!_chatOverlay) return;
        const id = _chatOverlay.id;
        const data = await fetchStory(id);
        if (!_chatOverlay || _chatOverlay.id !== id) return;
        const list = _chatOverlay.el.querySelector('#comm-chat-list');
        const online = _chatOverlay.el.querySelector('#comm-chat-online');
        if (!list) return;
        if (!data.ok) {
            list.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">🔒 ${esc(T('communityLocked', '该故事仅团队成员可见'))}</div>`;
            return;
        }
        const chat = data.chat || [];
        if (online) {
            const eds = (data.story && data.story.editors) || [];
            online.textContent = eds.length ? '🟢 ' + eds.length + ' ' + T('communityOnline', '在线') : '';
        }
        const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
        list.innerHTML = '';
        if (!chat.length) list.appendChild(mk('div', 'font-size:0.75rem;color:var(--text-muted);', '—'));
        chat.forEach(m => list.appendChild(bubble(m)));
        if (atBottom) list.scrollTop = list.scrollHeight;
    }

    function closeChatOverlay() {
        if (_chatTimer) { clearInterval(_chatTimer); _chatTimer = null; }
        const wasId = _chatOverlay && _chatOverlay.id;
        if (_chatOverlay) { try { _chatOverlay.el.remove(); } catch (e) {} _chatOverlay = null; }
        // 浮窗收起后把详情页内嵌的团队聊天还回来（否则那一块会一直空着）
        if (wasId && _view && _view.story === wasId) { try { refreshDetail(true); } catch (e) {} }
    }
    function isChatOverlayOpen() { return !!_chatOverlay; }

    // 浮窗拖动（鼠标 + 触摸）
    function makeChatDraggable(el, handle) {
        let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
        const start = (e) => {
            dragging = true;
            const pt = e.touches ? e.touches[0] : e;
            sx = pt.clientX; sy = pt.clientY;
            const r = el.getBoundingClientRect();
            ox = r.left; oy = r.top;
            el.style.left = r.left + 'px'; el.style.top = r.top + 'px';
            el.style.right = 'auto'; el.style.bottom = 'auto';
        };
        const move = (e) => {
            if (!dragging) return;
            const pt = e.touches ? e.touches[0] : e;
            el.style.left = Math.max(4, Math.min(window.innerWidth - 60, ox + pt.clientX - sx)) + 'px';
            el.style.top = Math.max(4, Math.min(window.innerHeight - 40, oy + pt.clientY - sy)) + 'px';
            if (e.cancelable) e.preventDefault();
        };
        const end = () => { dragging = false; };
        handle.addEventListener('mousedown', start);
        handle.addEventListener('touchstart', start, { passive: true });
        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', end);
        document.addEventListener('touchend', end);
    }

    // ══════════════ 入口 ══════════════
    // 进社区的门：还没账号 → 先注册/登录（世界之种、作品、团队身份都归到账号名下）
    // 服务器本机（开着服务器的那台电脑）免登录，其他设备一律要有账号
    function open() {
        if (isLoggedIn()) { showHome(); return; }
        if (!_server) {                       // 还没连上服务器：按老样子先问昵称
            if (!identityReady()) { showIdentitySetup(showHome); return; }
            showHome();
            return;
        }
        authRequired().then(need => {
            if (need) { showAuth(showHome); return; }
            if (!identityReady()) { showIdentitySetup(showHome); return; }
            showHome();
        }).catch(() => showHome());
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { autoConnect(); });
        else autoConnect();
    }

    return {
        open, openPanel: open, closePanel: () => {},
        showHome, showDetail, showIdentitySetup,
        // 账号：注册 / 登录 / 登出 / 个人中心（等级 · 种子 · 设备 IP · 创作统计）
        showAuth, showProfile, registerAccount, loginAccount, logoutServer, fetchProfile,
        saveProfile, getProfile, isLoggedIn, getToken, getAccount, logout, setUid,
        authRequired,
        // 切语言时重绘当前社区界面（列表/详情里全是 I18N.t() 的直出文本）
        relocalize: () => {
            const h = host();
            if (!h) return false;          // 社区没打开 → 不用管
            if (_view && _view.story) refreshDetail(true);
            else showHome();
            return true;
        },
        connect, autoConnect, isConnected, getServer, getServerName, getServerInfo, disconnect,
        // 自动发现
        discover, cancelDiscovery, isScanning, getScan, runDiscovery,
        unifiedUrl, getPort, setPort, mdnsHost, probeOnce, sweepPrefixes,
        setDeepScan, getDeepScan,
        getName, setName, getAvatar, setAvatar,
        // 稳定身份（改昵称不变）+ 历史昵称 + 认领凭据
        getUid, getAliases, rememberAlias, ident,
        mineIds, getClaims, rememberClaim, rememberClaimCode, whoAmI, localIps,
        listStories, fetchStory, shareDesign, pushDesign, deleteStory, joinStory,
        unlock, requestJoin, memberAction, saveSettings, postComment, postChat, postTip,
        downloadStory, downloadJson, openSharedInDesigner, tipStory,
        // 页面导航（设计器「返回」要回到故事主页，而不是主菜单）
        showHome, showDetail,
        // 协作在线状态：光标 / 谁在改哪个节点
        reportPresence, fetchPresence, leavePresence,
        // 世界之种钱包（打赏真转账）+ 协作聊天浮窗
        getMe, getUsers, getWallet, applyWallet, refreshSeedDisplay,
        openChatOverlay, refreshChatOverlay, closeChatOverlay, isChatOverlayOpen,
        // 限时线上考试
        getExam, saveExam, removeExam, submitExam, awardExam, startExam, examPanel,
        openExamEditor, renderExamResults, examStatusText,
        onRemoteChange
    };
})();
