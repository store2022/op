// กำหนดค่าของแต่ละหน้า
const pageConfigs = {
    overview: {
        title: 'Dashboard Overview',
        icon: 'fas fa-home',
        content: `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <h2>Welcome to Dashboard</h2>
                        <p>Select an option from the sidebar to get started.</p>
                        <iframe src="Notification.html" width="100%" height="500px" style="border:none;"></iframe>
                    </div>
                </div>
            </div>
        `
    },
    analytics: {
        title: 'Analytics',
        icon: 'fas fa-chart-line',
        content: `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <h2>Analytics</h2>
                        <div id="analyticsContent">
                            <!-- เนื้อหาหน้า Analytics -->
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    users: {
        title: 'User Management',
        icon: 'fas fa-users',
        content: `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <h2>User Management</h2>
                        <!-- เนื้อหาหน้า Users -->
                    </div>
                </div>
            </div>
        `
    },
    // เพิ่มหน้าอื่นๆ ตามต้องการ
};

// ฟังก์ชันจัดการหน้าและการนำทาง
const pageManager = {
    // ตั้งค่าเมนูด้านข้างตามสิทธิ์ของผู้ใช้
    setupSidebarMenu: (userData) => {
        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (!sidebarMenu) return;

        // แปลงสตริง allowed_pages เป็น array ถ้าจำเป็น
        let allowedPages = [];
        try {
            if (typeof userData.allowed_pages === 'string') {
                allowedPages = JSON.parse(userData.allowed_pages);
            } else if (Array.isArray(userData.allowed_pages)) {
                allowedPages = userData.allowed_pages;
            }
        } catch (error) {
            console.error('Error parsing allowed pages:', error);
            allowedPages = [];
        }

        console.log('Allowed pages:', allowedPages);

        // จัดการการแสดงเมนู
        const menuItems = sidebarMenu.querySelectorAll('li');
        menuItems.forEach(item => {
            const link = item.querySelector('a');
            if (!link) return;

            const pageName = link.getAttribute('data-page');
            if (allowedPages.includes(pageName)) {
                item.style.display = ''; // แสดงเมนู
            } else {
                item.style.display = 'none'; // ซ่อนเมนู
            }
        });
    },

    // โหลดเนื้อหาของหน้า
    loadPage: async (pageName, userData) => {
        try {
            // ตรวจสอบการล็อกอิน
            if (!liff.isLoggedIn()) {
                console.log('User not logged in, redirecting to login...');
                liff.login();
                return;
            }

            // แปลงสตริง allowed_pages เป็น array
            let allowedPages = [];
            try {
                if (typeof userData.allowed_pages === 'string') {
                    allowedPages = JSON.parse(userData.allowed_pages);
                } else if (Array.isArray(userData.allowed_pages)) {
                    allowedPages = userData.allowed_pages;
                }
            } catch (error) {
                console.error('Error parsing allowed pages:', error);
                allowedPages = [];
            }

            // ตรวจสอบสิทธิ์การเข้าถึง
            if (!allowedPages.includes(pageName)) {
                console.log('Access denied for page:', pageName);
                const defaultPage = allowedPages[0] || 'overview';
                if (pageName !== defaultPage) {
                    window.location.href = `?page=${defaultPage}`;
                }
                return;
            }

            const pageConfig = pageConfigs[pageName];
            if (!pageConfig) {
                console.error('Page not found:', pageName);
                return;
            }

            // อัพเดทหัวข้อและเนื้อหา
            document.title = `${pageConfig.title} - Dashboard`;
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.innerHTML = pageConfig.content;
            }

            // อัพเดทเมนูที่เลือก
            document.querySelectorAll('.sidebar-menu li').forEach(item => {
                item.classList.remove('active');
            });
            const activeMenuItem = document.querySelector(`[data-page="${pageName}"]`)?.parentElement;
            if (activeMenuItem) {
                activeMenuItem.classList.add('active');
            }

            console.log('Page loaded successfully:', pageName);
        } catch (error) {
            console.error('Error loading page:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดหน้าได้ กรุณาลองใหม่อีกครั้ง'
            });
        }
    }
};

// ฟังก์ชั่นสำหรับการนำทางไปยังหน้าต่างๆ
async function navigateTo(pageName) {
    try {
        // ตรวจสอบการล็อกอิน LIFF
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        const profile = await liff.getProfile();
        const API_URL = 'https://script.google.com/macros/s/AKfycbx2y-FY8VEyZrlne9DDBzShsxU0vCoqqi9r-iyp3z8x3RmxEuUbJF3IluI7LVGSLos0/exec';
        
        // เรียกข้อมูลผู้ใช้จาก Google Sheets
        const response = await fetch(`${API_URL}?userId=${profile.userId}&callback=handleUserData`);
        const text = await response.text();
        const json = JSON.parse(text.replace(/^handleUserData\((.*)\)$/, '$1'));
        
        if (json.exists && json.data.active_status === 'Active') {
            await pageManager.loadPage(pageName, json.data);
        } else {
            console.error('User not found or inactive');
            if (liff.isLoggedIn()) {
                liff.logout();
            }
        }
        
    } catch (error) {
        console.error('Navigation error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถนำทางไปยังหน้าที่ต้องการ กรุณาลองใหม่อีกครั้ง'
        });
    }
}

// นำออกไปใช้งาน
export { pageConfigs, pageManager, navigateTo };