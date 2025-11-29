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

io.on("connection", (socket) => {
  onlineUsers++;
  console.log("Kullanıcı bağlandı:", socket.id, "- Toplam:", onlineUsers);
  
  // Yeni kullanıcıya hoş geldin mesajı
  socket.emit("serverMessage", "Socket.IO çalışıyor! Hoş geldin! 🎉");
  
  // Herkese online kullanıcı sayısını gönder
  io.emit("userCount", onlineUsers);
  
  // Chat mesajı geldiğinde
  socket.on("chatMessage", (msg) => {
    const timestamp = new Date().toLocaleTimeString("tr-TR");
    io.emit("chatMessage", {
      id: socket.id.substring(0, 6),
      message: msg,
      time: timestamp
    });
  });
  
  // Kullanıcı yazıyor bildirimi
  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("userTyping", {
      id: socket.id.substring(0, 6),
      typing: isTyping
    });
  });
  
  socket.on("disconnect", () => {
    onlineUsers--;
    console.log("Kullanıcı ayrıldı:", socket.id, "- Toplam:", onlineUsers);
    io.emit("userCount", onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Node.js test sunucusu çalışıyor: PORT " + PORT);
});
