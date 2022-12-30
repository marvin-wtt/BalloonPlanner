import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCOJ5PSnYXlBqf5SVD0jcUAtov2BPASe2Y',
  authDomain: 'balloon-organizer.firebaseapp.com',
  databaseURL:
    'https://balloon-organizer-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'balloon-organizer',
  storageBucket: 'balloon-organizer.appspot.com',
  messagingSenderId: '185271036675',
  appId: '1:185271036675:web:921eefcd7e578cc5a95736',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((error) => {
  console.error(error);
});

export { app, db };
