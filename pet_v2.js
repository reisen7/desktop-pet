const { ipcRenderer } = require('electron');

// --- 配置常量 ---
const MOOD_CONFIG = {
    happy: {
        name: 'happy',
        image: 'assets/stand.jpg',
        speeches: [
            '源小舞，今天心情超好呢！',
            '哈哈，和小舞在一起好开心！',
            '小舞，和你在一起真快乐~',
            '小舞，笑一个！😊',
            '有小舞陪伴，生活真美好呀！',
            '源小舞是最棒的！'
        ],
        animations: ['bounce', 'spin', 'jump'],
        probability: 0.3,
        message: '小舞，现在心情超好的！'
    },
    cute: {
        name: 'cute',
        image: 'assets/attack.jpg',
        speeches: [
            '小舞，嘿嘿，看我厉害吗？',
            '给源小舞展示一下我的活力！',
            '小舞 (*^▽^*)',
            '源小舞觉得我帅吗？',
            '出击！去保护小舞！',
            '小舞小舞，看这里！'
        ],
        animations: ['wiggle', 'pulse', 'bounce'],
        probability: 0.25,
        message: '嘿嘿，源小舞，充满活力模式~'
    },
    sleepy: {
        name: 'sleepy',
        image: 'assets/sleep-tired.jpg',
        speeches: [
            '小舞，好困呀...( ˘ω˘ )',
            '源小舞，要不要一起休息一下？',
            '小舞工作累了吧？',
            '和小舞一起 zzZ...打个小盹~',
            '源小舞记得劳逸结合哦',
            '小舞，陪我睡个午觉吧~'
        ],
        animations: ['float', 'pulse'],
        probability: 0.2,
        message: '小舞，好困呀，想休息一下...'
    },
    shy: {
        name: 'shy',
        image: 'assets/dont-torch-me.jpg',
        speeches: [
            '源小舞，不要这样嘛...',
            '小舞，我错了啦~',
            '小舞 (//▽//)',
            '不要点我啦...',
            '源小舞在看什么呀？',
            '小舞，你让我好害羞呀~'
        ],
        animations: ['shake', 'wiggle'],
        probability: 0.25,
        message: '源小舞，不要嘛...'
    }
};

