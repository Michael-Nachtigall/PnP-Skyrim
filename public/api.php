<?php
session_start();
header("Access-Control-Allow-Origin: http://87.187.108.98:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

// Verbindung zur MySQL-Datenbank herstellen
$servername = "127.0.0.1";
$username = "root";
$password = "Mn050805";
$database = "pnp-skyrim";

// Verbindung erstellen
$conn = new mysqli($servername, $username, $password, $database);

// Verbindung überprüfen
if ($conn->connect_error) {
    die(json_encode(["success" => false, "error" => "Verbindung fehlgeschlagen: " . $conn->connect_error]));
}

// JSON-Daten aus dem Request-Body lesen
$data = json_decode(file_get_contents('php://input'), true);

// Lobbys abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_lobbies') {
    $sql = "SELECT LobbyID, name, passwort, Createdby FROM lobby";
    $result = $conn->query($sql);
    $lobbies = [];

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $lobbies[] = $row;
        }
    }

    echo json_encode(["success" => true, "lobbies" => $lobbies]);
    exit;
}

// Neue Lobby erstellen
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data['action']) && $data['action'] === 'create_lobby') {

    $createdBy = $data['userid'];
    $lobbyName = $data['lobbyName'] ?? '';
    $lobbyPassword = $data['lobbyPassword'] ?? '';
    $isPasswordRequired = $data['isPasswordRequired'] ?? false;

    // Überprüfen, ob der Lobbyname bereits existiert
    if (checkIfLobbyExists($lobbyName)) {
        echo json_encode(["success" => false, "error" => "Eine Lobby mit dem Namen $lobbyName existiert bereits."]);
        exit;
    }

    if (empty($lobbyName) || ($isPasswordRequired && empty($lobbyPassword))) {
        echo json_encode(["success" => false, "error" => "Bitte füllen Sie alle Felder aus."]);
        exit;
    }

    $hashedPassword = password_hash($lobbyPassword, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO lobby (Createdby, name, passwort) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $createdBy, $lobbyName, $hashedPassword);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "lobbyId" => $stmt->insert_id]);
    } else {
        echo json_encode(["success" => false, "error" => "Fehler beim Erstellen der Lobby: " . $stmt->error]);
    }

    $stmt->close();
    exit;
}

// Lobby beitreten
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data['action']) && $data['action'] === 'join_lobby') {
    $lobbyname = $data['lobbyname'] ?? '';
    $enteredPassword = $data['password'] ?? '';

    if (empty($lobbyname)) {
        echo json_encode(["success" => false, "error" => "Lobbyname ist erforderlich"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT passwort, LobbyID FROM lobby WHERE name = ?");
    $stmt->bind_param("s", $lobbyname);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 1) {
        $lobby = $result->fetch_assoc();

        if (password_verify($enteredPassword, $lobby['passwort'])) {
            echo json_encode(["success" => true, 'lobbyid' => $lobby['LobbyID']]);
        } else {
            echo json_encode(["success" => false, "error" => "Falsches Passwort"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Lobby nicht gefunden"]);
    }

    $stmt->close();
    exit;
}
//Nachrichten Laden
 elseif (isset($_GET['action']) && $_GET['action'] === 'get_messages') {
    if (!isset($_GET['lobbyid'])) {
        echo json_encode(['success' => false, 'error' => 'Lobby-ID nicht gesetzt']);
        exit; // Fehlermeldung und Abbruch
    }

    $room = trim($_GET['lobbyid']);
    error_log("LobbyID aus der Anfrage: " . $room); // Logge die LobbyID aus der Anfrage

    $sql = "SELECT messages.content, messages.created_at, pnpuser.Benutzername, pnpuser.profilepicture 
    FROM messages 
    JOIN pnpuser ON messages.UserID = pnpuser.UserID 
    WHERE messages.LobbyID = ? 
    ORDER BY messages.id ASC";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("Fehler bei der Vorbereitung der SQL-Anweisung: " . $conn->error);
        echo json_encode(['success' => false, 'error' => 'SQL-Anweisung konnte nicht vorbereitet werden']);
        exit;
    }

    $stmt->bind_param('i', $room);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $messages = array();
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }

    // Überprüfe auf JSON-Fehler
    $jsonData = json_encode($messages);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'JSON Encoding Error: ' . json_last_error_msg()]);
        exit;
    }

    echo json_encode(['success' => true, 'messages' => $messages]);
    exit;
}


