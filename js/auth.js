var authSystem = (function () {
    const CURRENT_USER_KEY = 'eco_current_user';
    const TOKEN_KEY = 'eco_token';

    function init() {
        // Check if token exists and user info is missing
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !localStorage.getItem(CURRENT_USER_KEY)) {
            // Fetch user info
            $.ajax({
                url: config.API_URL + '/auth/me',
                method: 'GET',
                headers: config.getHeaders(),
                success: function (response) {
                    if (response.success) {
                        setCurrentUser(response.user);
                        updateNavbar();
                    }
                },
                error: function () {
                    // Invalid token
                    logout();
                }
            });
        }
    }

    function setCurrentUser(user) {
        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    // Public API
    return {
        init: init,

        login: function (username, password) {
            // Note: This needs to be handled asynchronously now.
            // Returning a Promise-like structure or using callback
            // Since the original code was synchronous, we might need to adjust caller code

            return $.ajax({
                url: config.API_URL + '/auth/login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ username, password })
            }).then(function (response) {
                if (response.success) {
                    setToken(response.token);
                    setCurrentUser(response.user);
                    return { success: true, user: response.user };
                }
                return { success: false, message: response.message || 'Login failed' };
            }).catch(function (err) {
                return {
                    success: false,
                    message: err.responseJSON?.error || 'Server error'
                };
            });
        },

        register: function (username, email, password) {
            return $.ajax({
                url: config.API_URL + '/auth/register',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ username, email, password })
            }).then(function (response) {
                if (response.success) {
                    return { success: true, user: response.user };
                }
                return { success: false, message: response.message || 'Registration failed' };
            }).catch(function (err) {
                return {
                    success: false,
                    message: err.responseJSON?.error || 'Server error'
                };
            });
        },

        logout: function () {
            setToken(null);
            setCurrentUser(null);
            // Redirect to home/login
            var path = window.location.pathname;
            if (path.includes('pages/')) {
                window.location.href = '../index.html';
            } else {
                window.location.href = 'index.html';
            }
        },

        getCurrentUser: function () {
            return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        },

        isAdmin: function () {
            var user = this.getCurrentUser();
            return user && user.role === 'admin';
        },

        // Data Access for Admin - utilizing API now
        getAllUsers: function () {
            return $.ajax({
                url: config.API_URL + '/admin/users',
                method: 'GET',
                headers: config.getHeaders()
            });
        },

        updateNavbar: function () {
            var user = this.getCurrentUser();
            var authHtml = '';
            // Detect if we are in subdirectory or root
            var isIndex = false;
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('Empathy_Green-main/Eco%20Empower/')) {
                isIndex = true;
            }

            // Fix path detection logic to be more robust
            // If the script src is "../js/auth.js" we are likely in pages/
            // But let's rely on window.location
            if (window.location.pathname.indexOf('/pages/') === -1) {
                isIndex = true;
            } else {
                isIndex = false;
            }

            var loginPath = isIndex ? 'pages/login.html' : 'login.html';
            var adminPath = isIndex ? 'pages/admin.html' : 'admin.html';

            // Remove existing auth item if any
            $('#auth-nav-item').remove();
            $('#admin-nav-item').remove(); // Separate ID for admin link handling

            if (user) {
                var dashboardLink = '';
                if (user.role === 'admin') {
                    dashboardLink = `<li class="nav-item" id="admin-nav-item"><a class="nav-link fw-bold text-danger" href="${adminPath}">Admin</a></li>`;
                }

                authHtml = `
                    ${dashboardLink}
                    <li class="nav-item" id="auth-nav-item">
                        <a class="nav-link" href="#" onclick="authSystem.logout()">Logout (${user.username})</a>
                    </li>
                `;
            } else {
                authHtml = `
                    <li class="nav-item" id="auth-nav-item">
                        <a class="nav-link" href="${loginPath}">Login</a>
                    </li>
                `;
            }

            // Append to navbar
            $('.navbar-nav').append(authHtml);
        }
    };
})();

// Auto-init
$(document).ready(function () {
    authSystem.init();
    authSystem.updateNavbar();
});
