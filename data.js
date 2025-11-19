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

let adminMode = false; // Track admin mode state

// Toggle admin mode and render data
document.getElementById('admin').onclick = async function() {
  adminMode = !adminMode; // Toggle admin mode
  await renderData(); // Re-render data
};

// Render data based on admin mode
async function renderData() {
  const user = firebase.auth().currentUser; // Get the currently authenticated user
  if (!user) return; // Exit if no user is logged in

  let dataHtml = ''; // Initialize empty string for HTML content

  if (adminMode) {
    // Admin mode: Show all users' data
    const usersSnapshot = await db.collection('users').get(); // Get all user documents
    const promises = usersSnapshot.docs.map(userDoc => {
      const userEmail = userDoc.data().email || userDoc.id; // Get user email or fallback to ID
      return db.collection('users').doc(userDoc.id).collection('data').orderBy('timestamp', 'desc').get()
        .then(dataSnapshot => {
          let userData = `<h1>${userEmail}</h1>`; // Start with user email header
          if (dataSnapshot.empty) {
            userData += `<span style="color:gray;">No data</span>`; // Display "No data" message
          } else {
            dataSnapshot.forEach(doc => {
              userData += `<span>${doc.data().value}</span><br>`; // Add data value with line break
            });
          }
          userData += `<hr>`; // Add horizontal rule separator
          return userData; // Return formatted user data HTML
        });
    });
    const allUsersData = await Promise.all(promises); // Wait for all user data to be fetched
    dataHtml = allUsersData.join(''); // Combine all user data into single HTML string
    document.getElementById('user-data').innerHTML = dataHtml; // Update user data display
    document.getElementById('user-email').textContent = "Admin Mode: All Users"; // Update header for admin mode
  } else {
    // User mode: Show only current user's data
    document.getElementById('user-email').textContent = user.email; // Display current user's email
    const dataRef = db.collection('users').doc(user.uid).collection('data'); // Reference to user's data collection
    const snapshot = await dataRef.orderBy('timestamp', 'desc').get(); // Get user's data sorted by timestamp
    snapshot.forEach(doc => {
      dataHtml += `<div>${doc.data().value}</div>`; // Add data value in a div
    });
    document.getElementById('user-data').innerHTML = dataHtml; // Update user data display
  }
}

// Monitor authentication state and render data
firebase.auth().onAuthStateChanged(async function(user) {
  if (user) {
    await db.collection('users').doc(user.uid).set({
      email: user.email
    }, { merge: true }); // Ensure user document exists
    await renderData(); // Render the user's data
  } else {
    window.location.href = "/login"; // Redirect to login page if not authenticated
  }
});