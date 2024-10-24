const socket = io();
let username = '';
let currentRoom = '';

function setupUser() {
    username = document.getElementById('username').value;
    document.getElementById('user-form').style.display = 'none';
    document.getElementById('room-form').style.display = 'block';
}

function createRoom() {
    const room = document.getElementById('room-name').value;
    const password = document.getElementById('room-password').value;
    socket.emit('createRoom', { room, password });
    joinRoom();
}

function joinRoom() {
    const room = document.getElementById('room-name').value;
    const password = document.getElementById('room-password').value;
    currentRoom = room;
    socket.emit('joinRoom', { username, room, password });
    document.getElementById('room-form').style.display = 'none';
    document.getElementById('chat-room').style.display = 'block';
}

function sendMessage() {
    const message = document.getElementById('message-input').value;
    socket.emit('message', { username, message, room: currentRoom });
    document.getElementById('message-input').value = '';
}

socket.on('message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${data.username}: ${data.message}`;
    document.getElementById('messages').appendChild(messageElement);
});

socket.on('loadMessages', (messages) => {
    const messagesElement = document.getElementById('messages');
    messagesElement.innerHTML = ''; // Clear previous messages
    messages.forEach((msg) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${msg.username}: ${msg.message}`;
        messagesElement.appendChild(messageElement);
    });
});

