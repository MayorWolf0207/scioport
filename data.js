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

const db = firebase.firestore(); // Use the already initialized Firebase instance from the HTML file

let adminMode = false; // Track admin mode state

document.addEventListener('DOMContentLoaded', function() { // Wait for DOM to be fully loaded before accessing elements
  const adminButton = document.getElementById('admin'); // Get the admin toggle button
  if (adminButton) { // Check if button exists (only exists on data.html)
    adminButton.onclick = async function() { // Set click handler for admin button
      adminMode = !adminMode; // Toggle admin mode
      await renderData(); // Re-render data with new mode
    };
  }
});

async function renderData() { // Function to display user data
  const user = firebase.auth().currentUser; // Get the currently authenticated user
  if (!user) return; // Exit if no user is logged in

  let dataHtml = ''; // Initialize empty string for HTML content

  if (adminMode) { // Check if admin mode is active
    const usersSnapshot = await db.collection('users').get(); // Get all user documents from Firestore
    const promises = usersSnapshot.docs.map(userDoc => { // Map over each user document
      const userEmail = userDoc.data().email || userDoc.id; // Get user email or fallback to user ID
      return db.collection('users').doc(userDoc.id).collection('data').orderBy('timestamp', 'desc').get() // Get user's data sorted by timestamp
        .then(dataSnapshot => { // Process the data snapshot
          let userData = `<h1>${userEmail}</h1>`; // Start with user email header
          if (dataSnapshot.empty) { // Check if user has no data
            userData += `<span style="color:gray;">No data</span>`; // Display "No data" message
          } else { // User has data
            dataSnapshot.forEach(doc => { // Loop through each data entry
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
  } else { // User mode is active
    document.getElementById('user-email').textContent = user.email; // Display current user's email
    const dataRef = db.collection('users').doc(user.uid).collection('data'); // Reference to user's data collection
    const snapshot = await dataRef.orderBy('timestamp', 'desc').get(); // Get user's data sorted by timestamp descending
    snapshot.forEach(doc => { // Loop through each data entry
      dataHtml += `<span>${doc.data().value}</span><br>`; // Add data value with line break
    });
    document.getElementById('user-data').innerHTML = dataHtml; // Update user data display
  }
}

firebase.auth().onAuthStateChanged(async function(user) { // Listen for authentication state changes
  if (user) { // User is logged in
    await db.collection('users').doc(user.uid).set({ // Create or update user document
      email: user.email // Store user email
    }, { merge: true }); // Merge with existing data instead of overwriting
    await renderData(); // Render the user's data
  } else { // User is not logged in
    window.location.href = "/login"; // Redirect to login page
  }
});