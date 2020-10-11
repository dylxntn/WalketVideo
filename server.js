require("dotenv").config();
import express, { static } from "express";
import { createServer } from "http";
const app = express();
const server = createServer(app);
import socket from "socket.io";
const io = socket(server);
import { join } from 'path';

const rooms = {};

io.on("connection", socket => {
    socket.on("join room", roomID => {
        if (rooms[roomID]) {
            rooms[roomID].push(socket.id);
        } else {
            rooms[roomID] = [socket.id];
        }
        const otherUser = rooms[roomID].find(id => id !== socket.id);
        if (otherUser) {
            socket.emit("other user", otherUser);
            socket.to(otherUser).emit("user joined", socket.id);
        }
    });

    socket.on("offer", payload => {
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", payload => {
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", incoming => {
        io.to(incoming.target).emit("ice-candidate", incoming.candidate);
    });
});

if (process.env.PROD) {
    app.use(static(join(__dirname, './client/build')));
    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, './client/build/index.html'));
    });
}

const port = process.env.PORT || 8000
server.listen(port, () => console.log(`server is running on port ${port}`));
