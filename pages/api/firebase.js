// Import the functions you need from the SDKs you need
import { initializeApp ,getApps,getApp} from "firebase/app";

import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGTwWK94G2GR2wESxDufbpIIjPkSAu0S4",
  authDomain: "atalanta-77824.firebaseapp.com",
  projectId: "atalanta-77824",
  storageBucket: "atalanta-77824.appspot.com",
  messagingSenderId: "99712962887",
  appId: "1:99712962887:web:15080eec6f55c067077c62",
  databaseURL: "https://atalanta-77824-default-rtdb.europe-west1.firebasedatabase.app/",
  measurementId: "G-XR56LDVQLG"
};
export const app = initializeApp(firebaseConfig);
