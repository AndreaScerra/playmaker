const canvas = document.getElementById('playbook-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 800;


document.getElementById('goptp').addEventListener('click', () => {
    window.location.href = '../png-to-pdf/ptp.html';
});




const moveArea = {
    minX: 15, // Coordina X minima
    maxX: 985, // Coordina X massima
    minY: 640, // Coordina Y minima
    maxY: 785  // Coordina Y massima
};


let players = [
    { x: 200, y: 640, initialX: 200, initialY: 640, color: '#FF8000', id: 1, endMarker: 'arrow' }, //estrema sinistra
    { x: 650, y: 640, initialX: 650, initialY: 640, color: '#AD1EAD', id: 2, endMarker: 'arrow' }, //frazione sinistra  
    { x: 500, y: 640, initialX: 500, initialY: 640, color: '#696161', id: 3, endMarker: 'arrow' }, //centro 
    { x: 800, y: 640, initialX: 800, initialY: 640, color: '#14C19C', id: 4, endMarker: 'arrow' }, //destra
    { x: 500, y: 750, initialX: 500, initialY: 750, color: '#B50000', id: 5, endMarker: 'arrow' }  //QB
];


let routes = [];
let isDrawing = false;
let currentRoute = null;
let mouseX = 0;
let mouseY = 0;
let draggedPlayer = null;
let geometricMode = true;
let shiftPressed = false;
let highlightedPlayer = null;
let ctrlPressed = false;


function isMouseOverPlayer(player, mouseX, mouseY) {
    return Math.hypot(player.x - mouseX, player.y - mouseY) < 15;
}

canvas.addEventListener('mousedown', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;

    if (shiftPressed) {
        draggedPlayer = players.find(player => isMouseOverPlayer(player, mouseX, mouseY));
        if (draggedPlayer) {
            highlightPlayer(draggedPlayer);
        }
    } else {
        if (highlightedPlayer) {
            isDrawing = true;
            if (!currentRoute || currentRoute.playerId !== highlightedPlayer.id) {
                currentRoute = { playerId: highlightedPlayer.id, color: highlightedPlayer.color, segments: [{ x: highlightedPlayer.x, y: highlightedPlayer.y }] };
                routes.push(currentRoute);
            }
            currentRoute.segments.push({ x: mouseX, y: mouseY });
        }
    }
    draw();
});

document.getElementById('toggle-end-marker').addEventListener('click', () => {
    if (highlightedPlayer) {
        //highlightedPlayer.endMarker = highlightedPlayer.endMarker === 'arrow' ? 'dot' : 'arrow';
        highlightedPlayer.endMarker = (highlightedPlayer.endMarker === 'arrow') ? 'dot' : 'arrow';

        draw(); // Ridisegna il canvas per aggiornare il simbolo
    }
});



canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    

    if (draggedPlayer && shiftPressed) {
        // Spostamento giocatore
        const dx = mouseX - draggedPlayer.x;
        const dy = mouseY - draggedPlayer.y;

        const newX = draggedPlayer.x + dx;
        const newY = draggedPlayer.y + dy;

        if (newX >= moveArea.minX && newX <= moveArea.maxX && newY >= moveArea.minY && newY <= moveArea.maxY) {
            draggedPlayer.x = newX;
            draggedPlayer.y = newY;

            routes.forEach(route => {
                if (route.playerId === draggedPlayer.id) {
                    route.segments.forEach(segment => {
                        segment.x += dx;
                        segment.y += dy;
                    });
                }
            });
            draw();
        }
    }

    if (isDrawing && !shiftPressed && highlightedPlayer) {
        const segments = currentRoute.segments;
        const newSegment = { x: mouseX, y: mouseY, isDashed: ctrlPressed }; // Salva lo stato isDashed

        if (geometricMode) {
            const lastSegment = segments[segments.length - 1];
            const dx = mouseX - lastSegment.x;
            const dy = mouseY - lastSegment.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            newSegment.x = lastSegment.x + Math.cos(angle) * length;
            newSegment.y = lastSegment.y + Math.sin(angle) * length;

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




canvas.addEventListener('mouseup', () => {
    draggedPlayer = null;
    if (isDrawing && !shiftPressed) {
        isDrawing = false;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = true;
    } else if (e.key === 'Control') {
        ctrlPressed = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
        shiftPressed = false;
    } else if (e.key === 'Control') {
        ctrlPressed = false;
    }
});




document.getElementById('save-play').addEventListener('click', () => {
    // Apri la modale di conferma
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'block';
});

document.getElementById('save-black-white').addEventListener('click', () => {
    highlightedPlayer = null; // Rimuove l'evidenziazione
    savePlay(true); // Salva in bianco e nero
    closeModal();
});

document.getElementById('save-color').addEventListener('click', () => {
    highlightedPlayer = null; // Rimuove l'evidenziazione
    savePlay(false); // Salva a colori
    closeModal();
});

document.querySelector('.close-button').addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    const modal = document.getElementById('confirmation-modal');
    if (event.target === modal) {
        closeModal();
    }
});

function closeModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.style.display = 'none';
}

