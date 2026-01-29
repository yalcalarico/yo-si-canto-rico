// Storage Keys
const STORAGE_KEYS = {
    CURRENT_SEASON: 'currentSeason',
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

// State
let currentVoter = null;
let assignments = [];
let videoStatus = {};
let userRatings = {};
let selectedSeasonName = null; // Track selected season for viewing

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

// Sidebar elements
const seasonsList = document.getElementById('seasonsList');
const votersList = document.getElementById('votersList');

// Initialize
function init() {
    const currentSeason = loadData(STORAGE_KEYS.CURRENT_SEASON);
    
    // Set selected season to current active season by default
    selectedSeasonName = currentSeason ? currentSeason.name : null;
    
    // Load and display seasons
    displaySeasons(currentSeason);
    
    // Load and display voters for selected season
    displayVoters(selectedSeasonName);
    
    if (!currentSeason) {
        loginSection.style.display = 'none';
        votingSection.style.display = 'none';
        noSeasonSection.style.display = 'block';
        return;
    }

    assignments = loadData(STORAGE_KEYS.ASSIGNMENTS) || [];
    videoStatus = loadData(STORAGE_KEYS.VIDEO_STATUS) || {};

    if (assignments.length === 0) {
        loginSection.style.display = 'none';
        votingSection.style.display = 'none';
        noSeasonSection.style.display = 'block';
        return;
    }

    // Check if user is already logged in (session)
    const sessionVoter = sessionStorage.getItem('currentVoter');
    if (sessionVoter) {
        currentVoter = sessionVoter;
        showVotingSection();
    }
}

// Login
loginBtn.addEventListener('click', () => {
    const name = voterNameInput.value.trim();
    
    if (!name) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    // Check if user has already voted
    const votes = loadData(STORAGE_KEYS.VOTES) || [];
    const hasVoted = votes.some(v => v.voterName.toLowerCase() === name.toLowerCase());

    if (hasVoted) {
        const confirmRevote = confirm('Ya has votado anteriormente. ¿Deseas actualizar tus votos?');
        if (!confirmRevote) return;
    }

    currentVoter = name;
    sessionStorage.setItem('currentVoter', currentVoter);
    showVotingSection();
});

voterNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    currentVoter = null;
    sessionStorage.removeItem('currentVoter');
    voterNameInput.value = '';
    loginSection.style.display = 'block';
    votingSection.style.display = 'none';
});

// Show Voting Section
function showVotingSection() {
    loginSection.style.display = 'none';
    votingSection.style.display = 'block';
    currentVoterName.textContent = currentVoter;
    
    // Load existing votes if user is updating
    loadUserVotes();
    displayVotingCards();
}

// Load existing user votes
function loadUserVotes() {
    const votes = loadData(STORAGE_KEYS.VOTES) || [];
    const userVote = votes.find(v => v.voterName.toLowerCase() === currentVoter.toLowerCase());
    
    if (userVote) {
        userRatings = {};
        userVote.ratings.forEach(r => {
            userRatings[r.participantId] = r.score;
        });
    } else {
        userRatings = {};
    }
}

