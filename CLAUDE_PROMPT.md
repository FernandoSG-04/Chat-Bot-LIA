# PROMPT COMPLETO PARA CLAUDE - REPARACIÓN Y MEJORAS DE LIA IA

## ROL Y OBJETIVO PRINCIPAL

Eres un desarrollador experto en JavaScript, Node.js, y aplicaciones web modernas. Tu misión es REPARAR COMPLETAMENTE el chat de Lia IA y implementar todas las funcionalidades solicitadas. Trabajas en español y entregas código listo para usar.

## PROBLEMAS A SOLUCIONAR (PRIORIDAD CRÍTICA)

### 1. CHAT NO RESPONDE
- **Problema**: El chat no responde a las preguntas del usuario
- **Causa**: La función `processUserMessageWithAI` no está funcionando correctamente
- **Solución**: Reparar la integración con OpenAI y asegurar que las respuestas lleguen al chat

### 2. FUNCIONALIDAD DE LIVESTREAM
- **Problema**: Necesitas un chat livestream funcional para múltiples usuarios
- **Requerimiento**: Usuarios conectados en tiempo real, mensajes en vivo, contador de usuarios
- **Solución**: Implementar Socket.IO completo con interfaz de usuario

### 3. GESTIÓN DE SESIONES Y MÓDULOS
- **Problema**: Botón "+" no funciona correctamente para gestionar sesiones
- **Requerimiento**: Al seleccionar una sesión, mostrar botones de módulos (1, 2, 3, 4) en el panel derecho
- **Solución**: Sistema completo de gestión de sesiones con módulos

### 4. LAYOUT DERECHO
- **Problema**: Solo mantener botón de notas, agregar botones de módulos
- **Requerimiento**: Botones de módulos 1, 2, 3, 4 cuando se selecciona una sesión
- **Solución**: Rediseñar panel derecho con funcionalidad dinámica

## ANÁLISIS DEL CÓDIGO ACTUAL

### Archivos principales:
- `src/chat.html` - Interfaz del chat
- `src/scripts/main.js` - Lógica del frontend (2461 líneas)
- `server.js` - Servidor Node.js con Socket.IO
- `PROMPT_CLAUDE.md` - Prompt anterior

### Problemas identificados:
1. La función `processUserMessageWithAI` tiene errores en la llamada a OpenAI
2. Socket.IO está configurado pero no se usa en el frontend
3. Sistema de sesiones incompleto
4. Panel derecho no se actualiza dinámicamente

## SOLUCIONES REQUERIDAS

### 1. REPARAR EL CHAT (PRIORIDAD 0)

**Problema específico**: La función `processUserMessageWithAI` no procesa correctamente las respuestas.

**Solución**:
```javascript
// En src/scripts/main.js, línea ~1000
async function processUserMessageWithAI(message) {
    try {
        // Obtener contexto de la base de datos
        const dbContext = await getDatabaseContext(message);
        
        // Construir prompt completo
        const systemPrompt = `Eres Lia IA, asistente educativo especializado en inteligencia artificial.
        
        Responde en español de forma clara, educativa y útil.
        Si la pregunta está fuera del ámbito de IA, redirige amablemente al curso.
        
        Contexto del curso: Fundamentos de IA, Machine Learning, Deep Learning, Aplicaciones prácticas.
        
        ${dbContext.length > 0 ? '\nInformación relevante:\n' + dbContext.map(item => 
            `- ${item.term || item.question || item.title}: ${item.definition || item.answer || item.description}`
        ).join('\n') : ''}`;
        
        const fullPrompt = `${systemPrompt}\n\nUsuario: ${message}\n\nLia IA:`;
        
        // Llamar a OpenAI
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                prompt: fullPrompt,
                context: dbContext.length > 0 ? JSON.stringify(dbContext) : ''
            })
        });

        if (!response.ok) {
            throw new Error(`Error API: ${response.status}`);
        }

        const data = await response.json();
        return data.response || 'Lo siento, no pude procesar tu pregunta. ¿Puedes reformularla?';
        
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        return `Hubo un problema técnico temporal. Puedo ayudarte con:
        
        • **Conceptos básicos de IA**: prompts, LLMs, tokens
        • **Ejercicios prácticos**: clasificación, redes neuronales
        • **Navegación del curso**: usa el menú para explorar temas
        
        ¿Qué te gustaría aprender sobre IA?`;
    }
}
```

### 2. IMPLEMENTAR LIVESTREAM COMPLETO

**Nuevo archivo**: `src/scripts/livestream.js`
```javascript
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
        this.socket.on('new-livestream-message', (message) => {
            this.addMessageToChat(message);
        });

        this.socket.on('user-joined', (data) => {
            this.addSystemMessage(data.message);
            this.updateUsersCount();
        });

        this.socket.on('user-left', (data) => {
            this.addSystemMessage(data.message);
            this.updateUsersCount();
        });

        this.socket.on('users-list', (users) => {
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
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    joinChat() {
        const username = prompt('Ingresa tu nombre para el chat:') || `Usuario_${Math.floor(Math.random() * 1000)}`;
        this.username = username;
        
        this.socket.emit('join-livestream-chat', { username });
        
        // Habilitar chat
        const messageInput = document.getElementById('livestreamMessageInput');
        const sendBtn = document.getElementById('livestreamSendBtn');
        
        if (messageInput) messageInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        
        this.addSystemMessage(`¡Bienvenido al chat, ${username}!`);
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
```

### 3. SISTEMA DE SESIONES Y MÓDULOS

