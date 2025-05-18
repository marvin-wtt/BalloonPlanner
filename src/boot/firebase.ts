import { initializeApp } from 'firebase/app';
import { persistentLocalCache, initializeFirestore } from 'firebase/firestore';
import { defineBoot } from '#q-app/wrappers';
import { VueFire, VueFireAuth } from 'vuefire';

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

const firebaseApp = initializeApp(firebaseConfig, {});
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache(),
});

export default defineBoot(({ app }) => {
  app.use(VueFire, {
    firebaseApp,
    modules: [VueFireAuth()],
  });
});

const app = firebaseApp;

export { app, db };
