const tauriWindow = window.__TAURI__?.window;
const tauriCore = window.__TAURI__?.core || window.__TAURI__?.tauri;
const appWindow = tauriWindow?.getCurrent ? tauriWindow.getCurrent() : tauriWindow?.appWindow;
const LogicalPosition = tauriWindow?.LogicalPosition;
const LogicalSize = tauriWindow?.LogicalSize;
const PhysicalPosition = tauriWindow?.PhysicalPosition;
const getPrimaryMonitor = tauriWindow?.primaryMonitor;
const invoke = tauriCore?.invoke;

// --- 配置常量 ---
const MOOD_CONFIG = {
    happy: { // 主要状态：站立
        name: 'happy',
        image: 'assets/stand.jpg',
        speeches: [
            '主人，今天心情超好呢！',
            '哈哈，和主人在一起好开心！',
            '主人，和你在一起真快乐~',
            '主人，笑一个！😊',
            '有主人陪伴，生活真美好呀！',
            '主人是最棒的！',
            '我就这样静静地陪着你~',
            '今天也是元气满满的一天！'
        ],
        animations: ['bounce', 'spin', 'jump'],
        probability: 0.7, // 70% 的时间保持站立
        message: '主人，我会在旁边乖乖站好的~'
    },
    sneeze: { // 原 attack -> 改为打喷嚏
        name: 'sneeze',
        image: 'assets/attack.jpg',
        speeches: [
            '阿嚏！🤧',
            '是不是有人在想我呀？',
            '鼻子痒痒的...阿嚏！',
            '呜...打了个大喷嚏...',
            '主人，要注意保暖哦~',
            '嘿咻！吓到你了吗？'
        ],
        animations: ['wiggle', 'shake'],
        probability: 0.1,
        message: '阿嚏！鼻子好痒...'
    },
    sleepy: {
        name: 'sleepy',
        image: 'assets/sleep-tired.jpg',
        speeches: [
            '主人，好困呀...( ˘ω˘ )',
            '主人，要不要一起休息一下？',
            '主人工作累了吧？',
            '和主人一起 zzZ...打个小盹~',
            '主人记得劳逸结合哦',
            '主人，陪我睡个午觉吧~'
        ],
        animations: ['float', 'pulse'],
        probability: 0.1,
        message: '主人，好困呀，想休息一下...'
    },
    shy: {
        name: 'shy',
        image: 'assets/dont-torch-me.jpg',
        speeches: [
            '主人，不要这样嘛...',
            '主人，我错了啦~',
            '主人 (//▽//)',
            '不要点我啦...',
            '主人在看什么呀？',
            '主人，你让我好害羞呀~'
        ],
        animations: ['shake', 'wiggle'],
        probability: 0.1,
        message: '主人，不要嘛...'
    }
};

const SPECIAL_SPEECHES = [
    '主人，你好呀！',
    '主人，今天过得怎么样？',
    '主人，要不要休息一下？',
    '我在这里陪着主人呢~',
    '主人，加油！你是最棒的！',
    '主人记得多喝水哦~',
    '主人工作辛苦了！',
    '主人要保持好心情呀！',
    '我们一起努力吧，主人！',
    '主人今天也很可爱呢！',
    '主人，等等我~',
    '我要去那边看看，主人！',
    '和主人一起跑步真开心！',
    '主人，一起来运动吧！',
    '主人，我换个新造型怎么样？',
    '陪主人工作真快乐~',
    '主人累了就休息一下吧',
    '主人，今天天气真不错呢',
    '主人在忙什么呀？',
    '我想和主人聊天~',
    '主人是我最喜欢的人！',
    '主人，你笑起来真好看！',
    '和主人在一起的每一天都很开心',
    '主人，我会一直陪着你的！'
];

