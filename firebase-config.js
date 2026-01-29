// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAipOBAO0paMWMtH87l3DQ0ezmqDj1tAFs",
    authDomain: "yo-si-canto-rico.firebaseapp.com",
    projectId: "yo-si-canto-rico",
    storageBucket: "yo-si-canto-rico.firebasestorage.app",
    messagingSenderId: "730163223393",
    appId: "1:730163223393:web:a0209a9a2d4a74fd160320",
    measurementId: "G-MR29B159N5"
};

// Initialize Firebase
let db = null;
let firebaseInitialized = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    console.warn('⚠️ Usando modo sin conexión');
    firebaseInitialized = false;
}

// Collection names
const COLLECTIONS = {
    SEASONS: 'seasons',
    VOTES: 'votes'
};

// Helper functions for Firestore operations
async function getCurrentSeason() {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, usando localStorage');
        const data = localStorage.getItem('currentSeason');
        return data ? JSON.parse(data) : null;
    }
    
    try {
        const snapshot = await db.collection(COLLECTIONS.SEASONS)
            .where('isActive', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            return null;
        }
        
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error('Error getting current season:', error);
        alert('Error al cargar datos de Firebase. Verifica que Firestore esté configurado en Firebase Console.');
        return null;
    }
}

async function getAllSeasons() {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, usando localStorage');
        const data = localStorage.getItem('seasonsHistory');
        return data ? JSON.parse(data) : [];
    }
    
    try {
        const snapshot = await db.collection(COLLECTIONS.SEASONS)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting seasons:', error);
        // Si el error es por falta de índice, informar al usuario
        if (error.code === 'failed-precondition') {
            console.error('Necesitas crear un índice en Firestore. Revisa la consola de Firebase.');
        }
        return [];
    }
}

async function saveSeason(seasonData) {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, guardando en localStorage');
        if (seasonData.isActive) {
            localStorage.setItem('currentSeason', JSON.stringify(seasonData));
        }
        let history = JSON.parse(localStorage.getItem('seasonsHistory') || '[]');
        const index = history.findIndex(s => s.id === seasonData.id);
        if (index >= 0) {
            history[index] = seasonData;
        } else {
            seasonData.id = Date.now().toString();
            history.push(seasonData);
        }
        localStorage.setItem('seasonsHistory', JSON.stringify(history));
        return seasonData.id;
    }
    
    try {
        // If there's an active season, deactivate it
        if (seasonData.isActive) {
            const activeSeasons = await db.collection(COLLECTIONS.SEASONS)
                .where('isActive', '==', true)
                .get();
            
            const batch = db.batch();
            activeSeasons.docs.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });
            await batch.commit();
        }
        
        if (seasonData.id) {
            // Update existing season
            await db.collection(COLLECTIONS.SEASONS).doc(seasonData.id).update(seasonData);
            return seasonData.id;
        } else {
            // Create new season
            const docRef = await db.collection(COLLECTIONS.SEASONS).add({
                ...seasonData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error('Error saving season:', error);
        alert('Error al guardar en Firebase: ' + error.message);
        throw error;
    }
}

async function getSeasonById(seasonId) {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, usando localStorage');
        const history = JSON.parse(localStorage.getItem('seasonsHistory') || '[]');
        return history.find(s => s.id === seasonId) || null;
    }
    
    try {
        const doc = await db.collection(COLLECTIONS.SEASONS).doc(seasonId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting season:', error);
        return null;
    }
}

async function saveVote(voteData) {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, guardando en localStorage');
        let votes = JSON.parse(localStorage.getItem('votes') || '[]');
        const index = votes.findIndex(v => v.seasonId === voteData.seasonId && v.voterName === voteData.voterName);
        if (index >= 0) {
            votes[index] = voteData;
        } else {
            votes.push(voteData);
        }
        localStorage.setItem('votes', JSON.stringify(votes));
        return;
    }
    
    try {
        const voteId = `${voteData.seasonId}_${voteData.voterName}`;
        await db.collection(COLLECTIONS.VOTES).doc(voteId).set({
            ...voteData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving vote:', error);
        alert('Error al guardar voto: ' + error.message);
        throw error;
    }
}

async function getVotesBySeason(seasonId) {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, usando localStorage');
        const votes = JSON.parse(localStorage.getItem('votes') || '[]');
        return votes.filter(v => v.seasonId === seasonId);
    }
    
    try {
        const snapshot = await db.collection(COLLECTIONS.VOTES)
            .where('seasonId', '==', seasonId)
            .get();
        
        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Error getting votes:', error);
        return [];
    }
}

async function getVoteBySeasonAndVoter(seasonId, voterName) {
    if (!firebaseInitialized || !db) {
        console.warn('Firebase no disponible, usando localStorage');
        const votes = JSON.parse(localStorage.getItem('votes') || '[]');
        return votes.find(v => v.seasonId === seasonId && v.voterName === voterName) || null;
    }
    
    try {
        const voteId = `${seasonId}_${voterName}`;
        const doc = await db.collection(COLLECTIONS.VOTES).doc(voteId).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting vote:', error);
        return null;
    }
}
