document.addEventListener('DOMContentLoaded', function () {
    

    $(document).ready(function() {
        loadplaceholder();
    });

    //Placeholder aus game.html werden eingespielt
    function loadplaceholder(){
    try{

    $("#navbar-placeholder").load("navbar.html");
    $("#lobby-placeholder").load("lobbyselection.html");
    $("#profile-modal-placeholder").load("profilemodal.html", function() {
        // Callback-Funktion nach dem Laden von profilemodal.html
        initializeProfileModal(); // Funktion aufrufen, um das Profilmodal zu initialisieren
    });

    }
    catch{
       if(window.location.pathname.toLowerCase() != '/login.html'){
        location.reload();
       }
    }
    }

    function initializeProfileModal() {

    const storedUsername = sessionStorage.getItem('username');
    const storedEmail = sessionStorage.getItem('email');
    const storedprofilepicture = sessionStorage.getItem('profilepicture');
  
    if (!storedUsername) {
        window.location.href = 'Login.html';
    } else {
        try{
            const profileModalLabel = document.getElementById('profileModalLabel');
            profileModalLabel.textContent = storedUsername;
            navbarUsername.textContent = storedUsername;
        }
        catch{
            loadplaceholder();
        }
    }   

    const modalEmail = document.getElementById('modalEmail');
    if (modalEmail) {
        modalEmail.textContent = storedEmail;
    }

    const modalprofilepicture = document.getElementById('profilepicture');
    const modalprofilepicture2 = document.getElementById('profilepicture2');
    if (modalprofilepicture) {
        modalprofilepicture.src = storedprofilepicture;
        modalprofilepicture2.src = storedprofilepicture;
    }


    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            const confirmLogout = confirm("Möchten Sie sich wirklich ausloggen?");
            if (confirmLogout) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });
    }

    const settingsbutton = document.getElementById('settingsbutton');
    if (settingsbutton) {
        settingsbutton.addEventListener('click', function () {
                window.location.href = 'profile.html';
        });
    }
}
    const sessionStartTime = sessionStorage.getItem('sessionStartTime') 
        ? new Date(sessionStorage.getItem('sessionStartTime')) 
        : new Date();

    if (!sessionStorage.getItem('sessionStartTime')) {
        sessionStorage.setItem('sessionStartTime', sessionStartTime);
    }

    setInterval(function () {
        const now = new Date();
        const elapsedTime = new Date(now - sessionStartTime);

        const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
        const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');

        sessionStorage.setItem('sessiontime', `${hours}:${minutes}:${seconds}`)
        const modalPlaytime = document.getElementById('modalplaytime');
        if (modalPlaytime) {
            modalPlaytime.textContent = sessionStorage.getItem('sessiontime');
        }
    }, 1000);
});
