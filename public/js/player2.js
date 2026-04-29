class TutorialSystem {
    constructor() {
        this.stages = [
            {
                id: 1,
                title: "Приветствие",
                characterImage: "images/stage1L.png",
                dialogue: "Добро пожаловать в исследовательскую лабораторию, меня зовут Валерия!",
                mainOverlay: null,
                duration: 8000,
                showMainOverlay: false
            },
            {
                id: 2,
                title: "Выбор ингредиента",
                characterImage: "images/stage2pl2L.png",
                dialogue: "Твоя задача - собирать три вида компонентов: Азот, Биоматериал и Углерод. Выберай один из них слева!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Как собирать компоненты?</h3>
                        <p>1. Выбери компонент из трех вариантов в левой панели</p>
                        <p>2. Каждый компонент имеет свою мини-игру для сбора</p>
                        <p>3. Собранные компоненты появятся в правой панели</p>
                        <p>4. Отправляй компоненты лаборанту для создания реагентов</p>
                    </div>
                `,
                duration: 15000,
                showMainOverlay: true
            },
            {
                id: 3,
                title: "Мини-игры",
                characterImage: "images/stage2pl2L.png",
                dialogue: "Каждый компонент собирается по-своему!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Технологии сбора</h3>
                        <p>💧 Азот - нужно налить ровно заданное количество капель за время</p>
                        <p>🌿 Биоматериал - нужно срезать стебель в нужный момент</p>
                        <p>⚫ Углерод - нужно быстро кликать на появляющиеся атомы углерода</p>
                    </div>
                `,
                duration: 15000,
                showMainOverlay: true
            },
            {
                id: 4,
                title: "Атаки и защита",
                characterImage: "images/stage2pl2L.png",
                dialogue: "Другие команды могут атаковать вас, блокируя компоненты. Лаборант вашей команды может создавать защитные реагенты!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Система атак и защиты</h3>
                        <p>⚔️ Атаки могут блокировать конкретный компонент на 1 минуту</p>
                        <p>🛡️ Защитные реагенты, созданные Лаборантом, могут отражать атаки</p>
                        <p>💡 Следите за статусом защиты в левой панели</p>
                    </div>
                `,
                duration: 15000,
                showMainOverlay: true
            },
            {
                id: 5,
                title: "Прощание",
                characterImage: "images/stage1L.png",
                dialogue: "Теперь ты готов к проведению исследованийй! Следи за статистикой команды и помогай создавать как можно больше реагентов! Удачи!",
                mainOverlay: null,
                duration: 8000,
                showMainOverlay: false
            }
        ];
        
        this.currentStage = 0;
        this.progressInterval = null;
        
        this.overlay = document.getElementById('tutorialOverlay');
        this.mainOverlay = document.getElementById('tutorialMainOverlay');
        this.dialogue = document.getElementById('tutorialDialogue');
        this.dialogueText = document.getElementById('tutorialDialogueText');
        this.characterImage = document.getElementById('tutorialCharacterImage');
        this.characterContainer = document.getElementById('tutorialCharacterContainer');
        this.progressFill = document.getElementById('tutorialProgressFill');
        this.skipButton = document.getElementById('skipTutorialButton');
    }
    
    startTutorial() {
        this.overlay.classList.add('active');
        this.showStage(0);
        
        if (this.skipButton) {
            this.skipButton.addEventListener('click', () => this.skipTutorial());
        }
    }
    
    showStage(stageIndex) {
        if (stageIndex >= this.stages.length) {
            this.completeTutorial();
            return;
        }
        
        this.currentStage = stageIndex;
        const stage = this.stages[stageIndex];
        
        this.mainOverlay.classList.remove('active');
        this.dialogue.classList.remove('active');
        this.characterContainer.classList.remove('active');
        
        this.characterImage.src = stage.characterImage;
        this.dialogueText.textContent = stage.dialogue;
        
        if (stage.showMainOverlay && stage.mainOverlay) {
            this.mainOverlay.innerHTML = stage.mainOverlay;
            setTimeout(() => {
                this.mainOverlay.classList.add('active');
            }, 300);
        } else {
            this.mainOverlay.innerHTML = '';
        }
        
        setTimeout(() => {
            this.characterContainer.classList.add('active');
        }, 100);
        
        setTimeout(() => {
            this.dialogue.classList.add('active');
        }, 300);
        
        this.startProgressBar(stage.duration);
    }
    
    startProgressBar(duration) {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        let startTime = Date.now();
        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration * 100, 100);
            
            this.progressFill.style.width = `${progress}%`;
            
            if (elapsed >= duration) {
                clearInterval(this.progressInterval);
                this.nextStage();
            }
        }, 50);
    }
    
    nextStage() {
        this.showStage(this.currentStage + 1);
    }
    
    completeTutorial() {
        this.mainOverlay.classList.remove('active');
        this.dialogue.classList.remove('active');
        this.characterContainer.classList.remove('active');
        
        setTimeout(() => {
            this.overlay.classList.remove('active');
            if (typeof window.onTutorialComplete === 'function') {
                window.onTutorialComplete();
            }
        }, 1000);
    }
    
    skipTutorial() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.completeTutorial();
    }
}

class IngredientCollectionGame {
    constructor() {
        this.tutorial = new TutorialSystem();
        this.socket = null;
        this.playerId = 'player2_' + Math.random().toString(36).substr(2, 9);
        
        const pathSegments = window.location.pathname.split('/');
        this.roomId = pathSegments[pathSegments.length - 1] || 'room1';
        const urlParams = new URLSearchParams(window.location.search);
        this.playerName = urlParams.get('playerName') || 'Исследователь';
        
        this.ingredients = [];
        
        this.currentIngredient = {
            type: 'dew',
            name: 'Азот',
            isCollecting: false,
            collectionInterval: null,
            gameTimer: null,
            timeLeft: 0,
            success: false
        };
        
        this.currentGameParams = {
            dew: {
                targetDrops: 20,
                totalTime: 10
            },
            herbs: {
                growthSpeed: 0.3
            },
            soot: {
                targetsToCollect: 10,
                totalTime: 10
            }
        };
        
        this.minigames = {
            dew: {
                title: "Азот",
                description: "",
                setup: () => this.setupDewCollection(),
                currentDrops: 0,
                maxDrops: 30,
                targetDrops: 20,
                totalTime: 10
            },
            herbs: {
                title: "Биоматериал",
                description: "Срежьте стебель между красной и желтой линиями в нужный момент!",
                setup: () => this.setupHerbCollection(),
                minHeight: 50,
                maxHeight: 60,
                currentHeight: 0,
                growing: true,
                growthSpeed: 0.5
            },
            soot: {
                title: "Углерод",
                description: "Кликайте на появляющиеся атомы углерода! Соберите 10 атомов за 30 секунд!",
                setup: () => this.setupSootCollection(),
                targetsToCollect: 10,
                totalTime: 30,
                currentScore: 0,
                gameArea: null,
                activeAtoms: new Set(),
                atomTimeout: 2000,
                spawnInterval: null
            }
        };
        
        this.gameStartTime = null;
        
        this.attackState = {
            blockedIngredient: null,
            sendBlocked: false,
            ingredientBlockTimer: null,
            sendBlockTimer: null,
            ingredientBlockTimeLeft: 0,
            sendBlockTimeLeft: 0,
            sendBlockEndTime: null
        };
        
        window.onTutorialComplete = () => {
            this.init();
        };
        
        this.tutorial.startTutorial();
    }
    
    init() {
        this.connectToServer();
        this.setupEventListeners();
        this.setupIngredientSelector();
        this.updateDisplay();
        this.updateRoomInfo();
        
        this.startBlockTimerUpdates();
        this.restoreBlockState();
    }
    
    connectToServer() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            this.socket.emit('register-player', {
                playerId: this.playerId,
                playerType: 'ingredientGatherer',
                playerName: this.playerName,
                roomId: this.roomId
            });
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('game-state', (gameState) => {
            this.updateRoomStats(gameState);
        });
        
        this.socket.on('team-reward', (reward) => {
            this.showTeamNotification(reward.message);
        });
        
        this.socket.on('player-joined', (data) => {
            this.showTeamNotification(`Игрок ${data.playerName} присоединился к команде!`);
            this.updateRoomPlayers(data.roomPlayers);
        });

        this.socket.on('player-left', (data) => {
            this.showTeamNotification(`Игрок ${data.playerName} покинул команду`);
        });

        this.socket.on('all-resources-reset', (data) => {
            this.showTeamNotification(data.message);
            this.ingredients = [];
            this.updateIngredientsList();
            this.updateDisplay();
        });

        this.socket.on('potion-created', (data) => {
            this.showTeamNotification(`Создано новое зелье!`);
        });

        this.socket.on('error', (data) => {
            if (data.message && data.message.includes('Отправка ингредиентов заблокирована')) {
                if (!this.attackState.sendBlocked) {
                    this.blockIngredientSend(60);
                }
                this.showNotification(data.message);
            } else if (data.message && data.message.includes('Все ингредиенты заблокированы')) {
                this.showNotification(data.message);
            } else {
                this.showTeamNotification(`Ошибка: ${data.message}`);
                setTimeout(() => {
                    window.location.href = '/room-selection';
                }, 3000);
            }
        });
        
        this.socket.on('attack-received', (data) => {
            this.handleAttackReceived(data);
        });
        
        this.socket.on('ingredient-unblocked', (data) => {
            this.handleIngredientUnblocked(data);
        });
        
        this.socket.on('ingredient-send-unblocked', (data) => {
            this.handleIngredientSendUnblocked(data);
        });
        
        this.socket.on('defense-activated', (data) => {
            this.showDefenseNotification("Защитный реагент активирован! Ваша команда защищена.");
            this.updateDefenseStatus(true);
        });
        
        this.socket.on('defense-used', (data) => {
            this.showDefenseNotification(`Защита отразила атаку от команды ${data.attackerRoom}!`);
            this.updateDefenseStatus(false);
        });
        
        this.socket.on('defense-destroyed', (data) => {
            this.showNotification("Защитный реагент уничтожен атакой!");
            this.updateDefenseStatus(false);
        });
        
        this.socket.on('ingredients-updated', (data) => {
            if (this.attackState.sendBlocked) {
                this.clearSendBlock();
            }
        });
    }
    
    handleAttackReceived(data) {
        const { potionType, targetIngredient } = data;
        
        if (potionType === 'attack3' && targetIngredient) {
            this.blockIngredient(targetIngredient);
            this.showAttackNotification(`Компонент "${targetIngredient}" заблокирован на 1 минуту!`);
        } else if (potionType === 'attack4') {
            this.blockIngredientSend(60);
            this.showAttackNotification("Отправка компонентов заблокирована на 1 минуту!");
        }
        
        this.showAttackEffectNotification(data);
    }
    
    blockIngredient(ingredientName) {
        const ingredientMap = {
            'Азот': 'dew',
            'Биоматериал': 'herbs',
            'Углерод': 'soot'
        };
        
        const ingredientType = ingredientMap[ingredientName];
        this.attackState.blockedIngredient = ingredientType;
        
        this.updateIngredientBlockDisplay();
        
        if (this.currentIngredient.type === ingredientType) {
            this.switchToUnblockedIngredient();
        }
        
        this.attackState.ingredientBlockTimeLeft = 60;
        
        if (this.attackState.ingredientBlockTimer) {
            clearInterval(this.attackState.ingredientBlockTimer);
        }
        
        this.attackState.ingredientBlockTimer = setInterval(() => {
            this.attackState.ingredientBlockTimeLeft--;
            this.updateIngredientBlockDisplay();
            
            if (this.attackState.ingredientBlockTimeLeft <= 0) {
                clearInterval(this.attackState.ingredientBlockTimer);
                this.attackState.blockedIngredient = null;
                this.updateIngredientBlockDisplay();
            }
        }, 1000);
    }
    
    blockIngredientSend(duration = 60) {
        this.attackState.sendBlocked = true;
        this.attackState.sendBlockTimeLeft = duration;
        this.attackState.sendBlockEndTime = Date.now() + (duration * 1000);
        
        this.saveBlockState();
        this.updateSendBlockDisplay();
        
        if (this.attackState.sendBlockTimer) {
            clearInterval(this.attackState.sendBlockTimer);
        }
        
        this.attackState.sendBlockTimer = setInterval(() => {
            const now = Date.now();
            if (this.attackState.sendBlockEndTime && now >= this.attackState.sendBlockEndTime) {
                this.clearSendBlock();
                return;
            }
            
            if (this.attackState.sendBlockTimeLeft > 0) {
                this.attackState.sendBlockTimeLeft--;
                this.updateSendBlockDisplay();
            }
        }, 1000);
    }
    
    clearSendBlock() {
        this.attackState.sendBlocked = false;
        this.attackState.sendBlockTimeLeft = 0;
        this.attackState.sendBlockEndTime = null;
        
        if (this.attackState.sendBlockTimer) {
            clearInterval(this.attackState.sendBlockTimer);
            this.attackState.sendBlockTimer = null;
        }
        
        this.updateSendBlockDisplay();
        this.saveBlockState();
        this.showNotification("Отправка ингредиентов снова доступна!");
    }
    
    handleIngredientUnblocked(data) {
        const { ingredient } = data;
        const ingredientMap = {
            'Азот': 'dew',
            'Биоматериал': 'herbs',
            'Углерод': 'soot'
        };
        
        const ingredientType = ingredientMap[ingredient];
        if (this.attackState.blockedIngredient === ingredientType) {
            this.attackState.blockedIngredient = null;
            if (this.attackState.ingredientBlockTimer) {
                clearInterval(this.attackState.ingredientBlockTimer);
                this.attackState.ingredientBlockTimer = null;
            }
            this.updateIngredientBlockDisplay();
            this.showNotification(`Ингредиент "${ingredient}" снова доступен для создания!`);
        }
    }
    
    handleIngredientSendUnblocked(data) {
        this.clearSendBlock();
        this.showNotification(data.message || "Отправка ингредиентов снова доступна!");
    }
    
    saveBlockState() {
        try {
            const blockState = {
                sendBlocked: this.attackState.sendBlocked,
                sendBlockEndTime: this.attackState.sendBlockEndTime,
                sendBlockTimeLeft: this.attackState.sendBlockTimeLeft,
                blockedIngredient: this.attackState.blockedIngredient,
                ingredientBlockTimeLeft: this.attackState.ingredientBlockTimeLeft,
                timestamp: Date.now()
            };
            localStorage.setItem(`ingredientGatherer_blockState_${this.roomId}`, JSON.stringify(blockState));
        } catch (e) {
            console.error('Ошибка сохранения состояния блокировки:', e);
        }
    }
    
    restoreBlockState() {
        try {
            const saved = localStorage.getItem(`ingredientGatherer_blockState_${this.roomId}`);
            if (saved) {
                const blockState = JSON.parse(saved);
                const now = Date.now();
                
                if (blockState.sendBlocked && blockState.sendBlockEndTime) {
                    if (blockState.sendBlockEndTime > now) {
                        const remainingSeconds = Math.ceil((blockState.sendBlockEndTime - now) / 1000);
                        this.attackState.sendBlocked = true;
                        this.attackState.sendBlockTimeLeft = remainingSeconds;
                        this.attackState.sendBlockEndTime = blockState.sendBlockEndTime;
                        this.blockIngredientSend(remainingSeconds);
                    }
                }
                
                if (blockState.blockedIngredient && blockState.ingredientBlockTimeLeft > 0) {
                    this.attackState.blockedIngredient = blockState.blockedIngredient;
                    this.attackState.ingredientBlockTimeLeft = blockState.ingredientBlockTimeLeft;
                    this.blockIngredient(this.getIngredientNameByType(blockState.blockedIngredient));
                }
            }
        } catch (e) {
            console.error('Ошибка восстановления состояния блокировки:', e);
        }
    }
    
    getIngredientNameByType(type) {
        const ingredientMap = {
            'dew': 'Азот',
            'herbs': 'Биоматериал',
            'soot': 'Углерод'
        };
        return ingredientMap[type] || type;
    }
    
    updateIngredientBlockDisplay() {
        const ingredientOptions = document.querySelectorAll('.ingredient-option');
        const blockedOverlay = document.getElementById('attackBlockedOverlay');
        const blockedTimeElement = document.getElementById('blockedTime');
        
        ingredientOptions.forEach(option => {
            const type = option.dataset.type;
            const blockedIndicator = option.querySelector('.blocked-indicator');
            
            if (type === this.attackState.blockedIngredient) {
                option.classList.add('blocked');
                option.style.cursor = 'not-allowed';
                if (blockedIndicator) {
                    blockedIndicator.style.display = 'flex';
                }
                
                if (blockedOverlay) {
                    blockedOverlay.style.display = 'block';
                    if (blockedTimeElement) {
                        blockedTimeElement.textContent = this.attackState.ingredientBlockTimeLeft;
                    }
                }
            } else {
                option.classList.remove('blocked');
                option.style.cursor = 'pointer';
                if (blockedIndicator) {
                    blockedIndicator.style.display = 'none';
                }
            }
        });
        
        if (blockedOverlay && !this.attackState.blockedIngredient) {
            blockedOverlay.style.display = 'none';
        }
    }
    
    updateSendBlockDisplay() {
        const sendBlockedOverlay = document.getElementById('sendBlockedOverlay');
        const sendBlockedTimeElement = document.getElementById('sendBlockedTime');
        
        if (sendBlockedOverlay) {
            if (this.attackState.sendBlocked) {
                sendBlockedOverlay.style.display = 'block';
                if (sendBlockedTimeElement) {
                    sendBlockedTimeElement.textContent = this.attackState.sendBlockTimeLeft;
                }
            } else {
                sendBlockedOverlay.style.display = 'none';
            }
        }
        
        const sendButtons = document.querySelectorAll('.send-ingredient-button');
        sendButtons.forEach(button => {
            if (this.attackState.sendBlocked) {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.title = 'Отправка заблокирована!';
            } else {
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.title = 'Отправить зельевару';
            }
        });
    }
    
    switchToUnblockedIngredient() {
        const ingredientTypes = ['dew', 'herbs', 'soot'];
        const unblockedTypes = ingredientTypes.filter(type => type !== this.attackState.blockedIngredient);
        
        if (unblockedTypes.length > 0) {
            const newType = unblockedTypes[0];
            const option = document.querySelector(`.ingredient-option[data-type="${newType}"]`);
            if (option) {
                option.click();
            }
        } else {
            this.showNotification("Все компоненты заблокированы! Подождите, пока действие атаки закончится.");
        }
    }
    
    startBlockTimerUpdates() {
        setInterval(() => {
            if (this.attackState.ingredientBlockTimeLeft > 0) {
                this.attackState.ingredientBlockTimeLeft--;
                this.updateIngredientBlockDisplay();
            }
            
            if (this.attackState.sendBlockTimeLeft > 0) {
                this.attackState.sendBlockTimeLeft--;
                this.updateSendBlockDisplay();
            }
        }, 1000);
    }
    
    showAttackNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'attack-notification';
        notification.innerHTML = `
            <div>⚔️ ВНИМАНИЕ: Атака на вашу команду!</div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showDefenseNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'defense-notification';
        notification.innerHTML = `
            <div>🛡️ ${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showAttackEffectNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'attack-notification';
        notification.innerHTML = `
            <div>⚔️ Атака от команды ${data.attackerRoom || 'неизвестной'}!</div>
            <div>${data.potionName || 'Неизвестное зелье'}</div>
            <div>${data.attackerName || 'Неизвестный противник'}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    updateDefenseStatus(active) {
        const defenseStatus = document.getElementById('defenseStatus');
        if (defenseStatus) {
            defenseStatus.textContent = active ? '🛡️' : '❌';
            defenseStatus.style.color = active ? '#4caf50' : '#f44336';
        }
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('connectionStatus');
        
        if (connected) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Подключено';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Отключено';
        }
    }

    updateRoomInfo() {
        const roomNameElement = document.getElementById('roomName');
        const playerNameElement = document.getElementById('playerNameDisplay');
        
        if (roomNameElement) roomNameElement.textContent = `Комната: ${this.roomId.toUpperCase()}`;
        if (playerNameElement) playerNameElement.textContent = `Игрок: ${this.playerName}`;
    }

    updateRoomStats(gameState) {
        // Статистики убраны, оставляем только защиту
        if (gameState.players) {
            this.updateRoomPlayers(Object.values(gameState.players));
        }
    }

    updateRoomPlayers(players) {
        // Этот метод оставлен для возможного будущего использования
    }
    
    setupEventListeners() {
        const startCollectionButton = document.getElementById('startCollectionButton');
        const actionButton = document.getElementById('actionButton');
        
        if (startCollectionButton) startCollectionButton.addEventListener('click', () => this.startCollection());
        if (actionButton) actionButton.addEventListener('click', () => this.performAction());
        
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.tutorial.skipTutorial();
            }
        });
    }
    
    setupIngredientSelector() {
        const options = document.querySelectorAll('.ingredient-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                if (this.attackState.blockedIngredient === type) {
                    this.showNotification("Этот ингредиент заблокирован атакой! Выберите другой.");
                    return;
                }
                
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                this.currentIngredient.type = option.dataset.type;
                this.currentIngredient.name = option.dataset.name;
                
                this.updateIngredientPreview();
                this.setupMinigame();
            });
        });
        
        if (options.length > 0) {
            options[0].click();
        }
    }
    
    updateIngredientPreview() {
        const ingredientIcon = document.getElementById('ingredientIcon');
        const ingredientName = document.getElementById('ingredientName');
        
        const icons = {
            'dew': '💧',
            'herbs': '🌿',
            'soot': '⚫'
        };
        
        if (ingredientIcon) ingredientIcon.textContent = icons[this.currentIngredient.type] || '?';
        if (ingredientName) ingredientName.textContent = this.currentIngredient.name;
    }
    
    setupMinigame() {
        if (this.attackState.blockedIngredient === this.currentIngredient.type) {
            this.showGameFeedback('Этот компонент заблокирован атакой! Выберите другой.', 'error');
            
            const startCollectionButton = document.getElementById('startCollectionButton');
            const actionButton = document.getElementById('actionButton');
            
            if (startCollectionButton) startCollectionButton.disabled = true;
            if (actionButton) actionButton.style.display = 'none';
            
            return;
        }
        
        const minigame = this.minigames[this.currentIngredient.type];
        if (!minigame) return;
        
        this.generateRandomGameParams();
        
        const minigameTitle = document.getElementById('minigameTitle');
        const minigameDescription = document.getElementById('minigameDescription');
        
        if (minigameTitle) minigameTitle.textContent = minigame.title;
        if (minigameDescription) {
            if (this.currentIngredient.type === 'dew') {
                minigameDescription.textContent = `Быстро нажимайте кнопку 'Налить' чтобы собрать РОВНО ${this.currentGameParams.dew.targetDrops} капель за ${this.currentGameParams.dew.totalTime} секунд!`;
            } else if (this.currentIngredient.type === 'soot') {
                minigameDescription.textContent = `Соберите ${this.minigames.soot.targetsToCollect} атомов углерода за ${this.minigames.soot.totalTime} секунд! Кликайте на появляющиеся атомы.`;
            } else {
                minigameDescription.textContent = minigame.description;
            }
        }
        
        this.resetMinigame();
        minigame.setup();
        
        const actionButton = document.getElementById('actionButton');
        if (actionButton) {
            if (this.currentIngredient.type === 'dew' || this.currentIngredient.type === 'herbs') {
                actionButton.style.display = 'inline-block';
                actionButton.textContent = this.currentIngredient.type === 'dew' ? 'Налить' : 'Срезать';
                actionButton.disabled = true;
            } else {
                actionButton.style.display = 'none';
            }
        }
        
        this.showGameFeedback('Выберите ингредиент и начните сбор', 'info');
    }
    
    generateRandomGameParams() {
        const dewTargets = [13, 15, 17, 20, 22, 25];
        this.currentGameParams.dew.targetDrops = dewTargets[Math.floor(Math.random() * dewTargets.length)];
        this.currentGameParams.dew.totalTime = 10;
        
        const herbSpeeds = [0.2, 0.3, 0.5];
        this.currentGameParams.herbs.growthSpeed = herbSpeeds[Math.floor(Math.random() * herbSpeeds.length)];
        
        const sootTargets = [8, 10, 12];
        this.currentGameParams.soot.targetsToCollect = sootTargets[Math.floor(Math.random() * sootTargets.length)];
        this.currentGameParams.soot.totalTime = 30;
        
        this.minigames.dew.targetDrops = this.currentGameParams.dew.targetDrops;
        this.minigames.dew.totalTime = this.currentGameParams.dew.totalTime;
        this.minigames.herbs.growthSpeed = this.currentGameParams.herbs.growthSpeed;
        this.minigames.soot.targetsToCollect = this.currentGameParams.soot.targetsToCollect;
        this.minigames.soot.totalTime = this.currentGameParams.soot.totalTime;
    }
    
    resetMinigame() {
        this.currentIngredient.isCollecting = false;
        this.currentIngredient.success = false;
        this.gameStartTime = null;
        
        if (this.currentIngredient.collectionInterval) {
            clearInterval(this.currentIngredient.collectionInterval);
            this.currentIngredient.collectionInterval = null;
        }
        if (this.currentIngredient.gameTimer) {
            clearInterval(this.currentIngredient.gameTimer);
            this.currentIngredient.gameTimer = null;
        }
        
        const minigame = this.minigames[this.currentIngredient.type];
        if (minigame) {
            if (minigame.currentDrops !== undefined) minigame.currentDrops = 0;
            if (minigame.currentHeight !== undefined) minigame.currentHeight = 0;
            if (minigame.currentScore !== undefined) minigame.currentScore = 0;
            if (minigame.activeAtoms) minigame.activeAtoms.clear();
            if (minigame.spawnInterval) {
                clearInterval(minigame.spawnInterval);
                minigame.spawnInterval = null;
            }
            
            if (minigame.gameArea) {
                minigame.gameArea.innerHTML = '';
            }
        }
        
        // Очищаем капли для азота
        if (this.currentIngredient.type === 'dew') {
            const dewDrops = document.getElementById('dewDrops');
            if (dewDrops) {
                dewDrops.innerHTML = '';
            }
        }
        
        const startCollectionButton = document.getElementById('startCollectionButton');
        const actionButton = document.getElementById('actionButton');
        const gameTimer = document.getElementById('gameTimer');
        
        if (startCollectionButton) startCollectionButton.disabled = false;
        if (actionButton) actionButton.disabled = true;
        if (gameTimer) gameTimer.style.display = 'none';
    }
    
    setupDewCollection() {
        const measurementTool = document.getElementById('measurementTool');
        if (!measurementTool) return;
        
        measurementTool.innerHTML = `
            <div class="dew-collection">
                <div class="flask">
                    <div class="liquid-fill" id="liquidFill" style="height: 0%"></div>
                    <div class="dew-target" id="dewTarget" style="bottom: ${(this.minigames.dew.targetDrops / this.minigames.dew.maxDrops) * 100}%"></div>
                    <div class="dew-drops" id="dewDrops"></div>
                </div>
                <div class="dew-stats">
                    <div class="dew-stat">
                        <span class="dew-stat-label">Собрано:</span>
                        <span class="dew-stat-value" id="dropCount">0</span>
                        <span class="dew-stat-total">/${this.minigames.dew.targetDrops}</span>
                    </div>
                    <div class="dew-stat">
                        <span class="dew-stat-label">Время:</span>
                        <span class="dew-stat-value" id="dewTimeLeft">${this.minigames.dew.totalTime}</span>
                        <span class="dew-stat-total">сек</span>
                    </div>
                </div>
                <div class="instruction">Нужно собрать РОВНО ${this.minigames.dew.targetDrops} капель</div>
            </div>
        `;
    }
    
    setupHerbCollection() {
        const measurementTool = document.getElementById('measurementTool');
        if (!measurementTool) return;
        
        measurementTool.innerHTML = `
            <div class="herb-collection">
                <div class="herb-stem" id="herbStem">
                    <div class="herb-growth" id="herbGrowth" style="height: 0%"></div>
                    <div class="herb-min" id="herbMin" style="bottom: ${this.minigames.herbs.minHeight}%"></div>
                    <div class="herb-target" id="herbTarget" style="bottom: ${this.minigames.herbs.maxHeight}%"></div>
                </div>
                <div class="herb-stats">
                    <div class="herb-stat">
                        <span class="herb-stat-label">Высота:</span>
                        <span class="herb-stat-value" id="herbHeight">0</span>
                        <span class="herb-stat-unit">%</span>
                    </div>
                    <div class="instruction">Нажмите "Срезать" когда стебель будет между линиями</div>
                    <div class="instruction">Скорость роста: ${this.minigames.herbs.growthSpeed === 0.2 ? 'Медленная' : this.minigames.herbs.growthSpeed === 0.3 ? 'Средняя' : 'Быстрая'}</div>
                </div>
            </div>
        `;
    }
    
    setupSootCollection() {
        const measurementTool = document.getElementById('measurementTool');
        if (!measurementTool) return;
        
        measurementTool.innerHTML = `
            <div class="soot-collection">
                <div class="carbon-game-header">
                    <div class="carbon-game-title">Синтез углерода</div>
                    <div class="carbon-game-subtitle">Соберите ${this.minigames.soot.targetsToCollect} атомов углерода за ${this.minigames.soot.totalTime} секунд!</div>
                </div>
                <div class="carbon-game-area" id="carbonGameArea">
                    <!-- Атомы углерода будут появляться здесь -->
                </div>
                <div class="carbon-game-controls">
                    <div class="carbon-stats">
                        <div class="carbon-stat">
                            <span class="carbon-stat-label">Собрано:</span>
                            <span class="carbon-stat-value" id="carbonCollected">0</span>
                            <span class="carbon-stat-total">/${this.minigames.soot.targetsToCollect}</span>
                        </div>
                        <div class="carbon-stat">
                            <span class="carbon-stat-label">Время:</span>
                            <span class="carbon-stat-value" id="carbonTimeLeft">${this.minigames.soot.totalTime}</span>
                            <span class="carbon-stat-unit">сек</span>
                        </div>
                    </div>
                    <div class="carbon-game-instruction">
                        <div class="instruction">Кликайте на появляющиеся атомы углерода!</div>
                    </div>
                </div>
            </div>
        `;
        
        this.minigames.soot.gameArea = document.getElementById('carbonGameArea');
    }
    
    startCollection() {
        if (this.currentIngredient.isCollecting) return;
        
        if (this.attackState.blockedIngredient === this.currentIngredient.type) {
            this.showGameFeedback('Этот ингредиент заблокирован атакой! Выберите другой.', 'error');
            return;
        }
        
        this.currentIngredient.isCollecting = true;
        this.currentIngredient.success = false;
        this.gameStartTime = Date.now();
        
        const startCollectionButton = document.getElementById('startCollectionButton');
        const actionButton = document.getElementById('actionButton');
        
        if (startCollectionButton) startCollectionButton.disabled = true;
        
        if (this.currentIngredient.type === 'dew' && actionButton) {
            actionButton.disabled = false;
        }
        
        if (this.currentIngredient.type === 'herbs' && actionButton) {
            actionButton.disabled = false;
        }
        
        switch(this.currentIngredient.type) {
            case 'dew':
                this.startDewCollection();
                break;
            case 'herbs':
                this.startHerbCollection();
                break;
            case 'soot':
                this.startSootCollection();
                break;
        }
        
        this.showGameFeedback('Сбор начался! Управляйте процессом.', 'warning');
    }
    
    startDewCollection() {
        const minigame = this.minigames.dew;
        minigame.currentDrops = 0;
        this.currentIngredient.timeLeft = minigame.totalTime;
        
        const dewTimeLeftElement = document.getElementById('dewTimeLeft');
        const dropCountElement = document.getElementById('dropCount');
        
        if (dewTimeLeftElement) dewTimeLeftElement.textContent = this.currentIngredient.timeLeft;
        if (dropCountElement) dropCountElement.textContent = minigame.currentDrops;
        
        if (this.currentIngredient.gameTimer) {
            clearInterval(this.currentIngredient.gameTimer);
        }
        
        this.currentIngredient.gameTimer = setInterval(() => {
            this.currentIngredient.timeLeft--;
            if (dewTimeLeftElement) dewTimeLeftElement.textContent = this.currentIngredient.timeLeft;
            
            if (this.currentIngredient.timeLeft <= 0) {
                clearInterval(this.currentIngredient.gameTimer);
                this.checkDewResult();
            }
        }, 1000);
        
        const liquidFill = document.getElementById('liquidFill');
        if (liquidFill) liquidFill.style.height = '0%';
    }
    
    performAction() {
        if (!this.currentIngredient.isCollecting) return;
        
        switch(this.currentIngredient.type) {
            case 'dew':
                this.addDewDrop();
                break;
            case 'herbs':
                this.cutHerb();
                break;
        }
    }
    
    addDewDrop() {
        const minigame = this.minigames.dew;
        
        if (minigame.currentDrops >= minigame.maxDrops) {
            this.showGameFeedback('Сосуд переполнен! Игра провалена.', 'error');
            this.currentIngredient.success = false;
            this.stopCollection();
            return;
        }
        
        minigame.currentDrops++;
        
        const dropCount = document.getElementById('dropCount');
        const liquidFill = document.getElementById('liquidFill');
        if (dropCount) dropCount.textContent = minigame.currentDrops;
        if (liquidFill) {
            const fillPercentage = Math.min(100, (minigame.currentDrops / minigame.maxDrops) * 100);
            liquidFill.style.height = fillPercentage + '%';
        }
        
        // Создаем анимацию капли
        this.createDewDrop();
    }
    
    createDewDrop() {
        const dewDrops = document.getElementById('dewDrops');
        if (!dewDrops) return;
        
        const drop = document.createElement('div');
        drop.className = 'drop';
        
        // Случайная позиция в верхней части колбы
        const dropLeft = Math.random() * 60 + 20; // 20-80%
        drop.style.left = dropLeft + '%';
        
        dewDrops.appendChild(drop);
        
        // Удаляем каплю после анимации
        setTimeout(() => {
            if (dewDrops.contains(drop)) {
                dewDrops.removeChild(drop);
            }
        }, 1000);
    }
    
    checkDewResult() {
        const minigame = this.minigames.dew;
        
        if (minigame.currentDrops === minigame.targetDrops) {
            this.currentIngredient.success = true;
            this.stopCollection();
        } else {
            this.currentIngredient.success = false;
            this.stopCollection();
        }
    }
    
    startHerbCollection() {
        const minigame = this.minigames.herbs;
        minigame.currentHeight = 0;
        minigame.growing = true;
        
        if (this.currentIngredient.collectionInterval) {
            clearInterval(this.currentIngredient.collectionInterval);
        }
        
        this.currentIngredient.collectionInterval = setInterval(() => {
            if (minigame.growing) {
                minigame.currentHeight += minigame.growthSpeed;
                
                if (minigame.currentHeight >= 100) {
                    minigame.currentHeight = 100;
                    minigame.growing = false;
                }
            } else {
                minigame.currentHeight -= minigame.growthSpeed;
                
                if (minigame.currentHeight <= 0) {
                    minigame.currentHeight = 0;
                    minigame.growing = true;
                }
            }
            
            const herbGrowth = document.getElementById('herbGrowth');
            const herbHeight = document.getElementById('herbHeight');
            if (herbGrowth) herbGrowth.style.height = minigame.currentHeight + '%';
            if (herbHeight) herbHeight.textContent = Math.round(minigame.currentHeight);
        }, 50);
    }
    
    cutHerb() {
        const minigame = this.minigames.herbs;
        const height = minigame.currentHeight;
        
        if (height >= minigame.minHeight && height <= minigame.maxHeight) {
            this.currentIngredient.success = true;
            this.stopCollection();
        } else {
            this.currentIngredient.success = false;
            this.stopCollection();
        }
    }
    
    startSootCollection() {
        const minigame = this.minigames.soot;
        minigame.currentScore = 0;
        this.currentIngredient.timeLeft = minigame.totalTime;
        
        if (minigame.gameArea) {
            minigame.gameArea.innerHTML = '';
        }
        
        const carbonCollectedElement = document.getElementById('carbonCollected');
        const carbonTimeLeftElement = document.getElementById('carbonTimeLeft');
        
        if (carbonCollectedElement) carbonCollectedElement.textContent = minigame.currentScore;
        if (carbonTimeLeftElement) carbonTimeLeftElement.textContent = this.currentIngredient.timeLeft;
        
        if (this.currentIngredient.gameTimer) {
            clearInterval(this.currentIngredient.gameTimer);
        }
        
        this.currentIngredient.gameTimer = setInterval(() => {
            this.currentIngredient.timeLeft--;
            
            if (carbonTimeLeftElement) {
                carbonTimeLeftElement.textContent = this.currentIngredient.timeLeft;
            }
            
            if (this.currentIngredient.timeLeft <= 0) {
                clearInterval(this.currentIngredient.gameTimer);
                this.checkSootResult();
            }
        }, 1000);
        
        this.startCarbonAtomSpawn();
    }
    
    startCarbonAtomSpawn() {
        const minigame = this.minigames.soot;
        
        if (minigame.spawnInterval) {
            clearInterval(minigame.spawnInterval);
        }
        
        minigame.spawnInterval = setInterval(() => {
            if (!this.currentIngredient.isCollecting || this.currentIngredient.type !== 'soot') {
                clearInterval(minigame.spawnInterval);
                return;
            }
            
            if (minigame.currentScore >= minigame.targetsToCollect) {
                clearInterval(minigame.spawnInterval);
                return;
            }
            
            this.spawnCarbonAtom();
        }, 600);
    }
    
    spawnCarbonAtom() {
        if (!this.currentIngredient.isCollecting || this.currentIngredient.type !== 'soot') return;
        
        const minigame = this.minigames.soot;
        if (!minigame.gameArea) return;
        
        if (minigame.currentScore >= minigame.targetsToCollect) return;
        
        const atom = document.createElement('div');
        atom.className = 'carbon-atom';
        const atomId = 'atom_' + Date.now() + Math.random();
        atom.dataset.id = atomId;
        
        const size = Math.random() * 25 + 25;
        atom.style.width = `${size}px`;
        atom.style.height = `${size}px`;
        
        const areaRect = minigame.gameArea.getBoundingClientRect();
        const x = Math.random() * (areaRect.width - size);
        const y = Math.random() * (areaRect.height - size);
        atom.style.left = `${x}px`;
        atom.style.top = `${y}px`;
        
        atom.style.animation = 'atomAppear 0.2s ease-out';
        
        atom.addEventListener('click', () => {
            if (!atom.classList.contains('collected')) {
                this.collectCarbonAtom(atom, atomId);
            }
        });
        
        minigame.gameArea.appendChild(atom);
        minigame.activeAtoms.add(atomId);
        
        setTimeout(() => {
            if (minigame.activeAtoms.has(atomId) && !atom.classList.contains('collected')) {
                this.removeCarbonAtom(atom, atomId);
            }
        }, minigame.atomTimeout);
    }
    
    collectCarbonAtom(atom, atomId) {
        const minigame = this.minigames.soot;
        
        atom.classList.add('collected');
        minigame.currentScore++;
        
        const carbonCollectedElement = document.getElementById('carbonCollected');
        if (carbonCollectedElement) {
            carbonCollectedElement.textContent = minigame.currentScore;
        }
        
        atom.style.animation = 'atomCollect 0.3s ease-out forwards';
        
        setTimeout(() => {
            if (minigame.gameArea.contains(atom)) {
                minigame.gameArea.removeChild(atom);
            }
            minigame.activeAtoms.delete(atomId);
        }, 300);
        
        if (minigame.currentScore >= minigame.targetsToCollect) {
            this.currentIngredient.success = true;
            this.stopCollection();
        }
    }
    
    removeCarbonAtom(atom, atomId) {
        const minigame = this.minigames.soot;
        
        atom.style.animation = 'atomDisappear 0.2s ease-out forwards';
        
        setTimeout(() => {
            if (minigame.gameArea.contains(atom)) {
                minigame.gameArea.removeChild(atom);
            }
            minigame.activeAtoms.delete(atomId);
        }, 200);
    }
    
    checkSootResult() {
        const minigame = this.minigames.soot;
        
        if (minigame.currentScore >= minigame.targetsToCollect) {
            this.currentIngredient.success = true;
        } else {
            this.currentIngredient.success = false;
        }
        
        this.stopCollection();
    }
    
    stopCollection() {
        if (!this.currentIngredient.isCollecting) return;
        
        this.currentIngredient.isCollecting = false;
        
        if (this.currentIngredient.collectionInterval) {
            clearInterval(this.currentIngredient.collectionInterval);
            this.currentIngredient.collectionInterval = null;
        }
        if (this.currentIngredient.gameTimer) {
            clearInterval(this.currentIngredient.gameTimer);
            this.currentIngredient.gameTimer = null;
        }
        
        const minigame = this.minigames[this.currentIngredient.type];
        if (minigame && minigame.spawnInterval) {
            clearInterval(minigame.spawnInterval);
            minigame.spawnInterval = null;
        }
        
        if (this.currentIngredient.type === 'soot') {
            const minigame = this.minigames.soot;
            if (minigame.activeAtoms) {
                minigame.activeAtoms.clear();
            }
        }
        
        const startCollectionButton = document.getElementById('startCollectionButton');
        const actionButton = document.getElementById('actionButton');
        
        if (startCollectionButton) startCollectionButton.disabled = false;
        if (actionButton) actionButton.disabled = true;
        
        if (this.currentIngredient.success) {
            this.createIngredient();
        } else {
            let message = 'Процесс сбора нарушен! Попробуйте снова.';
            
            if (this.currentIngredient.type === 'dew') {
                const currentDrops = this.minigames.dew.currentDrops;
                const targetDrops = this.minigames.dew.targetDrops;
                if (currentDrops < targetDrops) {
                    message = `Собрано только ${currentDrops} из ${targetDrops} капель! Попробуйте снова.`;
                } else if (currentDrops > targetDrops) {
                    message = `Собрано ${currentDrops} капель, а нужно было РОВНО ${targetDrops}! Попробуйте снова.`;
                }
            } else if (this.currentIngredient.type === 'herbs') {
                const height = this.minigames.herbs.currentHeight;
                const min = this.minigames.herbs.minHeight;
                const max = this.minigames.herbs.maxHeight;
                message = `Вы срезали на высоте ${Math.round(height)}%, а нужно было между ${min}% и ${max}%! Попробуйте снова.`;
            } else if (this.currentIngredient.type === 'soot') {
                const currentScore = this.minigames.soot.currentScore;
                const targetScore = this.minigames.soot.targetsToCollect;
                message = `Вы собрали ${currentScore} из ${targetScore} атомов углерода! Попробуйте снова.`;
            }
            
            this.showGameFeedback(message, 'error');
        }
    }
    
    showGameFeedback(message, type) {
        const feedback = document.getElementById('gameFeedback');
        if (!feedback) return;
        
        feedback.textContent = message;
        feedback.className = `game-feedback feedback-${type}`;
        
        if (type === 'info') {
            setTimeout(() => {
                feedback.className = 'game-feedback feedback-info';
            }, 3000);
        }
    }
    
    createIngredient() {
        const ingredient = {
            id: Date.now() + Math.random(),
            name: this.currentIngredient.name,
            type: this.currentIngredient.type
        };
        
        this.ingredients.push(ingredient);
        
        this.updateIngredientsList();
        this.updateDisplay();
        
        this.showTeamNotification(`Собран ингредиент: ${this.currentIngredient.name}!`);
        this.showGameFeedback('Сбор завершен успешно! Компонент добавлен в список.', 'success');
        
        setTimeout(() => {
            this.setupMinigame();
        }, 1500);
    }
    
    sendIngredientToPotionMaker(ingredient) {
        if (this.attackState.sendBlocked) {
            this.showNotification("Отправка ингредиентов заблокирована атакой! Подождите, пока действие атаки закончится.");
            return;
        }
        
        this.socket.emit('send-ingredients', {
            ingredients: [ingredient],
            playerId: this.playerId,
            roomId: this.roomId
        });
        
        const index = this.ingredients.findIndex(item => item.id === ingredient.id);
        if (index !== -1) {
            this.ingredients.splice(index, 1);
        }
        
        this.showTeamNotification(`Отправлен ингредиент: ${ingredient.name} Зельевару!`);
        
        this.updateIngredientsList();
        this.updateDisplay();
    }
    
    updateIngredientsList() {
        const resourcesList = document.getElementById('resourcesList');
        if (!resourcesList) return;
        
        if (this.ingredients.length === 0) {
            resourcesList.innerHTML = `
                <div class="empty-message">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">Компоненты еще не собраны</div>
                </div>
            `;
        } else {
            resourcesList.innerHTML = '';
            
            this.ingredients.forEach(ingredient => {
                const resourceItem = document.createElement('div');
                resourceItem.className = 'resource-item';
                resourceItem.dataset.id = ingredient.id;
                
                const icons = {
                    'dew': '💧',
                    'herbs': '🌿',
                    'soot': '⚫'
                };
                
                resourceItem.innerHTML = `
                    <div class="resource-info">
                        <div class="resource-icon">${icons[ingredient.type] || '?'}</div>
                        <div class="resource-name">${ingredient.name}</div>
                    </div>
                    <button class="control-button send-button send-ingredient-button" data-id="${ingredient.id}">
                        Отправить
                    </button>
                `;
                
                resourcesList.appendChild(resourceItem);
            });
            
            const sendButtons = document.querySelectorAll('.send-ingredient-button');
            sendButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const ingredientId = e.target.dataset.id;
                    const ingredient = this.ingredients.find(item => item.id == ingredientId);
                    if (ingredient) {
                        this.sendIngredientToPotionMaker(ingredient);
                    }
                });
            });
        }
        
        this.updateSendBlockDisplay();
    }
    
    updateDisplay() {
        // Обновление статистики убрано
    }
    
    showTeamNotification(message) {
        const notification = document.getElementById('teamNotification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'temp-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4caf50, #2e7d32);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            max-width: 300px;
            animation: fadeInOut 3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            font-weight: bold;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IngredientCollectionGame();
});
