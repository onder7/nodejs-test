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

io.on("connection", (socket) => {
  onlineUsers++;
  console.log("Kullanıcı bağlandı:", socket.id, "- Toplam:", onlineUsers);
  
  // Yeni kullanıcıya hoş geldin mesajı
  socket.emit("serverMessage", "Socket.IO çalışıyor! Hoş geldin! 🎉");
  
  // Mesaj geçmişini gönder
  socket.emit("messageHistory", messageHistory);
  
  // Herkese online kullanıcı sayısını gönder
  io.emit("userCount", onlineUsers);
  
  // Kullanıcı adı ayarla
  socket.on("setUsername", (username) => {
    const color = '#' + Math.floor(Math.random()*16777215).toString(16);
    users.set(socket.id, { username, color });
    socket.emit("userColor", color);
    io.emit("serverMessage", `${username} sohbete katıldı! 👋`);
  });
  
  // Chat mesajı geldiğinde
  socket.on("chatMessage", (msg) => {
    const timestamp = new Date().toLocaleTimeString("tr-TR");
    const user = users.get(socket.id) || { username: "Misafir", color: "#999" };
    
    const messageData = {
      id: socket.id.substring(0, 6),
      username: user.username,
      color: user.color,
      message: msg,
      time: timestamp
    };
    
    // Mesajı geçmişe ekle
    messageHistory.push(messageData);
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    io.emit("chatMessage", messageData);
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
    if (user) {
      io.emit("serverMessage", `${user.username} ayrıldı 👋`);
      users.delete(socket.id);
    }
    console.log("Kullanıcı ayrıldı:", socket.id, "- Toplam:", onlineUsers);
    io.emit("userCount", onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Node.js test sunucusu çalışıyor: PORT " + PORT);
});
