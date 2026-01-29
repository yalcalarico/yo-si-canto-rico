// State
let currentSeason = null;
let participants = [];
let artists = [];
let assignments = [];
let videoStatus = {};
let allSeasons = [];

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

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        seasonNameInput.value = '';
    }
});

seasonNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        createSeasonBtn.click();
    }
});

// Initialize
async function init() {
    try {
        await loadCurrentSeason();
        await loadAllSeasons();
        displayCurrentSeason();
        displaySeasons();
        displayParticipants();
        displayArtists();
        displayAssignments();
    } catch (error) {
        console.error('Error initializing:', error);
        alert('Error al cargar los datos');
    }
}

// Load current season from Firestore
async function loadCurrentSeason() {
    currentSeason = await getCurrentSeason();
    if (currentSeason) {
        participants = currentSeason.participants || [];
        artists = currentSeason.artists || [];
        assignments = currentSeason.assignments || [];
        videoStatus = currentSeason.videoStatus || {};
    } else {
        participants = [];
        artists = [];
        assignments = [];
        videoStatus = {};
    }
}

// Load all seasons
async function loadAllSeasons() {
    allSeasons = await getAllSeasons();
}

// Save current season to Firestore
async function saveCurrentSeasonData() {
    if (!currentSeason) return;
    
    try {
        const seasonData = {
            ...currentSeason,
            participants,
            artists,
            assignments,
            videoStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await saveSeason(seasonData);
        
        if (lastSavedDiv) {
            lastSavedDiv.textContent = `Guardado: ${new Date().toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error saving season:', error);
        alert('Error al guardar la temporada');
    }
}

// Create new season
createSeasonBtn.addEventListener('click', async () => {
    const seasonName = seasonNameInput.value.trim();
    if (!seasonName) {
        alert('Por favor ingresa un nombre para la temporada');
        return;
    }

    // Check if season name already exists
    const nameExists = allSeasons.some(s => s.name.toLowerCase() === seasonName.toLowerCase());
    if (nameExists) {
        alert('Ya existe una temporada con este nombre');
        return;
    }

    try {
        const newSeason = {
            name: seasonName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: false,
            participants: [],
            artists: [],
            assignments: [],
            videoStatus: {}
        };

        await saveSeason(newSeason);
        
        seasonNameInput.value = '';
        modal.classList.remove('show');
        
        await loadAllSeasons();
        displaySeasons();
        
        alert('Temporada creada exitosamente! Puedes activarla desde el sidebar cuando estés listo.');
    } catch (error) {
        console.error('Error creating season:', error);
        alert('Error al crear la temporada');
    }
});

// Activate season
async function activateSeason(seasonId) {
    if (!confirm('¿Estás seguro de activar esta temporada? La temporada actual será desactivada.')) {
        return;
    }

    try {
        const season = await getSeasonById(seasonId);
        if (!season) {
            alert('Error: No se pudo encontrar la temporada');
            return;
        }

        season.isActive = true;
        await saveSeason(season);
        
        await loadCurrentSeason();
        await loadAllSeasons();
        displayCurrentSeason();
        displaySeasons();
        displayParticipants();
        displayArtists();
        displayAssignments();
        
        alert(`Temporada "${season.name}" activada exitosamente`);
    } catch (error) {
        console.error('Error activating season:', error);
        alert('Error al activar la temporada');
    }
}

// Display current season
function displayCurrentSeason() {
    if (!currentSeason) {
        currentSeasonCard.innerHTML = `
            <div class="no-season">
                <p>No hay temporada activa</p>
                <p class="hint">Crea una nueva temporada para comenzar</p>
            </div>
        `;
        saveSeasonSection.style.display = 'none';
        return;
    }

    currentSeasonCard.innerHTML = `
        <div class="season-info">
            <h4>${currentSeason.name}</h4>
            <p class="season-date">Creada: ${currentSeason.createdAt ? new Date(currentSeason.createdAt.seconds * 1000).toLocaleDateString() : 'Ahora'}</p>
            <span class="badge badge-success">Activa</span>
        </div>
    `;
    saveSeasonSection.style.display = 'block';
}

// Display all seasons
function displaySeasons() {
    if (!allSeasons || allSeasons.length === 0) {
        seasonsList.innerHTML = '<p class="empty-message">No hay temporadas guardadas</p>';
        return;
    }

    const inactiveSeasons = allSeasons.filter(s => !s.isActive);
    
    if (inactiveSeasons.length === 0) {
        seasonsList.innerHTML = '<p class="empty-message">No hay temporadas inactivas</p>';
        return;
    }

    seasonsList.innerHTML = inactiveSeasons.map((season, index) => {
        const participants = season.participants || [];
        const date = season.createdAt ? new Date(season.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha desconocida';
        
        return `
            <div class="season-card">
                <div class="season-info">
                    <h4>${season.name}</h4>
                    <p class="season-date">${date}</p>
                    <p class="season-meta">${participants.length} participantes</p>
                </div>
                <div class="season-actions">
                    <button class="btn-icon" onclick="activateSeason('${season.id}')" title="Activar">
                        ▶️
                    </button>
                    <button class="btn-icon" onclick="viewSeasonDetails('${season.id}')" title="Ver detalles">
                        👁️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View season details
async function viewSeasonDetails(seasonId) {
    const season = await getSeasonById(seasonId);
    if (!season) {
        alert('Error al cargar la temporada');
        return;
    }

    const participants = season.participants || [];
    const artists = season.artists || [];
    const assignments = season.assignments || [];
    const votes = await getVotesBySeason(seasonId);

    let detailsHTML = `
        <h3>${season.name}</h3>
        <p><strong>Fecha:</strong> ${season.createdAt ? new Date(season.createdAt.seconds * 1000).toLocaleDateString() : 'Desconocida'}</p>
        <p><strong>Participantes:</strong> ${participants.length}</p>
        <p><strong>Artistas:</strong> ${artists.length}</p>
        <p><strong>Votos registrados:</strong> ${votes.length}</p>
    `;

    if (assignments.length > 0) {
        detailsHTML += '<h4>Asignaciones:</h4><ul>';
        assignments.forEach(a => {
            detailsHTML += `<li>${a.participant} → ${a.artist}</li>`;
        });
        detailsHTML += '</ul>';
    }

    alert(detailsHTML);
}

// Save season button
if (saveCurrentSeasonBtn) {
    saveCurrentSeasonBtn.addEventListener('click', saveCurrentSeasonData);
}

// Participants Management
addParticipantBtn.addEventListener('click', async () => {
    const name = participantNameInput.value.trim();
    if (!name) return;

    if (!currentSeason) {
        alert('Debes activar una temporada primero');
        return;
    }

    if (participants.includes(name)) {
        alert('Este participante ya existe');
        return;
    }

    participants.push(name);
    participantNameInput.value = '';
    displayParticipants();
    await saveCurrentSeasonData();
});

participantNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addParticipantBtn.click();
    }
});

function displayParticipants() {
    if (!currentSeason) {
        participantsList.innerHTML = '<li class="empty-message">Activa una temporada para agregar participantes</li>';
        return;
    }

    if (participants.length === 0) {
        participantsList.innerHTML = '<li class="empty-message">No hay participantes</li>';
        return;
    }

    participantsList.innerHTML = participants.map((p, i) => `
        <li>
            <span>${p}</span>
            <button class="btn-delete" onclick="removeParticipant(${i})">×</button>
        </li>
    `).join('');
}

async function removeParticipant(index) {
    if (!confirm('¿Eliminar este participante?')) return;
    participants.splice(index, 1);
    
    // Remove from assignments if exists
    assignments = assignments.filter(a => a.participantIndex !== index);
    
    displayParticipants();
    displayAssignments();
    await saveCurrentSeasonData();
}

// Artists Management
addArtistBtn.addEventListener('click', async () => {
    const name = artistNameInput.value.trim();
    if (!name) return;

    if (!currentSeason) {
        alert('Debes activar una temporada primero');
        return;
    }

    if (artists.includes(name)) {
        alert('Este artista ya existe');
        return;
    }

    artists.push(name);
    artistNameInput.value = '';
    displayArtists();
    await saveCurrentSeasonData();
});

artistNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addArtistBtn.click();
    }
});

