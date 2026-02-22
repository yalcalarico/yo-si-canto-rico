// State
let currentVoter = null;
let assignments = [];
let videoStatus = {};
let userVote = null; // El participante que el usuario eligió como ganador
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
        
        const currentSeason = await getCurrentSeason();
        
        if (currentSeason) {
            selectedSeason = currentSeason;
            assignments = currentSeason.assignments || [];
            videoStatus = currentSeason.videoStatus || {};
        }
        
        await loadAllSeasons();
        displaySeasonsList();
        await displayVotersList();
        await displayResults();
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
    if (!seasonsList) return;
    
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
        await displayResults();
    } catch (error) {
        console.error('Error selecting season:', error);
        alert('Error al cargar la temporada');
    }
}

// Check login status
async function checkLoginStatus() {
    const savedVoter = sessionStorage.getItem('currentVoter');
    
    if (savedVoter) {
        currentVoter = savedVoter;
        await loadUserVotes();
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
    currentVoter = null;
    userVote = null;
    sessionStorage.removeItem('currentVoter');
    showLoginSection();
});

// Show login section
function showLoginSection() {
    if (loginSection) loginSection.style.display = 'block';
    if (votingSection) votingSection.style.display = 'none';
    if (noSeasonSection) noSeasonSection.style.display = 'none';
    displayResults();
}

// Show voting section
function showVotingSection() {
    if (!selectedSeason || !assignments || assignments.length === 0) {
        if (loginSection) loginSection.style.display = 'none';
        if (votingSection) votingSection.style.display = 'none';
        if (noSeasonSection) noSeasonSection.style.display = 'block';
        return;
    }

    if (loginSection) loginSection.style.display = 'none';
    if (votingSection) votingSection.style.display = 'block';
    if (noSeasonSection) noSeasonSection.style.display = 'none';
    
    if (currentVoterName) currentVoterName.textContent = currentVoter;
    displayVotingSection();
    displayVotersList();
    displayResults();
}

// Load user's existing vote
async function loadUserVotes() {
    if (!selectedSeason || !currentVoter) {
        userVote = null;
        return;
    }

    try {
        const vote = await getVoteBySeasonAndVoter(selectedSeason.id, currentVoter);
        if (vote && vote.winner) {
            userVote = vote.winner;
        } else {
            userVote = null;
        }
    } catch (error) {
        console.error('Error loading votes:', error);
        userVote = null;
    }
}

