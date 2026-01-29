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
        // Show Firebase status
        const statusDiv = document.getElementById('firebaseStatus');
        if (statusDiv) {
            if (typeof firebaseInitialized !== 'undefined' && firebaseInitialized) {
                statusDiv.innerHTML = '🟢 Firebase conectado';
                statusDiv.style.backgroundColor = '#d4edda';
                statusDiv.style.color = '#155724';
            } else {
                statusDiv.innerHTML = '🟡 Modo sin conexión (localStorage)';
                statusDiv.style.backgroundColor = '#fff3cd';
                statusDiv.style.color = '#856404';
            }
        }
        
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
    if (!currentSeasonCard) return;
    
    if (!currentSeason) {
        currentSeasonCard.innerHTML = `
            <div class="no-season">
                <p>⚪ No hay temporada activa</p>
                <p class="hint">Crea una nueva temporada para comenzar</p>
            </div>
        `;
        if (saveSeasonSection) saveSeasonSection.style.display = 'none';
        if (resultSection) resultSection.style.display = 'none';
        return;
    }

    currentSeasonCard.innerHTML = `
        <div class="season-info">
            <h4>🏆 ${currentSeason.name}</h4>
            <p class="season-date">Creada: ${currentSeason.createdAt ? new Date(currentSeason.createdAt.seconds * 1000).toLocaleDateString() : 'Ahora'}</p>
            <span class="badge badge-success">Temporada Activa</span>
        </div>
    `;
    if (saveSeasonSection) saveSeasonSection.style.display = 'block';
    if (resultSection)  resultSection.style.display = 'block';
}

// Display all seasons
function displaySeasons() {
    if (!seasonsList) return;
    
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
    if (!participantsList) return;
    
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
    if (!artistsList) return;
    
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

    if (artists.length < participants.length) {
        alert('No hay suficientes artistas para todos los participantes');
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
    
    // Disable the button after draw
    performDrawBtn.disabled = true;
    performDrawBtn.innerHTML = '✓ Sorteo Realizado';
    performDrawBtn.style.opacity = '0.6';
    performDrawBtn.style.cursor = 'not-allowed';
    
    alert('¡Sorteo realizado exitosamente!');
});

