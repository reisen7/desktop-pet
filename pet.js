const { ipcRenderer } = require('electron');

class DesktopPet {
    constructor() {
        this.pet = document.getElementById('pet');
        this.speechBubble = document.getElementById('speechBubble');
        this.speechText = document.getElementById('speechText');
        this.contextMenu = document.getElementById('contextMenu');
        
        // 宠物表情状态数组
        this.petMoods = [
            {
                name: 'happy',
                image: 'assets/happy-smile.jpg',
                speeches: [
                    '源小舞，今天心情超好呢！',
                    '哈哈，和小舞在一起好开心！',
                    '小舞，和你在一起真快乐~',
                    '小舞，笑一个！😊',
                    '有小舞陪伴，生活真美好呀！',
                    '源小舞是最棒的！'
                ],
                animations: ['bounce', 'spin', 'jump'],
                probability: 0.3
            },
            {
                name: 'cute',
                image: 'assets/cute-wink.jpg',
                speeches: [
                    '小舞，嘿嘿，我可爱吗？',
                    '给源小舞一个小眼神~',
                    '小舞 (*^▽^*)',
                    '源小舞觉得我萌吗？',
                    '偷偷对小舞眨眼睛~',
                    '小舞小舞，看这里！'
                ],
                animations: ['wiggle', 'pulse', 'bounce'],
                probability: 0.25
            },
            {
                name: 'sleepy',
                image: 'assets/sleepy-tired.jpg',
                speeches: [
                    '小舞，好困呀...( ˘ω˘ )',
                    '源小舞，要不要一起休息一下？',
                    '小舞工作累了吧？',
                    '和小舞一起 zzZ...打个小盹~',
                    '源小舞记得劳逸结合哦',
                    '小舞，陪我睡个午觉吧~'
                ],
                animations: ['float', 'pulse'],
                probability: 0.2
            },
            {
                name: 'shy',
                image: 'assets/shy-blush.jpg',
                speeches: [
                    '源小舞，有点害羞呢...',
                    '小舞，不要一直看着我啦~',
                    '小舞 (//▽//)',
                    '被小舞看着脸红红的...',
                    '源小舞在看什么呀？',
                    '小舞，你让我好害羞呀~'
                ],
                animations: ['shake', 'wiggle'],
                probability: 0.25
            }
        ];
        this.currentMoodIndex = 0;
        
        // 源小舞专属对话数组
        this.specialSpeeches = [
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
        
        // 状态变量
        this.isMoving = false;
        this.isDragging = false;
        this.moveInterval = null;
        this.speechTimeout = null;
        this.isRunning = false;
        this.runningTimeout = null;
        this.currentMode = 'static'; // 'static' 或 'running'
        
        // Galgame系统
        this.affection = this.loadAffection(); // 好感度 (0-100)
        this.level = this.calculateLevel();
        this.interactions = this.loadInteractions(); // 互动次数
        this.achievements = this.loadAchievements(); // 成就
        this.isDialogMode = false; // 是否在对话模式
        this.currentDialog = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.startRandomBehavior();
        this.addFloatAnimation();
        this.createGalgameUI();
        this.updateAffectionDisplay();
        
        // 设置初始心情类
        const initialMood = this.petMoods[this.currentMoodIndex];
        this.pet.classList.add(`mood-${initialMood.name}`);
    }
    
    // Galgame系统方法
    loadAffection() {
        return parseInt(localStorage.getItem('pet_affection') || '50');
    }
    
    saveAffection() {
        localStorage.setItem('pet_affection', this.affection.toString());
    }
    
    loadInteractions() {
        return parseInt(localStorage.getItem('pet_interactions') || '0');
    }
    
    saveInteractions() {
        localStorage.setItem('pet_interactions', this.interactions.toString());
    }
    
    loadAchievements() {
        const saved = localStorage.getItem('pet_achievements');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveAchievements() {
        localStorage.setItem('pet_achievements', JSON.stringify(this.achievements));
    }
    
    calculateLevel() {
        if (this.affection >= 90) return 5; // 恋人
        if (this.affection >= 70) return 4; // 亲密
        if (this.affection >= 50) return 3; // 朋友
        if (this.affection >= 30) return 2; // 熟人
        return 1; // 陌生
    }
    
    getLevelName() {
        const levels = ['', '陌生', '熟人', '朋友', '亲密', '恋人'];
        return levels[this.level];
    }
    
    addAffection(amount) {
        this.affection = Math.max(0, Math.min(100, this.affection + amount));
        this.level = this.calculateLevel();
        this.saveAffection();
        this.updateAffectionDisplay();
        this.checkAchievements();
    }
    
    addInteraction() {
        this.interactions++;
        this.saveInteractions();
    }
    
    createGalgameUI() {
        // UI元素已在HTML中创建，这里只需要获取引用
        this.affectionDisplay = document.getElementById('affectionDisplay');
        this.affectionFill = document.getElementById('affectionFill');
        this.levelName = document.getElementById('levelName');
        this.affectionValue = document.getElementById('affectionValue');
        this.galgameDialog = document.getElementById('galgameDialog');
        this.dialogText = document.getElementById('dialogText');
        this.dialogChoices = document.getElementById('dialogChoices');
    }
    
    updateAffectionDisplay() {
        if (!this.affectionFill) return;
        
        this.affectionFill.style.width = `${this.affection}%`;
        this.levelName.textContent = this.getLevelName();
        this.affectionValue.textContent = `${this.affection}/100`;
        
        // 更新等级颜色
        this.affectionDisplay.className = `affection-display level-${this.level}`;
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        if (this.affection >= 100 && !this.achievements.includes('max_affection')) {
            newAchievements.push('max_affection');
            this.showAchievement('💕 完美恋人', '好感度达到满值！');
        }
        
        if (this.interactions >= 100 && !this.achievements.includes('interaction_100')) {
            newAchievements.push('interaction_100');
            this.showAchievement('🎯 互动达人', '互动次数达到100次！');
        }
        
        if (this.level >= 5 && !this.achievements.includes('lover_level')) {
            newAchievements.push('lover_level');
            this.showAchievement('❤️ 恋人关系', '关系等级达到恋人！');
        }
        
        this.achievements.push(...newAchievements);
        this.saveAchievements();
    }
    
    showAchievement(title, description) {
        // 创建成就通知
        const achievement = document.createElement('div');
        achievement.className = 'achievement-notification';
        achievement.innerHTML = `
            <div class="achievement-title">${title}</div>
            <div class="achievement-desc">${description}</div>
        `;
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.remove();
        }, 3000);
    }
    