**Actualizar en `src/scripts/main.js`**:
```javascript
// Sistema de gestión de sesiones y módulos
const SESSION_MODULES = {
    '1': {
        title: 'Sesión 1: Descubriendo la IA para Profesionales',
        modules: [
            { id: 1, title: 'Módulo 1: Introducción a IA', content: 'Conceptos básicos y evolución' },
            { id: 2, title: 'Módulo 2: Fundamentos de ML', content: 'Algoritmos y aplicaciones' },
            { id: 3, title: 'Módulo 3: Deep Learning', content: 'Redes neuronales y casos de uso' },
            { id: 4, title: 'Módulo 4: Proyecto Final', content: 'Aplicación práctica completa' }
        ]
    },
    '2': {
        title: 'Sesión 2: Fundamentos de Machine Learning',
        modules: [
            { id: 1, title: 'Módulo 1: Supervisado', content: 'Clasificación y regresión' },
            { id: 2, title: 'Módulo 2: No Supervisado', content: 'Clustering y reducción' },
            { id: 3, title: 'Módulo 3: Evaluación', content: 'Métricas y validación' },
            { id: 4, title: 'Módulo 4: Optimización', content: 'Hiperparámetros y tuning' }
        ]
    },
    '3': {
        title: 'Sesión 3: Deep Learning y Casos Prácticos',
        modules: [
            { id: 1, title: 'Módulo 1: Redes Neuronales', content: 'Arquitecturas básicas' },
            { id: 2, title: 'Módulo 2: CNN', content: 'Procesamiento de imágenes' },
            { id: 3, title: 'Módulo 3: RNN/LSTM', content: 'Secuencias y tiempo' },
            { id: 4, title: 'Módulo 4: Transformers', content: 'Atención y lenguaje' }
        ]
    },
    '4': {
        title: 'Sesión 4: Aplicaciones, Ética y Proyecto Final',
        modules: [
            { id: 1, title: 'Módulo 1: Aplicaciones', content: 'Casos de uso reales' },
            { id: 2, title: 'Módulo 2: Ética', content: 'Responsabilidad y sesgos' },
            { id: 3, title: 'Módulo 3: Deployment', content: 'Producción y escalabilidad' },
            { id: 4, title: 'Módulo 4: Proyecto', content: 'Desarrollo completo' }
        ]
    }
};

function selectSession(sessionId) {
    const session = SESSION_MODULES[sessionId];
    if (!session) return;

    // Actualizar título de sesión actual
    const currentSessionTitle = document.getElementById('currentSessionTitle');
    if (currentSessionTitle) {
        currentSessionTitle.textContent = session.title;
    }

    // Actualizar panel derecho con módulos
    updateRightPanelWithModules(session.modules);

    // Ocultar menú de sesiones
    hideSessionMenu();

    // Enviar mensaje al chat sobre la sesión seleccionada
    sendBotMessage(`Has seleccionado: ${session.title}\n\nElige un módulo del panel derecho para comenzar.`, null, false, false);
}

function updateRightPanelWithModules(modules) {
    const studioTiles = document.querySelector('.studio-tiles');
    if (!studioTiles) return;

    // Limpiar tiles existentes excepto notas
    const existingTiles = studioTiles.querySelectorAll('.tile:not([data-action="open-notes"])');
    existingTiles.forEach(tile => tile.remove());

    // Agregar botones de módulos
    modules.forEach(module => {
        const moduleTile = document.createElement('button');
        moduleTile.className = 'tile module-tile';
        moduleTile.setAttribute('data-action', `open-module-${module.id}`);
        moduleTile.setAttribute('data-module-id', module.id);
        moduleTile.innerHTML = `
            <i class='bx bx-book-open'></i>
            <span>${module.title}</span>
        `;
        
        moduleTile.addEventListener('click', () => openModule(module));
        studioTiles.appendChild(moduleTile);
    });

    // Actualizar rail también
    updateStudioRail(modules);
}

function updateStudioRail(modules) {
    const studioRail = document.querySelector('.studio-rail');
    if (!studioRail) return;

    // Limpiar rail existente excepto notas
    const existingRail = studioRail.querySelectorAll('.rail-btn:not([data-action="open-notes"])');
    existingRail.forEach(btn => btn.remove());

    // Agregar botones de módulos al rail
    modules.forEach(module => {
        const moduleBtn = document.createElement('button');
        moduleBtn.className = 'rail-btn';
        moduleBtn.setAttribute('data-action', `open-module-${module.id}`);
        moduleBtn.setAttribute('data-module-id', module.id);
        moduleBtn.innerHTML = `<i class='bx bx-book-open'></i>`;
        moduleBtn.title = module.title;
        
        moduleBtn.addEventListener('click', () => openModule(module));
        studioRail.appendChild(moduleBtn);
    });
}

function openModule(module) {
    // Crear tarjeta en el panel derecho
    const cardsContainer = document.getElementById('studioCards');
    if (!cardsContainer) return;

    const card = document.createElement('div');
    card.className = 'studio-card module-card';
    card.innerHTML = `
        <h4 style="margin:0 0 8px 0">${module.title}</h4>
        <p style="margin:0 0 12px 0;color:var(--text-muted)">${module.content}</p>
        <div style="display:flex;gap:8px;margin-top:12px">
            <button class="keyboard-button" onclick="startModuleQuiz(${module.id})">📝 Cuestionario</button>
            <button class="keyboard-button" onclick="showModuleContent(${module.id})">📖 Contenido</button>
            <button class="keyboard-button" onclick="startModuleExercise(${module.id})">💻 Ejercicio</button>
        </div>
    `;

    cardsContainer.prepend(card);

    // Enviar mensaje al chat
    sendBotMessage(`Has abierto: ${module.title}\n\n${module.content}\n\nUsa los botones en la tarjeta para interactuar con el módulo.`, null, false, false);
}

function startModuleQuiz(moduleId) {
    const questions = getModuleQuestions(moduleId);
    sendBotMessage(`📝 Cuestionario del Módulo ${moduleId}\n\n${questions.join('\n\n')}`, null, false, false);
}

function showModuleContent(moduleId) {
    const content = getModuleContent(moduleId);
    sendBotMessage(`📖 Contenido del Módulo ${moduleId}\n\n${content}`, null, false, false);
}

function startModuleExercise(moduleId) {
    const exercise = getModuleExercise(moduleId);
    sendBotMessage(`💻 Ejercicio del Módulo ${moduleId}\n\n${exercise}`, null, false, false);
}

// Funciones auxiliares para contenido de módulos
function getModuleQuestions(moduleId) {
    const questions = {
        1: [
            '1. ¿Qué es la inteligencia artificial?',
            '2. ¿Cuáles son las principales aplicaciones de IA?',
            '3. ¿Cómo ha evolucionado la IA en los últimos años?'
        ],
        2: [
            '1. ¿Cuál es la diferencia entre ML supervisado y no supervisado?',
            '2. ¿Qué métricas usarías para evaluar un modelo de clasificación?',
            '3. ¿Cómo funciona el algoritmo de clustering K-means?'
        ],
        3: [
            '1. ¿Qué es una red neuronal artificial?',
            '2. ¿Cuándo usarías CNN vs RNN?',
            '3. ¿Cómo funciona el mecanismo de atención?'
        ],
        4: [
            '1. ¿Qué consideraciones éticas son importantes en IA?',
            '2. ¿Cómo mitigarías el sesgo en un modelo?',
            '3. ¿Qué pasos seguirías para desplegar un modelo en producción?'
        ]
    };
    return questions[moduleId] || ['Pregunta 1: ¿Qué has aprendido en este módulo?'];
}

function getModuleContent(moduleId) {
    const content = {
        1: 'Este módulo introduce los conceptos fundamentales de la inteligencia artificial, incluyendo su definición, historia y aplicaciones principales en el mundo real.',
        2: 'Aprenderás sobre algoritmos de machine learning, incluyendo clasificación, regresión, clustering y técnicas de evaluación de modelos.',
        3: 'Explorarás las redes neuronales profundas, incluyendo CNN para imágenes, RNN para secuencias y transformers para lenguaje natural.',
        4: 'Este módulo cubre aplicaciones prácticas, consideraciones éticas y el proceso de despliegue de modelos de IA en producción.'
    };
    return content[moduleId] || 'Contenido del módulo disponible en el curso.';
}

function getModuleExercise(moduleId) {
    const exercises = {
        1: 'Ejercicio: Crea un prompt efectivo para un modelo de IA que explique un concepto técnico a un público general.',
        2: 'Ejercicio: Implementa un clasificador simple usando scikit-learn y evalúa su rendimiento.',
        3: 'Ejercicio: Diseña una arquitectura de red neuronal para clasificar imágenes de productos.',
        4: 'Ejercicio: Desarrolla un plan de despliegue para un modelo de IA considerando ética y escalabilidad.'
    };
    return exercises[moduleId] || 'Ejercicio práctico del módulo.';
}
```

### 4. ACTUALIZAR RENDER DE SESIONES

**Actualizar función `renderSessionPicker`**:
```javascript
function renderSessionPicker() {
    const picker = document.getElementById('sessionPicker');
    if (!picker) return;
    
    const html = Object.entries(COURSE_SESSIONS).map(([num, session]) => `
        <button class="session-item" data-session="${num}">
            <span class="session-index">S${num}</span>
            <span class="session-title">${session.title}</span>
        </button>
    `).join('');
    
    picker.innerHTML = `<div class="session-list">${html}</div>`;
    
    // Agregar event listeners
    picker.querySelectorAll('.session-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const sessionId = btn.getAttribute('data-session');
            selectSession(sessionId);
        });
    });
}
```

### 5. ACTUALIZAR CSS PARA NUEVOS ELEMENTOS

