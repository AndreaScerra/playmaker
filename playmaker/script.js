// ====================================================
// 1. CONFIGURAZIONE DEL CANVAS E DEL CONTEXT 2D
// ====================================================
const canvas = document.getElementById('playbook-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 800;

// ====================================================
// 2. NAVIGAZIONE E UTILITÀ DI BASE
// ====================================================

// Pulsante per navigare alla pagina PNG-to-PDF
document.getElementById('goptp').addEventListener('click', () => {
    window.location.href = '../png-to-pdf/ptp.html';
});

// Funzione per richiedere il nome dello schema (play)
function askForName() {
    let playName = prompt("Inserisci il nome dello schema:");
    return playName ? playName.trim() : "SenzaNome";
}

// ====================================================
// 3. CONFIGURAZIONE DELL'AREA DI MOVIMENTO E DEI GIOCATORI
// ====================================================

// Definizione dell'area in cui i giocatori possono muoversi
const moveArea = {
    minX: 15,    // Coordinata X minima
    maxX: 985,   // Coordinata X massima
    minY: 640,   // Coordinata Y minima
    maxY: 785    // Coordinata Y massima
};

// Array di oggetti che rappresentano i giocatori
let players = [
    { x: 200, y: 640, initialX: 200, initialY: 640, color: '#FF8000', id: 1, letter: 'X', endMarker: 'arrow' }, // WR sinistra
    { x: 650, y: 640, initialX: 650, initialY: 640, color: '#AD1EAD', id: 2, letter: 'Z', endMarker: 'arrow' }, // WR2 destra
    { x: 500, y: 640, initialX: 500, initialY: 640, color: '#696161', id: 3, letter: 'C', endMarker: 'arrow' }, // Centro
    { x: 800, y: 640, initialX: 800, initialY: 640, color: '#14C19C', id: 4, letter: 'Y', endMarker: 'arrow' }, // WR destra
    { x: 500, y: 750, initialX: 500, initialY: 750, color: '#B50000', id: 5, letter: 'Q', endMarker: 'arrow' }   // QB
];

// Array per memorizzare le traiettorie (rotte) disegnate per ciascun giocatore
let routes = [];

// Variabili di stato per la gestione del disegno e del trascinamento
let isDrawing = false;
let currentRoute = null;
let mouseX = 0;
let mouseY = 0;
let draggedPlayer = null;
let geometricMode = true;       // Se true, attiva il "geometric mode" per i segmenti
let shiftPressed = false;       // Stato del tasto Shift
let highlightedPlayer = false;  // Giocatore evidenziato (selezionato)
let ctrlPressed = false;        // Stato del tasto Control
const proximityThreshold = 100; 

// Variabili per il supporto touch
let touchStartTime = 0;
let touchTimeout = null;

// ====================================================
// 4. FUNZIONI DI SUPPORTO
// ====================================================

//vede se i segmenti sono vicini tra loro
function areSegmentsClose(prev, curr, next) {
    const dist1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dist2 = Math.hypot(next.x - curr.x, next.y - curr.y);
    return dist1 < proximityThreshold && dist2 < proximityThreshold;
}

// Controlla se il puntatore del mouse è sopra un giocatore (raggio 15px)
function isMouseOverPlayer(player, mouseX, mouseY) {
    return Math.hypot(player.x - mouseX, player.y - mouseY) < 15;
}

// Evidenzia un giocatore e ridisegna il canvas
function highlightPlayer(player) {
    highlightedPlayer = player;
    draw();
}

// Restituisce l'indice corrente salvato in localStorage (default 1)
function getCurrentIndex() {
    return parseInt(localStorage.getItem('playbookIndex')) || 1;
}

// Aggiorna l'indice corrente in localStorage
function updateIndex(index) {
    localStorage.setItem('playbookIndex', index);
}

// ====================================================
// 5. GESTIONE DEGLI EVENTI DEL MOUSE SUL CANVAS
// ====================================================

// Mousedown: inizia il disegno della traiettoria oppure il trascinamento di un giocatore
canvas.addEventListener('mousedown', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    // Se il tasto Shift è premuto, cerca di iniziare a trascinare un giocatore
    if (shiftPressed) {
        draggedPlayer = players.find(player => isMouseOverPlayer(player, mouseX, mouseY));
        if (draggedPlayer) {
            highlightPlayer(draggedPlayer);
        }
    } else {
        // Se è già selezionato un giocatore evidenziato, inizia a disegnare la traiettoria
        if (highlightedPlayer) {
            isDrawing = true;
            // Verifica se esiste già una rotta per il giocatore evidenziato
            let existingRoute = routes.find(route => route.playerId === highlightedPlayer.id);

            // Se non esiste, la crea e la aggiunge all'array delle rotte
            if (!existingRoute) {
                existingRoute = { 
                    playerId: highlightedPlayer.id, 
                    color: highlightedPlayer.color, 
                    segments: [{ x: highlightedPlayer.x, y: highlightedPlayer.y }]
                };
                routes.push(existingRoute);
            }

            currentRoute = existingRoute;
            // Aggiunge il nuovo segmento della traiettoria dove è stato premuto il mouse
            currentRoute.segments.push({ x: mouseX, y: mouseY });
        }
    }
    draw();
});

