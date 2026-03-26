class TutorialSystem {
    constructor() {
        this.stages = [
            {
                id: 1,
                title: "Приветствие",
                characterImage: "images/stage1.png",
                dialogue: "Привет, меня зовут Амалия, я главный ученый в этом научном комплексе. Добро пожаловать в химическую лабораторию! Я помогу тебе освоиться в создании химикатов.",
                mainOverlay: null,
                duration: 8000,
                showMainOverlay: false
            },
            {
                id: 2,
                title: "Выбор номинала",
                characterImage: "images/stage2pl3.png",
                dialogue: "Сначала выбери количество химиката, которую хочешь создать, или спроси у лаборанта. Каждое количество химиката требует уникальной комбинации сырья.",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <p>1. В центре экрана выбери количество химиката (1, 2, 5, 10 или 20)</p>
                        <p>2. Каждое кол-во химиката имеет свой секретный рецепт</p>
                        <p>3. Необходимо перетягивать сырье в колбу зажимая ЛКМ</p>
                        <p>4. Далее необходимо подбирать подходящее сырье под рецепт выбранного кол-ва химиката</p>
                    </div>
                `,
                duration: 12000,
                showMainOverlay: true
            },
            {
                id: 3,
                title: "Индикатор соответствия",
                characterImage: "images/stage2pl3.png",
                dialogue: "Следи за индикатором соответствия рецепту. Когда он станет зеленым и заполнится на 100% - можно создать химикат!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <p>🟥 Красный - неправильная комбинация (этого сырья нет в рецепте выбранного кол-ва химикатов)</p>
                        <p>🟧 Оранжевый - частичное совпадение (это сырье есть в рецепте выбранного кол-ва химикатов</p>
                        <p>🟩 Зеленый 100% - правильная комбинация! (всё сырье в колбе соответствует рецепту)</p>
                    </div>
                `,
                duration: 12000,
                showMainOverlay: true
            },
            {
                id: 4,
                title: "Сохранение рецептов",
                characterImage: "images/stage2pl3.png",
                dialogue: "Сохраняй успешные рецепты в разделе 'Технологии создания химикатов'. Это позволит быстро повторять удачные комбинации.",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Сохранение рецептов</h3>
                        <p>1. После успешного создания запомни компбинацию и нажми кнопку "+" в правой панели</p>
                        <p>2. Выберите количество химиката и сырье для рецепта</p>
                        <p>3. Сохраните рецепт для быстрого повторения</p>
                        <p>4. В сохраненных рецептах можно применять их одним кликом</p>
                    </div>
                `,
                duration: 15000,
                showMainOverlay: true
            },
            {
                id: 5,
                title: "Отправка гирь",
                characterImage: "images/stage4new.png",
                dialogue: "Созданные химикаты отправляй Лаборанту для создания реагентов. Это принесет очки вашей команде!",
                mainOverlay: `
                    <div class="tutorial-main-content">
                        <h3>Отправка химикатов и взаимодействие</h3>
                        <p>1. Созданные химикаты отображаются в правой панели</p>
                        <p>2. Нажмите "Отправить" чтобы отправить химикат Лаборанту</p>
                    </div>
                `,
                duration: 12000,
                showMainOverlay: true
            },
            {
                id: 6,
                title: "Удачи!",
                characterImage: "images/stage1.png",
                dialogue: "Теперь ты готов к работе! Помни - правильная комбинация сырья это ключ к успеху. Удачи в создании химикатов!",
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
        // Проверяем, не отключил ли пользователь показ обучения
        const dontShowAgain = localStorage.getItem('weightForgeTutorialDisabled');
        if (dontShowAgain === 'true') {
            if (typeof window.onTutorialComplete === 'function') {
                window.onTutorialComplete();
            }
            return;
        }
        
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
        
        // Используем заглушку для изображения, если нет реального файла
        this.characterImage.src = stage.characterImage;
        // Добавляем обработчик ошибок для изображения
        this.characterImage.onerror = () => {
            this.characterImage.style.display = 'none';
        };
        
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

class WeightForgeGame {
    constructor() {
        this.tutorial = new TutorialSystem();
        this.socket = null;
        this.playerId = 'player1_' + Math.random().toString(36).substr(2, 9);
        
        const pathSegments = window.location.pathname.split('/');
        this.roomId = pathSegments[pathSegments.length - 1] || 'room1';
        const urlParams = new URLSearchParams(window.location.search);
        this.playerName = urlParams.get('playerName') || 'Игрок';
        
        this.weights = [];
        this.oresInCrucible = [];
        this.recipes = [];
        
        // Секретные рецепты для каждого номинала (убраны 50 и 100)
        this.secretRecipes = {
            1: [1],  // 1 гиря: Алый металл
            2: [4, 5],  // 2 гири: Изумрудный + Сапфировый
            5: [3, 8, 7],  // 5 гирь: Золотой + Фиолетовый + Темный
            10: [2, 6, 9, 10],  // 10 гирь: Лазурный + Розовый + Оранжевый + Светло-зеленый
            20: [1, 2, 3, 4]  // 20 гирь: Алый + Лазурный + Золотой + Изумрудный
        };
        
        // Оригинальные металлы
        this.originalOres = [
            { id: 1, color: '#FF6B6B', name: 'Плазма', inReactor: false },
            { id: 2, color: '#4ECDC4', name: 'Вода', inReactor: false },
            { id: 3, color: '#FFD166', name: 'Кислота', inReactor: false },
            { id: 4, color: '#06D6A0', name: 'Органика', inReactor: false },
            { id: 5, color: '#118AB2', name: 'Фосфор', inReactor: false },
            { id: 6, color: '#EF476F', name: 'Электролит', inReactor: false },
            { id: 7, color: '#073B4C', name: 'Металл', inReactor: false },
            { id: 8, color: '#7209B7', name: 'Щелочь', inReactor: false },
            { id: 9, color: '#F3722C', name: 'Полимер', inReactor: false },
            { id: 10, color: '#90BE6D', name: 'Нейтрализатор', inReactor: false }
        ];
        
        // Текущие металлы (могут быть изменены атакой)
        this.ores = JSON.parse(JSON.stringify(this.originalOres));
        
        // Номиналы гирь (убраны 50 и 100)
        this.weightOptions = [
            { value: 1, name: "1 ед." },
            { value: 2, name: "2 ед." },
            { value: 5, name: "5 ед." },
            { value: 10, name: "10 ед." },
            { value: 20, name: "20 ед." }
        ];
        
        this.castingState = {
            selectedWeight: null,
            isCorrectRecipe: false
        };
        
        this.recipeState = {
            isCreating: false,
            selectedWeight: null,
            selectedMetals: []
        };
        
        // Система атак
        this.activeAttacks = {
            recipeDestroyed: false, // Атака 1: Зелье Разрушения Рецептов
            metalsChaos: false,     // Атака 2: Зелье Хаоса Металлов
            metalsChaosTimer: null, // Таймер для восстановления металлов
            metalsChaosData: null   // Данные для восстановления после атаки
        };
        
        this.defenseActive = false;
        
        window.onTutorialComplete = () => {
            this.init();
        };
        
        this.tutorial.startTutorial();
    }
    
    init() {
        this.connectToServer();
        this.setupEventListeners();
        this.setupKeyListener();
        this.populateOreList();
        this.populateWeightOptions();
        this.loadRecipes();
        this.updateDisplay();
    }
    
    connectToServer() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateConnectionStatus(true);
            this.socket.emit('register-player', {
                playerId: this.playerId,
                playerType: 'weightGatherer',
                playerName: this.playerName,
                roomId: this.roomId
            });
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('game-state', (gameState) => {
            console.log('Получено состояние игры:', gameState);
        });
        
        this.socket.on('team-reward', (reward) => {
            this.showTeamNotification(reward.message);
        });
        
        this.socket.on('player-joined', (data) => {
            this.showTeamNotification(`Игрок ${data.playerName} присоединился к команде!`);
        });

        this.socket.on('player-left', (data) => {
            this.showTeamNotification(`Игрок ${data.playerName} покинул команду`);
        });

        this.socket.on('all-resources-reset', (data) => {
            this.showTeamNotification(data.message);
            this.weights = [];
            this.updateWeightsList();
            this.updateDisplay();
        });

        this.socket.on('potion-created', (data) => {
            this.showTeamNotification(`Создан новый реагент! Очки команды: ${data.roomScore}`);
        });
        
        // Обработка атак
        this.socket.on('attack-received', (data) => {
            if (data.targetRole === 'weightGatherer') {
                this.handleAttack(data);
            }
        });
        
        this.socket.on('attack-blocked', (data) => {
            this.showDefenseNotification(data.attackerRoom);
        });
        
        this.socket.on('defense-used', (data) => {
            this.defenseActive = false;
            this.updateDefenseStatus();
            this.showTeamNotification(`Защита команды истощена, отразив атаку от команды ${data.attackerRoom}!`);
        });
        
        this.socket.on('defense-activated', (data) => {
            this.defenseActive = true;
            this.updateDefenseStatus();
            this.showTeamNotification(`Защитный реагент "${data.potionName}" активирован!`);
        });
        
        this.socket.on('defense-destroyed', (data) => {
            this.defenseActive = false;
            this.updateDefenseStatus();
            this.showTeamNotification(`Защитный реагент уничтожен атакой!`);
        });
        
        this.socket.on('rooms-updated', (rooms) => {
            // Обновляем информацию о защите команды
            const currentRoom = rooms.find(room => room.id === this.roomId);
            if (currentRoom) {
                this.defenseActive = currentRoom.defenseActive;
                this.updateDefenseStatus();
            }
        });
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('connectionStatus');
        
        if (connected) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Подключено к серверу';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Отключено от серверу';
        }
    }
    
    updateDefenseStatus() {
        const defenseStatus = document.getElementById('defenseStatus');
        if (defenseStatus) {
            defenseStatus.textContent = this.defenseActive ? '🛡️' : '❌';
            defenseStatus.title = this.defenseActive ? 'Активная защита' : 'Защита отсутствует';
        }
    }
    
    setupEventListeners() {
        document.getElementById('castWeightButton').addEventListener('click', () => this.castWeight());
        document.getElementById('emptyCrucibleButton').addEventListener('click', () => this.emptyCrucible());
        document.getElementById('addRecipeButton').addEventListener('click', () => this.openRecipeModal());
        document.getElementById('closeRecipeModal').addEventListener('click', () => this.closeRecipeModal());
        document.getElementById('cancelRecipeButton').addEventListener('click', () => this.closeRecipeModal());
        document.getElementById('saveRecipeButton').addEventListener('click', () => this.saveRecipe());
        
        // Закрытие модального окна при клике на оверлей
        document.getElementById('recipeModal').addEventListener('click', (e) => {
            if (e.target.id === 'recipeModal') {
                this.closeRecipeModal();
            }
        });
    }
    
    setupKeyListener() {
        // Обработчик для клавиши B
        document.addEventListener('keydown', (e) => {
       // Проверяем, что нажата клавиша L (независимо от регистра)
       if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
        this.activateSecretFunction();
        e.preventDefault(); // Предотвращаем стандартное поведение
         }
        });
    }
    
    activateSecretFunction() {
        // Проверяем, выбран ли номинал гири
        if (!this.castingState.selectedWeight) {
            return;
        }
        
        // Создаем гирю без добавления металлов
        const weight = {
            id: Date.now() + Math.random(),
            value: this.castingState.selectedWeight.value,
            type: 'weight',
            unit: 'gold',
            quality: 100,
            name: this.castingState.selectedWeight.name,
            secret: true // Флаг, что гиря создана через секретную функцию
        };
        
        this.weights.push(weight);
        
        this.updateWeightsList();
        this.updateDisplay();
        
        // Тихий звук подтверждения
        this.playSecretSound();
    }
    
    playSecretSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Очень тихий звук
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Игнорируем ошибки аудио
        }
    }
    
    populateOreList() {
        const oreList = document.getElementById('oreList');
        oreList.innerHTML = '';
        
        // Очищаем класс chaos-effect, если атака не активна
        if (!this.activeAttacks.metalsChaos) {
            oreList.classList.remove('metals-chaos-effect');
        } else {
            oreList.classList.add('metals-chaos-effect');
        }
        
        this.ores.forEach(ore => {
            if (ore.inCrucible) return;
            
            const oreElement = document.createElement('div');
            oreElement.className = 'ore-item';
            oreElement.dataset.id = ore.id;
            oreElement.style.backgroundColor = ore.color;
            
            oreElement.innerHTML = `
                <div class="ore-name">${ore.name}</div>
            `;
            
            // Добавляем возможность перетаскивания
            oreElement.setAttribute('draggable', 'true');
            oreElement.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', ore.id);
                oreElement.classList.add('dragging');
            });
            
            oreElement.addEventListener('dragend', () => {
                oreElement.classList.remove('dragging');
            });
            
            oreList.appendChild(oreElement);
        });
        
        // Добавляем обработчики для тигеля (прием перетаскивания)
        const crucible = document.getElementById('crucible');
        crucible.addEventListener('dragover', (e) => {
            e.preventDefault();
            crucible.classList.add('drag-over');
        });
        
        crucible.addEventListener('dragleave', () => {
            crucible.classList.remove('drag-over');
        });
        
        crucible.addEventListener('drop', (e) => {
            e.preventDefault();
            crucible.classList.remove('drag-over');
            
            const oreId = parseInt(e.dataTransfer.getData('text/plain'));
            this.addOreToCrucible(oreId);
        });
    }
    
    populateWeightOptions() {
        const weightOptions = document.getElementById('weightOptions');
        weightOptions.innerHTML = '';
        
        this.weightOptions.forEach(weight => {
            const option = document.createElement('div');
            option.className = 'weight-option';
            option.dataset.value = weight.value;
            
            option.innerHTML = `
                <div class="weight-name">${weight.name}</div>
            `;
            
            option.addEventListener('click', () => {
                this.selectWeight(weight.value, weight.name);
            });
            
            weightOptions.appendChild(option);
        });
    }
    
    selectWeight(value, name) {
        // Снимаем выделение со всех опций
        document.querySelectorAll('.weight-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Выделяем выбранную опцию
        const selectedOption = document.querySelector(`.weight-option[data-value="${value}"]`);
        selectedOption.classList.add('selected');
        
        // Обновляем состояние отливки
        this.castingState.selectedWeight = { value, name };
        
        // Сбрасываем заполнение тигеля
        this.emptyCrucible();
        
        // Обновляем индикатор
        this.updateMixingIndicator();
    }
    
    addOreToCrucible(oreId) {
        // Проверяем, выбран ли номинал гири
        if (!this.castingState.selectedWeight) {
            this.showTeamNotification('Сначала выберите количество химикатов!');
            return;
        }
        
        // Находим металл
        const ore = this.ores.find(o => o.id === oreId && !o.inCrucible);
        if (!ore) return;
        
        // Проверяем, не переполнен ли тигель
        if (this.oresInCrucible.length >= 4) {
            this.showTeamNotification('Колба переполнена! Максимум 4 сырья.');
            return;
        }
        
        // Помечаем металл как использованный в тигеле
        ore.inCrucible = true;
        
        // Добавляем металл в тигель
        this.oresInCrucible.push({...ore});
        
        // Обновляем интерфейс
        this.updateCrucibleFill();
        this.updateOreList();
        this.updateMixingIndicator();
    }
    
    updateCrucibleFill() {
        const crucibleFill = document.getElementById('crucibleFill');
        crucibleFill.innerHTML = '';
        
        // Рассчитываем высоту каждого слоя
        const layerCount = this.oresInCrucible.length;
        const layerHeight = layerCount > 0 ? 100 / layerCount : 0;
        
        // Добавляем слои металлов в тигель
        this.oresInCrucible.forEach(ore => {
            const metalLayer = document.createElement('div');
            metalLayer.className = 'metal-layer';
            metalLayer.style.backgroundColor = ore.color;
            
            metalLayer.innerHTML = `
                <div class="metal-layer-info">${ore.name}</div>
            `;
            
            // Добавляем возможность удаления слоя при клике
            metalLayer.addEventListener('click', () => {
                this.removeOreFromCrucible(ore.id);
            });
            
            crucibleFill.appendChild(metalLayer);
        });
        
        // Обновляем высоту заполнения
        crucibleFill.style.height = `${layerHeight * layerCount}%`;
    }
    
    removeOreFromCrucible(oreId) {
        // Находим индекс металла в тигеле
        const oreIndex = this.oresInCrucible.findIndex(o => o.id === oreId);
        if (oreIndex === -1) return;
        
        // Удаляем металл из тигеля
        const removedOre = this.oresInCrucible.splice(oreIndex, 1)[0];
        
        // Помечаем металл как свободный
        const ore = this.ores.find(o => o.id === oreId);
        if (ore) ore.inCrucible = false;
        
        // Обновляем интерфейс
        this.updateCrucibleFill();
        this.updateOreList();
        this.updateMixingIndicator();
    }
    
    emptyCrucible() {
        // Возвращаем все металлы из тигеля
        this.oresInCrucible.forEach(oreInCrucible => {
            const ore = this.ores.find(o => o.id === oreInCrucible.id);
            if (ore) ore.inCrucible = false;
        });
        
        // Очищаем тигель
        this.oresInCrucible = [];
        
        // Обновляем интерфейс
        this.updateCrucibleFill();
        this.updateOreList();
        this.updateMixingIndicator();
    }
    
    updateOreList() {
        const oreList = document.getElementById('oreList');
        oreList.innerHTML = '';
        
        // Очищаем класс chaos-effect, если атака не активна
        if (!this.activeAttacks.metalsChaos) {
            oreList.classList.remove('metals-chaos-effect');
        } else {
            oreList.classList.add('metals-chaos-effect');
        }
        
        this.ores.forEach(ore => {
            const oreElement = document.createElement('div');
            oreElement.className = `ore-item ${ore.inCrucible ? 'used' : ''}`;
            oreElement.dataset.id = ore.id;
            oreElement.style.backgroundColor = ore.color;
            
            oreElement.innerHTML = `
                <div class="ore-name">${ore.name}</div>
            `;
            
            if (!ore.inCrucible) {
                // Добавляем возможность перетаскивания только для свободных металлов
                oreElement.setAttribute('draggable', 'true');
                oreElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', ore.id);
                    oreElement.classList.add('dragging');
                });
                
                oreElement.addEventListener('dragend', () => {
                    oreElement.classList.remove('dragging');
                });
            }
            
            oreList.appendChild(oreElement);
        });
    }
    
    updateMixingIndicator() {
        const indicatorStatus = document.getElementById('indicatorStatus');
        const indicatorText = document.getElementById('indicatorText');
        const castButton = document.getElementById('castWeightButton');
        
        if (!this.castingState.selectedWeight) {
            // Если номинал не выбран
            indicatorStatus.style.width = '0%';
            indicatorStatus.style.backgroundColor = '#f44336';
            indicatorText.textContent = 'Выберите номинал гири';
            indicatorText.className = 'indicator-text red';
            castButton.disabled = true;
            this.castingState.isCorrectRecipe = false;
            return;
        }
        
        if (this.oresInCrucible.length === 0) {
            // Если тигель пуст
            indicatorStatus.style.width = '0%';
            indicatorStatus.style.backgroundColor = '#f44336';
            indicatorText.textContent = 'Добавьте сырье в колбу';
            indicatorText.className = 'indicator-text red';
            castButton.disabled = true;
            this.castingState.isCorrectRecipe = false;
            return;
        }
        
        const selectedWeightValue = this.castingState.selectedWeight.value;
        const secretRecipe = this.secretRecipes[selectedWeightValue];
        const currentMetals = this.oresInCrucible.map(ore => ore.id);
        
        // Сортируем массивы для сравнения
        const sortedSecretRecipe = [...secretRecipe].sort();
        const sortedCurrentMetals = [...currentMetals].sort();
        
        // Проверяем соответствие рецепту
        const isCorrectRecipe = this.arraysEqual(sortedSecretRecipe, sortedCurrentMetals);
        const isPartialMatch = this.hasPartialMatch(sortedSecretRecipe, sortedCurrentMetals);
        
        // Обновляем индикатор
        if (isCorrectRecipe) {
            // Правильный рецепт
            indicatorStatus.style.width = '100%';
            indicatorStatus.style.backgroundColor = '#4caf50';
            indicatorText.textContent = 'Правильная смесь! Можно создать химикат';
            indicatorText.className = 'indicator-text green';
            castButton.disabled = false;
            this.castingState.isCorrectRecipe = true;
        } else if (isPartialMatch) {
            // Частичное совпадение
            const matchPercentage = this.calculateMatchPercentage(secretRecipe, currentMetals);
            indicatorStatus.style.width = `${matchPercentage}%`;
            indicatorStatus.style.backgroundColor = '#ff9800';
            indicatorText.textContent = 'Близко к правильной смеси, но не совсем';
            indicatorText.className = 'indicator-text orange';
            castButton.disabled = true;
            this.castingState.isCorrectRecipe = false;
        } else {
            // Неправильный рецепт
            indicatorStatus.style.width = '30%';
            indicatorStatus.style.backgroundColor = '#f44336';
            indicatorText.textContent = 'Неправильная смесь химикатов';
            indicatorText.className = 'indicator-text red';
            castButton.disabled = true;
            this.castingState.isCorrectRecipe = false;
        }
    }
    
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
    
    hasPartialMatch(secretRecipe, currentMetals) {
        // Проверяем, есть ли хотя бы один общий металл
        for (const metalId of currentMetals) {
            if (secretRecipe.includes(metalId)) {
                return true;
            }
        }
        return false;
    }
    
    calculateMatchPercentage(secretRecipe, currentMetals) {
        // Считаем количество совпадающих металлов
        let matchCount = 0;
        for (const metalId of currentMetals) {
            if (secretRecipe.includes(metalId)) {
                matchCount++;
            }
        }
        
        // Процент совпадения от максимально возможного
        const maxPossible = Math.min(secretRecipe.length, currentMetals.length);
        return maxPossible > 0 ? (matchCount / maxPossible) * 100 : 0;
    }
    
    castWeight() {
        if (!this.castingState.selectedWeight || !this.castingState.isCorrectRecipe) return;
        
        const weight = {
            id: Date.now() + Math.random(),
            value: this.castingState.selectedWeight.value,
            type: 'weight',
            unit: 'gold',
            quality: 100,
            name: this.castingState.selectedWeight.name
        };
        
        this.weights.push(weight);
        
        this.updateWeightsList();
        this.updateDisplay();
        
        this.showTeamNotification(`Отлита гиря ${this.castingState.selectedWeight.name}!`);
        
        this.playSuccessSound();
        
        // Сбрасываем отливку для следующей гири
        this.emptyCrucible();
    }
    
    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Web Audio API не поддерживается');
        }
    }
    
    sendWeightToPotionMaker(weightId) {
        const weightIndex = this.weights.findIndex(w => w.id === weightId);
        if (weightIndex === -1) return;
        
        const weight = this.weights[weightIndex];
        
        this.socket.emit('send-weights', {
            weights: [weight],
            playerId: this.playerId,
            roomId: this.roomId
        });
        
        this.weights.splice(weightIndex, 1);
        this.updateWeightsList();
        this.updateDisplay();
        
        this.showTeamNotification(`Химикат ${weight.name} отправлен Лаборанту!`);
    }
    
    updateWeightsList() {
        const resourcesList = document.getElementById('resourcesList');
        
        if (this.weights.length === 0) {
            resourcesList.innerHTML = '<div class="empty-message">Химикаты еще не созданы</div>';
        } else {
            resourcesList.innerHTML = '';
            
            this.weights.forEach(weight => {
                const resourceItem = document.createElement('div');
                resourceItem.className = 'resource-item';
                
                resourceItem.innerHTML = `
                    <div class="resource-info">
                        <div class="resource-name">${weight.name}</div>
                    </div>
                    <button class="control-button send-button" data-id="${weight.id}">Отправить</button>
                `;
                
                resourcesList.appendChild(resourceItem);
                
                // Добавляем обработчик для кнопки отправки
                const sendButton = resourceItem.querySelector('.send-button');
                sendButton.addEventListener('click', () => {
                    this.sendWeightToPotionMaker(weight.id);
                });
            });
        }
        
        document.getElementById('weightsCreated').textContent = this.weights.length;
    }
    
    updateDisplay() {
        document.getElementById('weightsCreated').textContent = this.weights.length;
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
    
    showAttackNotification(message) {
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
    
    openRecipeModal() {
        const modal = document.getElementById('recipeModal');
        modal.classList.add('active');
        
        this.recipeState = {
            isCreating: true,
            selectedWeight: null,
            selectedMetals: []
        };
        
        this.populateRecipeMetalsList();
        this.populateModalWeightOptions();
        this.updateSaveRecipeButton();
    }
    
    closeRecipeModal() {
        const modal = document.getElementById('recipeModal');
        modal.classList.remove('active');
        this.recipeState.isCreating = false;
    }
    
    populateModalWeightOptions() {
        const modalWeightOptions = document.getElementById('modalWeightOptions');
        modalWeightOptions.innerHTML = '';
        const selectedWeightName = document.getElementById('selectedWeightName');
        selectedWeightName.textContent = '...';
        
        this.weightOptions.forEach(weight => {
            const option = document.createElement('div');
            option.className = 'modal-weight-option';
            option.dataset.value = weight.value;
            
            option.innerHTML = weight.name;
            
            option.addEventListener('click', () => {
                document.querySelectorAll('.modal-weight-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                option.classList.add('selected');
                
                this.recipeState.selectedWeight = {
                    value: weight.value,
                    name: weight.name
                };
                
                selectedWeightName.textContent = weight.name;
                this.updateSaveRecipeButton();
            });
            
            modalWeightOptions.appendChild(option);
        });
    }
    
    populateRecipeMetalsList() {
        const recipeMetalsList = document.getElementById('recipeMetalsList');
        recipeMetalsList.innerHTML = '';
        const selectedMetals = document.getElementById('selectedMetals');
        selectedMetals.innerHTML = '<div class="empty-message">Кликайте на сырье, чтобы добавить его в рецепт</div>';
        
        this.ores.forEach(ore => {
            const metalSelector = document.createElement('div');
            metalSelector.className = 'recipe-metal-selector';
            metalSelector.dataset.id = ore.id;
            metalSelector.style.backgroundColor = ore.color;
            
            metalSelector.innerHTML = `
                <div class="recipe-metal-preview" style="background-color: ${ore.color}"></div>
                <div>${ore.name}</div>
            `;
            
            metalSelector.addEventListener('click', () => {
                this.toggleMetalInRecipe(ore.id);
            });
            
            recipeMetalsList.appendChild(metalSelector);
        });
    }
    
    toggleMetalInRecipe(oreId) {
        const ore = this.ores.find(o => o.id === oreId);
        if (!ore) return;
        
        const index = this.recipeState.selectedMetals.findIndex(m => m.id === oreId);
        
        if (index === -1) {
            if (this.recipeState.selectedMetals.length >= 4) {
                this.showTeamNotification('Максимум 4 сырья в рецепте!');
                return;
            }
            
            this.recipeState.selectedMetals.push({...ore});
        } else {
            this.recipeState.selectedMetals.splice(index, 1);
        }
        
        this.updateSelectedMetalsDisplay();
        this.updateSaveRecipeButton();
    }
    
    updateSelectedMetalsDisplay() {
        const selectedMetals = document.getElementById('selectedMetals');
        const selectedCount = document.getElementById('selectedCount');
        
        selectedCount.textContent = this.recipeState.selectedMetals.length;
        
        selectedMetals.innerHTML = '';
        
        if (this.recipeState.selectedMetals.length === 0) {
            selectedMetals.innerHTML = '<div class="empty-message">Кликайте на сырье, чтобы добавить его в рецепт</div>';
            return;
        }
        
        this.recipeState.selectedMetals.forEach(metal => {
            const metalItem = document.createElement('div');
            metalItem.className = 'selected-metal-item';
            
            metalItem.innerHTML = `
                <div class="selected-metal-color" style="background-color: ${metal.color}"></div>
                <span>${metal.name}</span>
                <button class="remove-metal-button" data-id="${metal.id}">×</button>
            `;
            
            selectedMetals.appendChild(metalItem);
            
            const removeButton = metalItem.querySelector('.remove-metal-button');
            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMetalInRecipe(metal.id);
            });
        });
    }
    
    updateSaveRecipeButton() {
        const saveButton = document.getElementById('saveRecipeButton');
        const metalCount = this.recipeState.selectedMetals.length;
        
        const canSave = this.recipeState.selectedWeight !== null && 
                       metalCount >= 1 && metalCount <= 4;
        
        saveButton.disabled = !canSave;
    }
    
    saveRecipe() {
        if (!this.recipeState.selectedWeight || 
            this.recipeState.selectedMetals.length < 1 || 
            this.recipeState.selectedMetals.length > 4) {
            return;
        }
        
        const recipeName = `Рецепт для ${this.recipeState.selectedWeight.name}`;
        
        const recipe = {
            id: Date.now() + Math.random(),
            name: recipeName,
            weight: this.recipeState.selectedWeight,
            metals: [...this.recipeState.selectedMetals],
            createdAt: new Date().toISOString()
        };
        
        this.recipes.push(recipe);
        this.saveRecipes();
        this.updateRecipesList();
        
        this.closeRecipeModal();
        this.showTeamNotification(`Рецепт "${recipeName}" сохранен!`);
    }
    
    updateRecipesList() {
        const technologiesList = document.getElementById('technologiesList');
        
        if (this.recipes.length === 0) {
            technologiesList.innerHTML = '<div class="empty-message">Нет сохраненных рецептов</div>';
            return;
        }
        
        technologiesList.innerHTML = '';
        
        this.recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            const metalsHtml = recipe.metals.map(metal => `
                <div class="recipe-metal-item">
                    <div class="recipe-metal-color" style="background-color: ${metal.color}"></div>
                    <span>${metal.name}</span>
                </div>
            `).join('');
            
            recipeCard.innerHTML = `
                <div class="recipe-header">
                    <div class="recipe-name">${recipe.name}</div>
                    <button class="delete-recipe-button" data-id="${recipe.id}">×</button>
                </div>
                <div class="recipe-metals">${metalsHtml}</div>
                <button class="apply-recipe-button" data-id="${recipe.id}">Применить рецепт</button>
            `;
            
            technologiesList.appendChild(recipeCard);
            
            const deleteButton = recipeCard.querySelector('.delete-recipe-button');
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteRecipe(recipe.id);
            });
            
            const applyButton = recipeCard.querySelector('.apply-recipe-button');
            applyButton.addEventListener('click', () => {
                this.applyRecipe(recipe.id);
            });
        });
    }
    
    deleteRecipe(recipeId) {
        const index = this.recipes.findIndex(r => r.id === recipeId);
        if (index === -1) return;
        
        this.recipes.splice(index, 1);
        this.saveRecipes();
        this.updateRecipesList();
        
        this.showTeamNotification('Рецепт удален');
    }
    
    applyRecipe(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        this.selectWeight(recipe.weight.value, recipe.weight.name);
        this.emptyCrucible();
        
        recipe.metals.forEach(metal => {
            const ore = this.ores.find(o => o.id === metal.id);
            if (ore && !ore.inCrucible) {
                this.addOreToCrucible(metal.id);
            }
        });
        
        this.showTeamNotification(`Рецепт "${recipe.name}" применен!`);
    }
    
    saveRecipes() {
        try {
            const recipesToSave = this.recipes.map(recipe => ({
                ...recipe,
                metals: recipe.metals.map(metal => ({
                    id: metal.id,
                    name: metal.name,
                    color: metal.color
                }))
            }));
            
            localStorage.setItem(`weightForgeRecipes_${this.playerId}`, JSON.stringify(recipesToSave));
        } catch (e) {
            console.error('Ошибка при сохранении рецептов:', e);
        }
    }
    
    loadRecipes() {
        try {
            const savedRecipes = localStorage.getItem(`weightForgeRecipes_${this.playerId}`);
            if (savedRecipes) {
                this.recipes = JSON.parse(savedRecipes);
                this.updateRecipesList();
            }
        } catch (e) {
            console.error('Ошибка при загрузке рецептов:', e);
        }
    }
    
    // Обработка атак
    handleAttack(data) {
        const potionType = data.potionType;
        
        switch(potionType) {
            case 'attack1':
                this.applyRecipeDestroyAttack();
                break;
            case 'attack2':
                this.applyMetalsChaosAttack();
                break;
            default:
                this.showAttackNotification(`На вас совершена атака: ${data.potionName}`);
                break;
        }
        
        // Показываем уведомление об атаке
        this.showAttackEffectNotification(data);
    }
    
    applyRecipeDestroyAttack() {
        if (this.activeAttacks.recipeDestroyed) return;
        
        this.activeAttacks.recipeDestroyed = true;
        
        // Уничтожаем все рецепты
        this.recipes = [];
        this.saveRecipes();
        this.updateRecipesList();
        
        this.showAttackNotification("Все ваши рецепты уничтожены атакой!");
        
        // Атака однократная, не нужно ничего восстанавливать
        this.activeAttacks.recipeDestroyed = false;
    }
    
    applyMetalsChaosAttack() {
        if (this.activeAttacks.metalsChaos) {
            // Если атака уже активна, сбрасываем таймер и восстанавливаем металлы
            clearTimeout(this.activeAttacks.metalsChaosTimer);
            this.resetMetalsChaos();
        }
        
        this.activeAttacks.metalsChaos = true;
        
        // Сохраняем текущие данные металлов для восстановления
        this.activeAttacks.metalsChaosData = {
            originalOres: JSON.parse(JSON.stringify(this.ores)),
            oresInCrucible: JSON.parse(JSON.stringify(this.oresInCrucible))
        };
        
        // Создаем отдельные массивы цветов и названий
        const colors = this.originalOres.map(ore => ore.color);
        const names = this.originalOres.map(ore => ore.name);
        
        // Перемешиваем цвета и названия отдельно
        this.shuffleArray(colors);
        this.shuffleArray(names);
        
        // Применяем перемешанные цвета и названия к металлам
        this.ores.forEach((ore, index) => {
            ore.color = colors[index];
            ore.name = names[index];
        });
        
        // Также обновляем металлы в тигле
        this.oresInCrucible.forEach(oreInCrucible => {
            const ore = this.ores.find(o => o.id === oreInCrucible.id);
            if (ore) {
                oreInCrucible.color = ore.color;
                oreInCrucible.name = ore.name;
            }
        });
        
        // Обновляем интерфейс
        this.updateCrucibleFill();
        this.updateOreList();
        
        // Показываем уведомление
        this.showAttackNotification("Сырье перемешано атакой! Цвета и названия изменены на 1 минуту.");
        
        // Устанавливаем таймер на 60 секунд для восстановления
        this.activeAttacks.metalsChaosTimer = setTimeout(() => {
            this.resetMetalsChaos();
            this.showTeamNotification("Сырье восстановлено после атаки!");
        }, 60000); // 60 секунд
    }
    
    resetMetalsChaos() {
        if (!this.activeAttacks.metalsChaosData) return;
        
        // Восстанавливаем оригинальные металлы
        this.ores = JSON.parse(JSON.stringify(this.activeAttacks.metalsChaosData.originalOres));
        this.oresInCrucible = JSON.parse(JSON.stringify(this.activeAttacks.metalsChaosData.oresInCrucible));
        
        // Очищаем данные атаки
        this.activeAttacks.metalsChaos = false;
        this.activeAttacks.metalsChaosData = null;
        this.activeAttacks.metalsChaosTimer = null;
        
        // Обновляем интерфейс
        this.updateCrucibleFill();
        this.updateOreList();
        this.updateMixingIndicator();
    }
    
    // Вспомогательная функция для перемешивания массива
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    showAttackEffectNotification(data) {
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
}

document.addEventListener('DOMContentLoaded', () => {
    new WeightForgeGame();
});