var lobby;
$(document).ready(function() {
    // Show lobby selection modal on page load
    if (sessionStorage.getItem("lobbyid") === "0") {
        if(lobby === "1"){
            location.reload();
        }
        $('#lobbySelectionModal').modal({
            backdrop: 'static', // Prevent closing when clicking outside
            keyboard: false // Prevent closing with keyboard
        }).modal('show');
        lobby = "1";
    }

    // Lobbys aufrufen
    async function fetchLobbies() {
        try {
            const response = await fetch('http://91.21.86.47/api.php?action=get_lobbies', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseText = await response.text();
            console.log('Lobby-Fetch-result:', response);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('Ungültige JSON-Antwort vom Server');
            }

            console.log('Lobbies:', result);

            if (result.success) {
                populateLobbyList(result.lobbies); // Populate lobby list with the received lobbies
            } else {
                alert('Fehler bei der Lobby-Suche: ' + (result.error || 'Unbekannter Fehler'));
            }
        } catch (error) {
            console.error('Fehler bei der Lobby-Suche:', error);
            alert('Es gab einen Fehler bei der Lobby-Suche. Bitte versuchen Sie es später erneut.');
        }
    }

    // Populate lobby list
    function populateLobbyList(lobbies) {
        $('#lobbyList').empty();
        lobbies.forEach(function(lobby) {
            $('#lobbyList').append(`
                <li class="list-group-item" data-id="${lobby.LobbyID}" data-name="${lobby.name}">
                    ${lobby.name}
                </li>
            `);
        });
    }

    // Filter lobbies by name or user
    $('#filterLobbies').on('input', function() {
        var filter = $(this).val().toLowerCase();
        $('#lobbyList li').each(function() {
            var lobbyName = $(this).data('name');
            var lobbyUser = $(this).data('user');

            // Sicherstellen, dass lobbyName und lobbyUser Strings sind
            if (typeof lobbyName === 'string') {
                lobbyName = lobbyName.toLowerCase();
            } else {
                lobbyName = '';
            }

            if (typeof lobbyUser === 'string') {
                lobbyUser = lobbyUser.toLowerCase();
            } else {
                lobbyUser = '';
            }

            if (lobbyName.includes(filter) || lobbyUser.includes(filter)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    var selectedLobbyName;

    // Show password input in the same modal on lobby item click
    $('#lobbyList').on('click', 'li', function() {
        selectedLobbyName = $(this).data('name');
        $('#selectedLobbyName').text(selectedLobbyName);
        $('#selname').text(selectedLobbyName);
        $('#passwordContainer').show();
    });

    // Handle lobby leave button
    $('#leaveLobbyButton').click(function() {
        const confirmLogout = confirm("Möchten Sie wirklich die Lobby verlassen?");
        if (confirmLogout) {
            sessionStorage.removeItem('lobbyid');
            sessionStorage.removeItem('lobbyname');
            location.reload();
        }
    });

    // Handle lobby join with password
    $('#joinLobbyBtn').on('click', function() {
        joinLobby();
    });

    // Handle pressing enter to join lobby
    $('#lobbyPassword').on('keypress', function(e) {
        if (e.which === 13) { // 13 is the enter key code
            joinLobby();
        }
    });

    // Handle lobby join with password
    function joinLobby() {
        var enteredPassword = $('#lobbyPassword').val();
        $.ajax({
            url: 'http://91.21.86.47/api.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'join_lobby',
                lobbyname: selectedLobbyName,
                password: enteredPassword
            }),
            success: function(response) {
                console.log('Lobbyantwort:', response);
                if (response.success) {
                    sessionStorage.setItem('lobbyname', selectedLobbyName);
                    sessionStorage.setItem('lobbyid', response.lobbyid);
                    $('#lobbySelectionModal').modal('hide');
                    $('#passwordContainer').hide();
                    $('#Cardlobby').text(selectedLobbyName);
                    alert('Lobby: ' + selectedLobbyName + ' erfolgreich beigetreten.');
                    location.reload();
                } else {
                    alert('Falsches Passwort!');
                }
            },
            error: function(err) {
                console.error('Fehler beim Beitreten der Lobby:', err);
                console.error('Server-Antwort:', err.responseText);
            }
        });
    }

    // Toggle password field in create lobby form
    $('#lobbyPasswordCheckbox').on('change', function() {
        $('#lobbyPasswordContainer').toggle(this.checked);
    });

    // Handle lobby creation form submission
    $('#createLobbyForm').on('submit', function(e) {
        e.preventDefault();
        createLobby();
    });

    // Handle pressing enter to create lobby
    $('#lobbyName').on('keypress', function(e) {
        if (e.which === 13) { // 13 is the enter key code
            e.preventDefault();
            createLobby();
        }
    });

    // Handle cancel joinBtn
    $('#cancelJoinBtn').on('click', function(e) {
        $('#passwordContainer').hide();
    });

    // Handle lobby creation form submission
    function createLobby() {
        var lobbyName = $('#lobbyName').val();
        var lobbyPassword = $('#lobbyPasswordCheckbox').is(':checked') ? $('#newLobbyPassword').val() : '';
        var userid = sessionStorage.getItem('userid');
        var isPasswordRequired = $('#lobbyPasswordCheckbox').is(':checked');

        // Überprüfung, ob der Benutzer angemeldet ist
        if (userid === null) {
            console.error('Benutzer ist nicht angemeldet.');
            return;
        }

        var lobbyExists = checkIfLobbyExists(lobbyName);

        if (lobbyExists) {
            alert('Eine Lobby mit dem Namen ' + lobbyName + ' existiert bereits.');
            return;
        }

        $.ajax({
            url: 'http://91.21.86.47/api.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'create_lobby',
                lobbyName: lobbyName,
                lobbyPassword: lobbyPassword,
                userid: userid,
                isPasswordRequired: isPasswordRequired
            }),
            success: function(response) {
                if (response.success) {
                    fetchLobbies(); // Funktion zum Aktualisieren der Lobby-Liste aufrufen
                    sessionStorage.setItem('lobbyname', lobbyName);
                    sessionStorage.setItem('lobbyid', response.lobbyId);
                    $('#Cardlobby').text(lobbyName);
                    alert('Lobby erstellt: ' + lobbyName);
                    location.reload();
                } else {
                    console.error('Fehler beim Erstellen der Lobby:', response.error);
                    console.error('Server-Antwort:', response);
                }
            },
            error: function(err) {
                console.error('Fehler beim Erstellen der Lobby:', err);
                console.error('Server-Antwort:', err.responseText);
            }
        });
    }

    // Funktion zum Überprüfen, ob die Lobby mit dem Namen bereits existiert
    function checkIfLobbyExists(lobbyName) {
        var existingLobbies = $('#lobbyList li').map(function() {
            return $(this).data('name');
        }).get();

        return existingLobbies.includes(lobbyName.toLowerCase());
    }

    // Rufe die Lobbys beim Laden der Seite ab
    fetchLobbies();
});
