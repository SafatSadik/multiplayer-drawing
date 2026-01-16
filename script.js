const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use(express.static('public'))

io.on("connection", (socket) => {
    const userId = socket.id;

    // send to everyone that a user joined
    // socket.broadcast.emit("userJoined", userId);

    socket.on("requestCanvas", () => {
        const socketIds = [...io.of("/").sockets.keys()];
        const otherUsers = socketIds.filter(id => id !== socket.id);

        if (otherUsers.length === 0) return;

        const randomUser =
            otherUsers[Math.floor(Math.random() * otherUsers.length)];

        io.to(randomUser).emit("requestCanvas", socket.id);
    });

    // existing user sends canvas
    socket.on("canvasData", ({ toUserId, image }) => {
        io.to(toUserId).emit("canvasData", image);
    });

    /* ---------- DRAWING ---------- */
    socket.on("start", (data) => {
        // send start to everyone INCLUDING sender
        socket.broadcast.emit("start", { ...data, userId });
    });

    socket.on("draw", (data) => {
        // send draw to everyone EXCEPT sender

        socket.broadcast.emit("draw", { ...data, userId });
    });

    /* ---------- CHAT ---------- */
    socket.on("msg", (msg) => {
        console.log(msg)
        socket.broadcast.emit("msg", msg);
    });

    /* ---------- CLEAR ---------- */
    socket.on("clear", () => {
        socket.broadcast.emit("clear");
    });

    // /* ---------- DISCONNECT ---------- */
    // socket.on("disconnect", () => {
    //     socket.broadcast.emit("userLeft", userId);
    // });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
