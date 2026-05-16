const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Bellek (Memory) Veritabanı
let students = []; // Kayıtlı Öğrenciler: [{ id, name, descriptor: [] }]
let activeSessions = {}; // Aktif Oturumlar

// --- REST API ---
app.post('/api/students', (req, res) => {
  const { name, descriptor } = req.body;
  const id = 'STU_' + Date.now();
  students.push({ id, name, descriptor });
  console.log(`[DB] Yeni Öğrenci Kaydedildi: ${name}`);
  broadcastState(); // Yeni öğrenci eklenince herkesi güncelle
  res.json({ success: true, student: { id, name } });
});

app.get('/api/students', (req, res) => {
  res.json(students);
});

// --- WEBSOCKET API ---
wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).substring(7);
  
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      
      if (data.type === 'TEACHER_JOIN') {
        ws.role = 'teacher';
        ws.send(JSON.stringify({ type: 'STATE_UPDATE', students, activeSessions: Object.values(activeSessions) }));
      } 
      else if (data.type === 'STUDENT_LOGIN') {
        ws.role = 'student';
        ws.studentName = data.name;
        activeSessions[ws.id] = { 
          studentId: data.studentId, 
          name: data.name, 
          load: 35, 
          risk: 'low', 
          diagnosis: 'Bağlanıyor...',
          online: true 
        };
        console.log(`[Login] ${data.name} bağlandı!`);
        broadcastState();
      } 
      else if (data.type === 'TELEMETRY') {
        if (activeSessions[ws.id]) {
          activeSessions[ws.id].load = data.load;
          activeSessions[ws.id].risk = data.load > 75 ? 'critical' : data.load > 50 ? 'warning' : 'low';
          activeSessions[ws.id].diagnosis = data.diagnosis || 'Analiz ediliyor...';
        }
        broadcastState();
      }
      else if (data.type === 'INTERVENTION') {
        wss.clients.forEach(client => {
          if (client.readyState === 1 && client.role === 'student' && client.studentName === data.studentName) {
            client.send(JSON.stringify({ type: 'INTERVENTION' }));
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', () => {
    if (activeSessions[ws.id]) {
       console.log(`[Logout] ${activeSessions[ws.id].name} ayrıldı!`);
       delete activeSessions[ws.id]; // Yada online=false yapabiliriz
       broadcastState();
    }
  });
});

function broadcastState() {
  const state = {
    type: 'STATE_UPDATE',
    students,
    activeSessions: Object.values(activeSessions)
  };
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.role === 'teacher') {
      client.send(JSON.stringify(state));
    }
  });
}

const PORT = 3001;
// '0.0.0.0' sayesinde aynı ağdaki telefon/diğer PC'ler bağlanabilir!
server.listen(PORT, '0.0.0.0', () => {
  console.log("🚀 SynapseOS Gelişmiş Sunucu Başladı!");
  console.log("🌐 Ağ üzerinden erişim: http://<bilgisayar-ip-adresi>:" + PORT);
});
