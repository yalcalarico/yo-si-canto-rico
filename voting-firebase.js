// State
let currentVoter = null;
let assignments = [];
let videoStatus = {};
let userRatings = {};
let selectedSeason = null;
let allSeasons = [];

// DOM Elements
const loginSection = document.getElementById('loginSection');
const votingSection = document.getElementById('votingSection');
const noSeasonSection = document.getElementById('noSeasonSection');

const voterNameInput = document.getElementById('voterName');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const currentVoterName = document.getElementById('currentVoterName');

const participantsVotingList = document.getElementById('participantsVotingList');
const submitVotesBtn = document.getElementById('submitVotes');

const seasonsList = document.getElementById('seasonsList');
const votersList = document.getElementById('votersList');

// Initialize
async function init() {
    try {
        const currentSeason = await getCurrentSeason();
        
        if (currentSeason) {
            selectedSeason = currentSeason;
            assignments = currentSeason.assignments || [];
            videoStatus = currentSeason.videoStatus || {};
        }
        
        await loadAllSeasons();
        displaySeasonsList();
        checkLoginStatus();
    } catch (error) {
        console.error('Error initializing:', error);
    }
}

// Load all seasons
async function loadAllSeasons() {
    allSeasons = await getAllSeasons();
}

// Display seasons list
function displaySeasonsList() {
    if (!allSeasons || allSeasons.length === 0) {
        seasonsList.innerHTML = '<div class="empty-message">No hay temporadas disponibles</div>';
        return;
    }

    seasonsList.innerHTML = allSeasons.map(season => {
        const isActive = season.isActive;
        const isSelected = selectedSeason && selectedSeason.id === season.id;
        
        return `
            <div class="season-item ${isActive ? 'active-season' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectSeason('${season.id}')">
                <div class="season-name">${season.name}</div>
                ${isActive ? '<span class="badge badge-success">Activa</span>' : ''}
            </div>
        `;
    }).join('');
}

// Select a season to view/vote
async function selectSeason(seasonId) {
    try {
        selectedSeason = await getSeasonById(seasonId);
        if (!selectedSeason) {
            alert('Error al cargar la temporada');
            return;
        }

        assignments = selectedSeason.assignments || [];
        videoStatus = selectedSeason.videoStatus || {};
        
        displaySeasonsList();
        
        if (currentVoter) {
            await loadUserVotes();
            displayVotingSection();
        }
        
        await displayVotersList();
    } catch (error) {
        console.error('Error selecting season:', error);
        alert('Error al cargar la temporada');
    }
}

// Check login status
function checkLoginStatus() {
    const savedVoter = sessionStorage.getItem('currentVoter');
    
    if (savedVoter) {
        currentVoter = savedVoter;
        showVotingSection();
    } else {
        showLoginSection();
    }
}

// Login
loginBtn.addEventListener('click', async () => {
    const voterName = voterNameInput.value.trim();
    
    if (!voterName) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    currentVoter = voterName;
    sessionStorage.setItem('currentVoter', voterName);
    
    await loadUserVotes();
    showVotingSection();
});

voterNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
        currentVoter = null;
        userRatings = {};
        sessionStorage.removeItem('currentVoter');
        showLoginSection();
    }
});

// Show login section
function showLoginSection() {
    loginSection.style.display = 'block';
    votingSection.style.display = 'none';
    noSeasonSection.style.display = 'none';
}

// Show voting section
function showVotingSection() {
    if (!selectedSeason || !assignments || assignments.length === 0) {
        loginSection.style.display = 'none';
        votingSection.style.display = 'none';
        noSeasonSection.style.display = 'block';
        return;
    }

    loginSection.style.display = 'none';
    votingSection.style.display = 'block';
    noSeasonSection.style.display = 'none';
    
    currentVoterName.textContent = currentVoter;
    displayVotingSection();
    displayVotersList();
}

