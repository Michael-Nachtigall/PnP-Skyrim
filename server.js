const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://127.0.0.1:3000", // Anpassen je nach deiner Client-Anwendung
        methods: ["GET", "POST"]
    }
});

const port = 3000;

// Middleware und statische Dateien
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    // Nachricht empfangen und an alle Clients im Raum senden
    socket.on('send-message', (message, room) => {
        io.emit('newMessage', message); 
    });

    // Raum verlassen, wenn die Verbindung geschlossen wird
    socket.on('disconnect', () => {
        console.log(`Verbindung geschlossen: ${socket.id}`);
    });
});
// Starte den Server
server.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
