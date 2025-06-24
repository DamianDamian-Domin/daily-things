import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCwyPcoTZZl-nMgZTFMdsyT4uyEjbSxGxg",
    authDomain: "daily-things-f7f48.firebaseapp.com",
    databaseURL: "https://daily-things-f7f48-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "daily-things-f7f48",
    storageBucket: "daily-things-f7f48.firebasestorage.app",
    messagingSenderId: "648609105848",
    appId: "1:648609105848:web:0b1b7fdbd94c561d69b14d"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;