function displayArtists() {
    if (!currentSeason) {
        artistsList.innerHTML = '<li class="empty-message">Activa una temporada para agregar artistas</li>';
        return;
    }

    if (artists.length === 0) {
        artistsList.innerHTML = '<li class="empty-message">No hay artistas</li>';
        return;
    }

    artistsList.innerHTML = artists.map((a, i) => `
        <li>
            <span>${a}</span>
            <button class="btn-delete" onclick="removeArtist(${i})">×</button>
        </li>
    `).join('');
}

async function removeArtist(index) {
    if (!confirm('¿Eliminar este artista?')) return;
    artists.splice(index, 1);
    displayArtists();
    await saveCurrentSeasonData();
}

// Draw/Raffle
performDrawBtn.addEventListener('click', async () => {
    if (!currentSeason) {
        alert('Debes activar una temporada primero');
        return;
    }

    if (participants.length === 0 || artists.length === 0) {
        alert('Necesitas al menos un participante y un artista');
        return;
    }

    if (participants.length !== artists.length) {
        alert('El número de participantes debe ser igual al número de artistas');
        return;
    }

    if (!confirm('¿Realizar sorteo? Esto sobrescribirá las asignaciones actuales.')) {
        return;
    }

    // Shuffle artists
    const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);
    
    assignments = participants.map((participant, index) => ({
        participant,
        artist: shuffledArtists[index],
        participantIndex: index
    }));

    // Initialize video status
    videoStatus = {};
    participants.forEach(p => {
        videoStatus[p] = false;
    });

    displayAssignments();
    await saveCurrentSeasonData();
    alert('¡Sorteo realizado exitosamente!');
});

