const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MAX_PLAYERS_PER_ROOM = 3;
const MAX_ROOMS = 20;
const MIN_ROOMS = 3;

const gameState = {
  rooms: {},
  leaderboard: []
};

function initializeRooms() {
  const roomIcons = ['🐉', '🦅', '🦄', '🐺', '🐍', '🦁', '🐯', '🦊', '🐻', '🦉', 
                     '🐬', '🦋', '🐘', '🦏', '🦛', '🐪', '🦘', '🦌', '🐎', '🐲'];
  
  for (let i = 1; i <= MIN_ROOMS; i++) {
    const roomId = `room${i}`;
    gameState.rooms[roomId] = {
      id: roomId,
      name: `Команда ${i}`,
      icon: roomIcons[i - 1] || '🐾',
      players: {},
      resources: {
        weights: [],
        ingredients: [],
        metals: []
      },
      potions: [],
      currentRecipe: null,
      score: 0,
      completed: false,
      completedAt: null,
      defenseActive: false,
      // Кулдауны по атакующим командам
      cooldownsByAttacker: {},
      // Эффекты атак
      ingredientBlocked: null,
      ingredientBlockTimer: null,
      ingredientSendBlocked: false,
      ingredientSendBlockTimer: null,
      createdAt: new Date().toISOString(),
      maxPlayers: MAX_PLAYERS_PER_ROOM
    };
  }
}

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        results.push(interface.address);
      }
    }
  }
  return results;
}

function updateLeaderboard() {
  const roomsArray = Object.values(gameState.rooms).map(room => ({
    id: room.id,
    name: room.name,
    icon: room.icon,
    score: room.score,
    completed: room.completed,
    completedAt: room.completedAt,
    playersCount: Object.keys(room.players).length,
    potionsCount: room.potions.length,
    defenseActive: room.defenseActive,
    maxPlayers: room.maxPlayers,
    createdAt: room.createdAt
  }));

  gameState.leaderboard = roomsArray.sort((a, b) => {
    if (a.completed && b.completed) {
      if (a.score !== b.score) return b.score - a.score;
      return new Date(a.completedAt) - new Date(b.completedAt);
    }
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return b.score - a.score;
  });

  io.emit('leaderboard-updated', gameState.leaderboard);
}

function checkGameCompletion(roomId) {
  const room = gameState.rooms[roomId];
  if (room.potions.length >= 999 && !room.completed) {
    room.completed = true;
    room.completedAt = new Date().toISOString();
    
    console.log(`🎉 Комната ${roomId} завершила игру!`);
    
    io.emit('game-completed', {
      roomId: roomId,
      roomName: room.name,
      score: room.score,
      potionsCount: room.potions.length,
      completedAt: room.completedAt
    });
    
    updateLeaderboard();
  }
}

// Проверка кулдауна для конкретного атакующего
function checkAttackCooldown(attackerRoomId, targetRoomId) {
  const targetRoom = gameState.rooms[targetRoomId];
  if (!targetRoom || !targetRoom.cooldownsByAttacker) {
    return { canAttack: true, remainingTime: 0 };
  }
  
  const cooldownEnd = targetRoom.cooldownsByAttacker[attackerRoomId];
  if (!cooldownEnd) return { canAttack: true, remainingTime: 0 };
  
  const now = Date.now();
  if (cooldownEnd > now) {
    const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
    return { 
      canAttack: false, 
      remainingTime,
      reason: 'Кулдаун после атаки'
    };
  }
  
  return { canAttack: true, remainingTime: 0 };
}

// Установка кулдауна для конкретной пары
function setAttackCooldown(attackerRoomId, targetRoomId, duration = 60000) {
  const targetRoom = gameState.rooms[targetRoomId];
  if (!targetRoom) return;
  
  if (!targetRoom.cooldownsByAttacker) {
    targetRoom.cooldownsByAttacker = {};
  }
  
  const now = Date.now();
  targetRoom.cooldownsByAttacker[attackerRoomId] = now + duration;
  
  // Автоматически удаляем запись через duration
  setTimeout(() => {
    if (targetRoom.cooldownsByAttacker && 
        targetRoom.cooldownsByAttacker[attackerRoomId] <= Date.now()) {
      delete targetRoom.cooldownsByAttacker[attackerRoomId];
      console.log(`Кулдаун для атакующего ${attackerRoomId} на цель ${targetRoomId} снят`);
    }
  }, duration + 1000);
}

