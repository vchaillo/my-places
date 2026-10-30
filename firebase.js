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
    this.share = (recipientEmail, payload) => db.addDoc(db.collection(firestore, 'apps', 'my-places', 'shares'), {
      ownerId: this.user.uid, recipientEmail, title: payload.title,
      places: payload.places, createdAt: db.serverTimestamp()
    });
    let stopData = () => {}, stopInbox = () => {}, stopEmail = () => {};
    auth.onAuthStateChanged(authentication, user => {
      stopData(); stopInbox(); stopEmail(); this.user = user; this.inbox = []; onInbox([]);
      if (!user) { onState(null, null); return; }
      // Never mix local guest data or demo fixtures into a signed-in account.
      onState(user, null);
      stopData = db.onSnapshot(db.doc(firestore, 'apps', 'my-places', 'users', user.uid), snapshot => {
        onState(user, snapshot.exists() ? snapshot.data() : { places: [], categories: [] });
      }, () => { onState(user, null, 'Impossible de charger vos données. Réessayez.'); });
      const buckets={legacy:[],email:[]};const publish=()=>onInbox([...buckets.legacy,...buckets.email]);
      if(user.emailVerified&&user.email)stopEmail=db.onSnapshot(db.query(db.collection(firestore,'apps','my-places','shares'),db.where('recipientEmail','==',user.email.toLowerCase())),snapshot=>{buckets.email=snapshot.docs.map(item=>({id:item.id,...item.data()}));publish()},()=>{document.getElementById('syncStatus').textContent='Règles de partage à mettre à jour';});
      stopInbox = db.onSnapshot(db.query(db.collection(firestore, 'apps', 'my-places', 'shares'), db.where('recipientId', '==', user.uid)), snapshot => {
        buckets.legacy=snapshot.docs.map(item => ({ id: item.id, ...item.data() }));publish();
      }, () => { document.getElementById('syncStatus').textContent = 'Partages indisponibles'; });
    });
  }
};