const SPECIAL_SPEECHES = [
    '源小舞，你好呀！',
    '小舞，今天过得怎么样？',
    '小舞，要不要休息一下？',
    '我在这里陪着源小舞呢~',
    '小舞，加油！你是最棒的！',
    '源小舞记得多喝水哦~',
    '小舞工作辛苦了！',
    '源小舞要保持好心情呀！',
    '我们一起努力吧，小舞！',
    '源小舞今天也很可爱呢！',
    '小舞，等等我~',
    '我要去那边看看，小舞！',
    '和小舞一起跑步真开心！',
    '源小舞，一起来运动吧！',
    '小舞，我换个新造型怎么样？',
    '陪源小舞工作真快乐~',
    '小舞累了就休息一下吧',
    '小舞，今天天气真不错呢',
    '源小舞在忙什么呀？',
    '我想和小舞聊天~',
    '源小舞是我最喜欢的人！',
    '小舞，你笑起来真好看！',
    '和源小舞在一起的每一天都很开心',
    '小舞，我会一直陪着你的！'
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
        this.currentMode = 'static'; // 'static' | 'running'
        this.speechTimeout = null;
        this.runningTimeout = null;
        this.isDialogMode = false;
        this.currentDialog = null;

        // 数据持久化
        this.affection = this.loadData('pet_affection', 50);
        this.interactions = this.loadData('pet_interactions', 0);
        this.achievements = this.loadData('pet_achievements', [], true);
        this.level = this.calculateLevel();

        this.init();
    }

    init() {
        this.bindEvents();
        this.startRandomBehavior();
        this.updateAffectionDisplay();
        
        // 初始状态
        this.setMood('happy');
        
        // 初始问候
        setTimeout(() => this.showSpeech('源小舞，我来啦！'), 1000);
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
        
        // 注意：背景图片现在由 CSS 类控制，不需要这里设置 style.backgroundImage
        // 除非我们想强制覆盖，但为了雪碧图动画，最好用 CSS 控制
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
        let cumulative = 0;
        const keys = Object.keys(MOOD_CONFIG);

        for (const key of keys) {
            cumulative += MOOD_CONFIG[key].probability;
            if (rand <= cumulative) {
                if (key !== this.currentMoodKey) {
                    this.setMood(key);
                    this.playAnimation('pulse'); // 心情变化时跳动一下
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
            }, 300);
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
                ipcRenderer.send('drag-pet', dx, dy);
                this.dragStart = { x: e.screenX, y: e.screenY };
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    // --- 模式切换 ---
    
    setStaticMode() {
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
            this.showSpeech('小舞，我要开始奔跑啦！');
        } else {
            this.setStaticMode();
            this.showSpeech('源小舞，休息一下~');
        }
    }

    // --- 随机行为循环 ---
    
    startRandomBehavior() {
        const loop = () => {
            const delay = Math.random() * 20000 + 15000; // 15-35秒
            setTimeout(() => {
                if (!this.isDialogMode && !this.isDragging && this.currentMode === 'static') {
                    this.performRandomBehavior();
                }
                loop();
            }, delay);
        };
        loop();
    }

    performRandomBehavior() {
        const actions = [
            () => this.showSpeech(),
            () => this.playMoodAnimation(),
            () => this.moveRandomly(),
            () => this.randomMoodChange(),
            // 10% 概率切换跑动
            () => { if(Math.random() < 0.1) this.toggleMode(); }
        ];
        const action = actions[Math.floor(Math.random() * actions.length)];
        action();
    }

    moveRandomly() {
        if (this.isMoving || this.currentMode === 'running') return;
        
        const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize;
        const x = Math.floor(Math.random() * (width - 250));
        const y = Math.floor(Math.random() * (height - 250));
        
        this.isMoving = true;
        this.pet.classList.add('moving'); // 添加移动中的样式（如果有）
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
        return ['', '陌生', '熟人', '朋友', '亲密', '恋人'][this.level] || '陌生';
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
        this.affectionDisplay.className = `affection-display level-${this.level}`;
    }

    checkAchievements() {
        const checks = [
            { id: 'max_affection', check: () => this.affection >= 100, title: '💕 完美恋人', desc: '好感度达到满值！' },
            { id: 'interaction_100', check: () => this.interactions >= 100, title: '🎯 互动达人', desc: '互动次数达到100次！' },
            { id: 'lover_level', check: () => this.level >= 5, title: '❤️ 恋人关系', desc: '关系等级达到恋人！' }
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
        // 播放音效（可选）
        setTimeout(() => div.remove(), 4000);
    }

    // 简单的对话生成逻辑
    getDialogByLevel() {
        const greetings = [
            "小舞，今天也要开开心心的哦！",
            "看到小舞，我就充满了活力！",
            "不知道小舞现在在想什么呢？",
            "天气真好，和小舞的心情一样好吗？"
        ];
        
        return {
            text: greetings[Math.floor(Math.random() * greetings.length)],
            choices: [
                { text: "嗯嗯，我很开心！", affection: 2 },
                { text: "有你陪着真好", affection: 3 }
            ]
        };
    }

    startDialog() {
        const dialog = this.getDialogByLevel();
        
        this.currentDialog = dialog;
        this.isDialogMode = true;
        this.dialogText.textContent = dialog.text;
        this.dialogChoices.innerHTML = '';
        this.galgameDialog.style.display = 'block';
        
        // 简单的入场动画
        this.galgameDialog.style.opacity = '0';
        this.galgameDialog.style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.galgameDialog.style.transition = 'all 0.3s ease';
            this.galgameDialog.style.opacity = '1';
            this.galgameDialog.style.transform = 'translateY(0)';
        }, 10);

        dialog.choices.forEach((c, i) => {
            const btn = document.createElement('div');
            btn.className = 'choice-button';
            btn.textContent = c.text;
            btn.onclick = () => {
                this.addAffection(c.affection);
                this.addInteraction();
                this.dialogText.textContent = "源小舞，我也最喜欢你了！(好感度UP!)";
                this.dialogChoices.innerHTML = '';
                setTimeout(() => this.closeDialog(), 1500);
            };
            this.dialogChoices.appendChild(btn);
        });
    }

    closeDialog() {
        this.galgameDialog.style.opacity = '0';
        this.galgameDialog.style.transform = 'translateY(20px)';
        setTimeout(() => {
            this.galgameDialog.style.display = 'none';
            this.isDialogMode = false;
        }, 300);
    }

    showStatus() {
        const text = `
            <div style="text-align:center; margin-bottom:10px; color:#ff8e8e; font-weight:bold;">📊 状态面板</div>
            源小舞的专属数据：<br>
            ------------------------<br>
            💗 好感度: ${this.affection}/100 (${this.getLevelName()})<br>
            🤝 互动次数: ${this.interactions}<br>
            🏆 成就数量: ${this.achievements.length}
        `;
        
        this.dialogText.innerHTML = text;
        this.dialogChoices.innerHTML = '<div class="choice-button" onclick="pet.closeDialog()">知道啦</div>';
        this.galgameDialog.style.display = 'block';
        this.isDialogMode = true;
    }

    showContextMenu(x, y) {
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
window.hidePet = () => ipcRenderer.send('hide-pet');
window.quitApp = () => ipcRenderer.send('quit-app');
