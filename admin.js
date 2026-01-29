// Storage Keys
const STORAGE_KEYS = {
    CURRENT_SEASON: 'currentSeason',
    PARTICIPANTS: 'participants',
    ARTISTS: 'artists',
    ASSIGNMENTS: 'assignments',
    VIDEO_STATUS: 'videoStatus',
    VOTES: 'votes',
    SEASONS_HISTORY: 'seasonsHistory'
};

// Load data from localStorage
function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Save data to localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Initialize
let currentSeason = loadData(STORAGE_KEYS.CURRENT_SEASON) || null;
let participants = loadData(STORAGE_KEYS.PARTICIPANTS) || [];
let artists = loadData(STORAGE_KEYS.ARTISTS) || [];
let assignments = loadData(STORAGE_KEYS.ASSIGNMENTS) || [];
let videoStatus = loadData(STORAGE_KEYS.VIDEO_STATUS) || {};

// DOM Elements
const seasonNameInput = document.getElementById('seasonNameModal');
const createSeasonBtn = document.getElementById('createSeasonModal');
const currentSeasonCard = document.getElementById('currentSeasonCard');
const seasonsList = document.getElementById('seasonsList');
const saveCurrentSeasonBtn = document.getElementById('saveCurrentSeason');
const saveSeasonSection = document.getElementById('saveSeasonSection');
const lastSavedDiv = document.getElementById('lastSaved');

// Modal elements
const modal = document.getElementById('seasonModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModal');

// Modal functionality
openModalBtn.addEventListener('click', () => {
    modal.classList.add('show');
    seasonNameInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    seasonNameInput.value = '';
});

cancelModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
    seasonNameInput.value = '';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        seasonNameInput.value = '';
    }
});

// Handle Enter key in modal input
seasonNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createSeasonBtn.click();
    }
});

const participantNameInput = document.getElementById('participantName');
const addParticipantBtn = document.getElementById('addParticipant');
const participantsList = document.getElementById('participantsList');

const artistNameInput = document.getElementById('artistName');
const addArtistBtn = document.getElementById('addArtist');
const artistsList = document.getElementById('artistsList');

const performDrawBtn = document.getElementById('performDraw');
const drawResults = document.getElementById('drawResults');

const trackingList = document.getElementById('trackingList');

const showResultsBtn = document.getElementById('showResults');
const resultsDisplay = document.getElementById('resultsDisplay');

// Initialize UI
function init() {
    displayCurrentSeason();
    displaySeasons();
    displayParticipants();
    displayArtists();
    displayAssignments();
}

// Season Management
createSeasonBtn.addEventListener('click', () => {
    const seasonName = seasonNameInput.value.trim();
    if (!seasonName) {
        alert('Por favor ingresa un nombre para la temporada');
        return;
    }

    // Check if season name already exists
    const history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    const nameExists = history.some(s => s.season.name.toLowerCase() === seasonName.toLowerCase());
    if (currentSeason && currentSeason.name.toLowerCase() === seasonName.toLowerCase()) {
        alert('Ya existe una temporada con este nombre');
        return;
    }
    if (nameExists) {
        alert('Ya existe una temporada con este nombre');
        return;
    }

    // Create new season (inactive by default)
    const newSeason = {
        name: seasonName,
        createdAt: new Date().toISOString(),
        isActive: false
    };

    // Save to history as inactive season
    const seasonData = {
        season: newSeason,
        participants: [],
        artists: [],
        assignments: [],
        videoStatus: {},
        votes: [],
        archivedAt: new Date().toISOString()
    };

    let historyList = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    historyList.push(seasonData);
    saveData(STORAGE_KEYS.SEASONS_HISTORY, historyList);

    // Clear input
    seasonNameInput.value = '';
    
    // Update displays
    displaySeasons();
    displayParticipants();
    displayArtists();
    displayAssignments();
    
    // Close modal
    modal.classList.remove('show');
    
    alert('Temporada creada exitosamente! Puedes activarla desde el sidebar cuando estés listo.');
});