// Registrierung neuer Benutzer und andere POST-Anfragen
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(["success" => false, "error" => "Invalid JSON"]);
        exit;
    }

    if (isset($data['action'])) {
        if ($data['action'] === 'register') {
            $username = isset($data['registerUsername']) ? trim($data['registerUsername']) : '';
            $email = isset($data['registerEmail']) ? trim($data['registerEmail']) : '';
            $password = isset($data['registerPassword']) ? $data['registerPassword'] : '';

            // Validierung der Eingaben
            if (empty($username) || empty($email) || empty($password)) {
                echo json_encode(["success" => false, "error" => "Bitte füllen Sie alle Felder aus."]);
                exit;
            }

            // Passwort hashen
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Benutzer in die Datenbank einfügen
            $stmt = $conn->prepare("SELECT * FROM pnpuser WHERE Benutzername = ? OR email = ?");
            $stmt->bind_param("ss", $username, $email);
            
            if ($stmt->execute()) {
                $result = $stmt->get_result();
            
                if ($result->num_rows === 0) {
                    $stmt = $conn->prepare("INSERT INTO pnpuser (Benutzername, email, passwort, profilepicture) VALUES (?, ?, ?, '/assets/Profile.png')");
                    $stmt->bind_param("sss", $username, $email, $hashedPassword);
            
                    if ($stmt->execute()) {
                        echo json_encode(["success" => true]);
                    } else {
                        echo json_encode(["success" => false, "error" => "Fehler bei der Registrierung: " . $stmt->error]);
                    }
                } else {
                    // Benutzername oder E-Mail existieren bereits
                    $user = $result->fetch_assoc();
                    if ($user['Benutzername'] === $username) {
                        echo json_encode(["success" => false, "error" => "Fehler bei der Registrierung: Benutzername existiert bereits"]);
                    } elseif ($user['email'] === $email) {
                        echo json_encode(["success" => false, "error" => "Fehler bei der Registrierung: E-Mail wurde bereits registriert"]);
                    }
                }
            } else {
                error_log("Fehler beim Einfügen des Benutzers: " . $stmt->error);
            }
            
            $stmt->close();
            return;
        }
        // Benutzer löschen
        elseif ($data['action'] === 'delete') {
            $userid = isset($data['userid']) ? trim($data['userid']) : '';
            $password = isset($data['passwort']) ? $data['passwort'] : '';

            error_log("UserID: " . $userid);
            error_log("Passwort: " . $password);

            $stmt = $conn->prepare("SELECT * FROM pnpuser WHERE UserID = ?");
            $stmt->bind_param("s", $userid);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();

                if (password_verify($password, $user['passwort'])) {
                    $_SESSION['username'] = $user['Benutzername'];
                    $_SESSION['userid'] = $user['UserID'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['profilepicture'] = $user['profilepicture'];

                    $stmt = $conn->prepare("UPDATE messages SET UserID = '1' WHERE UserID = ?");
                    $stmt->bind_param("s", $userid);
                    $stmt->execute();
                    $stmt->close();

                    $stmt = $conn->prepare("DELETE FROM pnpuser WHERE UserID = ?");
                    $stmt->bind_param("s", $userid);
                    $stmt->execute();
                    $stmt->close();

                    echo json_encode(["success" => true]);
                } else {
                    echo json_encode(["success" => false, "error" => "Falsches Passwort"]);
                }
            } else {
                echo json_encode(["success" => false, "error" => "Benutzer nicht gefunden"]);
            }
            return;
        }
        // Login
       elseif ($data['action'] === 'login') {
            $emailOrUsername = isset($data['loginEmail']) ? trim($data['loginEmail']) : '';
            $password = isset($data['loginPassword']) ? $data['loginPassword'] : '';

            // Benutzer anhand von Benutzername oder E-Mail finden
            $stmt = $conn->prepare("SELECT * FROM pnpuser WHERE Benutzername = ? OR email = ?");
            $stmt->bind_param("ss", $emailOrUsername, $emailOrUsername);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $user = $result->fetch_assoc();
                if (password_verify($password, $user['passwort'])) {
                    $_SESSION['username'] = $user['Benutzername'];
                    $_SESSION['userid'] = $user['UserID'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['profilepicture'] = $user['profilepicture'];

                    echo json_encode(["success" => true, "username" => $user['Benutzername'], "userid" => $user['UserID'], "email" => $user["email"], "profilepicture" => $user["profilepicture"]]);
                } else {
                    echo json_encode(["success" => false, "error" => "Falsches Passwort"]);
                }
            } else {
                echo json_encode(["success" => false, "error" => "Benutzer nicht gefunden"]);
            }

            $stmt->close();
            return;
        }
        // Nachricht senden
        if ($data['action'] === 'send_message') {
            if (isset($data['content']) && isset($data['userid']) && isset($data['lobbyid'])) {
                $content = trim($data['content']);
                $userid = trim($data['userid']);
                $lobbyid = trim($data['lobbyid']);
                
                $stmt = $conn->prepare("INSERT INTO messages (content, UserID, LobbyID) VALUES (?, ?, ?)");
                $stmt->bind_param("sii", $content, $userid, $lobbyid);
                
                if ($stmt->execute()) {
                    echo json_encode(["success" => true]);
                } else {
                    echo json_encode(["success" => false, "error" => "Fehler beim Einfügen der Nachricht: " . $stmt->error]);
                    error_log("Fehler beim Einfügen der Nachricht: " . $stmt->error);
                }
    
                $stmt->close();
            } else {
                echo json_encode(["success" => false, "error" => "Nachricht, Benutzer-ID oder Lobby-ID nicht erhalten"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => "Ungültige Aktion für POST-Request"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Aktion nicht angegeben"]);
    }
    
 exit;   
}
// Funktion zum Überprüfen, ob die Lobby mit dem Namen bereits existiert
function checkIfLobbyExists($lobbyName) {
    global $conn;

    $stmt = $conn->prepare("SELECT LobbyID FROM lobby WHERE name = ?");
    $stmt->bind_param("s", $lobbyName);
    $stmt->execute();
    $stmt->store_result();
    $rowCount = $stmt->num_rows;
    $stmt->close();

    return $rowCount > 0;
}

// Verbindung schließen
$conn->close();
?>
