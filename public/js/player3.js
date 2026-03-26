// ===== ФУНКЦИИ ДЛЯ БЛОКИРОВКИ И ТАЙМЕРОВ =====
let inventoryBlockedUntil = 0;
let resourcesBlockedUntil = 0;
let inventoryTimerInterval = null;
let resourcesTimerInterval = null;

function blockInventory(durationMinutes = 1) {
    const durationMs = durationMinutes * 60 * 1000;
    inventoryBlockedUntil = Date.now() + durationMs;
    showInventoryTimer(durationMinutes * 60);
    startInventoryTimer();
}

function showInventoryTimer(seconds) {
    const inventoryButtons = document.querySelectorAll('.inventory-button');
    inventoryButtons.forEach(button => {
        const icon = button.querySelector('.inventory-icon');
        if (icon) {
            const oldTimer = icon.querySelector('.lock-timer');
            if (oldTimer) oldTimer.remove();
            
            const timerSpan = document.createElement('span');
            timerSpan.className = 'lock-timer';
            timerSpan.id = 'inventoryIconTimer';
            timerSpan.textContent = seconds > 60 ? Math.floor(seconds / 60) : seconds;
            icon.appendChild(timerSpan);
        }
    });
}

function startInventoryTimer() {
    if (inventoryTimerInterval) {
        clearInterval(inventoryTimerInterval);
    }
    
    inventoryTimerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((inventoryBlockedUntil - now) / 1000));
        
        const iconTimer = document.getElementById('inventoryIconTimer');
        if (iconTimer) {
            iconTimer.textContent = timeLeft > 60 ? Math.floor(timeLeft / 60) : timeLeft;
        }
        
        if (timeLeft <= 0) {
            clearInterval(inventoryTimerInterval);
            const iconTimer = document.getElementById('inventoryIconTimer');
            if (iconTimer) {
                iconTimer.remove();
            }
        }
    }, 1000);
}

function blockResources(durationSeconds = 30) {
    const durationMs = durationSeconds * 1000;
    resourcesBlockedUntil = Date.now() + durationMs;
    startResourcesTimer();
    if (typeof window.resetScales === 'function') {
        window.resetScales();
    }
}

function startResourcesTimer() {
    if (resourcesTimerInterval) {
        clearInterval(resourcesTimerInterval);
    }
    
    resourcesTimerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((resourcesBlockedUntil - now) / 1000));
        
        if (timeLeft <= 0) {
            clearInterval(resourcesTimerInterval);
            forceUnblockResources();
        }
    }, 1000);
}

function forceUnblockResources() {
    const resources = document.querySelectorAll('.weight, .ingredient');
    resources.forEach(resource => {
        resource.style.pointerEvents = 'auto';
        resource.style.opacity = '1';
        resource.classList.remove('blocked', 'disabled');
    });
}

window.addEventListener('load', function() {
    forceUnblockResources();
    const resetButton = document.getElementById('resetScalesButton');
    if (resetButton && !resetButton.hasAttribute('data-initialized')) {
        resetButton.addEventListener('click', function() {
            forceUnblockResources();
        });
        resetButton.setAttribute('data-initialized', 'true');
    }
});

