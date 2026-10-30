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
    const shares=db.collection(firestore,'apps','my-places','shares');
    this.findUsers=async prefix=>{const result=await db.getDocs(db.query(db.collection(firestore,'apps','my-places','directory'),db.orderBy('email'),db.startAt(prefix),db.endAt(prefix+'\uf8ff'),db.limit(10)));return result.docs.map(doc=>doc.data())};
    this.listShares=async payload=>{const result=await db.getDocs(db.query(shares,db.where('ownerId','==',this.user.uid)));return result.docs.map(doc=>({id:doc.id,...doc.data()})).filter(item=>item.sourceId===payload.sourceId||(!item.sourceId&&item.title===payload.title&&((payload.sourceId.startsWith('place:')&&item.places?.length===1&&item.places[0].id===payload.places[0]?.id)||(payload.sourceId.startsWith('collection:')&&item.places?.every(p=>p.category===payload.title))))) };
    this.revokeShares=async items=>{await Promise.all(items.map(item=>db.deleteDoc(db.doc(shares,item.id))))};
    this.share=async(recipientEmail,payload)=>{
      const existing=await this.listShares(payload);if(existing.some(item=>item.recipientEmail===recipientEmail))return false;
      // A deterministic document ID makes repeated and simultaneous requests idempotent.
      const key=JSON.stringify([this.user.uid,payload.sourceId,recipientEmail]);const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      await db.setDoc(db.doc(shares,id),{ownerId:this.user.uid,recipientEmail,sourceId:payload.sourceId,title:payload.title,places:payload.places,...(payload.collection?{collection:payload.collection}:{}),createdAt:db.serverTimestamp()});return true;
    };
    let stopData = () => {}, stopInbox = () => {}, stopEmail = () => {};
    auth.onAuthStateChanged(authentication, user => {
      stopData(); stopInbox(); stopEmail(); this.user = user; this.inbox = []; onInbox([]);
      if (!user) { onState(null, null); return; }
      if(user.emailVerified&&user.email)db.setDoc(db.doc(firestore,'apps','my-places','directory',user.uid),{email:user.email.toLowerCase()}).catch(()=>{});
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
