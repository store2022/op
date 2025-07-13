const API_URL = "https://script.google.com/macros/s/AKfycbz6FJmrYXJNwTKlJqYuq7QaeyBSsvQ8_aQ_DAaB4YPV-fFQ6afyDzvSBTWc_EiSE72E9Q/exec";
let dataTable;
let auditUploader;
let updateUploader;

// เมื่อเอกสารโหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    // เพิ่ม CSS สำหรับปุ่มบนมือถือ
    addMobileButtonStyles();

    // ตรวจจับเปลี่ยนแปลง select ประเภท
    document.getElementById('typeSelect').addEventListener('change', function() {
        let repairButton = document.getElementById('repairButtonContainer');
        if (this.value === 'ซ่อมแซม') {
            repairButton.style.display = 'block';
        } else {
            repairButton.style.display = 'none';
        }
    });
});

// Image Uploader Class
class ImageUploader {
    constructor(containerId, buttonId, maxImages = 4) {
        this.container = document.getElementById(containerId);
        this.addButton = document.getElementById(buttonId);
        this.maxImages = maxImages;
        this.currentImages = 0;
        this.images = new Map();
        
        this.init();
    }

    init() {
        this.addButton.addEventListener('click', () => this.createImageInput());
    }

    createImageInput() {
        if (this.currentImages >= this.maxImages) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่สามารถเพิ่มรูปได้',
                text: 'คุณสามารถอัพโหลดได้สูงสุด 4 รูปเท่านั้น'
            });
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.addEventListener('change', (e) => this.handleImageSelect(e));
        input.click();
    }

    async handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'ไฟล์ไม่ถูกต้อง',
                text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น'
            });
            return;
        }

        try {
            const resizedImage = await this.resizeImage(file);
            const imageId = Date.now().toString();
            this.addImagePreview(imageId, resizedImage);
            this.images.set(imageId, resizedImage);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถประมวลผลรูปภาพได้'
            });
        }
    }

    addImagePreview(imageId, blob) {
        const div = document.createElement('div');
        div.className = 'img-preview m-2 position-relative';
        
        const imageUrl = URL.createObjectURL(blob);
        
        div.innerHTML = `
            <img src="${imageUrl}" class="img-fluid" style="max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <button type="button" class="btn btn-sm btn-danger position-absolute" style="top: 0; right: 0; padding: 0.25rem 0.5rem; border-radius: 50%;">
                ×
            </button>
        `;
        
        div.querySelector('button').addEventListener('click', () => this.removeImage(imageId, div));
        
        this.container.appendChild(div);
        this.currentImages++;
        this.updateCounter();
    }
    
    removeImage(imageId, element) {
        this.images.delete(imageId);
        element.remove();
        this.currentImages--;
        this.updateCounter();
    }
    
    updateCounter() {
        this.addButton.disabled = this.currentImages >= this.maxImages;
        if (this.currentImages >= this.maxImages) {
            this.addButton.classList.add('disabled');
        } else {
            this.addButton.classList.remove('disabled');
        }
    }
    
    async resizeImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    const maxSize = 800;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.7);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    getAllImages() {
        return Array.from(this.images.values());
    }

    clear() {
        this.images.clear();
        this.container.innerHTML = '';
        this.currentImages = 0;
        this.updateCounter();
    }
}

