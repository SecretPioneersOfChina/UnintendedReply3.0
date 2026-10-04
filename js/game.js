/**
 * game.js - 核心游戏引擎
 * 《无心之举 / Unintended Reply》
 * 状态管理 · 对话渲染 · 选择系统 · 数据流控制
 */

const GAME = (function() {
    'use strict';

    // ==================== 游戏状态 ====================
    let state = {
        currentChapter: 'ch1',
        currentSceneId: 'ch1_start',
        flags: {
            trustMystery: 0,
            savedTimelines: 0,
            truthRevealed: false,
            choseSilence: false,
            ultimateQuestion: false,
            relationship_sq: 0,
            relationship_dc: 0,
        },
        messageHistory: [],
        playedMessages: new Set(),
        currentMessageIndex: 0,
        isPlaying: false,
        isPaused: false,
        aborted: false, // 玩家主动退出故事：让残留的延时回调安静返回，不再往已清空的界面里塞内容
        currentChoices: [],
        autoSaveTimer: null,
        currentSpeaker: null,
        totalChoicesMade: 0,
        charactersMet: new Set(),
        exam: null // 限时考试上下文 { storyId, title, deadline }（非考试模式为 null）
    };

    // ==================== DOM 引用 ====================
    const dom = {};

    function cacheDom() {
        dom.app = document.getElementById('app');
        dom.splash = document.getElementById('splash-screen');
        dom.chatContainer = document.getElementById('chat-container');
        dom.messages = document.getElementById('messages');
        dom.choices = document.getElementById('choices');
        dom.choiceArea = document.getElementById('choice-area');
        dom.typingIndicator = document.getElementById('typing-indicator');
        dom.chapterBanner = document.getElementById('chapter-banner');
        dom.bannerTitle = document.getElementById('banner-title');
        dom.bannerSub = document.getElementById('banner-subtitle');
        dom.bannerChapter = document.getElementById('banner-chapter');
        dom.continueBtn = document.getElementById('banner-continue');
        dom.endingScreen = document.getElementById('ending-screen');
        dom.settingsOverlay = document.getElementById('settings-overlay');
        dom.quitBtn = document.getElementById('btn-quit');
        dom.langBtns = document.querySelectorAll('.lang-btn');
    }

    // ==================== 初始化 ====================
    let _splashTimer = null;

    function init() {
        cacheDom();

        // 初始化音频引擎
        if (typeof AUDIO !== 'undefined' && AUDIO.init) { AUDIO.init(); }

        // 事件监听
        document.addEventListener('languageChanged', onLanguageChanged);
        document.getElementById('btn-settings')?.addEventListener('click', showSettings);
        document.getElementById('btn-save')?.addEventListener('click', saveGame);
        document.getElementById('settings-close')?.addEventListener('click', hideSettings);
        dom.quitBtn?.addEventListener('click', confirmQuitStory);

        // 绑定音量滑块事件
        bindVolumeControls();

        // 正文打字机：模式按钮 + 点击跳过
        bindTypeModeOptions();
        paintTypeModeUI();
        bindTypeSkip();
        bindScrollFollow();

        // 语言按钮事件
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                I18N.setLanguage(lang);
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 结局按钮事件
        document.getElementById('ending-replay')?.addEventListener('click', replayChapter);
        document.getElementById('ending-menu')?.addEventListener('click', goToMainMenu);
        document.getElementById('ending-next')?.addEventListener('click', nextChapter);

        document.documentElement.lang = I18N.getLanguage();

        // 更新游戏标题
        const titleEl = document.getElementById('game-title');
        if (titleEl) titleEl.textContent = I18N.t('gameTitle');

        // 启动splash
        // 更新启动文字
        const splashText = document.getElementById('splash-text');
        if (splashText) splashText.textContent = I18N.t('splashLoading');

        _splashTimer = setTimeout(() => {
            _splashTimer = null;
            dom.splash.classList.add('hidden');
            dom.app.classList.add('active');
            showMainMenu();
        }, 2000);
    }

    // 故事一旦开始就必须掐掉 splash 的收尾定时器：
    // 否则它会在 2 秒后触发 showMainMenu() → clearMessages() + hideVariableHud()，
    // 把玩家正在看的消息流和变量面板直接清掉
    function cancelSplash() {
        if (!_splashTimer) return;
        clearTimeout(_splashTimer);
        _splashTimer = null;
        // splash 收尾本来会做的两件事，掐掉定时器后得自己补上，否则 #app 一直是 display:none
        dom.splash.classList.add('hidden');
        dom.app.classList.add('active');
    }

    // ==================== 主菜单 ====================
    function showMainMenu() {
        setScreen('menu');
        clearMessages();
        clearChoices();
        hideEndingScreen();
        hideVariableHud(); // 清除变量 HUD
        hideExamHud();     // 清除考试倒计时条
        applyStoryTheme(''); // 回到主菜单 → 清除故事主题色
        dom.choiceArea.style.display = 'none';
        setQuitVisible(false); // 主菜单不显示「退出故事」

        // 停止所有音频
        if (typeof AUDIO !== 'undefined' && AUDIO.stopAll) { AUDIO.stopAll(); }

        // 顶部栏显示世界之种
        updateSeedDisplay();

        const titleMsg = document.createElement('div');
        titleMsg.className = 'message narrator visible';
        titleMsg.innerHTML = `
            <div class="narrator-content" style="border-color: var(--accent-cyan);">
                <div style="font-size:2.5rem;font-weight:800;margin-bottom:8px;background:linear-gradient(135deg,var(--accent-blue),var(--accent-purple),var(--accent-cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                    ${I18N.t('gameTitle')}
                </div>
                <div style="font-size:0.95rem;color:var(--text-secondary);margin-bottom:16px;font-style:normal;letter-spacing:2px;">
                    ${I18N.t('gameSubtitle')}
                </div>
                <div id="main-menu-actions" style="display:flex;flex-direction:column;gap:10px;max-width:320px;margin:0 auto;">
                    <button id="btn-story-select" class="ending-btn primary" style="width:100%;padding:14px 28px;"><img src="img/stories.png" alt="" class="menu-btn-img"> ${I18N.t('selectStory')}</button>
                    <button id="btn-designer" class="ending-btn" style="width:100%;padding:12px 28px;"><img src="img/designer.png" alt="" class="menu-btn-img"> ${I18N.t('storyDesigner')}</button>
                    <button id="btn-continue" class="ending-btn" style="width:100%;padding:12px 28px;"><img src="img/continue.png" alt="" class="menu-btn-img"> ${I18N.t('continueGame')}</button>
                    ${(typeof COMMUNITY !== 'undefined') ? `<button id="btn-community" class="ending-btn" style="width:100%;padding:12px 28px;border-color:var(--accent-blue);color:var(--accent-blue);">🌐 ${I18N.t('communityTitle')}</button>` : ''}
                </div>
            </div>
        `;
        dom.messages.appendChild(titleMsg);

        document.getElementById('btn-story-select')?.addEventListener('click', () => {
            try { showStorySelect(); } catch (err) { showMainMenuError(err.message); }
        });
        document.getElementById('btn-designer')?.addEventListener('click', () => {
            try { DESIGNER.open(); } catch (err) { showMainMenuError(err.message); }
        });
        document.getElementById('btn-continue')?.addEventListener('click', () => {
            try { continueGame(); } catch (err) { showMainMenuError(err.message); }
        });
        document.getElementById('btn-community')?.addEventListener('click', () => {
            try { COMMUNITY.open(); } catch (err) { console.error('[GAME] community error:', err); showMainMenuError('社区功能失败: ' + err.message); }
        });

        const endings = SAVE.getUnlockedEndings();
        if (endings.length > 0) {
            const endingMsg = document.createElement('div');
            endingMsg.className = 'message system visible';
            endingMsg.innerHTML = `<div class="system-text">🏆 ${I18N.t('endingUnlocked', { name: endings.length })} (${endings.length})</div>`;
            dom.messages.appendChild(endingMsg);
        }
    }

    function showMainMenuError(msg) {
        const container = document.getElementById('main-menu-actions');
        if (!container) return;
        const err = document.createElement('div');
        err.style.cssText = 'color:var(--accent-red);font-size:0.85rem;padding:8px 12px;background:rgba(239,68,68,0.1);border-radius:8px;margin-top:8px;';
        err.textContent = '❌ ' + msg;
        container.appendChild(err);
    }

    function updateSeedDisplay() {
        const seeds = SAVE.getSeeds();
        let el = document.getElementById('seed-display');
        if (!el) {
            el = document.createElement('span');
            el.id = 'seed-display';
            el.style.cssText = 'font-size:0.8rem;color:var(--accent-yellow);margin-right:8px;';
            const actions = document.querySelector('.top-bar-actions');
            if (actions) actions.prepend(el);
        }
        el.textContent = `💠 ${getSeedName()} x${seeds}`;
    }

    function getSeedName() { return I18N.t('worldSeed'); }

    // ==================== 退出故事 ====================
    // 顶栏 ✕ 只在剧情播放界面出现（主菜单 / 故事列表 / 结局页都隐藏）
    function setQuitVisible(v) {
        if (dom.quitBtn) dom.quitBtn.style.display = v ? 'flex' : 'none';
    }

    // 弹确认框：返回故事列表 / 返回主菜单 / 继续故事
    function confirmQuitStory() {
        if (document.getElementById('quit-story-modal')) return; // 防重复弹出
        const overlay = document.createElement('div');
        overlay.id = 'quit-story-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:20px;';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--bg-card);border:1px solid var(--accent-red);border-radius:var(--radius-md);max-width:420px;width:100%;padding:24px 20px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.6);animation:cardAppear 0.22s ease;';
        box.innerHTML = `<div style="font-size:1.1rem;font-weight:700;color:var(--accent-red);margin-bottom:8px;">✕ ${I18N.t('quitStoryTitle')}</div>
            <div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">${I18N.t('quitStoryHint')}</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="quit-to-list" style="background:transparent;border:1px solid var(--accent-blue);color:var(--accent-blue);padding:10px 18px;border-radius:var(--radius-md);cursor:pointer;font-size:0.9rem;">📚 ${I18N.t('quitToStoryList')}</button>
                <button id="quit-to-menu" style="background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);padding:10px 18px;border-radius:var(--radius-md);cursor:pointer;font-size:0.9rem;">🏠 ${I18N.t('quitToMainMenu')}</button>
                <button id="quit-cancel" style="background:transparent;border:none;color:var(--text-muted);padding:8px 18px;border-radius:var(--radius-md);cursor:pointer;font-size:0.85rem;">${I18N.t('quitStoryCancel')}</button>
            </div>`;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.getElementById('quit-to-list')?.addEventListener('click', () => { close(); quitStory('list'); });
        document.getElementById('quit-to-menu')?.addEventListener('click', () => { close(); quitStory('menu'); });
        document.getElementById('quit-cancel')?.addEventListener('click', close);
    }

    // 退出当前故事：掐掉播放流程 → 收尾 → 去列表或主菜单
    function quitStory(target) {
        // 1. 中止播放链路（残留的 setTimeout 回调会因为 aborted 直接返回）
        state.aborted = true;
        state.isPlaying = false;
        state.isPaused = false;
        state.currentChoices = [];
        state.exam = null;      // 退出故事 → 结束考试（不误报成绩）
        hideExamHud();
        cancelTypeWrite();

        // 2. 收尾清理
        if (typeof AUDIO !== 'undefined' && AUDIO.stopAll) AUDIO.stopAll();
        dom.chapterBanner.classList.remove('active');
        hideEndingScreen();
        hideVariableHud();
        clearChoices();
        clearMessages();
        dom.choiceArea.style.display = 'none';
        applyStoryTheme(''); // 退出故事 → 清掉故事主题色
        setQuitVisible(false);
        updateSeedDisplay();

        // 3. 跳转
        if (target === 'menu') showMainMenu();
        else showStorySelect();
    }

    // ==================== 故事卡选择 ====================
    function showStorySelect() {
        setScreen('select');
        clearMessages();
        clearChoices();
        hideVariableHud(); // 清除变量 HUD
        applyStoryTheme(''); // 故事列表用默认配色
        dom.choiceArea.style.display = 'none';
        setQuitVisible(false); // 故事列表页不显示「退出故事」

        updateSeedDisplay();

        const stories = STORY.getStoryCards();
        const msg = document.createElement('div');
        msg.className = 'message narrator visible';
        msg.innerHTML = `<div class="narrator-content" style="border-color:var(--accent-purple);">
            <div class="narrator-text" style="font-size:1.2rem;font-weight:700;font-style:normal;margin-bottom:8px;">🌌 ${I18N.t('selectStory')}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">${I18N.t('seedBalance')}: 💠 ${SAVE.getSeeds()}</div>
        </div>`;
        dom.messages.appendChild(msg);

        const grid = document.createElement('div');
        grid.className = 'story-card-grid';
        // 布局样式由 CSS .story-card-grid 全权控制（移动端靠左单列 / 宽屏全宽多列）

        stories.forEach(story => {
            const progress = SAVE.getCardProgress(story.id);
            const card = document.createElement('div');
            card.className = 'story-card';
            card.style.cssText = `background:var(--bg-card);border:1px solid ${story.color || 'var(--border-color)'};border-radius:var(--radius-md);padding:16px;cursor:pointer;transition:var(--transition);`;
            // 故事名 / 梗概按当前语言取（titleEn·titleJa / descriptionEn·descriptionJa）
            const sTitle = STORY.cardTitle(story);
            const sDesc = STORY.cardDesc(story);
            card.innerHTML = `
                <div style="font-size:1.8rem;margin-bottom:4px;">${story.icon || '📜'}</div>
                <div style="font-size:1.1rem;font-weight:700;color:${story.color || 'var(--text-primary)'};overflow-wrap:break-word;word-break:break-word;">${escapeHtml(sTitle)}</div>
                ${sDesc ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin:4px 0;">${escapeHtml(sDesc)}</div>` : ''}
                <div style="font-size:0.75rem;color:var(--text-muted);">${I18N.t('difficulty')}: ${'⭐'.repeat(story.difficulty || 1)} | 🏆 ${progress.endings}/${story.totalEndings || 5}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
                    <button class="fan-edit-btn" data-card-id="${story.id}" title="${I18N.t('fanEditHint')}" style="flex:1 1 80px;min-width:70px;background:rgba(168,85,247,0.15);border:1px solid var(--accent-purple);color:var(--accent-purple);border-radius:var(--radius-sm);padding:5px;font-size:0.78rem;cursor:pointer;">🛠 ${I18N.t('fanEdit')}</button>
                </div>
            `;
            // 二创改编按钮 → 把故事剧本导入蓝图编辑器
            card.querySelector('.fan-edit-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const designs = (typeof STORY2DESIGN !== 'undefined' && STORY2DESIGN.importStoryCard) ? STORY2DESIGN.importStoryCard(story.id) : null;
                    if (designs && designs.length > 0) {
                        if (typeof DESIGNER !== 'undefined' && DESIGNER.open) DESIGNER.open(designs[0]);
                    } else {
                        showMainMenuError('生成蓝图失败：未找到可转换的章节');
                    }
                } catch (err) {
                    console.error('[GAME] fan-edit error:', err);
                    showMainMenuError('二创改编失败: ' + err.message);
                }
            });
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    console.log('[GAME] Click story card:', story.id);
                    startStory(story.id);
                } catch (err) {
                    console.error('[GAME] startStory error:', err);
                    showMainMenuError('启动故事失败: ' + err.message);
                }
            });
            grid.appendChild(card);
        });

        // 设计的故事卡（含编辑/游玩/删除按钮）
        const designs = SAVE.getDesigns();
        designs.forEach(design => {
            const card = document.createElement('div');
            card.className = 'story-card story-card-custom';
            // 自定义主题色（未设置时用默认黄）
            const theme = design.themeColor || 'var(--accent-yellow)';
            card.style.cssText = `background:var(--bg-card);border:1px solid ${theme};border-radius:var(--radius-md);padding:16px;cursor:pointer;transition:var(--transition);border-style:dashed;position:relative;`;
            card.innerHTML = `
                <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:1.8rem;margin-bottom:4px;min-height:2.2rem;">${(typeof IMGDB !== 'undefined' && IMGDB.isImgRef(design.storyIcon)) ? IMGDB.renderIconHTML(design.storyIcon, 32) : escapeHtml(design.storyIcon || '✨')}</div>
                        <div style="font-size:1.1rem;font-weight:700;color:${theme};overflow-wrap:break-word;word-break:break-word;">${escapeHtml(STORY.cardTitle(design) || I18N.t('unnamedStory'))}</div>
                        ${STORY.cardDesc(design) ? `<div style="font-size:0.8rem;color:var(--text-secondary);margin:4px 0;overflow-wrap:break-word;word-break:break-word;">${escapeHtml(STORY.cardDesc(design))}</div>` : ''}
                        <div style="font-size:0.75rem;color:var(--text-muted);">${I18N.t('customStory')}</div>
                    </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
                    <button class="edit-design-btn" data-design-id="${design.id}" title="${I18N.t('designerEdit')}" style="flex:1 1 80px;min-width:70px;background:rgba(59,130,246,0.15);border:1px solid var(--accent-blue);color:var(--accent-blue);border-radius:var(--radius-sm);padding:5px;font-size:0.78rem;cursor:pointer;">✏️ ${I18N.t('designerEdit')}</button>
                    <button class="play-design-btn" data-design-id="${design.id}" title="${I18N.t('designerPlay')}" style="flex:1 1 80px;min-width:70px;background:rgba(34,197,94,0.15);border:1px solid var(--accent-green);color:var(--accent-green);border-radius:var(--radius-sm);padding:5px;font-size:0.78rem;cursor:pointer;">▶ ${I18N.t('designerPlay')}</button>
                    <button class="delete-design-btn" data-design-id="${design.id}" title="${I18N.t('designerDelete')}" style="flex-shrink:0;background:rgba(239,68,68,0.15);border:1px solid var(--accent-red);color:var(--accent-red);border-radius:var(--radius-sm);padding:5px 10px;font-size:0.78rem;cursor:pointer;">🗑</button>
                </div>
            `;
            // 编辑按钮 → 打开设计器编辑
            card.querySelector('.edit-design-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                DESIGNER.open(design);
            });
            // 游玩按钮 → 直接试玩
            card.querySelector('.play-design-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                DESIGNER.playExistingDesign(design);
            });
            // 删除按钮 → 确认删除
            card.querySelector('.delete-design-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                confirmDeleteDesign(design);
            });
            grid.appendChild(card);
        });

        const backBtn = document.createElement('button');
        backBtn.className = 'ending-btn';
        backBtn.textContent = '← ' + I18N.t('mainMenu');
        backBtn.style.cssText = 'margin-top:8px;width:100%;padding:12px;';
        backBtn.addEventListener('click', showMainMenu);
        grid.appendChild(backBtn);

        // 🌐 故事社区（局域网分享 / 协作编辑）
        if (typeof COMMUNITY !== 'undefined' && COMMUNITY.open) {
            const commBtn = document.createElement('button');
            commBtn.className = 'ending-btn';
            commBtn.textContent = '🌐 ' + I18N.t('communityTitle');
            commBtn.style.cssText = 'margin-top:8px;width:100%;padding:12px;';
            commBtn.addEventListener('click', () => {
                try { COMMUNITY.open(); } catch (err) { showMainMenuError('社区功能失败: ' + err.message); }
            });
            grid.appendChild(commBtn);
        }

        dom.messages.appendChild(grid);
    }

    // ==================== 启动故事卡 ====================
    function startStory(cardId) {
        setScreen('story');
        const card = STORY.getStoryCard(cardId);
        if (!card) { showMainMenuError('Story card not found: ' + cardId); return; }

        // 消耗世界之种（如果种子为0则允许免费开始一次，避免死循环）
        const currentSeeds = SAVE.getSeeds();
        if (currentSeeds > 0) {
            if (!SAVE.spendSeeds(1)) {
                showMainMenuError(`💠 ${I18N.t('noSeeds')}`);
                return;
            }
        } else if (currentSeeds <= 0) {
            // 种子不足时提示但允许继续
            console.log('[Game] 世界之种不足，允许免费开始以打破死循环');
        }

        updateSeedDisplay();
        cancelSplash(); // 别让 splash 收尾的 showMainMenu() 清掉刚开始的故事
        state.currentStoryCard = cardId;
        state.currentChapter = card.chapters[0] || 'ch1';
        state.currentSceneId = (STORY.getChapter(state.currentChapter) || {}).startScene || 'ch1_start';
        state.flags = {};
        setVariableNames(null); // 内置故事用变量键插值，清掉上个蓝图故事的显示名别名
        setVariableDefaults(null); // 同上：清掉上个故事的默认值，拿到章节后再按章节设置
        state.messageHistory = [];
        state.playedMessages = new Set();
        state.totalChoicesMade = 0;
        state.charactersMet = new Set();
        state.isCustomStory = false;
        applyStoryTheme(''); // 内置故事用默认配色
        state.aborted = false; // 新故事开始 → 清掉上一次的退出标记
        setQuitVisible(true); // 剧情播放中显示「退出故事」

        dom.choiceArea.style.display = 'block';
        const ch = STORY.getChapter(state.currentChapter);
        if (!ch) {
            showMainMenuError('章节未找到: ' + state.currentChapter + '。可能故事文件未加载完成，请刷新页面。');
            return;
        }
        setVariableDefaults(ch.varDefaults); // 主角名这类「还没输入就要显示」的变量默认值
        // 播放故事全局 BGM
        if (typeof AUDIO !== 'undefined' && AUDIO.playStoryBGM) {
            const storyCard = STORY.getStoryCard(cardId);
            AUDIO.playStoryBGM(storyCard);
        }
        try {
            showChapterBanner(ch, () => {
                clearMessages();
                if (ch.narrator) {
                    const text = interpolateText(STORY.getText(ch.narrator));
                    addNarratorMessage(text, () => {
                        state.currentSceneId = ch.startScene;
                        setTimeout(() => playScene(ch.startScene), 400);
                    }, false, ch.narrator);
                } else {
                    state.currentSceneId = ch.startScene;
                    playScene(ch.startScene);
                }
            });
        } catch (err) {
            console.error('[GAME] startStory showChapterBanner error:', err);
            showMainMenuError('启动章节失败: ' + err.message);
        }
    }

    function hideEndingScreen() {
        dom.endingScreen.classList.remove('active');
    }

    // 只重画结局画面的文字，**不重复走 showEnding 的副作用**
    // （showEnding 会 recordEnding / 发世界之种 / 上报考试成绩 —— 切语言时再跑一遍就重复计数了）
    function repaintEnding() {
        const e = state._lastEnding;
        if (!e) return false;
        if (!dom.endingScreen || !dom.endingScreen.classList.contains('active')) return false;
        const endType = e.type || 'good';
        const titleEl = document.querySelector('.ending-title');
        const typeEl = document.querySelector('.ending-type');
        const descEl = document.querySelector('.ending-description');
        if (titleEl) titleEl.textContent = resolveEndingText(e.titleKey);
        if (typeEl) typeEl.textContent = I18N.t(`ending${endType.charAt(0).toUpperCase() + endType.slice(1)}`);
        if (descEl) descEl.textContent = resolveEndingText(e.descKey);
        // 种子奖励条上的文字也是 i18n
        const seedLine = document.querySelector('.ending-seedinfo div');
        if (seedLine && state.seedReward > 0) {
            seedLine.textContent = '💠 ' + I18N.t('seedGainMsg', { n: state.seedReward, total: SAVE.getSeeds() });
        }
        return true;
    }

    // ==================== 删除自创故事并退还世界之种 ====================
    function confirmDeleteDesign(design) {
        if (document.getElementById('delete-design-modal')) return; // 防重复弹出
        // 置顶模态确认框：全屏遮罩 + 居中弹窗（不再插入消息流，避免被列表内容遮挡）
        const overlay = document.createElement('div');
        overlay.id = 'delete-design-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:20px;';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--bg-card);border:1px solid var(--accent-red);border-radius:var(--radius-md);max-width:420px;width:100%;padding:24px 20px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.6);animation:cardAppear 0.22s ease;';
        box.innerHTML = `<div style="font-size:1.1rem;font-weight:700;color:var(--accent-red);margin-bottom:8px;">🗑 ${I18N.t('designerDelete')}</div>
            <div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
                ${I18N.t('designerConfirmDelChar', { name: escapeHtml(design.title || I18N.t('unnamedStory')) }).replace(/[^\n]*/, '')} ${I18N.t('costSeeds')}: 1 💠
            </div>
            <div style="display:flex;gap:12px;justify-content:center;">
                <button id="confirm-delete-yes" style="background:var(--accent-red);color:#fff;border:none;padding:8px 24px;border-radius:var(--radius-md);cursor:pointer;font-size:0.9rem;">${I18N.t('designerDelete')}</button>
                <button id="confirm-delete-no" style="background:transparent;border:1px solid var(--border-color);color:var(--text-secondary);padding:8px 24px;border-radius:var(--radius-md);cursor:pointer;font-size:0.9rem;">${I18N.t('designerCancel')}</button>
            </div>`;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        // 点遮罩 = 取消
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.getElementById('confirm-delete-yes')?.addEventListener('click', () => {
            close();
            SAVE.deleteDesign(design.id);
            SAVE.addSeeds(1); // 退还世界之种
            updateSeedDisplay();
            showStorySelect(); // 留在列表并刷新
        });
        document.getElementById('confirm-delete-no')?.addEventListener('click', close);
    }

    // ==================== 试玩自定义故事 ====================
    function startCustomStory(chapter) {
        setScreen('story');
        if (!chapter) return;
        cancelSplash(); // 同上：splash 的 2 秒收尾不能把正在跑的蓝图故事清掉
        state.currentChapter = chapter.id;
        state.currentSceneId = chapter.startScene;
        state.flags = {};
        // 预置蓝图变量初始值（条件判定/文本插值/函数计算都从 state.flags 读取）
        Object.entries(chapter.runtimeInitialValues || {}).forEach(([k, v]) => { state.flags[k] = v; });
        // 变量显示名别名：让文本里写 {名字} 也能命中键为 var_名字 的变量
        setVariableNames(chapter.varNames);
        setVariableDefaults(chapter.varDefaults);
        state.messageHistory = [];
        state.playedMessages = new Set();
        state.totalChoicesMade = 0;
        state.charactersMet = new Set();
        // 标记为自定义故事（用于种子奖励）
        state.isCustomStory = true;
        applyStoryTheme(chapter.themeColor); // 应用故事主题色（空则回落到默认配色）
        state.aborted = false; // 新故事开始 → 清掉上一次的退出标记
        setQuitVisible(true); // 剧情播放中显示「退出故事」

        dom.choiceArea.style.display = 'block';
        clearMessages();

        // 初始化变量 HUD 面板
        if (chapter.hudVariables && chapter.hudVariables.length > 0) {
            showVariableHud(chapter);
        }

        // 播放自定义故事全局 BGM
        if (typeof AUDIO !== 'undefined' && AUDIO.playCustomBGM && chapter.globalBgm) {
            AUDIO.playCustomBGM(chapter.globalBgm);
        } else if (typeof AUDIO !== 'undefined' && AUDIO.stopBGM) {
            AUDIO.stopBGM();
        }

        playScene(chapter.startScene);
    }

    // ==================== 自定义故事主题色 ====================
    // 把主题色写到 <html> 的 --story-accent 上；内置故事清空该变量，
    // 各控件通过 var(--story-accent, 自带配色) 自动回落到原有外观。
    let _storyAccent = ''; // 当前故事主题色（空 = 默认配色）

    function applyStoryTheme(color) {
        _storyAccent = (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) ? color.toLowerCase() : '';
        const root = document.documentElement;
        if (_storyAccent) root.style.setProperty('--story-accent', _storyAccent);
        else root.style.removeProperty('--story-accent');
    }

    // #RRGGBB → rgba(r,g,b,a)
    function hexToRgba(hex, alpha) {
        const m = /^#([0-9a-fA-F]{6})$/.exec(String(hex || ''));
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
    }

    // ==================== 变量 HUD 面板 ====================
    let _hudValues = {};       // 当前显示的变量值 { key: value }
    let _hudEl = null;         // HUD DOM 元素引用

    // 创建并显示变量 HUD 浮动面板
    function showVariableHud(chapter) {
        hideVariableHud(); // 先清除已有的

        const vars = chapter.hudVariables || [];
        if (vars.length === 0) return;

        // 初始化值（从编译时的初始快照）
        _hudValues = {};
        const initialValues = chapter.runtimeInitialValues || {};
        vars.forEach(v => {
            _hudValues[v.key] = initialValues[v.key] ?? v.defaultValue ?? 0;
        });

        // 创建 HUD 容器
        const hud = document.createElement('div');
        hud.id = 'bp-variable-hud';
        const hudAccent = _storyAccent || '#4a7dff';
        const hudAccentBorder = hexToRgba(hudAccent, 0.3) || 'rgba(74,125,255,0.3)';
        const hudAccentGlow = hexToRgba(hudAccent, 0.08) || 'rgba(74,125,255,0.08)';
        hud.style.cssText = `
            position:fixed;top:60px;right:16px;z-index:9999;
            background:rgba(15,15,25,0.92);backdrop-filter:blur(12px);
            border:1px solid ${hudAccentBorder};border-radius:12px;
            padding:10px 14px;min-width:160px;max-width:240px;
            font-family:inherit;font-size:0.75rem;color:#e2e8f0;
            box-shadow:0 4px 24px rgba(0,0,0,0.5),0 0 40px ${hudAccentGlow};
            animation:hudSlideIn 0.3s ease;user-select:none;
        `;

        let html = `<div style="font-size:0.7rem;color:${hudAccent};opacity:0.85;margin-bottom:8px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">📊 ${I18N.t('hudTitle') || '变量面板'}</div>`;
        vars.forEach(v => {
            const val = _hudValues[v.key];
            const valColor = typeof val === 'number' ? (val > 0 ? '#34d399' : val < 0 ? '#f87171' : '#94a3b8') : '#c4b5fd';
            html += `
                <div class="bp-hud-item" data-var-key="${v.key}" style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="color:rgba(226,232,240,0.7);font-size:0.72rem;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(v.name)}</span>
                    <span class="bp-hud-value" data-var-key="${v.key}" style="color:${valColor};font-weight:700;font-size:0.82rem;min-width:36px;text-align:right;font-variant-numeric:tabular-nums;">${val}</span>
                </div>
            `;
        });
        hud.innerHTML = html;

        // 添加动画 keyframes（如果不存在）
        if (!document.getElementById('bp-hud-style')) {
            const style = document.createElement('style');
            style.id = 'bp-hud-style';
            style.textContent = `
                @keyframes hudSlideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes hudValueFlash {
                    0% { color: #38bdf8; transform: scale(1.3); }
                    100% { color: inherit; transform: scale(1); }
                }
                .bp-hud-value.updated {
                    animation: hudValueFlash 0.5s ease;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(hud);
        _hudEl = hud;
    }

    // 更新单个变量的 HUD 显示值（带闪烁动画）
    function updateVariableHud(variableName, newValue) {
        if (!_hudEl) return;
        _hudValues[variableName] = newValue;

        const valueEl = _hudEl.querySelector(`.bp-hud-value[data-var-key="${variableName}"]`);
        if (valueEl) {
            const valColor = typeof newValue === 'number'
                ? (newValue > 0 ? '#34d399' : newValue < 0 ? '#f87171' : '#94a3b8')
                : '#c4b5fd';
            valueEl.style.color = valColor;
            valueEl.textContent = newValue;
            // 触发闪烁动画
            valueEl.classList.remove('updated');
            void valueEl.offsetWidth; // 强制 reflow 以重启动画
            valueEl.classList.add('updated');
        }
    }

    // 隐藏 HUD
    function hideVariableHud() {
        if (_hudEl) {
            _hudEl.remove();
            _hudEl = null;
        }
        _hudValues = {};
    }

    // ==================== 新游戏 ====================
    function startNewGame() {
        resetState();
        dom.choiceArea.style.display = 'block';
        startChapter('ch1');
    }

    function continueGame() {
        const saveData = SAVE.load(false);
        if (!saveData) {
            startNewGame();
            return;
        }
        restoreState(saveData);
        dom.choiceArea.style.display = 'block';
        // 重新渲染历史
        renderHistory(saveData.history || []);
        // 继续游戏的场景
        const scene = STORY.getScene(state.currentChapter, state.currentSceneId);
        if (scene) {
            if (scene.choices) {
                showChoices(scene.choices);
            } else if (scene.nextScene) {
                // 自动推进
                setTimeout(() => advanceScene(scene.nextScene), 800);
            } else if (scene.isEnding) {
                showEnding(scene.endingId, scene.endingTitleKey, scene.endingDescKey, scene.endingStats, scene.endingIcon, scene.endingType);
            }
        }
    }

    function resetState() {
        state = {
            currentChapter: 'ch1',
            currentSceneId: 'ch1_start',
            flags: {
                trustMystery: 0,
                savedTimelines: 0,
                truthRevealed: false,
                choseSilence: false,
                ultimateQuestion: false,
                relationship_sq: 0,
                relationship_dc: 0,
            },
            messageHistory: [],
            playedMessages: new Set(),
            currentMessageIndex: 0,
            isPlaying: false,
            isPaused: false,
            aborted: false,
            currentChoices: [],
            autoSaveTimer: null,
            currentSpeaker: null,
            totalChoicesMade: 0,
            charactersMet: new Set(),
            exam: null
        };
    }

    function restoreState(savedState) {
        state.currentChapter = savedState.chapter;
        state.currentSceneId = savedState.sceneId;
        state.flags = savedState.flags || state.flags;
        // 恢复变量显示名别名（蓝图故事存的是变量键，文本里可能写的是显示名）
        const restoredChapter = STORY.getChapter(state.currentChapter);
        setVariableNames(restoredChapter && restoredChapter.varNames);
        setVariableDefaults(restoredChapter && restoredChapter.varDefaults);
        applyStoryTheme(restoredChapter && restoredChapter.themeColor); // 恢复自定义故事主题色
        state.messageHistory = savedState.history || [];
        state.playedMessages = new Set(savedState.playedMessages || []);
        state.currentMessageIndex = savedState.currentMessageIndex || 0;
        state.aborted = false; // 读档继续 → 清掉退出标记
        setQuitVisible(true); // 剧情播放中显示「退出故事」

        // 自动存档计时器恢复
        startAutoSave();
    }

    // ==================== 章节系统 ====================
    function startChapter(chapterId) {
        state.currentChapter = chapterId;
        const chapter = STORY.getChapter(chapterId);
        if (!chapter) return;
        setVariableDefaults(chapter.varDefaults); // 切章时同步该章的变量默认值

        cancelSplash();
        state.aborted = false; // 新章节开始 → 清掉退出标记
        setQuitVisible(true); // 剧情播放中显示「退出故事」

        // 显示章节横幅
        showChapterBanner(chapter, () => {
            clearMessages();
            // 如果有章首旁白且场景开头没有相同旁白，先展示
            if (chapter.narrator) {
                const text = interpolateText(STORY.getText(chapter.narrator));
                addNarratorMessage(text, () => {
                    state.currentSceneId = chapter.startScene;
                    setTimeout(() => playScene(chapter.startScene), 400);
                }, false, chapter.narrator);
            } else {
                state.currentSceneId = chapter.startScene;
                playScene(chapter.startScene);
            }
        });
    }

    function showChapterBanner(chapter, callback) {
        // 计算故事内的章节号（不再用全局 index，否则混合故事会错位）
        // 例如：survive_ch1 在 STORY.chapters 全局里是第 9 个，但故事内是第 1 章
        let chapterNum = 1;
        if (state.currentStoryCard) {
            const card = STORY.getStoryCard(state.currentStoryCard);
            if (card && card.chapters) {
                const idx = card.chapters.indexOf(chapter.id);
                if (idx >= 0) chapterNum = idx + 1;
            }
        } else {
            // 回退：尝试从 story cards 中找到包含此章节的卡片
            const card = STORY.getStoryCards().find(c => c.chapters && c.chapters.indexOf(chapter.id) >= 0);
            if (card) {
                const idx = card.chapters.indexOf(chapter.id);
                if (idx >= 0) chapterNum = idx + 1;
                state.currentStoryCard = card.id;
            }
        }
        dom.bannerChapter.textContent = I18N.t('chapter', { n: chapterNum });
        // 章名/副标题里也允许写变量（如主角名 {player_name}）
        dom.bannerTitle.textContent = interpolateText(I18N.t(chapter.titleKey));
        dom.bannerSub.textContent = interpolateText(I18N.t(chapter.subtitleKey));

        dom.chapterBanner.classList.add('active');

        // 播放章节 BGM（如果有，覆盖全局 BGM）
        if (typeof AUDIO !== 'undefined' && AUDIO.playChapterBGM && chapter.chapterBgm) {
            AUDIO.playChapterBGM(chapter.chapterBgm);
        }

        dom.continueBtn.onclick = () => {
            dom.chapterBanner.classList.remove('active');
            if (callback) setTimeout(callback, 300);
        };
    }

    // 蓝图「章节开始」节点编译出的章节卡消息 → 复用全屏章节横幅展示
    function showChapterCardMessage(msg, callback) {
        const title = interpolateText(STORY.getText(msg.title));
        const sub = interpolateText(STORY.getText(msg.sub));
        dom.bannerChapter.textContent = I18N.t('chapter', { n: msg.num || 1 });
        dom.bannerTitle.textContent = title;
        dom.bannerSub.textContent = sub;

        // 播放该章节 BGM（覆盖当前 BGM）
        if (msg.bgm && typeof AUDIO !== 'undefined' && AUDIO.playChapterBGM) {
            AUDIO.playChapterBGM(msg.bgm);
        }

        dom.chapterBanner.classList.add('active');
        dom.continueBtn.onclick = () => {
            dom.chapterBanner.classList.remove('active');
            if (callback) setTimeout(callback, 300);
        };

        // 记录到历史（text 兜底拼接标题+副标题，历史回放按 text 渲染也能显示）
        const histText = sub ? (title + '\n' + sub) : title;
        state.messageHistory.push({
            type: 'chapter_card',
            num: msg.num || 1,
            title: msg.title,
            sub: msg.sub,
            text: { zh: histText, en: histText, ja: histText },
            timestamp: Date.now()
        });
    }

    // ==================== 场景播放 ====================
    function playScene(sceneId) {
        if (state.aborted) return; // 玩家已退出：掐断残留的延时推进
        state.currentSceneId = sceneId;
        const scene = STORY.getScene(state.currentChapter, sceneId);
        if (!scene) return;

        // 函数调用场景：进入场景时先执行（绑定参数作用域 + 返回值写入变量，供消息插值/条件判定使用）
        state.fnScope = null; // 每个场景重置函数参数作用域
        if (scene.fnCall) {
            executeFnCall(scene.fnCall);
        }

        state.currentMessageIndex = 0;
        state.currentChoices = scene.choices || [];
        state.isPlaying = true;

        // 自动存档
        autoSave();

        playMessages(scene);
    }

    function playMessages(scene) {
        const messages = scene.messages;
        if (!messages || messages.length === 0) {
            showSceneChoices(scene);
            return;
        }

        playNextMessage(messages, scene);
    }

    function playNextMessage(messages, scene) {
        if (state.aborted) return; // 玩家已退出：不再往下播
        if (state.currentMessageIndex >= messages.length) {
            showSceneChoices(scene);
            return;
        }

        const msg = messages[state.currentMessageIndex];
        state.currentMessageIndex++;

        // 章节开始消息（蓝图 chapter_begin 节点编译产物）：全屏章节横幅，点继续后接着播
        if (msg.type === 'chapter_card') {
            showChapterCardMessage(msg, () => {
                setTimeout(() => playNextMessage(messages, scene), 300);
            });
            return;
        }

        // 显示打字指示器
        if (msg.type === 'character' || msg.type === 'narrator') {
            showTyping(() => {
                renderMessage(msg, () => {
                    // 消息之间的延迟
                    const delay = msg.type === 'narrator' ? 800 : 400;
                    setTimeout(() => playNextMessage(messages, scene), delay);
                });
            });
        } else {
            renderMessage(msg, () => {
                setTimeout(() => playNextMessage(messages, scene), 300);
            });
        }
    }

    // ==================== 消息渲染 ====================
    function renderMessage(msg, callback) {
        const text = interpolateText(STORY.getText(msg.text));

        // 如果是变量变更消息，同步到运行时状态（供条件判定/插值使用）+ 更新 HUD 面板
        // 函数体内的变量运算（runtime 标记）在播放到此消息时才求值（操作数可引用函数参数）
        if (msg.varEffect && msg.varEffect.variableName) {
            if (msg.varEffect.newValue !== undefined) {
                state.flags[msg.varEffect.variableName] = msg.varEffect.newValue;
                updateVariableHud(msg.varEffect.variableName, msg.varEffect.newValue);
            } else if (msg.varEffect.runtime && msg.varEffect.operation) {
                const nv = applyVarOperation(state.flags[msg.varEffect.variableName], msg.varEffect);
                state.flags[msg.varEffect.variableName] = nv;
                updateVariableHud(msg.varEffect.variableName, nv);
            }
        }

        // 函数返回（fnOut）：图函数子图内联编译后，播放到 fn_return 消息时把输出变量写入目标变量
        // writes: [{ target, src? , const? }] —— const 为编译期烘焙的直接值实参；src 为变量名（函数体内变量已由 varEffect 写入 flags）
        if (msg.fnOut && Array.isArray(msg.fnOut.writes)) {
            msg.fnOut.writes.forEach(w => {
                if (!w || !w.target) return;
                const val = (w.const !== undefined) ? w.const : state.flags[w.src];
                state.flags[w.target] = val;
                updateVariableHud(w.target, val);
            });
        }

        // 播放消息触发的音效
        if (msg.sound && typeof AUDIO !== 'undefined' && AUDIO.playMessageSfx) {
            AUDIO.playMessageSfx(msg.sound);
        }

        switch (msg.type) {
            case 'narrator':
                addNarratorMessage(text, callback);
                break;
            case 'character':
                // 优先用消息里直接打包的 charName/Color/Avatar（来自用户自定义角色），
                // fallback 到内置角色表
                let charInfo = msg.charName
                    ? { name: msg.charName, color: msg.charColor, avatar: msg.charAvatar }
                    : STORY.getCharacter(msg.speaker);
                // 消息级表情：按表情名查角色素材库（expressions[名字]），覆盖默认头像
                // （蓝图路径已在编译期解析为 charAvatar；此处支持原故事消息 msg.expression 写法）
                if (msg.expression && !msg.charName) {
                    const st = STORY.getCharacter(msg.speaker) || {};
                    const exprAvatar = st.expressions && st.expressions[msg.expression];
                    if (exprAvatar) {
                        charInfo = Object.assign({}, st, charInfo || {}, { avatar: exprAvatar });
                    }
                }
                if (!charInfo && !msg.charName) {
                    console.warn('[GAME] Character not found:', msg.speaker, '— available:', Object.keys(STORY.characters).join(','));
                }
                addCharacterMessage(msg.speaker, text, charInfo, callback);
                if (msg.speaker) state.charactersMet.add(msg.speaker);
                break;
            case 'illustration':
                // 插图消息（蓝图 illustration 节点）：大图 + 可选说明文字
                addIllustrationMessage(msg, callback);
                break;
            case 'system':
                addSystemMessage(text, callback);
                break;
            case 'player':
                addPlayerMessage(text, callback);
                break;
        }

        // 记录到历史（同时保存角色的显示信息，让历史回放也能正确显示）
        state.messageHistory.push({
            type: msg.type,
            speaker: msg.speaker,
            charName: msg.charName,
            charColor: msg.charColor,
            charAvatar: msg.charAvatar,
            text: msg.text,
            // 插图消息：存档回放需要原图与说明
            icon: msg.icon,
            caption: msg.caption,
            size: msg.size,
            timestamp: Date.now()
        });

        // 若该消息有标签，则标记为已播放
        if (msg.important) {
            state.playedMessages.add(msg.id || text);
        }
    }

    // rawText：这条旁白对应的**原始三语对象**（章节开场旁白 / playerReply 等
    // 不走 renderMessage 的路径要自己传，否则历史里存的是已渲染字符串，
    // 切语言重画和读档就换不回译文 —— 章首旁白曾因此在切语言后凭空消失，踩过）
    function addNarratorMessage(text, callback, instant, rawText) {
        const div = document.createElement('div');
        div.className = 'message narrator';
        div.innerHTML = `
            <div class="narrator-content">
                <div class="narrator-text"></div>
                <span class="narrator-speaker">✦ ${I18N.t('narrator')}</span>
            </div>
        `;
        // 记历史。重放路径（读档 / 切语言重画）已经在遍历历史，不能再记一遍。
        if (rawText && !_replayingHistory) {
            state.messageHistory.push({ type: 'narrator', text: rawText, timestamp: Date.now() });
        }
        appendAndAnimate(div, callback, div.querySelector('.narrator-text'), text, instant);
    }

    function addCharacterMessage(charId, text, charInfo, callback, instant) {
        const div = document.createElement('div');
        div.className = 'message character';
        // 防御：如果角色信息缺失，使用默认值
        const safeCharInfo = charInfo || { nameKey: 'defaultPlayerName', color: '#94a3b8', avatar: '❓', description: '' };
        // 优先用 charInfo.name（用户自定义角色），
        // fallback 到 I18N.t(nameKey)（内置角色）
        let name = safeCharInfo.name || I18N.t(safeCharInfo.nameKey) || charId;
        // 角色名也可以写成变量模板（如主角名 '{player_name}'）：先插值，
        // 若变量还没取到值（残留 {xxx}）就回落到角色原名，绝不把裸占位符显示在头像旁边
        if (typeof name === 'string' && name.indexOf('{') >= 0) {
            const interpName = interpolateText(name);
            name = UNRESOLVED_VAR_RE.test(interpName)
                ? (I18N.t(safeCharInfo.nameKey) || charId)
                : interpName;
        }
        const color = safeCharInfo.color || 'var(--text-secondary)';
        const time = getTimeString();

        // 头像：emoji 直接显示；'ur-img:<id>' 图片引用由 IMGDB 渲染（异步填充 dataURL）
        const avatarVal = safeCharInfo.avatar || '❓';
        let avatarHTML;
        if (typeof IMGDB !== 'undefined' && IMGDB.isImgRef(avatarVal)) {
            avatarHTML = IMGDB.renderIconHTML(avatarVal, 40, 9999);
        } else {
            avatarHTML = escapeHtml(avatarVal);
        }

        div.innerHTML = `
            <div class="msg-header">
                <div class="msg-avatar" style="border-color:${color};color:${color};background:rgba(0,0,0,0.3);">${avatarHTML}</div>
                <span class="msg-name" style="color:${color};">${name}</span>
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-bubble" style="border-color:${color}33;"></div>
        `;
        appendAndAnimate(div, callback, div.querySelector('.msg-bubble'), text, instant);
    }

    function addPlayerMessage(text, callback, instant) {
        const div = document.createElement('div');
        div.className = 'message player';
        const time = getTimeString();
        div.innerHTML = `
            <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
            <span class="msg-time">${time}</span>
        `;
        appendAndAnimate(div, callback, null, null, instant);
    }

    function addSystemMessage(text, callback, instant) {
        const div = document.createElement('div');
        div.className = 'message system';
        div.innerHTML = `<div class="system-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
        appendAndAnimate(div, callback, null, null, instant);
    }

    // 插图消息：整幅配图（Emoji 或 IndexedDB 图片素材）+ 居中的说明文字
    function addIllustrationMessage(msg, callback, instant) {
        const div = document.createElement('div');
        div.className = 'message illustration';
        const icon = msg.icon || '🖼️';
        const cap = msg.caption ? interpolateText(STORY.getText(msg.caption)) : '';
        const isMedium = msg.size === 'medium';
        const iconHTML = (typeof IMGDB !== 'undefined' && IMGDB.renderIconHTML)
            ? IMGDB.renderIconHTML(icon, isMedium ? 180 : 260)
            : escapeHtml(icon);
        div.innerHTML = `
            <div class="illustration-box" style="max-width:${isMedium ? '240px' : '100%'};">
                <div class="illustration-img" style="font-size:${isMedium ? '5rem' : '7rem'};line-height:1;">${iconHTML}</div>
                ${cap ? '<div class="illustration-caption"></div>' : ''}
            </div>`;
        appendAndAnimate(div, callback, cap ? div.querySelector('.illustration-caption') : null, cap, instant);
    }

    // ==================== 打字机效果（逐字 + 光标） ====================
    // 需求：正文太快跟不上阅读。这里把每条旁白/对白改成逐字显现 + 闪烁光标；
    // 点击屏幕任意处可「点一下立刻显示全文」，长文本按总时长自适应（不会卡很久）。
    const LS_TYPE_MODE = 'ur-type-mode';
    const TYPE_MODES = ['off', 'fast', 'normal', 'slow'];

    function getTypeMode() {
        let m = 'normal';
        try { m = localStorage.getItem(LS_TYPE_MODE) || 'normal'; } catch (e) {}
        return TYPE_MODES.indexOf(m) >= 0 ? m : 'normal';
    }
    function setTypeMode(m) {
        if (TYPE_MODES.indexOf(m) < 0) m = 'normal';
        try { localStorage.setItem(LS_TYPE_MODE, m); } catch (e) {}
        cancelTypeWrite();
        paintTypeModeUI();
    }

    let _typeState = null;   // { el, full, timer, done, caret }
    // 正在「重放已有历史」（读档回放 / 切语言重画）—— 这期间 addNarratorMessage 不能再记历史，
    // 否则会一边重放一边往历史里追加，滚雪球
    let _replayingHistory = false;
    let _typeSkipBound = false;

    function bindTypeSkip() {
        if (_typeSkipBound) return;
        _typeSkipBound = true;
        const skip = (e) => {
            if (!_typeState) return;
            // 点选项 / 设置面板 / 章节横幅 / 设计器时不抢事件
            if (e.target && e.target.closest && e.target.closest(
                '#choice-area, #settings-overlay, #chapter-banner, #ending-screen, #designer-overlay, .bp-connection-picker, #jump-bottom-btn')) return;
            finishTypeWrite();
        };
        document.addEventListener('click', skip, true);
        document.addEventListener('touchstart', skip, { capture: true, passive: true });
    }

    function cancelTypeWrite() {
        if (!_typeState) return;
        clearInterval(_typeState.timer);
        if (_typeState.caret && _typeState.caret.parentNode) _typeState.caret.parentNode.removeChild(_typeState.caret);
        _typeState = null;
    }

    // 立刻显示全文（点一下跳过）
    function finishTypeWrite() {
        if (!_typeState) return false;
        const st = _typeState;
        clearInterval(st.timer);
        st.el.textContent = st.full;
        if (st.caret && st.caret.parentNode) st.caret.parentNode.removeChild(st.caret);
        _typeState = null;
        scrollToBottom();
        if (st.done) st.done();
        return true;
    }

    function typeWrite(el, full, done) {
        cancelTypeWrite();
        if (!el) { if (done) done(); return; }
        const mode = getTypeMode();
        const text = String(full == null ? '' : full);
        if (mode === 'off' || !text) {
            el.textContent = text;
            if (done) done();
            return;
        }
        const len = text.length;
        // 每字基准耗时 → 整条消息的总时长（长文自动加速，最长不超过上限，避免干等）
        const perChar = mode === 'fast' ? 12 : (mode === 'slow' ? 40 : 22);
        const cap = mode === 'slow' ? 12000 : 6000;
        const total = Math.max(600, Math.min(len * perChar, cap));
        const interval = Math.max(8, Math.round(total / len));

        const caret = document.createElement('span');
        caret.className = 'type-caret';
        el.textContent = '';
        el.appendChild(caret);
        let i = 0;
        const timer = setInterval(() => {
            i = Math.min(len, i + 1);
            el.textContent = text.slice(0, i);
            el.appendChild(caret);
            if (i % 6 === 0) scrollToBottom();
            if (i >= len) {
                clearInterval(timer);
                if (caret.parentNode) caret.parentNode.removeChild(caret);
                if (_typeState && _typeState.timer === timer) _typeState = null;
                scrollToBottom();
                if (done) done();
            }
        }, interval);
        _typeState = { el: el, full: text, timer: timer, done: done, caret: caret };
    }

    function appendAndAnimate(element, callback, typeTarget, typeText, instant) {
        dom.messages.appendChild(element);
        // 玩家在上翻看历史时不要拽他，改成累计未读提示（按钮文案：↓ N 条新消息）
        if (!_followBottom && !_replayingHistory) { _unreadCount++; updateJumpBtn(); }
        scrollToBottom();
        bindTypeSkip();

        // 触发动画（用 setTimeout 而非 rAF：无头 / 节流环境下 rAF 可能不触发，正文就永远不显示）
        setTimeout(() => {
            // 元素已经被清空/替换（玩家中途退出、切换界面）→ 放弃这条消息
            if (!element.isConnected) return;
            element.classList.add('visible');
            scrollToBottom();
            if (typeTarget && !instant) {
                typeWrite(typeTarget, typeText, () => {
                    if (callback) setTimeout(callback, 120);
                });
            } else {
                if (typeTarget && typeText != null) typeTarget.textContent = typeText;
                if (callback) setTimeout(callback, 300);
            }
        }, 16);
    }

    // ==================== 选择系统 ====================
    function showSceneChoices(scene) {
        if (state.aborted) return; // 玩家已退出：不再渲染选项
        // 输入赋值场景（蓝图「输入」节点 / 原生 input 场景）
        if (scene.input) {
            showSceneInput(scene);
            return;
        }
        // 如果有 playerReply
        if (scene.playerReply) {
            const text = interpolateText(STORY.getText(scene.playerReply));
            addNarratorMessage(text, () => {
                setTimeout(() => {
                    if (scene.choices) {
                        showChoices(scene.choices);
                    } else if (scene.nextScene) {
                        advanceScene(scene.nextScene);
                    } else if (scene.isEnding) {
                        showEnding(scene.endingId, scene.endingTitleKey, scene.endingDescKey, scene.endingStats, scene.endingIcon, scene.endingType);
                    } else if (scene.isTransition) {
                        handleTransition(scene);
                    }
                }, 400);
            }, false, scene.playerReply);
        } else if (scene.choices) {
            showChoices(scene.choices);
        } else if (scene.nextScene) {
            advanceScene(scene.nextScene);
        } else if (scene.isEnding) {
            showEnding(scene.endingId, scene.endingTitleKey, scene.endingDescKey, scene.endingStats, scene.endingIcon, scene.endingType);
        } else if (scene.isTransition) {
            handleTransition(scene);
        } else {
            // 场景结束，回到章节选择或菜单
            showMainMenu();
        }
    }

    function showChoices(choices) {
        clearChoices();
        dom.choiceArea.style.display = 'block';

        // 根据变量条件过滤可选选项（高信任度才显示的选项等）
        const filtered = filterChoicesByCondition(choices);
        if (filtered.length === 0) {
            // 如果全部选项被过滤掉（玩家条件不满足），强制显示所有原始选项
            filtered.push(...choices);
        }

        filtered.forEach((choice, index) => {
            const text = interpolateText(STORY.getText(choice.text));
            const btn = document.createElement('button');
            btn.className = 'choice-btn';

            if (choice.tag) {
                const tagInfo = STORY.tagMap[choice.tag];
                if (tagInfo) {
                    const tagText = I18N.t(tagInfo.key);
                    btn.innerHTML = `<span class="choice-tag ${tagInfo.cls}">${tagText}</span> ${escapeHtml(text)}`;
                } else {
                    btn.textContent = escapeHtml(text);
                }
            } else {
                btn.textContent = escapeHtml(text);
            }

            btn.addEventListener('click', () => onChoiceSelected(choice, text, btn));
            dom.choices.appendChild(btn);
        });

        // 选项区弹出会把聊天区挤矮 → 最新一条消息可能被顶出可视区，重新贴一次底。
        // 玩家正在上翻看历史时 scrollToBottom() 自己会让开，只留「滑到最底部」按钮。
        setTimeout(() => { scrollToBottom(); }, 0);
        setTimeout(() => { scrollToBottom(); }, 320);
    }

    function onChoiceSelected(choice, choiceText, btnElement) {
        // 禁用所有按钮
        document.querySelectorAll('.choice-btn').forEach(b => b.classList.add('disabled'));

        // 显示玩家选择的消息
        addPlayerMessage(choiceText, () => {
            // 显示结果提示
            if (choice.resultText) {
                const resultText = STORY.getText(choice.resultText);
                const resultDiv = document.createElement('div');
                resultDiv.className = `choice-result visible ${choice.resultType || 'neutral'}`;
                resultDiv.textContent = resultText;
                dom.messages.appendChild(resultDiv);
                scrollToBottom();
            }

            // 应用效果
            applyEffects(choice.effects);

            state.totalChoicesMade++;

            // 延迟后进入下一场景
            setTimeout(() => {
                clearChoices();
                if (choice.nextScene) {
                    advanceScene(choice.nextScene);
                }
            }, 800);
        });
    }

    function advanceScene(sceneId) {
        if (state.aborted) return; // 玩家已退出：不再推进场景
        // 检查是否是跨章节跳转
        const currentChapter = STORY.getChapter(state.currentChapter);
        if (currentChapter && currentChapter.scenes[sceneId]) {
            playScene(sceneId);
        } else {
            // 在其他章节中查找
            for (const ch of STORY.chapters) {
                if (ch.scenes[sceneId]) {
                    if (ch.id !== state.currentChapter) {
                        // 切换章节
                        const targetChapter = ch;
                        state.currentChapter = ch.id;
                        showChapterBanner(targetChapter, () => {
                            clearMessages();
                            if (targetChapter.narrator) {
                                const text = STORY.getText(targetChapter.narrator);
                                addNarratorMessage(text, () => {
                                    setTimeout(() => playScene(sceneId), 400);
                                }, false, targetChapter.narrator);
                            } else {
                                playScene(sceneId);
                            }
                        });
                        return;
                    } else {
                        playScene(sceneId);
                        return;
                    }
                }
            }
            console.warn(`Scene ${sceneId} not found`);
            showMainMenu();
        }
    }

    // ==================== 效果系统 ====================
    function applyEffects(effects) {
        if (!effects) return;

        // Flag & variable system
        for (const [key, value] of Object.entries(effects)) {
            if (key.startsWith('flag_')) {
                // 普通 flag（剧情标记）
                const flagName = key.substring(5);
                state.flags[flagName] = value;
            } else if (typeof value === 'boolean') {
                // 布尔变量（如 truthRevealed, choseSilence, ultimateQuestion）
                state.flags[key] = value;
            } else if (typeof value === 'number') {
                // 数字变量（好感度、信任度等）—— 自动累加
                state.flags[key] = (state.flags[key] || 0) + value;
            } else {
                state.flags[key] = value;
            }
        }
    }

    // ==================== 运行时函数与文本插值 ====================
    // {变量名} → 当前值（未定义则原样保留）。
    // 变量名支持英文标识符，也支持中文/日文/韩文（蓝图变量键为 var_名字 这类形式，显示名也可直接用）。
    const VAR_TOKEN_RE = /\{([^{\s{}]+)\}/g;
    // 非全局版本：用来判断「插值后是否还残留未取到值的占位符」（全局正则的 lastIndex 会串味）
    const UNRESOLVED_VAR_RE = /\{[^{\s{}]+\}/;

    // 变量显示名 → 变量键（由章节的 varNames 构建，如 名字 / Name / 名前 → var_名字）
    let _varAlias = {};
    function setVariableNames(map) {
        _varAlias = {};
        if (!map || typeof map !== 'object') return;
        Object.keys(map).forEach(key => {
            const names = map[key] || {};
            if (typeof names === 'string') { _varAlias[names] = key; return; }
            ['name', 'en', 'ja'].forEach(k => {
                const n = names[k];
                if (n && _varAlias[n] === undefined) _varAlias[n] = key;
            });
        });
    }

    // 变量的**默认值**（章节 varDefaults，值可为三语对象）。
    // 用途：像主角名 {player_name} 这种「玩家还没输入就已经出现在正文里」的变量，
    //       没值时回落到默认名（凌澈），而不是把裸占位符 {player_name} 显示给玩家。
    let _varDefaults = {};
    function setVariableDefaults(map) {
        _varDefaults = (map && typeof map === 'object') ? map : {};
    }

    // 函数参数作用域（state.fnScope）优先于全局变量——函数体内 {参数名} 先命中参数。
    function interpolateText(text) {
        if (typeof text !== 'string' || text.indexOf('{') === -1) return text;
        return text.replace(VAR_TOKEN_RE, (m, token) => {
            const scope = state.fnScope;
            if (scope && scope[token] !== undefined) return String(scope[token]);
            let v = state.flags[token];
            if (v === undefined) {
                const key = _varAlias[token];
                if (key) v = state.flags[key];
            }
            if (v === undefined) {
                const d = _varDefaults[token];
                if (d !== undefined) v = STORY.getText(d);
            }
            return (v === undefined || v === null) ? m : String(v);
        });
    }

    // 把旧式函数定义 { params, returns, body } 编译为可调用函数。
    // body 为表达式（自动包 return）或含 return 的语句体；带缓存（挂在定义对象上）
    function compileUserFunction(fn) {
        if (fn.__compiled) return fn.__compiled;
        const params = fn.params || [];
        const body = String(fn.body || '').trim();
        const f = (body.indexOf('return') >= 0)
            ? new Function(params.join(','), body)
            : new Function(params.join(','), 'return (' + body + ');');
        fn.__compiled = f;
        return f;
    }

    // 安全求值表达式（图函数返回值）：作用域键作为形参；带编译缓存
    function evalFnExpression(expr, scope) {
        const keys = Object.keys(scope).filter(k => /^[A-Za-z_][A-Za-z0-9_]*$/.test(k));
        const cacheKey = keys.join(',') + '|' + expr;
        evalFnExpression._cache = evalFnExpression._cache || {};
        let fn = evalFnExpression._cache[cacheKey];
        if (!fn) {
            fn = new Function(keys.join(','), '"use strict"; return (' + expr + ');');
            evalFnExpression._cache[cacheKey] = fn;
        }
        return fn.apply(null, keys.map(k => scope[k]));
    }

    // 运行时变量运算（函数体内 set_variable：操作数可为数字或 {param} 模板字符串）
    function applyVarOperation(current, varEffect) {
        const op = varEffect.operation || 'set';
        let operand = varEffect.operandValue;
        if (typeof operand === 'string') {
            const interp = interpolateText(operand);
            const num = Number(interp);
            operand = (interp !== '' && !isNaN(num)) ? num : interp;
        }
        const cur = typeof current === 'number' ? current : (Number(current) || 0);
        switch (op) {
            case 'set': return operand;
            case 'add': return cur + (Number(operand) || 0);
            case 'sub': return cur - (Number(operand) || 0);
            case 'mul': return cur * (Number(operand) || 0);
            case 'div': return (Number(operand) !== 0) ? Math.floor(cur / Number(operand)) : cur;
            default: return current;
        }
    }

    // 场景级函数调用：进入场景时执行。
    // 两种函数形态：
    //   旧式 JS 函数 { params, returns, body }     → 立即求值，结果写入 resultVars 指定的变量
    //   消息型/图函数 { params, messages, returnValue } → 绑定参数作用域 state.fnScope
    //     （供本场景消息的 {参数名} 插值），返回值表达式用「参数 + 当前变量」求值后写入 resultVar
    // fnCall = { fnId, args:{p:{t:'var'|'direct', v}}, resultVar, returnValue, resultVars:{retKey:varName} }
    // 函数定义取自当前章节的 functions 字典（蓝图编译产物携带，原生故事亦可内联）
    function executeFnCall(fnCall) {
        if (!fnCall || !fnCall.fnId) return;
        state.fnScope = null;
        const chapter = STORY.getChapter(state.currentChapter);
        const fn = ((chapter && chapter.functions) || {})[fnCall.fnId];
        if (!fn) {
            console.warn('[GAME] fnCall function not found:', fnCall.fnId);
            return;
        }
        try {
            const params = fn.params || [];
            // 绑定参数作用域
            const scope = {};
            params.forEach(p => {
                const a = (fnCall.args || {})[p] || {};
                scope[p] = a.t === 'var' ? (state.flags[a.v] ?? 0) : (a.v ?? 0);
            });
            state.fnScope = scope;

            if (typeof fn.body === 'string' && fn.body.trim() !== '') {
                // 旧式 JS 函数
                const result = compileUserFunction(fn).apply(null, params.map(p => scope[p]));
                const returns = fn.returns || [];
                const resultVars = fnCall.resultVars || {};
                if (returns.length === 1) {
                    const target = resultVars[returns[0]] || returns[0];
                    state.flags[target] = result;
                    updateVariableHud(target, result);
                } else if (returns.length > 1 && result && typeof result === 'object') {
                    returns.forEach(rk => {
                        const target = resultVars[rk] || rk;
                        state.flags[target] = result ? result[rk] : undefined;
                        updateVariableHud(target, state.flags[target]);
                    });
                }
            } else if (fn.outputValues && Object.keys(fn.outputValues).length) {
                // 图函数：输出变量 = 取值来源的值（参数在 fnScope，函数体内变量在 state.flags），
                // 通过 resultVars 写入目标变量（未绑定时写入同名变量）
                const outputs = fn.outputs || Object.keys(fn.outputValues);
                const resultVars = fnCall.resultVars || {};
                outputs.forEach(out => {
                    const srcKey = fn.outputValues[out] || out;
                    const val = (scope[srcKey] !== undefined) ? scope[srcKey] : state.flags[srcKey];
                    const target = resultVars[out] || out;
                    state.flags[target] = val;
                    updateVariableHud(target, val);
                });
            } else if (fnCall.returnValue || fn.returnValue) {
                // 消息型/图函数：返回值表达式（作用域 = 参数 + 当前变量）
                const expr = fnCall.returnValue || fn.returnValue || '';
                const result = evalFnExpression(expr, Object.assign({}, state.flags, scope));
                const target = fnCall.resultVar
                    || (fnCall.resultVars && Object.values(fnCall.resultVars)[0]);
                if (target) {
                    state.flags[target] = result;
                    updateVariableHud(target, result);
                }
            }
        } catch (err) {
            console.error('[GAME] fnCall "' + fnCall.fnId + '" error:', err);
        }
    }

    // ==================== 场景输入（蓝图「输入」节点 / 原生 input 场景） ====================
    // 消息播完后出现行内输入框，确认后写入变量并以玩家气泡留档，自动进入下一场景
    function showSceneInput(scene) {
        const def = scene.input || {};
        const promptText = interpolateText(STORY.getText(def.prompt || def.text || '')) || I18N.t('gameInputDefaultPrompt');
        const isNumber = def.inputType === 'number';

        const wrap = document.createElement('div');
        wrap.className = 'message input-request';

        // 提示语：左侧蓝色竖线的卡片（左对齐，长文本自动换行）
        const promptEl = document.createElement('div');
        promptEl.className = 'scene-input-prompt';
        promptEl.textContent = '✏️ ' + promptText;
        wrap.appendChild(promptEl);

        // 输入行：输入框自适应占满，确认按钮固定宽度（不再用 .choice-btn，避免被 width:100% 撑开）
        const row = document.createElement('div');
        row.className = 'scene-input-row';
        const field = document.createElement('input');
        field.id = 'scene-input-field';
        field.className = 'scene-input-field';
        field.type = isNumber ? 'number' : 'text';
        field.maxLength = 24;
        field.autocomplete = 'off';
        field.placeholder = isNumber ? I18N.t('gameInputNumberPlaceholder') : I18N.t('gameInputPlaceholder');
        const okBtn = document.createElement('button');
        okBtn.className = 'scene-input-btn';
        okBtn.type = 'button';
        okBtn.textContent = '✓ ' + I18N.t('gameInputConfirm');
        row.appendChild(field);
        row.appendChild(okBtn);
        wrap.appendChild(row);
        dom.messages.appendChild(wrap);
        scrollToBottom();
        requestAnimationFrame(() => { wrap.classList.add('visible'); scrollToBottom(); });
        try { field.focus(); } catch (e) {}

        let done = false;
        field.addEventListener('input', () => field.classList.remove('error'));
        const confirm = () => {
            if (done) return;
            let val = field.value.trim();
            if (isNumber) {
                const num = Number(val);
                if (val === '' || isNaN(num)) {
                    field.classList.add('error');
                    try { field.focus(); } catch (e) {}
                    return;
                }
                val = num;
            } else if (!val) {
                val = I18N.t('gameInputAnonymous'); // 空输入兜底（如无名者）
            }
            done = true;
            state.flags[def.variable] = val;
            updateVariableHud(def.variable, val);
            field.disabled = true;
            okBtn.disabled = true;
            // 收起输入行，留下提示卡 + 玩家气泡作为记录
            row.remove();
            // 玩家输入以气泡形式留档
            addPlayerMessage(String(val), () => {
                setTimeout(() => {
                    if (scene.nextScene) {
                        advanceScene(scene.nextScene);
                    } else if (scene.isEnding) {
                        showEnding(scene.endingId, scene.endingTitleKey, scene.endingDescKey, scene.endingStats, scene.endingIcon, scene.endingType);
                    } else {
                        showMainMenu();
                    }
                }, 500);
            });
        };
        okBtn.addEventListener('click', confirm);
        field.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); });
    }

    // ==================== 条件评估 ====================
    // 评估单个条件对象 { variable, operator, value } 是否满足当前 state
    // 支持的操作符: >=, >, <=, <, ==, !=, &&, ||, contains, startsWith, endsWith, empty, notEmpty
    function evaluateCondition(cond) {
        if (!cond) return true;
        const actual = state.flags[cond.variable] ?? 0;
        const expected = cond.value;
        const op = cond.operator || '==';
        switch (op) {
            case '>=': return actual >= expected;
            case '>': return actual > expected;
            case '<=': return actual <= expected;
            case '<': return actual < expected;
            case '==': return actual == expected;
            case '!=': return actual != expected;
            case 'contains': return String(actual).includes(String(expected));
            case 'startsWith': return String(actual).startsWith(String(expected));
            case 'endsWith': return String(actual).endsWith(String(expected));
            case 'empty': return actual == null || actual === '' || actual === 0 || actual === false;
            case 'notEmpty': return !evaluateCondition({ variable: cond.variable, operator: 'empty' });
            default: return true;
        }
    }

    // 过滤场景的 choices 数组：移除不满足 condition 的选项
    // choices[i].condition 形如 { variable: 'relationship_kara', operator: '>=', value: 5 }
    function filterChoicesByCondition(choices) {
        if (!choices || !Array.isArray(choices)) return choices;
        return choices.filter(c => {
            if (!c.condition) return true;
            if (Array.isArray(c.condition)) {
                // 数组形式：每个子条件都满足
                return c.condition.every(evaluateCondition);
            }
            return evaluateCondition(c.condition);
        });
    }

    // ==================== 过渡处理 ====================
    function handleTransition(scene) {
        if (scene.nextChapter) {
            autoSave();
            setTimeout(() => startChapter(scene.nextChapter), 1500);
        }
    }

    // ==================== 结局系统 ====================
    // 结局标题/描述既可能是 i18n 键（内置故事），也可能是蓝图 {zh,en,ja} 三语对象
    function resolveEndingText(v) {
        if (v == null) return '';
        const raw = (typeof v === 'object') ? STORY.getText(v) : I18N.t(v);
        return interpolateText(raw); // 结局文案里也允许写变量（如主角名 {player_name}）
    }

    function checkAndShowEnding() {
        const ending = STORY.checkEnding(state.flags);
        if (ending) {
            showEnding(ending.id, ending.titleKey, ending.descKey);
        }
    }
    // endingTypeHint：蓝图结局节点自带的等级（perfect/good/bad/hidden）。
    // ⚠️ 蓝图结局的 id 是 'bp_<nodeId>'，STORY.getEnding() 查不到 → 以前一律回落成 'good'，
    //    导致「考试结果等级」对所有蓝图故事都变成同一个等级。
    function showEnding(endingId, titleKey, descKey, stats, endingIcon, endingTypeHint) {
        if (state.aborted) return; // 玩家已退出：不再弹结局
        cancelTypeWrite();
        dom.choiceArea.style.display = 'none';
        hideVariableHud(); // 结局时隐藏变量 HUD
        setQuitVisible(false); // 结局页自带「重玩/返回主菜单」

        // 停止 BGM（但保留 SFX 可能的效果音）
        if (typeof AUDIO !== 'undefined' && AUDIO.stopBGM) { AUDIO.stopBGM(); }

        const ending = STORY.getEnding(endingId) || { type: 'good', icon: '🌅' };
        const endType = endingTypeHint || ending.type || 'good';
        const title = resolveEndingText(titleKey);
        const desc = resolveEndingText(descKey);
        const typeText = I18N.t(`ending${endType.charAt(0).toUpperCase() + endType.slice(1)}`);

        // 记下本次结局的「原始入参」，供切语言时无副作用地重绘（见 repaintEnding）
        state._lastEnding = {
            id: endingId, titleKey: titleKey, descKey: descKey,
            stats: stats, icon: endingIcon, type: endType
        };
        setScreen('ending');

        // 记录结局
        SAVE.recordEnding(endingId, title);
        SAVE.updateStats({
            lastEnding: endingId,
            totalChoices: state.totalChoicesMade,
            charactersMet: state.charactersMet.size,
            endingsFound: SAVE.getEndingCount()
        });

        // 奖励世界之种（完成故事获得种子）
        let seedReward = 1;
        if (endType === 'perfect') seedReward = 3;
        else if (endType === 'good') seedReward = 2;
        
        // 检查该结局是否首次解锁（首次通关才奖励）
        const allEndings = SAVE.getUnlockedEndings();
        const isFirstClear = allEndings.filter(e => e.id === endingId).length <= 1;
        
        if (isFirstClear || endType === 'perfect') {
            const newSeeds = SAVE.addSeeds(seedReward);
            state.seedReward = seedReward; // 存储用于显示
        }

        // 限时线上考试：把这次的结局（＝成绩等级）上报给社区，管理员能在统计面板看到
        reportExamResult(endingId, endType, title, desc);

        // 先播放结束消息，再显示结局画面
        setTimeout(() => {
            dom.endingScreen.classList.add('active');
            // 结局图标：优先场景自带 endingIcon（蓝图结局节点配置），支持 emoji 或图片
            const iconVal = endingIcon || ending.icon || '🌟';
            const iconEl = document.querySelector('.ending-icon');
            if (typeof IMGDB !== 'undefined' && IMGDB.isImgRef(iconVal)) {
                iconEl.innerHTML = IMGDB.renderIconHTML(iconVal, 72, 9999);
            } else {
                iconEl.textContent = iconVal;
            }
            document.querySelector('.ending-title').textContent = title;
            document.querySelector('.ending-type').textContent = typeText;
            document.querySelector('.ending-description').textContent = desc;

            // 更新统计数据
            document.getElementById('stat-choices').textContent = state.totalChoicesMade;
            document.getElementById('stat-endings').textContent = SAVE.getEndingCount();

            // 显示种子奖励
            if (state.seedReward && state.seedReward > 0) {
                // 重复通关时先清掉上一次的奖励条，避免叠加（踩过）
                const old = document.querySelector('.ending-seedinfo');
                if (old) old.remove();
                const seedInfo = document.createElement('div');
                seedInfo.className = 'ending-seedinfo';
                seedInfo.style.cssText = 'margin-top:16px;padding:12px;background:rgba(250,204,21,0.1);border:1px solid rgba(250,204,21,0.3);border-radius:8px;text-align:center;';
                seedInfo.innerHTML = `<div style="font-size:0.85rem;color:var(--accent-yellow);">💠 ${I18N.t('seedGainMsg', { n: state.seedReward, total: SAVE.getSeeds() })}</div>`;
                document.querySelector('.ending-stats').after(seedInfo);
                updateSeedDisplay();
            }

            // 结局类型类
            dom.endingScreen.className = 'active';
            dom.endingScreen.classList.add(`ending-${endType}`);

            // 显示下一章按钮
            const nextBtn = document.getElementById('ending-next');
            const currentChapterIndex = STORY.chapters.findIndex(ch => ch.id === state.currentChapter);
            if (currentChapterIndex < STORY.chapters.length - 1) {
                nextBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'none';
            }
        }, 1000);
    }

    function replayChapter() {
        dom.endingScreen.classList.remove('active');
        const chapterId = state.currentChapter;
        resetState();
        state.currentChapter = chapterId;
        startChapter(chapterId);
    }

    function goToMainMenu() {
        dom.endingScreen.classList.remove('active');
        showMainMenu();
    }

    function nextChapter() {
        dom.endingScreen.classList.remove('active');
        const currentIndex = STORY.chapters.findIndex(ch => ch.id === state.currentChapter);
        const nextIndex = currentIndex + 1;
        if (nextIndex < STORY.chapters.length) {
            resetState();
            startChapter(STORY.chapters[nextIndex].id);
        }
    }

    // ==================== 打字指示器 ====================
    function showTyping(callback) {
        dom.typingIndicator.classList.add('visible');
        scrollToBottom();

        const delay = 600 + Math.random() * 400;
        setTimeout(() => {
            dom.typingIndicator.classList.remove('visible');
            if (state.aborted) return; // 玩家中途退出了：别再把消息塞回已清空的界面
            if (callback) setTimeout(callback, 200);
        }, delay);
    }

    // ==================== 限时线上考试（社区） ====================
    // 社区详情页点「开始考试」时由 COMMUNITY 调用：把考试信息塞进 state.exam，
    // 画面右上角出现倒计时；到达结局时自动把「结局等级」当作成绩上报。
    let _examTimer = null;

    function setExamContext(ctx) {
        state.exam = ctx || null;
        if (!ctx) { hideExamHud(); return; }
        if (!ctx.startAt) ctx.startAt = Date.now();
        showExamHud();
    }

    function getExamContext() { return state.exam || null; }

    function hideExamHud() {
        if (_examTimer) { clearInterval(_examTimer); _examTimer = null; }
        const el = document.getElementById('exam-hud');
        if (el) el.remove();
    }

    function showExamHud() {
        hideExamHud();
        const el = document.createElement('div');
        el.id = 'exam-hud';
        el.className = 'exam-hud';
        document.body.appendChild(el);
        _examTimer = setInterval(() => {
            const ex = state.exam;
            if (!ex) { hideExamHud(); return; }
            const deadline = ex.deadline || 0;
            const left = deadline ? Math.max(0, deadline - Date.now()) : 0;
            const mm = Math.floor(left / 60000);
            const ss = Math.floor((left % 60000) / 1000);
            const urgent = deadline && left <= 60000;
            el.innerHTML = `<span class="exam-hud-badge">🎓 ${escapeHtml(ex.title || I18N.t('examHudTitle', '限时考试'))}</span>
                <span class="exam-hud-time${urgent ? ' urgent' : ''}">⏱ ${mm}:${String(ss).padStart(2, '0')}</span>
                <button class="exam-hud-submit">${escapeHtml(I18N.t('examHudSubmit', '交卷'))}</button>`;
            const b = el.querySelector('.exam-hud-submit');
            if (b) b.addEventListener('click', () => finishExam(false));
            if (deadline && left <= 0) finishExam(true);
        }, 1000);
    }

    // 交卷：上报成绩 → 退出考试界面
    function finishExam(timedOut) {
        const ex = state.exam;
        if (!ex) return;
        state.exam = null;
        hideExamHud();
        const elapsedMs = Date.now() - (ex.startAt || Date.now());
        if (typeof COMMUNITY !== 'undefined' && COMMUNITY.submitExam) {
            try { COMMUNITY.submitExam(ex.storyId, { elapsedMs, timedOut: !!timedOut }); } catch (e) {}
        }
        if (timedOut) {
            addSystemMessage(I18N.t('examTimeout', '⏰ 时间到，已自动交卷'), null);
            setTimeout(() => { if (!state.aborted) showMainMenu(); }, 1600);
        }
    }

    // 到达结局 → 上报成绩（等级 = 结局类型 perfect/good/bad/hidden）
    function reportExamResult(endingId, endingType, title, desc) {
        const ex = state.exam;
        if (!ex) return;
        state.exam = null;
        hideExamHud();
        const elapsedMs = Date.now() - (ex.startAt || Date.now());
        if (typeof COMMUNITY !== 'undefined' && COMMUNITY.submitExam) {
            try {
                COMMUNITY.submitExam(ex.storyId, {
                    endingId, endingType, endingTitle: title, endingDesc: desc,
                    choices: state.totalChoicesMade, elapsedMs, timedOut: false
                });
            } catch (e) {}
        }
    }

    // ==================== UI 工具函数 ====================
    function clearMessages() {
        cancelTypeWrite(); // 正在逐字输出的那条不能继续往已清空的界面里写字
        dom.messages.innerHTML = '';
        resetFollow();     // 消息都没了，跟随状态和未读数一并归零
    }

    function clearChoices() {
        dom.choices.innerHTML = '';
    }

    // ==================== 滚动跟随 / 「滑到最底部」按钮 ====================
    // 玩家往上翻看前面内容时，新消息还在加载 → 原来的 scrollToBottom() 会把他强行拽回底部。
    // 现在：检测到手动上滑就脱离跟随（不再自动滚），改为显示一个「↓ 滑到最底部」按钮。
    const AT_BOTTOM_PX = 64;   // 距底部多少像素以内算「在看最新」
    let _followBottom = true;  // 是否自动跟随最新消息
    let _lastScrollTop = 0;
    let _unreadCount = 0;      // 脱离跟随后又来了几条新消息
    let _jumpBtn = null;
    let _scrollFollowBound = false;
    let _relocalizing = false;     // 切语言重绘中：此时 scrollTop 的变化是程序的，不是玩家滑的

    function getDistFromBottom() {
        const el = dom.chatContainer;
        if (!el) return 0;
        return Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop);
    }

    function scrollToBottom(force) {
        if (!dom.chatContainer) return;
        if (force) {
            _followBottom = true;
            _unreadCount = 0;
        } else if (!_followBottom) {
            return; // 玩家正在看历史，不抢滚动
        }
        const el = dom.chatContainer;
        el.style.scrollBehavior = '';   // 恢复 CSS 的平滑滚动（可能被上滑打断时改成了 auto）
        // 立即滚动一次，延迟再滚动一次确保渲染完成
        el.scrollTop = el.scrollHeight;
        setTimeout(() => {
            if (!_followBottom) return;
            el.scrollTop = el.scrollHeight;
        }, 100);
        updateJumpBtn();
    }

    function positionJumpBtn(btn) {
        const ca = document.getElementById('choice-area');
        let h = 0;
        if (ca && ca.style.display !== 'none' && ca.offsetParent !== null) h = ca.offsetHeight || 0;
        btn.style.bottom = (h + 16) + 'px';
    }

    function paintJumpBtn() {
        const btn = _jumpBtn;
        if (!btn) return;
        const label = _unreadCount > 0
            ? I18N.t('jumpToBottomNew', { n: _unreadCount })
            : I18N.t('jumpToBottom');
        if (btn.textContent !== label) btn.textContent = label;
        positionJumpBtn(btn);
    }

    function showJumpBtn(show) {
        if (!show) {
            if (_jumpBtn) _jumpBtn.classList.remove('visible');
            return;
        }
        const btn = ensureJumpBtn();
        paintJumpBtn();
        btn.classList.add('visible');
    }

    function ensureJumpBtn() {
        if (_jumpBtn && _jumpBtn.isConnected) return _jumpBtn;
        let btn = document.getElementById('jump-bottom-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'jump-bottom-btn';
            btn.type = 'button';
            btn.className = 'jump-bottom-btn';
            document.body.appendChild(btn);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                jumpToBottom();
            });
        }
        _jumpBtn = btn;
        return btn;
    }

    function updateJumpBtn() {
        // 只有剧情界面才有消息流，其他界面一律不显示
        if (_screen !== 'story') { showJumpBtn(false); return; }
        showJumpBtn(!_followBottom && getDistFromBottom() > AT_BOTTOM_PX);
    }

    // 点按钮 / 开新故事 / 切章节：恢复跟随并回到底部
    function jumpToBottom() {
        resetFollow();
        scrollToBottom(true);
    }

    function resetFollow() {
        _followBottom = true;
        _unreadCount = 0;
        _lastScrollTop = dom.chatContainer ? dom.chatContainer.scrollTop : 0;
        showJumpBtn(false);
    }

    function bindScrollFollow() {
        if (_scrollFollowBound) return;
        _scrollFollowBound = true;
        const el = dom.chatContainer;
        if (!el) return;
        el.addEventListener('scroll', () => {
            const top = el.scrollTop;
            // 重绘/回放中内容被整体替换，scrollTop 会跟着被夹小 —— 这不是玩家在滑，别误判
            if (_relocalizing || _replayingHistory) { _lastScrollTop = top; return; }
            // 视口往回走 = 玩家在上翻看历史 → 脱离跟随；同时打断还在进行的平滑滚动，
            // 否则「程序往下滚 / 玩家往上滑」会互相打架，页面抖个不停
            if (top < _lastScrollTop - 2) {
                _followBottom = false;
                el.style.scrollBehavior = 'auto';
                el.scrollTop = top;
            }
            _lastScrollTop = top;
            if (getDistFromBottom() <= AT_BOTTOM_PX) {
                if (!_followBottom) { _followBottom = true; _unreadCount = 0; }
            }
            updateJumpBtn();
        }, { passive: true });
    }

    function getTimeString() {
        const now = new Date();
        return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== 音量控制 ====================
    function bindVolumeControls() {
        const bgmSlider = document.getElementById('bgm-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');
        const muteCheck = document.getElementById('mute-checkbox');

        if (bgmSlider) {
            bgmSlider.addEventListener('input', () => {
                if (typeof AUDIO !== 'undefined' && AUDIO.setBgmVolume) {
                    AUDIO.setBgmVolume(parseInt(bgmSlider.value) / 100);
                }
                updateVolumeLabels();
            });
        }
        if (sfxSlider) {
            sfxSlider.addEventListener('input', () => {
                if (typeof AUDIO !== 'undefined' && AUDIO.setSfxVolume) {
                    AUDIO.setSfxVolume(parseInt(sfxSlider.value) / 100);
                }
                updateVolumeLabels();
            });
        }
        if (muteCheck) {
            muteCheck.addEventListener('change', () => {
                if (typeof AUDIO !== 'undefined' && AUDIO.setMuted) {
                    AUDIO.setMuted(muteCheck.checked);
                }
            });
        }
    }

    function updateVolumeLabels() {
        const bgmSlider = document.getElementById('bgm-volume-slider');
        const sfxSlider = document.getElementById('sfx-volume-slider');
        const bgmValue = document.getElementById('bgm-volume-value');
        const sfxValue = document.getElementById('sfx-volume-value');
        if (bgmValue && bgmSlider) bgmValue.textContent = bgmSlider.value + '%';
        if (sfxValue && sfxSlider) sfxValue.textContent = sfxSlider.value + '%';
    }

    function updateVolumeSettingsLabels() {
        const bgmLabel = document.getElementById('bgm-volume-label');
        const sfxLabel = document.getElementById('sfx-volume-label');
        const muteLabel = document.getElementById('mute-label');
        const musicSettingsLabel = document.getElementById('music-settings-label');
        if (bgmLabel) bgmLabel.textContent = I18N.t('musicBgmVolume');
        if (sfxLabel) sfxLabel.textContent = I18N.t('musicSfxVolume');
        if (muteLabel) muteLabel.textContent = I18N.t('musicMute');
        if (musicSettingsLabel) musicSettingsLabel.textContent = I18N.t('settingsAudio');
        updateVolumeLabels();
    }

    // ==================== 存档 ====================
    function autoSave() {
        SAVE.save(getSaveState(), true);
    }

    function saveGame() {
        const success = SAVE.save(getSaveState(), false);
        if (success) {
            showSaveNotification(I18N.t('saveSuccess'));
        }
    }

    function getSaveState() {
        return {
            currentChapter: state.currentChapter,
            currentSceneId: state.currentSceneId,
            flags: { ...state.flags },
            messageHistory: state.messageHistory,
            playedMessages: Array.from(state.playedMessages),
            currentMessageIndex: state.currentMessageIndex
        };
    }

    function renderHistory(history) {
        cancelTypeWrite();
        clearMessages();
        _replayingHistory = true;      // 重放期间禁止再记历史
        try {
            history.forEach(item => {
            if (item.type === 'narrator') {
                const text = STORY.getText(item.text);
                addNarratorMessage(text, null, true); // 存档回放：一次性显示，不逐字
            } else if (item.type === 'character') {
                // 优先用历史中保存的 charName，避免用户自定义角色被查不到而显示 "玩家"
                const charInfo = item.charName
                    ? { name: item.charName, color: item.charColor, avatar: item.charAvatar }
                    : STORY.getCharacter(item.speaker);
                if (charInfo) {
                    const text = STORY.getText(item.text);
                    addCharacterMessage(item.speaker, text, charInfo, null, true);
                }
            } else if (item.type === 'player') {
                const text = STORY.getText(item.text);
                addPlayerMessage(text, null);
            } else if (item.type === 'system') {
                const text = STORY.getText(item.text);
                addSystemMessage(text, null);
            } else if (item.type === 'chapter_card') {
                // 存档恢复：章节卡以系统消息形式回放（正式播放时是全屏横幅）
                const num = item.num || 1;
                addSystemMessage('▣ ' + I18N.t('chapter', { n: num }) + (STORY.getText(item.title) ? ' · ' + STORY.getText(item.title) : ''), null);
            } else if (item.type === 'illustration') {
                addIllustrationMessage({ icon: item.icon, caption: item.caption, size: item.size }, null, true);
            }
            });
        } finally {
            _replayingHistory = false;
        }
    }

    function showSaveNotification(text) {
        const div = document.createElement('div');
        div.className = 'message system visible';
        div.innerHTML = `<div class="system-text">✓ ${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
        dom.messages.appendChild(div);
        scrollToBottom();
        setTimeout(() => div.remove(), 2000);
    }

    function startAutoSave() {
        if (state.autoSaveTimer) clearInterval(state.autoSaveTimer);
        state.autoSaveTimer = setInterval(() => {
            if (state.isPlaying) {
                autoSave();
            }
        }, 60000); // 每分钟自动存档
    }

    // ==================== 设置面板 ====================
    // 打字机模式按钮：设置面板里切「关闭 / 快 / 标准 / 慢」
    function paintTypeModeUI() {
        const cur = getTypeMode();
        // 档位按钮的短标签也走 i18n（typeMode* 那个带「打字效果：」前缀，给 toast 用）
        const SHORT = { off: 'typeSpeedOff', fast: 'typeSpeedFast', normal: 'typeSpeedNormal', slow: 'typeSpeedSlow' };
        document.querySelectorAll('.type-mode-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === cur);
            const key = SHORT[b.dataset.mode];
            if (key) b.textContent = I18N.t(key);
        });
    }
    function bindTypeModeOptions() {
        document.querySelectorAll('.type-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTypeMode(btn.dataset.mode);
                toastTypeMode();
            });
        });
    }
    function toastTypeMode() {
        const m = getTypeMode();
        const names = { off: 'typeModeOff', fast: 'typeModeFast', normal: 'typeModeNormal', slow: 'typeModeSlow' };
        const el = document.createElement('div');
        el.className = 'type-mode-toast';
        el.textContent = '⌨️ ' + I18N.t(names[m] || 'typeModeNormal');
        document.body.appendChild(el);
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 1400);
    }

    function showSettings() {
        dom.settingsOverlay.classList.add('active');
        // 面板里的静态文案（标题/语言行/打字档位名/关闭按钮/音量标签）随语言走
        try { I18N.applyStatic && I18N.applyStatic(dom.settingsOverlay); } catch (e) { console.warn('[GAME] applyStatic', e); }
        // 高亮当前语言
        const currentLang = I18N.getLanguage();
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
        // 刷新音量滑块状态
        if (typeof AUDIO !== 'undefined') {
            const bgmSlider = document.getElementById('bgm-volume-slider');
            const sfxSlider = document.getElementById('sfx-volume-slider');
            const muteCheck = document.getElementById('mute-checkbox');
            if (bgmSlider) bgmSlider.value = Math.round(AUDIO.getBgmVolume() * 100);
            if (sfxSlider) sfxSlider.value = Math.round(AUDIO.getSfxVolume() * 100);
            if (muteCheck) muteCheck.checked = AUDIO.isMuted();
        }
        paintTypeModeUI();
        updateVolumeSettingsLabels();
    }

    function hideSettings() {
        dom.settingsOverlay.classList.remove('active');
    }

    // ==================== 剧情中途切语言 ====================
    // 把已经显示在屏幕上的消息按新语言重画一遍。
    //
    // 为什么能重画：state.messageHistory 存的是消息的**原始三语对象**（msg.text），
    // 不是渲染后的字符串，所以按新语言重新取值即可拿到译文。
    //
    // 三条约束（都是实测踩出来的）：
    //  ① 先把正在打字的那条补全（finishTypeWrite），否则重画会丢它的进度
    //  ② 重画用 instant（不逐字），并且**不重播音效**（msg.sound 在 renderMessage 里播，
    //     这里只重建 DOM，不走 renderMessage）
    //  ③ 记住滚动位置 —— 重画会把内容整体替换掉，不还原的话玩家会被弹回顶部
    function relocalizeStoryMessages() {
        const hist = state.messageHistory || [];
        if (!hist.length) return;
        // ① 正在打字的那条先补全（否则它的光标节点会在重画后变成孤儿）
        finishTypeWrite();
        // ③ 记住「离底部多远」，重画后还原（贴着底部就继续贴底）
        //    ⚠️ 必须是 内容高 - 可视高 - scrollTop 才是真正的「离底部距离」；
        //    以前写成 内容高 - scrollTop（多算了一个可视高），还原位置会偏出去一屏，
        //    只是被 CSS 的 scroll-behavior:smooth 掩盖成「慢慢滚过去」，看起来像没变。
        const scroller = dom.chatContainer;
        const prevGap = scroller ? Math.max(0, scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop) : 0;
        // ② 只重建 DOM，不走 renderMessage（避免重播音效 / 重复写历史 / 触发 varEffect）
        _relocalizing = true;   // 重绘期间不让滚动监听把「内容被清空导致 scrollTop 变小」误判成玩家上滑
        clearMessages();
        _replayingHistory = true;      // 同 renderHistory：重放期间禁止再记历史
        try {
            hist.forEach(item => {
            if (item.type === 'narrator') {
                addNarratorMessage(interpolateText(STORY.getText(item.text)), null, true);
            } else if (item.type === 'character') {
                const charInfo = item.charName
                    ? { name: item.charName, color: item.charColor, avatar: item.charAvatar }
                    : STORY.getCharacter(item.speaker);
                if (charInfo) addCharacterMessage(item.speaker, interpolateText(STORY.getText(item.text)), charInfo, null, true);
            } else if (item.type === 'player') {
                addPlayerMessage(interpolateText(STORY.getText(item.text)), null, true);
            } else if (item.type === 'system') {
                addSystemMessage(interpolateText(STORY.getText(item.text)), null, true);
            } else if (item.type === 'chapter_card') {
                const num = item.num || 1;
                addSystemMessage('▣ ' + I18N.t('chapter', { n: num }) + (STORY.getText(item.title) ? ' · ' + STORY.getText(item.title) : ''), null, true);
            } else if (item.type === 'illustration') {
                addIllustrationMessage({ icon: item.icon, caption: item.caption, size: item.size }, null, true);
            }
            });
        } finally {
            _replayingHistory = false;
        }
        // 还原滚动位置：离底部多远就还是多远（原来贴底 → 现在也贴底）
        if (scroller) {
            const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
            scroller.scrollTop = Math.max(0, Math.min(maxTop, maxTop - prevGap));
        }
        _relocalizing = false;
        // 重绘后玩家仍在历史区 → 保持「不跟随」状态，按钮继续提示
        _followBottom = getDistFromBottom() <= AT_BOTTOM_PX;
        _lastScrollTop = scroller ? scroller.scrollTop : 0;
        updateJumpBtn();
        _relocalizing = false;
    }

    // ==================== 语言切换 ====================
    // 记录当前正在显示的是哪个界面 —— 切语言时按它决定重绘哪一块。
    // 之前只看「有没有章节」，结果主菜单/故事列表/结局/设计器/社区切了语言都不动。
    let _screen = 'boot';   // boot | menu | select | story | ending | designer | community
    function setScreen(v) {
        _screen = v || 'boot';
        // 离开剧情界面收起「滑到最底部」按钮；进剧情界面重置跟随（上局残留的「不跟随」不能带进来）
        if (_screen === 'story') resetFollow();
        else showJumpBtn(false);
    }

    // 各模块的静态文案全是 I18N.t() 求值一次存下来的（模板表、面板 DOM），
    // 切语言必须让它们自己重绘；这里统一编排，顺序 = 用户视觉上的重要性。
    function onLanguageChanged(e) {
        const lang = (e && e.detail && e.detail.lang) || I18N.getLanguage();

        // ① 静态标记元素（index.html 的 data-i18n）—— I18N.setLanguage 里已刷过，
        //    这里再刷一次是幂等的兜底（防止有代码直接改 currentLang 的情况）
        try { I18N.applyStatic && I18N.applyStatic(); } catch (err) { console.warn('[GAME] applyStatic', err); }

        // ② 顶栏标题（游戏内显示故事名，主菜单/列表显示游戏名）
        const titleEl = document.querySelector('.game-title');
        if (titleEl) {
            const card = state.currentStoryCard ? STORY.getStoryCard(state.currentStoryCard) : null;
            titleEl.textContent = card ? STORY.cardTitle(card) : I18N.t('gameTitle');
        }

        // ③ 打字档位按钮的短标签（无副作用、幂等，任何时候都该刷 ——
        //    否则玩家切完语言再打开设置面板，会先看到旧语言的一瞬）
        paintTypeModeUI();
        // 音量标签同理（它读的是滑块当前值，刷新不改变玩家设置）
        updateVolumeSettingsLabels();
        // 「滑到最底部」按钮的文案（含未读数）
        paintJumpBtn();

        // ④ 按当前界面重绘
        try {
            // 设计器开着 → 先重绘它（它是全屏 overlay，盖着别的）
            if (_screen === 'designer' && typeof DESIGNER !== 'undefined' && DESIGNER.relocalize) {
                DESIGNER.relocalize();
                return;
            }
            if (_screen === 'community' && typeof COMMUNITY !== 'undefined' && COMMUNITY.relocalize) {
                if (COMMUNITY.relocalize()) return;   // 社区确实在显示才接管
            }
            switch (_screen) {
                case 'menu':
                    showMainMenu();
                    break;
                case 'select':
                    showStorySelect();
                    break;
                case 'ending':
                    // 结局画面是 DOM 上的直出文本；用无副作用的 repaintEnding 重画
                    // （不能直接调 showEnding —— 它会重复记录结局/发种子/上报考试成绩）
                    if (!repaintEnding()) {
                        if (state._lastEnding) {
                            const le = state._lastEnding;
                            showEnding(le.id, le.titleKey, le.descKey, le.stats, le.icon, le.type);
                        }
                    }
                    break;
                case 'story':
                    // 剧情中途切语言：已显示出来的消息要跟着换语言，否则会出现
                    // 「界面是英文、但刚读过的对话还是中文」的割裂感（用户报）。
                    // 播完的消息从 state.messageHistory 重画（它存的是原始三语对象，
                    // 会按新语言重新取值）；正在打字的这条先补全再重画。
                    relocalizeStoryMessages();
                    // 章节横幅正显示时也换文字（横幅正显示时）
                    if (dom.chapterBanner && dom.chapterBanner.classList.contains('active')) {
                        // ⚠️ 不能调 showChapterBanner —— 它会重新 add('active') 并重播章节 BGM
                        const ch = STORY.getChapter(state.currentChapter);
                        if (ch) {
                            let n = 1;
                            const card = state.currentStoryCard ? STORY.getStoryCard(state.currentStoryCard) : null;
                            if (card && card.chapters) {
                                const idx = card.chapters.indexOf(ch.id);
                                if (idx >= 0) n = idx + 1;
                            }
                            if (dom.bannerChapter) dom.bannerChapter.textContent = I18N.t('chapter', { n: n });
                            if (dom.bannerTitle) dom.bannerTitle.textContent = resolveEndingText(ch.titleKey);
                            if (dom.bannerSub) dom.bannerSub.textContent = resolveEndingText(ch.subtitleKey);
                        }
                    }
                    break;
                default:
                    showMainMenu();
            }
        } catch (err) {
            console.warn('[GAME] 语言切换重绘失败', err);
        }

        // ⑤ 语言按钮高亮 + 文档语言
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
        document.documentElement.lang = lang;
        // 浏览器标签页标题也跟着换（游戏名是 i18n 的，副标题固定英文）
        document.title = I18N.t('gameTitle') + ' - Unintended Reply';
    }

    // ==================== 公共 API ====================
    return {
        init,
        startNewGame,
        continueGame,
        showMainMenu,
        showStorySelect,
        replayChapter,
        goToMainMenu,
        nextChapter,
        showSettings,
        hideSettings,
        saveGame,
        startCustomStory,
        quitStory,
        confirmQuitStory,
        setQuitVisible,
        setExamContext,
        getExamContext,
        setTypeMode,
        getTypeMode,
        finishTypeWrite,
        setScreen,          // 供 DESIGNER / COMMUNITY 标记「我现在占着屏幕」（切语言时按它重绘）
        currentScreen: () => _screen,
        // 滚动跟随（测试 / 调试用）
        jumpToBottom,
        resetFollow,
        isFollowingBottom: () => _followBottom,
        getUnreadCount: () => _unreadCount,
        distFromBottom: () => getDistFromBottom()
    };
})();

// 确保全局可访问（onclick等需要）
window.GAME = GAME;

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    GAME.init();
});