class TutorialSystem {
    constructor() {
        this.stages = [
            {
                id: 1,
                title: "Приветствие",
                characterImage: "images/stage1.png",
                dialogue: "Добро пожаловать в Лаборантскую. Я помогу тебе освоиться в создании реагентов.",
                mainOverlay: null,
                duration: 10000,
                showMainOverlay: false
            },
            {
                id: 2,
                title: "Главная задача",
                characterImage: "images/stage2pl1.png",
                dialogue: "Твоя главная задача - создавать реагенты по рецептам. Используй научный реактор, чтобы смешивать компоненты. Каждый рецепт имеет несколько этапов!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Как создавать быстрые реагенты?</h3>
                        <p>1. Нажми кнопку "Создать быстрый реагент" слева</p>
                        <p>2. Рецепт будет выбран автоматически</p>
                        <p>3. Посмотри этапы создания в колонке "Этапы создания"</p>
                        <p>4. Используй научный реактор для соединения компонентов</p>
                        <p>5. Бери ресурсы из колонки "Ресурсы команды"</p>
                    </div>
                `,
                duration: 25000,
                showMainOverlay: true
            },
            {
                id: 3,
                title: "Дополнительная задача",
                characterImage: "images/stage4pl3.png",
                dialogue: "Быстрые реагенты добавляются в общий зачет. Реагенты атаки и защиты разблокируются после создания 5 быстрых реагентов!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Виды реагентов</h3>
                        <p>⚗️ Быстрые реагенты - добавляют +1 к общему зачету, рецепт выбирается автоматически</p>
                        <p>⚔️ Реагенты атаки - хранятся в инвентаре, можно использовать против других команд</p>
                        <p>🛡️ Реагент защиты - автоматически защищает команду</p>
                    </div>
                `,
                duration: 25000,
                showMainOverlay: true
            },
            {
                id: 4,
                title: "Инвентарь и защита",
                characterImage: "images/stage3pl3.png",
                dialogue: "Внизу слева находятся кнопки инвентаря. Нажми на них, чтобы увидеть имеющиеся реагенты атаки и активные защиты!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Управление реагентами</h3>
                        <p>🎒 Инвентарь реагентов атаки - хранятся созданные зелья атаки</p>
                        <p>🛡️ Активные защиты - показывает текущее количество активных защитных реагентов</p>
                        <p>💡 Совет: Нажми на реагент в инвентаре, чтобы увидеть его информацию или использовать</p>
                    </div>
                `,
                duration: 25000,
                showMainOverlay: true
            },
            {
                id: 5,
                title: "Прощание",
                characterImage: "images/stage1.png",
                dialogue: "Теперь ты готов к созданию и применению реагентов! Удачи!",
                mainOverlay: null,
                duration: 10000,
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

class PotionMakerGame {
    constructor() {
        this.tutorial = new TutorialSystem();
        this.socket = null;
        this.playerId = 'player3_' + Math.random().toString(36).substr(2, 9);
        
        const pathSegments = window.location.pathname.split('/');
        this.roomId = pathSegments[pathSegments.length - 1] || 'room1';
        const urlParams = new URLSearchParams(window.location.search);
        this.playerName = urlParams.get('playerName') || 'Зельевар';
        
        this.gameState = {
            selectedRecipe: null,
            currentStageIndex: 0,
            leftWeight: 0,
            rightWeight: 0,
            teamResources: {
                weights: [],
                ingredients: []
            },
            usedWeights: [],
            usedIngredient: null,
            currentIngredientName: null,
            
            recipeUsedResources: {
                weights: [],
                ingredients: []
            },

            simplePotionsCreated: 0,
            attackPotionsInventory: [],
            defensePotionsActive: 0,
            unlockedAdvanced: false,
            totalPotionsCreated: 0,
            currentPotionType: null,
            selectedInventoryPotion: null,
            currentAttackPotion: null,
            selectedTargetRoom: null,
            selectedTargetIngredient: null,
            attackEffects: {
                inventoryBlocked: false,
                scalesBlocked: false
            },
            // Кулдауны, получаемые с сервера (для каждой цели относительно текущей комнаты)
            roomCooldowns: {},
            lastProcessedWeightId: null,
            lastProcessedIngredientId: null
        };
        
        this.recipes = {
            simple1: {
                id: 'simple1',
                name: 'Быстрый реагент',
                icon: '⚗️',
                type: 'simple',
                difficulty: 'Простое',
                stages: [
                    { name: "Углерод", weight: 5 },
                    { name: "Биоматериал", weight: 3 }
                ],
                description: "Случайный быстрый реагент для быстрого создания"
            },
            simple2: {
                id: 'simple2',
                name: 'Быстрый реагент',
                icon: '⚗️',
                type: 'simple',
                difficulty: 'Простое',
                stages: [
                    { name: "Азот", weight: 7 },
                    { name: "Углерод", weight: 2 }
                ],
                description: "Случайный быстрый реагент для быстрого создания"
            },
            simple3: {
                id: 'simple3',
                name: 'Быстрый реагент',
                icon: '⚗️',
                type: 'simple',
                difficulty: 'Простое',
                stages: [
                    { name: "Биоматериал", weight: 4 },
                    { name: "Азот", weight: 6 }
                ],
                description: "Случайный быстрый реагент для быстрого создания"
            },
            simple4: {
                id: 'simple4',
                name: 'Быстрый реагент',
                icon: '⚗️',
                type: 'simple',
                difficulty: 'Простое',
                stages: [
                    { name: "Углерод", weight: 8 },
                    { name: "Биоматериал", weight: 1 }
                ],
                description: "Случайный быстрый реагент для быстрого создания"
            },
            simple5: {
                id: 'simple5',
                name: 'Быстрый реагент',
                icon: '⚗️',
                type: 'simple',
                difficulty: 'Простое',
                stages: [
                    { name: "Азот", weight: 9 },
                    { name: "Углерод", weight: 4 }
                ],
                description: "Случайный быстрый реагент для быстрого создания"
            },
            
            attack1: {
                id: 'attack1',
                name: 'Деструктор сырья',
                icon: '⚔️',
                type: 'attack',
                difficulty: 'Атака',
                targetRole: 'weightGatherer',
                stages: [
                    { name: "Углерод", weight: 14 },
                    { name: "Биоматериал", weight: 9 }
                ],
                description: "Перемешивает цвета и названия сырья у Химика другой команды на 1 минуту",
                attackDescription: "Этот реагент перемешивает цвета и названия сырья у Химика выбранной команды на 1 минуту. Если у команды есть активная защита, атака будет отражена."
            },
            attack2: {
                id: 'attack2',
                name: 'Дестабилизатор рецептов',
                icon: '💥',
                type: 'attack',
                difficulty: 'Атака',
                targetRole: 'weightGatherer',
                stages: [
                    { name: "Азот", weight: 18 },
                    { name: "Углерод", weight: 12 }
                ],
                description: "Удаляет сохраненные рецепты Химика другой команды",
                attackDescription: "Этот реагент удаляет сохраненные рецепты приготовления химикатов у Химика выбранной команды, затрудняя его работу. Если у команды есть активная защита, атака будет отражена."
            },
            attack3: {
                id: 'attack3',
                name: 'Ингибитор Синтеза',
                icon: '🚫',
                type: 'attack',
                difficulty: 'Атака',
                targetRole: 'ingredientGatherer',
                requiresIngredientChoice: true,
                stages: [
                    { name: "Азот", weight: 15 },
                    { name: "Углерод", weight: 15 }
                ],
                description: "Блокирует создание любого компонента Исследователя другой команды на минуту",
                attackDescription: "Этот реагент блокирует создание выбранного компонента у исследователя выбранной команды на 1 минуту. Если у команды есть активная защита, атака будет отражена."
            },         
            attack5: {
                id: 'attack5',
                name: 'Химический Блокиратор',
                icon: '❄️',
                type: 'attack',
                difficulty: 'Атака',
                targetRole: 'potionMaker',
                stages: [
                    { name: "Азот", weight: 22 },
                    { name: "Биоматериал", weight: 8 }
                ],
                description: "На минуту блокирует доступ к реагентам атаки у Лаборанта другой команды",
                attackDescription: "Этот реагент блокирует доступ к инвентарю реактивов атаки у Лаборанта выбранной команды на 1 минуту."
            },
            attack6: {
                id: 'attack6',
                name: 'Остановка реактора',
                icon: '🌀',
                type: 'attack',
                difficulty: 'Атака',
                targetRole: 'potionMaker',
                stages: [
                    { name: "Углерод", weight: 30 },
                    { name: "Биоматериал", weight: 10 }
                ],
                description: "Блокирует Лаборанту доступ к ресурсам для создания реагентов на 1 минуту",
                attackDescription: "Этот реагент нарушает работу научного реактора у лаборанта выбранной команды на 1 минуту."
            },
            
            defense1: {
                id: 'defense1',
                name: 'Полимерный Щит',
                icon: '🛡️',
                type: 'defense',
                difficulty: 'Защита',
                stages: [
                    { name: "Углерод", weight: 25 },
                    { name: "Биоматериал", weight: 25 }
                ],
                description: "Защитное полимерное покрытие от атак для вашей команды"
            }
        };
        
        this.ingredientImages = {
            "Углерод": "/images/ingredients/soot.png",
            "Биоматериал": "/images/ingredients/herbs.png",
            "Азот": "/images/ingredients/dew.png"
        };
        
        this.ingredientClasses = {
            "Углерод": "soot",
            "Биоматериал": "herbs",
            "Азот": "dew"
        };
        
        this.ingredientShortNames = {
            "Углерод": "Углерод",
            "Биоматериал": "Биоматериал", 
            "Азот": "Азот"
        };
        
        this.MAX_WEIGHTS = 10;
        this.MAX_INGREDIENTS = 10;
        
        this.technicalMode = false;
        
        this.activeEffects = {
            inventoryBlocked: false,
            scalesBlocked: false,
            inventoryBlockTimer: null,
            scalesBlockTimer: null
        };
        
        window.onTutorialComplete = () => {
            this.initGame();
        };
        
        this.tutorial.startTutorial();
    }
    
    initGame() {
        this.connectToServer();
        this.setupEventListeners();
        this.setupKeyboardListeners();
        this.updatePlayerInfo();
        this.updateStatistics();
        this.updateUnlockProgress();
        this.updateInventoryCounters();
        this.setupOverlayEventListeners();
        this.startCooldownUpdateInterval(); // запускаем обновление таймеров
    }
    
    setupOverlayEventListeners() {
        document.getElementById('closePotionsModal').addEventListener('click', () => this.closePotionsModal());
        document.querySelector('.potions-backdrop').addEventListener('click', () => this.closePotionsModal());
        
        document.getElementById('closePotionInfoModal').addEventListener('click', () => this.closePotionInfoModal());
        document.getElementById('closePotionInfoButton').addEventListener('click', () => this.closePotionInfoModal());
        document.getElementById('usePotionInfoButton').addEventListener('click', () => this.useSelectedPotion());
        document.querySelector('.potion-info-backdrop').addEventListener('click', () => this.closePotionInfoModal());
        
        document.getElementById('closeAttackTargetModal').addEventListener('click', () => this.closeAttackTargetModal());
        document.getElementById('cancelAttackButton').addEventListener('click', () => this.closeAttackTargetModal());
        document.querySelector('.attack-target-backdrop').addEventListener('click', () => this.closeAttackTargetModal());
        document.getElementById('confirmAttackButton').addEventListener('click', () => this.confirmAttack());
    }
    
    connectToServer() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            this.socket.emit('register-player', {
                playerId: this.playerId,
                playerType: 'potionMaker',
                playerName: this.playerName,
                roomId: this.roomId
            });
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('game-state', (room) => {
            this.gameState.teamResources.weights = room.resources.weights || [];
            this.gameState.teamResources.ingredients = room.resources.ingredients || [];
            this.limitResources();
            this.updateResourceDisplay();
        });
        
        this.socket.on('weights-updated', (data) => {
            if (Array.isArray(data.weights)) {
                const currentWeightIds = this.gameState.teamResources.weights.map(w => w.id);
                const usedWeightIds = this.gameState.usedWeights.map(w => w.id);
                const recipeUsedWeightIds = this.gameState.recipeUsedResources.weights;
                
                const allExistingIds = [...currentWeightIds, ...usedWeightIds, ...recipeUsedWeightIds];
                
                const newWeights = data.weights.filter(weight => 
                    !allExistingIds.includes(weight.id)
                );
                
                if (newWeights.length > 0) {
                    this.gameState.teamResources.weights = [
                        ...this.gameState.teamResources.weights,
                        ...newWeights
                    ];
                    
                    this.limitResources();
                    this.updateResourceDisplay();
                }
            }
        });
        
        this.socket.on('ingredients-updated', (data) => {
            if (Array.isArray(data.ingredients)) {
                const currentIngredientIds = this.gameState.teamResources.ingredients.map(i => i.id);
                const usedIngredientId = this.gameState.usedIngredient ? this.gameState.usedIngredient.id : null;
                const recipeUsedIds = this.gameState.recipeUsedResources.ingredients;

                let allExistingIds = [...currentIngredientIds, ...recipeUsedIds];
                if (usedIngredientId) allExistingIds.push(usedIngredientId);
                
                const newIngredients = data.ingredients.filter(ingredient => 
                    !allExistingIds.includes(ingredient.id)
                );
                
                if (newIngredients.length > 0) {
                    this.gameState.teamResources.ingredients = [
                        ...this.gameState.teamResources.ingredients,
                        ...newIngredients
                    ];
                    
                    this.limitResources();
                    this.updateResourceDisplay();
                }
            }
        });
        
        this.socket.on('resources-updated', (data) => {
             console.log('Обновление ресурсов:', data);
        });
        
        this.socket.on('team-reward', (reward) => {
            this.showNotification(`${reward.message}`);
        });
        
        this.socket.on('potion-created', (data) => {
            this.updateTeamStats();
        });
        
        this.socket.on('error', (data) => {
            this.showNotification(`Ошибка: ${data.message}`);
        });
        
        this.socket.on('defense-activated', (data) => {
            this.gameState.defensePotionsActive = data.defenseCount || 1;
            this.updateStatistics();
            this.updateInventoryCounters();
            this.showNotification(`Защитное зелье "${data.potionName}" активировано!`);
        });
        
        this.socket.on('defense-destroyed', (data) => {
            this.gameState.defensePotionsActive = Math.max(0, this.gameState.defensePotionsActive - 1);
            this.updateStatistics();
            this.updateInventoryCounters();
            this.showNotification(`Защита команды уничтожена атакой!`);
        });
        
        this.socket.on('attack-used', (data) => {
            if (data.success) {
                this.showNotification(`Реагент "${data.potionName}" успешно использован против команды ${data.targetRoom}!`);
                // Обновляем список комнат, чтобы получить актуальные кулдауны
                this.socket.emit('get-rooms');
            } else {
                if (data.message) {
                    this.showNotification(data.message);
                } else {
                    this.showNotification(`Атака на команду ${data.targetRoom} отражена их защитой!`);
                }
            }
            // Разблокируем кнопку подтверждения
            document.getElementById('confirmAttackButton').disabled = false;
        });
        
        this.socket.on('attack-received', (data) => {
            this.handleAttackEffect(data);
            if (data.potionType === 'attack5') {
                blockInventory(1);
            } else if (data.potionType === 'attack6') {
                blockResources(30);
            }
        });
        
        this.socket.on('attack-blocked', (data) => {
            this.showDefenseNotification(data.attackerRoom);
        });
        
        this.socket.on('rooms-list', (rooms) => {
            this.availableRooms = rooms;
            // Обновляем информацию о кулдаунах для текущей команды
            const now = Date.now();
            this.gameState.roomCooldowns = {};
            rooms.forEach(room => {
                // Сервер передаёт cooldownEnd только для текущей команды
                if (room.cooldownEnd && room.cooldownEnd > now) {
                    this.gameState.roomCooldowns[room.id] = room.cooldownEnd;
                }
            });
            if (document.getElementById('attackTargetOverlay').classList.contains('active')) {
                this.renderTeamsInOverlay(rooms);
            }
        });
        
        this.socket.on('defense-used', (data) => {
            this.gameState.defensePotionsActive = 0;
            this.updateInventoryCounters();
            this.updateStatistics();
            this.showNotification(`Защита команды истощена, отразив атаку от команды ${data.attackerRoom}!`);
        });
    }
    
    limitResources() {
        if (this.gameState.teamResources.weights.length > this.MAX_WEIGHTS) {
            this.gameState.teamResources.weights = this.gameState.teamResources.weights.slice(
                this.gameState.teamResources.weights.length - this.MAX_WEIGHTS
            );
        }
        
        if (this.gameState.teamResources.ingredients.length > this.MAX_INGREDIENTS) {
            this.gameState.teamResources.ingredients = this.gameState.teamResources.ingredients.slice(
                this.gameState.teamResources.ingredients.length - this.MAX_INGREDIENTS
            );
        }
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('connectionStatus');
        
        if (connected) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = `Подключено | Комната: ${this.roomId}`;
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Отключено от сервера';
        }
    }
    
    setupEventListeners() {
        document.getElementById('checkRecipeButton').addEventListener('click', () => this.checkRecipe());
        document.getElementById('resetScalesButton').addEventListener('click', () => this.resetScales());
        
        document.getElementById('quickReagentButton').addEventListener('click', () => this.createQuickReagent());
        document.getElementById('attackDefenseButton').addEventListener('click', () => this.openPotionsModal('advanced'));
        document.getElementById('attackInventoryButton').addEventListener('click', () => this.openAttackInventory());
        document.getElementById('defenseInventoryButton').addEventListener('click', () => this.showDefenseInfo());
    }
    
    createQuickReagent() {
        const simpleRecipes = Object.values(this.recipes).filter(recipe => recipe.type === 'simple');
        if (simpleRecipes.length === 0) {
            this.showNotification("Нет доступных рецептов быстрых реагентов!");
            return;
        }
        const randomRecipe = simpleRecipes[Math.floor(Math.random() * simpleRecipes.length)];
        this.selectRecipe(randomRecipe.id);
        document.querySelectorAll('.potion-category-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('quickReagentButton').classList.add('active');
        document.getElementById('attackDefenseButton').classList.remove('active');
    }
    
    setupKeyboardListeners() {
        document.addEventListener('keydown', (event) => {
             if (event.key === 'l' || event.key === 'L') {
                event.preventDefault();
                this.technicalCompleteStage();
            }
            if (event.key === 'Escape') {
                this.tutorial.skipTutorial();
                this.closePotionsModal();
                this.closePotionInfoModal();
                this.closeAttackTargetModal();
            }
        });
    }
    
    openPotionsModal(type) {
        this.gameState.currentPotionType = type;
        
        const modal = document.getElementById('potionsOverlay');
        const title = document.getElementById('potionsModalTitle');
        const content = document.getElementById('potionsModalContent');
        
        if (type === 'simple') {
            title.textContent = 'Быстрые реагенты';
        } else {
            title.textContent = 'Реагенты атаки и защиты';
        }
        
        content.innerHTML = '';
        
        const recipes = Object.values(this.recipes).filter(recipe => {
            if (type === 'simple') {
                return recipe.type === 'simple';
            } else {
                return recipe.type === 'attack' || recipe.type === 'defense';
            }
        });
        
        if (recipes.length === 0) {
            content.innerHTML = '<div class="empty-resources">Нет доступных реагентов</div>';
            modal.classList.add('active');
            return;
        }
        
        recipes.forEach(recipe => {
            const isLocked = recipe.type !== 'simple' && !this.gameState.unlockedAdvanced;
            
            const potionOption = document.createElement('div');
            potionOption.className = `potion-option ${isLocked ? 'locked' : ''}`;
            potionOption.dataset.recipeId = recipe.id;
            
            if (isLocked) {
                potionOption.innerHTML = `
                    <div class="potion-option-icon">🔒</div>
                    <div class="potion-option-name">${recipe.name}</div>
                    <div class="potion-option-difficulty ${recipe.type}">${recipe.difficulty}</div>
                    <div class="potion-option-description">Создайте 5 быстрых реагентов для разблокировки</div>
                `;
            } else {
                potionOption.innerHTML = `
                    <div class="potion-option-icon">${recipe.icon}</div>
                    <div class="potion-option-name">${recipe.name}</div>
                    <div class="potion-option-difficulty ${recipe.type}">${recipe.difficulty}</div>
                    <div class="potion-option-description">${recipe.description}</div>
                `;
                potionOption.addEventListener('click', () => {
                    this.selectPotionFromModal(recipe.id);
                });
            }
            content.appendChild(potionOption);
        });
        
        modal.classList.add('active');
    }
    
    closePotionsModal() {
        document.getElementById('potionsOverlay').classList.remove('active');
        this.gameState.currentPotionType = null;
    }
    
    selectPotionFromModal(recipeId) {
        this.closePotionsModal();
        this.selectRecipe(recipeId);
        document.querySelectorAll('.potion-category-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('attackDefenseButton').classList.add('active');
        document.getElementById('quickReagentButton').classList.remove('active');
    }
    
    openAttackInventory() {
        if (this.activeEffects.inventoryBlocked) {
            this.showNotification("Инвентарь реагентов атаки заблокирован! Подождите, пока действие атаки закончится.");
            return;
        }
        
        if (this.gameState.attackPotionsInventory.length === 0) {
            this.showNotification("Инвентарь зелий атаки пуст!");
            return;
        }
        
        const modal = document.getElementById('potionsOverlay');
        const title = document.getElementById('potionsModalTitle');
        const content = document.getElementById('potionsModalContent');
        
        title.textContent = 'Инвентарь реагентов атаки';
        content.innerHTML = '';
        
        this.gameState.attackPotionsInventory.forEach(potion => {
            const potionOption = document.createElement('div');
            potionOption.className = 'potion-option';
            potionOption.dataset.potionId = potion.id;
            
            const recipe = Object.values(this.recipes).find(r => r.name === potion.name);
            
            potionOption.innerHTML = `
                <div class="potion-option-icon">${potion.icon}</div>
                <div class="potion-option-name">${potion.name}</div>
                <div class="potion-option-difficulty attack">Зелье атаки</div>
                <div class="potion-option-description">Нажмите для просмотра информации или использования</div>
            `;
            
            potionOption.addEventListener('click', () => this.showPotionInfo(potion, recipe));
            content.appendChild(potionOption);
        });
        
        modal.classList.add('active');
    }
    
    showPotionInfo(potion, recipe) {
        this.gameState.selectedInventoryPotion = potion;
        
        const modal = document.getElementById('potionInfoOverlay');
        const title = document.getElementById('potionInfoTitle');
        const content = document.getElementById('potionInfoContent');
        const useButton = document.getElementById('usePotionInfoButton');
        
        title.textContent = potion.name;
        
        useButton.style.display = 'block';
        useButton.textContent = 'Использовать реагент';
        
        let detailsHtml = '';
        if (recipe && recipe.attackDescription) {
            detailsHtml += `
                <div class="potion-info-stages">
                    <h4>Эффект атаки:</h4>
                    <div class="potion-info-stage">
                        <span class="stage-ingredient-name" style="width:100%; text-align:center;">${recipe.attackDescription}</span>
                    </div>
                </div>
            `;
        }
        
        content.innerHTML = `
            <div class="potion-info-details">
                <div class="potion-info-icon">${potion.icon}</div>
                <div class="potion-info-name">${potion.name}</div>
                <div class="potion-info-type attack">Реагент атаки</div>
                <div class="potion-info-description">${recipe?.description || 'Мощный реагент атаки.'}</div>
                ${detailsHtml}
            </div>
        `;
        
        this.closePotionsModal();
        modal.classList.add('active');
    }
    
    getRoleName(roleType) {
        const roleNames = {
            'weightGatherer': 'Кузнец',
            'ingredientGatherer': 'Собиратель',
            'potionMaker': 'Зельевар'
        };
        return roleNames[roleType] || roleType;
    }
    
    closePotionInfoModal() {
        document.getElementById('potionInfoOverlay').classList.remove('active');
        this.gameState.selectedInventoryPotion = null;
    }
    
    useSelectedPotion() {
        if (this.gameState.selectedInventoryPotion) {
            const potion = this.gameState.selectedInventoryPotion;
            let recipe = Object.values(this.recipes).find(r => r.name === potion.name);
            
            if (!recipe) {
                this.showNotification("Ошибка: рецепт реагента не найден.");
                return;
            }

            this.gameState.currentAttackPotion = {
                ...potion,
                recipe: recipe
            };
            
            this.closePotionInfoModal();
            this.showAttackTargetSelection();
        } else {
            this.showNotification("Ошибка: реагент не выбран.");
        }
    }
    
    showAttackTargetSelection() {
        if (!this.gameState.currentAttackPotion) return;
        
        const modal = document.getElementById('attackTargetOverlay');
        const title = document.getElementById('attackTargetTitle');
        const description = document.getElementById('attackDescription');
        const teamsGrid = document.getElementById('teamsGrid');
        const ingredientSelection = document.getElementById('ingredientSelection');
        const confirmButton = document.getElementById('confirmAttackButton');
        
        const potion = this.gameState.currentAttackPotion;
        const recipe = potion.recipe;
        
        title.textContent = `Атака: ${potion.name}`;
        
        // Убрана строка с "Цель:"
        description.innerHTML = `
            <h4>${potion.name}</h4>
            <p>${recipe.attackDescription || 'Атака на выбранную команду'}</p>
        `;
        
        this.gameState.selectedTargetRoom = null;
        this.gameState.selectedTargetIngredient = null;
        confirmButton.disabled = true;
        
        teamsGrid.innerHTML = '<div class="empty-resources">Загрузка команд...</div>';
        
        this.socket.emit('get-rooms');
        
        modal.classList.add('active');
        
        if (recipe.requiresIngredientChoice) {
            ingredientSelection.style.display = 'block';
            this.renderIngredientSelection();
        } else {
            ingredientSelection.style.display = 'none';
        }
    }
    
    renderTeamsInOverlay(rooms) {
        const teamsGrid = document.getElementById('teamsGrid');
        if (!teamsGrid) return;
        
        if (!rooms || rooms.length === 0) {
            teamsGrid.innerHTML = '<div class="empty-resources">Нет доступных команд</div>';
            return;
        }
        
        teamsGrid.innerHTML = '';
        
        const potion = this.gameState.currentAttackPotion;
        if (!potion) return;
        
        const recipe = potion.recipe;
        const now = Date.now();
        
        rooms.forEach(room => {
            if (room.id === this.roomId) return;
            
            const teamOption = document.createElement('div');
            teamOption.className = 'team-option';
            teamOption.dataset.roomId = room.id;
            
            const hasTargetRole = Object.values(room.players || {}).some(
                player => player.playerType === recipe.targetRole
            );
            
            // Проверяем кулдаун для этой команды (индивидуальный для текущего игрока)
            const cooldownEnd = this.gameState.roomCooldowns[room.id];
            const isOnCooldown = cooldownEnd && cooldownEnd > now;
            const cooldownRemaining = isOnCooldown ? cooldownEnd - now : 0;
            
            if (!hasTargetRole || isOnCooldown) {
                teamOption.classList.add('disabled');
                if (isOnCooldown) {
                    teamOption.classList.add('on-cooldown');
                    teamOption.title = `Кулдаун: ${this.formatTime(cooldownRemaining)}`;
                }
                if (!hasTargetRole) {
                    teamOption.title = 'В этой команде нет подходящей цели';
                }
            }
            
            let defenseStatus = room.defenseActive ? '🛡️' : '❌';
            
            let html = `
                <div class="team-icon">👥</div>
                <div class="team-name">${room.name || room.id}</div>
                <div class="team-players">Защита: ${defenseStatus}</div>
            `;
            
            if (isOnCooldown) {
                html += `<div class="cooldown-timer">Кулдаун: ${this.formatTime(cooldownRemaining)}</div>`;
            }
            
            teamOption.innerHTML = html;
            
            if (room.id === this.gameState.selectedTargetRoom) {
                teamOption.classList.add('selected');
            }
            
            if (hasTargetRole && !isOnCooldown) {
                teamOption.addEventListener('click', () => this.selectTargetRoom(room.id));
            }
            
            teamsGrid.appendChild(teamOption);
        });
    }
    
    renderIngredientSelection() {
        const ingredientsChoiceGrid = document.getElementById('ingredientsChoiceGrid');
        if (!ingredientsChoiceGrid) return;
        
        ingredientsChoiceGrid.innerHTML = '';
        
        const ingredients = [
            { id: 'Углерод', name: 'Углерод', icon: '🪵', description: 'Запретить углерод' },
            { id: 'Биоматериал', name: 'Биоматериал', icon: '🌿', description: 'Запретить биоматериал' },
            { id: 'Азот', name: 'Азот', icon: '💧', description: 'Запретить азот' }
        ];
        
        ingredients.forEach(ingredient => {
            const ingredientOption = document.createElement('div');
            ingredientOption.className = 'ingredient-choice-option';
            ingredientOption.dataset.ingredientId = ingredient.id;
            
            ingredientOption.innerHTML = `
                <div class="ingredient-choice-icon">${ingredient.icon}</div>
                <div class="ingredient-choice-name">${this.ingredientShortNames[ingredient.name] || ingredient.name}</div>
                <div class="ingredient-choice-description">${ingredient.description}</div>
            `;
            
            ingredientOption.addEventListener('click', () => this.selectTargetIngredient(ingredient.id));
            ingredientsChoiceGrid.appendChild(ingredientOption);
        });
    }
    
    selectTargetRoom(roomId) {
        const now = Date.now();
        const cooldownEnd = this.gameState.roomCooldowns[roomId];
        if (cooldownEnd && cooldownEnd > now) {
            const remaining = cooldownEnd - now;
            this.showNotification(`Эту команду нельзя атаковать еще ${this.formatTime(remaining)}!`);
            return;
        }
        
        this.gameState.selectedTargetRoom = roomId;
        
        document.querySelectorAll('.team-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.team-option[data-room-id="${roomId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        const potion = this.gameState.currentAttackPotion;
        const recipe = potion.recipe;
        
        if (recipe.requiresIngredientChoice && !this.gameState.selectedTargetIngredient) {
            document.getElementById('confirmAttackButton').disabled = true;
        } else {
            document.getElementById('confirmAttackButton').disabled = false;
        }
    }
    
    selectTargetIngredient(ingredientId) {
        this.gameState.selectedTargetIngredient = ingredientId;
        
        document.querySelectorAll('.ingredient-choice-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.ingredient-choice-option[data-ingredient-id="${ingredientId}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        if (this.gameState.selectedTargetRoom) {
            document.getElementById('confirmAttackButton').disabled = false;
        }
    }
    
    closeAttackTargetModal() {
        document.getElementById('attackTargetOverlay').classList.remove('active');
        this.gameState.currentAttackPotion = null;
        this.gameState.selectedTargetRoom = null;
        this.gameState.selectedTargetIngredient = null;
    }
    
    confirmAttack() {
        if (!this.gameState.currentAttackPotion || !this.gameState.selectedTargetRoom) {
            this.showNotification("Выберите цель для атаки!");
            return;
        }
        
        const potion = this.gameState.currentAttackPotion;
        const recipe = potion.recipe;
        
        if (recipe.requiresIngredientChoice && !this.gameState.selectedTargetIngredient) {
            this.showNotification("Выберите компонент для блокировки!");
            return;
        }
        
        // Проверяем кулдаун ещё раз (на случай устаревших данных)
        const now = Date.now();
        const cooldownEnd = this.gameState.roomCooldowns[this.gameState.selectedTargetRoom];
        if (cooldownEnd && cooldownEnd > now) {
            const remaining = cooldownEnd - now;
            this.showNotification(`Эту команду нельзя атаковать еще ${this.formatTime(remaining)}!`);
            return;
        }
        
        const potionIndex = this.gameState.attackPotionsInventory.findIndex(p => p.id === potion.id);
        if (potionIndex === -1) {
            this.showNotification("Ошибка: реагент не найден в инвентаре!");
            return;
        }
        
        // Удаляем зелье из инвентаря
        this.gameState.attackPotionsInventory.splice(potionIndex, 1);
        this.updateInventoryCounters();
        this.updateStatistics();
        
        // Блокируем кнопку, чтобы избежать повторных нажатий
        document.getElementById('confirmAttackButton').disabled = true;
        
        // Отправляем запрос на сервер
        this.socket.emit('use-attack-potion', {
            potionId: potion.id,
            potionName: potion.name,
            potionType: potion.recipe.id,
            targetRole: recipe.targetRole,
            roomId: this.roomId,
            targetRoom: this.gameState.selectedTargetRoom,
            targetIngredient: this.gameState.selectedTargetIngredient,
            playerId: this.playerId,
            playerName: this.playerName
        });
        
        this.closeAttackTargetModal();
    }
    
    handleAttackEffect(data) {
        const effectType = data.potionType;
        const duration = 60000;
        
        switch(effectType) {
            case 'attack3':
                this.showAttackEffectNotification(`Запрещен компонент "${data.targetIngredient}" у исследователя на 1 минуту!`);
                break;
            case 'attack4':
                this.showAttackEffectNotification(`Отправка компонентов заблокирована на 1 минуту!`);
                break;
            case 'attack5':
                this.applyInventoryBlock(duration);
                break;
            case 'attack6':
                this.applyScalesBlock(duration);
                break;
            default:
                this.showAttackEffectNotification(`На вашу команду совершена атака: ${data.potionName}`);
                break;
        }
        
        this.showAttackNotification(data);
    }
    
    applyInventoryBlock(duration) {
        if (this.activeEffects.inventoryBlocked) return;
        
        this.activeEffects.inventoryBlocked = true;
        
        const inventoryButton = document.getElementById('attackInventoryButton');
        if (inventoryButton) {
            inventoryButton.classList.add('blocked');
            inventoryButton.style.position = 'relative';
            inventoryButton.disabled = true;
            
            const timerElement = document.createElement('div');
            timerElement.className = 'inventory-timer';
            timerElement.id = 'inventoryBlockTimer';
            timerElement.textContent = '1:00';
            
            const buttonContent = inventoryButton.querySelector('.button-content');
            if (!buttonContent) {
                inventoryButton.appendChild(timerElement);
            } else {
                buttonContent.appendChild(timerElement);
            }
            
            let timeLeft = Math.floor(duration / 1000);
            const timerInterval = setInterval(() => {
                timeLeft--;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    this.removeInventoryBlock();
                }
            }, 1000);
            
            this.activeEffects.inventoryBlockTimer = timerInterval;
        }
        
        this.showAttackEffectNotification("Инвентарь реагентов атаки заблокирован на 1 минуту!");
    }
    
    removeInventoryBlock() {
        this.activeEffects.inventoryBlocked = false;
        
        const inventoryButton = document.getElementById('attackInventoryButton');
        if (inventoryButton) {
            inventoryButton.classList.remove('blocked');
            inventoryButton.disabled = false;
            
            const timerElement = document.getElementById('inventoryBlockTimer');
            if (timerElement) {
                timerElement.remove();
            }
        }
        
        if (this.activeEffects.inventoryBlockTimer) {
            clearInterval(this.activeEffects.inventoryBlockTimer);
            this.activeEffects.inventoryBlockTimer = null;
        }
        
        this.showNotification("Доступ к инвентарю реагентов атаки восстановлен!");
    }
    
    applyScalesBlock(duration) {
        if (this.activeEffects.scalesBlocked) return;
        
        this.activeEffects.scalesBlocked = true;
        
        const weightsGrid = document.getElementById('availableWeights');
        const ingredientsGrid = document.getElementById('availableIngredients');
        
        if (weightsGrid) {
            weightsGrid.classList.add('blocked');
            weightsGrid.style.position = 'relative';
            
            const blockedMsg = document.createElement('div');
            blockedMsg.className = 'blocked-message';
            blockedMsg.textContent = 'Заблокировано';
            blockedMsg.style.position = 'absolute';
            blockedMsg.style.top = '50%';
            blockedMsg.style.left = '50%';
            blockedMsg.style.transform = 'translate(-50%, -50%)';
            blockedMsg.style.zIndex = '10';
            blockedMsg.style.fontSize = '1.5rem';
            weightsGrid.appendChild(blockedMsg);
        }
        
        if (ingredientsGrid) {
            ingredientsGrid.classList.add('blocked');
            ingredientsGrid.style.position = 'relative';
            
            const blockedMsg = document.createElement('div');
            blockedMsg.className = 'blocked-message';
            blockedMsg.textContent = 'Заблокировано';
            blockedMsg.style.position = 'absolute';
            blockedMsg.style.top = '50%';
            blockedMsg.style.left = '50%';
            blockedMsg.style.transform = 'translate(-50%, -50%)';
            blockedMsg.style.zIndex = '10';
            blockedMsg.style.fontSize = '1.5rem';
            ingredientsGrid.appendChild(blockedMsg);
        }
        
        this.showAttackEffectNotification("Научный реактор заблокирован! Нельзя добавлять химикаты и компоненты на 1 минуту");
        
        this.activeEffects.scalesBlockTimer = setTimeout(() => {
            this.removeScalesBlock();
        }, duration);
    }
    
    removeScalesBlock() {
        this.activeEffects.scalesBlocked = false;
        
        const weightsGrid = document.getElementById('availableWeights');
        const ingredientsGrid = document.getElementById('availableIngredients');
        
        if (weightsGrid) {
            weightsGrid.classList.remove('blocked');
            const blockedMsg = weightsGrid.querySelector('.blocked-message');
            if (blockedMsg) {
                blockedMsg.remove();
            }
        }
        
        if (ingredientsGrid) {
            ingredientsGrid.classList.remove('blocked');
            const blockedMsg = ingredientsGrid.querySelector('.blocked-message');
            if (blockedMsg) {
                blockedMsg.remove();
            }
        }
        
        this.showNotification("Доступ к научному реактору восстановлен!");
    }
    
    showAttackNotification(data) {
        const notification = document.createElement('div');
        notification.className = 'attack-notification';
        notification.innerHTML = `
            <div>⚔️ Атака от команды ${data.attackerRoom}!</div>
            <div>${data.potionName}</div>
            <div>${data.attackerName || 'Неизвестный противник'}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showDefenseNotification(attackerRoom) {
        const notification = document.createElement('div');
        notification.className = 'defense-notification';
        notification.innerHTML = `
            <div>🛡️ Защита сработала!</div>
            <div>Атака от команды ${attackerRoom} отражена</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showAttackEffectNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'attack-notification';
        notification.textContent = `⚔️ ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    showDefenseInfo() {
        const modal = document.getElementById('potionInfoOverlay');
        const title = document.getElementById('potionInfoTitle');
        const content = document.getElementById('potionInfoContent');
        const useButton = document.getElementById('usePotionInfoButton');
        
        title.textContent = 'Активная защита';
        
        useButton.style.display = 'none';
        
        const hasDefense = this.gameState.defensePotionsActive > 0;
        
        content.innerHTML = `
            <div class="potion-info-details">
                <div class="potion-info-icon">🛡️</div>
                <div class="potion-info-name">Защитные зелья</div>
                <div class="potion-info-type defense">Активные: ${this.gameState.defensePotionsActive}</div>
                <div class="potion-info-description">
                    ${hasDefense 
                        ? 'Ваша команда защищена мощным щитом. Он может поглотить одну атаку.' 
                        : 'У вашей команды нет активной защиты. Создайте реагент защиты для усиления защиты!'}
                </div>
                <div class="potion-info-stages">
                    <h4>Текущий статус защиты:</h4>
                    <div class="potion-info-stage">
                        <span class="stage-ingredient-name">Активных защит</span>
                        <span class="stage-ingredient-weight">${this.gameState.defensePotionsActive}</span>
                    </div>
                    <div class="potion-info-stage">
                        <span class="stage-ingredient-name">Защита команды</span>
                        <span class="stage-ingredient-weight">${hasDefense ? 'Активна' : 'Отсутствует'}</span>
                    </div>
                    <div class="potion-info-stage">
                        <span class="stage-ingredient-name">Максимум защит</span>
                        <span class="stage-ingredient-weight">1</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }
    
    updateUnlockProgress() {
        const progressFill = document.getElementById('unlockProgressFill');
        const quickReagentProgress = document.getElementById('quickReagentProgress');
        const attackDefenseButton = document.getElementById('attackDefenseButton');
        const buttonProgress = attackDefenseButton.querySelector('.button-progress');
        const unlockProgressBar = attackDefenseButton.querySelector('.unlock-progress-bar');
        
        if (progressFill) {
            const progress = (this.gameState.simplePotionsCreated / 5) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (quickReagentProgress) {
            quickReagentProgress.textContent = `${this.gameState.simplePotionsCreated}/5`;
        }
        
        if (this.gameState.simplePotionsCreated >= 5 && !this.gameState.unlockedAdvanced) {
            this.unlockAdvancedRecipes();
        }
        
        if (attackDefenseButton) {
            if (this.gameState.unlockedAdvanced) {
                attackDefenseButton.classList.remove('disabled');
                attackDefenseButton.disabled = false;
                attackDefenseButton.querySelector('.lock-icon').textContent = '🔓';
                buttonProgress.textContent = 'Разблокировано';
                if (unlockProgressBar) {
                    unlockProgressBar.style.display = 'none';
                }
            } else {
                buttonProgress.textContent = `${this.gameState.simplePotionsCreated}/5`;
                if (progressFill) {
                    const progress = (this.gameState.simplePotionsCreated / 5) * 100;
                    progressFill.style.width = `${progress}%`;
                }
            }
        }
    }
    
    updateInventoryCounters() {
        document.getElementById('attackInventoryCount').textContent = this.gameState.attackPotionsInventory.length;
        document.getElementById('defenseInventoryCount').textContent = this.gameState.defensePotionsActive;
    }
    
    unlockAdvancedRecipes() {
        this.gameState.unlockedAdvanced = true;
        
        const attackDefenseButton = document.getElementById('attackDefenseButton');
        if (attackDefenseButton) {
            attackDefenseButton.classList.remove('disabled');
            attackDefenseButton.disabled = false;
            attackDefenseButton.querySelector('.lock-icon').textContent = '🔓';
            attackDefenseButton.classList.add('unlocked');
            setTimeout(() => {
                attackDefenseButton.classList.remove('unlocked');
            }, 4000);
        }
        
        this.showNotification("Реагенты атаки и защиты разблокированы!");
    }
    
    selectRecipe(recipeId) {
        const recipe = this.recipes[recipeId];
        
        if (recipe.type !== 'simple' && !this.gameState.unlockedAdvanced) {
            this.showNotification("Сначала создайте 5 быстрых реагентов для разблокировки!");
            return;
        }
        
        if (recipe.type === 'defense' && this.gameState.defensePotionsActive >= 1) {
            this.showNotification("У вашей команды уже есть активная защита! Максимум - 1 реагент защиты.");
            return;
        }
        
        this.startRecipe(recipe);
    }
    
    startRecipe(recipe) {
        this.gameState.selectedRecipe = recipe;
        this.gameState.currentStageIndex = 0;
        this.gameState.recipeUsedResources = { weights: [], ingredients: [] };
        
        this.resetScales();
        this.updateRecipeInfo();
        this.renderStages();
    }
    
    updateRecipeInfo() {
        const recipeInfo = document.getElementById('currentRecipeInfo');
        const recipe = this.gameState.selectedRecipe;
        
        if (!recipe) {
            recipeInfo.innerHTML = `
                <div class="no-recipe-selected">
                    <div class="placeholder-icon">⚗️</div>
                    <p>Выберите зелье для создания</p>
                </div>
            `;
            return;
        }
        
        const displayName = recipe.type === 'simple' ? 'Быстрый реагент' : recipe.name;
        const displayDescription = recipe.type === 'simple' ? 'Случайный быстрый реагент для быстрого создания' : recipe.description;
        const displayIcon = recipe.type === 'simple' ? '⚗️' : recipe.icon;
        
        recipeInfo.innerHTML = `
            <div class="selected-recipe">
                <div class="recipe-header">
                    <span class="recipe-icon-big">${displayIcon}</span>
                    <div>
                        <h4>${displayName}</h4>
                        <span class="recipe-type ${recipe.type}">${recipe.difficulty}</span>
                    </div>
                </div>
                <p class="recipe-description">${displayDescription}</p>
                <div class="recipe-stats">
                    <div>Этап: ${this.gameState.currentStageIndex + 1} из ${recipe.stages.length}</div>
                </div>
            </div>
        `;
    }
    
    renderStages() {
        const stagesList = document.getElementById('stagesList');
        const recipe = this.gameState.selectedRecipe;
        
        if (!recipe) {
            stagesList.innerHTML = `
                <div class="stage-empty">
                    <div class="placeholder-icon">📋</div>
                    <p>Этапы появятся здесь</p>
                </div>
            `;
            return;
        }
        
        stagesList.innerHTML = '';
        
        recipe.stages.forEach((stage, index) => {
            const stageElement = document.createElement('div');
            stageElement.className = 'stage-item';
            
            if (index < this.gameState.currentStageIndex) {
                stageElement.classList.add('completed');
            } else if (index === this.gameState.currentStageIndex) {
                stageElement.classList.add('active');
            }
            
            const ingredientName = this.ingredientShortNames[stage.name] || stage.name;
            
            stageElement.innerHTML = `
                <div class="stage-number">Этап ${index + 1}</div>
                <div class="stage-details">
                    <div class="stage-ingredient">${ingredientName}</div>
                    <div class="stage-weight">${stage.weight} хим.</div>
                </div>
                ${index < this.gameState.currentStageIndex ? '<div class="stage-check">✓</div>' : ''}
            `;
            
            stagesList.appendChild(stageElement);
        });
        
        this.updateRecipeInfo();
    }
    
    updateResourceDisplay() {
        const weightsCount = this.gameState.teamResources.weights.length;
        const ingredientsCount = this.gameState.teamResources.ingredients.length;
        
        this.updateAvailableWeights();
        this.updateAvailableIngredients();
    }
    
    updateAvailableWeights() {
        const container = document.getElementById('availableWeights');
        container.innerHTML = '';
        
        const availableWeights = this.gameState.teamResources.weights.filter(weight => 
            !this.gameState.usedWeights.some(used => used.id === weight.id)
        );
        
        if (availableWeights.length === 0) {
            container.innerHTML = '<div class="empty-resources">Химикаты еще не получены</div>';
            return;
        }
        
        if (this.gameState.teamResources.weights.length >= this.MAX_WEIGHTS) {
            const overflowIndicator = document.createElement('div');
            overflowIndicator.className = 'overflow-indicator';
            overflowIndicator.textContent = 'МАКС';
            overflowIndicator.title = 'Достигнут максимальный лимит химикатов. Новые химикаты будут заменять старые.';
            container.appendChild(overflowIndicator);
        }
        
        availableWeights.forEach(weight => {
            const weightElement = this.createWeightElement(weight, true);
            container.appendChild(weightElement);
        });
    }
    
    updateAvailableIngredients() {
        const container = document.getElementById('availableIngredients');
        container.innerHTML = '';
        
        const availableIngredients = this.gameState.teamResources.ingredients.filter(ingredient => 
            !this.gameState.usedIngredient || this.gameState.usedIngredient.id !== ingredient.id
        );
        
        if (availableIngredients.length === 0) {
            container.innerHTML = '<div class="empty-resources">Компоненты еще не получены</div>';
            return;
        }
        
        if (this.gameState.teamResources.ingredients.length >= this.MAX_INGREDIENTS) {
            const overflowIndicator = document.createElement('div');
            overflowIndicator.className = 'overflow-indicator';
            overflowIndicator.textContent = 'МАКС';
            overflowIndicator.title = 'Достигнут максимальный лимит компонентов. Новые компоненты будут заменять старые.';
            container.appendChild(overflowIndicator);
        }
        
        availableIngredients.forEach(ingredient => {
            const ingElement = this.createIngredientElement(ingredient, true);
            container.appendChild(ingElement);
        });
    }
    
    createWeightElement(weight, isAvailable = true) {
        const element = document.createElement('div');
        element.className = 'weight';
        element.dataset.id = weight.id;
        element.dataset.value = weight.value;
        
        let weightSize = 'medium';
        if (weight.value <= 5) weightSize = 'small';
        else if (weight.value >= 20) weightSize = 'large';
        
        element.style.backgroundImage = `url(/images/weights/${weightSize}.png)`;
        
        const weightText = document.createElement('div');
        weightText.className = 'weight-value';
        weightText.textContent = weight.value;
        element.appendChild(weightText);
        
        element.title = `Гиря ${weight.value} хим. (клик - добавить, на весах - клик для возврата)`;
        
        if (isAvailable && !this.activeEffects.scalesBlocked) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => this.addWeightToScales(weight));
        } else if (!this.activeEffects.scalesBlocked) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => this.returnWeightFromScales(weight.id));
        } else {
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.5';
        }
        
        return element;
    }
    
    createIngredientElement(ingredient, isAvailable = true) {
        const element = document.createElement('div');
        element.className = `ingredient ${this.ingredientClasses[ingredient.name] || "soot"}`;
        element.dataset.id = ingredient.id;
        element.dataset.name = ingredient.name;
        
        const ingredientImage = this.ingredientImages[ingredient.name];
        if (ingredientImage) {
            element.style.backgroundImage = `url(${ingredientImage})`;
        }
        
        const ingText = document.createElement('div');
        ingText.className = 'ingredient-name';
        ingText.textContent = this.ingredientShortNames[ingredient.name] || ingredient.name;
        element.appendChild(ingText);
        
        element.title = `${ingredient.name} (клик - добавить, на весах - клик для возврата)`;
        
        if (isAvailable && !this.activeEffects.scalesBlocked) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => this.addIngredientToScales(ingredient));
        } else if (!this.activeEffects.scalesBlocked) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => this.returnIngredientFromScales(ingredient.id));
        } else {
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.5';
        }
        
        return element;
    }
    
    addWeightToScales(weight) {
        if (this.gameState.usedWeights.length >= 4) {
            this.showNotification("Можно добавить не более 4 химикатов на весы!");
            return;
        }
        
        const weightIndex = this.gameState.teamResources.weights.findIndex(w => w.id === weight.id);
        if (weightIndex !== -1) {
            this.gameState.teamResources.weights.splice(weightIndex, 1);
            this.gameState.usedWeights.push(weight);
            
            const weightElement = this.createWeightElement(weight, false);
            document.getElementById('leftPanContent').appendChild(weightElement);
            
            this.gameState.leftWeight += weight.value;
            this.updateScaleDisplay();
            this.updateScaleBalance();
            this.updateAvailableWeights();
        }
    }
    
    returnWeightFromScales(weightId) {
        const weightIndex = this.gameState.usedWeights.findIndex(w => w.id === weightId);
        if (weightIndex !== -1) {
            const weight = this.gameState.usedWeights.splice(weightIndex, 1)[0];
            this.gameState.teamResources.weights.push(weight);
            
            const weightElement = document.querySelector(`.weight[data-id="${weightId}"]`);
            if (weightElement) {
                weightElement.remove();
            }
            
            this.gameState.leftWeight -= weight.value;
            this.updateScaleDisplay();
            this.updateScaleBalance();
            this.updateAvailableWeights();
        }
    }
    
    addIngredientToScales(ingredient) {
        if (this.gameState.usedIngredient) {
            this.returnIngredientFromScales(this.gameState.usedIngredient.id);
        }
        
        const ingIndex = this.gameState.teamResources.ingredients.findIndex(i => i.id === ingredient.id);
        if (ingIndex !== -1) {
            this.gameState.teamResources.ingredients.splice(ingIndex, 1);
            this.gameState.usedIngredient = ingredient;
            this.gameState.currentIngredientName = ingredient.name;
            
            const ingElement = this.createIngredientElement(ingredient, false);
            document.getElementById('rightPanContent').innerHTML = '';
            document.getElementById('rightPanContent').appendChild(ingElement);
            
            if (ingredient.value) {
                this.gameState.rightWeight = ingredient.value;
            }
            
            this.updateScaleDisplay();
            this.updateScaleBalance();
            this.updateAvailableIngredients();
        }
    }
    
    returnIngredientFromScales(ingredientId) {
        if (this.gameState.usedIngredient && this.gameState.usedIngredient.id === ingredientId) {
            const ingredient = this.gameState.usedIngredient;
            this.gameState.teamResources.ingredients.push(ingredient);
            this.gameState.usedIngredient = null;
            this.gameState.currentIngredientName = null;
            
            document.getElementById('rightPanContent').innerHTML = '';
            
            this.gameState.rightWeight = 0;
            this.updateScaleDisplay();
            this.updateScaleBalance();
            this.updateAvailableIngredients();
        }
    }
    
    updateScaleDisplay() {
        document.getElementById('leftWeightValue').textContent = this.gameState.leftWeight;
        document.getElementById('rightWeightValue').textContent = this.gameState.rightWeight;
    }
    
    updateScaleBalance() {
        const difference = this.gameState.leftWeight - this.gameState.rightWeight;
        const maxTilt = 15;
        const scaleBeam = document.getElementById('scaleBeam');
        
        if (!scaleBeam) return;
        
        if (Math.abs(difference) <= 0.1) {
            scaleBeam.style.transform = 'rotate(0deg)';
        } else if (difference > 0) {
            const tilt = Math.min(difference / 5, maxTilt);
            scaleBeam.style.transform = `rotate(-${tilt}deg)`;
        } else {
            const tilt = Math.min(Math.abs(difference) / 5, maxTilt);
            scaleBeam.style.transform = `rotate(${tilt}deg)`;
        }
    }
    
    resetScales() {
        if (this.gameState.usedIngredient) {
            this.gameState.teamResources.ingredients.push(this.gameState.usedIngredient);
        }
        this.gameState.usedWeights.forEach(w => this.gameState.teamResources.weights.push(w));
        
        this.clearScalesData();
        
        this.updateScaleDisplay();
        this.updateScaleBalance();
        this.updateAvailableWeights();
        this.updateAvailableIngredients();
        
        forceUnblockResources();
    }
    
    clearScales() {
        this.clearScalesData();
        this.updateScaleDisplay();
        this.updateScaleBalance();
        this.updateAvailableWeights();
        this.updateAvailableIngredients();
    }
    
    clearScalesData() {
        this.gameState.usedIngredient = null;
        this.gameState.currentIngredientName = null;
        this.gameState.usedWeights = [];
        this.gameState.leftWeight = 0;
        this.gameState.rightWeight = 0;
        
        document.getElementById('rightPanContent').innerHTML = '';
        document.getElementById('leftPanContent').innerHTML = '<div class="weight-limit-message" id="weightLimitMessage">Макс. 4 химиката</div>';
    }
    
    checkRecipe() {
        if (!this.gameState.selectedRecipe) {
            this.showNotification("Сначала выберите тип реагента для создания!");
            return;
        }
        
        const recipe = this.gameState.selectedRecipe;
        const currentStage = recipe.stages[this.gameState.currentStageIndex];
        
        if (!currentStage) {
            this.showNotification("Ошибка этапа!");
            return;
        }
        
        if (!this.gameState.currentIngredientName) {
            const ingredientName = this.ingredientShortNames[currentStage.name] || currentStage.name;
            this.showNotification(`Нужен ингредиент: ${ingredientName}`);
            return;
        }
        
        if (this.gameState.currentIngredientName !== currentStage.name) {
            const needed = this.ingredientShortNames[currentStage.name] || currentStage.name;
            const current = this.ingredientShortNames[this.gameState.currentIngredientName] || this.gameState.currentIngredientName;
            this.showNotification(`Ошибка! Нужен: ${needed}. У вас: ${current}`);
            this.resetScales(); 
            return;
        }
        
        const weightDifference = Math.abs(this.gameState.leftWeight - currentStage.weight);
        if (weightDifference <= 0.5) {
            this.showNotification(`Этап ${this.gameState.currentStageIndex + 1} завершен!`);
            
            this.gameState.usedWeights.forEach(w => this.gameState.recipeUsedResources.weights.push(w.id));
            if (this.gameState.usedIngredient) {
                this.gameState.recipeUsedResources.ingredients.push(this.gameState.usedIngredient.id);
            }
            
            this.gameState.currentStageIndex++;
            this.clearScales(); 
            
            if (this.gameState.currentStageIndex >= recipe.stages.length) {
                this.completeRecipe();
            } else {
                this.renderStages();
            }
        } else {
            this.showNotification(`Нужно ${currentStage.weight} хим., у вас ${this.gameState.leftWeight}`);
        }
    }
    
    completeRecipe() {
        const recipe = this.gameState.selectedRecipe;
        
        this.gameState.totalPotionsCreated++;
        
        if (recipe.type === 'simple') {
            this.gameState.simplePotionsCreated++;
            this.updateUnlockProgress();
            this.showNotification(`Быстрый реагент создан!`);
        } else if (recipe.type === 'attack') {
            this.gameState.attackPotionsInventory.push({
                id: Date.now(),
                name: recipe.name,
                icon: recipe.icon
            });
            this.updateInventoryCounters();
            this.showNotification(`Реагент "${recipe.name}" создан!`);
        } else if (recipe.type === 'defense') {
            if (this.gameState.defensePotionsActive < 1) {
                this.socket.emit('activate-defense', {
                    potionId: Date.now(),
                    potionName: recipe.name,
                    roomId: this.roomId,
                    playerId: this.playerId
                });
            }
        }
        
        this.socket.emit('use-resources', {
            weightsUsed: this.gameState.recipeUsedResources.weights,
            ingredientsUsed: this.gameState.recipeUsedResources.ingredients,
            roomId: this.roomId
        });
        
        this.socket.emit('create-potion', {
            potion: { name: recipe.name, type: recipe.type },
            playerId: this.playerId,
            roomId: this.roomId
        });
        
        this.updateStatistics();
        this.updateTeamStats();
        
        this.gameState.selectedRecipe = null;
        this.gameState.currentStageIndex = 0;
        this.gameState.recipeUsedResources = { weights: [], ingredients: [] };
        
        this.updateRecipeInfo();
        this.renderStages();
        
        const selectedDisplay = document.getElementById('selectedRecipeDisplay');
        selectedDisplay.innerHTML = '';
        
        document.querySelectorAll('.potion-category-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById('quickReagentButton').classList.add('active');
    }
    
    getTargetRoom() {
        const roomNumber = parseInt(this.roomId.replace('room', ''));
        const targetRoomNumber = roomNumber % 3 + 1;
        return `room${targetRoomNumber}`;
    }
    
    updateStatistics() {
        document.getElementById('potionsCreated').textContent = this.gameState.totalPotionsCreated;
    }
    
    updateTeamStats() {
        this.socket.emit('get-team-stats', { roomId: this.roomId });
    }
    
    updatePlayerInfo() {
        const statusText = document.getElementById('connectionStatus');
        if (statusText) {
            statusText.textContent = `Комната: ${this.roomId.toUpperCase()} | Игрок: ${this.playerName}`;
        }
    }
    
    technicalCompleteStage() {
        if (!this.gameState.selectedRecipe) {
            this.createQuickReagent();
        }
        
        const recipe = this.gameState.selectedRecipe;
        const currentStage = recipe.stages[this.gameState.currentStageIndex];
        
        this.technicalMode = true;
        this.gameState.currentIngredientName = currentStage.name;
        this.gameState.leftWeight = currentStage.weight;
        
        setTimeout(() => {
            this.checkRecipe();
            this.technicalMode = false;
        }, 200);
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'temp-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    // ===== Управление динамическими таймерами кулдаунов =====
    startCooldownUpdateInterval() {
        if (this.cooldownInterval) clearInterval(this.cooldownInterval);
        this.cooldownInterval = setInterval(() => {
            this.updateCooldownTimers();
        }, 1000);
    }
    
    updateCooldownTimers() {
        // Обновляем только если открыт оверлей атаки
        if (!document.getElementById('attackTargetOverlay').classList.contains('active')) return;
        
        const teamOptions = document.querySelectorAll('.team-option');
        const now = Date.now();
        teamOptions.forEach(option => {
            const roomId = option.dataset.roomId;
            if (roomId && this.gameState.roomCooldowns[roomId]) {
                const remaining = this.gameState.roomCooldowns[roomId] - now;
                if (remaining > 0) {
                    const cooldownElement = option.querySelector('.cooldown-timer');
                    if (cooldownElement) {
                        cooldownElement.textContent = `Кулдаун: ${this.formatTime(remaining)}`;
                    }
                } else {
                    // Если кулдаун истёк, удаляем из состояния и запрашиваем обновление
                    delete this.gameState.roomCooldowns[roomId];
                    this.socket.emit('get-rooms'); // обновим список, чтобы убрать блокировку
                }
            }
        });
    }
    
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    .selected-recipe {
        text-align: center;
        width: 100%;
    }
    
    .recipe-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        justify-content: center;
    }
    
    .recipe-icon-big {
        font-size: 3rem;
    }
    
    .recipe-type {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: bold;
    }
    
    .recipe-type.simple {
        background: rgba(76, 175, 80, 0.3);
        color: #a5d6a7;
    }
    
    .recipe-type.attack {
        background: rgba(244, 67, 54, 0.3);
        color: #ffab91;
    }
    
    .recipe-type.defense {
        background: rgba(33, 150, 243, 0.3);
        color: #90caf9;
    }
    
    .recipe-description {
        color: #bdbdbd;
        margin-bottom: 15px;
        font-size: 0.9rem;
    }
    
    .recipe-stats {
        display: flex;
        justify-content: space-around;
        color: #ffcc80;
        font-size: 0.9rem;
    }
    
    .inventory-item {
        display: flex;
        align-items: center;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid transparent;
    }
    
    .inventory-item:hover {
        background: rgba(139, 69, 19, 0.4);
    }
    
    .inventory-item.selected {
        border-color: #ffcc80;
        background: rgba(212, 175, 55, 0.2);
    }
    
    .potion-icon {
        font-size: 1.5rem;
        margin-right: 10px;
    }
    
    .potion-name {
        flex: 1;
        color: #f0e6d6;
    }
    
    .potion-option.locked {
        opacity: 0.6;
        cursor: not-allowed;
        background: rgba(0, 0, 0, 0.5);
    }
    
    .potion-option.locked:hover {
        transform: none;
        border-color: transparent;
        background: rgba(0, 0, 0, 0.5);
    }
    
    .tutorial-note {
        color: #ffcc80;
        font-style: italic;
        margin-top: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        border-left: 3px solid #d4af37;
    }
    
    .weight-limit-message {
        position: absolute;
        top: -25px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 0.8rem;
        color: #ffcc80;
        opacity: 0.7;
        font-style: italic;
    }
    
    .inventory-timer {
        background: rgba(244, 67, 54, 0.8);
        color: white;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 0.8rem;
        margin-left: 5px;
        display: inline-block;
    }
    
    .cooldown-timer {
        background: rgba(244, 67, 54, 0.8);
        color: white;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 0.8rem;
        margin-top: 5px;
        display: inline-block;
    }
    
    .team-option.on-cooldown {
        opacity: 0.6;
        cursor: not-allowed;
        position: relative;
    }
    
    .team-option.on-cooldown::after {
        content: "⏳";
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 1.2rem;
    }
    
    .team-option.on-cooldown:hover {
        transform: none;
        border-color: #5d4037;
        background: rgba(0, 0, 0, 0.5);
    }
    
    .overflow-indicator {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 4px;
        border-radius: 4px;
        z-index: 5;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new PotionMakerGame();
});