// Initialize on document ready
$(document).ready(function() {
    // Create image uploaders
    auditUploader = new ImageUploader('image-preview-container', 'add-image');
    updateUploader = new ImageUploader('update-image-preview', 'add-update-image');

    // Initialize DataTable - แก้ไขให้เรียบง่ายขึ้น
// Initialize DataTable with SearchPanes
dataTable = $('#data-table').DataTable({
    scrollCollapse: true,
    scroller: true,
    scrollY: 400,
    dom: 'BPfrtip', // Add buttons (B) and searchPanes (P) to the layout
   
  searchPanes: {        
        columns: [1, 2, 4, 5] // Enable searchPanes on Status, Area, Type, Urgency, Date columns
    },
    language: {
        searchPanes: {
            clearMessage: 'ล้างตัวเลือกทั้งหมด',
            collapse: { 0: 'ตัวเลือกการค้นหา', _: 'ตัวเลือกการค้นหา (%d)' },
            count: '{total}',
            countFiltered: '{shown} ({total})',
            title: {
                _: 'ตัวกรองที่เลือก - %d',
                0: 'ไม่มีตัวกรองที่เลือก'
            }
        },
        search: "ค้นหา:",
        lengthMenu: "แสดง _MENU_ รายการ",
        info: "แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ",
        paginate: {
            first: "หน้าแรก",
            last: "หน้าสุดท้าย",
            next: "ถัดไป",
            previous: "ก่อนหน้า"
        }
    },
   
    ajax: {
        url: API_URL,
        data: { action: "read", table: "5s_audit" },
        dataSrc: 'data'
    },
    columns: [
        { 
            data: null,
            render: function(data) {
                return createImageGallery(data);
            }
        },
        {
            data: "Status",
            render: function(data) {
                return `<span class="badge badge-${getStatusBadgeClass(data)}">${data}</span>`;
            }
        },
        { data: "Area" },
        { data: "Title" },
        { data: "Type" },
        {
            data: "urgency",
            render: function(data) {
                let badgeClass = (data === 'urgent') ? 'badge-danger' : 'badge-secondary';
                return `<span class="badge ${badgeClass}">${data}</span>`;
            }
        },
        { 
            data: "Date",
            render: function(data) {
                return new Date(data).toLocaleDateString('th-TH');
            }
        },
        {
            data: null,
            className: 'action-buttons',
            render: function(data) {
                let buttons = '';
                
                if (!data.refer_5s_improve) {
                    buttons += `<button class="btn btn-sm btn-primary improve-btn mb-1" data-id="${data.id_5s_audit}">ผู้รับผิดชอบ</button>`;
                } else if (data.Status === 'In Progress') {
                    buttons += `<button class="btn btn-sm btn-info update-btn mb-1" data-id="${data.refer_5s_improve}" data-audit="${data.id_5s_audit}">ส่งงาน</button>`;
                } else if (data.Status === 'Checker') {
                    buttons += `<button class="btn btn-sm btn-warning check-btn mb-1" data-improve="${data.refer_5s_improve}" data-audit="${data.id_5s_audit}">ตรวจงาน</button>`;
                }
                
                return buttons;
            }
        }
    ],
    lengthMenu: [
        [100, -1],
        [100, "All"],
    ],
    order: [[6, 'desc']],
    select: true
});

    // แก้ไขปัญหาปุ่มไม่ตอบสนองบนมือถือ
    $(document).on('click', '.action-buttons button', function(e) {
        e.stopPropagation();
    });

    // ทำให้แน่ใจว่าการคลิกที่ปุ่มจะทำงานได้ถูกต้อง
    $('#data-table').on('click', 'button.improve-btn', function(e) {
        e.stopPropagation();
        const id = $(this).data('id');
        handleImproveButton(id);
    });

    $('#data-table').on('click', 'button.update-btn', function(e) {
        e.stopPropagation();
        const improveId = $(this).data('id');
        const auditId = $(this).data('audit');
        handleUpdateButton(improveId, auditId);
    });

    $('#data-table').on('click', 'button.check-btn', function(e) {
        e.stopPropagation();
        const auditId = $(this).data('audit');
        const improveId = $(this).data('improve');
        handleCheckButton(auditId, improveId);
    });

    // Initial button handlers
    $('#btn-add').click(function() {
        auditUploader.clear();
        $('#form-audit')[0].reset();
        $('#modal-audit').modal('show');
    });

    // Approve/Reject button handlers
    $('#btn-approve').click(function() {
        handleCheckDecision('approved');
    });

    $('#btn-reject').click(function() {
        handleCheckDecision('rejected');
    });

    // Form submit handlers
    $('#form-audit').on('submit', async function(e) {
        e.preventDefault();
        await submitForm(this, 'audit', auditUploader);
    });

    $('#form-improve').on('submit', async function(e) {
        e.preventDefault();
        await submitForm(this, 'improve');
    });

    $('#form-update').on('submit', async function(e) {
        e.preventDefault();
        await handleUpdateSubmit(this, updateUploader);
    });
});

