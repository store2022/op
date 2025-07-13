// กำหนดค่าการกำหนดสิทธิ์ของแต่ละหน้า
const pagePermissions = {
    // กำหนดสิทธิ์ตามบทบาท
    roles: {
        admin: ['overview', 'analytics', 'users', 'geography', 'orders', 'notifications', 'settings'],
        manager: ['overview', 'analytics', 'users', 'orders', 'notifications'],
        user: ['overview', 'orders', 'notifications']
    }
};

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
                            <div class="row">
                                <div class="col-md-6 col-lg-3 mb-4">
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">Total Orders</h5>
                                            <p class="card-text h3" id="totalOrders">Loading...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 col-lg-3 mb-4">
                                    <div class="card">
                                        <div class="card-body">
                                            <h5 class="card-title">Revenue</h5>
                                            <p class="card-text h3" id="totalRevenue">Loading...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    // ... (เพิ่มหน้าอื่นๆ ตามต้องการ)
};

// ฟังก์ชั่นจัดการหน้าและการนำทาง
const pageManager = {
    // ตั้งค่าเมนูด้านข้างตามสิทธิ์ของผู้ใช้
    setupSidebarMenu: (userData) => {
        if (!userData || !userData.allowed_pages) return;

        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (!sidebarMenu) return;

        // ซ่อนเมนูทั้งหมดก่อน
        const menuItems = sidebarMenu.querySelectorAll('li');
        menuItems.forEach(item => {
            item.style.display = 'none';
        });

        // แสดงเฉพาะเมนูที่มีสิทธิ์เข้าถึง
        userData.allowed_pages.forEach(pageName => {
            const menuItem = sidebarMenu.querySelector(`[data-page="${pageName}"]`)?.parentElement;
            if (menuItem) {
                menuItem.style.display = 'block';
            }
        });
    },

    // โหลดเนื้อหาของหน้า
    loadPage: async (pageName, userData) => {
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }

            if (!userData?.allowed_pages?.includes(pageName)) {
                // ถ้าไม่มีสิทธิ์เข้าถึงหน้านี้ ให้ไปหน้าแรกที่มีสิทธิ์
                const defaultPage = userData?.allowed_pages?.[0] || 'overview';
                window.location.href = `?page=${defaultPage}`;
                return;
            }

            const pageConfig = pageConfigs[pageName];
            if (!pageConfig) {
                throw new Error('ไม่พบหน้าที่ต้องการ');
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
            const activeMenuItem = document.querySelector(`[data-page="${pageName}"]`);
            if (activeMenuItem) {
                activeMenuItem.parentElement.classList.add('active');
            }

            // เริ่มการทำงานเฉพาะของแต่ละหน้า
            await pageManager.initializePage(pageName);

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการโหลดหน้า:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดหน้าได้ กรุณาลองใหม่อีกครั้ง',
            });
        }
    },

    // เริ่มการทำงานเฉพาะของแต่ละหน้า
    initializePage: async (pageName) => {
        switch (pageName) {
            case 'analytics':
                await initializeAnalytics();
                break;
            case 'users':
                await initializeUserTable();
                break;
            // เพิ่มการทำงานของหน้าอื่นๆ ตามต้องการ
        }
    }
};

// นำออกไปใช้งาน
export { pageConfigs, pagePermissions, pageManager };