// Archive current season to history
function archiveCurrentSeason() {
    if (!currentSeason) return;
    
    // Save current state before archiving
    saveCurrentSeasonToHistory();
    
    // Mark as inactive
    let history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    const seasonIndex = history.findIndex(s => s.season.name === currentSeason.name);
    if (seasonIndex !== -1) {
        history[seasonIndex].season.isActive = false;
        saveData(STORAGE_KEYS.SEASONS_HISTORY, history);
    }
}

// Activate season from history
function activateSeason(index) {
    if (!confirm('¿Estás seguro de activar esta temporada? La temporada actual se archivará.')) {
        return;
    }

    let history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    
    // Get the season to activate
    const seasonToActivate = history[index];
    if (!seasonToActivate) {
        alert('Error: No se pudo encontrar la temporada');
        return;
    }
    
    // Archive current season if exists and it's different from the one we're activating
    if (currentSeason && currentSeason.name !== seasonToActivate.season.name) {
        // Save current state
        saveCurrentSeasonToHistory();
        history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    }
    
    // Mark ALL seasons as inactive first
    history.forEach(s => {
        s.season.isActive = false;
    });
    
    // Activate selected season
    currentSeason = {...seasonToActivate.season, isActive: true};
    participants = [...seasonToActivate.participants];
    artists = [...seasonToActivate.artists];
    assignments = [...seasonToActivate.assignments];
    videoStatus = {...seasonToActivate.videoStatus};
    
    // Update season status in history to active
    history[index].season.isActive = true;
    
    saveData(STORAGE_KEYS.CURRENT_SEASON, currentSeason);
    saveData(STORAGE_KEYS.PARTICIPANTS, participants);
    saveData(STORAGE_KEYS.ARTISTS, artists);
    saveData(STORAGE_KEYS.ASSIGNMENTS, assignments);
    saveData(STORAGE_KEYS.VIDEO_STATUS, videoStatus);
    saveData(STORAGE_KEYS.SEASONS_HISTORY, history);
    saveData(STORAGE_KEYS.VOTES, seasonToActivate.votes);

    init();
    alert('Temporada activada exitosamente!');
}

function displayCurrentSeason() {
    if (currentSeason) {
        currentSeasonCard.innerHTML = `
            <h4>🏆 ${currentSeason.name}</h4>
            <p>Temporada Activa</p>
        `;
        currentSeasonCard.className = 'current-season-card';
        
        // Show save button
        saveSeasonSection.style.display = 'block';
        resultSection.style.display = 'block';
        updateLastSavedTime();
    } else {
        currentSeasonCard.innerHTML = `
            <h4>⚪ Sin Temporada Activa</h4>
            <p>Selecciona una temporada para activar</p>
        `;
        currentSeasonCard.className = 'current-season-card no-active-season';
        
        // Hide save button
        saveSeasonSection.style.display = 'none';
        resultSection.style.display = 'none';
    }
}

// Save current season changes
saveCurrentSeasonBtn.addEventListener('click', () => {
    if (!currentSeason) {
        alert('No hay temporada activa para guardar');
        return;
    }

    saveCurrentSeasonToHistory();
    alert('✅ Temporada guardada exitosamente!');
});

function saveCurrentSeasonToHistory() {
    const votes = loadData(STORAGE_KEYS.VOTES) || [];
    
    // Update current season with last saved timestamp
    currentSeason.lastSaved = new Date().toISOString();
    saveData(STORAGE_KEYS.CURRENT_SEASON, currentSeason);
    
    let history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    
    // Find and update the season in history
    const seasonIndex = history.findIndex(s => s.season.name === currentSeason.name);
    
    const updatedSeasonData = {
        season: {...currentSeason},
        participants: [...participants],
        artists: [...artists],
        assignments: [...assignments],
        videoStatus: {...videoStatus},
        votes: votes,
        archivedAt: new Date().toISOString()
    };
    
    if (seasonIndex !== -1) {
        // Update existing season
        history[seasonIndex] = updatedSeasonData;
    } else {
        // Add new season (shouldn't happen normally)
        history.push(updatedSeasonData);
    }
    
    saveData(STORAGE_KEYS.SEASONS_HISTORY, history);
    displaySeasons();
    updateLastSavedTime();
}