function createNewRoom() {
  const existingRooms = Object.keys(gameState.rooms);
  const nextRoomNumber = existingRooms.length + 1;
  
  if (nextRoomNumber > MAX_ROOMS) {
    return { success: false, message: `Достигнут лимит ${MAX_ROOMS} команд` };
  }
  
  const roomIcons = ['🐉', '🦅', '🦄', '🐺', '🐍', '🦁', '🐯', '🦊', '🐻', '🦉', 
                     '🐬', '🦋', '🐘', '🦏', '🦛', '🐪', '🦘', '🦌', '🐎', '🐲'];
  const roomId = `room${nextRoomNumber}`;
  
  gameState.rooms[roomId] = {
    id: roomId,
    name: `Команда ${nextRoomNumber}`,
    icon: roomIcons[nextRoomNumber - 1] || '🐾',
    players: {},
    resources: {
      weights: [],
      ingredients: [],
      metals: []
    },
    potions: [],
    currentRecipe: null,
    score: 0,
    completed: false,
    completedAt: null,
    defenseActive: false,
    cooldownsByAttacker: {},
    ingredientBlocked: null,
    ingredientBlockTimer: null,
    ingredientSendBlocked: false,
    ingredientSendBlockTimer: null,
    createdAt: new Date().toISOString(),
    maxPlayers: MAX_PLAYERS_PER_ROOM
  };
  
  console.log(`✅ Создана новая команда: ${roomId} - ${gameState.rooms[roomId].name}`);
  
  updateLeaderboard();
  
  return { 
    success: true, 
    roomId: roomId,
    roomName: gameState.rooms[roomId].name,
    icon: gameState.rooms[roomId].icon
  };
}

function deleteEmptyRoom(roomId) {
  const room = gameState.rooms[roomId];
  
  if (!room) {
    return { success: false, message: 'Команда не найдена' };
  }
  
  if (Object.keys(room.players).length > 0) {
    return { success: false, message: 'Команда не пуста' };
  }
  
  const roomNumber = parseInt(roomId.replace('room', ''));
  if (roomNumber <= MIN_ROOMS) {
    return { success: false, message: 'Базовые команды нельзя удалять' };
  }
  
  delete gameState.rooms[roomId];
  
  console.log(`🗑️ Удалена пустая команда: ${roomId}`);
  
  updateLeaderboard();
  
  return { success: true, message: 'Команда удалена' };
}

initializeRooms();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room-selection', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room-selection.html'));
});

app.get('/role-selection/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'role-selection.html'));
});

app.get('/player1/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player1.html'));
});

app.get('/player2/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player2.html'));
});

app.get('/player3/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player3.html'));
});

app.get('/player4/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player4.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get('/api/rooms', (req, res) => {
  const roomsInfo = Object.values(gameState.rooms).map(room => ({
    id: room.id,
    name: room.name,
    icon: room.icon,
    playersCount: Object.keys(room.players).length,
    maxPlayers: room.maxPlayers,
    score: room.score,
    completed: room.completed,
    potionsCount: room.potions.length,
    defenseActive: room.defenseActive,
    players: room.players
  }));
  res.json(roomsInfo);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(gameState.leaderboard);
});

app.post('/api/rooms/create', (req, res) => {
  const result = createNewRoom();
  res.json(result);
});

app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const result = deleteEmptyRoom(roomId);
  res.json(result);
});

app.get('/api/rooms/stats', (req, res) => {
  const stats = {
    totalRooms: Object.keys(gameState.rooms).length,
    activeRooms: Object.values(gameState.rooms).filter(room => 
      Object.keys(room.players).length > 0
    ).length,
    completedRooms: Object.values(gameState.rooms).filter(room => 
      room.completed
    ).length,
    totalPlayers: Object.values(gameState.rooms).reduce((total, room) => 
      total + Object.keys(room.players).length, 0
    ),
    totalPotions: Object.values(gameState.rooms).reduce((total, room) => 
      total + room.potions.length, 0
    ),
    maxRooms: MAX_ROOMS,
    minRooms: MIN_ROOMS
  };
  res.json(stats);
});