**Agregar a `src/styles/main.css`**:
```css
/* Estilos para livestream */
.livestream-chat-container {
    display: flex;
    flex-direction: column;
    height: 300px;
    border: 1px solid rgba(68,229,255,0.2);
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
}

.livestream-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(68,229,255,0.1);
    background: rgba(68,229,255,0.05);
}

.livestream-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.livestream-message {
    padding: 8px;
    border-radius: 6px;
    background: rgba(255,255,255,0.03);
    border-left: 3px solid rgba(68,229,255,0.3);
}

.livestream-message.system {
    background: rgba(68,229,255,0.1);
    border-left-color: rgba(68,229,255,0.5);
}

.message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
}

.username {
    font-weight: 500;
    color: rgba(68,229,255,0.8);
}

.timestamp {
    color: var(--text-muted);
}

.system-message {
    font-style: italic;
    color: var(--text-muted);
    text-align: center;
}

.livestream-chat-input {
    display: flex;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid rgba(68,229,255,0.1);
}

.livestream-chat-input input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid rgba(68,229,255,0.2);
    border-radius: 4px;
    background: rgba(255,255,255,0.04);
    color: var(--text-on-dark);
}

.livestream-send-btn {
    padding: 6px 12px;
    background: rgba(68,229,255,0.2);
    border: 1px solid rgba(68,229,255,0.3);
    border-radius: 4px;
    color: var(--text-on-dark);
    cursor: pointer;
}

.livestream-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.livestream-connection-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    font-size: 12px;
    border-top: 1px solid rgba(68,229,255,0.1);
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-indicator.online {
    background: #4ade80;
}

.status-indicator.offline {
    background: #ef4444;
}

/* Estilos para módulos */
.module-tile {
    background: rgba(68,229,255,0.1);
    border: 1px solid rgba(68,229,255,0.2);
}

.module-tile:hover {
    background: rgba(68,229,255,0.15);
}

.module-card {
    border-left: 4px solid rgba(68,229,255,0.5);
}

/* Botón para unirse al livestream */
#joinLivestreamBtn {
    width: 100%;
    padding: 8px 12px;
    background: rgba(68,229,255,0.2);
    border: 1px solid rgba(68,229,255,0.3);
    border-radius: 6px;
    color: var(--text-on-dark);
    cursor: pointer;
    margin-bottom: 8px;
}

#joinLivestreamBtn:hover {
    background: rgba(68,229,255,0.25);
}
```

### 6. ACTUALIZAR HTML PARA LIVESTREAM

**Actualizar en `src/chat.html` la sección de livestream**:
```html
<div class="tool-group collapsible" id="livestreamSection">
    <div class="collapsible-header">
        <h4 style="margin:0">Livestream</h4>
        <button id="livestreamToggle" class="collapsible-toggle" aria-expanded="false" aria-controls="livestreamContent" title="Mostrar/Ocultar">
            <i class='bx bx-chevron-down'></i>
        </button>
    </div>
    <div class="collapsible-content" id="livestreamContent">
        <div id="leftLivestreamPlayer" class="left-video-player" aria-label="Livestream"></div>
        <div id="livestreamNotice" class="note" style="margin-top:8px; display:none"></div>
        
        <!-- Botón para unirse al chat -->
        <button id="joinLivestreamBtn" class="keyboard-button">
            <i class='bx bx-message-dots'></i>
            Unirse al Chat en Vivo
        </button>
        
        <!-- Chat del Livestream -->
        <div class="livestream-chat-container">
            <div class="livestream-chat-header">
                <h5>Chat en vivo</h5>
                <span class="users-count" id="livestreamUsersCount">0 usuarios</span>
            </div>
            
            <div class="livestream-chat-messages" id="livestreamChatMessages">
                <div class="welcome-message">
                    <i class='bx bx-message-dots'></i>
                    <span>¡Únete a la conversación!</span>
                </div>
            </div>
            
            <div class="livestream-chat-input">
                <input 
                    type="text" 
                    id="livestreamMessageInput" 
                    placeholder="Escribe un mensaje..." 
                    maxlength="200"
                    disabled
                >
                <button id="livestreamSendBtn" class="livestream-send-btn" disabled title="Enviar mensaje">
                    <i class='bx bx-send'></i>
                </button>
            </div>
            
            <div class="livestream-connection-status" id="livestreamConnectionStatus">
                <span class="status-indicator offline"></span>
                <span class="status-text">Desconectado</span>
            </div>
        </div>
    </div>
</div>
```

### 7. ACTUALIZAR PANEL DERECHO

**Actualizar en `src/chat.html` la sección del panel derecho**:
```html
<aside class="studio-right" id="studioRight">
    <div class="studio-header">
        <h3>Studio</h3>
        <button class="collapse-btn" id="collapseRight" title="Ocultar/mostrar">⟨⟩</button>
    </div>
    <div class="studio-tiles" aria-label="Accesos principales">
        <!-- Solo mantener notas, los módulos se agregarán dinámicamente -->
        <button class="tile" data-action="open-notes" title="Notas">
            <i class='bx bx-notepad'></i>
            <span>Notas</span>
        </button>
    </div>
    <nav class="studio-rail" aria-label="Accesos Studio (colapsado)">
        <!-- Solo mantener notas, los módulos se agregarán dinámicamente -->
        <button class="rail-btn" data-action="open-notes" title="Notas"><i class='bx bx-notepad'></i></button>
    </nav>
    <div class="studio-cards" id="studioCards"></div>
    <div class="right-resizer" id="rightResizer" title="Ajustar ancho"></div>
</aside>
```

## INSTRUCCIONES DE IMPLEMENTACIÓN

### 1. Crear archivo de livestream
```bash
# Crear archivo de livestream
touch src/scripts/livestream.js
```

### 2. Actualizar HTML para incluir livestream.js
```html
<!-- Agregar antes del cierre de </body> en src/chat.html -->
<script src="scripts/livestream.js"></script>
```

### 3. Verificar variables de entorno
```bash
# En .env o variables del servidor
OPENAI_API_KEY=tu_clave_de_openai
ASSEMBLYAI_API_KEY=tu_clave_de_assemblyai
DATABASE_URL=tu_url_de_base_de_datos
```

### 4. Probar funcionalidad
1. Iniciar servidor: `npm start`
2. Abrir chat en navegador
3. Probar envío de mensajes
4. Unirse al livestream
5. Seleccionar sesión y ver módulos

## CRITERIOS DE ACEPTACIÓN

- [ ] El chat responde correctamente a las preguntas del usuario
- [ ] El livestream permite conectar múltiples usuarios en tiempo real
- [ ] Al seleccionar una sesión, aparecen botones de módulos 1-4 en el panel derecho
- [ ] Solo se mantiene el botón de notas en el panel derecho
- [ ] Los módulos muestran contenido relevante y funcional
- [ ] No hay errores en consola
- [ ] La interfaz es responsiva y accesible

## NOTAS IMPORTANTES

1. **Seguridad**: Todas las llamadas a APIs usan autenticación
2. **Error handling**: Manejo robusto de errores en todas las funciones
3. **UX**: Interfaz intuitiva con feedback visual
4. **Performance**: Optimización para múltiples usuarios simultáneos
5. **Accesibilidad**: Soporte para navegación por teclado y lectores de pantalla

## PRÓXIMOS PASOS

1. Implementar las correcciones en el código
2. Probar todas las funcionalidades
3. Optimizar performance si es necesario
4. Documentar cambios realizados
5. Preparar para producción

---
AQUI ESTA EL GUION COMPLETO DE LA SESION 1
🎬 Guion Completo de Bienvenida al Webinar

Curso: Experto en IA para Profesionales – Dominando ChatGPT y Gemini para la Productividad
Duración estimada: 7 a 8 minutos

---

