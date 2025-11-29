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
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    users.set(socket.id, { username, color, avatar: avatar || "👤", room: "genel" });
    socket.emit("userColor", color);
    
    // Kullanıcıyı genel odaya ekle
    socket.join("genel");
    rooms.get("genel").users.add(socket.id);
    userRooms.set(socket.id, "genel");
    
    io.to("genel").emit("serverMessage", `${username} sohbete katıldı! 👋`);
    socket.emit("roomList", Array.from(rooms.entries()).map(([id, room]) => ({ id, name: room.name, userCount: room.users.size })));
    socket.emit("currentRoom", "genel");
  });
  
  // Chat mesajı geldiğinde
  socket.on("chatMessage", (msg) => {
    const timestamp = new Date().toLocaleTimeString("tr-TR");
    const user = users.get(socket.id) || { username: "Misafir", color: "#999", avatar: "👤" };
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
      edited: false
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
    const user = users.get(socket.id) || { username: "Misafir", color: "#999", avatar: "👤" };
    
    const messageData = {
      id: socket.id,
      socketId: socket.id.substring(0, 6),
      username: user.username,
      color: user.color,
      avatar: user.avatar,
      message: message,
      time: timestamp,
      private: true
    };
    
    // Gönderene ve alıcıya gönder
    socket.emit("privateMessage", messageData);
    io.to(targetId).emit("privateMessage", messageData);
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
        return user ? { id: id.substring(0, 6), username: user.username, color: user.color, avatar: user.avatar } : null;
      })
      .filter(u => u !== null);
    
    socket.emit("onlineUsers", roomUsers);
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
