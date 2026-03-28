const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
} else if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL || '',
        client_id: process.env.FIREBASE_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
    };
} else {
    console.error('❌ Firebase configuration missing!');
    console.error('💡 Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID in your .env file');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Test Firestore connection
db.collection('_health').doc('ping').set({ timestamp: admin.firestore.FieldValue.serverTimestamp() })
    .then(() => {
        console.log('✅ Firebase Firestore connected successfully');
    })
    .catch((err) => {
        console.error('❌ Firestore connection failed:', err.message);
    });

module.exports = { db, admin };