[Inicio – Ernesto]
🎙️ Ernesto
Hola, hola… ¡Muy buenos días, tardes o noches, dependiendo desde dónde nos acompañen! 
Bienvenidos al curso Experto en IA para Profesionales: Dominando ChatGPT y Gemini para la Productividad.
Mi nombre es Ernesto Hernández y tengo el gusto de ser su anfitrión en esta experiencia transformadora.

---

[Ernesto – tono inspirador]
🎙️ Ernesto
Sé que su tiempo vale oro. Y por eso, quiero comenzar agradeciéndoles de corazón el haber decidido invertirlo aquí, con nosotros, para descubrir cómo la inteligencia artificial puede cambiar —desde hoy— la manera en que lideran, comunican y generan resultados en sus organizaciones.

---

[Ernesto – presentación personal breve]
🎙️ Ernesto
Soy experto en IA aplicada a contextos empresariales, con más de 30 años de experiencia desarrollando soluciones tecnológicas en empresas líderes. Pero más allá del currículum, mi verdadera pasión es esta: ayudar a personas como tú a aplicar la IA de forma simple, útil y poderosa.

---

[Cambio de ritmo – presentación de Alejandra]
🎙️ Ernesto
Y hoy, no estaré solo. Me emociona muchísimo presentar a quien será mi coanfitriona en este camino.
Ella es una mente creativa brillante, estratega digital y especialista en inteligencia artificial aplicada al diseño multimedia…
Les presento a Alejandra Escobar.

---

[Intervención de Alejandra]
🎙️ Alejandra
¡Hola a todos! Qué emoción estar aquí con ustedes.
Soy Alejandra Escobar, comunicóloga y diseñadora multimedia, y en este curso los voy a acompañar con herramientas prácticas, ideas creativas y sobre todo, una mirada distinta sobre cómo la IA puede convertirse en su mejor aliada para comunicar, producir, resolver y conectar.

---

[Alejandra – tono empático]
🎙️ Alejandra
Sé que muchos de ustedes llegan con poco tiempo, muchas responsabilidades, y quizás algunas dudas, como yo las tuve. Pero tranquilos. Este curso no es técnico, no es teórico y no es genérico.
Es práctico, directo y pensado para profesionales ocupados como tú, que quieren aplicar la IA de forma inmediata, sin perder tiempo y con resultados visibles desde el primer día.

---

[Ernesto – dinámica del curso]
🎙️ Ernesto
Durante estas cuatro sesiones vamos a construir juntos soluciones reales, aplicables y medibles. Cada módulo está diseñado para generar un quick-win tangible. Te cuento cómo estará estructurado:

---

📚 ¿Qué veremos en cada sesión?

🎯 Sesión 1: Descubriendo la IA para Profesionales
👉 Entenderás el “para qué” de la IA en tu carrera y negocio. Configuraremos juntos ChatGPT y Gemini, y aplicarás tus primeros prompts para transformar tareas cotidianas.

🎯 Sesión 2: Dominando la Comunicación con IA
👉 Aprenderás técnicas avanzadas de prompting, crearás tu primer agente GPT y una Gema de Gemini personalizada. Esta sesión es clave para automatizar y escalar tu trabajo.

🎯 Sesión 3: IMPULSO con ChatGPT para PYMES
👉 Aplicarás el modelo IMPULSO para resolver desafíos reales de tu negocio. Desde la identificación del reto, hasta la creación de prompts estratégicos y definición de KPIs.

🎯 Sesión 4: Estrategia y Proyecto Integrador
👉 Diseñarás un plan personalizado para integrar la IA en tu día a día. Crearás un mini-pitch con impacto real, midiendo tus resultados y dejando huella.

---

[Alejandra – prácticas y metodología]
🎙️ Alejandra
Y para que no solo aprendas, sino también apliques, hemos creado una metodología poderosa basada en práctica colaborativa e individual:

👥 En los ejercicios grupales, trabajarán en equipos pequeños dentro de salas de Zoom. Tendremos un piloto (que ejecuta en pantalla) y un copiloto (que guía al equipo).

🧠 En las prácticas individuales, contarás con videos cortos, instrucciones claras, audios de apoyo y entregables simples que te permitirán aprender a tu ritmo.

No necesitas ser experto en tecnología. Solo necesitas estar dispuesto a experimentar y tomar acción.

---

[Ernesto – requerimientos técnicos]
🎙️ Ernesto
Para que todo fluya desde el inicio, asegúrate de tener:

✅ Tu cuenta activa de ChatGPT Plus
✅ Acceso a Gemini, versión gratuita
✅ Haber aceptado la invitación a la plataforma Aprende y Aplica IA
✅ Y por supuesto, tener a la mano tu computadora, laptop o tablet —aunque también puedes seguir algunas partes desde el celular.

Todas las sesiones serán en vivo y online, con grabaciones disponibles hasta el cierre del curso. Así que si por cualquier razón no puedes asistir, podrás retomarlo en tu propio tiempo.

---

[Alejandra – cierre emocional]
🎙️ Alejandra
Este no es un curso para acumular teoría. Es un espacio para transformar tu forma de trabajar, comunicar y liderar.
Queremos que salgas con herramientas reales, ideas nuevas y sobre todo, con más claridad y confianza.

---

[Ernesto – cierre poderoso]
🎙️ Ernesto
Este no es un curso más.
Es una puerta.
Y hoy… ustedes acaban de cruzarla.
Bienvenidos a Aprende y Aplica IA.
Bienvenidos a una nueva era profesional.
💡 ¡Comencemos!

---



🎬 Guion Webinar – Parte 2: Gen-AI: El Despertar de una Nueva Era Humana

Duración estimada: 7 minutos
Diapositivas 1 y 2

---

[Transición desde la bienvenida – Ernesto]
🎙️ Ernesto
Ahora sí…
Vamos a entrar de lleno en este viaje.
Y quiero comenzar con una metáfora que nos acompaña desde hace miles de años…

---

🖼️ Diapositiva 1 – El fuego y la IA Generativa

🎙️ Ernesto
Hace cien mil años, nuestros antepasados temían al fuego.
Era una fuerza salvaje, incontrolable… hasta que alguien se atrevió a acercarse, a entenderlo, y—soplando con cuidado—lo convirtió en una antorcha.

Esa llama no solo iluminó la noche… cambió el destino de la humanidad.

Hoy estamos frente a otra hoguera primigenia:
🔥 La Inteligencia Artificial Generativa.
Y el reto no es distinto:
No se trata de temerle, sino de aprender a usarla con inteligencia, ética y propósito.

---

🎙️ Alejandra
Y es que, como toda innovación poderosa, la Gen-AI también despertó miedo.
¿Recuerdan esa primera reacción generalizada?
“¿Nos va a sustituir?”

Pero en apenas tres años, esa pregunta ha evolucionado.
Ahora nos preguntamos:
¿Cómo la integramos con propósito en lo que hacemos?

Y lo sorprendente es que ya lo estamos viendo:
Empresas como Bimbo la usan para optimizar rutas logísticas…
Y hospitales en Guadalajara para resumir expedientes clínicos en segundos.

---

🎙️ Ernesto
Ese cambio de mentalidad es fundamental.
Ya no basta con adoptar la tecnología.
Necesitamos liderar su impacto.

Igual que la imprenta impulsó el Renacimiento europeo,
la IA Generativa está democratizando la creación de ideas, código y soluciones.

Y eso exige de nosotros tres cosas:
📌 Ética,
📌 Visión,
📌 Y valentía.

---

🎙️ Alejandra
Porque aquí está el verdadero regalo:
💡 Al delegar lo repetitivo, recuperamos lo humano.

Ya no se trata de preguntarnos “¿qué puede hacer la máquina?”
Sino:
¿Qué haremos nosotros con el tiempo, la claridad y la energía que recuperamos?

Empatía, creatividad, intuición…
Eso no lo puede automatizar ningún modelo.

