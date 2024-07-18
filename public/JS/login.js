// login.js
document.addEventListener('DOMContentLoaded', async function() {
    const loginForm = document.getElementById('loginForm');
    const navbarUsername = document.getElementById('navbarUsername');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        if (!loginForm.checkValidity()) {
            loginForm.reportValidity();
            return;
        }

        const formData = new FormData(loginForm);
        const loginData = {
            loginEmail: formData.get('loginEmail'),
            loginPassword: formData.get('loginPassword'),
            action: 'login'
        };

        try {
            const response = await fetch('http://91.21.86.47/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('Ungültige JSON-Antwort vom Server');
            }

            console.log('Loginantwort:', result);

            if (result.success) {
                alert('Login erfolgreich!');
                document.getElementById('loginForm').reset();
                const loginModal = new bootstrap.Modal(document.getElementById('Register'));
                loginModal.hide();
                navbarUsername.textContent = result.username;
                sessionStorage.setItem('username', result.username);
                sessionStorage.setItem('userid', result.userid)
                sessionStorage.setItem('email', result.email)
                sessionStorage.setItem('profilepicture', result.profilepicture)
                window.location.href = 'index.html';
            } else {
                alert('Fehler beim Login: ' + result.error);
            }
        } catch (error) {
            console.error('Fehler beim Login:', error);
            alert('Es gab einen Fehler beim Login. Bitte versuchen Sie es später erneut.');
        }
    });

    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
        navbarUsername.textContent = storedUsername;
    }

    const registerButton = document.getElementById('registerButton');
    const registerForm = document.getElementById('registerForm');

    registerButton.addEventListener('click', async function(event) {
        event.preventDefault();

        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        const formData = new FormData(registerForm);
        const registerData = {
            registerUsername: formData.get('registerUsername'),
            registerEmail: formData.get('registerEmail'),
            registerPassword: formData.get('registerPassword'),
            action: 'register'
        };

        try {
            const response = await fetch('http://91.21.86.47/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const responseText = await response.text();
           

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error('Ungültige JSON-Antwort vom Server');
            }
            console.log('Registerantwort:', result);

            if (result.success) {
                alert('Registrierung erfolgreich!');
                document.getElementById('registerForm').reset();
                const registerModal = new bootstrap.Modal(document.getElementById('Register'));
                registerModal.hide();
                location.reload();
            } else {
                alert('Fehler bei der Registrierung: ' + result.error);
            }
        } catch (error) {
            console.error('Fehler bei der Registrierung:', error);
            alert('Es gab einen Fehler bei der Registrierung. Bitte versuchen Sie es später erneut.');
        }
    });
});
