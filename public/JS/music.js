$(document).ready(function() {
    const audioElement = document.getElementById('background-music');
    const mute = $('#mute'); // Verwenden Sie jQuery, um auf das Element zuzugreifen
    let isMuted = localStorage.getItem("mute");

    const volumeSlider = document.getElementById('volume-slider');

    volume = localStorage.getItem("volume");
    audioElement.volume = volume; // Lautstärke des Audioelements setzen
    volumeSlider.value = volume * 100;

    // Initialisierung der Stummschaltung basierend auf der Session Storage
    if (isMuted === "true") {
        isMuted = true;
        audioElement.muted = true;
        mute.attr('src', '../assets/mute.png'); // Verwenden Sie attr() für das Bild
    } else {
        isMuted = false;
        audioElement.muted = false;
        mute.attr('src', '../assets/Unmute.png'); // Verwenden Sie attr() für das Bild
    }
    


    // Eventlistener für den Slider
    volumeSlider.addEventListener('input', function() {
    const volume = parseFloat(volumeSlider.value) / 100; // Wert des Sliders in Bereich von 0 bis 1 umwandeln
    audioElement.volume = volume; // Lautstärke des Audioelements setzen
    localStorage.setItem("volume", volume.toString());
});

    // Funktion zum Umschalten zwischen stumm und nicht stumm
    const toggleMute = () => {
        isMuted = !isMuted;
        if (isMuted) {
            const audioElement = document.getElementById('background-music');
            const mute = $('#mute'); // Verwenden Sie jQuery, um auf das Element zuzugreifen
            mute.attr('src', '../assets/mute.png'); // Stumm-Symbol anzeigen
            playMusic();
        } else {
            const audioElement = document.getElementById('background-music');
            const mute = $('#mute'); // Verwenden Sie jQuery, um auf das Element zuzugreifen
            audioElement.muted = false;
            mute.attr('src', '../assets/Unmute.png'); // Nicht stummgeschaltetes Symbol anzeigen
            playMusic();
        }

        // Speichern des aktuellen Stummschaltungsstatus in der Session Storage
        localStorage.setItem("mute", isMuted.toString());
    };

    // Klick-Ereignis für das Stummschalten der Musik
    $(document).on('click', '.mute-btn', function() {
        toggleMute();
        
    });

    // Automatische Wiedergabe der Musik und Prüfung des Stummschaltungsstatus
    const playMusic = () => {
        if (!isMuted) {
            audioElement.play().then(() => {
                audioElement.volume = localStorage.getitem('volume');
                // Wiedergabe erfolgreich gestartet
            }).catch((e) => {
            });
        } else {
            audioElement.pause(); // Musik pausieren, wenn stummgeschaltet
        }
    };

    // Prüfen, ob die Musik bereits gestartet wurde (LocalStorage verwenden)
    const musicPlayed = localStorage.getItem('musicPlayed');
    if (!musicPlayed) {
        playMusic();
        localStorage.setItem('musicPlayed', true);
    } else {
        // Musik fortsetzen, falls sie bereits gestartet wurde
        const musicTime = parseFloat(localStorage.getItem('musicTime')) || 0;
        audioElement.currentTime = musicTime;
        playMusic();
    }

    // Musikzeit speichern, wenn die Seite verlassen wird
    $(window).on('beforeunload', function() {
        localStorage.setItem('musicTime', audioElement.currentTime.toString());
    });
});