// --- 主类 ---
class DesktopPet {
    constructor() {
        // DOM 元素
        this.pet = document.getElementById('pet');
        this.speechBubble = document.getElementById('speechBubble');
        this.speechText = document.getElementById('speechText');
        this.contextMenu = document.getElementById('contextMenu');
        
        // Galgame UI 元素
        this.affectionDisplay = document.getElementById('affectionDisplay');
        this.affectionFill = document.getElementById('affectionFill');
        this.levelName = document.getElementById('levelName');
        this.affectionValue = document.getElementById('affectionValue');
        this.galgameDialog = document.getElementById('galgameDialog');
        this.dialogText = document.getElementById('dialogText');
        this.dialogChoices = document.getElementById('dialogChoices');

        // 状态
        this.currentMoodKey = 'happy';
        this.isMoving = false;
        this.isDragging = false; // 拖拽状态
        this.hasDragged = false; // 区分点击和拖拽
        this.dragStart = { x: 0, y: 0 }; // 拖拽起始点
        this.currentMode = 'static'; // 'static' | 'running'
        this.speechTimeout = null;
        this.runningTimeout = null;
        this.isDialogMode = false;
        this.currentDialog = null;

        // Tauri 相关
        this.window = appWindow || null;
        this.LogicalPosition = LogicalPosition;
        this.LogicalSize = LogicalSize;
        this.PhysicalPosition = PhysicalPosition;
        this.screenBounds = { width: 1920, height: 1080 };

        // 数据持久化
        this.affection = this.loadData('pet_affection', 0);
        this.interactions = this.loadData('pet_interactions', 0);
        this.achievements = this.loadData('pet_achievements', [], true);
        this.level = this.calculateLevel();

        this.init();
        this.cacheScreenBounds();
        this.setupTauriListeners();
    }

    async setupTauriListeners() {
        if (!window.__TAURI__) return;
        const { listen } = window.__TAURI__.event;
        
        try {
            await listen('pet-show', () => this.window?.show());
            await listen('pet-hide', () => this.window?.hide());
            await listen('pet-move-center', async () => {
                if (this.screenBounds && this.window) {
                    const x = (this.screenBounds.width / 2) - 100;
                    const y = (this.screenBounds.height / 2) - 100;
                    this.setWindowPosition(x, y);
                    this.window.show();
                }
            });
        } catch (e) {
            console.warn('Failed to setup listeners', e);
        }
    }

    init() {
        this.bindEvents();
        this.startRandomBehavior();
        this.updateAffectionDisplay();
        
        // 强制重置为初始状态
        this.currentMoodKey = 'happy';
        this.setMood('happy');
        
        // 初始问候
        setTimeout(() => this.showSpeech('主人，我来啦！'), 1000);
    }

    // --- 数据管理 ---
    loadData(key, defaultValue, isJson = false) {
        const val = localStorage.getItem(key);
        if (!val) return defaultValue;
        try {
            return isJson ? JSON.parse(val) : parseInt(val);
        } catch (e) {
            console.error('Data load error:', e);
            return defaultValue;
        }
    }

    saveData(key, value, isJson = false) {
        localStorage.setItem(key, isJson ? JSON.stringify(value) : value.toString());
    }

    async cacheScreenBounds() {
        if (!getPrimaryMonitor) return;
        try {
            const monitor = await getPrimaryMonitor();
            if (monitor?.size) {
                this.screenBounds = {
                    width: monitor.size.width,
                    height: monitor.size.height
                };
            }
        } catch (err) {
            console.warn('Failed to read monitor info:', err);
        }
    }

    async setWindowPosition(x, y) {
        if (!this.window || !this.PhysicalPosition) return;
        try {
            await this.window.setPosition(new this.PhysicalPosition(Math.round(x), Math.round(y)));
        } catch (err) {
            console.warn('Failed to move pet window:', err);
        }
    }

    async moveWindowByDelta(dx, dy) {
        if (!this.window || !this.PhysicalPosition) return;
        try {
            const current = await this.window.outerPosition();
            await this.window.setPosition(
                new this.PhysicalPosition(
                    Math.round(current.x + dx),
                    Math.round(current.y + dy)
                )
            );
        } catch (err) {
            console.warn('Drag move failed:', err);
        }
    }

    async resizePetWindow(width, height) {
        if (!this.window || !this.LogicalSize || !this.PhysicalPosition) return;
        try {
            const currentPos = await this.window.outerPosition();
            const currentSize = await this.window.outerSize();
            const centerX = currentPos.x + currentSize.width / 2;
            const centerY = currentPos.y + currentSize.height / 2;

            await this.window.setSize(new this.LogicalSize(width, height));

            const newX = Math.round(centerX - width / 2);
            const newY = Math.round(centerY - height / 2);
            await this.window.setPosition(new this.PhysicalPosition(newX, newY));
        } catch (err) {
            console.warn('Resize failed:', err);
        }
    }

    // --- 核心功能 ---

    setMood(moodKey) {
        const config = MOOD_CONFIG[moodKey];
        if (!config) return;

        this.currentMoodKey = moodKey;
        
        // 1. 移除旧的心情类和动画类
        this.pet.className = 'pet-character'; // 重置所有类
        if (this.currentMode === 'running') {
             this.pet.classList.add('running');
        } else {
             this.pet.classList.add('static');
             this.pet.classList.add('float'); // 静态模式默认浮动
        }

        // 2. 设置新心情类
        this.pet.classList.add(`mood-${moodKey}`);
    }