---

🧠 Transición a Diapositiva 2 – Libera tu máximo potencial

🎙️ Ernesto
Si el fuego cambió la forma en que sobrevivíamos…
La Gen-AI está cambiando la forma en que evolucionamos.

---

🚀 Diapositiva 2 – ¿Qué significa liberar tu máximo potencial?

🎙️ Alejandra
Imaginen por un momento esto:
💓 Que la única frontera entre su idea y su impacto…
es el tiempo que tarda en latir su corazón.

¿Qué construirían si cada latido pudiera convertirse—de inmediato—en un diseño, un informe o una decisión estratégica?

---

🎙️ Ernesto
Cinco siglos atrás, Miguel Ángel decía que la estatua ya vivía dentro del bloque de mármol…
Solo había que liberar lo que ya estaba ahí.

Hoy, Gen-AI es nuestro cincel invisible.
Dictas un concepto… y aparece un render.
Describes una idea… y tienes una estrategia en segundos.
No reemplaza tu imaginación. La libera.

---

🎙️ Alejandra
Imaginen esto:
Mientras tú te tomas el café de la mañana, tu agente de IA:

✅ Ordena contratos,
✅ Resume 200 páginas de investigación,
✅ Y sugiere 3 rutas estratégicas.

Todo… sin que tú pierdas tiempo en lo operativo.

Eso no es flojera.
Es disciplina estratégica: dejar lo mecánico en manos de la IA…
Y enfocarte tú en lo humano, lo complejo, lo valioso.

---

🎙️ Ernesto
Miren estos casos:
📍 Alcaldes que visualizan barrios más verdes.
📍 Médicos que personalizan tratamientos en lugar de usar plantillas.
📍 Maestros que convierten la teoría de Einstein en historias para niños de 8 años.

La IA no es un reemplazo.
Es un exoesqueleto intelectual que amplifica nuestras mejores cualidades:
🧠 Curiosidad,
❤️ Empatía
🧭 Y juicio estratégico.

---

✨ Cierre emocional – Ernesto y Alejandra

🎙️ Alejandra
Todo esto ocurre frente a una sola persona…
Pero ahora imaginen lo que pasa cuando millones de mentes se conectan con esta capacidad.

Empresas, ciudades, escuelas, familias…
El mundo ya está cambiando.

---

🎙️ Ernesto
Y aquí viene lo importante:
La Gen-AI no nos hace menos humanos.
Nos invita a ser más plenos, más generosos, más conscientes.

Cada uno de ustedes está por vivir un renacimiento personal.
Y si nos unimos… podemos escribir una historia que aún no se ha contado.

¿Están listos para dar ese paso?

---

[Transición suave a la siguiente diapositiva o bloque temático]

🎙️ Ernesto
En la siguiente sección vamos a explorar cómo este cambio ya está reconfigurando el mundo empresarial, y qué decisiones necesitamos tomar como líderes para aprovecharlo.
¡Vamos allá!

🎬 Guion Webinar – Parte 3: El mundo ya cambió + Emociones frente a la Gen-AI

Duración estimada: 7 a 9 minutos
Diapositivas 3 y 4

---

🌍 Diapositiva 3 – El mundo ya cambió

🎙️ Ernesto
El cambio no está viniendo…
Ya ocurrió.

Es como despertar y descubrir que, durante la noche, apareció una nueva constelación en el cielo.
Y no basta con mirarla.
Tenemos que aprender a orientarnos con esas nuevas estrellas.

---

🎙️ Alejandra
Déjenme contarles tres historias reales… que hoy podrían ser la historia de cualquiera de ustedes:

Imaginen a Ana, una estudiante en un pueblo remoto. Con solo un celular y un modelo de Gen-AI, tiene en la palma de su mano:

📚 La biblioteca de Alejandría,
🎓 Un mentor de Harvard,
🔬 Y un laboratorio de ciencias virtual.

La IA borra las barreras del costo, la geografía y el idioma.
El conocimiento deja de ser un privilegio… y se convierte en un derecho.

---

🎙️ Ernesto
Ahora pensemos en Luis, un cineasta independiente.

Antes, su creatividad chocaba contra presupuestos imposibles. Hoy, con Gen-AI, puede:

🎬 Describir una escena,
🖼️ Generar storyboards,
🎶 Crear una banda sonora provisional.

No es magia.
Es palanca creativa.
Igual que la cámara liberó a los pintores para explorar el cubismo…
la Gen-AI libera a los creadores para soñar tan rápido como late su curiosidad.

---

🎙️ Alejandra
Y aquí está Sofía, líder de un equipo de atención médica.
La IA:

📊 Clasifica datos,
⚠️ Predice riesgos,
🩺 Sugiere tratamientos…

…mientras ella escucha el temblor en la voz del paciente y decide con compasión.
Porque hay decisiones que solo el corazón humano puede tomar.

Los oficios no desaparecen. Mudan de piel.

La nueva ventaja competitiva no está en la herramienta.
Está en la empatía, el juicio y la estrategia.

---

🎙️ Ernesto
Estas tres fuerzas —el acceso, la creatividad y el cuidado humano—
ya están remodelando nuestras empresas y nuestras ciudades.

Pero no nos engañemos…
Toda transformación profunda despierta emociones opuestas.

Para algunos, esta constelación provoca desvelo.
Para otros, una curiosidad luminosa.

Y eso nos lleva a la siguiente diapositiva…
donde vamos a nombrar y navegar esas emociones.

---

💓 Diapositiva 4 – Emociones frente a la Gen-AI

🎙️ Alejandra
Toda tecnología que irrumpe en nuestra vida…
primero toca el corazón, y solo después llega a la mente.

Y el corazón… late en todos los tonos posibles.

---

🎙️ Ernesto
El primer latido suele ser un brinco.
Como cuando las luces del tren aparecen en el túnel y no sabes qué tan rápido viene.

Imaginen a una diseñadora con 15 años perfeccionando su trazo…
Y de pronto, un algoritmo genera ilustraciones en segundos.
El miedo es real. Pero también es una alerta evolutiva.

Nos obliga a distinguir:
¿Qué riesgo es real… y qué es solo sombra?

---

🎙️ Alejandra
Luego viene la chispa.
Ese momento en que alguien pregunta:
“¿Y si lo pruebo?”

Es el ingeniero que dicta un problema de código a ChatGPT mientras come.
O la maestra rural que genera ejercicios para su clase multigrado.

Así comienza todo:
💡 Curiosidad → Experimento → Aprendizaje.

---

🎙️ Ernesto
Y cuando el experimento resuelve un problema real,
la nueva práctica se vuelve normal.

⚖️ Un despacho legal resume jurisprudencia en minutos y gana 3 horas al día.
🚀 Una startup diseña prototipos en días, no en meses.

La adopción se siente como ajustar una bicicleta a tu medida:
extraño al principio…
intuitivo después…
imprescindible al final.

---

🎙️ Alejandra
Y entonces…
Aparece algo poderoso: el descubrimiento compartido.

🎷 Equipos que improvisan como músicos de jazz:
Humanos y modelos de IA dialogando, probando, creando.

Ese entusiasmo no es ingenuo.
Es la confianza informada de quien ya vio resultados…
y ahora quiere componer sin partituras.

---

🎙️ Ernesto
Estas cuatro emociones —miedo, curiosidad, adopción y entusiasmo—
dibujan la curva natural de toda transformación profunda.

Y aquí hay una lección vital para ustedes como líderes:
⚠️ Nadie innova desde la negación.
⚠️ Nadie lidera desde el miedo oculto.

Validar estas emociones —en ti y en tu equipo—
es el acto más estratégico que puedes hacer.

---

