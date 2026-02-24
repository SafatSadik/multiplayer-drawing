const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require("socket.io")(server, {
    transports: ["websocket"],
    maxHttpBufferSize: 1e8     // 100 MB (safe)
});

app.use(express.static('public'))
let history = []

function randomColor() {
    const value = Math.floor(Math.random() * 0xffffff);
    return `#${value.toString(16).padStart(6, "0")}`;
}

io.on("connection", (socket) => {
    const userId = socket.id;
    const playerColor = randomColor();

    socket.on("requestCanvas", () => {
        console.log("canva request")
        if (history.length == 0) return
        io.to(userId).emit("recieveCanvas", history);
        console.log("sent canva history")
    });

    socket.on("draw", (data) => {
        // send draw to everyone EXCEPT sender
        socket.broadcast.emit("draw",data );
        history.push(data)
    });

    /* ---------- CHAT ---------- */
    socket.on("msg", (payload) => {
        const safeMsg = {
            name: payload?.name || `User-${userId.slice(0, 4)}`,
            text: payload?.text || "",
            color: payload?.color || playerColor
        };
        if (!safeMsg.text) return;
        console.log(safeMsg)
        socket.broadcast.emit("msg", safeMsg);
    });

    /* ---------- CLEAR ---------- */
    socket.on("clear", () => {
        history.length = 0
        socket.broadcast.emit("clear");
    });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
