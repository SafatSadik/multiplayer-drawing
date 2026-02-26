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
// Per-room redo stacks (per user)
// {
//   [roomName]: { [userId]: [ [drawEvent, ...], ... ] }
// }
const roomRedo = {};

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
    if (!roomRedo[roomName]) {
        roomRedo[roomName] = {};
    }
    if (!roomRedo[roomName][userId]) {
        roomRedo[roomName][userId] = [];
    }

    // When user joins
    io.to(roomName).emit("msg", {
        name: "System",
        text: `${userName} joined the room`,
        color: "#888888"
    });

    // When user leaves
    socket.on("disconnect", () => {
        io.to(roomName).emit("msg", {
            name: "System",
            text: `${userName} left the room`,
            color: "#888888"
        });
    });

    socket.on("requestCanvas", () => {
        console.log("canva request")
        const history = roomHistory[roomName] || [];
        if (history.length === 0) return
        io.to(userId).emit("recieveCanvas", history);
        console.log("sent canva history")
    });

    socket.on("draw", (data) => {
        // enrich with user metadata for remote cursors & identification
        const payload = {
            ...data,
            userName,
            userColor
        };
        // send draw to everyone EXCEPT sender
        socket.to(roomName).emit("draw", payload);
        roomHistory[roomName].push(payload);

        // new draw invalidates redo stack for this user
        if (!roomRedo[roomName]) roomRedo[roomName] = {};
        roomRedo[roomName][userId] = [];
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
        roomRedo[roomName] = {};
        socket.to(roomName).emit("clear");
    });

    socket.on("importImage", (data) => {
        console.log("importImage")

        const payload = {
            ...data,
            type: "importImage",
            userName,
            userColor
        };

        // Broadcast to others in the room
        socket.to(roomName).emit("importImage", payload);

        // Store in history so late-joining users get it via requestCanvas
        roomHistory[roomName].push(payload);

        // Clear redo stack since this is a new action
        if (roomRedo[roomName]) roomRedo[roomName][userId] = [];
    });

    /* ---------- UNDO / REDO (room-synced) ---------- */
    socket.on("undo", () => {
        const history = roomHistory[roomName] || [];
        if (history.length === 0) return;

        let lastIdx = -1;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i] && history[i].userId === userId) {
                lastIdx = i;
                break;
            }
        }
        if (lastIdx === -1) return;

        const last = history[lastIdx];
        const strokeId = last && last.strokeId;
        let removed = [];

        if (strokeId) {
            removed = history.filter((e) => e && e.userId === userId && e.strokeId === strokeId);
            roomHistory[roomName] = history.filter((e) => !(e && e.userId === userId && e.strokeId === strokeId));
        } else {
            removed = [history[lastIdx]];
            history.splice(lastIdx, 1);
            roomHistory[roomName] = history;
        }

        if (!roomRedo[roomName]) roomRedo[roomName] = {};
        if (!roomRedo[roomName][userId]) roomRedo[roomName][userId] = [];
        roomRedo[roomName][userId].push(removed);

        io.to(roomName).emit("resetCanvas", roomHistory[roomName]);
    });

    socket.on("redo", () => {
        if (!roomRedo[roomName] || !roomRedo[roomName][userId] || roomRedo[roomName][userId].length === 0) return;

        const chunk = roomRedo[roomName][userId].pop();
        if (!chunk || chunk.length === 0) return;

        if (!roomHistory[roomName]) roomHistory[roomName] = [];
        roomHistory[roomName].push(...chunk);

        io.to(roomName).emit("resetCanvas", roomHistory[roomName]);
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
