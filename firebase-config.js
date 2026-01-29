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
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection names
const COLLECTIONS = {
    SEASONS: 'seasons',
    VOTES: 'votes'
};

// Helper functions for Firestore operations
async function getCurrentSeason() {
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
        return null;
    }
}

async function getAllSeasons() {
    try {
        const snapshot = await db.collection(COLLECTIONS.SEASONS)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error getting seasons:', error);
        return [];
    }
}

async function saveSeason(seasonData) {
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
        throw error;
    }
}

async function getSeasonById(seasonId) {
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
    try {
        const voteId = `${voteData.seasonId}_${voteData.voterName}`;
        await db.collection(COLLECTIONS.VOTES).doc(voteId).set({
            ...voteData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error saving vote:', error);
        throw error;
    }
}

async function getVotesBySeason(seasonId) {
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