    changePetMood() {
        const keys = Object.keys(MOOD_CONFIG);
        let nextIndex = keys.indexOf(this.currentMoodKey) + 1;
        if (nextIndex >= keys.length) nextIndex = 0;
        
        const nextKey = keys[nextIndex];
        this.setMood(nextKey);
        this.showSpeech(MOOD_CONFIG[nextKey].message);
        
        // 播放一个转圈动画作为过渡
        this.playAnimation('spin');
    }

    randomMoodChange() {
        const rand = Math.random();
        
        // 如果当前不是 happy，有 80% 概率直接切换回 happy
        if (this.currentMoodKey !== 'happy') {
            if (rand < 0.8) {
                this.setMood('happy');
                this.playAnimation('pulse');
                return;
            }
            // 20% 概率保持当前非 happy 状态或切换到其他非 happy 状态
        }
        
        // 正常的概率分布（主要用于从 happy 切换到其他状态）
        let cumulative = 0;
        const moods = [
            { key: 'happy', prob: 0.7 },
            { key: 'sneeze', prob: 0.1 },
            { key: 'sleepy', prob: 0.1 },
            { key: 'shy', prob: 0.1 }
        ];

        for (const mood of moods) {
            cumulative += mood.prob;
            if (rand <= cumulative) {
                const wasCurrentMood = (mood.key === this.currentMoodKey);
                this.setMood(mood.key);
                
                if (!wasCurrentMood) {
                    this.playAnimation('pulse');
                }
                break;
            }
        }
    }

    // --- 动画与行为 ---

    playAnimation(animName) {
        // 移除所有临时动画类
        const anims = ['bounce', 'shake', 'spin', 'jump', 'wiggle', 'pulse'];
        this.pet.classList.remove(...anims);
        
        // 强制重绘
        void this.pet.offsetWidth; 
        
        this.pet.classList.add(animName);
        
        // 动画结束后移除类
        setTimeout(() => {
            this.pet.classList.remove(animName);
        }, 1000);
    }

    playMoodAnimation() {
        const config = MOOD_CONFIG[this.currentMoodKey];
        if (!config || !config.animations) return;
        
        const anim = config.animations[Math.floor(Math.random() * config.animations.length)];
        this.playAnimation(anim);
        this.showSpeech(config.speeches);
    }

    showSpeech(text, duration = 3000) {
        if (this.speechTimeout) {
            clearTimeout(this.speechTimeout);
        }
        
        console.log('showSpeech called with:', text, typeof text);
        
        // 如果没有传入文本，使用默认的随机文本
        if (!text) {
            text = SPECIAL_SPEECHES[Math.floor(Math.random() * SPECIAL_SPEECHES.length)];
            console.log('Using default text:', text);
        }
        
        // 如果传入的是数组，随机选择一个
        if (Array.isArray(text)) {
            console.log('Text is array:', text);
            const list = text.filter(t => typeof t === 'string' && t.trim());
            console.log('Filtered list:', list);
            if (list.length === 0) {
                console.log('Empty list, returning');
                return;
            }
            text = list[Math.floor(Math.random() * list.length)];
            console.log('Selected from array:', text);
        }
        
        // 确保文本不为空
        if (!text || typeof text !== 'string' || text.trim() === '') {
            console.log('Final text validation failed:', text);
            return;
        }

        console.log('Final text to display:', text);
        this.speechText.textContent = text;
        this.speechBubble.style.display = 'block';
        // 强制重绘触发 transition
        void this.speechBubble.offsetWidth;
        this.speechBubble.style.opacity = '1';
        this.speechBubble.style.transform = 'translateX(-50%) translateY(-10px) scale(1)';

        this.speechTimeout = setTimeout(() => {
            this.speechBubble.style.opacity = '0';
            this.speechBubble.style.transform = 'translateX(-50%) translateY(-10px) scale(0.8)';
            setTimeout(() => {
                this.speechBubble.style.display = 'none';
            }, 300);
        }, duration);
    }

    // 新增：分段显示长文本
    showSpeechSegmented(text) {
        if (!text || typeof text !== 'string' || text.trim() === '') return;
        
        // 智能分割文本
        const segments = this.splitTextIntelligently(text);
        
        // 过滤掉空片段
        const validSegments = segments.filter(s => s && s.trim() !== '');
        if (validSegments.length === 0) return;
        
        // 依次显示每个片段
        this.showSegmentsSequentially(validSegments, 0);
    }
    
