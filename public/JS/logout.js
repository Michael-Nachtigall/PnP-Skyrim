
   
            function logout() {
            const confirmLogout = confirm("Möchten Sie sich wirklich ausloggen?");
            if (confirmLogout) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        }