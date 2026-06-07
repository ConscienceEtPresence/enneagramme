/* ============================================================
   Le miroir intérieur — initialisation Firebase
   Même projet Firebase que La voie du dedans : 'la-voie-du-dedans'
   Collections distinctes : codes-type/, carnets-type/, demandes-type/,
   suggestions-type/
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBYlX1AcOP4Yg5rCy9T5tIcrV0WOTT3E24",
  authDomain: "la-voie-du-dedans.firebaseapp.com",
  projectId: "la-voie-du-dedans",
  storageBucket: "la-voie-du-dedans.firebasestorage.app",
  messagingSenderId: "531110328878",
  appId: "1:531110328878:web:322ac57d9504e750b83dbf"
};

export const app = initializeApp(firebaseConfig);
export const db  = getFirestore(app);

/* Collections du miroir intérieur (suffixe -type pour les distinguer
   strictement des collections du carnet du dedans) */
export const COL = {
  codes:       'codes-type',
  carnets:     'carnets-type',
  demandes:    'demandes-type',
  suggestions: 'suggestions-type'
};
