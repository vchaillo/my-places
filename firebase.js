// Firebase is loaded only after a project configuration has been supplied.
export const cloud = {
  ready: false, user: null, inbox: [],
  async start(onState, onInbox) {
    if (!window.firebaseConfig?.apiKey) return;
    const [app, auth, db] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js')
    ]);
    const instance = app.initializeApp(window.firebaseConfig);
    const authentication = auth.getAuth(instance);
    const firestore = db.getFirestore(instance);
    this.ready = true;
    this.login = () => auth.signInWithPopup(authentication, new auth.GoogleAuthProvider());
    this.logout = () => auth.signOut(authentication);
    this.save = data => db.setDoc(db.doc(firestore, 'apps', 'my-places', 'users', this.user.uid), data);
    this.share = (recipientId, payload) => db.addDoc(db.collection(firestore, 'apps', 'my-places', 'shares'), {
      ownerId: this.user.uid, recipientId, title: payload.title,
      places: payload.places, createdAt: db.serverTimestamp()
    });
    let stopData = () => {}, stopInbox = () => {};
    auth.onAuthStateChanged(authentication, user => {
      stopData(); stopInbox(); this.user = user; this.inbox = []; onInbox([]);
      if (!user) { onState(null, null); return; }
      // Never mix local guest data or demo fixtures into a signed-in account.
      onState(user, null);
      stopData = db.onSnapshot(db.doc(firestore, 'apps', 'my-places', 'users', user.uid), snapshot => {
        onState(user, snapshot.exists() ? snapshot.data() : { places: [], categories: [] });
      }, () => { onState(user, null, 'Impossible de charger vos données. Réessayez.'); });
      stopInbox = db.onSnapshot(db.query(db.collection(firestore, 'apps', 'my-places', 'shares'), db.where('recipientId', '==', user.uid)), snapshot => {
        onInbox(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
      }, () => { document.getElementById('syncStatus').textContent = 'Partages indisponibles'; });
    });
  }
};