function savePlay(saveInBlackAndWhite) {
    drawField(saveInBlackAndWhite);
    drawRoutes(saveInBlackAndWhite);
    drawPlayers(saveInBlackAndWhite);

    const index = getCurrentIndex(); 
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `playbook_play ${index}.png`; 
    link.click();

    updateIndex(index + 1); 

   
    draw();
}

function draw() {
    drawField();
    drawRoutes();
    drawPlayers();
}

function drawField(saveMode = false) {
    ctx.fillStyle = saveMode ? '#ffffff' : '#1a1a1a'; // Bianco per il salvataggio, scuro per la visualizzazione normale
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = saveMode ? '#000000' : '#ffffff'; // Nero per il salvataggio, bianco per la visualizzazione normale
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
        ctx.moveTo(0, (canvas.height / 5) * i);
        ctx.lineTo(canvas.width, (canvas.height / 5) * i);
        ctx.stroke();
    }
}

function drawPlayers(saveMode = false) {
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 15, 0, Math.PI * 2, true);
        ctx.fillStyle = saveMode ? '#000000' : player.color; // Nero per il salvataggio, colore originale per la visualizzazione normale
        ctx.fill();
        if (player === highlightedPlayer) {
            ctx.strokeStyle = saveMode ? '#000000' : '#FFFF00'; // Nero per il salvataggio, giallo per la visualizzazione normale
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = saveMode ? '#000000' : '#ffffff'; // Nero per il salvataggio, bianco per la visualizzazione normale
            ctx.lineWidth = 2;
        }
        ctx.stroke();
        ctx.closePath();
    });
}

function drawRoutes(saveMode = false) {
    routes.forEach(route => {
        const segments = route.segments;
        if (segments.length > 1) {
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);

            for (let i = 1; i < segments.length; i++) {
                
                ctx.strokeStyle = saveMode ? '#000000' : route.color;
                ctx.lineWidth = 4;

                if (segments[i].isDashed) {
                    ctx.setLineDash([10, 15]); // Segmento tratteggiato
                } else {
                    ctx.setLineDash([]); // Segmento continuo
                }

                ctx.lineTo(segments[i].x, segments[i].y);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(segments[i].x, segments[i].y);
            }

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
    });
}






// Funzione per disegnare il pallino come simbolo di fine
function drawDot(end, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawArrow(start, end, color) {
    const headLength = 10; // Lunghezza dei segmenti della punta
    const dx = end.x - start.x; // Differenza di coordinate X
    const dy = end.y - start.y; // Differenza di coordinate Y
    const angle = Math.atan2(dy, dx); // Calcola l'angolo della freccia

    // Disegna la linea principale della freccia
    ctx.strokeStyle = color; // Colore della freccia
    ctx.lineWidth = 4; // Spessore della linea
    ctx.lineJoin = "round"; // Arrotonda gli angoli
    ctx.lineCap = "round"; // Arrotonda le estremità delle linee
    ctx.beginPath();
    ctx.moveTo(start.x, start.y); // Inizio della freccia
    ctx.lineTo(end.x, end.y); // Fine della freccia
    ctx.stroke(); // Disegna la linea

    // Disegna i segmenti della punta della freccia
    ctx.strokeStyle = color; // Colore della punta
    ctx.beginPath();
    ctx.moveTo(end.x, end.y); // Punto finale della freccia
    // Primo segmento della punta
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y); // Torna al punto finale
    // Secondo segmento della punta
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke(); // Disegna i segmenti della punta
}




function drawLineWithAngle(start, end, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4; 
    ctx.lineJoin = "round"; 
    ctx.lineCap = "round"; 
    ctx.beginPath();
    ctx.moveTo(start.x, start.y); 
    ctx.lineTo(end.x, end.y); 
    ctx.stroke(); 
}

function getCurrentIndex() {
    return parseInt(localStorage.getItem('playbookIndex')) || 1;
}

function updateIndex(index) {
    localStorage.setItem('playbookIndex', index);
}

function highlightPlayer(player) {
    highlightedPlayer = player;
    draw();
}

document.getElementById('clear-canvas').addEventListener('click', () => {
    players = [
        { x: 200, y: 640, color: '#FF8000', id: 1 },
        { x: 650, y: 640, color: '#AD1EAD', id: 2 },
        { x: 500, y: 640, color: '#696161', id: 3 },
        { x: 800, y: 640, color: '#14C19C', id: 4 },
        { x: 500, y: 750, color: '#B50000', id: 5 }
    ];
    routes = []; // Ripristina le rotte per ogni giocatore
    highlightedPlayer = null;
    draw();
});


document.getElementById('delete-route').addEventListener('click', () => {
    if (highlightedPlayer) {
        routes = routes.filter(route => route.playerId !== highlightedPlayer.id);
        currentRoute = null;
        isDashed = null;
        //routes = [];
        isDrawing = false;
        currentRoute = null;
        mouseX = 0;
        mouseY = 0;
        draggedPlayer = null;
        geometricMode = true;
        shiftPressed = false;
        highlightedPlayer = null;
        ctrlPressed = false;
        draw();
    }
});



draw();