// Mousemove: gestisce il trascinamento di un giocatore oppure il disegno continuo della traiettoria
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    // Se si sta trascinando un giocatore (Shift premuto)
    if (draggedPlayer && shiftPressed) {
        const dx = mouseX - draggedPlayer.x;
        const dy = mouseY - draggedPlayer.y;

        const newX = draggedPlayer.x + dx;
        const newY = draggedPlayer.y + dy;

        // Controlla che il nuovo posizionamento sia all'interno dell'area consentita
        if (newX >= moveArea.minX && newX <= moveArea.maxX &&
            newY >= moveArea.minY && newY <= moveArea.maxY) {
            draggedPlayer.x = newX;
            draggedPlayer.y = newY;

            // Aggiorna tutti i segmenti della traiettoria associati al giocatore trascinato
            routes.forEach(route => {
                if (route.playerId === draggedPlayer.id) {
                    route.segments.forEach(segment => {
                        segment.x += dx;
                        segment.y += dy;
                    });

                    // Aggiorna la posizione della palla se presente
                    if (route.footballIcon) {
                        route.footballIcon.x += dx;
                        route.footballIcon.y += dy;
                    }
                }
            });
            draw();
        }
    }

    // Se si sta disegnando la traiettoria (mouse premuto senza Shift e con giocatore evidenziato)
    if (isDrawing && !shiftPressed && highlightedPlayer) {
        const segments = currentRoute.segments;
        // Crea un nuovo segmento con lo stato 'isDashed' determinato dal tasto Control
        const newSegment = { x: mouseX, y: mouseY, isDashed: ctrlPressed };

        if (geometricMode) {
            // In modalità geometrica, calcola l'angolo e la lunghezza rispetto all'ultimo segmento
            const lastSegment = segments[segments.length - 1];
            const dx = mouseX - lastSegment.x;
            const dy = mouseY - lastSegment.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            newSegment.x = lastSegment.x + Math.cos(angle) * length;
            newSegment.y = lastSegment.y + Math.sin(angle) * length;

            // Se c'è un solo segmento, aggiunge il nuovo; altrimenti, sostituisce l'ultimo (per aggiornare dinamicamente)
            if (segments.length < 2) {
                segments.push(newSegment);
            } else {
                segments[segments.length - 1] = newSegment;
            }
        } else {
            segments.push(newSegment);
        }
        draw();
    }
});

// Mouseup: termina il trascinamento o il disegno della traiettoria
canvas.addEventListener('mouseup', () => {
    draggedPlayer = null;
    if (isDrawing && !shiftPressed) {
        isDrawing = false;
    }
});

// Gestione del doppio tap per selezionare un giocatore
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX - canvas.offsetLeft;
    mouseY = touch.clientY - canvas.offsetTop;

    const tappedPlayer = players.find(player => isMouseOverPlayer(player, mouseX, mouseY));

    if (tappedPlayer) {
        const currentTime = new Date().getTime();
        if (currentTime - touchStartTime < 300) {
            // Doppio tap rilevato
            highlightPlayer(tappedPlayer);
            clearTimeout(touchTimeout); // Cancella il timeout del singolo tap
        } else {
            touchStartTime = currentTime;
        }
    }
});

