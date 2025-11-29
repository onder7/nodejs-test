const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

// Public klasörünü servis et
app.use(express.static("public"));

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı");

  socket.emit("hello", "Socket.IO çalışıyor!");

  socket.on("disconnect", () => {
    console.log("Bir kullanıcı ayrıldı");
  });
});

http.listen(port, () => {
  console.log("Sunucu çalışıyor:", port);
});
