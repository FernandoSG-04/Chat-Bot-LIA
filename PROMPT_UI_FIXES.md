# PROMPT: Arreglar Interfaz de Livestream

## OBJETIVO
Arreglar la interfaz del livestream para que sea más limpia y funcional, eliminando elementos innecesarios y mejorando la experiencia del usuario.

## PROBLEMAS A SOLUCIONAR

### 1. Eliminar espacio negro y texto de configuración
- **Ubicación**: Área principal izquierda (debajo de "Herramientas")
- **Problema**: Hay un espacio negro grande y texto que dice "Configura window.ZOOM_MEETING_ID y window.ZOOM_MEETING_PWD para cargar el Web Client de Zoom dentro de la app."
- **Solución**: Eliminar completamente esta sección

### 2. Reposicionar botón "Unirse al Chat en Vivo"
- **Ubicación actual**: En medio del área principal
- **Nueva ubicación**: Justo debajo de "LIVESTREAM" en la barra lateral izquierda
- **Acción**: Hacer que aparezca como un botón integrado en la sección de herramientas

### 3. Eliminar modal de nombre de usuario
- **Problema**: Aparece un modal pidiendo "Ingresa tu nombre para el chat"
- **Solución**: Tomar automáticamente el nombre del usuario actual o usar un nombre genérico

## CAMBIOS ESPECÍFICOS A REALIZAR

### En `src/chat.html`:

1. **Eliminar sección de video/zoom**:
```html
<!-- ELIMINAR esta sección completa -->
<div class="video-container">
    <!-- Todo el contenido del video y configuración de Zoom -->
</div>
```

2. **Modificar sección de herramientas**:
```html
<div class="tools-section">
    <h3>Herramientas</h3>
    <div class="tool-item" onclick="showVideos()">VIDEOS</div>
    <div class="tool-item" onclick="showGlossary()">GLOSARIO</div>
    <div class="tool-item" onclick="showLivestream()">LIVESTREAM</div>
    <!-- AGREGAR botón aquí -->
    <button id="joinLivestreamBtn" class="livestream-join-btn" onclick="joinLivestream()">
        <i class="fas fa-comments"></i>
        Unirse al Chat en Vivo
    </button>
</div>
```

3. **Eliminar botón duplicado**:
```html
<!-- ELIMINAR este botón que está en el área principal -->
<button id="joinLivestreamBtn" class="btn btn-primary">
    <i class="fas fa-comments"></i>
    Unirse al Chat en Vivo
</button>
```

### En `src/scripts/livestream.js`:

1. **Modificar función `joinChat()`**:
```javascript
joinChat() {
    // ELIMINAR la parte que pide nombre
    // const username = prompt('Ingresa tu nombre para el chat:');
    // if (!username) return;
    
    // Usar nombre automático
    const username = `Usuario_${Math.floor(Math.random() * 1000)}`;
    
    this.socket.emit('join-livestream-chat', { username });
    this.enableChatInput();
    this.addSystemMessage(`${username} se unió al chat`);
}
```

2. **Eliminar modal de nombre**:
```javascript
// ELIMINAR cualquier código que muestre modales de nombre
// No necesitamos prompt() ni modales personalizados
```

### En `src/styles/main.css`:

1. **Agregar estilos para el nuevo botón**:
```css
.livestream-join-btn {
    background: linear-gradient(135deg, #00d4aa, #0099cc);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    margin-top: 10px;
    width: 100%;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.livestream-join-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
}

.livestream-join-btn i {
    font-size: 16px;
}
```

2. **Eliminar estilos innecesarios**:
```css
/* ELIMINAR o comentar estilos relacionados con video-container */
.video-container {
    /* Comentar o eliminar */
}
```

## RESULTADO ESPERADO

1. **Interfaz más limpia**: Sin espacio negro ni texto de configuración
2. **Botón integrado**: "Unirse al Chat en Vivo" aparece directamente en la barra lateral
3. **Sin modales**: El usuario se une automáticamente sin pedir nombre
4. **Mejor UX**: Flujo más directo y sin interrupciones

## ARCHIVOS A MODIFICAR

1. `src/chat.html` - Estructura HTML
2. `src/scripts/livestream.js` - Lógica del livestream
3. `src/styles/main.css` - Estilos CSS

## CRITERIOS DE ACEPTACIÓN

- [ ] No hay espacio negro en el área principal
- [ ] No aparece texto de configuración de Zoom
- [ ] El botón "Unirse al Chat en Vivo" está en la barra lateral
- [ ] No aparece modal pidiendo nombre de usuario
- [ ] El usuario se une automáticamente al chat
- [ ] La interfaz se ve más limpia y profesional
