// Sistema de livestream con Socket.IO
class LivestreamManager {
  constructor() {
    this.socket = null;
    this.username = '';
    this.isConnected = false;
    this.users = new Map();
    this.init();
  }

  init() {
    // Conectar a Socket.IO
    this.socket = io();

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('🔗 Conectado al livestream');
      this.isConnected = true;
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del livestream');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    // Eventos del chat
    this.socket.on('new-livestream-message', message => {
      this.addMessageToChat(message);
    });

    this.socket.on('user-joined', data => {
      this.addSystemMessage(data.message);
      this.updateUsersCount();
    });

    this.socket.on('user-left', data => {
      this.addSystemMessage(data.message);
      this.updateUsersCount();
    });

    this.socket.on('users-list', users => {
      this.updateUsersList(users);
    });

    // Configurar interfaz
    this.setupUI();
  }

  setupUI() {
    const joinBtn = document.getElementById('joinLivestreamBtn');
    const messageInput = document.getElementById('livestreamMessageInput');
    const sendBtn = document.getElementById('livestreamSendBtn');

    if (joinBtn) {
      joinBtn.addEventListener('click', () => this.joinChat());
    }

    if (sendBtn && messageInput) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      messageInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }
  }

  joinChat() {
    // Usar nombre automático según PROMPT_UI_FIXES.md
    const username = `Usuario_${Math.floor(Math.random() * 1000)}`;
    this.username = username;

    this.socket.emit('join-livestream-chat', { username });

    // Habilitar chat
    const messageInput = document.getElementById('livestreamMessageInput');
    const sendBtn = document.getElementById('livestreamSendBtn');

    if (messageInput) messageInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;

    this.addSystemMessage(`${username} se unió al chat`);
  }

  sendMessage() {
    const messageInput = document.getElementById('livestreamMessageInput');
    const message = messageInput?.value?.trim();

    if (!message || !this.isConnected) return;

    this.socket.emit('livestream-message', { message });
    messageInput.value = '';
  }

  addMessageToChat(message) {
    const chatContainer = document.getElementById('livestreamChatMessages');
    if (!chatContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'livestream-message';
    messageEl.innerHTML = `
            <div class="message-header">
                <span class="username">${message.username}</span>
                <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${message.message}</div>
        `;

    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  addSystemMessage(message) {
    const chatContainer = document.getElementById('livestreamChatMessages');
    if (!chatContainer) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'livestream-message system';
    messageEl.innerHTML = `
            <div class="system-message">${message}</div>
        `;

    chatContainer.appendChild(messageEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  updateConnectionStatus(connected) {
    const statusEl = document.getElementById('livestreamConnectionStatus');
    if (!statusEl) return;

    const indicator = statusEl.querySelector('.status-indicator');
    const text = statusEl.querySelector('.status-text');

    if (indicator) {
      indicator.className = `status-indicator ${connected ? 'online' : 'offline'}`;
    }
    if (text) {
      text.textContent = connected ? 'Conectado' : 'Desconectado';
    }
  }

  updateUsersCount() {
    const countEl = document.getElementById('livestreamUsersCount');
    if (countEl) {
      const count = this.users.size;
      countEl.textContent = `${count} usuario${count !== 1 ? 's' : ''}`;
    }
  }

  updateUsersList(users) {
    this.users.clear();
    users.forEach(username => {
      this.users.set(username, { username });
    });
    this.updateUsersCount();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.livestreamManager = new LivestreamManager();
});