// Display assignments
function displayAssignments() {
    console.log('displayAssignments called');
    console.log('drawResults:', drawResults);
    console.log('trackingList:', trackingList);
    console.log('assignments:', assignments);
    
    if (!drawResults) {
        console.log('drawResults no encontrado');
        return;
    }
    
    if (!currentSeason) {
        drawResults.innerHTML = '<p class="empty-message">Activa una temporada para ver asignaciones</p>';
        if (trackingList) trackingList.innerHTML = '<p class="empty-message">No hay asignaciones</p>';
        // Enable button
        if (performDrawBtn) {
            performDrawBtn.disabled = false;
            performDrawBtn.innerHTML = '🎲 Realizar Sorteo';
            performDrawBtn.style.opacity = '1';
            performDrawBtn.style.cursor = 'pointer';
        }
        return;
    }

    if (assignments.length === 0) {
        console.log('No hay asignaciones');
        drawResults.innerHTML = '<p class="empty-message">No hay asignaciones. Realiza el sorteo primero.</p>';
        if (trackingList) trackingList.innerHTML = '<p class="empty-message">No hay asignaciones</p>';
        // Enable button
        if (performDrawBtn) {
            performDrawBtn.disabled = false;
            performDrawBtn.innerHTML = '🎲 Realizar Sorteo';
            performDrawBtn.style.opacity = '1';
            performDrawBtn.style.cursor = 'pointer';
        }
        return;
    }

    console.log('Mostrando asignaciones...');
    
    // Disable button since there are assignments
    if (performDrawBtn) {
        performDrawBtn.disabled = true;
        performDrawBtn.innerHTML = '✓ Sorteo Realizado';
        performDrawBtn.style.opacity = '0.6';
        performDrawBtn.style.cursor = 'not-allowed';
    }

    // Show tracking section
    const trackingSection = document.getElementById('trackingSection');
    if (trackingSection) {
        trackingSection.style.display = 'block';
    }

    // Clear drawResults since we'll use trackingList only
    drawResults.innerHTML = '';

    if (trackingList) {
        trackingList.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">Asignaciones</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="resetDraw()" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem; background-color: #e74c3c;">
                        🔄 Nuevo Sorteo
                    </button>
                    <button onclick="copyAssignmentsForWhatsApp()" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem;">
                        📋 Copiar para WhatsApp
                    </button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${assignments.map((a, index) => `
                    <div style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); gap: 1rem;">
                        <span style="font-weight: bold; color: #6c5ce7; min-width: 2rem;">${index + 1}.</span>
                        <span style="font-weight: 600; color: #2d3436; flex: 1;">${a.participant}</span>
                        <span style="color: #6c5ce7; font-size: 1.2rem;">→</span>
                        <span style="color: #636e72; flex: 1;">${a.artist}</span>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; white-space: nowrap;">
                            <input type="checkbox" ${videoStatus[a.participant] ? 'checked' : ''} 
                                   onchange="toggleVideoStatus('${a.participant}')"
                                   style="cursor: pointer;">
                            <span style="font-size: 0.9rem; color: #636e72;">Video enviado</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Reset draw - allow new sorteo
async function resetDraw() {
    if (!confirm('¿Estás seguro de que quieres hacer un nuevo sorteo? Esto borrará las asignaciones actuales.')) {
        return;
    }
    
    assignments = [];
    videoStatus = {};
    
    // Enable the draw button
    if (performDrawBtn) {
        performDrawBtn.disabled = false;
        performDrawBtn.innerHTML = '🎲 Realizar Sorteo';
        performDrawBtn.style.opacity = '1';
        performDrawBtn.style.cursor = 'pointer';
    }
    
    displayAssignments();
    await saveCurrentSeasonData();
}

// Toggle video status
async function toggleVideoStatus(participant) {
    videoStatus[participant] = !videoStatus[participant];
    await saveCurrentSeasonData();
}

// Copy assignments for WhatsApp
function copyAssignmentsForWhatsApp() {
    if (!assignments || assignments.length === 0) {
        alert('No hay asignaciones para copiar');
        return;
    }

    const seasonName = currentSeason ? currentSeason.name : 'Sorteo';
    
    let message = `🎤 *${seasonName}* 🎤\n\n`;
    message += `✨ *Asignaciones:* ✨\n\n`;
    
    assignments.forEach((a, index) => {
        message += `${index + 1}. *${a.participant}* → ${a.artist}\n`;
    });
    
    message += `\n¡Mucha suerte a todos! 🌟`;

    // Try modern clipboard API first, fallback to textarea method
    const copyToClipboard = async (text) => {
        // Try modern API first
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.log('Clipboard API failed, using fallback');
            }
        }
        
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            textArea.remove();
            return true;
        } catch (err) {
            console.error('Fallback failed:', err);
            textArea.remove();
            return false;
        }
    };

    copyToClipboard(message).then(success => {
        if (success) {
            // Show success message
            const btn = event.target.closest('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ ¡Copiado!';
            btn.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        } else {
            // Show message in alert as last resort
            alert('No se pudo copiar automáticamente. Aquí está el mensaje:\n\n' + message);
        }
    });
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
    const maxAverage = Math.max(...sortedResults.map(r => parseFloat(r.average)));
    
    resultsDisplay.innerHTML = `
        <h3>Resultados de ${currentSeason.name}</h3>
        <p>Total de votantes: ${votes.length}</p>
        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 2rem;">
            ${sortedResults.map((r, i) => {
                const percentage = maxAverage > 0 ? (parseFloat(r.average) / maxAverage) * 100 : 0;
                const barColor = i === 0 ? '#f39c12' : i === 1 ? '#95a5a6' : i === 2 ? '#cd7f32' : '#6c5ce7';
                
                return `
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem; font-weight: bold; color: ${barColor}; min-width: 2rem;">${i + 1}</span>
                            <div>
                                <div style="font-weight: 600; font-size: 1.1rem; color: black;">${r.participant}</div>
                                <div style="font-size: 0.9rem; color: #636e72;">Canta: ${r.artist}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: ${barColor};">${r.average}</div>
                            <div style="font-size: 0.85rem; color: #636e72;">${r.voteCount} votos</div>
                        </div>
                    </div>
                    <div style="background: #ecf0f1; border-radius: 10px; height: 30px; overflow: hidden; position: relative;">
                        <div style="background: linear-gradient(90deg, ${barColor}, ${barColor}dd); height: 100%; width: ${percentage}%; border-radius: 10px; transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem;">
                            ${percentage > 20 ? `<span style="color: white; font-weight: 600; font-size: 0.9rem;">${r.average}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-left: 3rem; font-size: 0.85rem; color: #666;">
                        ${r.ratings.map(rating => `
                            <span style="background: #f8f9fa; padding: 0.25rem 0.75rem; border-radius: 20px; border: 1px solid #dee2e6;">
                                <strong>${rating.voter}:</strong> ${rating.rating} pts
                            </span>
                        `).join('')}
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
});