// Gestione della pressione prolungata per spostare un giocatore
canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    mouseX = touch.clientX - canvas.offsetLeft;
    mouseY = touch.clientY - canvas.offsetTop;

    draggedPlayer = players.find(player => isMouseOverPlayer(player, mouseX, mouseY));

    if (draggedPlayer) {
        touchTimeout = setTimeout(() => {
            highlightPlayer(draggedPlayer); // Evidenzia il giocatore
        }, 500); // Pressione prolungata di 500ms
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (draggedPlayer) {
        const touch = e.touches[0];
        const newMouseX = touch.clientX - canvas.offsetLeft;
        const newMouseY = touch.clientY - canvas.offsetTop;

        const dx = newMouseX - mouseX;
        const dy = newMouseY - mouseY;

        const newX = draggedPlayer.x + dx;
        const newY = draggedPlayer.y + dy;

        if (newX >= moveArea.minX && newX <= moveArea.maxX &&
            newY >= moveArea.minY && newY <= moveArea.maxY) {
            draggedPlayer.x = newX;
            draggedPlayer.y = newY;

            routes.forEach(route => {
                if (route.playerId === draggedPlayer.id) {
                    route.segments.forEach(segment => {
                        segment.x += dx;
                        segment.y += dy;
                    });

                    if (route.footballIcon) {
                        route.footballIcon.x += dx;
                        route.footballIcon.y += dy;
                    }
                }
            });
            draw();
        }

        mouseX = newMouseX;
        mouseY = newMouseY;
    }
});

canvas.addEventListener('touchend', () => {
    clearTimeout(touchTimeout);
    draggedPlayer = null;
});

// ====================================================
// 6. GESTIONE DEGLI EVENTI TASTIERA
// ====================================================

// Tasti premuti
window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = true;
    } else if (e.key === 'Control') {
        ctrlPressed = true;
    }
});

// Tasti rilasciati
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = false;
    } else if (e.key === 'Control') {
        ctrlPressed = false;
    }
});

// ====================================================
// 7. GESTIONE DELLE AZIONI SUI GIOCATORI E LE ROTTE
// ====================================================

// Toggle del simbolo di fine traiettoria (arrow/dot)
document.getElementById('toggle-end-marker').addEventListener('click', () => {
    if (highlightedPlayer) {
        highlightedPlayer.endMarker = (highlightedPlayer.endMarker === 'arrow') ? 'dot' : 'arrow';
        draw(); // Ridisegna il canvas per aggiornare il simbolo
    }
});

// Pulsante per salvare lo schema: apre la modale di conferma
document.getElementById('save-play').addEventListener('click', () => {
    highlightedPlayer = null; // Rimuove l'evidenziazione
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'block';
});

// Pulsante per salvare lo schema a colori (o in bianco e nero se necessario)
document.getElementById('save-color').addEventListener('click', () => {
    savePlay(false); // Salva a colori
    closeModal();
});

// Chiusura della modale con pulsante "close"
document.querySelector('.close-button').addEventListener('click', closeModal);

// Chiusura della modale cliccando fuori di essa
window.addEventListener('click', (event) => {
    const modal = document.getElementById('confirmation-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Funzione per chiudere la modale
function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
}

// ====================================================
// 8. SALVATAGGIO DEL PLAYBOOK (IMMAGINE E JSON)
// ====================================================

// Funzione per salvare lo schema come immagine PNG
// Parametri per il box dei commenti
const commentBox = {
    x: 15,       // distanza dal bordo sinistro
    y: 10,       // distanza dal bordo superiore
    width: 700,  // larghezza massima del box
    height: 250, // altezza massima del box (aumentata per accogliere il testo più grande)
    padding: 10  // spazio interno per il testo
};

function drawCommentBox(comments) {
    if (comments !== "") {
        // Imposta il font per i commenti
        ctx.font = "50px Arial"; // Aggiornato a 40px
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";

        // Variabili per il wrapping del testo
        const words = comments.split(" ");
        let line = "";
        const lineHeight = 48; // Altezza della riga aggiornata per il font più grande
        let y = commentBox.y + commentBox.padding + lineHeight - 15; // Sposta il testo più in alto

        // Suddividi il testo in righe che non superino la larghezza del box (tenendo conto del padding)
        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + " ";
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;

            if (testWidth > (commentBox.width - commentBox.padding * 2) && i > 0) {
                ctx.fillText(line, commentBox.x + commentBox.padding, y);
                line = words[i] + " ";
                y += lineHeight;
                // Se si supera l'altezza del box, interrompi il wrapping
                if (y > commentBox.y + commentBox.height - commentBox.padding) {
                    break;
                }
            } else {
                line = testLine;
            }
        }
        // Disegna l'ultima riga (se spazio disponibile)
        if (y <= commentBox.y + commentBox.height - commentBox.padding) {
            ctx.fillText(line, commentBox.x + commentBox.padding, y);
        }
    }
}

  function savePlay(saveInBlackAndWhite) {
    // Ridisegna il campo, le traiettorie e i giocatori in modalità salvataggio
    drawField(true);   // Campo bianco per il salvataggio
    drawRoutes(false); // Traiettorie con i colori originali
    drawPlayers(true); // Giocatori in modalità salvataggio
  
    // Recupera il nome e i commenti inseriti
    let playName = document.getElementById('schema-name').value.trim() || "SN";
    const comments = document.getElementById('schema-comments').value.trim();
  
    // Disegna il nome dello schema in alto a destra
    ctx.font = "100px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "right";
    ctx.fillText(playName, canvas.width - 15, 80);
  
    // Disegna il box e i commenti al suo interno 
    drawCommentBox(comments);
  
    // Salva l'immagine
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${playName}.png`;
    link.click();
    
  
    // Ridisegna il canvas in modalità normale dopo il salvataggio
    
    draw();
    document.getElementById('schema-name').value = '';
    document.getElementById('schema-comments').value = '';
  }
  
  
// Salvataggio dello schema come file JSON
document.getElementById('download-json').addEventListener('click', () => {
    let playName = document.getElementById('schema-name').value.trim() || "SenzaNome";
    const playbookData = JSON.stringify({ players, routes }, null, 2);
    const blob = new Blob([playbookData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${playName}.json`;
    link.click();
    closeModal();

    document.getElementById('schema-name').value = '';
    document.getElementById('schema-comments').value = '';
    
});