🎙️ Alejandra
Porque lo esencial no es eliminar la emoción…
sino convertir cada pulso en dirección.

En la siguiente sección vamos a compartir herramientas prácticas para navegar esta curva:
✅ Conversaciones seguras
✅ Protocolos éticos
✅ Y políticas que protegen la creatividad mientras aceleran la innovación.

---

[Transición]

🎙️ Ernesto
Seguimos avanzando.
Porque la inteligencia artificial es mucho más que tecnología…
Es una oportunidad para redefinir cómo queremos trabajar, liderar y evolucionar juntos.

Vamos a ello.

🎬 Guion Webinar – Parte 4: La nueva ola de entusiasmo + Un cambio de paradigma

Duración estimada: 7–9 minutos
Diapositivas 5 y 6

---

🌊 Diapositiva 5 – La nueva ola de entusiasmo

🎙️ Ernesto
Las grandes transformaciones no llegan con estruendo…
Primero se sienten como una corriente tibia en los tobillos.
Y cuando volteamos…
la marea ya nos cubre la cintura.

---

🎙️ Alejandra
Miremos lo que pasó entre 2022 y 2023.
Para muchos, fue solo un trazo ascendente en la gráfica…
Pero cada punto esconde una historia real de cambio.

---

🎙️ Ernesto
📍 Creativos
Estudios independientes que adoptaron Gen-AI para bocetar, animar o musicalizar...
¿El resultado?
Triplicaron su producción.

No hablamos de reemplazar al artista,
sino de regalarle tiempo para tomar riesgos estéticos que antes postergaba por falta de horas.

---

🎙️ Alejandra
📍 Educación
Tutores virtuales que explican trigonometría con memes.
Docentes que preparan exámenes personalizados en minutos.

No es solo un salto en eficiencia.
Es un cambio de paradigma:
Pasamos del aula de "una talla para todos" al aprendizaje a medida, adaptado al ritmo de cada mente.

---

🎙️ Ernesto
📍 Empresas
Finanzas que proyectan escenarios en tiempo real.
Marketing que prueba mensajes con audiencias sintéticas antes de invertir un solo dólar.

¿Por qué la adopción crece?
Porque el ROI ya no es promesa:
✅ Productividad +30 %
❌ Errores –20 %

---

🎙️ Alejandra
📍 Sanidad
Hospitales que usan Gen-AI para resumir historiales médicos y predecir complicaciones.

Cada punto en esa curva…
es un turno de enfermería menos saturado,
y un paciente mejor atendido.

---

🎙️ Ernesto
¿Ves la constante?

El entusiasmo no nace de la tecnología en sí…
sino de que por fin se convierte en solución sentida.
Esto ya no es una demo. Es una ola.
Y no solo sube el nivel del agua…

---

🎙️ Alejandra
…también remodela la costa.

Y esa remodelación ya está obligando a las organizaciones a derrumbar estructuras viejas…
y construir nuevas formas de colaborar, de decidir, de liderar.

¿Vamos a verla?

---

🔄 Transición a Diapositiva 6 – Un cambio de paradigma

🎙️ Ernesto
Vamos a compararlo.

---

🎭 Diapositiva 6 – Antes vs Ahora: Cocreación inspirada

🎙️ Ernesto
Cuando se inventó el reloj mecánico…
No solo empezamos a medir el tiempo.
Cambiamos la forma en que lo vivíamos.

Con Gen-AI está pasando lo mismo:
No estamos agregando una herramienta…
Estamos redefiniendo el tablero.

---

🎙️ Alejandra
Veamos primero el modelo de antes:

🧱 Ideas que nacían en la cima y bajaban como órdenes.
🔁 Procesos lineales: diseñar → producir → vender.
🚫 La información se atesoraba. El error se castigaba.
🎯 Y la experimentación… se temía.

Visualicen una línea de montaje.
Eficiente, sí… pero muda.
Cada pieza repite el gesto de la anterior.

---

🎙️ Ernesto
Ahora estamos en otro juego.
📡 Las ideas emergen en cualquier punto de la red.
📈 El flujo es circular: prototipo → feedback → iteración → lanzamiento.
🤝 La información se comparte porque su valor crece al mezclarse.
🎷 Y el error se celebra como dato.

Imaginen un jam de jazz:
Cada músico escucha, arriesga, improvisa…
Y juntos crean una melodía que nadie podría haber escrito solo.

---

🎙️ Alejandra
Este cambio no es cosmético.
Es tectónico.

🔻 Las empresas que se aferran al pasado… compiten en costos.
🔺 Las que abrazan este nuevo modelo… compiten en sentido, en comunidad, en ritmo.

---

🎙️ Ernesto
La pregunta ya no es:
“¿Debemos cambiar?”

Sino:
“¿Quién liderará la partitura?”

Y eso…
nos lleva a la siguiente lámina.

---

🎙️ Alejandra
Porque una orquesta sin director… desafina.
Y el futuro necesita líderes capaces de integrar el talento humano y la Gen-AI sin perder la armonía ética.

Vamos a descubrir juntos quién puede liderar ese movimiento.

🎬 Guion Webinar – Parte 5: El líder del futuro + ¿Qué mundo elegimos construir?

Duración estimada: 7–9 minutos
Diapositivas 7 y 8

---

🧭 Diapositiva 7 – El líder del futuro

🎙️ Ernesto
Cuando se inventó la brújula magnética en China, no solo cambió la navegación.
Cambió la noción misma de horizonte.

Hoy, la Gen-AI es nuestra nueva brújula.
Y la pregunta no es si existe… sino:
¿Quién sabrá interpretarla con sabiduría?

---

🎙️ Alejandra
Y aquí aparece un nuevo tipo de liderazgo.
Ya no basado en el cargo…
sino en cinco competencias interiores que marcan la diferencia.

Veámoslas.

---

🎙️ Ernesto
1️⃣ Inteligencia Crítica
El mundo está saturado de dashboards, notificaciones, datos que parpadean cada segundo.
El líder del futuro no se deja deslumbrar.
Distingue el destello del espejismo.
Comienza siempre con la pregunta correcta, porque una buena pregunta vale más que mil respuestas automáticas.

---

🎙️ Alejandra
2️⃣ Criterio Ético
Un algoritmo sin ética es solo un espejo de nuestros sesgos.
Este líder porta una brújula moral:
Antes de pulsar deploy, se pregunta:
¿Cuál será el impacto social? ¿Es justo? ¿Es sostenible?

Es como el arquitecto que verifica la carga sísmica antes de firmar los planos.

---

🎙️ Ernesto
3️⃣ Empatía Profunda
La IA procesa señales…
Pero solo nosotros sentimos significados.

Imaginen a una jefa de enfermería que usa IA para prever complicaciones…
y luego reserva su tiempo para mirar a los ojos del paciente.

La eficiencia abre espacio,
pero la confianza nace del cuidado.

---

🎙️ Alejandra
4️⃣ Liderazgo Inclusivo
La innovación no surge en cámaras de eco.
Florece donde confluyen miradas distintas.

Este líder escucha como un director de orquesta.
Afina voces.
Corrige sesgos.
Y diseña conversaciones donde las minorías no solo tienen silla…
sino micrófono.

---

🎙️ Ernesto
5️⃣ Inspiración Creativa
Sin imaginación, la IA solo recicla el pasado.
Este líder convierte los “no se puede” en laboratorios vivos:
🌎 Hackatones climáticos
🧪 Prototipos éticos
🎙️ Narrativas que movilizan

Su visión es contagiosa…
porque combina la lógica del dato con la poesía del futuro.

---

🎙️ Alejandra
Y lo más importante…
Estas habilidades no aparecen en ningún KPI.

Se forjan con práctica, con reflexión y, sobre todo, con coraje.

