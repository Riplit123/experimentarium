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

// ================== КОНФИГУРАЦИЯ ==================
const MAX_PLAYERS_PER_TEAM = 3;
const DEFAULT_TEAMS_PER_LOBBY = 3;

// ================== СОСТОЯНИЕ ИГРЫ ==================
const gameState = {
  lobbies: {},
  leaderboard: [],
  layouts: {} // для хранения расположения элементов на страницах
};

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push(iface.address);
      }
    }
  }
  return results;
}

function updateLeaderboard() {
  let allTeams = [];
  for (const [lobbyId, lobby] of Object.entries(gameState.lobbies)) {
    for (const [teamId, team] of Object.entries(lobby.teams)) {
      allTeams.push({
        id: team.id,
        lobbyId: lobbyId,
        name: team.name,
        icon: team.icon,
        score: team.score,
        completed: team.completed,
        completedAt: team.completedAt,
        playersCount: Object.keys(team.players).length,
        potionsCount: team.potions.length,
        defenseActive: team.defenseActive,
        maxPlayers: team.maxPlayers,
        createdAt: team.createdAt
      });
    }
  }

  gameState.leaderboard = allTeams.sort((a, b) => {
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

function checkGameCompletion(team) {
  if (team.potions.length >= 999 && !team.completed) {
    team.completed = true;
    team.completedAt = new Date().toISOString();
    console.log(`🎉 Команда ${team.id} завершила игру!`);
    io.emit('game-completed', {
      teamId: team.id,
      teamName: team.name,
      score: team.score,
      potionsCount: team.potions.length,
      completedAt: team.completedAt
    });
    updateLeaderboard();
  }
}

function checkAttackCooldown(attackerTeamId, targetTeamId) {
  const targetTeam = getTeamById(targetTeamId);
  if (!targetTeam || !targetTeam.cooldownsByAttacker) {
    return { canAttack: true, remainingTime: 0 };
  }
  const cooldownEnd = targetTeam.cooldownsByAttacker[attackerTeamId];
  if (!cooldownEnd) return { canAttack: true, remainingTime: 0 };
  const now = Date.now();
  if (cooldownEnd > now) {
    const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
    return { canAttack: false, remainingTime, reason: 'Кулдаун после атаки' };
  }
  return { canAttack: true, remainingTime: 0 };
}

function setAttackCooldown(attackerTeamId, targetTeamId, duration = 60000) {
  const targetTeam = getTeamById(targetTeamId);
  if (!targetTeam) return;
  if (!targetTeam.cooldownsByAttacker) targetTeam.cooldownsByAttacker = {};
  const now = Date.now();
  targetTeam.cooldownsByAttacker[attackerTeamId] = now + duration;
  setTimeout(() => {
    if (targetTeam.cooldownsByAttacker && targetTeam.cooldownsByAttacker[attackerTeamId] <= Date.now()) {
      delete targetTeam.cooldownsByAttacker[attackerTeamId];
      console.log(`Кулдаун для атакующего ${attackerTeamId} на цель ${targetTeamId} снят`);
    }
  }, duration + 1000);
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

function getTeamById(teamId) {
  for (const lobby of Object.values(gameState.lobbies)) {
    if (lobby.teams[teamId]) return lobby.teams[teamId];
  }
  return null;
}

function getLobbyByTeamId(teamId) {
  for (const lobby of Object.values(gameState.lobbies)) {
    if (lobby.teams[teamId]) return lobby;
  }
  return null;
}

function broadcastLobbies() {
  const lobbiesList = Object.values(gameState.lobbies).map(lobby => ({
    id: lobby.id,
    name: lobby.name,
    playersCount: Object.keys(lobby.players).length,
    icon: '🧪'
  }));
  io.emit('lobbies-updated', lobbiesList);
}

function createDefaultTeams(lobbyId) {
  const teams = {};
  const teamIcons = ['🐉', '🦅', '🦄'];
  for (let i = 1; i <= DEFAULT_TEAMS_PER_LOBBY; i++) {
    const teamId = `team_${lobbyId}_${i}`;
    teams[teamId] = {
      id: teamId,
      name: `Команда ${i}`,
      icon: teamIcons[i-1] || '🐾',
      players: {},
      resources: { weights: [], ingredients: [], metals: [] },
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
      maxPlayers: MAX_PLAYERS_PER_TEAM
    };
  }
  return teams;
}

function createLobby() {
  const lobbyId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const lobbyName = `Лаборатория ${Object.keys(gameState.lobbies).length + 1}`;
  const defaultTeams = createDefaultTeams(lobbyId);
  gameState.lobbies[lobbyId] = {
    id: lobbyId,
    name: lobbyName,
    players: {},
    teams: defaultTeams
  };
  console.log(`✅ Создано лобби: ${lobbyId} (${lobbyName}) с ${DEFAULT_TEAMS_PER_LOBBY} командами`);
  return { lobbyId, lobbyName, teams: defaultTeams };
}

// ================== API МАРШРУТЫ ==================
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

// API для получения списка лобби
app.get('/api/lobbies', (req, res) => {
  const lobbiesInfo = Object.values(gameState.lobbies).map(lobby => ({
    id: lobby.id,
    name: lobby.name,
    playersCount: Object.keys(lobby.players).length,
    teams: Object.values(lobby.teams).map(team => ({
      id: team.id,
      name: team.name,
      icon: team.icon,
      playersCount: Object.keys(team.players).length,
      score: team.score,
      completed: team.completed
    }))
  }));
  res.json(lobbiesInfo);
});

// API для получения списка команд в лобби
app.get('/api/lobbies/:lobbyId/teams', (req, res) => {
  const lobby = gameState.lobbies[req.params.lobbyId];
  if (!lobby) return res.status(404).json({ error: 'Лобби не найдено' });
  const teamsInfo = Object.values(lobby.teams).map(team => ({
    id: team.id,
    name: team.name,
    icon: team.icon,
    playersCount: Object.keys(team.players).length,
    score: team.score,
    completed: team.completed
  }));
  res.json(teamsInfo);
});

// Старый API для совместимости (возвращаем все команды из всех лобби)
app.get('/api/rooms', (req, res) => {
  const allTeams = [];
  for (const lobby of Object.values(gameState.lobbies)) {
    for (const team of Object.values(lobby.teams)) {
      allTeams.push({
        id: team.id,
        name: team.name,
        icon: team.icon,
        playersCount: Object.keys(team.players).length,
        maxPlayers: team.maxPlayers,
        score: team.score,
        completed: team.completed,
        potionsCount: team.potions.length,
        defenseActive: team.defenseActive,
        players: team.players
      });
    }
  }
  res.json(allTeams);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(gameState.leaderboard);
});

app.post('/api/rooms/create', (req, res) => {
  const { lobbyId, teams } = createLobby();
  const firstTeam = Object.values(teams)[0];
  res.json({
    success: true,
    roomId: firstTeam.id,
    roomName: firstTeam.name,
    icon: firstTeam.icon
  });
});

app.delete('/api/rooms/:roomId', (req, res) => {
  const teamId = req.params.roomId;
  const lobby = getLobbyByTeamId(teamId);
  if (!lobby) return res.json({ success: false, message: 'Команда не найдена' });
  const team = lobby.teams[teamId];
  if (!team) return res.json({ success: false, message: 'Команда не найдена' });
  const isDefault = teamId.match(/^team_\w+_([1-3])$/);
  if (isDefault) return res.json({ success: false, message: 'Базовые команды нельзя удалять' });
  if (Object.keys(team.players).length > 0) return res.json({ success: false, message: 'Команда не пуста' });
  delete lobby.teams[teamId];
  console.log(`🗑️ Удалена команда ${teamId} из лобби ${lobby.id}`);
  const teamsList = Object.values(lobby.teams).map(t => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    playersCount: Object.keys(t.players).length
  }));
  io.to(lobby.id).emit('teams-updated', { lobbyId: lobby.id, teams: teamsList });
  updateLeaderboard();
  broadcastLobbies();
  res.json({ success: true, message: 'Команда удалена' });
});

app.get('/api/rooms/stats', (req, res) => {
  let totalTeams = 0, activeTeams = 0, totalPlayers = 0, totalPotions = 0;
  for (const lobby of Object.values(gameState.lobbies)) {
    totalTeams += Object.keys(lobby.teams).length;
    for (const team of Object.values(lobby.teams)) {
      const playersCount = Object.keys(team.players).length;
      if (playersCount > 0) activeTeams++;
      totalPlayers += playersCount;
      totalPotions += team.potions.length;
    }
  }
  res.json({
    totalRooms: totalTeams,
    activeRooms: activeTeams,
    completedRooms: 0,
    totalPlayers,
    totalPotions,
    maxRooms: 100,
    minRooms: 0
  });
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

// ================== СОКЕТ-СОБЫТИЯ ==================
io.on('connection', (socket) => {
  console.log(`Новое подключение: ${socket.id}`);

  // ---- Управление лобби ----
  socket.on('create-lobby', (callback) => {
    const { lobbyId, lobbyName, teams } = createLobby();
    gameState.lobbies[lobbyId].players[socket.id] = {
      socketId: socket.id,
      playerName: `Игрок ${socket.id.substr(0, 4)}`,
      joinedAt: new Date().toISOString()
    };
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;
    const teamsList = Object.values(teams).map(team => ({
      id: team.id,
      name: team.name,
      icon: team.icon,
      playersCount: Object.keys(team.players).length
    }));
    if (callback) callback({ success: true, lobbyId, lobbyName, teams: teamsList });
    broadcastLobbies();
    updateLeaderboard();
  });

  socket.on('get-lobbies', () => {
    const lobbiesList = Object.values(gameState.lobbies).map(lobby => ({
      id: lobby.id,
      name: lobby.name,
      playersCount: Object.keys(lobby.players).length,
      icon: '🧪'
    }));
    socket.emit('lobbies-list', lobbiesList);
  });

  socket.on('join-lobby', ({ lobbyId }, callback) => {
    const lobby = gameState.lobbies[lobbyId];
    if (!lobby) {
      if (callback) callback({ success: false, message: 'Лаборатория не найдена' });
      return;
    }
    if (lobby.players[socket.id]) {
      const teamsList = Object.values(lobby.teams).map(team => ({
        id: team.id,
        name: team.name,
        icon: team.icon,
        playersCount: Object.keys(team.players).length
      }));
      if (callback) callback({ success: true, lobbyId, teams: teamsList });
      return;
    }
    lobby.players[socket.id] = {
      socketId: socket.id,
      playerName: `Игрок ${socket.id.substr(0, 4)}`,
      joinedAt: new Date().toISOString()
    };
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;
    const teamsList = Object.values(lobby.teams).map(team => ({
      id: team.id,
      name: team.name,
      icon: team.icon,
      playersCount: Object.keys(team.players).length
    }));
    if (callback) callback({ success: true, lobbyId, teams: teamsList });
    broadcastLobbies();
    updateLeaderboard();
  });

  socket.on('create-team', ({ lobbyId, teamName }, callback) => {
    const lobby = gameState.lobbies[lobbyId];
    if (!lobby) {
      if (callback) callback({ success: false, message: 'Лаборатория не найдена' });
      return;
    }
    if (!lobby.players[socket.id]) {
      if (callback) callback({ success: false, message: 'Вы не в этой лаборатории' });
      return;
    }
    const teamId = `team_${lobbyId}_${Date.now()}`;
    lobby.teams[teamId] = {
      id: teamId,
      name: teamName,
      icon: '🧪',
      players: {},
      resources: { weights: [], ingredients: [], metals: [] },
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
      maxPlayers: MAX_PLAYERS_PER_TEAM
    };
    const teamsList = Object.values(lobby.teams).map(team => ({
      id: team.id,
      name: team.name,
      icon: team.icon,
      playersCount: Object.keys(team.players).length
    }));
    if (callback) callback({ success: true, teams: teamsList });
    io.to(lobbyId).emit('teams-updated', { lobbyId, teams: teamsList });
    updateLeaderboard();
    broadcastLobbies();
  });

  socket.on('get-teams', ({ lobbyId }, callback) => {
    const lobby = gameState.lobbies[lobbyId];
    if (!lobby) {
      if (callback) callback({ success: false, message: 'Лаборатория не найдена' });
      return;
    }
    const teamsList = Object.values(lobby.teams).map(team => ({
      id: team.id,
      name: team.name,
      icon: team.icon,
      playersCount: Object.keys(team.players).length
    }));
    if (callback) callback({ success: true, teams: teamsList });
  });

  // ---- Проверка команды ----
  socket.on('check-team', ({ teamId, lobbyId }, callback) => {
    console.log(`Проверка команды: teamId=${teamId}, lobbyId=${lobbyId}`);
    if (lobbyId && gameState.lobbies[lobbyId] && gameState.lobbies[lobbyId].teams[teamId]) {
      const team = gameState.lobbies[lobbyId].teams[teamId];
      callback({
        success: true,
        team: {
          id: team.id,
          name: team.name,
          icon: team.icon,
          players: team.players,
          maxPlayers: team.maxPlayers,
          completed: team.completed,
          playersCount: Object.keys(team.players).length
        }
      });
    } else {
      const found = getTeamById(teamId);
      if (found) {
        const lobby = getLobbyByTeamId(teamId);
        callback({
          success: true,
          team: {
            id: found.id,
            name: found.name,
            icon: found.icon,
            players: found.players,
            maxPlayers: found.maxPlayers,
            completed: found.completed,
            playersCount: Object.keys(found.players).length
          },
          lobbyId: lobby ? lobby.id : null
        });
      } else {
        callback({ success: false, message: 'Команда не найдена' });
      }
    }
  });

  // ---- Игровая логика ----
  socket.on('register-player', (data, callback) => {
    const { playerId, playerType, playerName, roomId, lobbyId, teamId } = data;
    const actualTeamId = roomId || teamId;
    const team = getTeamById(actualTeamId);
    if (!team) {
      if (callback) callback({ error: true, message: 'Команда не найдена' });
      else socket.emit('error', { message: 'Команда не найдена' });
      return;
    }
    const lobby = getLobbyByTeamId(actualTeamId);
    if (!lobby) {
      if (callback) callback({ error: true, message: 'Лобби не найдено' });
      else socket.emit('error', { message: 'Лобби не найдено' });
      return;
    }
    if (Object.keys(team.players).length >= team.maxPlayers) {
      if (callback) callback({ error: true, message: 'Команда уже заполнена' });
      else socket.emit('error', { message: 'Команда уже заполнена' });
      return;
    }
    if (team.completed) {
      if (callback) callback({ error: true, message: 'Игра в этой команде уже завершена' });
      else socket.emit('error', { message: 'Игра в этой команде уже завершена' });
      return;
    }
    if (playerType !== 'miner') {
      const existingPlayer = Object.values(team.players).find(p => p.playerType === playerType);
      if (existingPlayer) {
        if (callback) callback({ error: true, message: 'Эта роль уже занята в выбранной команде' });
        else socket.emit('error', { message: 'Эта роль уже занята в выбранной команде' });
        return;
      }
    }
    team.players[socket.id] = {
      playerId,
      playerType,
      playerName,
      socketId: socket.id,
      roomId: actualTeamId,
      connected: true,
      joinedAt: new Date().toISOString()
    };
    socket.join(actualTeamId);
    socket.data.teamId = actualTeamId;
    socket.data.lobbyId = lobby.id;
    console.log(`Зарегистрирован игрок: ${playerName} (${playerType}) в команде ${team.name} (лобби ${lobby.name})`);
    socket.emit('game-state', team);
    io.to(actualTeamId).emit('player-joined', {
      playerId,
      playerType,
      playerName,
      playersCount: Object.keys(team.players).length,
      roomPlayers: Object.values(team.players)
    });
    const teamsList = Object.values(lobby.teams).map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      playersCount: Object.keys(t.players).length
    }));
    io.to(lobby.id).emit('teams-updated', { lobbyId: lobby.id, teams: teamsList });
    broadcastLobbies();
    updateLeaderboard();
    if (callback) callback({ success: true });
  });

  socket.on('get-rooms', () => {
    const allTeams = [];
    for (const lobby of Object.values(gameState.lobbies)) {
      for (const team of Object.values(lobby.teams)) {
        let cooldownEndForMe = null;
        if (socket.data.teamId && team.cooldownsByAttacker && team.cooldownsByAttacker[socket.data.teamId]) {
          const cd = team.cooldownsByAttacker[socket.data.teamId];
          if (cd > Date.now()) cooldownEndForMe = cd;
        }
        allTeams.push({
          id: team.id,
          name: team.name,
          icon: team.icon,
          playersCount: Object.keys(team.players).length,
          maxPlayers: team.maxPlayers,
          score: team.score,
          completed: team.completed,
          potionsCount: team.potions.length,
          defenseActive: team.defenseActive,
          players: team.players,
          cooldownEnd: cooldownEndForMe
        });
      }
    }
    socket.emit('rooms-list', allTeams);
  });

  socket.on('create-room', (callback) => {
    const { lobbyId, teams } = createLobby();
    const firstTeam = Object.values(teams)[0];
    gameState.lobbies[lobbyId].players[socket.id] = {
      socketId: socket.id,
      playerName: `Игрок ${socket.id.substr(0, 4)}`,
      joinedAt: new Date().toISOString()
    };
    socket.join(lobbyId);
    socket.data.lobbyId = lobbyId;
    if (callback) callback({
      success: true,
      roomId: firstTeam.id,
      roomName: firstTeam.name,
      icon: firstTeam.icon
    });
    broadcastLobbies();
    updateLeaderboard();
  });

  // --- Другие игровые события (без изменений) ---
  socket.on('send-weights', (data) => {
    const { weights, playerId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    const player = team.players[socket.id];
    if (player && player.playerType === 'weightGatherer') {
      team.resources.weights = [...team.resources.weights, ...weights];
      console.log(`Команда ${team.name}: получены гири от ${playerId}:`, weights);
      io.to(roomId).emit('weights-updated', {
        weights: team.resources.weights,
        fromPlayer: playerId
      });
    }
  });

  socket.on('send-metals', (data) => {
    const { metals, playerId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    const player = team.players[socket.id];
    if (player && player.playerType === 'miner') {
      if (!team.resources.metals) team.resources.metals = [];
      metals.forEach(metal => {
        const existing = team.resources.metals.find(m => m.id === metal.id);
        if (existing) existing.count = (existing.count || 0) + (metal.count || 1);
        else team.resources.metals.push({ id: metal.id, name: metal.name, color: metal.color, count: metal.count || 1 });
      });
      console.log(`Команда ${team.name}: получены металлы от ${playerId}:`, metals);
      io.to(roomId).emit('metals-updated', {
        metals: team.resources.metals,
        fromPlayer: playerId
      });
    }
  });

  socket.on('send-ingredients', (data) => {
    const { ingredients, playerId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    const player = team.players[socket.id];
    if (player && player.playerType === 'ingredientGatherer') {
      if (team.ingredientSendBlocked) {
        socket.emit('error', { message: 'Отправка ингредиентов заблокирована на 1 минуту!' });
        return;
      }
      const filtered = ingredients.filter(ing => {
        if (team.ingredientBlocked && ing.name === team.ingredientBlocked) return false;
        return true;
      });
      if (filtered.length === 0) {
        socket.emit('error', { message: `Все ингредиенты заблокированы! Нельзя отправить ${team.ingredientBlocked}` });
        return;
      }
      team.resources.ingredients = [...team.resources.ingredients, ...filtered];
      console.log(`Команда ${team.name}: получены ингредиенты от ${playerId}:`, filtered);
      io.to(roomId).emit('ingredients-updated', {
        ingredients: team.resources.ingredients,
        fromPlayer: playerId
      });
    }
  });

  socket.on('create-potion', (data) => {
    const { potion, playerId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    const player = team.players[socket.id];
    if (player && player.playerType === 'potionMaker') {
      const newPotion = {
        ...potion,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        createdBy: playerId
      };
      team.potions.push(newPotion);
      team.score += calculateScore(potion.quality);
      console.log(`Команда ${team.name}: создано зелье игроком ${playerId}:`, potion);
      io.to(roomId).emit('potion-created', {
        potion: newPotion,
        potionsCount: team.potions.length,
        roomScore: team.score
      });
      const reward = calculateReward(potion.quality);
      io.to(roomId).emit('team-reward', { reward, potionName: potion.name, quality: potion.quality, createdBy: playerId });
      updateLeaderboard();
      checkGameCompletion(team);
    }
  });

  socket.on('activate-defense', (data) => {
    const { potionId, potionName, roomId, playerId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    const player = team.players[socket.id];
    if (player && player.playerType === 'potionMaker') {
      team.defenseActive = true;
      console.log(`Команда ${team.name}: активирована защита игроком ${playerId}`);
      io.to(roomId).emit('defense-activated', {
        potionId,
        potionName,
        playerId,
        defenseActive: true,
        defenseCount: 1
      });
      const lobby = getLobbyByTeamId(roomId);
      if (lobby) {
        const teamsList = Object.values(lobby.teams).map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          playersCount: Object.keys(t.players).length
        }));
        io.to(lobby.id).emit('teams-updated', { lobbyId: lobby.id, teams: teamsList });
      }
      updateLeaderboard();
    }
  });

  socket.on('use-attack-potion', (data) => {
    const { potionId, potionName, potionType, targetRole, roomId, targetRoom, targetIngredient, playerId, playerName } = data;
    const attackerTeam = getTeamById(roomId);
    const targetTeam = getTeamById(targetRoom);
    if (!attackerTeam || !targetTeam) {
      socket.emit('error', { message: 'Команда не найдена' });
      return;
    }
    const player = attackerTeam.players[socket.id];
    if (player && player.playerType === 'potionMaker') {
      console.log(`Игрок ${playerId} из команды ${attackerTeam.name} атакует команду ${targetTeam.name} зельем ${potionName}`);
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
      if (targetTeam.defenseActive) {
        console.log(`Защита команды ${targetTeam.name} отразила атаку`);
        targetTeam.defenseActive = false;
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
        const lobbyTarget = getLobbyByTeamId(targetRoom);
        if (lobbyTarget) {
          const teamsList = Object.values(lobbyTarget.teams).map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            playersCount: Object.keys(t.players).length
          }));
          io.to(lobbyTarget.id).emit('teams-updated', { lobbyId: lobbyTarget.id, teams: teamsList });
        }
        updateLeaderboard();
      } else {
        console.log(`Атака на команду ${targetTeam.name} успешна`);
        setAttackCooldown(roomId, targetRoom, 60000);
        if (potionType === 'attack3' && targetIngredient) {
          targetTeam.ingredientBlocked = targetIngredient;
          if (targetTeam.ingredientBlockTimer) clearTimeout(targetTeam.ingredientBlockTimer);
          targetTeam.ingredientBlockTimer = setTimeout(() => {
            if (targetTeam.ingredientBlocked === targetIngredient) {
              targetTeam.ingredientBlocked = null;
              targetTeam.ingredientBlockTimer = null;
              console.log(`Ингредиент ${targetIngredient} разблокирован для команды ${targetRoom}`);
              io.to(targetRoom).emit('ingredient-unblocked', {
                ingredient: targetIngredient,
                message: `Ингредиент "${targetIngredient}" снова доступен для создания`
              });
            }
          }, 60000);
          console.log(`Ингредиент ${targetIngredient} заблокирован для команды ${targetTeam.name} на 1 минуту`);
        } else if (potionType === 'attack4') {
          targetTeam.ingredientSendBlocked = true;
          if (targetTeam.ingredientSendBlockTimer) clearTimeout(targetTeam.ingredientSendBlockTimer);
          targetTeam.ingredientSendBlockTimer = setTimeout(() => {
            targetTeam.ingredientSendBlocked = false;
            targetTeam.ingredientSendBlockTimer = null;
            console.log(`Отправка ингредиентов разблокирована для команды ${targetRoom}`);
            io.to(targetRoom).emit('ingredient-send-unblocked', {
              message: 'Отправка ингредиентов снова доступна'
            });
          }, 60000);
          console.log(`Отправка ингредиентов заблокирована для команды ${targetTeam.name} на 1 минуту`);
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
        console.log(`Атака ${potionName} от команды ${attackerTeam.name} применена к команде ${targetTeam.name}`);
      }
    }
  });

  socket.on('use-resources', (data) => {
    const { weightsUsed, ingredientsUsed, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    team.resources.weights = team.resources.weights.filter(w => !weightsUsed.includes(w.id));
    team.resources.ingredients = team.resources.ingredients.filter(i => !ingredientsUsed.includes(i.id));
    console.log(`Команда ${team.name}: ресурсы использованы:`, { weightsUsed, ingredientsUsed });
    io.to(roomId).emit('resources-updated', {
      weights: team.resources.weights,
      ingredients: team.resources.ingredients
    });
  });

  socket.on('use-metal', (data) => {
    const { metalId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team || !team.resources.metals) return;
    const metal = team.resources.metals.find(m => m.id === metalId);
    if (!metal) return;
    if (metal.count > 1) metal.count--;
    else {
      const index = team.resources.metals.findIndex(m => m.id === metalId);
      if (index !== -1) team.resources.metals.splice(index, 1);
    }
    io.to(roomId).emit('metals-updated', {
      metals: team.resources.metals,
      fromPlayer: 'system'
    });
  });

  socket.on('return-metal', (data) => {
    const { metalId, roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    if (!team.resources.metals) team.resources.metals = [];
    const existing = team.resources.metals.find(m => m.id === metalId);
    if (existing) existing.count = (existing.count || 0) + 1;
    else {
      const metalInfo = getMetalInfo(metalId);
      if (metalInfo) team.resources.metals.push({ id: metalId, name: metalInfo.name, color: metalInfo.color, count: 1 });
    }
    io.to(roomId).emit('metals-updated', {
      metals: team.resources.metals,
      fromPlayer: 'system'
    });
  });

  socket.on('reset-all-resources', (data) => {
    const { roomId } = data;
    const team = getTeamById(roomId);
    if (!team) return;
    console.log(`Команда ${team.name}: сброс всех ресурсов по запросу от зельевара`);
    team.resources.weights = [];
    team.resources.ingredients = [];
    team.resources.metals = [];
    io.to(roomId).emit('resources-updated', {
      weights: team.resources.weights,
      ingredients: team.resources.ingredients
    });
    io.to(roomId).emit('metals-updated', {
      metals: team.resources.metals,
      fromPlayer: 'system'
    });
    io.to(roomId).emit('all-resources-reset', {
      message: 'Все ресурсы сброшены! Начинаем заново!'
    });
  });

  socket.on('get-team-stats', (data) => {
    const { roomId } = data;
    const team = getTeamById(roomId);
    if (team) {
      socket.emit('team-stats', {
        potionsCount: team.potions.length,
        score: team.score,
        defenseActive: team.defenseActive,
        players: Object.values(team.players).map(p => ({ name: p.playerName, type: p.playerType }))
      });
    }
  });

  socket.on('get-metals', (data) => {
    const { roomId } = data;
    const team = getTeamById(roomId);
    if (team) {
      socket.emit('metals-list', { metals: team.resources.metals || [] });
    }
  });

  // ---- Layout events ----
  socket.on('save-layout', (data) => {
    const { roomId, layout } = data;
    if (!gameState.layouts) gameState.layouts = {};
    gameState.layouts[roomId] = layout;
    console.log(`Layout сохранён для комнаты ${roomId}`);
    socket.emit('layout-saved', { success: true });
  });

  socket.on('load-layout', (data) => {
    const { roomId } = data;
    if (gameState.layouts && gameState.layouts[roomId]) {
      socket.emit('layout-loaded', { layout: gameState.layouts[roomId] });
    } else {
      socket.emit('layout-loaded', { layout: null });
    }
  });

  // ---- Disconnect ----
  socket.on('disconnect', () => {
    const lobbyId = socket.data.lobbyId;
    const teamId = socket.data.teamId;
    if (lobbyId && gameState.lobbies[lobbyId]) {
      const lobby = gameState.lobbies[lobbyId];
      delete lobby.players[socket.id];
      if (teamId && lobby.teams[teamId]) {
        const team = lobby.teams[teamId];
        const player = team.players[socket.id];
        if (player) {
          delete team.players[socket.id];
          console.log(`Игрок отключен: ${player.playerName} из команды ${team.name}`);
          io.to(teamId).emit('player-left', {
            playerId: player.playerId,
            playerName: player.playerName,
            playersCount: Object.keys(team.players).length,
            roomPlayers: Object.values(team.players)
          });
        }
        const teamsList = Object.values(lobby.teams).map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          playersCount: Object.keys(t.players).length
        }));
        io.to(lobbyId).emit('teams-updated', { lobbyId, teams: teamsList });
      }
      // НОВЫЙ КОД: Вместо мгновенного удаления даем время на переход между страницами
            if (Object.keys(lobby.players).length === 0) {
                // Проверяем, есть ли игроки внутри команд этого лобби
                const hasPlayersInTeams = Object.values(lobby.teams).some(
                    team => Object.keys(team.players).length > 0
                );
                
                if (!hasPlayersInTeams) {
                    console.log(`Лобби ${lobbyId} пустое. Ожидаем переподключения...`);
                    // Даем 2 минуты (120000 мс) на выбор роли, прежде чем удалять лобби
                    setTimeout(() => {
                        const currentLobby = gameState.lobbies[lobbyId];
                        // Если лобби еще существует, проверяем, не зашел ли кто-то за это время
                        if (currentLobby) {
                            const stillEmpty = Object.keys(currentLobby.players).length === 0 && 
                                !Object.values(currentLobby.teams).some(t => Object.keys(t.players).length > 0);
                            
                            if (stillEmpty) {
                                delete gameState.lobbies[lobbyId];
                                console.log(`Лобби ${lobbyId} окончательно удалено (по таймауту)`);
                                broadcastLobbies();
                                updateLeaderboard();
                            }
                        }
                    }, 120000);
                }
            }
      broadcastLobbies();
      updateLeaderboard();
    }
  });
});

