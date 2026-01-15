const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(express.static('public'))


io.on("connection", (socket) => {
    socket.on("start", (data) => {
        io.emit("start", data);
    });
    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);
    });
    socket.on("msg", (msg) => {
        socket.broadcast.emit("msg", msg); 
    });
    socket.on("clear", () => {
        socket.broadcast.emit("clear");
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