app.get('/server-info', (req, res) => {
  const networkIPs = getNetworkIP();
  res.json({
    port: process.env.PORT || 3000,
    networkIPs,
    localUrl: `http://localhost:${process.env.PORT || 3000}`,
    networkUrls: networkIPs.map(ip => `http://${ip}:${process.env.PORT || 3000}`)
  });
});

app.post('/restart', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('=== ПЕРЕЗАПУСК СЕРВЕРА ПО ЗАПРОСУ ===');
    res.json({ message: 'Сервер перезапускается...' });
    process.exit(0);
  } else {
    res.status(403).json({ error: 'Перезапуск запрещен в production режиме' });
  }
});

io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  // Сохраняем комнату игрока после регистрации
  socket.on('register-player', (data) => {
    const { playerId, playerType, playerName, roomId } = data;
    
    if (!gameState.rooms[roomId]) {
      socket.emit('error', { message: 'Команда не найдена' });
      return;
    }

    const room = gameState.rooms[roomId];
    
    if (Object.keys(room.players).length >= room.maxPlayers) {
      socket.emit('error', { message: 'Команда уже заполнена' });
      return;
    }

    if (room.completed) {
      socket.emit('error', { message: 'Игра в этой команде уже завершена' });
      return;
    }

    if (playerType !== 'miner') {
      const existingPlayer = Object.values(room.players).find(
        player => player.playerType === playerType
      );
      
      if (existingPlayer) {
        socket.emit('error', { message: 'Эта роль уже занята в выбранной команде' });
        return;
      }
    }

    room.players[socket.id] = {
      playerId,
      playerType,
      playerName,
      socketId: socket.id,
      roomId: roomId,
      connected: true,
      joinedAt: new Date().toISOString()
    };

    socket.join(roomId);
    socket.data.roomId = roomId; // запоминаем комнату игрока

    console.log(`Зарегистрирован игрок: ${playerName} (${playerType}) в команде ${room.name}`);

    socket.emit('game-state', room);
    
    io.to(roomId).emit('player-joined', {
      playerId,
      playerType,
      playerName,
      playersCount: Object.keys(room.players).length,
      roomPlayers: Object.values(room.players)
    });

    const roomsInfo = Object.values(gameState.rooms).map(room => ({
      id: room.id,
      name: room.name,
      icon: room.icon,
      playersCount: Object.keys(room.players).length,
      maxPlayers: room.maxPlayers,
      score: room.score,
      completed: room.completed,
      potionsCount: room.potions.length,
      defenseActive: room.defenseActive,
      players: room.players
    }));
    
    io.emit('rooms-updated', roomsInfo);
    
    updateLeaderboard();
  });

  socket.on('get-rooms', () => {
    const myRoomId = socket.data.roomId; // комната текущего игрока
    const roomsInfo = Object.values(gameState.rooms).map(room => {
      let cooldownEndForMe = null;
      if (myRoomId && room.cooldownsByAttacker && room.cooldownsByAttacker[myRoomId]) {
        const cd = room.cooldownsByAttacker[myRoomId];
        if (cd > Date.now()) {
          cooldownEndForMe = cd;
        }
      }
      return {
        id: room.id,
        name: room.name,
        icon: room.icon,
        playersCount: Object.keys(room.players).length,
        maxPlayers: room.maxPlayers,
        score: room.score,
        completed: room.completed,
        potionsCount: room.potions.length,
        defenseActive: room.defenseActive,
        players: room.players,
        cooldownEnd: cooldownEndForMe // кулдаун только для запрашивающей команды
      };
    });
    socket.emit('rooms-list', roomsInfo);
  });

  socket.on('get-leaderboard', () => {
    socket.emit('leaderboard-updated', gameState.leaderboard);
  });

  socket.on('create-room', (callback) => {
    const result = createNewRoom();
    if (result.success) {
      const roomsInfo = Object.values(gameState.rooms).map(room => ({
        id: room.id,
        name: room.name,
        icon: room.icon,
        playersCount: Object.keys(room.players).length,
        maxPlayers: room.maxPlayers,
        score: room.score,
        completed: room.completed,
        potionsCount: room.potions.length,
        defenseActive: room.defenseActive,
        players: room.players
      }));
      
      io.emit('rooms-updated', roomsInfo);
    }
    
    if (callback) {
      callback(result);
    }
  });

  socket.on('send-weights', (data) => {
    const { weights, playerId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    const player = room.players[socket.id];
    
    if (player && player.playerType === 'weightGatherer') {
      room.resources.weights = [
        ...room.resources.weights,
        ...weights
      ];

      console.log(`Команда ${room.name}: получены гири от ${playerId}:`, weights);

      io.to(roomId).emit('weights-updated', {
        weights: room.resources.weights,
        fromPlayer: playerId
      });
    }
  });

  socket.on('send-metals', (data) => {
    const { metals, playerId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    const player = room.players[socket.id];
    
    if (player && player.playerType === 'miner') {
      if (!room.resources.metals) {
        room.resources.metals = [];
      }

      metals.forEach(metal => {
        const existingMetal = room.resources.metals.find(m => m.id === metal.id);
        
        if (existingMetal) {
          existingMetal.count = (existingMetal.count || 0) + (metal.count || 1);
        } else {
          room.resources.metals.push({
            id: metal.id,
            name: metal.name,
            color: metal.color,
            count: metal.count || 1
          });
        }
      });

      console.log(`Команда ${room.name}: получены металлы от ${playerId}:`, metals);

      io.to(roomId).emit('metals-updated', {
        metals: room.resources.metals,
        fromPlayer: playerId
      });
    }
  });

  socket.on('send-ingredients', (data) => {
    const { ingredients, playerId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    const player = room.players[socket.id];
    
    if (player && player.playerType === 'ingredientGatherer') {
      if (room.ingredientSendBlocked) {
        socket.emit('error', { message: 'Отправка ингредиентов заблокирована на 1 минуту!' });
        return;
      }
      
      const filteredIngredients = ingredients.filter(ingredient => {
        if (room.ingredientBlocked && ingredient.name === room.ingredientBlocked) {
          console.log(`Игнорируем заблокированный ингредиент: ${ingredient.name}`);
          return false;
        }
        return true;
      });
      
      if (filteredIngredients.length === 0) {
        socket.emit('error', { message: `Все ингредиенты заблокированы! Нельзя отправить ${room.ingredientBlocked}` });
        return;
      }

      room.resources.ingredients = [
        ...room.resources.ingredients,
        ...filteredIngredients
      ];

      console.log(`Команда ${room.name}: получены ингредиенты от ${playerId}:`, filteredIngredients);

      io.to(roomId).emit('ingredients-updated', {
        ingredients: room.resources.ingredients,
        fromPlayer: playerId
      });
    }
  });

  socket.on('create-potion', (data) => {
    const { potion, playerId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    const player = room.players[socket.id];
    
    if (player && player.playerType === 'potionMaker') {
      const newPotion = {
        ...potion,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        createdBy: playerId
      };
      
      room.potions.push(newPotion);

      room.score += calculateScore(potion.quality);

      console.log(`Команда ${room.name}: создано зелье игроком ${playerId}:`, potion);

      io.to(roomId).emit('potion-created', {
        potion: newPotion,
        potionsCount: room.potions.length,
        roomScore: room.score
      });

      const reward = calculateReward(potion.quality);
      io.to(roomId).emit('team-reward', {
        reward,
        potionName: potion.name,
        quality: potion.quality,
        createdBy: playerId
      });

      updateLeaderboard();

      checkGameCompletion(roomId);
    }
  });

  socket.on('activate-defense', (data) => {
    const { potionId, potionName, roomId, playerId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    const player = room.players[socket.id];
    
    if (player && player.playerType === 'potionMaker') {
      room.defenseActive = true;
      
      console.log(`Команда ${room.name}: активирована защита игроком ${playerId}`);

      io.to(roomId).emit('defense-activated', {
        potionId,
        potionName,
        playerId,
        defenseActive: true,
        defenseCount: 1
      });

      const roomsInfo = Object.values(gameState.rooms).map(room => ({
        id: room.id,
        name: room.name,
        icon: room.icon,
        playersCount: Object.keys(room.players).length,
        maxPlayers: room.maxPlayers,
        score: room.score,
        completed: room.completed,
        potionsCount: room.potions.length,
        defenseActive: room.defenseActive,
        players: room.players
      }));
      
      io.emit('rooms-updated', roomsInfo);
    }
  });

  socket.on('use-attack-potion', (data) => {
    const { potionId, potionName, potionType, targetRole, roomId, targetRoom, targetIngredient, playerId, playerName } = data;
    const attackerRoom = gameState.rooms[roomId];
    const targetRoomObj = gameState.rooms[targetRoom];
    
    if (!attackerRoom || !targetRoomObj) {
      socket.emit('error', { message: 'Команда не найдена' });
      return;
    }

    const player = attackerRoom.players[socket.id];
    
    if (player && player.playerType === 'potionMaker') {
      console.log(`Игрок ${playerId} из команды ${attackerRoom.name} атакует команду ${targetRoomObj.name} зельем ${potionName}`);
      
      // Проверяем кулдаун для этой пары (атакующий -> цель)
      const cooldownCheck = checkAttackCooldown(roomId, targetRoom);
      if (!cooldownCheck.canAttack) {
        const minutes = Math.floor(cooldownCheck.remainingTime / 60);
        const seconds = cooldownCheck.remainingTime % 60;
        socket.emit('attack-used', {
          success: false,
          potionName,
          targetRoom,
          message: `Нельзя атаковать эту команду. Кулдаун: ${minutes}:${seconds.toString().padStart(2, '0')}`
        });
        return;
      }
      
      if (targetRoomObj.defenseActive) {
        console.log(`Защита команды ${targetRoomObj.name} отразила атаку`);
        
        targetRoomObj.defenseActive = false;
        
        socket.emit('attack-used', {
          success: false,
          potionName,
          targetRoom,
          message: 'Атака отражена защитой цели'
        });
        
        io.to(targetRoom).emit('defense-used', {
          attackerRoom: roomId,
          attackerName: playerName,
          potionName,
          defenseActive: false
        });
        
        io.to(roomId).emit('attack-blocked', {
          targetRoom,
          potionName,
          message: 'Ваша атака была отражена защитой цели'
        });
        
        const roomsInfo = Object.values(gameState.rooms).map(room => ({
          id: room.id,
          name: room.name,
          icon: room.icon,
          playersCount: Object.keys(room.players).length,
          maxPlayers: room.maxPlayers,
          score: room.score,
          completed: room.completed,
          potionsCount: room.potions.length,
          defenseActive: room.defenseActive,
          players: room.players
        }));
        
        io.emit('rooms-updated', roomsInfo);
      } else {
        console.log(`Атака на команду ${targetRoomObj.name} успешна`);
        
        // Устанавливаем кулдаун для этой пары
        setAttackCooldown(roomId, targetRoom, 60000);
        
        // Применяем эффекты атаки (без изменений)
        if (potionType === 'attack3' && targetIngredient) {
          targetRoomObj.ingredientBlocked = targetIngredient;
          
          targetRoomObj.ingredientBlockTimer = setTimeout(() => {
            targetRoomObj.ingredientBlocked = null;
            targetRoomObj.ingredientBlockTimer = null;
            console.log(`Ингредиент ${targetIngredient} разблокирован для команды ${targetRoom}`);
            
            io.to(targetRoom).emit('ingredient-unblocked', {
              ingredient: targetIngredient,
              message: `Ингредиент "${targetIngredient}" снова доступен для создания`
            });
          }, 60000);
          
          console.log(`Ингредиент ${targetIngredient} заблокирован для команды ${targetRoomObj.name} на 1 минуту`);
          
        } else if (potionType === 'attack4') {
          targetRoomObj.ingredientSendBlocked = true;
          
          targetRoomObj.ingredientSendBlockTimer = setTimeout(() => {
            targetRoomObj.ingredientSendBlocked = false;
            targetRoomObj.ingredientSendBlockTimer = null;
            console.log(`Отправка ингредиентов разблокирована для команды ${targetRoom}`);
            
            io.to(targetRoom).emit('ingredient-send-unblocked', {
              message: 'Отправка ингредиентов снова доступна'
            });
          }, 60000);
          
          console.log(`Отправка ингредиентов заблокирована для команды ${targetRoomObj.name} на 1 минуту`);
        }
        
        io.to(targetRoom).emit('attack-received', {
          potionId,
          potionName,
          potionType,
          targetRole,
          targetIngredient: potionType === 'attack3' ? targetIngredient : null,
          attackerRoom: roomId,
          attackerName: playerName,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('attack-used', {
          success: true,
          potionName,
          targetRoom,
          message: 'Атака успешно применена'
        });
        
        console.log(`Атака ${potionName} от команды ${attackerRoom.name} применена к команде ${targetRoomObj.name}`);
        
        const roomsInfo = Object.values(gameState.rooms).map(room => ({
          id: room.id,
          name: room.name,
          icon: room.icon,
          playersCount: Object.keys(room.players).length,
          maxPlayers: room.maxPlayers,
          score: room.score,
          completed: room.completed,
          potionsCount: room.potions.length,
          defenseActive: room.defenseActive,
          players: room.players
        }));
        
        io.emit('rooms-updated', roomsInfo);
      }
    }
  });

  socket.on('use-resources', (data) => {
    const { weightsUsed, ingredientsUsed, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    room.resources.weights = room.resources.weights.filter(
      weight => !weightsUsed.includes(weight.id)
    );

    room.resources.ingredients = room.resources.ingredients.filter(
      ingredient => !ingredientsUsed.includes(ingredient.id)
    );

    console.log(`Команда ${room.name}: ресурсы использованы:`, { weightsUsed, ingredientsUsed });

    io.to(roomId).emit('resources-updated', {
      weights: room.resources.weights,
      ingredients: room.resources.ingredients
    });
  });

  socket.on('use-metal', (data) => {
    const { metalId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room || !room.resources.metals) return;
    
    const metal = room.resources.metals.find(m => m.id === metalId);
    if (!metal) return;
    
    if (metal.count > 1) {
      metal.count--;
    } else {
      const index = room.resources.metals.findIndex(m => m.id === metalId);
      if (index !== -1) {
        room.resources.metals.splice(index, 1);
      }
    }
    
    io.to(roomId).emit('metals-updated', {
      metals: room.resources.metals,
      fromPlayer: 'system'
    });
  });

  socket.on('return-metal', (data) => {
    const { metalId, roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;
    
    if (!room.resources.metals) {
      room.resources.metals = [];
    }
    
    const existingMetal = room.resources.metals.find(m => m.id === metalId);
    
    if (existingMetal) {
      existingMetal.count = (existingMetal.count || 0) + 1;
    } else {
      const metalInfo = getMetalInfo(metalId);
      if (metalInfo) {
        room.resources.metals.push({
          id: metalId,
          name: metalInfo.name,
          color: metalInfo.color,
          count: 1
        });
      }
    }
    
    io.to(roomId).emit('metals-updated', {
      metals: room.resources.metals,
      fromPlayer: 'system'
    });
  });

  socket.on('reset-all-resources', (data) => {
    const { roomId } = data;
    const room = gameState.rooms[roomId];
    if (!room) return;

    console.log(`Команда ${room.name}: сброс всех ресурсов по запросу от зельевара`);
    
    room.resources.weights = [];
    room.resources.ingredients = [];
    room.resources.metals = [];
    
    io.to(roomId).emit('resources-updated', {
      weights: room.resources.weights,
      ingredients: room.resources.ingredients
    });
    
    io.to(roomId).emit('metals-updated', {
      metals: room.resources.metals,
      fromPlayer: 'system'
    });
    
    io.to(roomId).emit('all-resources-reset', {
      message: 'Все ресурсы сброшены! Начинаем заново!'
    });
  });

  socket.on('get-team-stats', (data) => {
    const { roomId } = data;
    const room = gameState.rooms[roomId];
    
    if (room) {
      socket.emit('team-stats', {
        potionsCount: room.potions.length,
        score: room.score,
        defenseActive: room.defenseActive,
        players: Object.values(room.players).map(p => ({
          name: p.playerName,
          type: p.playerType
        }))
      });
    }
  });

  socket.on('get-metals', (data) => {
    const { roomId } = data;
    const room = gameState.rooms[roomId];
    
    if (room) {
      socket.emit('metals-list', {
        metals: room.resources.metals || []
      });
    }
  });

  socket.on('disconnect', () => {
    for (const roomId in gameState.rooms) {
      const room = gameState.rooms[roomId];
      const player = room.players[socket.id];
      
      if (player) {
        delete room.players[socket.id];
        console.log(`Игрок отключен: ${player.playerName} из команды ${room.name}`);
        
        io.to(roomId).emit('player-left', {
          playerId: player.playerId,
          playerName: player.playerName,
          playersCount: Object.keys(room.players).length,
          roomPlayers: Object.values(room.players)
        });

        const roomsInfo = Object.values(gameState.rooms).map(room => ({
          id: room.id,
          name: room.name,
          icon: room.icon,
          playersCount: Object.keys(room.players).length,
          maxPlayers: room.maxPlayers,
          score: room.score,
          completed: room.completed,
          potionsCount: room.potions.length,
          defenseActive: room.defenseActive,
          players: room.players
        }));
        
        io.emit('rooms-updated', roomsInfo);
        
        break;
      }
    }
  });
});

function getMetalInfo(metalId) {
  const metals = [
    { id: 1, name: 'Алый металл', color: '#FF6B6B' },
    { id: 2, name: 'Лазурный металл', color: '#4ECDC4' },
    { id: 3, name: 'Золотой металл', color: '#FFD166' },
    { id: 4, name: 'Изумрудный металл', color: '#06D6A0' },
    { id: 5, name: 'Сапфировый металл', color: '#118AB2' },
    { id: 6, name: 'Розовый металл', color: '#EF476F' },
    { id: 7, name: 'Темный металл', color: '#073B4C' },
    { id: 8, name: 'Фиолетовый металл', color: '#7209B7' },
    { id: 9, name: 'Оранжевый металл', color: '#F3722C' },
    { id: 10, name: 'Светло-зеленый металл', color: '#90BE6D' }
  ];
  
  return metals.find(m => m.id === metalId);
}

function calculateReward(quality) {
  if (quality >= 90) return { gold: 50, exp: 100, message: "Идеальное зелье! Великолепная работа!" };
  if (quality >= 70) return { gold: 30, exp: 70, message: "Отличное зелье! Команда работает слаженно!" };
  if (quality >= 50) return { gold: 20, exp: 50, message: "Хорошее зелье! Продолжайте в том же духе!" };
  return { gold: 10, exp: 30, message: "Неплохое зелье, но можно лучше!" };
}

function calculateScore(quality) {
  if (quality >= 90) return 100;
  if (quality >= 70) return 70;
  if (quality >= 50) return 50;
  return 30;
}

process.on('SIGINT', () => {
  console.log('\n=== ОСТАНОВКА СЕРВЕРА ===');
  server.close(() => {
    console.log('Сервер успешно остановлен');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n=== ОСТАНОВКА СЕРВЕРА ===');
  server.close(() => {
    console.log('Сервер успешно остановлен');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  const networkIPs = getNetworkIP();
  
  console.log(`\n=== СЕРВЕР ЗАПУЩЕН ===`);
  console.log(`Порт: ${PORT}`);
  console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📱 ДОСТУПНЫЕ АДРЕСА:`);
  console.log(`📍 Локальный: http://localhost:${PORT}`);
  
  networkIPs.forEach(ip => {
    console.log(`🌐 Сетевой: http://${ip}:${PORT}`);
  });
  
  console.log(`\n🎮 СТРАНИЦЫ ИГРЫ:`);
  console.log(`🚪 Выбор команды: http://localhost:${PORT}/room-selection`);
  console.log(`🏆 Рейтинг команд: http://localhost:${PORT}/leaderboard`);
  console.log(`\n👥 СТРАНИЦЫ ИГРОКОВ:`);
  console.log(`⚖️  Игрок 1 (Кузнец Гирь): /player1/:roomId`);
  console.log(`🌿 Игрок 2 (Собиратель Ингредиентов): /player2/:roomId`);
  console.log(`🧪 Игрок 3 (Зельевар): /player3/:roomId`);
  console.log(`⛏️  Игрок 4 (Шахтер): /player4/:roomId`);
  
  console.log(`\n📊 КОМАНДЫ:`);
  console.log(`Всего доступно: ${MAX_ROOMS} команд`);
  console.log(`Базовая инициализация: ${MIN_ROOMS} команд`);
  console.log(`Игроков в команде: ${MAX_PLAYERS_PER_ROOM}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔄 ПЕРЕЗАПУСК:`);
    console.log(`Для перезапуска отправьте POST запрос на /restart`);
    console.log(`Или используйте Ctrl+C для остановки`);
  }
  
  console.log(`\n========================\n`);
});

module.exports = { app, server, io, gameState, updateLeaderboard };