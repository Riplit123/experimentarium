const { exec } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3000;

// Проверяем, запущен ли сервер
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/server-info`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

// Отправляем запрос на перезапуск
const restartServer = async () => {
  console.log('🔄 Проверка состояния сервера...');
  
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Сервер не запущен. Запускаем...');
    exec('npm start', (error, stdout, stderr) => {
      if (error) {
        console.error(`Ошибка запуска: ${error}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });
    return;
  }
  
  console.log('✅ Сервер запущен. Отправляем запрос на перезапуск...');
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/restart',
    method: 'POST',
    timeout: 1000
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📨 Ответ сервера:', data);
      console.log('🔄 Сервер должен перезапуститься...');
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Не удалось отправить запрос на перезапуск:', err.message);
    console.log('💡 Возможно, сервер уже перезапускается...');
  });
  
  req.on('timeout', () => {
    console.log('⏰ Таймаут запроса. Сервер, вероятно, перезапускается...');
    req.destroy();
  });
  
  req.end();
};

restartServer();