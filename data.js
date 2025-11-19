const firebaseConfig = {
    apiKey: "AIzaSyBYQPQwKYJLxcdjHHMv8w1KbLIIX-HKaQA",
    authDomain: "scioport.firebaseapp.com",
    projectId: "scioport",
    storageBucket: "scioport.appspot.com",
    messagingSenderId: "612919891675",
    appId: "1:612919891675:web:3adef562f38e26c80e5efe",
    measurementId: "G-7BW8NQ1VKC"
};
firebase.initializeApp(firebaseConfig);

// Use the already initialized Firebase instance
const db = firebase.firestore();

let adminMode = false;

// Toggle admin mode and render data
document.getElementById('admin').onclick = async function() {
  adminMode = !adminMode;
  await renderData();
};

// Render data based on admin mode
async function renderData() {
  const user = firebase.auth().currentUser;
  let dataHtml = '';

  if (adminMode) {
    // Admin mode: Show all users' data
    const usersSnapshot = await db.collection('users').get();
    const promises = usersSnapshot.docs.map(userDoc => {
      const userEmail = userDoc.data().email || userDoc.id;
      return db.collection('users').doc(userDoc.id).collection('data').orderBy('timestamp', 'desc').get()
        .then(dataSnapshot => {
          let userData = `<h1>${userEmail}</h1>`;
          if (dataSnapshot.empty) {
            userData += `<span style="color:gray;">No data</span>`;
          } else {
            dataSnapshot.forEach(doc => {
              userData += `<span>${doc.data().value}</span><br>`;
            });
          }
          userData += `<hr>`;
          return userData;
        });
    });
    const allUsersData = await Promise.all(promises);
    dataHtml = allUsersData.join('');
    document.getElementById('user-data').innerHTML = dataHtml;
    document.getElementById('user-email').textContent = adminMode ? "Admin Mode: All Users" : user.email;
  } else {
    // User mode: Show only current user's data
    document.getElementById('user-email').textContent = user.email;
    const dataRef = db.collection('users').doc(user.uid).collection('data');
    const snapshot = await dataRef.orderBy('timestamp', 'desc').get();
    snapshot.forEach(doc => {
      dataHtml += `<div>${doc.data().value}</div>`;
    });
    document.getElementById('user-data').innerHTML = dataHtml;
  }
}

// Monitor authentication state and render data
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    await db.collection('users').doc(user.uid).set({
      email: user.email
    }, { merge: true });
    await renderData();
  } else {
    window.location.href = "/login";
  }
});