function updateLastSavedTime() {
    if (currentSeason && currentSeason.lastSaved) {
        const date = new Date(currentSeason.lastSaved);
        lastSavedDiv.innerHTML = `Último guardado: ${date.toLocaleDateString('es-ES')} a las ${date.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`;
    } else {
        lastSavedDiv.innerHTML = '';
    }
}

// Participants Management
addParticipantBtn.addEventListener('click', () => {
    if (!currentSeason) {
        alert('Primero crea una temporada');
        return;
    }

    const name = participantNameInput.value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre');
        return;
    }

    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Este participante ya existe');
        return;
    }

    participants.push({
        id: Date.now().toString(),
        name: name
    });

    saveData(STORAGE_KEYS.PARTICIPANTS, participants);
    participantNameInput.value = '';
    displayParticipants();
});

function displayParticipants() {
    if (participants.length === 0) {
        participantsList.innerHTML = '<li class="list-empty">No hay participantes agregados</li>';
        return;
    }

    participantsList.innerHTML = participants.map(p => `
        <li>
            <span>${p.name}</span>
            <button class="btn btn-danger btn-small" onclick="removeParticipant('${p.id}')">X</button>
        </li>
    `).join('');
}

function removeParticipant(id) {
    if (!confirm('¿Estás seguro de eliminar este participante?')) return;
    
    participants = participants.filter(p => p.id !== id);
    saveData(STORAGE_KEYS.PARTICIPANTS, participants);
    displayParticipants();
}

// Artists Management
addArtistBtn.addEventListener('click', () => {
    if (!currentSeason) {
        alert('Primero crea una temporada');
        return;
    }

    const name = artistNameInput.value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre de artista');
        return;
    }

    if (artists.some(a => a.name.toLowerCase() === name.toLowerCase())) {
        alert('Este artista ya existe');
        return;
    }

    artists.push({
        id: Date.now().toString(),
        name: name
    });

    saveData(STORAGE_KEYS.ARTISTS, artists);
    artistNameInput.value = '';
    displayArtists();
});

function displayArtists() {
    if (artists.length === 0) {
        artistsList.innerHTML = '<li class="list-empty">No hay artistas agregados</li>';
        return;
    }

    artistsList.innerHTML = artists.map(a => `
        <li>
            <span>${a.name}</span>
            <button class="btn btn-danger btn-small" onclick="removeArtist('${a.id}')">X</button>
        </li>
    `).join('');
}

function removeArtist(id) {
    if (!confirm('¿Estás seguro de eliminar este artista?')) return;
    
    artists = artists.filter(a => a.id !== id);
    saveData(STORAGE_KEYS.ARTISTS, artists);
    displayArtists();
}

// Draw/Sorteo
performDrawBtn.addEventListener('click', () => {
    if (!currentSeason) {
        alert('Primero crea una temporada');
        return;
    }

    if (participants.length === 0) {
        alert('Agrega participantes primero');
        return;
    }

    if (artists.length === 0) {
        alert('Agrega artistas primero');
        return;
    }

    if (participants.length > artists.length) {
        alert('Necesitas al menos tantos artistas como participantes');
        return;
    }

    if (assignments.length > 0 && !confirm('¿Estás seguro de realizar un nuevo sorteo? Esto borrará las asignaciones actuales.')) {
        return;
    }

    // Shuffle artists
    const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
    
    assignments = participants.map((participant, index) => ({
        participantId: participant.id,
        participantName: participant.name,
        artistId: shuffledArtists[index].id,
        artistName: shuffledArtists[index].name
    }));

    // Initialize video status
    videoStatus = {};
    assignments.forEach(a => {
        videoStatus[a.participantId] = false;
    });

    saveData(STORAGE_KEYS.ASSIGNMENTS, assignments);
    saveData(STORAGE_KEYS.VIDEO_STATUS, videoStatus);
    
    displayAssignments();
    
    alert('¡Sorteo realizado exitosamente!');
});

