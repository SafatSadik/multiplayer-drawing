const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
    transports: ["websocket"],
    maxHttpBufferSize: 1e8 // 100 MB (safe)
});

app.use(express.static("public"));

const roomHistories = new Map();

function getRoomHistory(roomName) {
    if (!roomHistories.has(roomName)) {
        roomHistories.set(roomName, []);
    }
    return roomHistories.get(roomName);
}

function randomColor() {
    const value = Math.floor(Math.random() * 0xffffff);
    return `#${value.toString(16).padStart(6, "0")}`;
}

io.on("connection", (socket) => {
    let currentRoom = "";
    let playerName = "";

    socket.on("joinRoom", ({ room, name }) => {
        const safeRoom = (room || "safat").toString().trim().toLowerCase();
        const safeName = (name || "Guest").toString().trim();

        if (!safeRoom || !safeName) return;

        if (currentRoom) {
            socket.leave(currentRoom);
        }

        currentRoom = safeRoom;
        playerName = safeName;
        socket.join(currentRoom);

        const playerColor = randomColor();
        socket.data.playerColor = playerColor;

        socket.emit("joinedRoom", {
            room: currentRoom,
            name: playerName,
            color: playerColor
        });

        const history = getRoomHistory(currentRoom);
        socket.emit("roomState", history);

        socket.to(currentRoom).emit("msg", {
            name: "System",
            text: `${playerName} joined ${currentRoom}`,
            color: "#7a7a7a"
        });
    });

    socket.on("draw", (data) => {
        if (!data?.room) return;

        const history = getRoomHistory(data.room);
        history.push(data);
        socket.to(data.room).emit("draw", data);
    });

    socket.on("msg", (payload) => {
        if (!payload?.room || !payload?.text || !payload?.name) return;

        socket.to(payload.room).emit("msg", {
            name: payload.name,
            text: payload.text,
            color: socket.data.playerColor || payload.color || randomColor()
        });
    });

    socket.on("clear", ({ room }) => {
        if (!room) return;

        const history = getRoomHistory(room);
        history.length = 0;
        socket.to(room).emit("clear");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
