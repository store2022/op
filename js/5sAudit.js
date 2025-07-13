// ModalManager Class
class ModalManager {
    constructor() {
        this.modals = {};
        this.initializeModals();
    }

    createModal(id, config) {
        const modalElement = document.createElement('div');
        modalElement.className = 'modal fade';
        modalElement.id = `modal-${id}`;
        modalElement.setAttribute('tabindex', '-1');
        modalElement.setAttribute('role', 'dialog');
        
        modalElement.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${config.title}</h5>
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${document.querySelector(config.template)?.innerHTML || ''}
                    </div>
                    <div class="modal-footer">
                        ${config.buttons.map(btn => `
                            <button type="${btn.type}" 
                                    class="btn ${btn.class}"
                                    ${btn.id ? `id="${btn.id}"` : ''}
                                    ${btn.dismiss ? 'data-dismiss="modal"' : ''}>
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalElement);
        this.modals[id] = { element: modalElement, config };

        // Initialize form handlers if form exists
        if (modalElement.querySelector('form')) {
            this.initializeFormHandler(id);
        }

        // Initialize Bootstrap modal
        $(`#modal-${id}`).modal({
            backdrop: 'static',
            keyboard: false,
            show: false
        });

        // Initialize specific modal handlers
        switch (id) {
            case 'audit':
                this.initializeAuditModal(modalElement);
                break;
            case 'improve':
                this.initializeImproveModal(modalElement);
                break;
            case 'update':
                this.initializeUpdateModal(modalElement);
                break;
            case 'check':
                this.initializeCheckModal(modalElement);
                break;
        }

        return modalElement;
    }

    initializeAuditModal(modal) {
        new ImageHandler('image-preview-container', 'add-image');
    }

    initializeImproveModal(modal) {
        // Initialize improve-specific functionality
        const infoSection = modal.querySelector('#improve-info');
        if (infoSection) {
            infoSection.innerHTML = '<table class="table table-sm"></table>';
        }
    }

    initializeUpdateModal(modal) {
        new ImageHandler('update-image-preview', 'add-update-image');
        const updateInfo = modal.querySelector('#update-info');
        if (updateInfo) {
            updateInfo.innerHTML = '<table class="table table-sm"></table>';
        }
    }