function displayAssignments() {
    if (assignments.length === 0) {
        drawResults.innerHTML = '<p class="info-text">Aún no se ha realizado el sorteo</p>';
        return;
    }

    drawResults.innerHTML = `
        <h3 style="margin-bottom: 16px;">Asignaciones:</h3>
        ${assignments.map(a => `
            <div class="tracking-item ${videoStatus[a.participantId] ? 'video-sent' : ''}">
                <div class="tracking-info">
                    <span class="assignment-participant">👤 ${a.participantName}</span>
                    <span class="assignment-artist">🎤 ${a.artistName}</span>
                </div>
                <div class="checkbox-wrapper">
                    <label>
                        <input type="checkbox" 
                               ${videoStatus[a.participantId] ? 'checked' : ''} 
                               onchange="toggleVideoStatus('${a.participantId}')">
                        Video enviado
                    </label>
                </div>
            </div>
        `).join('')}
    `;
}

// Tracking
function displayTracking() {
    if (assignments.length === 0) {
        trackingList.innerHTML = '<p class="info-text">Realiza el sorteo primero</p>';
        return;
    }

    trackingList.innerHTML = assignments.map(a => `
        <div class="tracking-item ${videoStatus[a.participantId] ? 'video-sent' : ''}">
            <div class="tracking-info">
                <span class="tracking-participant">${a.participantName}</span>
                <span class="tracking-artist">Canta: ${a.artistName}</span>
            </div>
            <div class="checkbox-wrapper">
                <label>
                    <input type="checkbox" 
                           ${videoStatus[a.participantId] ? 'checked' : ''} 
                           onchange="toggleVideoStatus('${a.participantId}')">
                    Video enviado
                </label>
            </div>
        </div>
    `).join('');
}

function toggleVideoStatus(participantId) {
    videoStatus[participantId] = !videoStatus[participantId];
    saveData(STORAGE_KEYS.VIDEO_STATUS, videoStatus);
    displayAssignments();
}

// Results
showResultsBtn.addEventListener('click', () => {
    if (assignments.length === 0) {
        alert('Realiza el sorteo primero');
        return;
    }

    const votes = loadData(STORAGE_KEYS.VOTES) || [];
    
    if (votes.length === 0) {
        resultsDisplay.innerHTML = '<p class="info-text">Aún no hay votos registrados</p>';
        return;
    }

    // Calculate results
    const results = {};
    assignments.forEach(a => {
        results[a.participantId] = {
            name: a.participantName,
            artist: a.artistName,
            totalScore: 0,
            voteCount: 0,
            average: 0
        };
    });

    votes.forEach(vote => {
        vote.ratings.forEach(rating => {
            if (results[rating.participantId]) {
                results[rating.participantId].totalScore += rating.score;
                results[rating.participantId].voteCount += 1;
            }
        });
    });

    // Calculate averages and sort
    const sortedResults = Object.values(results)
        .map(r => ({
            ...r,
            average: r.voteCount > 0 ? (r.totalScore / r.voteCount).toFixed(2) : 0
        }))
        .sort((a, b) => b.average - a.average);

    // Display results
    resultsDisplay.innerHTML = `
        <h3 style="margin-bottom: 16px;">Resultados de la Votación</h3>
        <p class="info-text">Total de votantes: ${votes.length}</p>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Participante</th>
                    <th>Artista</th>
                    <th>Promedio</th>
                    <th>Votos</th>
                </tr>
            </thead>
            <tbody>
                ${sortedResults.map((r, index) => `
                    <tr>
                        <td>${index + 1}${index === 0 ? ' <span class="winner-badge">🏆 Ganador</span>' : ''}</td>
                        <td>${r.name}</td>
                        <td>${r.artist}</td>
                        <td><strong>${r.average}</strong></td>
                        <td>${r.voteCount}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
});

