// game.js
document.addEventListener('DOMContentLoaded', function () {
    const chatTextarea = document.querySelector('#chat textarea');
    const sendButton = document.querySelector('#chat button');
    const chatMessages = document.querySelector('#chat .flex-grow-1');
    const socket = io();


    if(sessionStorage['lobbyid']){
        $('#Cardlobby').text(sessionStorage['lobbyname']);
    }
    sendButton.addEventListener('click', sendMessage);
    chatTextarea.addEventListener('keypress', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Funktion zum Senden einer Nachricht über Socket.IO
    async function sendMessage() {
        const message = chatTextarea.value.trim();
        if (message !== '') {
            const messageElement = document.createElement('div');
            messageElement.classList.add('card', 'mb-2', 'p-2', 'chat-message');
            messageElement.textContent = "Senden..."; // Placeholder text
            chatMessages.appendChild(messageElement);
            chatTextarea.value = '';
            const room = sessionStorage.getItem('lobbyid');
            // Scrollen zum Ende des Chatfensters
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Nachricht an den Server senden (über HTTP)
            try {
                const response = await fetch('http://91.21.86.47/api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userid: sessionStorage.getItem('userid'),
                        action: 'send_message',
                        content: message,
                        lobbyid: room
                    })
                });

                const responseText = await response.text();
                console.log('Server-Antwort:', responseText);

                if (!response.ok) {
                    throw new Error('Fehler beim Senden der Nachricht');
                }

                // Nachrichtenelement aktualisieren (oder neu laden)
                loadMessages();
            } catch (err) {
                console.error('Fehler beim Senden der Nachricht:', err);
            }

            // Nachricht an den Socket.IO-Server senden
            socket.emit("send-message", message, room);
        }
    }

    async function loadMessages() {
        // Stellen Sie sicher, dass sessionStorage richtig verwendet wird
        if (!sessionStorage.getItem('lobbyid')) {
            sessionStorage.setItem('lobbyid', 0); 
        }
    
        try {
            const room = sessionStorage.getItem('lobbyid');
            const response = await fetch(`http://91.21.86.47/api.php?action=get_messages&lobbyid=${room}`);
            
            
    
            if (response.ok) {
                const responseText = await response.text();
                // Versuchen, das Antwort-Text in JSON zu konvertieren
                const data = JSON.parse(responseText);
                if (!Array.isArray(data.messages)) {
                    throw new Error('Expected an array of messages');
                }
                chatMessages.innerHTML = ''; // Clear existing messages
                data.messages.forEach(message => {
                    const messageElement = createMessageElement(message);
                    chatMessages.appendChild(messageElement);
                });
    
                // Scroll to the end of the chat window
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('room: ' + sessionStorage.getItem('lobbyid') + ' There was a problem with the fetch operation:', error);
        }
    }
    

    // Funktion zur Erstellung eines Nachrichten-HTML-Elements
    function createMessageElement(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('card', 'mb-2', 'p-2', 'chat-message');

        const profileImage = document.createElement('img');
        profileImage.src = message.profilepicture; // URL zum Profilbild
        profileImage.classList.add('profile-image');

        const usernameElement = document.createElement('strong');
        usernameElement.textContent = message.Benutzername + ":";

        const contentElement = document.createElement('span');
        contentElement.textContent = message.content;

        const dateElement = document.createElement('small');
        dateElement.classList.add('text-muted');
        dateElement.textContent = message.created_at;

        messageElement.appendChild(profileImage);
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(contentElement);
        messageElement.appendChild(document.createElement('br'));
        messageElement.appendChild(dateElement);

        return messageElement;
    } 
    // Nachrichten über Socket.IO empfangen
    socket.on('newMessage', (message) => {
        console.log('Neue Nachricht empfangen:', message);
        const messageElement = createMessageElement(message);
        chatMessages.appendChild(messageElement);

        // Scrollen zum Ende des Chatfensters nach Empfang einer neuen Nachricht
        chatMessages.scrollTop = chatMessages.scrollHeight;
        loadMessages();
    });

    // Initial laden von Nachrichten beim Seitenstart
    loadMessages();
});
