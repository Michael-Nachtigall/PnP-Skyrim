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

// Beispiel: Nachrichten aus der Datenbank laden
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'session') {
        if (isset($_SESSION['username'])) {
            echo json_encode(['success' => true, 'username' => $_SESSION['username']]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Keine aktive Sitzung']);
        }
        exit;
    }

    $sql = "SELECT messages.content, messages.created_at, pnpuser.Benutzername, pnpuser.profilepicture 
   FROM messages 
   JOIN pnpuser ON messages.UserID = pnpuser.UserID 
   WHERE messages.LobbyID = " + $_SESSION['lobbyid'] + "ORDER BY messages.id ASC";
    $result = $conn->query($sql);

    $messages = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $messages[] = $row;
        }
    } else {
        error_log("Keine Nachrichten gefunden.");
    }

    echo json_encode($messages);
    exit;
}

// Registrierung neuer Benutzer und andere POST-Anfragen
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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
                        error_log("Fehler beim Einfügen des Benutzers: " . $stmt->error);
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
                echo json_encode(["success" => false, "error" => "Fehler bei der Registrierung: " . $stmt->error]);
                error_log("Fehler beim Einfügen des Benutzers: " . $stmt->error);
            }
            
            $stmt->close();
            
        }
        //delete 
       elseif ($data['action'] === 'delete') {
        $userid = isset($data['userid']) ? trim($data['userid']) : '';
        $password = isset($data['passwort']) ? $data['passwort'] : '';
    
        // Debug-Ausgaben
        error_log("UserID: " . $userid);
        error_log("Passwort: " . $password);
    
        // Benutzer anhand der UserID finden
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
    
                // Foreign keys umlegen auf Benutzer 'Unbekannt'
                $stmt = $conn->prepare("UPDATE messages SET UserID = '1' WHERE UserID = ?");
                $stmt->bind_param("s", $userid);
                $stmt->execute();
                $stmt->close();
    
                // User löschen
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
    }

        //Login 
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
        } elseif ($data['action'] === 'send_message') {
            // Überprüfung der Session
            if (isset($data['content']) && isset($data['userid'])) {
                $content = trim($data['content']);
                $userid = trim($data['userid']);

                // Einfügen der Nachricht in die Datenbank
                $stmt = $conn->prepare("INSERT INTO messages (content, UserID) VALUES (?, ?)");
                $stmt->bind_param("si", $content, $userid);
                if ($stmt->execute()) {
                    echo json_encode(["success" => true]);
                } else {
                    echo json_encode(["success" => false, "error" => "Fehler beim Einfügen der Nachricht: " . $stmt->error]);
                    error_log("Fehler beim Einfügen der Nachricht: " . $stmt->error);
                }

                $stmt->close();
            } else {
                echo json_encode(["success" => false, "error" => "Nachricht oder Benutzer-ID nicht erhalten"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => "Ungültige Aktion für POST-Request"]);
        }
    } else {
        echo json_encode(["success" => false, "error" => "Aktion nicht angegeben"]);
    }

    exit;
}

// Verbindung schließen
$conn->close();
?>
