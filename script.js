const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require("socket.io")(server, {
    transports: ["websocket"],
    maxHttpBufferSize: 1e8     // 100 MB (safe)
});

app.use(express.static('public'))
let history = []

io.on("connection", (socket) => {
    const userId = socket.id;

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
        console.log(history.length)
    });

    /* ---------- CHAT ---------- */
    socket.on("msg", (msg) => {
        console.log(msg)
        socket.broadcast.emit("msg", msg);
    });

    /* ---------- CLEAR ---------- */
    socket.on("clear", () => {
        history.length = 0
        socket.broadcast.emit("clear");
    });
});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