    initializeCheckModal(modal) {
        // Add check modal specific initialization
        const approveBtn = modal.querySelector('#btn-approve');
        const rejectBtn = modal.querySelector('#btn-reject');

        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                const data = this.getModalData('check');
                this.handleCheckDecision('approve', data);
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                const data = this.getModalData('check');
                this.handleCheckDecision('reject', data);
            });
        }
    }

    getModalData(id) {
        const modal = this.modals[id].element;
        const form = modal.querySelector('form');
        if (!form) return {};

        const formData = new FormData(form);
        return Object.fromEntries(formData.entries());
    }

    async showModal(id, data = {}) {
        const modal = this.modals[id];
        if (!modal) {
            console.error(`Modal ${id} not found`);
            return;
        }

        try {
            // Clear previous form data
            const form = modal.element.querySelector('form');
            if (form) {
                form.reset();
            }

            // Clear previous image previews
            const imagePreviews = modal.element.querySelectorAll('.img-preview');
            imagePreviews.forEach(preview => preview.remove());

            // Populate modal with new data
            await this.populateModal(id, data);

            // Show modal
            $(`#modal-${id}`).modal('show');
        } catch (error) {
            console.error(`Error showing modal ${id}:`, error);
            Utils.showError('เกิดข้อผิดพลาดในการแสดง Modal');
        }
    }

    async populateModal(id, data) {
        const modal = this.modals[id].element;
        
        switch(id) {
            case 'improve':
                await this.populateImproveModal(modal, data);
                break;
            case 'update':
                await this.populateUpdateModal(modal, data);
                break;
            case 'check':
                await this.populateCheckModal(modal, data);
                break;
        }
    }

    async populateImproveModal(modal, data) {
        try {
            const auditData = await Utils.handleAPI('read_single', {
                table: '5s_audit',
                id_5s_audit: data.id
            });

            modal.querySelector('#refer_5s_audit').value = data.id;

            const infoTable = modal.querySelector('#improve-info table');
            if (infoTable) {
                const tableData = {
                    'พื้นที่': auditData.data.Area,
                    'ประเภท': auditData.data.Type,
                    'รายละเอียดปัญหา': auditData.data.Title,
                    'การปรับปรุง': auditData.data.Improve || '-',
                    'ความเร่งด่วน': Utils.formatBadge('urgency', auditData.data.urgency),
                    'ผู้แจ้ง': auditData.data.Sign,
                    'วันที่แจ้ง': Utils.formatDate(auditData.data.Date)
                };
                Utils.populateTable(infoTable, tableData);
            }

            const images = [
                auditData.data.Picture1,
                auditData.data.Picture2,
                auditData.data.Picture3,
                auditData.data.Picture4
            ].filter(Boolean);

            Utils.displayImages('improve-images', images);
        } catch (error) {
            console.error('Error populating improve modal:', error);
            Utils.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    }

    async populateUpdateModal(modal, data) {
        try {
            const [auditData, improveData] = await Promise.all([
                Utils.handleAPI('read_single', {
                    table: '5s_audit',
                    id_5s_audit: data.auditId
                }),
                Utils.handleAPI('read_single', {
                    table: '5s_improve',
                    id_5s_improve: data.improveId
                })
            ]);

            modal.querySelector('#update_refer_5s_audit').value = data.auditId;
            modal.querySelector('#update_refer_5s_improve').value = data.improveId;

            const updateInfo = modal.querySelector('#update-info table');
            if (updateInfo) {
                const tableData = {
                    'พื้นที่': auditData.data.Area,
                    'ประเภท': auditData.data.Type,
                    'รายละเอียดปัญหา': auditData.data.Title,
                    'การปรับปรุง': auditData.data.Improve || '-',
                    'ความเร่งด่วน': Utils.formatBadge('urgency', auditData.data.urgency),
                    'ผู้รับผิดชอบ': improveData.data.responsible,
                    'กำหนดเสร็จ': Utils.formatDate(improveData.data.Due_date)
                };
                Utils.populateTable(updateInfo, tableData);
            }

            const images = [
                auditData.data.Picture1,
                auditData.data.Picture2,
                auditData.data.Picture3,
                auditData.data.Picture4
            ].filter(Boolean);

            Utils.displayImages('update-images', images);
        } catch (error) {
            console.error('Error populating update modal:', error);
            Utils.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    }

    async populateCheckModal(modal, data) {
        try {
            const [auditData, improveData] = await Promise.all([
                Utils.handleAPI('read_single', {
                    table: '5s_audit',
                    id_5s_audit: data.auditId
                }),
                Utils.handleAPI('read_single', {
                    table: '5s_improve',
                    id_5s_improve: data.improveId
                })
            ]);

            // Set hidden inputs
            modal.querySelector('#check_refer_5s_audit').value = data.auditId;
            modal.querySelector('#check_refer_5s_improve').value = data.improveId;

            // Populate audit info
            const auditInfo = modal.querySelector('#check-audit-info');
            if (auditInfo) {
                const auditTableData = {
                    'พื้นที่': auditData.data.Area,
                    'ประเภท': auditData.data.Type,
                    'รายละเอียดปัญหา': auditData.data.Title,
                    'การปรับปรุง': auditData.data.Improve || '-',
                    'ความเร่งด่วน': Utils.formatBadge('urgency', auditData.data.urgency),
                    'ผู้แจ้ง': auditData.data.Sign,
                    'วันที่แจ้ง': Utils.formatDate(auditData.data.Date)
                };
                Utils.populateTable(auditInfo, auditTableData);
            }

            // Populate improve info
            const improveInfo = modal.querySelector('#check-improve-info');
            if (improveInfo) {
                const improveTableData = {
                    'ผู้รับผิดชอบ': improveData.data.responsible,
                    'กำหนดเสร็จ': Utils.formatDate(improveData.data.Due_date),
                    'หมายเหตุ': improveData.data.note || '-'
                };
                Utils.populateTable(improveInfo, improveTableData);
            }

            // Display before and after images
            const beforeImages = [
                auditData.data.Picture1,
                auditData.data.Picture2,
                auditData.data.Picture3,
                auditData.data.Picture4
            ].filter(Boolean);

            const afterImages = [
                improveData.data.Picture1,
                improveData.data.Picture2,
                improveData.data.Picture3,
                improveData.data.Picture4
            ].filter(Boolean);

            Utils.displayImages('check-before-images', beforeImages);
            Utils.displayImages('check-after-images', afterImages);

        } catch (error) {
            console.error('Error populating check modal:', error);
            Utils.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    }

    async handleCheckDecision(decision, data) {
        try {
            const confirmMessage = decision === 'approve' 
                ? 'ยืนยันการอนุมัติ?' 
                : 'ยืนยันการไม่อนุมัติ?';

            const confirmed = await Utils.showConfirm(confirmMessage);
            if (!confirmed) return;

            Utils.showLoading();

            const response = await Utils.handleAPI('check_decision', {
                id_5s_audit: data.auditId,
                id_5s_improve: data.improveId,
                decision: decision
            });

            if (response.success) {
                $(`#modal-check`).modal('hide');
                Utils.showSuccess('บันทึกการตรวจสอบเรียบร้อย');
                if (window.dataTable) {
                    window.dataTable.ajax.reload();
                }
            }
        } catch (error) {
            Utils.showError(error.message);
        } finally {
            Utils.hideLoading();
        }
    }

    initializeFormHandler(id) {
        const modal = this.modals[id].element;
        const form = modal.querySelector('form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!Utils.validateForm(form)) {
                Utils.showError('กรุณากรอกข้อมูลให้ครบถ้วน');
                return;
            }

            try {
                Utils.showLoading();
                const formData = new FormData(form);
                
                // Handle image uploads for audit and update forms
                if (id === 'audit' || id === 'update') {
                    const imageHandler = id === 'audit' 
                        ? new ImageHandler('image-preview-container', 'add-image')
                        : new ImageHandler('update-image-preview', 'add-update-image');
                    
                    const images = imageHandler.getAllImages();
                    images.forEach((image, index) => {
                        formData.append(`Picture${index + 1}`, image);
                    });
                }

                const response = await Utils.handleAPI(id, Object.fromEntries(formData));
                
                if (response.success) {
                    $(`#modal-${id}`).modal('hide');
                    Utils.showSuccess('บันทึกข้อมูลสำเร็จ');
                    if (window.dataTable) {
                        window.dataTable.ajax.reload();
                    }
                }
            } catch (error) {
                Utils.showError(error.message);
            } finally {
                Utils.hideLoading();
            }