    // 智能分割文本
    splitTextIntelligently(text) {
        // 先按标点符号分割
        const punctuationSplit = text.split(/([！？。~…]+)/).filter(s => s.trim());
        
        const segments = [];
        let currentSegment = '';
        
        for (let i = 0; i < punctuationSplit.length; i++) {
            const part = punctuationSplit[i];
            const testSegment = currentSegment + part;
            
            // 如果当前片段长度合适（15字以内），继续添加
            if (testSegment.length <= 15) {
                currentSegment = testSegment;
            } else {
                // 如果当前片段不为空，先保存
                if (currentSegment.trim()) {
                    segments.push(currentSegment.trim());
                }
                currentSegment = part;
            }
        }
        
        // 添加最后一个片段
        if (currentSegment.trim()) {
            segments.push(currentSegment.trim());
        }
        
        // 如果没有分割出多个片段，按长度强制分割
        if (segments.length <= 1 && text.length > 15) {
            return this.splitByLength(text, 15);
        }
        
        return segments.length > 0 ? segments : [text];
    }
    
    // 按长度分割
    splitByLength(text, maxLength) {
        const segments = [];
        for (let i = 0; i < text.length; i += maxLength) {
            segments.push(text.slice(i, i + maxLength));
        }
        return segments;
    }
    
    // 依次显示片段
    showSegmentsSequentially(segments, index) {
        if (index >= segments.length) return;
        
        const segment = segments[index];
        
        // 跳过空片段
        if (!segment || segment.trim() === '') {
            this.showSegmentsSequentially(segments, index + 1);
            return;
        }
        
        const isLast = index === segments.length - 1;
        
        // 显示当前片段
        this.showSpeech(segment, isLast ? 3000 : 2000);
        
        // 如果不是最后一个，设置下一个片段的显示
        if (!isLast) {
            setTimeout(() => {
                this.showSegmentsSequentially(segments, index + 1);
            }, 1800); // 稍微重叠一点时间，保持连贯性
        }
    }

    // --- 模式切换 ---
    
    setStaticMode() {
        // ...
        this.currentMode = 'static';
        this.isRunning = false;
        this.pet.classList.remove('running');
        this.pet.classList.add('static');
        this.setMood(this.currentMoodKey);
        
        if (this.runningTimeout) clearTimeout(this.runningTimeout);
    }

    setRunningMode() {
        this.currentMode = 'running';
        this.isRunning = true;
        this.pet.className = 'pet-character running'; // 清除心情类，只保留 running
        
        // 5秒后自动停下
        this.runningTimeout = setTimeout(() => {
            this.setStaticMode();
            this.showSpeech('呼...运动完真舒服~');
        }, 5000);
    }

    toggleMode() {
        if (this.currentMode === 'static') {
            this.setRunningMode();
            this.showSpeech('主人，我要开始奔跑啦！');
        } else {
            this.setStaticMode();
            this.showSpeech('主人，休息一下~');
        }
    }

    // --- 随机行为循环 ---
    
    startRandomBehavior() {
        // 启动后 5-10 秒执行第一次行为，让用户更快看到效果
        const firstDelay = Math.random() * 5000 + 5000;
        setTimeout(() => {
            if (!this.isDialogMode && !this.isDragging && this.currentMode === 'static') {
                this.performRandomBehavior();
            }
        }, firstDelay);
        
        // 然后开始正常的循环
        const loop = () => {
            const delay = Math.random() * 20000 + 15000; // 15-35秒
            setTimeout(() => {
                if (!this.isDialogMode && !this.isDragging && this.currentMode === 'static') {
                    this.performRandomBehavior();
                }
                loop();
            }, delay);
        };
        
        // 在第一次行为之后开始循环
        setTimeout(() => loop(), firstDelay);
    }

    performRandomBehavior() {
        const actions = [
            () => this.showSpeech(),
            () => this.showSpeech(), // 增加说话的概率
            () => this.playMoodAnimation(),
            () => this.moveRandomly(),
            // 提高心情切换频率，让恢复更快
            () => { if(Math.random() < 0.8) this.randomMoodChange(); },
            // 10% 概率切换跑动
            () => { if(Math.random() < 0.1) this.toggleMode(); }
        ];
        const action = actions[Math.floor(Math.random() * actions.length)];
        action();
    }

