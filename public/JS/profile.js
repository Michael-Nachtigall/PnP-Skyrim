document.addEventListener('DOMContentLoaded', async function() {
    const storedUsername = sessionStorage.getItem('username');
    const storedEmail = sessionStorage.getItem('email');
    const storedProfilePicture = sessionStorage.getItem('profilepicture');

    const isUsername = document.getElementById('EditUsername');
    const isEmail = document.getElementById('EditEMail');
    const isProfilePicture = document.getElementById('EditProfilepicture3');

   

    if (isUsername) {
        isUsername.placeholder  = storedUsername;
        isUsername.textContent  = storedUsername;
    }
    if (isEmail) {
        isEmail.placeholder  = storedEmail;
        isEmail.textContent  = storedEmail;
    }
    if (isProfilePicture) {
        isProfilePicture.src = storedProfilePicture;
    }

        //Bearbeiten Knopf funktion
        $(document).ready(function() {
        // Eventlistener für Bearbeiten-Buttons
        $('.edit-btn').click(function() {
            var targetId = $(this).data('target');
            var $inputField = $('#' + targetId);
            //Readonly aufheben
            if(targetId = $(this).data('target2')){
                var targetId2 = $(this).data('target2');
                var $inputField2 = $('#' + targetId2);
                $inputField2.attr('readonly', false).focus();
            }
            // Feld bearbeitbar machen und den Fokus darauf setzen
            $inputField.attr('readonly', false).focus();
            
        });

        //Bestätigen Knopf funktion
        $('.submit-btn').click(function() {
            var targetId = $(this).data('target');
            var $inputField = $('#' + targetId);
            //Readonly wieder auf true setzen
            if(targetId = $(this).data('target2')){
                var targetId2 = $(this).data('target2');
                var $inputField2 = $('#' + targetId2);
                $inputField2.attr('readonly', true);
            }
            $inputField.attr('readonly', true);
        });

       // Account löschen
const deletebtn = document.getElementById('delete-btn');
const oldPasswordInput = document.getElementById('oldPassword');

deletebtn.addEventListener('click', async function() {
    const usersettings = document.getElementById('UserSettings');
    const formData = new FormData(usersettings);

    console.log('Eingegebenes Passwort:', formData.get('oldPassword'));
    console.log('UserID aus Session:', sessionStorage.getItem('userid'));

    const userdata = {
        passwort: formData.get('oldPassword'),
        userid: sessionStorage.getItem('userid'),
        action: 'delete'
    };

    try {
        const response = await fetch('http://91.21.86.47/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userdata)
        });

        const text = await response.text(); // Text-Antwort zuerst lesen
        console.log('Server-Antwort als Text:', text);
        const result = JSON.parse(text); // Dann parsen
        console.log('Server-Antwort als JSON:', result);

        if (result.success) {
            alert('Dein Account wurde erfolgreich gelöscht');
            logout();
            location.reload();
        } else {
            alert('Fehler bei der Löschung: ' + result.error);
        }
    } catch (error) {
        console.error('Fehler bei der Löschung:', error);
        alert('Es gab einen Fehler bei der Löschung. Bitte versuchen Sie es später erneut.');
    }
});

    });
});
