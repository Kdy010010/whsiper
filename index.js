const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 4000;
const dataFilePath = path.join(__dirname, 'roomsandusers.json');

// 정적 파일 제공 설정
app.use(express.static('public'));

// 데이터 파일에서 정보 로드
function loadData() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading or parsing data file:', error);
    }
    // 파일이 존재하지 않거나, 오류가 발생한 경우 기본값 반환
    return { rooms: {}, messages: {} };
}

// 데이터 파일에 정보 저장
function saveData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data file:', error);
    }
}

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('createRoom', ({ room, password }) => {
        const data = loadData();
        if (!data.rooms.hasOwnProperty(room)) { // 방이 존재하지 않는 경우
            data.rooms[room] = { password, users: [] };
            saveData(data);
            socket.emit('roomCreated', { room, success: true });
        } else {
            socket.emit('roomCreated', { room, success: false, message: "Room already exists." });
        }
    });

    socket.on('joinRoom', ({ username, room, password }) => {
        const data = loadData();
        if (data.rooms[room] && data.rooms[room].password === password) {
            socket.join(room);
            if (!data.rooms[room].users.includes(username)) {
                data.rooms[room].users.push(username);
            }
            saveData(data);
            if (data.messages[room]) {
                socket.emit('loadMessages', data.messages[room]);
            }
            socket.to(room).emit('message', { username, message: `${username} has joined the room`, timestamp: new Date() });
        } else {
            socket.emit('joinedRoom', { success: false, message: "Incorrect password or room does not exist." });
        }
    });

    socket.on('message', ({ username, message, room }) => {
        const data = loadData();
        if (!data.messages[room]) {
            data.messages[room] = [];
        }
        const messageData = { username, message, timestamp: new Date().toISOString() };
        data.messages[room].push(messageData);
        saveData(data);
        io.to(room).emit('message', messageData);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