    // Galgame对话系统
    getDialogByLevel() {
        const dialogs = {
            1: [ // 陌生
                {
                    text: "源小舞...你好，我还不太了解你呢。",
                    choices: [
                        { text: "我想更了解你", affection: 2 },
                        { text: "慢慢来吧", affection: 1 }
                    ]
                }
            ],
            2: [ // 熟人
                {
                    text: "小舞，我们已经认识一段时间了呢~",
                    choices: [
                        { text: "是啊，时间过得真快", affection: 2 },
                        { text: "希望能更亲近一些", affection: 3 }
                    ]
                }
            ],
            3: [ // 朋友
                {
                    text: "源小舞，作为朋友，我很开心能陪伴你！",
                    choices: [
                        { text: "我也很开心", affection: 2 },
                        { text: "你是我最好的朋友", affection: 4 }
                    ]
                }
            ],
            4: [ // 亲密
                {
                    text: "小舞，我们的关系变得好亲密呢...我有点害羞~",
                    choices: [
                        { text: "我也有同样的感觉", affection: 3 },
                        { text: "你害羞的样子很可爱", affection: 5 }
                    ]
                }
            ],
            5: [ // 恋人
                {
                    text: "源小舞，我爱你...想要永远陪在你身边。",
                    choices: [
                        { text: "我也爱你", affection: 5 },
                        { text: "永远在一起吧", affection: 3 }
                    ]
                }
            ]
        };
        
        const levelDialogs = dialogs[this.level] || dialogs[3];
        return levelDialogs[Math.floor(Math.random() * levelDialogs.length)];
    }
    