// Caricamento di un file JSON per ripristinare lo schema
document.getElementById("upload-json-btn").addEventListener("click", function() {
    document.getElementById("upload-json").click();
});
document.getElementById('upload-json').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.players && data.routes) {
                players = data.players;
                routes = data.routes;
                draw();
            } else {
                alert("Formato JSON non valido!");
            }
        } catch (error) {
            alert("Errore nel parsing del JSON!");
            console.error(error);
        }
    };
    reader.readAsText(file);
});

// ====================================================
// 9. FUNZIONI DI DISEGNO DEL CAMPO, DEI GIOCATORI E DELLE ROTTE
// ====================================================

// Funzione per ridisegnare l'intero canvas
function draw() {
    drawField();
    drawRoutes();
    drawPlayers();
}

// Disegna il campo da gioco; se saveMode è true, usa colori adatti al salvataggio
function drawField(saveMode = false) {
    ctx.fillStyle = saveMode ? '#ffffff' : '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = saveMode ? '#000000' : '#ffffff';
    ctx.lineWidth = 2;
    // Disegna le linee orizzontali (ad esempio per dividere il campo)
    for (let i = 1; i <= 4; i++) {
        ctx.moveTo(0, (canvas.height / 5) * i);
        ctx.lineTo(canvas.width, (canvas.height / 5) * i);
        ctx.stroke();
    }
}

// Disegna i giocatori sul campo
function drawPlayers(saveMode = false) {
    players.forEach(player => {
        ctx.beginPath();
        // Aumenta il raggio del giocatore (da 15 a 20 ad esempio)
        const radius = 25;
        ctx.arc(player.x, player.y, radius, 0, Math.PI * 2, true);
        ctx.fillStyle = player.color;
        ctx.fill();
        
        // Disegna il bordo (con evidenza se il giocatore è selezionato)
        if (player === highlightedPlayer) {
            ctx.strokeStyle = saveMode ? player.color : '#FFFF00';
            ctx.lineWidth = 5;
        } else {
            ctx.strokeStyle = saveMode ? player.color : '#ffffff';
            ctx.lineWidth = 3;
        }
        ctx.stroke();
        ctx.closePath();

        // Disegna la lettera bianca al centro del giocatore
        ctx.font = "  30px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Usa la proprietà letter se disponibile, altrimenti l'id
        ctx.fillText(player.letter || player.id, player.x, player.y +2);
    });
}


