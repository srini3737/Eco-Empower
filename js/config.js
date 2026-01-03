var config = {
    // API_URL: 'http://localhost:3000/api', // Local Development
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://eco-empower-api.onrender.com/api', // Replace with your actual Render URL later

    // Helper to get auth headers
    getHeaders: function () {
        const token = localStorage.getItem('eco_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }
};