// Display assignments
function displayAssignments() {
    if (!currentSeason) {
        drawResults.innerHTML = '<p class="empty-message">Activa una temporada para ver asignaciones</p>';
        trackingList.innerHTML = '<p class="empty-message">No hay asignaciones</p>';
        return;
    }

    if (assignments.length === 0) {
        drawResults.innerHTML = '<p class="empty-message">No hay asignaciones. Realiza el sorteo primero.</p>';
        trackingList.innerHTML = '<p class="empty-message">No hay asignaciones</p>';
        return;
    }

    drawResults.innerHTML = `
        <h3>Asignaciones</h3>
        <div class="assignments-grid">
            ${assignments.map(a => `
                <div class="assignment-card">
                    <div class="participant-name">${a.participant}</div>
                    <div class="arrow">→</div>
                    <div class="artist-name">${a.artist}</div>
                </div>
            `).join('')}
        </div>
    `;

    trackingList.innerHTML = assignments.map(a => `
        <div class="tracking-item">
            <div class="tracking-info">
                <span class="participant-name">${a.participant}</span>
                <span class="artist-name">${a.artist}</span>
            </div>
            <label class="checkbox-label">
                <input type="checkbox" ${videoStatus[a.participant] ? 'checked' : ''} 
                       onchange="toggleVideoStatus('${a.participant}')">
                <span>Video enviado</span>
            </label>
        </div>
    `).join('');
}

// Toggle video status
async function toggleVideoStatus(participant) {
    videoStatus[participant] = !videoStatus[participant];
    await saveCurrentSeasonData();
}

// Results
showResultsBtn.addEventListener('click', async () => {
    if (!currentSeason) {
        alert('Debes activar una temporada primero');
        return;
    }

    if (assignments.length === 0) {
        alert('No hay asignaciones para mostrar resultados');
        return;
    }

    const votes = await getVotesBySeason(currentSeason.id);
    
    if (votes.length === 0) {
        resultsDisplay.innerHTML = '<p class="empty-message">No hay votos registrados aún</p>';
        return;
    }

    // Calculate results
    const results = {};
    assignments.forEach(a => {
        results[a.participant] = {
            artist: a.artist,
            totalScore: 0,
            voteCount: 0,
            ratings: []
        };
    });

    votes.forEach(vote => {
        Object.entries(vote.ratings).forEach(([participant, rating]) => {
            if (results[participant]) {
                results[participant].totalScore += rating;
                results[participant].voteCount += 1;
                results[participant].ratings.push({ voter: vote.voterName, rating });
            }
        });
    });

    // Calculate averages and sort
    const sortedResults = Object.entries(results)
        .map(([participant, data]) => ({
            participant,
            artist: data.artist,
            average: data.voteCount > 0 ? (data.totalScore / data.voteCount).toFixed(2) : 0,
            totalScore: data.totalScore,
            voteCount: data.voteCount,
            ratings: data.ratings
        }))
        .sort((a, b) => b.average - a.average);

    // Display results
    resultsDisplay.innerHTML = `
        <h3>Resultados de ${currentSeason.name}</h3>
        <p>Total de votantes: ${votes.length}</p>
        <div class="results-table">
            ${sortedResults.map((r, i) => `
                <div class="result-row ${i === 0 ? 'winner' : ''}">
                    <div class="rank">${i + 1}</div>
                    <div class="result-info">
                        <div class="participant-name">${r.participant}</div>
                        <div class="artist-name">${r.artist}</div>
                    </div>
                    <div class="score">
                        <div class="average">${r.average}</div>
                        <div class="votes">${r.voteCount} votos</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
});

// Initialize on load
init();