// ================== ЗАПУСК СЕРВЕРА ==================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  const networkIPs = getNetworkIP();
  console.log(`\n=== СЕРВЕР ЗАПУЩЕН ===`);
  console.log(`Порт: ${PORT}`);
  console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📱 ДОСТУПНЫЕ АДРЕСА:`);
  console.log(`📍 Локальный: http://localhost:${PORT}`);
  networkIPs.forEach(ip => console.log(`🌐 Сетевой: http://${ip}:${PORT}`));
  console.log(`\n🎮 СТРАНИЦЫ ИГРЫ:`);
  console.log(`🚪 Выбор команды: http://localhost:${PORT}/room-selection`);
  console.log(`🏆 Рейтинг команд: http://localhost:${PORT}/leaderboard`);
  console.log(`\n👥 СТРАНИЦЫ ИГРОКОВ:`);
  console.log(`⚖️  Игрок 1 (Кузнец Гирь): /player1/:roomId`);
  console.log(`🌿 Игрок 2 (Собиратель Ингредиентов): /player2/:roomId`);
  console.log(`🧪 Игрок 3 (Зельевар): /player3/:roomId`);
  console.log(`⛏️  Игрок 4 (Шахтер): /player4/:roomId`);
  console.log(`\n📊 КОМАНДЫ И ЛОББИ:`);
  console.log(`Новая структура: лобби (лаборатории) содержат команды.`);
  console.log(`Макс игроков в команде: ${MAX_PLAYERS_PER_TEAM}`);
  console.log(`\n========================\n`);
});

module.exports = { app, server, io, gameState, updateLeaderboard };