    bindEvents() {
        // 点击事件
        this.pet.addEventListener('click', (e) => {
            e.stopPropagation();
            this.onPetClick();
        });
        
        // 右键菜单
        this.pet.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        // 双击事件
        this.pet.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.playRandomAnimation();
        });
        
        // 隐藏右键菜单
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // 鼠标悬停
        this.pet.addEventListener('mouseenter', () => {
            this.onMouseEnter();
        });
        
        this.pet.addEventListener('mouseleave', () => {
            this.onMouseLeave();
        });
    }
    
    onPetClick() {
        this.addInteraction();
        this.addAffection(1); // 每次点击增加1点好感度
        
        // 有时候说特殊的源小舞专属话语
        if (Math.random() < 0.4) {
            const specialText = this.specialSpeeches[Math.floor(Math.random() * this.specialSpeeches.length)];
            this.showSpeech(specialText);
        } else {
            this.showSpeech();
        }
        this.playAnimation('bounce');
        
        // 根据好感度等级有不同反应
        if (this.level >= 4 && Math.random() < 0.2) {
            setTimeout(() => {
                this.showSpeech('小舞，你的触摸让我好开心~');
                this.playAnimation('pulse');
            }, 2000);
        }
    }
    
    onMouseEnter() {
        this.pet.style.transform = 'scale(1.1)';
        if (Math.random() < 0.3) { // 30% 概率说话
            this.showSpeech();
        }
    }
    
    onMouseLeave() {
        this.pet.style.transform = 'scale(1)';
    }
    
    showSpeech(customText = null) {
        let text;
        if (customText) {
            text = customText;
        } else {
            // 根据当前心情选择对话
            const currentMood = this.petMoods[this.currentMoodIndex];
            const moodSpeeches = currentMood.speeches;
            text = moodSpeeches[Math.floor(Math.random() * moodSpeeches.length)];
        }
        
        this.speechText.textContent = text;
        this.speechBubble.style.display = 'block';
        
        // 清除之前的定时器
        if (this.speechTimeout) {
            clearTimeout(this.speechTimeout);
        }
        
        // 3秒后隐藏对话框
        this.speechTimeout = setTimeout(() => {
            this.speechBubble.style.display = 'none';
        }, 3000);
    }
    
    playAnimation(animationType) {
        this.pet.classList.remove('bounce', 'shake', 'spin', 'float', 'jump', 'wiggle', 'pulse');
        
        // 强制重绘
        this.pet.offsetHeight;
        
        this.pet.classList.add(animationType);
        
        const animationDuration = {
            'bounce': 600,
            'shake': 500,
            'spin': 1000,
            'jump': 800,
            'wiggle': 1000,
            'pulse': 1500,
            'float': 0
        };
        
        setTimeout(() => {
            this.pet.classList.remove(animationType);
            if (animationType !== 'float' && this.currentMode === 'static') {
                this.addFloatAnimation();
            }
        }, animationDuration[animationType] || 1000);
    }
    
    playRandomAnimation() {
        // 根据当前心情选择合适的动画
        const currentMood = this.petMoods[this.currentMoodIndex];
        const moodAnimations = currentMood.animations;
        const randomAnimation = moodAnimations[Math.floor(Math.random() * moodAnimations.length)];
        this.playAnimation(randomAnimation);
    }
    
    // 播放心情相关的动画
    playMoodAnimation() {
        this.playRandomAnimation();
        this.showSpeech();
    }
    
    addFloatAnimation() {
        this.pet.classList.add('float');
    }
    
    changePetMood() {
        this.currentMoodIndex = (this.currentMoodIndex + 1) % this.petMoods.length;
        const newMood = this.petMoods[this.currentMoodIndex];
        
        this.setStaticMode();
        this.pet.style.backgroundImage = `url('${newMood.image}')`;
        
        // 移除所有心情类，添加新的心情类
        this.pet.classList.remove('mood-happy', 'mood-cute', 'mood-sleepy', 'mood-shy');
        this.pet.classList.add(`mood-${newMood.name}`);
        
        // 根据新心情说话和做动画
        const moodMessages = {
            'happy': '小舞，现在心情超好的！',
            'cute': '嘿嘿，源小舞，现在是可爱模式~',
            'sleepy': '小舞，好困呀，想休息一下...',
            'shy': '源小舞，有点害羞呢...'
        };
        
        this.showSpeech(moodMessages[newMood.name]);
        this.playAnimation('spin');
        
        // 延迟播放心情动画
        setTimeout(() => {
            this.playMoodAnimation();
        }, 1500);
    }
    
    // 随机切换心情
    randomMoodChange() {
        // 根据概率随机选择心情
        const rand = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < this.petMoods.length; i++) {
            cumulativeProbability += this.petMoods[i].probability;
            if (rand <= cumulativeProbability) {
                if (i !== this.currentMoodIndex) {
                    this.currentMoodIndex = i;
                    const newMood = this.petMoods[i];
                    this.pet.style.backgroundImage = `url('${newMood.image}')`;
                    
                    // 更新心情CSS类
                    this.pet.classList.remove('mood-happy', 'mood-cute', 'mood-sleepy', 'mood-shy');
                    this.pet.classList.add(`mood-${newMood.name}`);
                    
                    this.playMoodAnimation();
                }
                break;
            }
        }
    }
    
    // 切换到静态模式
    setStaticMode() {
        this.currentMode = 'static';
        this.isRunning = false;
        this.pet.classList.remove('running');
        this.pet.classList.add('static');
        if (this.runningTimeout) {
            clearTimeout(this.runningTimeout);
        }
    }
    
    // 切换到奔跑模式
    setRunningMode() {
        this.currentMode = 'running';
        this.isRunning = true;
        this.pet.classList.remove('static', 'float');
        this.pet.classList.add('running');
        
        // 奔跑一段时间后切换回静态模式
        this.runningTimeout = setTimeout(() => {
            this.setStaticMode();
            this.addFloatAnimation();
        }, 5000); // 奔跑5秒
    }
    
    // 切换模式
    toggleMode() {
        if (this.currentMode === 'static') {
            this.setRunningMode();
            this.showSpeech('小舞，我要开始奔跑啦！');
        } else {
            this.setStaticMode();
            this.showSpeech('源小舞，休息一下~');
            this.addFloatAnimation();
        }
    }
    
    startRandomBehavior() {
        // 每隔10-30秒执行随机行为
        const randomInterval = () => {
            const delay = Math.random() * 20000 + 10000; // 10-30秒
            setTimeout(() => {
                this.performRandomBehavior();
                randomInterval();
            }, delay);
        };
        
        randomInterval();
    }
    
    performRandomBehavior() {
        const behaviors = [
            () => this.showSpeech(),
            () => this.playMoodAnimation(),
            () => this.moveRandomly(),
            () => this.changePetMood(),
            () => this.randomMoodChange(),
            () => this.toggleMode(),
            () => this.setRunningMode()
        ];
        
        const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        randomBehavior();
    }
    
    moveRandomly() {
        if (this.isMoving) return;
        
        const { screen } = require('electron');
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        
        const newX = Math.floor(Math.random() * (width - 200));
        const newY = Math.floor(Math.random() * (height - 200));
        
        this.moveTo(newX, newY);
    }
    
    moveTo(x, y) {
        if (this.isMoving) return;
        
        this.isMoving = true;
        this.pet.classList.add('moving');
        
        // 发送移动命令到主进程
        ipcRenderer.send('move-pet', x, y);
        
        // 显示移动状态
        this.showSpeech('我要去那边看看~');
        
        setTimeout(() => {
            this.isMoving = false;
            this.pet.classList.remove('moving');
        }, 2000);
    }
    
    showContextMenu(x, y) {
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
    }
    
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }
    
    // 对话框控制
    startDialog() {
        const dialog = this.getDialogByLevel();
        this.currentDialog = dialog;
        this.isDialogMode = true;
        
        this.dialogText.textContent = dialog.text;
        this.dialogChoices.innerHTML = '';
        
        dialog.choices.forEach((choice, index) => {
            const button = document.createElement('div');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.onclick = () => this.selectChoice(index);
            this.dialogChoices.appendChild(button);
        });
        
        this.galgameDialog.style.display = 'block';
    }
    
    selectChoice(index) {
        const choice = this.currentDialog.choices[index];
        this.addAffection(choice.affection);
        this.addInteraction();
        
        // 显示反应
        const reactions = [
            "小舞，你的回答让我很开心~",
            "源小舞，我更喜欢你了！",
            "和小舞聊天真是太棒了！",
            "小舞，你真的很温柔呢~"
        ];
        
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        this.dialogText.textContent = reaction;
        this.dialogChoices.innerHTML = '';
        
        setTimeout(() => {
            this.closeDialog();
        }, 2000);
    }
    
    closeDialog() {
        this.galgameDialog.style.display = 'none';
        this.isDialogMode = false;
        this.currentDialog = null;
    }
    
    showStatus() {
        const statusDialog = {
            text: `源小舞的专属数据：
            好感度: ${this.affection}/100 (${this.getLevelName()})
            互动次数: ${this.interactions}
            成就数量: ${this.achievements.length}
            
            ${this.level >= 4 ? '💕 我们的关系真的很亲密呢~' : '🌟 继续互动来提升我们的关系吧！'}`,
            choices: [
                { text: "继续加油！", affection: 1 },
                { text: "你很棒！", affection: 2 }
            ]
        };
        
        this.currentDialog = statusDialog;
        this.isDialogMode = true;
        
        this.dialogText.innerHTML = statusDialog.text.replace(/\n/g, '<br>');
        this.dialogChoices.innerHTML = '';
        
        statusDialog.choices.forEach((choice, index) => {
            const button = document.createElement('div');
            button.className = 'choice-button';
            button.textContent = choice.text;
            button.onclick = () => this.selectChoice(index);
            this.dialogChoices.appendChild(button);
        });
        
        this.galgameDialog.style.display = 'block';
    }
}

// 全局函数供HTML调用
function changePetMood() {
    pet.changePetMood();
    pet.hideContextMenu();
}

function toggleMode() {
    pet.toggleMode();
    pet.hideContextMenu();
}

function startDialog() {
    pet.startDialog();
    pet.hideContextMenu();
}

function showStatus() {
    pet.showStatus();
    pet.hideContextMenu();
}

function closeDialog() {
    pet.closeDialog();
}

function toggleSpeech() {
    pet.showSpeech();
    pet.hideContextMenu();
}

function hidePet() {
    ipcRenderer.send('hide-pet');
    pet.hideContextMenu();
}

function quitApp() {
    ipcRenderer.send('quit-app');
}

// 初始化桌宠
let pet;
document.addEventListener('DOMContentLoaded', () => {
    pet = new DesktopPet();
});

// 防止拖拽时的默认行为
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});