// Load user's existing votes
async function loadUserVotes() {
    if (!selectedSeason || !currentVoter) {
        userRatings = {};
        return;
    }

    try {
        const vote = await getVoteBySeasonAndVoter(selectedSeason.id, currentVoter);
        if (vote && vote.ratings) {
            userRatings = vote.ratings;
        } else {
            userRatings = {};
        }
    } catch (error) {
        console.error('Error loading votes:', error);
        userRatings = {};
    }
}

// Display voting section
function displayVotingSection() {
    if (!assignments || assignments.length === 0) {
        participantsVotingList.innerHTML = '<p class="empty-message">No hay participantes para votar</p>';
        submitVotesBtn.disabled = true;
        return;
    }

    participantsVotingList.innerHTML = assignments.map(assignment => {
        const hasVideo = videoStatus[assignment.participant];
        const currentRating = userRatings[assignment.participant] || 0;
        
        return `
            <div class="voting-card ${!hasVideo ? 'no-video' : ''}">
                <div class="voting-header">
                    <div>
                        <h3>${assignment.participant}</h3>
                        <p class="artist-name">Canta: ${assignment.artist}</p>
                    </div>
                    ${hasVideo ? 
                        '<span class="badge badge-success">✓ Video enviado</span>' : 
                        '<span class="badge badge-warning">⏳ Sin video</span>'
                    }
                </div>
                <div class="rating-section">
                    <label>Calificación (1-10):</label>
                    <div class="rating-controls">
                        <input type="range" min="1" max="10" value="${currentRating || 5}" 
                               class="rating-slider" 
                               id="rating-${assignment.participant}"
                               oninput="updateRating('${assignment.participant}', this.value)">
                        <span class="rating-value" id="value-${assignment.participant}">${currentRating || 5}</span>
                    </div>
                    <div class="rating-labels">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    submitVotesBtn.disabled = false;
}

// Update rating
function updateRating(participant, value) {
    userRatings[participant] = parseInt(value);
    const valueDisplay = document.getElementById(`value-${participant}`);
    if (valueDisplay) {
        valueDisplay.textContent = value;
    }
}

// Submit votes
submitVotesBtn.addEventListener('click', async () => {
    if (!selectedSeason) {
        alert('No hay una temporada seleccionada');
        return;
    }

    // Check if all participants have been rated
    const allRated = assignments.every(a => userRatings[a.participant] && userRatings[a.participant] > 0);
    
    if (!allRated) {
        if (!confirm('No has calificado a todos los participantes. ¿Deseas enviar los votos de todas formas?')) {
            return;
        }
    }

    try {
        const voteData = {
            seasonId: selectedSeason.id,
            seasonName: selectedSeason.name,
            voterName: currentVoter,
            ratings: userRatings,
            submittedAt: new Date().toISOString()
        };

        await saveVote(voteData);
        
        alert('¡Votos enviados exitosamente!');
        await displayVotersList();
    } catch (error) {
        console.error('Error saving votes:', error);
        alert('Error al guardar los votos. Por favor intenta de nuevo.');
    }
});

// Display voters list
async function displayVotersList() {
    if (!selectedSeason) {
        votersList.innerHTML = '<div class="empty-message">Selecciona una temporada</div>';
        return;
    }

    try {
        const votes = await getVotesBySeason(selectedSeason.id);
        
        if (!votes || votes.length === 0) {
            votersList.innerHTML = '<div class="empty-message">Aún no hay votos</div>';
            return;
        }

        votersList.innerHTML = `
            <h4>Votantes (${votes.length})</h4>
            <div class="voters-list">
                ${votes.map(vote => {
                    const isCurrentVoter = vote.voterName === currentVoter;
                    return `
                        <div class="voter-item ${isCurrentVoter ? 'current-voter' : ''}">
                            <span>${vote.voterName}</span>
                            ${isCurrentVoter ? '<span class="badge badge-info">Tú</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading voters:', error);
        votersList.innerHTML = '<div class="empty-message">Error al cargar votantes</div>';
    }
}

// Initialize on load
init();
