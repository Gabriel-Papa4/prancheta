document.addEventListener('DOMContentLoaded', () => {
    // --- SETUP INICIAL ---
    const fieldContainer = document.getElementById('field-container');
    const bench = document.getElementById('bench');
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');

    const isVertical = () => window.innerWidth <= 600 && window.innerHeight > window.innerWidth;

    function resizeCanvas() {
        const currentDrawing = canvas.toDataURL();
        canvas.width = fieldContainer.clientWidth;
        canvas.height = fieldContainer.clientHeight;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = currentDrawing;
    }
    window.addEventListener('resize', resizeCanvas);

    /**
     * NOVA LÓGICA: Salva e restaura a posição das peças ao girar a tela.
     */
    function preservePiecePositions() {
        const positions = [];
        fieldContainer.querySelectorAll('.player-piece, .red-piece').forEach(piece => {
            const logicalWidth = fieldContainer.clientWidth;
            const logicalHeight = fieldContainer.clientHeight;
            if (logicalWidth > 0 && logicalHeight > 0) {
                positions.push({
                    id: piece.id,
                    top: (piece.offsetTop / logicalHeight) * 100 + '%',
                    left: (piece.offsetLeft / logicalWidth) * 100 + '%'
                });
            }
        });
        return positions;
    }

    function restorePiecePositions(positions) {
        positions.forEach(pos => {
            const piece = document.getElementById(pos.id);
            if (piece) {
                fieldContainer.appendChild(piece);
                piece.style.position = 'absolute';
                piece.style.top = pos.top;
                piece.style.left = pos.left;
            }
        });
    }

    window.addEventListener('orientationchange', () => {
        const currentPositions = preservePiecePositions();
        setTimeout(() => {
            resizeCanvas();
            restorePiecePositions(currentPositions);
        }, 250); // Delay para garantir que o navegador redimensionou o layout
    });
    
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
        { top: '50%', left: '88%' }, { top: '30%', left: '80%' },
        { top: '70%', left: '80%' }, { top: '25%', left: '65%' },
        { top: '50%', left: '65%' }, { top: '75%', left: '65%' },
        { top: '50%', left: '55%' }
    ];

    const redTeamFormationVertical = [
        { top: '50%', left: '11%' },   { top: '30%', left: '20%' },
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
        const formation = isVertical() ? redTeamFormationVertical : redTeamFormationHorizontal;
        formation.forEach((pos, i) => {
            const piece = createPlayerPiece('red', `r${i}`);
            fieldContainer.appendChild(piece);
            setTimeout(() => {
                const pieceSize = piece.offsetWidth;
                piece.style.top = `calc(${pos.top} - ${pieceSize / 2}px)`;
                piece.style.left = `calc(${pos.left} - ${pieceSize / 2}px)`;
            }, 0);
        });
    }

    function createPlayerPiece(type, id, name, number) {
        const piece = document.createElement('div');
        piece.id = id;
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

    // --- LÓGICA DE COORDENADAS E ARRASTE ---
    let draggedPiece = null;
    let isDragging = false;
    function getEventCoordinates(e) { return e.touches ? e.touches[0] : e; }
    function getLogicalCoords(e) {
        const coords = getEventCoordinates(e);
        const rect = fieldContainer.getBoundingClientRect();
        const x_in_bbox = coords.clientX - rect.left;
        const y_in_bbox = coords.clientY - rect.top;
        if (isVertical()) {
            const logicalX = y_in_bbox;
            const logicalY = rect.width - x_in_bbox;
            return { x: logicalX, y: logicalY };
        }
        return { x: x_in_bbox, y: y_in_bbox };
    }
    function handleDragStart(e) { const target = e.target.closest('.player-piece, .red-piece'); if (!target || currentTool !== 'move') return; isDragging = true; draggedPiece = target; draggedPiece.style.zIndex = '1000'; draggedPiece.style.opacity = '0.7'; document.body.style.cursor = 'grabbing'; }
    function handleDragging(e) { if (!isDragging || !draggedPiece) return; e.preventDefault(); const coords = getEventCoordinates(e); draggedPiece.style.position = 'absolute'; draggedPiece.style.left = `${coords.clientX - (draggedPiece.offsetWidth / 2)}px`; draggedPiece.style.top = `${coords.clientY - (draggedPiece.offsetHeight / 2)}px`; }
    function handleDragEnd(e) {
        if (!isDragging || !draggedPiece) return;
        const fieldRect = fieldContainer.getBoundingClientRect();
        const coords = getEventCoordinates(e.changedTouches ? e.changedTouches[0] : e);
        draggedPiece.style.zIndex = '10';
        draggedPiece.style.opacity = '1';
        document.body.style.cursor = 'default';
        if (coords.clientX >= fieldRect.left && coords.clientX <= fieldRect.right && coords.clientY >= fieldRect.top && coords.clientY <= fieldRect.bottom) {
            fieldContainer.appendChild(draggedPiece);
            const pieceSize = draggedPiece.offsetWidth;
            const logicalPos = getLogicalCoords(e.changedTouches ? e.changedTouches[0] : e);
            let finalX = logicalPos.x - (pieceSize / 2);
            let finalY = logicalPos.y - (pieceSize / 2);
            const logicalWidth = fieldContainer.clientWidth;
            const logicalHeight = fieldContainer.clientHeight;
            finalX = Math.max(0, Math.min(finalX, logicalWidth - pieceSize));
            finalY = Math.max(0, Math.min(finalY, logicalHeight - pieceSize));
            draggedPiece.style.left = `${finalX}px`;
            draggedPiece.style.top = `${finalY}px`;
        } else {
            bench.appendChild(draggedPiece);
            draggedPiece.style.position = 'static';
            draggedPiece.style.left = '';
            draggedPiece.style.top = '';
        }
        isDragging = false;
        draggedPiece = null;
    }
    document.addEventListener('mousedown', handleDragStart);
    document.addEventListener('touchstart', handleDragStart, { passive: true });
    document.addEventListener('mousemove', handleDragging);
    document.addEventListener('touchmove', handleDragging, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    // --- FERRAMENTAS DE DESENHO ---
    let currentTool = 'move';
    let isDrawing = false;
    let startX, startY;
    let canvasSnapshot;
    function setTool(tool) { currentTool = tool; document.querySelectorAll('.controls button[id^="tool-"]').forEach(b => { b.classList.toggle('active', b.id === `tool-${tool}-btn`); }); canvas.style.pointerEvents = (tool === 'move') ? 'none' : 'auto'; }
    document.querySelectorAll('.controls button[id^="tool-"]').forEach(button => { button.addEventListener('click', () => { const toolName = button.id.replace('tool-', '').replace('-btn', ''); setTool(toolName); }); });
    function drawStart(e) { if (currentTool === 'move' || !e.target.closest('#drawing-canvas')) return; e.preventDefault(); isDrawing = true; const pos = getLogicalCoords(e); startX = pos.x; startY = pos.y; canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = (currentTool === 'eraser') ? 'destination-out' : 'source-over'; ctx.setLineDash((currentTool === 'dashed') ? [10, 10] : []); ctx.beginPath(); ctx.moveTo(startX, startY); }
    function drawing(e) { if (!isDrawing) return; e.preventDefault(); const pos = getLogicalCoords(e); if (currentTool === 'brush' || currentTool === 'dashed' || currentTool === 'eraser') { ctx.lineTo(pos.x, pos.y); ctx.stroke(); } else if (currentTool === 'line' || currentTool === 'arrow') { ctx.putImageData(canvasSnapshot, 0, 0); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); } }
    function drawEnd(e) { if (!isDrawing) return; const pos = getLogicalCoords(e); if (currentTool === 'line' || currentTool === 'arrow') { ctx.putImageData(canvasSnapshot, 0, 0); ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); if (currentTool === 'arrow') { drawArrowhead(ctx, startX, startY, pos.x, pos.y); } } isDrawing = false; ctx.setLineDash([]); }
    function drawArrowhead(context, fromx, fromy, tox, toy) { const headlen = 15; const angle = Math.atan2(toy - fromy, tox - fromx); context.beginPath(); context.moveTo(tox, toy); context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6)); context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6)); context.closePath(); context.fillStyle = ctx.strokeStyle; context.fill(); }
    canvas.addEventListener('mousedown', drawStart);
    canvas.addEventListener('touchstart', drawStart, { passive: false });
    canvas.addEventListener('mousemove', drawing);
    canvas.addEventListener('touchmove', drawing, { passive: false });
    canvas.addEventListener('mouseup', drawEnd);
    canvas.addEventListener('touchend', drawEnd);
    canvas.addEventListener('mouseleave', () => { if (isDrawing) drawEnd(); });
    
    // --- BOTÕES DE CONTROLE E JOGADAS SALVAS ---
    document.getElementById('clear-drawing-btn').addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });
    document.getElementById('reset-pieces-btn').addEventListener('click', () => { fieldContainer.querySelectorAll('.player-piece').forEach(p => p.remove()); initializeBlueTeamOnBench(); placeRedTeam(); });
    document.getElementById('export-btn').addEventListener('click', () => { setTool('move'); setTimeout(() => { html2canvas(document.getElementById('field-container'), { useCORS: true }).then(canvas => { const link = document.createElement('a'); link.download = 'jogada.png'; link.href = canvas.toDataURL('image/png'); link.click(); }); }, 100); });
    const saveBtn = document.getElementById('save-play-btn'), loadBtn = document.getElementById('load-play-btn'), deleteBtn = document.getElementById('delete-play-btn'), playsSelect = document.getElementById('saved-plays-select'), playNameInput = document.getElementById('play-name-input');
    function getGameState() { const piecesOnField = []; fieldContainer.querySelectorAll('.player-piece, .red-piece').forEach(p => { piecesOnField.push({ id: p.id, top: p.style.top, left: p.style.left }); }); return { pieces: piecesOnField, drawing: canvas.toDataURL() }; }
    function loadGameState(state) { document.getElementById('clear-drawing-btn').click(); fieldContainer.querySelectorAll('.player-piece, .red-piece').forEach(p => p.remove()); initializeBlueTeamOnBench(); state.pieces.forEach(pState => { let piece = bench.querySelector(`#${pState.id}`); if (piece) { fieldContainer.appendChild(piece); } else { piece = createPlayerPiece(pState.id.startsWith('r') ? 'red' : 'blue', pState.id); fieldContainer.appendChild(piece); } piece.style.position = 'absolute'; piece.style.top = pState.top; piece.style.left = pState.left; }); const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = state.drawing; }
    function updatePlaysDropdown() { playsSelect.innerHTML = ''; const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}'); for (const name in plays) { const option = document.createElement('option'); option.value = name; option.textContent = name; playsSelect.appendChild(option); } }
    saveBtn.addEventListener('click', () => { const playName = playNameInput.value.trim(); if (!playName) { alert('Por favor, insira um nome para a jogada.'); return; } const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}'); plays[playName] = getGameState(); localStorage.setItem('savedPlays', JSON.stringify(plays)); playNameInput.value = ''; updatePlaysDropdown(); alert(`Jogada "${playName}" guardada com sucesso!`); });
    loadBtn.addEventListener('click', () => { const playName = playsSelect.value; if (!playName) return; const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}'); if (plays[playName]) loadGameState(plays[playName]); });
    deleteBtn.addEventListener('click', () => { const playName = playsSelect.value; if (!playName) return; if (confirm(`Tem certeza que quer apagar a jogada "${playName}"?`)) { const plays = JSON.parse(localStorage.getItem('savedPlays') || '{}'); delete plays[playName]; localStorage.setItem('savedPlays', JSON.stringify(plays)); updatePlaysDropdown(); } });

    // --- INICIALIZAÇÃO GERAL ---
    function initializeApp() {
        resizeCanvas();
        initializeBlueTeamOnBench();
        placeRedTeam();
        setTool('move');
        updatePlaysDropdown();
    }
    initializeApp();
});