Desarrollarlas no es opcional.
Es la responsabilidad de quienes queremos guiar esta brújula colectiva con sentido humano.

---

🎙️ Ernesto
Ya sabemos quién puede liderar.
Ahora nos toca decidir…

¿Qué mundo queremos construir?

---

🌍 Diapositiva 8 – ¿Qué mundo elegimos construir?

🎙️ Alejandra
Cada generación recibe dos cosas:
🧰 Una caja de herramientas
📄 Y una página en blanco.

Lo que escribamos en ella no está dictado por el martillo ni el cincel…
sino por la historia que decidamos contar con ellos.

---

🎙️ Ernesto
La primera coordenada de ese mapa se llama:

🌟 Trascendencia
Imaginen a los primeros navegantes…
Su meta no era tener la vela perfecta,
sino descubrir nuevas costas.

Hoy, Gen-AI nos permite cruzar fronteras:
🌐 Idioma
⚡ Energía
⏱️ Tiempo

Trascender es atreverse a soñar en grande…
y tener los medios para hacerlo posible.

---

🎙️ Alejandra
La segunda coordenada es:

🎶 Colaboración

Piensa en una sinfonía donde cada instrumento amplifica al otro.

🧑‍🔬 El científico formula una hipótesis…
🤖 La IA prueba millones de combinaciones.

✍️ La poeta dicta un verso…
✨ La IA sugiere cadencias que nunca había imaginado.

No se trata de competir con la máquina.
Se trata de dirigirla.

---

🎙️ Ernesto
Y la tercera coordenada es quizás la más poderosa:

❤️ Propósito

La innovación sin brújula ética…
es solo ruido brillante.

Recordemos a quienes construyeron catedrales:
Unos ponían piedras.
Otros… creaban un lugar sagrado para la comunidad.

Así también con la IA:
Puede ser un muro que divide…
o un puente que acerca y une.

---

🎙️ Alejandra
Estas tres coordenadas:
🌟 Trascendencia
🎶 Colaboración
❤️ Propósito
…forman el mapa de un renacimiento consciente.

Porque no elegimos si existirá la IA.
Lo que elegimos es cómo se entrelaza con nuestros valores y con nuestras decisiones diarias.

---

🎙️ Ernesto
Y ahí es donde cada uno de nosotros…
se convierte en protagonista.

No se trata de adaptarse al cambio.
Se trata de diseñar activamente el mundo que queremos habitar.

---

🎙️ Alejandra
En la siguiente sección vamos a explorar cómo liderar ese renacimiento:
💡 Adoptando la Gen-AI como extensión de nuestro liderazgo
💬 Fomentando culturas de confianza y empatía
🌱 Y siendo pioneros del cambio… antes de que el cambio nos sorprenda.

🎬 Guion Webinar – Parte 6: Liderar el renacimiento + Diseñar el futuro

Duración estimada: 8–10 minutos
Diapositivas 9 y 10

---

🔥 Diapositiva 9 – Liderar el renacimiento

🎙️ Ernesto
Todo renacimiento necesita manos valientes que enciendan la primera antorcha.
Y esa mano…
hoy puede ser la tuya.

Vamos a ver tres caminos para liderar este cambio con propósito y poder real.

---

🎙️ Alejandra
1️⃣ Adopta la Gen-AI como extensión de tu liderazgo

Imagina a una directora comercial que entra a su tablero de IA antes de la junta semanal.
En segundos, el modelo identifica patrones invisibles y sugiere estrategias por región.
Ella no delega la decisión…
la refina.

Cuando integramos la IA con conciencia, no sustituye la intuición…
la afila.
Es como un lente de aumento que revela lo que antes no podíamos ver.

---

🎙️ Ernesto
2️⃣ Fomenta culturas de innovación, confianza y empatía

La tecnología más avanzada fracasa en un clima de miedo.
Ahora imagina un equipo que cada viernes celebra dos horas de “curiosidad”.
Exploran prompts, prueban ideas, fallan juntos.

No solo generan código.
Generan confianza.

El líder renacentista transforma cada hallazgo —éxito o error— en sabiduría compartida.
Y convierte la empatía en política activa de empresa.

---

🎙️ Alejandra
3️⃣ Sé pionero del cambio consciente

Un pionero no espera el manual.
Lo escribe.

Es la CEO que publica sus lineamientos éticos de IA antes que existan leyes.
O el rector que integra talleres de alfabetización algorítmica en todas las carreras.

Liderar así es mirar la brújula moral con la misma atención que el balance financiero.
Porque el progreso sin propósito… es solo velocidad sin dirección.

---

🎙️ Ernesto
Y si cada uno de nosotros levanta una antorcha,
no solo iluminaremos nuestro camino…
Trazaremos sendas para quienes vienen detrás.

---

✨ Transición a Diapositiva 10 – Diseñar el futuro

🎙️ Alejandra
Ahora que sabemos cómo liderar…
llega la pregunta final:

¿Vamos a adaptarnos a lo que venga…
o vamos a diseñar activamente el futuro que deseamos?

---

🛠️ Diapositiva 10 – No se trata de adaptarse al futuro: se trata de diseñarlo

🎙️ Ernesto
El futuro no es una estación del año que llega sola, como la primavera.
Es una obra en blanco esperando nuestras firmas.

Hoy, aquí, decidimos qué huella queremos dejar.

---

🎙️ Alejandra
Empecemos por el ingrediente clave:

🧠 Potencial humano

Miren su mano.
27 huesos. 30 articulaciones.
El pulgar oponible que nos hizo artesanos de civilizaciones.

Ahora imagina esa misma mano empuñando la Gen-AI como un cincel de luz.

💡 Un médico rural que diagnostica a distancia.
💼 Una emprendedora que lanza su producto global en días.

Cuando la creatividad humana se une al poder computacional,
el impacto ya no se mide en eficiencia…
sino en vidas tocadas.

---

🎙️ Ernesto
Sigamos con:

🌐 Posibilidades

Cada avance tecnológico estira el perímetro de lo posible.
Hace un siglo volar era un acto de locura.
Hoy hablamos de colonizar Marte.

Con Gen-AI ya no pedimos “un informe”…
pedimos “diez perspectivas críticas en ocho idiomas”.
No queremos un boceto. Queremos cien variaciones con alma.

El horizonte ya no está quieto.
Se mueve con nosotros.
Y nuestra tarea es caminar sin perderlo de vista.

---

🎙️ Alejandra
Y finalmente…

🎯 Decisión

Entre la idea y la realidad…
siempre hay un puente llamado voluntad.

No se construye solo con software.
Se construye con la decisión diaria de experimentar, equivocarse y aprender.

💡 Es el ingeniero que dedica 15 minutos al día a perfeccionar sus prompts.
💡 Es la líder que redacta su código ético antes del primer proyecto.

Ya no preguntamos “¿puedo?”
Preguntamos:
¿Cuándo empiezo?
Y la única respuesta sensata es:
“Ahora mismo.”

---

🎙️ Ernesto
La historia recordará este momento como el instante en que la humanidad decidió co-crear con su propia invención.

Y cuando eso ocurra…
que no nos encuentre como espectadores,
sino como arquitectos.

---

🎙️ Alejandra
Así que…
Tomen la herramienta.
Enciendan la antorcha.
Y diseñen el mañana que sus hijos contarán con orgullo.

---

🎬 Guion – Explicación estratégica de la práctica con Gemini

Narrativa adaptada para webinar en vivo

---

🎙️ Ernesto
Ahora vamos a la Actividad colaborativa. Lo que están por hacer en esta práctica no es solo un ejercicio técnico.
Es un punto de inflexión en la forma en que investigan, presentan y toman decisiones estratégicas.