// Disegna le traiettorie (rotte) dei giocatori
function drawRoutes(saveMode = false) {
    routes.forEach(route => {
        const segments = route.segments;
        if (segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);

            for (let i = 1; i < segments.length; i++) {
                const prev = segments[i - 1];
                const curr = segments[i];
                const next = segments[i + 1];

                ctx.strokeStyle = saveMode ? '#000000' : route.color;
                ctx.lineWidth = 8;

                if (next && areSegmentsClose(prev, curr, next)) {
                    // Calcola il punto di controllo per la curva smussata
                    const controlPoint = {
                        x: (curr.x + next.x) / 2,
                        y: (curr.y + next.y) / 2
                    };
                    ctx.quadraticCurveTo(curr.x, curr.y, controlPoint.x, controlPoint.y);
                } else {
                    ctx.lineTo(curr.x, curr.y);
                }
            }

            ctx.stroke();

            // Disegna il simbolo finale (freccia o dot)
            const player = players.find(p => p.id === route.playerId);
            if (player) {
                const color = saveMode ? '#000000' : route.color;
                if (player.endMarker === 'arrow') {
                    drawArrow(segments[segments.length - 2], segments[segments.length - 1], color);
                } else {
                    drawDot(segments[segments.length - 1], color);
                }
            }
        }

        // Disegna la palla se presente
        if (route.footballIcon) {
            drawFootballIcon(route.footballIcon.x, route.footballIcon.y, route.footballIcon.angle);
        }
    });
}

// ====================================================
// 10. FUNZIONI DI DISEGNO DI SIMBOLI
// ====================================================