// Seasons Sidebar Management
function displaySeasons() {
    const history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    
    if (history.length === 0) {
        seasonsList.innerHTML = '<p class="info-text">No hay temporadas creadas</p>';
        return;
    }

    seasonsList.innerHTML = history.map((seasonData, index) => {
        const votes = seasonData.votes || [];
        const isActive = seasonData.season.isActive || false;
        
        return `
            <div class="season-item">
                <div class="season-item-header">
                    <div>
                        <h4>${seasonData.season.name}</h4>
                        <p class="season-date">${new Date(seasonData.season.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                    <span class="season-status ${isActive ? 'active' : 'inactive'}">
                        ${isActive ? '✓ Activa' : '⚪ Inactiva'}
                    </span>
                </div>
                
                <div class="season-stats">
                    <div class="stat-item">
                        <div class="stat-number">${seasonData.participants.length}</div>
                        <div class="stat-label">Participantes</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${votes.length}</div>
                        <div class="stat-label">Votos</div>
                    </div>
                </div>
                
                <div class="season-actions">
                    ${!isActive ? `<button class="btn btn-success btn-small" onclick="activateSeason(${index})">Activar</button>` : ''}
                    <button class="btn btn-secondary btn-small" onclick="toggleSeasonDetails(${index})">Detalles</button>
                </div>
                
                <div id="season-details-${index}" class="season-details">
                    ${seasonData.assignments.length > 0 ? `
                        <h5>Asignaciones:</h5>
                        <div style="font-size: 0.85rem; margin-bottom: 12px;">
                            ${seasonData.assignments.map(a => `
                                <div style="margin-bottom: 4px;">
                                    <strong>${a.participantName}</strong> → ${a.artistName}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="font-size: 0.85rem; color: var(--text-secondary);">No se realizó el sorteo</p>'}
                    
                    ${votes.length > 0 ? `
                        <h5>Resultados:</h5>
                        <div style="font-size: 0.85rem;">
                            ${calculateSeasonResults(seasonData).slice(0, 3).map((r, idx) => `
                                <div style="margin-bottom: 4px;">
                                    ${idx + 1}. <strong>${r.name}</strong> (${r.average})
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="btn btn-danger btn-small" onclick="deleteSeasonHistory(${index})">Eliminar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleSeasonDetails(index) {
    const details = document.getElementById(`season-details-${index}`);
    details.classList.toggle('expanded');
}

function deleteSeasonHistory(index) {
    if (!confirm('¿Estás seguro de eliminar esta temporada?')) return;
    
    let history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    history.splice(index, 1);
    saveData(STORAGE_KEYS.SEASONS_HISTORY, history);
    displaySeasons();
}

function calculateSeasonResults(seasonData) {
    const results = {};
    seasonData.assignments.forEach(a => {
        results[a.participantId] = {
            name: a.participantName,
            artist: a.artistName,
            totalScore: 0,
            voteCount: 0,
            average: 0
        };
    });

    seasonData.votes.forEach(vote => {
        vote.ratings.forEach(rating => {
            if (results[rating.participantId]) {
                results[rating.participantId].totalScore += rating.score;
                results[rating.participantId].voteCount += 1;
            }
        });
    });

    return Object.values(results)
        .map(r => ({
            ...r,
            average: r.voteCount > 0 ? (r.totalScore / r.voteCount).toFixed(2) : 0
        }))
        .sort((a, b) => b.average - a.average);
}

// Initialize on page load
init();
