const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Session yapılandırması
const sessionMiddleware = session({
  secret: "onder7-chat-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 saat
    secure: false 
  }
});

app.use(sessionMiddleware);
app.use(express.static("public"));
app.use(express.json());

// Socket.IO ile session paylaşımı
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Log dosyası yolu
const LOG_DIR = path.join(__dirname, "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

app.get("/test", (req, res) => {
  res.send("Node.js ÇALIŞIYOR ✔");
});

let onlineUsers = 0;
const users = new Map(); // Kullanıcı bilgilerini sakla
const sessions = new Map(); // Session bilgileri (sessionId -> userData)
const messageHistory = new Map(); // Oda bazlı mesaj geçmişi (roomId -> mesajlar)
const MAX_HISTORY_PER_ROOM = 100; // Her oda için 100 mesaj
const rooms = new Map(); // Oda sistemi
const userRooms = new Map(); // Kullanıcı-oda eşleşmeleri
const privateMessages = new Map(); // Özel mesaj geçmişi (socketId -> mesajlar)
const MAX_PRIVATE_MESSAGES = 200; // Her kullanıcı için 200 özel mesaj
const admins = new Set(["admin", "onder7"]); // Admin kullanıcı adları
const bannedUsers = new Set(); // Yasaklı kullanıcılar
const mutedUsers = new Map(); // Susturulmuş kullanıcılar (socketId -> süre)
const activityLogs = []; // Tüm aktivite logları
const loginHistory = []; // Giriş geçmişi
const MAX_LOGS = 1000;

// Varsayılan odalar
rooms.set("genel", { name: "Genel", users: new Set() });
rooms.set("teknoloji", { name: "Teknoloji", users: new Set() });
rooms.set("oyun", { name: "Oyun", users: new Set() });

// Her oda için mesaj geçmişi başlat
messageHistory.set("genel", []);
messageHistory.set("teknoloji", []);
messageHistory.set("oyun", []);

// Log fonksiyonu
function addLog(type, action, user, details = {}) {
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleString("tr-TR"),
    type, // "auth", "message", "admin", "system"
    action, // "login", "logout", "send_message", "kick", "ban", etc.
    user: user || "System",
    details,
    ip: details.ip || "unknown"
  };
  
  activityLogs.unshift(logEntry);
  if (activityLogs.length > MAX_LOGS) {
    activityLogs.pop();
  }
  
  // Log dosyasına yaz
  const logFile = path.join(LOG_DIR, `chat-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");
  
  return logEntry;
}

io.on("connection", (socket) => {
  onlineUsers++;
  const sessionId = socket.request.session.id;
  const ip = socket.handshake.address;
  
  console.log("Kullanıcı bağlandı:", socket.id, "Session:", sessionId, "IP:", ip);
  
  addLog("system", "connection", "Anonymous", { 
    socketId: socket.id, 
    sessionId,
    ip 
  });
  
  // Session'dan kullanıcı bilgisi varsa otomatik giriş yap
  if (socket.request.session.userData) {
    const userData = socket.request.session.userData;
    socket.emit("autoLogin", userData);
  }
  
  // Yeni kullanıcıya hoş geldin mesajı
  socket.emit("serverMessage", "Socket.IO çalışıyor! Hoş geldin! 🎉");
  
  // Genel oda mesaj geçmişini gönder
  socket.emit("messageHistory", messageHistory.get("genel") || []);
  
  // Herkese online kullanıcı sayısını gönder
  io.emit("userCount", onlineUsers);
  
  // Kullanıcı adı ve profil resmi ayarla
  socket.on("setUsername", (data) => {
    const { username, avatar } = data;
    const sessionId = socket.request.session.id;
    const ip = socket.handshake.address;
    
    // Yasaklı kullanıcı kontrolü
    if (bannedUsers.has(username)) {
      socket.emit("banned", "Bu kullanıcı adı yasaklanmıştır!");
      addLog("auth", "login_failed", username, { 
        reason: "banned", 
        socketId: socket.id,
        sessionId,
        ip 
      });
      return;
    }
    
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    const isAdmin = admins.has(username);
    const loginTime = new Date();
    
    const userData = { 
      username, 
      color, 
      avatar: avatar || "👤", 
      room: "genel",
      isAdmin,
      socketId: socket.id,
      sessionId,
      ip,
      loginTime: loginTime.toISOString(),
      lastActivity: loginTime.toISOString()
    };
    
    users.set(socket.id, userData);
    sessions.set(sessionId, userData);
    
    // Session'a kaydet
    socket.request.session.userData = userData;
    socket.request.session.save();
    
    socket.emit("userColor", color);
    
    // Giriş geçmişine ekle
    loginHistory.unshift({
      username,
      avatar,
      isAdmin,
      loginTime: loginTime.toLocaleString("tr-TR"),
      ip,
      sessionId
    });
    if (loginHistory.length > 100) loginHistory.pop();
    
    // Log ekle
    addLog("auth", "login", username, { 
      avatar, 
      isAdmin, 
      socketId: socket.id,
      sessionId,
      ip 
    });
    
    // Admin ise bildir
    if (isAdmin) {
      socket.emit("adminStatus", true);
    }
    
    // Kullanıcıyı genel odaya ekle
    socket.join("genel");
    rooms.get("genel").users.add(socket.id);
    userRooms.set(socket.id, "genel");
    
    // Özel mesaj geçmişini başlat
    privateMessages.set(socket.id, []);
    
    io.to("genel").emit("serverMessage", `${username} sohbete katıldı! 👋`);
    socket.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ id, name: room.name, userCount: room.users.size })));
    socket.emit("currentRoom", "genel");
  });
  
  // Chat mesajı geldiğinde
  socket.on("chatMessage", (msg) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    // Susturulmuş kullanıcı kontrolü
    if (mutedUsers.has(socket.id)) {
      socket.emit("muted", "Susturulmuş durumdasınız!");
      return;
    }
    
    const timestamp = new Date().toLocaleTimeString("tr-TR");
    const room = userRooms.get(socket.id) || "genel";
    
    const messageData = {
      id: socket.id,
      socketId: socket.id.substring(0, 6),
      username: user.username,
      color: user.color,
      avatar: user.avatar,
      message: msg,
      time: timestamp,
      room: room,
      edited: false,
      isAdmin: user.isAdmin
    };
    
    // Odaya özel mesaj geçmişine ekle
    if (!messageHistory.has(room)) {
      messageHistory.set(room, []);
    }
    const roomHistory = messageHistory.get(room);
    roomHistory.push(messageData);
    if (roomHistory.length > MAX_HISTORY_PER_ROOM) {
      roomHistory.shift();
    }
    
    // Log ekle
    addLog("message", "send", user.username, { 
      room, 
      messageLength: msg.length,
      socketId: socket.id,
      ip: user.ip
    });
    
    // Son aktiviteyi güncelle
    user.lastActivity = new Date().toISOString();
    
    io.to(room).emit("chatMessage", messageData);
  });
  
  // Özel mesaj gönder
  socket.on("privateMessage", (data) => {
    const { targetId, message } = data;
    const timestamp = new Date().toLocaleTimeString("tr-TR");
    const user = users.get(socket.id);
    const targetUser = Array.from(users.entries()).find(([id, u]) => id.substring(0, 6) === targetId);
    
    if (!user || !targetUser) return;
    
    const messageData = {
      id: Date.now().toString(),
      senderId: socket.id,
      senderSocketId: socket.id.substring(0, 6),
      targetId: targetUser[0],
      targetSocketId: targetId,
      username: user.username,
      targetUsername: targetUser[1].username,
      color: user.color,
      avatar: user.avatar,
      message: message,
      time: timestamp,
      private: true,
      read: false
    };
    
    // Özel mesaj geçmişine ekle
    if (!privateMessages.has(socket.id)) privateMessages.set(socket.id, []);
    if (!privateMessages.has(targetUser[0])) privateMessages.set(targetUser[0], []);
    
    const senderMessages = privateMessages.get(socket.id);
    const targetMessages = privateMessages.get(targetUser[0]);
    
    senderMessages.push(messageData);
    targetMessages.push(messageData);
    
    // Mesaj limitini kontrol et
    if (senderMessages.length > MAX_PRIVATE_MESSAGES) {
      senderMessages.shift();
    }
    if (targetMessages.length > MAX_PRIVATE_MESSAGES) {
      targetMessages.shift();
    }
    
    // Gönderene ve alıcıya gönder
    socket.emit("privateMessage", messageData);
    io.to(targetUser[0]).emit("privateMessage", messageData);
    
    // Alıcıya bildirim gönder
    io.to(targetUser[0]).emit("newPrivateMessage", {
      from: user.username,
      avatar: user.avatar,
      preview: message.substring(0, 50)
    });
  });
  
  // Özel mesaj geçmişini getir
  socket.on("getPrivateMessages", (targetId) => {
    const messages = privateMessages.get(socket.id) || [];
    const targetUser = Array.from(users.entries()).find(([id, u]) => id.substring(0, 6) === targetId);
    
    if (!targetUser) return;
    
    // Sadece bu kullanıcı ile olan mesajları filtrele
    const filteredMessages = messages.filter(m => 
      (m.senderId === socket.id && m.targetId === targetUser[0]) ||
      (m.senderId === targetUser[0] && m.targetId === socket.id)
    );
    
    socket.emit("privateMessageHistory", {
      targetId,
      targetUsername: targetUser[1].username,
      messages: filteredMessages
    });
  });
  
  // Özel mesajı okundu olarak işaretle
  socket.on("markAsRead", (messageId) => {
    const messages = privateMessages.get(socket.id) || [];
    const msg = messages.find(m => m.id === messageId);
    if (msg) {
      msg.read = true;
    }
  });
  
  // Mesaj düzenle
  socket.on("editMessage", (data) => {
    const { messageId, newMessage } = data;
    const room = userRooms.get(socket.id) || "genel";
    
    // Odanın mesaj geçmişinde güncelle
    const roomHistory = messageHistory.get(room) || [];
    const msgIndex = roomHistory.findIndex(m => m.id === messageId && m.id === socket.id);
    if (msgIndex !== -1) {
      roomHistory[msgIndex].message = newMessage;
      roomHistory[msgIndex].edited = true;
      io.to(room).emit("messageEdited", { messageId, newMessage });
    }
  });
  
  // Mesaj sil
  socket.on("deleteMessage", (messageId) => {
    const room = userRooms.get(socket.id) || "genel";
    
    // Odanın mesaj geçmişinden sil
    const roomHistory = messageHistory.get(room) || [];
    const msgIndex = roomHistory.findIndex(m => m.id === messageId && m.id === socket.id);
    if (msgIndex !== -1) {
      roomHistory.splice(msgIndex, 1);
      io.to(room).emit("messageDeleted", messageId);
    }
  });
  
  // Oda değiştir
  socket.on("joinRoom", (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    const oldRoom = userRooms.get(socket.id);
    if (oldRoom) {
      socket.leave(oldRoom);
      rooms.get(oldRoom)?.users.delete(socket.id);
      io.to(oldRoom).emit("serverMessage", `${user.username} odadan ayrıldı`);
    }
    
    socket.join(roomId);
    rooms.get(roomId)?.users.add(socket.id);
    userRooms.set(socket.id, roomId);
    user.room = roomId;
    
    // Yeni odanın mesaj geçmişini gönder
    const roomHistory = messageHistory.get(roomId) || [];
    socket.emit("messageHistory", roomHistory);
    
    io.to(roomId).emit("serverMessage", `${user.username} odaya katıldı! 👋`);
    socket.emit("currentRoom", roomId);
    
    // Tüm odalara kullanıcı sayısını güncelle
    io.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ id, name: room.name, userCount: room.users.size })));
  });
  
  // Online kullanıcıları listele
  socket.on("getOnlineUsers", () => {
    const room = userRooms.get(socket.id) || "genel";
    const roomUsers = Array.from(rooms.get(room)?.users || [])
      .map(id => {
        const user = users.get(id);
        if (!user) return null;
        
        // Okunmamış mesaj sayısı
        const unreadCount = (privateMessages.get(socket.id) || [])
          .filter(m => m.senderId === id && m.targetId === socket.id && !m.read)
          .length;
        
        return { 
          id: id.substring(0, 6), 
          fullId: id,
          username: user.username, 
          color: user.color, 
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          unreadCount
        };
      })
      .filter(u => u !== null);
    
    socket.emit("onlineUsers", roomUsers);
  });
  
  // Admin komutları
  socket.on("adminAction", (data) => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit("error", "Bu işlem için yetkiniz yok!");
      return;
    }
    
    const { action, targetId, reason, duration } = data;
    const targetUser = Array.from(users.entries()).find(([id]) => id.substring(0, 6) === targetId);
    
    if (!targetUser) {
      socket.emit("error", "Kullanıcı bulunamadı!");
      return;
    }
    
    const [targetSocketId, targetUserData] = targetUser;
    
    // Log ekle
    addLog("admin", action, user.username, { 
      target: targetUserData.username,
      reason,
      duration,
      socketId: socket.id,
      targetSocketId,
      ip: user.ip
    });
    
    switch(action) {
      case "kick":
        io.to(targetSocketId).emit("kicked", reason || "Odadan atıldınız!");
        io.to(targetSocketId).disconnectSockets();
        io.emit("serverMessage", `⚠️ ${targetUserData.username} admin tarafından atıldı!`);
        break;
        
      case "ban":
        bannedUsers.add(targetUserData.username);
        io.to(targetSocketId).emit("banned", reason || "Yasaklandınız!");
        io.to(targetSocketId).disconnectSockets();
        io.emit("serverMessage", `🚫 ${targetUserData.username} admin tarafından yasaklandı!`);
        break;
        
      case "mute":
        mutedUsers.set(targetSocketId, Date.now() + (duration || 300000));
        io.to(targetSocketId).emit("muted", `${duration/1000} saniye susturuldunuz!`);
        io.emit("serverMessage", `🔇 ${targetUserData.username} admin tarafından susturuldu!`);
        break;
        
      case "unmute":
        mutedUsers.delete(targetSocketId);
        io.to(targetSocketId).emit("unmuted", "Susturmanız kaldırıldı!");
        io.emit("serverMessage", `🔊 ${targetUserData.username} susturması kaldırıldı!`);
        break;
        
      case "warn":
        io.to(targetSocketId).emit("warning", reason || "Kurallara uyun!");
        break;
    }
    
    socket.emit("adminActionSuccess", `İşlem başarılı: ${action}`);
  });
  
  // Admin istatistikleri
  socket.on("getAdminStats", () => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) return;
    
    // Tüm odaların toplam mesaj sayısı
    let totalMessages = 0;
    messageHistory.forEach(roomMessages => {
      totalMessages += roomMessages.length;
    });
    
    // Genel odanın son mesajları
    const generalRoomMessages = messageHistory.get("genel") || [];
    
    const stats = {
      totalUsers: users.size,
      totalMessages: totalMessages,
      totalRooms: rooms.size,
      bannedCount: bannedUsers.size,
      mutedCount: mutedUsers.size,
      totalSessions: sessions.size,
      totalLogs: activityLogs.length,
      roomStats: Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        name: room.name,
        userCount: room.users.size,
        messageCount: (messageHistory.get(id) || []).length
      })),
      recentMessages: generalRoomMessages.slice(-10)
    };
    
    socket.emit("adminStats", stats);
  });
  
  // Admin log listesi
  socket.on("getAdminLogs", (filter) => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) return;
    
    let logs = activityLogs;
    
    // Filtrele
    if (filter && filter.type) {
      logs = logs.filter(log => log.type === filter.type);
    }
    if (filter && filter.user) {
      logs = logs.filter(log => log.user.toLowerCase().includes(filter.user.toLowerCase()));
    }
    if (filter && filter.limit) {
      logs = logs.slice(0, filter.limit);
    }
    
    socket.emit("adminLogs", logs);
  });
  
  // Giriş geçmişi
  socket.on("getLoginHistory", () => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) return;
    
    socket.emit("loginHistory", loginHistory);
  });
  
  // Aktif sessionlar
  socket.on("getActiveSessions", () => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) return;
    
    const activeSessions = Array.from(sessions.entries()).map(([sessionId, userData]) => ({
      sessionId,
      username: userData.username,
      avatar: userData.avatar,
      isAdmin: userData.isAdmin,
      loginTime: new Date(userData.loginTime).toLocaleString("tr-TR"),
      lastActivity: new Date(userData.lastActivity).toLocaleString("tr-TR"),
      ip: userData.ip,
      room: userData.room
    }));
    
    socket.emit("activeSessions", activeSessions);
  });
  
  // Çıkış yap
  socket.on("logout", () => {
    const user = users.get(socket.id);
    if (user) {
      addLog("auth", "logout", user.username, { 
        socketId: socket.id,
        sessionId: user.sessionId,
        ip: user.ip
      });
      
      // Session'ı temizle
      socket.request.session.destroy();
    }
  });
  
  // Admin - Oda oluştur
  socket.on("createRoom", (data) => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit("error", "Bu işlem için yetkiniz yok!");
      return;
    }
    
    const { roomId, roomName } = data;
    if (rooms.has(roomId)) {
      socket.emit("error", "Bu oda zaten mevcut!");
      return;
    }
    
    rooms.set(roomId, { name: roomName, users: new Set() });
    messageHistory.set(roomId, []); // Yeni oda için mesaj geçmişi başlat
    
    addLog("admin", "create_room", user.username, { 
      roomId,
      roomName,
      socketId: socket.id,
      ip: user.ip
    });
    
    io.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ 
      id, 
      name: room.name, 
      userCount: room.users.size 
    })));
    
    socket.emit("adminActionSuccess", `Oda oluşturuldu: ${roomName}`);
  });
  
  // Admin - Oda sil
  socket.on("deleteRoom", (roomId) => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit("error", "Bu işlem için yetkiniz yok!");
      return;
    }
    
    if (!rooms.has(roomId)) {
      socket.emit("error", "Oda bulunamadı!");
      return;
    }
    
    if (roomId === "genel") {
      socket.emit("error", "Genel oda silinemez!");
      return;
    }
    
    const room = rooms.get(roomId);
    
    // Odadaki kullanıcıları genel odaya taşı
    room.users.forEach(userId => {
      const targetUser = users.get(userId);
      if (targetUser) {
        io.to(userId).emit("roomDeleted", "Bulunduğunuz oda silindi, genel odaya yönlendiriliyorsunuz.");
        io.to(userId).socketsLeave(roomId);
        io.to(userId).socketsJoin("genel");
        rooms.get("genel").users.add(userId);
        userRooms.set(userId, "genel");
        targetUser.room = "genel";
      }
    });
    
    rooms.delete(roomId);
    
    addLog("admin", "delete_room", user.username, { 
      roomId,
      roomName: room.name,
      socketId: socket.id,
      ip: user.ip
    });
    
    io.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ 
      id, 
      name: room.name, 
      userCount: room.users.size 
    })));
    
    socket.emit("adminActionSuccess", `Oda silindi: ${room.name}`);
  });
  
  // Admin - Oda adını değiştir
  socket.on("renameRoom", (data) => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit("error", "Bu işlem için yetkiniz yok!");
      return;
    }
    
    const { roomId, newName } = data;
    if (!rooms.has(roomId)) {
      socket.emit("error", "Oda bulunamadı!");
      return;
    }
    
    const room = rooms.get(roomId);
    const oldName = room.name;
    room.name = newName;
    
    addLog("admin", "rename_room", user.username, { 
      roomId,
      oldName,
      newName,
      socketId: socket.id,
      ip: user.ip
    });
    
    io.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ 
      id, 
      name: room.name, 
      userCount: room.users.size 
    })));
    
    io.to(roomId).emit("serverMessage", `Oda adı değiştirildi: ${newName}`);
    socket.emit("adminActionSuccess", `Oda adı değiştirildi: ${oldName} → ${newName}`);
  });
  
  // Admin - Sohbet geçmişini temizle
  socket.on("clearChatHistory", () => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) {
      socket.emit("error", "Bu işlem için yetkiniz yok!");
      return;
    }
    
    // Tüm odaların mesaj sayısını hesapla
    let totalMessageCount = 0;
    messageHistory.forEach(roomMessages => {
      totalMessageCount += roomMessages.length;
    });
    
    // Tüm odaların mesaj geçmişini temizle
    messageHistory.forEach((roomMessages, roomId) => {
      roomMessages.length = 0;
    });
    
    addLog("admin", "clear_chat", user.username, { 
      messageCount: totalMessageCount,
      socketId: socket.id,
      ip: user.ip
    });
    
    io.emit("chatHistoryCleared");
    socket.emit("adminActionSuccess", `${totalMessageCount} mesaj silindi!`);
  });
  
  // Admin - Tüm kullanıcıları getir
  socket.on("getAllUsers", () => {
    const user = users.get(socket.id);
    if (!user || !user.isAdmin) return;
    
    const allUsers = Array.from(users.entries()).map(([id, userData]) => ({
      id: id.substring(0, 6),
      fullId: id,
      username: userData.username,
      avatar: userData.avatar,
      color: userData.color,
      isAdmin: userData.isAdmin,
      room: userData.room,
      loginTime: new Date(userData.loginTime).toLocaleString("tr-TR"),
      lastActivity: new Date(userData.lastActivity).toLocaleString("tr-TR"),
      ip: userData.ip
    }));
    
    socket.emit("allUsers", allUsers);
  });
  
  // WebRTC Sinyal İşlemleri
  socket.on("voice-offer", (data) => {
    const { targetId, offer } = data;
    const user = users.get(socket.id);
    if (!user) return;
    
    const targetUser = Array.from(users.entries()).find(([id]) => id.substring(0, 6) === targetId);
    if (targetUser) {
      io.to(targetUser[0]).emit("voice-offer", {
        from: socket.id.substring(0, 6),
        fromUsername: user.username,
        fromAvatar: user.avatar,
        offer
      });
    }
  });
  
  socket.on("voice-answer", (data) => {
    const { targetId, answer } = data;
    const targetUser = Array.from(users.entries()).find(([id]) => id.substring(0, 6) === targetId);
    if (targetUser) {
      io.to(targetUser[0]).emit("voice-answer", {
        from: socket.id.substring(0, 6),
        answer
      });
    }
  });
  
  socket.on("ice-candidate", (data) => {
    const { targetId, candidate } = data;
    const targetUser = Array.from(users.entries()).find(([id]) => id.substring(0, 6) === targetId);
    if (targetUser) {
      io.to(targetUser[0]).emit("ice-candidate", {
        from: socket.id.substring(0, 6),
        candidate
      });
    }
  });
  
  socket.on("end-voice-call", (targetId) => {
    const targetUser = Array.from(users.entries()).find(([id]) => id.substring(0, 6) === targetId);
    if (targetUser) {
      io.to(targetUser[0]).emit("voice-call-ended", socket.id.substring(0, 6));
    }
  });
  
  // Kullanıcı yazıyor bildirimi
  socket.on("typing", (isTyping) => {
    const user = users.get(socket.id) || { username: "Misafir" };
    socket.broadcast.emit("userTyping", {
      username: user.username,
      typing: isTyping
    });
  });
  
  socket.on("disconnect", () => {
    onlineUsers--;
    const user = users.get(socket.id);
    const room = userRooms.get(socket.id);
    
    if (user && room) {
      addLog("system", "disconnect", user.username, { 
        socketId: socket.id,
        sessionId: user.sessionId,
        ip: user.ip,
        duration: Date.now() - new Date(user.loginTime).getTime()
      });
      
      io.to(room).emit("serverMessage", `${user.username} ayrıldı 👋`);
      rooms.get(room)?.users.delete(socket.id);
      users.delete(socket.id);
      userRooms.delete(socket.id);
      
      // Oda listesini güncelle
      io.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ id, name: room.name, userCount: room.users.size })));
    }
    console.log("Kullanıcı ayrıldı:", socket.id, "- Toplam:", onlineUsers);
    io.emit("userCount", onlineUsers);
  });
});

// API endpoint'leri
app.get("/api/stats", (req, res) => {
  // Tüm odaların toplam mesaj sayısı
  let totalMessages = 0;
  messageHistory.forEach(roomMessages => {
    totalMessages += roomMessages.length;
  });
  
  res.json({
    onlineUsers,
    totalMessages: totalMessages,
    totalRooms: rooms.size,
    bannedUsers: bannedUsers.size,
    mutedUsers: mutedUsers.size,
    activeSessions: sessions.size
  });
});

app.get("/api/logs", (req, res) => {
  // Sadece admin erişebilir (basit kontrol)
  const limit = parseInt(req.query.limit) || 50;
  res.json(activityLogs.slice(0, limit));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Node.js test sunucusu çalışıyor: PORT " + PORT);
});