// Display voting section
function displayVotingSection() {
    if (!participantsVotingList || !submitVotesBtn) return;
    
    if (!assignments || assignments.length === 0) {
        participantsVotingList.innerHTML = '<p class="empty-message">No hay participantes para votar</p>';
        submitVotesBtn.disabled = true;
        return;
    }

    participantsVotingList.innerHTML = assignments.map(assignment => {
        const hasVideo = videoStatus[assignment.participant];
        const isSelected = userVote === assignment.participant;
        
        return `
            <div class="voting-card ${!hasVideo ? 'no-video' : ''} ${isSelected ? 'selected' : ''}">
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
                <div class="vote-section">
                    <button class="btn btn-vote ${isSelected ? 'btn-selected' : ''}" 
                            onclick="selectWinner('${assignment.participant}')">
                        ${isSelected ? '✓ Mi favorito' : 'Elegir como ganador'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    submitVotesBtn.disabled = false;
}

// Select winner
function selectWinner(participant) {
    userVote = participant;
    displayVotingSection();
}

// Submit vote
submitVotesBtn.addEventListener('click', async () => {
    if (!selectedSeason) {
        alert('No hay una temporada seleccionada');
        return;
    }

    if (!userVote) {
        alert('Por favor elige un participante como ganador');
        return;
    }

    try {
        const voteData = {
            seasonId: selectedSeason.id,
            seasonName: selectedSeason.name,
            voterName: currentVoter,
            winner: userVote,
            submittedAt: new Date().toISOString()
        };

        await saveVote(voteData);
        
        alert('¡Voto enviado exitosamente!');
        await displayVotersList();
        await displayResults();
    } catch (error) {
        console.error('Error saving vote:', error);
        alert('Error al guardar el voto. Por favor intenta de nuevo.');
    }
});

// Display voters list
async function displayVotersList() {
    if (!votersList) return;
    
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

// Toggle results panel
function toggleResults() {
    const body = document.getElementById('resultsBody');
    const icon = document.getElementById('resultsToggleIcon');
    if (!body) return;
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? 'block' : 'none';
    if (icon) icon.textContent = collapsed ? '▼' : '▶';
}

// Display results chart
async function displayResults() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsChart = document.getElementById('resultsChart');
    if (!resultsSection || !resultsChart) return;

    if (!selectedSeason || !assignments || assignments.length === 0) {
        resultsSection.style.display = 'none';
        return;
    }

    try {
        const votes = await getVotesBySeason(selectedSeason.id);

        if (!votes || votes.length === 0) {
            resultsSection.style.display = 'none';
            return;
        }

        resultsSection.style.display = 'block';

        // Count votes per participant
        const counts = {};
        assignments.forEach(a => { counts[a.participant] = { artist: a.artist, votes: 0, voters: [] }; });
        votes.forEach(v => {
            if (v.winner && counts[v.winner]) {
                counts[v.winner].votes += 1;
                counts[v.winner].voters.push(v.voterName);
            }
        });

        // Sort and assign ranks
        const sorted = Object.entries(counts)
            .map(([participant, data]) => ({ participant, ...data }))
            .sort((a, b) => b.votes - a.votes);

        sorted.forEach((r, i) => {
            if (i === 0) r.rank = 1;
            else if (r.votes === sorted[i - 1].votes) r.rank = sorted[i - 1].rank;
            else r.rank = i + 1;
        });

        const maxVotes = sorted[0].votes;
        const tiedRanks = new Set(
            sorted.filter((r, i, arr) => arr.filter(x => x.rank === r.rank).length > 1).map(r => r.rank)
        );

        function rankColor(rank) {
            if (rank === 1) return '#f39c12';
            if (rank === 2) return '#95a5a6';
            if (rank === 3) return '#cd7f32';
            return '#6c5ce7';
        }
        function rankMedal(rank, tied) {
            if (rank === 1) return tied ? '🤝🥇' : '🥇';
            if (rank === 2) return tied ? '🤝🥈' : '🥈';
            if (rank === 3) return tied ? '🤝🥉' : '🥉';
            return `#${rank}`;
        }

        resultsChart.innerHTML = sorted.map(r => {
            const pct = maxVotes > 0 ? (r.votes / maxVotes) * 100 : 0;
            const color = rankColor(r.rank);
            const isTied = tiedRanks.has(r.rank);
            const medal = rankMedal(r.rank, isTied);
            const isMyVote = userVote === r.participant;

            return `
                <div class="result-row">
                    <div class="result-row-header">
                        <div style="display:flex;align-items:center;gap:0.6rem;">
                            <span style="font-size:1.3rem;">${medal}</span>
                            <div>
                                <div style="font-weight:600;color:var(--text-primary);">
                                    ${r.participant}
                                    ${isMyVote ? '<span class="badge badge-info" style="margin-left:0.4rem;">Mi voto</span>' : ''}
                                    ${isTied ? `<span style="font-size:0.7rem;background:${color}33;color:${color};border:1px solid ${color};border-radius:10px;padding:0.1rem 0.4rem;margin-left:0.3rem;">Empate</span>` : ''}
                                </div>
                                <div style="font-size:0.85rem;color:var(--text-secondary);">Canta: ${r.artist}</div>
                            </div>
                        </div>
                        <div style="font-size:1.4rem;font-weight:bold;color:${color};">${r.votes} <span style="font-size:0.8rem;color:var(--text-secondary);">votos</span></div>
                    </div>
                    <div class="result-bar-bg">
                        <div class="result-bar" style="width:${pct}%;background:linear-gradient(90deg,${color},${color}aa);">
                            ${pct > 20 ? `<span style="color:#fff;font-weight:600;font-size:0.85rem;padding-right:0.5rem;">${r.votes}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error displaying results:', error);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
});