// Disegna un pallino come simbolo di fine traiettoria
function drawDot(end, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

// Disegna una freccia come simbolo di fine traiettoria
function drawArrow(start, end, color) {
    // Usa un valore di lineWidth coerente con i tracciati più spessi, ad esempio 6
    const lineWidth = 8;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Calcola la lunghezza della punta in modo proporzionale (ad esempio 2.5 volte il lineWidth)
    const headLength = lineWidth * 2.5;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    // Disegna la linea principale della freccia
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Disegna i segmenti della punta della freccia
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// Funzione per disegnare un'icona di una palla da football
function drawFootballIcon(x, y, angle) {
    const footballRadius = 10; // Raggio della palla
    ctx.save(); // Salva lo stato del contesto
    ctx.translate(x, y); // Trasla il contesto alla posizione della palla
    ctx.rotate(angle); // Ruota il contesto in base all'angolo del tratto

    // Disegna la forma della palla
    ctx.fillStyle = "#964B00"; // Colore marrone per la palla
    ctx.beginPath();
    ctx.ellipse(0, 0, footballRadius * 1.5, footballRadius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // Disegna le cuciture centrali
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-footballRadius * 0.8, 0);
    ctx.lineTo(footballRadius * 0.8, 0);
    ctx.stroke();
    ctx.closePath();

    

    // Disegna le linee trasversali sulle cuciture centrali
    const stitchCount = 4; // Numero di linee trasversali
    const stitchSpacing = (footballRadius * 1.6) / (stitchCount + 1);
    for (let i = 1; i <= stitchCount; i++) {
        const stitchX = -footballRadius * 0.8 + i * stitchSpacing;
        ctx.beginPath();
        ctx.moveTo(stitchX, -footballRadius * 0.2);
        ctx.lineTo(stitchX, footballRadius * 0.2);
        ctx.stroke();
        ctx.closePath();
    }

    ctx.restore(); // Ripristina lo stato del contesto
}

// Aggiungi un'icona di una palla accanto all'ultimo tratto della traccia del giocatore selezionato
// Alterna l'icona della palla accanto all'ultimo tratto della traccia del giocatore selezionato
document.getElementById('add-football-icon').addEventListener('click', () => {
    if (highlightedPlayer) {
        const playerRoute = routes.find(route => route.playerId === highlightedPlayer.id);

        if (playerRoute) {
            // Se la palla è già presente, rimuovila
            if (playerRoute.footballIcon) {
                playerRoute.footballIcon = null; // Rimuovi la palla
                draw(); // Ridisegna il canvas
                return;
            }

            // Se la traiettoria ha almeno due segmenti, aggiungi la palla
            if (playerRoute.segments.length > 1) {
                const lastSegment = playerRoute.segments[playerRoute.segments.length - 1];
                const secondLastSegment = playerRoute.segments[playerRoute.segments.length - 2];

                // Calcola la direzione del tratto
                const dx = lastSegment.x - secondLastSegment.x;
                const dy = lastSegment.y - secondLastSegment.y;
                const angle = Math.atan2(dy, dx);

                // Posiziona la palla dietro la punta e parallela al tratto
                const offset = 37; // Distanza dalla punta
                const lateralOffset = -17; // Spostamento laterale (affianca la traiettoria)

                // Calcola la posizione della palla con offset laterale
                const footballX = lastSegment.x - Math.cos(angle) * offset + Math.sin(angle) * lateralOffset;
                const footballY = lastSegment.y - Math.sin(angle) * offset - Math.cos(angle) * lateralOffset;

                playerRoute.footballIcon = { x: footballX, y: footballY, angle }; // Salva posizione e angolo
                draw(); // Ridisegna il canvas
            } else {
                alert("Il giocatore selezionato non ha una traccia valida!");
            }
        } else {
            alert("Il giocatore selezionato non ha una traiettoria!");
        }
    } else {
        alert("Seleziona un giocatore per aggiungere o rimuovere la palla!");
    }
});


// ====================================================
// 11. GESTIONE DELLA RIPULIZIA DEL CANVAS E AZIONI DI ANNULLAMENTO
// ====================================================

// Pulsante per ripulire completamente il canvas e ripristinare i giocatori e le rotte iniziali
document.getElementById('clear-canvas').addEventListener('click', () => {
    players = [
        
            { x: 200, y: 640, initialX: 200, initialY: 640, color: '#FF8000', id: 1, letter: 'X', endMarker: 'arrow' }, // WR sinistra
            { x: 650, y: 640, initialX: 650, initialY: 640, color: '#AD1EAD', id: 2, letter: 'Z', endMarker: 'arrow' }, // WR2 destra
            { x: 500, y: 640, initialX: 500, initialY: 640, color: '#696161', id: 3, letter: 'C', endMarker: 'arrow' }, // Centro
            { x: 800, y: 640, initialX: 800, initialY: 640, color: '#14C19C', id: 4, letter: 'Y', endMarker: 'arrow' }, // WR destra
            { x: 500, y: 750, initialX: 500, initialY: 750, color: '#B50000', id: 5, letter: 'Q', endMarker: 'arrow' }   // QB
        
    ];
    routes = []; // Ripristina le rotte
    highlightedPlayer = null;
    isDrawing = false;
    currentRoute = null;
    mouseX = 0;
    mouseY = 0;
    draggedPlayer = null;
    geometricMode = true;
    shiftPressed = false;
    highlightedPlayer = null;
    ctrlPressed = false;
    playName = [];

    // Resetta il file input per il JSON
    const fileInput = document.getElementById('upload-json');
    fileInput.value = '';

    draw();
});

// Gestione dell'annullamento tramite CTRL + Z
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        if (highlightedPlayer) {
            const route = routes.find(route => route.playerId === highlightedPlayer.id);
            if (route) {
                if (route.segments.length > 1) {
                    // Rimuove l'ultimo segmento della traiettoria
                    route.segments.pop();

                    // Se rimane solo il punto iniziale, elimina la rotta
                    if (route.segments.length === 1) {
                        routes = routes.filter(r => r.playerId !== highlightedPlayer.id);
                    }

                    // Rimuovi la palla se presente
                    route.footballIcon = null;

                    draw();
                } else {
                    console.warn("La traiettoria è troppo corta per essere annullata!");
                }
            } else {
                console.warn("Nessuna traiettoria trovata per il giocatore selezionato!");
            }
        } else {
            console.warn("Seleziona un giocatore per annullare l'ultimo segmento della traiettoria.");
        }
    }
});

// Pulsante per annullare l'ultimo segmento della traiettoria del giocatore evidenziato
document.getElementById('undo-segment').addEventListener('click', () => {
    if (highlightedPlayer) {
        const playerRoute = routes.find(route => route.playerId === highlightedPlayer.id);
        if (playerRoute && playerRoute.segments.length > 1) {
            playerRoute.segments.pop();
            // Se rimane solo il punto iniziale, elimina la rotta
            if (playerRoute.segments.length === 1) {
                routes = routes.filter(route => route.playerId !== highlightedPlayer.id);
            }
            // Rimuovi la palla se presente
            playerRoute.footballIcon = null;
            draw();
        }
    }
});

// Pulsante per eliminare completamente la traiettoria del giocatore evidenziato
document.getElementById('delete-route').addEventListener('click', () => {
    if (highlightedPlayer) {
        routes = routes.filter(route => route.playerId !== highlightedPlayer.id);
        currentRoute = null;
        isDrawing = false;
        draw();
    }
    // Resetta il file input per il JSON
    const fileInput = document.getElementById('upload-json');
    fileInput.value = '';
});

// ====================================================
// 12. INIZIALIZZAZIONE
// ====================================================

// Disegna il canvas iniziale
draw();
