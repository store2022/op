// Configuration
const LINE_CLIENT_ID = '2002964196'; // ใส่ LINE Client ID ของคุณ
const REDIRECT_URI = 'https://store-op.glitch.me/callback.html';
const GOOGLE_SHEET_API = 'https://script.google.com/macros/s/AKfycbzgHupxLlNhzSPfJw-CbE4ROsiVqLmNrwIm2MHl4GksxLEjJKIN3Iuk0vWvocQnG-NGYA/exec';

// Configuration
const LINE_CLIENT_ID = '2000478524';
const LINE_CLIENT_SECRET = 'YOUR_LINE_CLIENT_SECRET'; // ใส่ Client Secret จาก LINE Developer Console
const REDIRECT_URI = 'https://store-op.glitch.me/callback.html';
const GOOGLE_SHEET_API = 'YOUR_GOOGLE_SHEET_API_URL';

// Get access token from LINE
async function getAccessToken(code) {
    try {
        const tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            client_id: LINE_CLIENT_ID,
            client_secret: LINE_CLIENT_SECRET
        });

        console.log('Requesting token for code:', code);

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token response error:', errorText);
            throw new Error(`Token error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Token received successfully');
        return data;
    } catch (error) {
        console.error('getAccessToken error:', error);
        throw error;
    }
}

// Get LINE profile with access token
async function getLINEProfile(accessToken) {
    try {
        console.log('Getting LINE profile...');
        const response = await fetch('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Profile response error:', errorText);
            throw new Error(`Profile error: ${response.status}`);
        }

        const profile = await response.json();
        console.log('Profile received:', profile);
        return profile;
    } catch (error) {
        console.error('getLINEProfile error:', error);
        throw error;
    }
}

// Handle LINE Login callback
async function handleCallback(code) {
    try {
        console.log('Starting callback handling with code:', code);

        // Get access token
        const tokenData = await getAccessToken(code);
        console.log('Access token received');

        // Get LINE profile
        const lineProfile = await getLINEProfile(tokenData.access_token);
        console.log('LINE profile received:', lineProfile);

        // For testing/temporary use
        const userData = {
            user_id: lineProfile.userId,
            line_display_name: lineProfile.displayName,
            line_picture_url: lineProfile.pictureUrl,
            active_status: 'Active',
            allowed_pages: JSON.stringify(['overview', 'analytics']),
            role_level: 3
        };

        localStorage.setItem('userSession', JSON.stringify(userData));
        return userData;

    } catch (error) {
        console.error('Callback handling error:', error);
        throw error;
    }
}

// Initialize LINE Login
function initializeLINELogin() {
    try {
        console.log('Initializing LINE Login...');
        const state = generateState();
        localStorage.setItem('loginState', state);
        
        const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code` +
            `&client_id=${LINE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&state=${state}` +
            `&scope=profile%20openid%20email`;
            
        console.log('Redirecting to:', loginUrl);
        window.location.href = loginUrl;
    } catch (error) {
        console.error('Initialize login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Login Error',
            text: 'Unable to initialize login. Please try again.',
            confirmButtonText: 'OK'
        });
    }
}

// Generate random state
function generateState() {
    return Math.random().toString(36).substring(2);
}

// Expose necessary functions
window.handleCallback = handleCallback;
window.initializeLINELogin = initializeLINELogin;