// Display Voting Cards
function displayVotingCards() {
    participantsVotingList.innerHTML = assignments.map(a => {
        const hasVideo = videoStatus[a.participantId] || false;
        const currentRating = userRatings[a.participantId] || 0;
        
        return `
            <div class="voting-card">
                <div class="voting-card-header">
                    <div class="participant-info">
                        <h3>${a.participantName}</h3>
                        <p class="artist-name">Canta: ${a.artistName}</p>
                    </div>
                    <span class="video-status ${hasVideo ? 'sent' : 'pending'}">
                        ${hasVideo ? '✓ Video enviado' : '⏳ Pendiente'}
                    </span>
                </div>
                <div class="rating-section">
                    <label for="rating-${a.participantId}">Calificación:</label>
                    <input type="range" 
                           id="rating-${a.participantId}" 
                           class="rating-input" 
                           min="1" 
                           max="10" 
                           value="${currentRating}"
                           oninput="updateRating('${a.participantId}', this.value)">
                    <span class="rating-display" id="display-${a.participantId}">${currentRating}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Update Rating
function updateRating(participantId, value) {
    userRatings[participantId] = parseInt(value);
    document.getElementById(`display-${participantId}`).textContent = value;
}

// Submit Votes
submitVotesBtn.addEventListener('click', () => {
    // Check if all participants have been rated
    const allRated = assignments.every(a => userRatings[a.participantId] !== undefined);
    
    if (!allRated) {
        alert('Por favor califica a todos los participantes antes de enviar');
        return;
    }

    // Prepare vote data
    const voteData = {
        voterName: currentVoter,
        timestamp: new Date().toISOString(),
        ratings: assignments.map(a => ({
            participantId: a.participantId,
            participantName: a.participantName,
            score: userRatings[a.participantId]
        }))
    };

    // Load existing votes
    let votes = loadData(STORAGE_KEYS.VOTES) || [];
    
    // Remove previous vote from same user if exists
    votes = votes.filter(v => v.voterName.toLowerCase() !== currentVoter.toLowerCase());
    
    // Add new vote
    votes.push(voteData);
    
    // Save votes
    saveData(STORAGE_KEYS.VOTES, votes);
    
    // Update voters list for current selected season
    displayVoters(selectedSeasonName);
    
    alert('¡Gracias por votar! Tus calificaciones han sido guardadas.');
    
    // Logout after voting
    logoutBtn.click();
});

// Display Seasons in Sidebar
function displaySeasons(currentSeason) {
    const history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
    const allSeasons = [];
    console.log('Current Season:', currentSeason);
    // Add current season if exists
    if (currentSeason) {
        allSeasons.push({
            name: currentSeason.name,
            date: currentSeason.createdAt || new Date().toISOString(),
            isActive: true
        });
    }
    
    // Add historical seasons
    history.forEach(x => {
        console.log(x);
        // Skip seasons without name or with invalid data
        if (x.season && x.season.name && currentSeason.name !== x.season.name) {
            allSeasons.push({
                name: x.season.name,
                date: x.season.createdAt || x.season.savedAt || new Date().toISOString(),
                isActive: false
            });
        }
    });
    
    if (allSeasons.length === 0) {
        seasonsList.innerHTML = '<p class="voters-list-empty">No hay temporadas</p>';
        return;
    }
    
    // Sort by date (newest first)
    allSeasons.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Handle invalid dates
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB - dateA;
    });
    
    seasonsList.innerHTML = allSeasons.map(season => {
        const date = new Date(season.date);
        let formattedDate = 'Fecha no disponible';
        
        // Only format if valid date
        if (!isNaN(date.getTime())) {
            formattedDate = date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
        
        const isSelected = selectedSeasonName === season.name;
        
        return `
            <div class="season-list-item ${season.isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}" 
                 onclick="selectSeason('${season.name}', ${season.isActive})">
                <div class="season-name">
                    ${season.isActive ? '<span class="active-indicator"></span>' : ''}
                    ${season.name}
                </div>
                <div class="season-date">${formattedDate}</div>
            </div>
        `;
    }).join('');
}

// Display Voters in Sidebar
function displayVoters(seasonName) {
    if (!seasonName) {
        votersList.innerHTML = '<p class="voters-list-empty">Selecciona una temporada</p>';
        return;
    }
    
    const currentSeason = loadData(STORAGE_KEYS.CURRENT_SEASON);
    let seasonVotes = [];
    
    // If it's the active season, get from current votes
    if (currentSeason && currentSeason.name === seasonName) {
        seasonVotes = loadData(STORAGE_KEYS.VOTES) || [];
    } else {
        // Get from historical data
        const history = loadData(STORAGE_KEYS.SEASONS_HISTORY) || [];
        const historicalSeason = history.find(h => h.season && h.season.name === seasonName);
        if (historicalSeason && historicalSeason.votes) {
            seasonVotes = historicalSeason.votes;
        }
    }
    
    if (seasonVotes.length === 0) {
        votersList.innerHTML = '<p class="voters-list-empty">Aún no hay votos</p>';
        return;
    }
    
    // Sort voters alphabetically
    const sortedVotes = seasonVotes.sort((a, b) => 
        a.voterName.localeCompare(b.voterName)
    );
    
    votersList.innerHTML = sortedVotes.map(vote => `
        <div class="voter-item">
            <span class="voter-icon">✓</span>
            <span class="voter-name">${vote.voterName}</span>
        </div>
    `).join('');
}

// Select Season
function selectSeason(seasonName, isActive) {
    selectedSeasonName = seasonName;
    
    // Update seasons display to show selection
    const currentSeason = loadData(STORAGE_KEYS.CURRENT_SEASON);
    displaySeasons(currentSeason);
    
    // Update voters list for selected season
    displayVoters(seasonName);
    
    // Show/hide login section based on if season is active
    if (isActive) {
        loginSection.style.display = 'block';
        noSeasonSection.style.display = 'none';
    } else {
        loginSection.style.display = 'none';
        votingSection.style.display = 'none';
        noSeasonSection.style.display = 'none';
    }
    
    // If user is logged in and viewing active season, show voting
    const sessionVoter = sessionStorage.getItem('currentVoter');
    if (sessionVoter && isActive) {
        currentVoter = sessionVoter;
        showVotingSection();
    } else if (sessionVoter && !isActive) {
        // Logout if viewing inactive season
        sessionStorage.removeItem('currentVoter');
        currentVoter = null;
        votingSection.style.display = 'none';
    }
}

// Initialize on page load
init();
