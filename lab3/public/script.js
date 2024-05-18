async function sendMessage() {
    const author = document.getElementById('author').value;
    const message = document.getElementById('message').value;

    if (!author || !message) {
        alert('Author and message are required');
        return;
    }

    const response = await fetch('chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ author, message })
    });

    if (response.ok) {
        document.getElementById('message').value = '';
        loadMessages();
    } else {
        alert('Error sending message');
    }
}

async function loadMessages() {
    const response = await fetch('chat');
    const messages = await response.json();
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = msg.author === document.getElementById('author').value ? 'me' : 'user';
        div.textContent = `${msg.author} said: ${msg.message}`;
        chatMessages.appendChild(div);
    });
}