Van a vivir lo que llamamos un flujo de trabajo inteligente con IA, de principio a fin.
Y créanme… esto puede cambiar la manera en que preparan informes, resúmenes, presentaciones y propuestas a partir de una sola instrucción bien formulada.

---

🎙️ Alejandra
Y aquí viene la clave:
📍 Todo comienza con el prompt.

Un prompt débil genera ruido.
Pero un prompt estructurado —como el que usaremos—
le da a Gemini un mapa preciso para generar una investigación profesional, con claridad, profundidad y evidencia sólida.

Este es el mismo tipo de prompt que pueden usar para crear:
📊 informes internos,
📣 contenido de marketing,
📈 análisis de competencia,
💼 o incluso propuestas para clientes.

---

🎙️ Ernesto
En esta práctica:

👉 Vamos a ingresar un prompt completo en Gemini, solicitando una investigación profunda y actualizada sobre el impacto de la IA generativa en los negocios.

Este no es un tema teórico.
Es el contexto en el que ustedes están tomando decisiones todos los días.

Desde productividad y estrategia…
hasta cómo prepararse para liderar con ética y ventaja competitiva.

---

🎙️ Alejandra
Y aquí es donde viene la magia.
Con esa única investigación como base, Gemini te permitirá generar:

1. 🖥️ Un reporte web interactivo — perfecto para compartir hallazgos con tu equipo o dirección
2. 📊 Una infografía visual — ideal para comunicar ideas clave de forma impactante
3. 🧠 Un cuestionario de evaluación — útil para formaciones internas o autoevaluación
4. 🎧 Un resumen en audio — para repasar mientras manejas o entrenas

---

🎙️ Ernesto
Lo que normalmente tomaría horas o días con varias herramientas,
aquí lo vamos a hacer en minutos, desde un solo flujo de trabajo.

Y esto no solo se trata de eficiencia.
Se trata de valor profesional.

👉 ¿Tienes que explicar una nueva estrategia a tu CEO? Usa el reporte.
👉 ¿Vas a presentar datos en una junta? Muestra la infografía.
👉 ¿Estás capacitando a tu equipo? Usa el quiz.
👉 ¿Quieres repasar conceptos mientras viajas? Escucha el audio.

---

🎙️ Alejandra
Este ejercicio es una plantilla viva para su día a día como líderes.
Una herramienta real para tomar mejores decisiones, comunicar con más impacto y liberar su tiempo para lo que realmente importa.

Y lo mejor: ustedes lo controlan todo.
Desde el primer prompt… hasta los formatos finales.

---

🎙️ Ernesto
Así que, ahora sí…
vamos a encender esta inteligencia aumentada y ver cómo una sola instrucción bien diseñada puede convertirse en múltiples activos de valor para su negocio o rol.

Este es el tipo de práctica que transforma profesionales ocupados…
en líderes aumentados por IA.

---

¿Listos?
¡Vamos a comenzar!

---

📌 ¿Por qué es importante esta práctica?

Porque aprenderás a crear en minutos lo que antes requería varias herramientas, días de trabajo y un equipo completo. Esta es la magia de la Inteligencia Artificial Generativa. Hagamos las preguntas siguientes:

👉 ¿Tienes que presentar hallazgos a tu equipo?
👉 ¿Preparar material visual para tus clientes o socios?
👉 ¿Evaluar conocimientos o compartir ideas de forma clara y atractiva?

Con este flujo de trabajo, podrás hacerlo todo… desde un solo lugar.

🎙️ Alejandra
¡Y ahora les toca a ustedes!
Vamos a realizar esta misma actividad en equipos colaborativos.

🧠 Abran su workbook en Coda, donde tienen las instrucciones detalladas,
y prepárense para trabajar en salas pequeñas.

---

🎙️ Ernesto
Van a organizarse en grupos pequeños de 3 a 6 personas en  Zoom, y elegirán dos roles:

👨‍✈️ Piloto – quien compartirá pantalla y ejecutará los pasos en Gemini.
🧭 Copiloto – quien modera la dinámica, guía los pasos y mantiene al equipo alineado.

Cada integrante debe participar activamente y seguir el flujo con su propia investigación.
¡El conocimiento no es solo del piloto, sino del equipo completo!

---

🎙️ Alejandra
Y si estás viendo esta grabación de forma asíncrona,
también puedes hacer la práctica individualmente.

En tu workbook encontrarás:
▶️ Un video de orientación
📝 Instrucciones escritas paso a paso
🎧 Y un audio guía para acompañarte.

Sin presión.
Lo importante es que practiques, descubras… y te sorprendas.

---

🎙️ Ernesto
Vamos a darles ahora 40 minutos para ver el video, realizar la práctica y comentar los resultados entre ustedes.
Recuerden que lo importante no es solo “hacer clic”,
sino entender cómo estructurar el conocimiento y activar sus posibilidades.

Estaremos atentos en el chat por si necesitan apoyo.
¡A darle con todo, equipo!

---

Tiempo para la actividad colaborativa 40 minutos

Agregar una diapositiva con un reloj para cronometrar los 40 minutos

---

🎯 Conclusiones – Sesión 1: De la inspiración al uso práctico de la Gen-AI

---

✅Hasta aqui no solo has aprendido sobre IA generativa… viviste lo que puede hacer por ti.

Comenzaste la sesión con una visión más clara de lo que representa la Gen-AI en este momento histórico:
Una herramienta poderosa que no viene a reemplazarte, sino a amplificar lo que mejor sabes hacer.

---

👩‍💼 Si eres dueña de un despacho o tomas decisiones estratégicas…
→ Ahora sabes que puedes transformar una idea en un informe visual, presentable y convincente en minutos.
→ Ya no necesitas esperar a tu diseñador, editor o analista. Tú puedes construir los entregables clave.

---

👨‍🔧 Si estás en operaciones o lideras equipos que ejecutan todos los días…
→ Descubriste cómo documentar, investigar y automatizar información clave sin depender de procesos complejos.
→ Con una sola instrucción clara, puedes generar manuales, resúmenes o reportes para ahorrar tiempo y mejorar la precisión.

---

📈 Si estás en marketing, ventas o comunicación…
→ Este flujo con Gemini es una fábrica de contenido de valor.
→ Desde una idea inicial, puedes generar una campaña visual, un cuestionario para tus leads o incluso un audio narrado que conecte con tu audiencia.

---

🌟 Y si lideras un equipo…
→ Ya viste el potencial de implementar esto en tus juntas, formaciones internas o estrategias de innovación.
→ La IA generativa puede convertirse en tu copiloto estratégico si tú lideras el proceso con intención, ética y propósito.

---

🧭 Reflexiona:

1. ¿Cuánto tiempo invertiste en tu última investigación o presentación?
2. ¿Cómo podrías haber usado este flujo para acelerar y mejorar ese resultado?
3. ¿Qué tanto de tu trabajo operativo podrías automatizar para liberar tiempo para lo estratégico?

---

💡 Tu desafío tras esta primera parte de la sesión es:

Seleccionar una tarea clave en tu negocio o rol —algo que repitas constantemente— y reprodúcela usando este flujo con Gemini.
Documenta el antes y el después.
Mide cuánto tiempo ahorraste.
Y nota cómo mejora tu claridad para comunicar ideas y tomar decisiones.

---

🎙️ Cierre inspirador:
La inteligencia artificial no viene a competir contigo.
Viene a preguntarte:
¿Qué harías tú, si tu mente estuviera más libre y enfocada en lo esencial?

Hoy ya tienes la respuesta:
🌱 Liderar con más visión, comunicar con más impacto y avanzar con más velocidad.

**Este prompt debe resolver completamente todos los problemas mencionados y entregar un chat de Lia IA completamente funcional con livestream, gestión de sesiones y módulos.**