// เพิ่ม CSS สำหรับปุ่มบนมือถือ
function addMobileButtonStyles() {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
        @media (max-width: 767px) {
            .action-buttons {
                min-width: 110px;
                white-space: nowrap;
            }
            
            .action-buttons button {
                margin-bottom: 5px;
                display: block;
                width: 100%;
            }
            
            /* ปรับความกว้างของปุ่มบนหน้าจอขนาดเล็กมาก */
            @media (max-width: 450px) {
                .action-buttons {
                    min-width: 90px;
                }
                
                .btn-sm {
                    padding: 0.3rem 0.5rem;
                    font-size: 0.8rem;
                }
            }
            
            /* ซ่อนไอคอน + ของ responsive table บนปุ่ม */
            table.dataTable.dtr-inline.collapsed>tbody>tr>td.action-buttons:before,
            table.dataTable.dtr-inline.collapsed>tbody>tr>th.action-buttons:before {
                display: none !important;
            }
            
            /* ทำให้แน่ใจว่าคอลัมน์ปุ่มไม่ถูกซ่อนเมื่อหน้าจอเล็ก */
            .dtr-details .action-buttons {
                display: block !important;
                width: 100%;
            }
            
            /* กำหนดขนาดพื้นที่สัมผัสให้พอเหมาะกับนิ้ว */
            .btn-sm {
                padding: 0.4rem 0.7rem;
                font-size: 0.9rem;
            }
        }
    `;
    document.head.appendChild(styleElement);
}

// ฟังก์ชันการจัดการปุ่มต่างๆ
async function handleImproveButton(id) {
    $('#refer_5s_audit').val(id);
    $('#form-improve')[0].reset();

    try {
        // Show loading message
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // ดึงข้อมูลจาก 5s_audit
        const response = await $.ajax({
            url: API_URL,
            data: {
                action: 'read_single',
                table: '5s_audit',
                id_5s_audit: id
            }
        });

        if (!response.success) {
            throw new Error(response.error || 'ไม่สามารถดึงข้อมูลได้');
        }

        const data = response.data;

        // แสดงข้อมูลในตาราง
        $('#improve-area').text(data.Area || '-');
        $('#improve-type').text(data.Type || '-');
        $('#improve-title').text(data.Title || '-');
        $('#improve-description').text(data.Improve || '-');
        $('#improve-urgency').html(`<span class="badge badge-${data.urgency === 'urgent' ? 'urgent' : 'normal'}">${data.urgency}</span>`);
        $('#improve-reporter').text(data.Sign || '-');
        $('#improve-date').text(data.Date ? new Date(data.Date).toLocaleDateString('th-TH') : '-');

        // แสดงรูปภาพ
        const images = [data.Picture1, data.Picture2, data.Picture3, data.Picture4].filter(url => url);
        displayImagesInImprove('improve-images', images);

        // Close loading and show modal
        Swal.close();
        $('#modal-improve').modal('show');
    } catch (error) {
        console.error('Error in improve button handler:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถดึงข้อมูลได้'
        });
    }
}

async function handleUpdateButton(improveId, auditId) {
    try {
        // Show loading message
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        if (!improveId || !auditId) {
            throw new Error('ไม่พบข้อมูลที่ต้องการอัพเดท');
        }

        // กำหนดค่า ID ให้กับ input hidden
        $('#update_refer_5s_audit').val(auditId);
        $('#update_refer_5s_improve').val(improveId);
        
        // รีเซ็ตฟอร์มและ image uploader
        $('#form-update')[0].reset();
        updateUploader.clear();

        // ดึงข้อมูลจากทั้งสองตาราง
        const [auditResponse, improveResponse] = await Promise.all([
            $.ajax({
                url: API_URL,
                data: { 
                    action: 'read_single', 
                    table: '5s_audit',
                    id_5s_audit: auditId 
                }
            }),
            $.ajax({
                url: API_URL,
                data: { 
                    action: 'read_single', 
                    table: '5s_improve',
                    id_5s_improve: improveId 
                }
            })
        ]);

        if (!auditResponse.success || !improveResponse.success) {
            throw new Error('ไม่สามารถดึงข้อมูลได้');
        }

        const auditData = auditResponse.data;
        const improveData = improveResponse.data;

        // แสดงข้อมูลการแจ้ง
        $('#update-area').text(auditData.Area || '-');
        $('#update-type').text(auditData.Type || '-');
        $('#update-title').text(auditData.Title || '-');
        $('#update-improve').text(auditData.Improve || '-');
        $('#update-urgency').html(`<span class="badge badge-${auditData.urgency === 'urgent' ? 'urgent' : 'normal'}">${auditData.urgency}</span>`);
        $('#update-reporter').text(auditData.Sign || '-');
        $('#update-date').text(auditData.Date ? new Date(auditData.Date).toLocaleDateString('th-TH') : '-');

        // แสดงข้อมูลการดำเนินการ
        $('#update-responsible').text(improveData.responsible || '-');
        $('#update-due-date').text(improveData.Due_date ? new Date(improveData.Due_date).toLocaleDateString('th-TH') : '-');

        // แสดงรูปภาพที่แจ้ง
        const notifyImages = [auditData.Picture1, auditData.Picture2, auditData.Picture3, auditData.Picture4].filter(url => url);
        displayImagesInUpdate('update-notify-images', notifyImages);
        
        // Close loading and show modal
        Swal.close();
        $('#modal-update').modal('show');
        
    } catch (error) {
        console.error('Error in update button handler:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเปิดฟอร์มอัพเดทได้'
        });
    }
}

async function handleCheckButton(auditId, improveId) {
    try {
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const [auditResponse, improveResponse] = await Promise.all([
            $.ajax({
                url: API_URL,
                data: { 
                    action: 'read_single', 
                    table: '5s_audit',
                    id_5s_audit: auditId 
                }
            }),
            $.ajax({
                url: API_URL,
                data: { 
                    action: 'read_single', 
                    table: '5s_improve',
                    id_5s_improve: improveId 
                }
            })
        ]);

        if (!auditResponse.success || !improveResponse.success) {
            throw new Error(auditResponse.error || improveResponse.error || 'ไม่สามารถดึงข้อมูลได้');
        }

        const audit = auditResponse.data;
        const improve = improveResponse.data;

        $('#modal-check')
            .data('audit-id', auditId)
            .data('improve-id', improveId);

        $('#check-area').text(audit.Area || '');
        $('#check-type').text(audit.Type || '');
        $('#check-title').text(audit.Title || '');
        $('#check-improve').text(audit.Improve || '');
        $('#check-urgency').text(audit.urgency || '');
        $('#check-reporter').text(audit.Sign || '');
        $('#check-date').text(audit.Date ? new Date(audit.Date).toLocaleDateString('th-TH') : '');
        
        $('#check-responsible').text(improve.responsible || '');
        $('#check-due-date').text(improve.Due_date ? new Date(improve.Due_date).toLocaleDateString('th-TH') : '');
        $('#check-note').text(improve.note || '');

        const beforeImages = [audit.Picture1, audit.Picture2, audit.Picture3, audit.Picture4].filter(url => url);
        const afterImages = [improve.Picture1, improve.Picture2, improve.Picture3, improve.Picture4].filter(url => url);
        
        displayImagesInCheck('check-before-images', beforeImages);
        displayImagesInCheck('check-after-images', afterImages);

        Swal.close();
        $('#modal-check').modal('show');
        
    } catch (error) {
        console.error('Error in check button handler:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถดึงข้อมูลได้'
        });
    }
}

// รูปแบบการทำงานเดิมที่ไม่มีประสิทธิภาพเพียงพอ
function bindButtonHandlers() {
    // ไม่ต้องใช้ฟังก์ชันนี้แล้ว เพราะเราใช้วิธีการผูก event ที่ดีกว่าแล้ว
    // แต่ยังเก็บไว้เพื่อเข้ากับโค้ดเดิม
}

// Helper Functions
function displayImagesInCheck(containerId, images) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.filter(url => url).forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'p-1';
        imgDiv.innerHTML = `
            <img src="${url}" class="img-fluid" style="max-height: 200px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;" onclick="showFullImage('${url}')">
        `;
        container.appendChild(imgDiv);
    });
}

function displayImagesInUpdate(containerId, images) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'p-1';
        imgDiv.innerHTML = `
            <img src="${url}" class="img-fluid" style="max-height: 200px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;" onclick="showFullImage('${url}')">
        `;
        container.appendChild(imgDiv);
    });
}

function displayImagesInImprove(containerId, images) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'p-1';
        imgDiv.innerHTML = `
            <img src="${url}" class="img-fluid" style="max-height: 200px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;" onclick="showFullImage('${url}')">
        `;
        container.appendChild(imgDiv);
    });
}

function displayImagesInDetails(containerId, images) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    images.forEach(url => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'p-1';
        imgDiv.innerHTML = `
            <img src="${url}" class="img-fluid" style="max-height: 200px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;" onclick="showFullImage('${url}')">
        `;
        container.appendChild(imgDiv);
    });
}

function getStatusBadgeClass(status) {
    const classes = {
        'New': 'primary',
        'In Progress': 'warning',
        'Completed': 'success',
        'Rejected': 'danger',
        'Checker': 'info'
    };
    return classes[status] || 'secondary';
}

// Update image gallery click handler
function createImageGallery(data) {
    const images = [data.Picture1, data.Picture2, data.Picture3, data.Picture4]
        .filter(url => url);
    
    if (images.length === 0) return '';
    
    return `
        <div class="image-gallery" onclick="showDetails('${data.id_5s_audit}')">
            <img src="${images[0]}" class="main-thumbnail" style="width:60px; height:60px; object-fit:cover; border-radius:4px; cursor:pointer">
            ${images.length > 1 ? `<span class="image-count">+${images.length - 1}</span>` : ''}
        </div>
    `;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Function to show details
async function showDetails(auditId) {
    try {
        Swal.fire({
            title: 'กำลังโหลดข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Fetch audit data
        const auditResponse = await $.ajax({
            url: API_URL,
            data: { 
                action: 'read_single', 
                table: '5s_audit',
                id_5s_audit: auditId 
            }
        });

        if (!auditResponse.success) {
            throw new Error(auditResponse.error || 'ไม่สามารถดึงข้อมูลได้');
        }

        const audit = auditResponse.data;

        // Fetch improve data if exists
        let improve = null;
        if (audit.refer_5s_improve) {
            const improveResponse = await $.ajax({
                url: API_URL,
                data: { 
                    action: 'read_single', 
                    table: '5s_improve',
                    id_5s_improve: audit.refer_5s_improve 
                }
            });
            
            if (improveResponse.success) {
                improve = improveResponse.data;
            }
        }

        // Populate audit data
        $('#detail-area').text(audit.Area || '-');
        $('#detail-type').text(audit.Type || '-');
        $('#detail-title').text(audit.Title || '-');
        $('#detail-improve').text(audit.Improve || '-');
        $('#detail-urgency').text(audit.urgency || '-');
        $('#detail-reporter').text(audit.Sign || '-');
        $('#detail-date').text(audit.Date ? new Date(audit.Date).toLocaleDateString('th-TH') : '-');
        $('#detail-status').html(`<span class="badge badge-${getStatusBadgeClass(audit.Status)}">${audit.Status}</span>`);

        // Populate improve data if exists
        $('#detail-responsible').text(improve?.responsible || '-');
        $('#detail-due-date').text(improve?.Due_date ? new Date(improve.Due_date).toLocaleDateString('th-TH') : '-');
        $('#detail-note').text(improve?.note || '-');
        $('#detail-sign').text(improve?.Sign || '-');
        $('#detail-complete-date').text(improve?.Comple_date ? new Date(improve.Comple_date).toLocaleDateString('th-TH') : '-');

        // Display images
        const beforeImages = [audit.Picture1, audit.Picture2, audit.Picture3, audit.Picture4].filter(url => url);
        const afterImages = improve ? [improve.Picture1, improve.Picture2, improve.Picture3, improve.Picture4].filter(url => url) : [];
        
        displayImagesInDetails('detail-before-images', beforeImages);
        displayImagesInDetails('detail-after-images', afterImages);

        Swal.close();
        $('#modal-details').modal('show');
        
    } catch (error) {
        console.error('Error in showDetails:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถดึงข้อมูลได้'
        });
    }
}

function showFullImage(url) {
    Swal.fire({
        imageUrl: url,
        imageAlt: 'Full size image',
        width: '80%',
        showConfirmButton: false,
        showCloseButton: true
    });
}

async function handleCheckDecision(decision) {
    try {
        const auditId = $('#modal-check').data('audit-id');
        const improveId = $('#modal-check').data('improve-id');
        
        if (!auditId || !improveId) {
            throw new Error('ข้อมูลไม่ครบถ้วน');
        }
        
        Swal.fire({
            title: 'กำลังบันทึกข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await $.ajax({
            url: API_URL,
            type: 'POST',
            data: {
                action: 'check_decision',
                table: '5s_improve',
                id_5s_improve: improveId,
                id_5s_audit: auditId,
                approval: decision === 'approved' ? 'approval' : 'rejection',
                Comple_date: new Date().toISOString()
            }
        });

        if (response.success) {
            $('#modal-check').modal('hide');
            
            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: `${decision === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}รายการเรียบร้อยแล้ว`,
                showConfirmButton: false,
                timer: 1500
            });

            dataTable.ajax.reload();
        } else {
            throw new Error(response.error || 'ไม่สามารถบันทึกผลการตรวจสอบได้');
        }
    } catch (error) {
        console.error('Error in handleCheckDecision:', error);
        await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถบันทึกผลการตรวจสอบได้'
        });
    }
}

async function handleUpdateSubmit(form, imageUploader) {
    try {
        // แสดง loading
        Swal.fire({
            title: 'กำลังบันทึกข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // เก็บข้อมูลจากฟอร์ม
        const formData = new FormData(form);
        const formObject = {};
        
        for (const [key, value] of formData.entries()) {
            formObject[key] = value;
        }

        // ตรวจสอบว่ามี ID ครบไหม
        if (!formObject.refer_5s_audit || !formObject.refer_5s_improve) {
            throw new Error('ข้อมูลไม่ครบถ้วน');
        }

        // จัดการรูปภาพ
        const images = imageUploader.getAllImages();
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const base64 = await fileToBase64(images[i]);
                formObject[`Picture${i + 1}`] = base64;
            }
        }

        // ส่งข้อมูลไปยัง API
        const response = await $.ajax({
            url: API_URL,
            type: "POST",
            data: {
                ...formObject,
                action: "update",
                table: "5s_improve"
            }
        });

        if (response.success) {
            $('#modal-update').modal('hide');
            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
                showConfirmButton: false,
                timer: 1500
            });
            dataTable.ajax.reload();
        } else {
            throw new Error(response.error || "ไม่สามารถบันทึกข้อมูลได้");
        }
    } catch (error) {
        console.error('Error in handleUpdateSubmit:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถบันทึกข้อมูลได้'
        });
    }
}

async function submitForm(form, type, imageUploader = null) {
    try {
        Swal.fire({
            title: 'กำลังบันทึกข้อมูล',
            text: 'กรุณารอสักครู่...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData(form);
        const formObject = Object.fromEntries(formData.entries());

        if (imageUploader) {
            const images = imageUploader.getAllImages();
            for (let i = 0; i < images.length; i++) {
                const base64 = await fileToBase64(images[i]);
                formObject[`Picture${i + 1}`] = base64;
            }
        }

        formObject.action = "insert";
        formObject.table = type === 'audit' ? "5s_audit" : "5s_improve";

        const response = await $.ajax({
            url: API_URL,
            type: "POST",
            data: formObject,
            dataType: "json"
        });

        if (response.success) {
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'บันทึกข้อมูลเรียบร้อยแล้ว',
                showConfirmButton: false,
                timer: 1500
            });
            
            $(`#modal-${type}`).modal('hide');
            dataTable.ajax.reload();
        } else {
            throw new Error(response.error || "ไม่สามารถบันทึกข้อมูลได้");
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        });
    }
}