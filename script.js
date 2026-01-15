const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)

// app.set('view engine', 'ejs')
app.use(express.static('public'))

let users = {};

io.on("connection", (socket) => {
    const userId = socket.id;
    users[userId] = { id: userId, color: getRandomColor() };
    // io.emit("updateUsers", users);
    // io.emit("userJoined", `User ${userId}`);

    // console.log(userId)

    socket.on("start", (data) => {
        io.emit("start", data);
    });

    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data);
    });

    socket.on("clear", () => {
        socket.broadcast.emit("clear");
    });
    socket.on("message",(data) => {
        console.log(data)
    })

    socket.on("disconnect", () => {
        io.emit("userLeft", `User ${userId}`);
        delete users[userId];
        io.emit("updateUsers", users);
    });
});

function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

server.listen(3000, () => console.log("Server running on port 3000"));
