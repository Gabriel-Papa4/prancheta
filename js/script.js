document.addEventListener('DOMContentLoaded', () => {
    // --- SETUP INICIAL ---
    const fieldContainer = document.getElementById('field-container');
    const bench = document.getElementById('bench');
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const currentDrawing = canvas.toDataURL();
        canvas.width = fieldContainer.clientWidth;
        canvas.height = fieldContainer.clientHeight;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = currentDrawing;
    }
    window.addEventListener('resize', resizeCanvas);
    
    // --- DADOS E FORMAÇÕES ---
    const blueTeamPlayers = [
        { id: 'p0', number: '0', name: 'Felipe' }, { id: 'p1', number: '1', name: 'Léo' },
        { id: 'p2', number: '3', name: 'Papa' }, { id: 'p3', number: '4', name: 'Miguel' },
        { id: 'p4', number: '5', name: 'Edson' }, { id: 'p5', number: '6', name: 'Armando' },
        { id: 'p6', number: '7', name: 'Gabriel' }, { id: 'p7', number: '8', name: 'Azzi' },
        { id: 'p8', number: '9', name: 'Diego' }, { id: 'p9', number: '10', name: 'Loureiro' },
        { id: 'p10', number: '11', name: 'Bernardo' }, { id: 'p11', number: '11', name: 'Fábio' },
        { id: 'p12', number: '12', name: 'Breno' }, { id: 'p13', number: '14', name: 'Menezes' },
        { id: 'p14', number: '15', name: 'Midão' }, { id: 'p15', number: '16', name: 'Luiz' },
        { id: 'p16', number: '17', name: 'Cauã' }, { id: 'p17', number: '19', name: 'Guilherme' },
        { id: 'p18', number: '22', name: 'PH' }, { id: 'p19', number: '22', name: 'Enzo' },
        { id: 'p20', number: '45', name: 'Rempto' }, { id: 'p21', number: '99', name: 'Breedveld' }
    ];

    const redTeamFormationHorizontal = [
        { top: '50%', left: '95%' }, { top: '30%', left: '80%' },
        { top: '70%', left: '80%' }, { top: '25%', left: '65%' },
        { top: '50%', left: '65%' }, { top: '75%', left: '65%' },
        { top: '50%', left: '55%' }
    ];

    const redTeamFormationVertical = [
        { top: '50%', left: '5%' },   { top: '30%', left: '20%' },
        { top: '70%', left: '20%' },  { top: '25%', left: '35%' },
        { top: '50%', left: '35%' },  { top: '75%', left: '35%' },
        { top: '50%', left: '45%' }
    ];

    // --- CRIAÇÃO DAS PEÇAS ---
    function initializeBlueTeamOnBench() {
        bench.innerHTML = ''; 
        blueTeamPlayers.forEach(player => {
            const piece = createPlayerPiece('blue', player.id, player.name, player.number);
            bench.appendChild(piece);
        });
    }
    
    function placeRedTeam() {
        fieldContainer.querySelectorAll('.red-piece').forEach(p => p.remove());
        const isVertical = window.innerWidth <= 600 && window.innerHeight > window.innerWidth;
        const formation = isVertical ? redTeamFormationVertical : redTeamFormationHorizontal;

        formation.forEach((pos, i) => {
            const piece = createPlayerPiece('red', `r${i}`);
            fieldContainer.appendChild(piece);
            const pieceSize = piece.offsetWidth;
            piece.style.top = `calc(${pos.top} - ${pieceSize / 2}px)`;
            piece.style.left = `calc(${pos.left} - ${pieceSize / 2}px)`;
        });
    }

    function createPlayerPiece(type, id, name, number) {
        const piece = document.createElement('div');
        piece.id = id;
        piece.draggable = true;
        piece.classList.add(type === 'blue' ? 'player-piece' : 'red-piece');
        if (type === 'blue') {
            const playerName = document.createElement('span');
            playerName.classList.add('player-name');
            playerName.textContent = name;
            const playerNumber = document.createElement('span');
            playerNumber.classList.add('player-number');
            playerNumber.textContent = number;
            piece.appendChild(playerName);
            piece.appendChild(playerNumber);
        }
        return piece;
    }

    // --- LÓGICA DE ARRASTAR E SOLTAR ---
    let draggedPiece = null;
    function addDragListeners() {
        document.body.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('player-piece') || e.target.classList.contains('red-piece')) {
                draggedPiece = e.target;
                setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
            }
        });
        document.body.addEventListener('dragend', (e) => {
            if (draggedPiece) {
                draggedPiece.style.opacity = '1';
                draggedPiece = null;
            }
        });
    }
    fieldContainer.addEventListener('dragover', (e) => e.preventDefault());
    fieldContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedPiece) {
            fieldContainer.appendChild(draggedPiece);
            const rect = fieldContainer.getBoundingClientRect();
            const pieceSize = draggedPiece.offsetWidth;
            let x = e.clientX - rect.left - (pieceSize / 2);
            let y = e.clientY - rect.top - (pieceSize / 2);
            x = Math.max(0, Math.min(x, fieldContainer.clientWidth - pieceSize));
            y = Math.max(0, Math.min(y, fieldContainer.clientHeight - pieceSize));
            draggedPiece.style.left = `${x}px`;
            draggedPiece.style.top = `${y}px`;
        }
    });

    // --- FERRAMENTAS DE DESENHO (LÓGICA CORRIGIDA) ---
    let currentTool = 'move';
    let isDrawing = false;
    let startX, startY;
    let canvasSnapshot;

    function setTool(tool) {
        currentTool = tool;
        document.querySelectorAll('.controls button[id^="tool-"]').forEach(b => {
            b.classList.toggle('active', b.id === `tool-${tool}-btn`);
        });
        canvas.style.pointerEvents = (tool === 'move') ? 'none' : 'auto';
    }

    // **CORREÇÃO APLICADA AQUI**
    document.querySelectorAll('.controls button[id^="tool-"]').forEach(button => {
        button.addEventListener('click', () => {
            // Extrai o nome correto da ferramenta do ID do botão
            const toolName = button.id.replace('tool-', '').replace('-btn', '');
            setTool(toolName);
        });
    });

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
    }
    
    function applyToolStyles() {
        ctx.globalCompositeOperation = (currentTool === 'eraser') ? 'destination-out' : 'source-over';
        ctx.setLineDash((currentTool === 'dashed') ? [10, 10] : []);
    }

    canvas.addEventListener('mousedown', (e) => {
        if (currentTool === 'move') return;
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        
        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        applyToolStyles();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        if (currentTool === 'brush' || currentTool === 'dashed' || currentTool === 'eraser') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (currentTool === 'line' || currentTool === 'arrow') {
            ctx.putImageData(canvasSnapshot, 0, 0);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        const pos = getMousePos(e);
        
        if (currentTool === 'line' || currentTool === 'arrow') {
            ctx.putImageData(canvasSnapshot, 0, 0);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            if (currentTool === 'arrow') {
                drawArrowhead(ctx, startX, startY, pos.x, pos.y);
            }
        }
        ctx.setLineDash([]);
    });

    function drawArrowhead(context, fromx, fromy, tox, toy) {
        const headlen = 15;
        const angle = Math.atan2(toy - fromy, tox - fromx);
        context.beginPath();
        context.moveTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        context.closePath();
        context.fillStyle = ctx.strokeStyle;
        context.fill();
    }
    
    document.getElementById('clear-drawing-btn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // **CORREÇÃO APLICADA AQUI**
    document.getElementById('reset-pieces-btn').addEventListener('click', () => {
        // Remove as peças azuis do campo antes de reiniciar o banco
        fieldContainer.querySelectorAll('.player-piece').forEach(p => p.remove());
        initializeBlueTeamOnBench();
        placeRedTeam();
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        setTool('move');
        setTimeout(() => {
            html2canvas(document.getElementById('field-container'), { useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'jogada.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }, 100);
    });

    // --- SALVAR E CARREGAR JOGADAS ---
    const saveBtn = document.getElementById('save-play-btn');
    const loadBtn = document.getElementById('load-play-btn');
    const deleteBtn = document.getElementById('delete-play-btn');
    const playsSelect = document.getElementById('saved-plays-select');
    const playNameInput = document.getElementById('play-name-input');

    function getGameState() {
        const piecesOnField = [];
        fieldContainer.querySelectorAll('.player-piece, .red-piece').forEach(p => {
            piecesOnField.push({ id: p.id, top: p.style.top, left: p.style.left });
        });
        return { pieces: piecesOnField, drawing: canvas.toDataURL() };
    }

    function loadGameState(state) {
        document.getElementById('clear-drawing-btn').click();
        fieldContainer.querySelectorAll('.player-piece, .red-piece').forEach(p => p.remove());
        initializeBlueTeamOnBench();

        state.pieces.forEach(pState => {
            const piece = document.getElementById(pState.id) || createPlayerPiece(pState.id.startsWith('r') ? 'red' : 'blue', pState.id);
            if (piece) {
                fieldContainer.appendChild(piece);
                piece.style.top = pState.top;
                piece.style.left = pState.left;
            }
        });
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = state.drawing;
    }

    function updatePlaysDropdown() {
        playsSelect.innerHTML = '';
        const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}');
        for (const name in plays) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            playsSelect.appendChild(option);
        }
    }

    saveBtn.addEventListener('click', () => {
        const playName = playNameInput.value.trim();
        if (!playName) { alert('Por favor, insira um nome para a jogada.'); return; }
        const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}');
        plays[playName] = getGameState();
        localStorage.setItem('savedPlays', JSON.stringify(plays));
        playNameInput.value = '';
        updatePlaysDropdown();
        alert(`Jogada "${playName}" guardada com sucesso!`);
    });

    loadBtn.addEventListener('click', () => {
        const playName = playsSelect.value;
        if (!playName) return;
        const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}');
        if (plays[playName]) loadGameState(plays[playName]);
    });

    deleteBtn.addEventListener('click', () => {
        const playName = playsSelect.value;
        if (!playName) return;
        if (confirm(`Tem certeza que quer apagar a jogada "${playName}"?`)) {
            const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}');
            delete plays[playName];
            localStorage.setItem('savedPlays', JSON.stringify(plays));
            updatePlaysDropdown();
        }
    });

    // --- INICIALIZAÇÃO GERAL ---
    function initializeApp() {
        resizeCanvas();
        initializeBlueTeamOnBench();
        placeRedTeam();
        addDragListeners();
        setTool('move');
        updatePlaysDropdown();
    }
    initializeApp();
});