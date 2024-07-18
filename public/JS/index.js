// index.js
document.addEventListener('DOMContentLoaded', function () {
    // Spezifische Codes für die Index-Seite
    const login = document.getElementById('LoginButton');
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerButton');
    const NavbarLink = document.getElementById('NeedLogin');
    const NavbarLink1 = document.getElementById('NeedLogin1');
    const NavbarLink2 = document.getElementById('NeedLogin2');
   

    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
        login.style.display = 'initial';
        loginLink.style.display = 'none';
        NavbarLink.style.display = 'initial';
        NavbarLink1.style.display = 'initial';
        NavbarLink2.style.display = 'initial';
       
    } else {
        registerLink.style.display = 'initial';
        login.style.display = 'none';
        NavbarLink.style.display = 'none';
        NavbarLink1.style.display = 'none';
        NavbarLink2.style.display = 'none';
        
    }

    if (!storedUsername) {
        window.location.href = 'Login.html';
    }
});