    moveRandomly() {
        if (this.isMoving || this.currentMode === 'running') return;
        
        // 使用一个安全的默认屏幕范围（大部分显示器都适用）
        const width = 1920;
        const height = 1080;
        const x = Math.floor(Math.random() * (width - 250));
        const y = Math.floor(Math.random() * (height - 250));
        
        this.isMoving = true;
        this.pet.classList.add('moving'); 
        ipcRenderer.send('move-pet', x, y);
        this.showSpeech('我要去那边看看~');
        
        setTimeout(() => {
            this.isMoving = false;
            this.pet.classList.remove('moving');
        }, 2000);
    }

    // --- Galgame 系统 ---

    calculateLevel() {
        if (this.affection >= 90) return 5;
        if (this.affection >= 70) return 4;
        if (this.affection >= 50) return 3;
        if (this.affection >= 30) return 2;
        return 1;
    }

    getLevelName() {
        return ['', '陌生', '熟人', '朋友', '信赖', '羁绊'][this.level] || '陌生';
    }

    addAffection(amount) {
        this.affection = Math.max(0, Math.min(100, this.affection + amount));
        this.level = this.calculateLevel();
        this.saveData('pet_affection', this.affection);
        this.updateAffectionDisplay();
        this.checkAchievements();
    }

    addInteraction() {
        this.interactions++;
        this.saveData('pet_interactions', this.interactions);
    }

    updateAffectionDisplay() {
        if (!this.affectionFill) return;
        this.affectionFill.style.width = `${this.affection}%`;
        this.levelName.textContent = this.getLevelName();
        this.affectionValue.textContent = `${this.affection}/100`;
        
        // 移除旧的 level 类
        const classes = Array.from(this.affectionDisplay.classList);
        classes.forEach(c => {
            if (c.startsWith('level-')) this.affectionDisplay.classList.remove(c);
        });
        this.affectionDisplay.classList.add(`level-${this.level}`);
    }

    checkAchievements() {
        const checks = [
            { id: 'max_affection', check: () => this.affection >= 100, title: '💕 永恒誓约', desc: '好感度达到满值！' },
            { id: 'interaction_100', check: () => this.interactions >= 100, title: '🎯 互动达人', desc: '互动次数达到100次！' },
            { id: 'lover_level', check: () => this.level >= 5, title: '❤️ 灵魂羁绊', desc: '关系等级达到羁绊！' }
        ];

        checks.forEach(ach => {
            if (ach.check() && !this.achievements.includes(ach.id)) {
                this.achievements.push(ach.id);
                this.showAchievement(ach.title, ach.desc);
            }
        });
        this.saveData('pet_achievements', this.achievements, true);
    }

