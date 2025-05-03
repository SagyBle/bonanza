import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAY5aLF_qquUDcj9_9djoZGXrTG7yQFdWw",
  authDomain: "schonaa-dc043.firebaseapp.com",
  databaseURL: "https://schonaa-dc043-default-rtdb.firebaseio.com",
  projectId: "schonaa-dc043",
  storageBucket: "schonaa-dc043.firebasestorage.app",
  messagingSenderId: "842569825163",
  appId: "1:842569825163:web:f8bdca577b92d950764d8e",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
