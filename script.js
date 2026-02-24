const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require("socket.io")(server, {
    transports: ["websocket"],
    maxHttpBufferSize: 1e8     // 100 MB (safe)
});

app.use(express.static('public'))

// Per-room canvas history
// {
//   [roomName]: [ drawEvent, ... ]
// }
const roomHistory = {};

io.on("connection", (socket) => {
    const userId = socket.id;
    const { name, room } = socket.handshake.query || {};
    const userName = (name || "Guest").toString();
    const roomName = (room || "Lolipop").toString();

    // assign a random color per user (stable for this connection)
    const userColor = getRandomColor();

    socket.join(roomName);

    if (!roomHistory[roomName]) {
        roomHistory[roomName] = [];
    }

    socket.on("requestCanvas", () => {
        console.log("canva request")
        const history = roomHistory[roomName] || [];
        if (history.length === 0) return
        io.to(userId).emit("recieveCanvas", history);
        console.log("sent canva history")
    });

    socket.on("draw", (data) => {
        // send draw to everyone EXCEPT sender
        socket.to(roomName).emit("draw", data);
        roomHistory[roomName].push(data);
    });

    /* ---------- CHAT ---------- */
    socket.on("msg", (msg) => {
        console.log(msg)
        const payload = {
            name: userName,
            text: msg,
            color: userColor
        };
        // send to everyone in the room including sender
        io.to(roomName).emit("msg", payload);
    });

    /* ---------- CLEAR ---------- */
    socket.on("clear", () => {
        roomHistory[roomName] = [];
        socket.to(roomName).emit("clear");
    });
});

// simple random pastel color generator
function getRandomColor() {
    const hue = Math.floor(Math.random() * 360); // 0-359
    const saturation = 70; // keep fairly strong
    const lightness = 60;  // not too dark
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