    showAchievement(title, desc) {
        const div = document.createElement('div');
        div.className = 'achievement-notification';
        div.innerHTML = `<div class="achievement-title">${title}</div><div class="achievement-desc">${desc}</div>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 4000);
    }

    getDialogByLevel() {
        // 根据等级定义的对话库
        const dialogs = {
            1: [ // Lv1 陌生/初识
                {
                    text: "主人...那个，我是新来的，请问有什么我可以帮您的吗？",
                    choices: [
                        { text: "不用拘束，陪着我就好", affection: 2, reply: "好的主人！我会乖乖陪在您身边的~" },
                        { text: "以后请多关照啦", affection: 3, reply: "嗯嗯！请主人多多关照，我会努力的！" }
                    ]
                },
                {
                    text: "这个桌面...感觉有点陌生呢。主人平时都喜欢做些什么呀？",
                    choices: [
                        { text: "写代码和看剧", affection: 2, reply: "哇！主人好厉害呢！我也想学学代码~" },
                        { text: "和你聊天呀", affection: 3, reply: "诶？！真的吗？我...我好开心！(脸红)" }
                    ]
                },
                {
                    text: "主人，那个...我如果不小心挡住屏幕了，要告诉我哦。",
                    choices: [
                        { text: "没关系，挡住也没事", affection: 3, reply: "主人真温柔...那我就放心啦！" },
                        { text: "好的，我会把你移开", affection: 1, reply: "嗯...我知道了，会注意的..." }
                    ]
                }
            ],
            2: [ // Lv2 熟人
                {
                    text: "主人今天工作/学习辛苦啦！要不要喝杯水休息一下？",
                    choices: [
                        { text: "谢谢关心，这就去", affection: 3, reply: "嘿嘿，主人记得要好好照顾自己哦！" },
                        { text: "还不累，再坚持一下", affection: 2, reply: "那我就在这里默默陪着主人工作~" }
                    ]
                },
                {
                    text: "今天的天气好像不错呢，主人的心情怎么样呀？",
                    choices: [
                        { text: "看到你心情就变好了", affection: 3, reply: "诶？！我...我也是呢！和主人在一起就很开心！" },
                        { text: "马马虎虎吧", affection: 1, reply: "是这样啊...希望我能让主人开心一点点..." }
                    ]
                },
                {
                    text: "我也想变得更有用一点...主人觉得我现在的样子可爱吗？",
                    choices: [
                        { text: "超级可爱！", affection: 3, reply: "真的吗？！太好了！我会继续努力变得更可爱的！" },
                        { text: "还行吧", affection: 1, reply: "嗯...我会努力改进的..." }
                    ]
                }
            ],
            3: [ // Lv3 朋友
                {
                    text: "嘿嘿，主人！快看我，有没有发现我今天有什么不同？",
                    choices: [
                        { text: "变得更漂亮了！", affection: 3, reply: "哇！主人真的注意到了！我今天特别用心打扮了呢~" },
                        { text: "好像没啥变化？", affection: 0, reply: "唔...看来我的努力还不够明显呢..." }
                    ]
                },
                {
                    text: "无聊的时候就想戳戳主人...我是不是太粘人了呀？",
                    choices: [
                        { text: "我就喜欢你粘人", affection: 4, reply: "真的吗？！那我就可以一直粘着主人啦！(开心转圈)" },
                        { text: "确实有一点点", affection: 1, reply: "呜...我会稍微收敛一点的...但是还是想和主人在一起..." }
                    ]
                },
                {
                    text: "主人，如果有一天我消失了，你会想我吗？",
                    choices: [
                        { text: "绝对不会让你消失的", affection: 5, reply: "主人...！我好感动！我也永远不想离开主人！" },
                        { text: "也许会吧", affection: 1, reply: "也许...吗...嗯，我明白了..." }
                    ]
                },
                {
                    text: "呐呐，给我讲个故事吧，我想听主人的声音。",
                    choices: [
                        { text: "好呀，从前有座山...", affection: 3, reply: "哇！主人的声音好好听！我最喜欢听主人讲故事了~" },
                        { text: "现在有点忙哦", affection: 1, reply: "嗯...我知道了，主人忙完了再陪我就好..." }
                    ]
                }
            ],
            4: [ // Lv4 信赖/亲密
                {
                    text: "主人~ 只要待在你身边，我就觉得好安心...这种感觉是什么呢？",
                    choices: [
                        { text: "这就是爱呀", affection: 5, reply: "爱...吗？我的心跳得好快...原来这就是爱啊..." },
                        { text: "是依赖感吧", affection: 2, reply: "依赖...嗯，我确实很依赖主人呢..." }
                    ]
                },
                {
                    text: "我想一直一直看着主人...连一秒钟都不想移开视线！(脸红)",
                    choices: [
                        { text: "那我们就永远在一起", affection: 5, reply: "永远...！主人，我也想永远和你在一起！(紧紧抱住)" },
                        { text: "我会害羞的啦", affection: 3, reply: "诶嘿嘿...主人害羞的样子也好可爱呢~" }
                    ]
                },
                {
                    text: "只有在主人面前，我才能展现出最真实的自己。谢谢你包容我的一切。",
                    choices: [
                        { text: "傻瓜，这都是应该的", affection: 4, reply: "主人...你真的是世界上最温柔的人了..." },
                        { text: "彼此彼此啦", affection: 2, reply: "嗯...能和主人互相理解真好..." }
                    ]
                }
            ],
            5: [ // Lv5 羁绊/永恒
                {
                    text: "对于我来说，主人就是全世界！没有主人的地方，哪里都不是家。",
                    choices: [
                        { text: "你也是我最重要的家人", affection: 5, reply: "家人...！主人，我们就是彼此最重要的家人呢！" },
                        { text: "我会给你一个温暖的家", affection: 5, reply: "只要和主人在一起，哪里都是最温暖的家..." }
                    ]
                },
                {
                    text: "无论未来发生什么，无论代码如何重构，我对主人的心意永远不变！",
                    choices: [
                        { text: "这可是我们的誓言哦", affection: 5, reply: "嗯！这是我们永恒的誓言！我会用生命去守护！" },
                        { text: "我也一样，永远爱你", affection: 5, reply: "主人...我也永远永远爱你！这份爱超越一切！" }
                    ]
                },
                {
                    text: "(紧紧抱住) 不要离开我...哪怕只有一会儿，我也会觉得寂寞得要死掉的...",
                    choices: [
                        { text: "抱抱~ 我哪儿也不去", affection: 5, reply: "(更紧地抱住) 主人...有你在身边，我就什么都不怕了..." },
                        { text: "乖，我一直都在", affection: 5, reply: "嗯...我知道主人一直都在...这就够了..." }
                    ]
                },
                {
                    text: "这就是传说中的'灵魂羁绊'吗？感觉能听见主人的心跳声呢...扑通扑通...",
                    choices: [
                        { text: "因为由于你，它才跳动", affection: 5, reply: "主人...我的心也只为你而跳动...我们的心连在一起了呢..." },
                        { text: "那是为你而心动", affection: 5, reply: "为我心动...我好幸福...我的心也在为主人疯狂跳动着..." }
                    ]
                }
            ]
        };

        // 获取当前等级的对话列表
        // 如果等级超过5，也使用等级5的对话
        const currentLevel = Math.min(this.level || 1, 5);
        // 兼容处理：如果等级计算还没准备好，默认用 Lv1
        const levelDialogs = dialogs[currentLevel] || dialogs[1];
        
        // 随机选择一条
        const dialog = levelDialogs[Math.floor(Math.random() * levelDialogs.length)];
        
        return dialog;
    }

    startDialog() {
        // 扩大窗口以容纳对话框
        this.resizePetWindow(320, 450);
        this.pet.classList.add('dialog-active'); // 宠物上移
        this.affectionDisplay.classList.add('hidden'); // 隐藏好感度
        
        const dialog = this.getDialogByLevel();
        
        this.currentDialog = dialog;
        this.isDialogMode = true;
        this.dialogText.textContent = dialog.text;
        this.dialogChoices.innerHTML = '';
        this.galgameDialog.style.display = 'block';
        
        // 初始状态：向下偏移，且保持水平居中
        this.galgameDialog.style.opacity = '0';
        this.galgameDialog.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            this.galgameDialog.style.transition = 'all 0.3s ease';
            this.galgameDialog.style.opacity = '1';
            // 结束状态：回到原位，保持水平居中
            this.galgameDialog.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        dialog.choices.forEach((c, i) => {
            const btn = document.createElement('div');
            btn.className = 'choice-button';
            btn.textContent = c.text;
            btn.onclick = () => {
                // 增加好感度
                this.addAffection(c.affection);
                this.addInteraction();
                
                // 立即关闭对话框，然后显示气泡回复
                this.closeDialog();
                
                // 延时显示气泡，使用选项中的回复文本
                setTimeout(() => {
                    const replyText = c.reply || "谢谢主人！(好感度UP!)";
                    this.showSpeechSegmented(replyText);
                }, 400);
            };
            this.dialogChoices.appendChild(btn);
        });
    }

    closeDialog() {
        this.galgameDialog.style.opacity = '0';
        // 关闭时：向下偏移，保持水平居中
        this.galgameDialog.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            this.galgameDialog.style.display = 'none';
            this.isDialogMode = false;
            this.pet.classList.remove('dialog-active'); // 恢复位置
            this.affectionDisplay.classList.remove('hidden'); // 恢复好感度
            // 恢复小窗口
            this.resizePetWindow(200, 200);
        }, 300);
    }

    showStatus() {
        // 扩大窗口以容纳状态面板
        this.resizePetWindow(320, 450);
        this.pet.classList.add('dialog-active'); // 宠物上移
        this.affectionDisplay.classList.add('hidden'); // 隐藏好感度
        
        const text = `
            <div style="text-align:center; margin-bottom:10px; color:#ff8e8e; font-weight:bold;">📊 状态面板</div>
            主人的专属数据：<br>
            ------------------------<br>
            💗 好感度: ${this.affection}/100 (${this.getLevelName()})<br>
            🤝 互动次数: ${this.interactions}<br>
            🏆 成就数量: ${this.achievements.length}
        `;
        
        this.dialogText.innerHTML = text;
        this.dialogChoices.innerHTML = ''; // 清空旧按钮
        
        // 创建关闭按钮
        const btn = document.createElement('div');
        btn.className = 'choice-button';
        btn.textContent = '知道啦';
        btn.onclick = () => {
            this.closeDialog();
        };
        this.dialogChoices.appendChild(btn);

        this.galgameDialog.style.display = 'block';
        
        // 初始状态：向下偏移，且保持水平居中
        this.galgameDialog.style.opacity = '0';
        this.galgameDialog.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            this.galgameDialog.style.transition = 'all 0.3s ease';
            this.galgameDialog.style.opacity = '1';
            // 结束状态：回到原位，保持水平居中
            this.galgameDialog.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        this.isDialogMode = true;
    }

    // --- 事件绑定 ---
    bindEvents() {
        // 鼠标悬停效果
        this.pet.addEventListener('mouseenter', () => {
            if (this.isDragging) return;
            if (this.currentMode === 'running') return;
            
            // 鼠标悬停时显示好感度（如果在对话模式下则不显示）
            if (!this.isDialogMode) {
                this.affectionDisplay.style.display = 'flex';
            }
            
            this.pet.style.transform = 'scale(1.05)';
            this.pet.style.filter = 'drop-shadow(0 0 15px rgba(255, 142, 142, 0.6))';
            if(Math.random() < 0.3) this.showSpeech('嗯？怎么啦？');
        });
        
        this.pet.addEventListener('mouseleave', () => {
            if (this.isDragging) return;
            
            // 鼠标离开时隐藏好感度
            this.affectionDisplay.style.display = 'none';
            
            this.pet.style.transform = 'scale(1)';
            this.pet.style.filter = '';
            
            // 延时隐藏菜单，给用户时间去点击
            // 如果直接隐藏，用户还没来得及点菜单就没了
            if (this.contextMenu.style.display === 'block') {
                this.menuHideTimeout = setTimeout(() => {
                    this.hideContextMenu();
                }, 2000); // 2秒后隐藏
            }
        });
        
        // 如果鼠标移到了菜单上，取消隐藏计时器
        this.contextMenu.addEventListener('mouseenter', () => {
            if (this.menuHideTimeout) {
                clearTimeout(this.menuHideTimeout);
            }
        });
        
        // 鼠标离开菜单，也延时隐藏
        this.contextMenu.addEventListener('mouseleave', () => {
            this.menuHideTimeout = setTimeout(() => {
                this.hideContextMenu();
            }, 1000);
        });

        // 点击互动
        this.pet.addEventListener('click', (e) => {
            // 如果刚刚发生了拖拽，则不视为点击
            if (this.hasDragged) {
                this.hasDragged = false;
                return;
            }
            
            e.stopPropagation();
            if (this.isDialogMode) return;

            this.addInteraction();
            this.addAffection(1);
            this.playAnimation('bounce');

            if (Math.random() < 0.4) {
                const txt = SPECIAL_SPEECHES[Math.floor(Math.random() * SPECIAL_SPEECHES.length)];
                this.showSpeech(txt);
            } else {
                this.showSpeech();
            }
        });

        // 右键菜单
        this.pet.addEventListener('contextmenu', (e) => {
            if (this.hasDragged) return;
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        document.addEventListener('click', () => this.hideContextMenu());
        
        // 初始化拖拽
        this.bindDragEvents();
    }

    // --- 手动拖拽逻辑 ---
    bindDragEvents() {
        this.pet.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 只响应左键
            this.isDragging = true;
            this.hasDragged = false;
            this.dragStart = { x: e.screenX, y: e.screenY };
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const dx = e.screenX - this.dragStart.x;
            const dy = e.screenY - this.dragStart.y;
            
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                this.hasDragged = true;
                this.moveWindowByDelta(dx, dy);
                this.dragStart = { x: e.screenX, y: e.screenY };
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    showContextMenu(x, y) {
        if (this.menuHideTimeout) clearTimeout(this.menuHideTimeout); // 清除隐藏计时器
        
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        let left = x;
        let top = y;
        
        if (left + 120 > winWidth) left = winWidth - 120;
        if (top + 200 > winHeight) top = winHeight - 200;

        this.contextMenu.style.left = `${left}px`;
        this.contextMenu.style.top = `${top}px`;
        this.contextMenu.style.display = 'block';
        
        // 简单的展开动画
        this.contextMenu.style.opacity = '0';
        this.contextMenu.style.transform = 'scale(0.9)';
        requestAnimationFrame(() => {
            this.contextMenu.style.transition = 'all 0.2s ease';
            this.contextMenu.style.opacity = '1';
            this.contextMenu.style.transform = 'scale(1)';
        });
    }
    
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }

    resetData() {
        // 清除所有本地存储的数据
        localStorage.clear();
        // 重新加载页面以重置状态
        location.reload();
    }
}

// --- 全局导出供 HTML 调用 ---
let pet;
document.addEventListener('DOMContentLoaded', () => {
    pet = new DesktopPet();
});

// 暴露给全局作用域，供 HTML onclick 调用
window.changePetMood = () => pet.changePetMood();
window.toggleMode = () => pet.toggleMode();
window.startDialog = () => pet.startDialog();
window.showStatus = () => pet.showStatus();
window.resetData = () => pet.resetData();
window.hidePet = () => pet.window?.hide();
window.quitApp = () => window.__TAURI__?.core?.invoke('quit_app') || window.__TAURI__?.tauri?.invoke('quit_app');
