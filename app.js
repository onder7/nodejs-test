const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/test", (req, res) => {
  res.send("Node.js ÇALIŞIYOR ✔");
});

let onlineUsers = 0;
const users = new Map(); // Kullanıcı bilgilerini sakla
const messageHistory = []; // Son 50 mesajı sakla
const MAX_HISTORY = 50;
const rooms = new Map(); // Oda sistemi
const userRooms = new Map(); // Kullanıcı-oda eşleşmeleri
const privateMessages = new Map(); // Özel mesaj geçmişi (socketId -> mesajlar)
const admins = new Set(["admin", "onder7"]); // Admin kullanıcı adları
const bannedUsers = new Set(); // Yasaklı kullanıcılar
const mutedUsers = new Map(); // Susturulmuş kullanıcılar (socketId -> süre)

// Varsayılan odalar
rooms.set("genel", { name: "Genel", users: new Set() });
rooms.set("teknoloji", { name: "Teknoloji", users: new Set() });
rooms.set("oyun", { name: "Oyun", users: new Set() });

io.on("connection", (socket) => {
  onlineUsers++;
  console.log("Kullanıcı bağlandı:", socket.id, "- Toplam:", onlineUsers);
  
  // Yeni kullanıcıya hoş geldin mesajı
  socket.emit("serverMessage", "Socket.IO çalışıyor! Hoş geldin! 🎉");
  
  // Mesaj geçmişini gönder
  socket.emit("messageHistory", messageHistory);
  
  // Herkese online kullanıcı sayısını gönder
  io.emit("userCount", onlineUsers);
  
  // Kullanıcı adı ve profil resmi ayarla
  socket.on("setUsername", (data) => {
    const { username, avatar } = data;
    
    // Yasaklı kullanıcı kontrolü
    if (bannedUsers.has(username)) {
      socket.emit("banned", "Bu kullanıcı adı yasaklanmıştır!");
      return;
    }
    
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    const isAdmin = admins.has(username);
    users.set(socket.id, { 
      username, 
      color, 
      avatar: avatar || "👤", 
      room: "genel",
      isAdmin,
      socketId: socket.id
    });
    socket.emit("userColor", color);
    
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
    
    // Mesajı geçmişe ekle
    messageHistory.push(messageData);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
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
    
    privateMessages.get(socket.id).push(messageData);
    privateMessages.get(targetUser[0]).push(messageData);
    
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
    
    // Mesaj geçmişinde güncelle
    const msgIndex = messageHistory.findIndex(m => m.id === messageId && m.id === socket.id);
    if (msgIndex !== -1) {
      messageHistory[msgIndex].message = newMessage;
      messageHistory[msgIndex].edited = true;
      io.to(room).emit("messageEdited", { messageId, newMessage });
    }
  });
  
  // Mesaj sil
  socket.on("deleteMessage", (messageId) => {
    const room = userRooms.get(socket.id) || "genel";
    
    // Mesaj geçmişinden sil
    const msgIndex = messageHistory.findIndex(m => m.id === messageId && m.id === socket.id);
    if (msgIndex !== -1) {
      messageHistory.splice(msgIndex, 1);
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
    const targetUser = Array.from(users.entries()).find(([id, u]) => id.substring(0, 6) === targetId);
    
    if (!targetUser) {
      socket.emit("error", "Kullanıcı bulunamadı!");
      return;
    }
    
    const [targetSocketId, targetUserData] = targetUser;
    
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
        mutedUsers.set(targetSocketId, Date.now() + (duration || 300000)); // Varsayılan 5 dakika
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
    
    const stats = {
      totalUsers: users.size,
      totalMessages: messageHistory.length,
      totalRooms: rooms.size,
      bannedCount: bannedUsers.size,
      mutedCount: mutedUsers.size,
      roomStats: Array.from(rooms.entries()).map(([id, room]) => ({
        id,
        name: room.name,
        userCount: room.users.size
      })),
      recentMessages: messageHistory.slice(-10)
    };
    
    socket.emit("adminStats", stats);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Node.js test sunucusu çalışıyor: PORT " + PORT);
});
