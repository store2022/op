// ============================================================
// ระบบเลือกพื้นที่และผู้รับผิดชอบอัตโนมัติ (รูปแบบการบันทึก Shift/Area)
// ============================================================

// เก็บรายการพื้นที่รับผิดชอบและ Shift ที่เกี่ยวข้อง
const areaResponsibilities = {
    "Shift A": [
        "EM and Crusher mil room",
        "Cooling screw area",
        "Coating room",
        "Initiator room",
        "Corridor",
        "Mixtank room",
        "Wash room",
        "Scrubber area",
        "AA unloading and AA tank fram B-1000, B1008",
        "NaOH and PG unloading / NaOH and PG tank fram",
        "Premix NaOH tank fram B-1002",
        "Recycle unloading and Recycle tank fram B-1007"
    ],
    "Shift B": [
        "Band dryer and Oscillator area",
        "Mix tank floor 2 area",
        "Extruder area",
        "FN-1901 and V-1940 area",
        "Surge tank and roller mill area",
        "Disc dryer area and flash tank",
        "MX-1060 schugi area",
        "Moisture reintroduction MX-1061 area",
        "shelf วางของ floor 2"
    ],
    "Shift C": [
        "Polybelt and Photo initiator / X-link pump area",
        "Platform TH-1170 , FN-1902",
        "Dehumidifier DH-1901",
        "Trim step platform",
        "BH-1080 , FD-1061 , FD-1062 , PC-1064 area",
        "FD-1060 and PC-1060 area",
        "shelf วางของ floor 3"
    ],
    "Shift D": [
        "Sifter screen and BH-1001 area",
        "BH-1060 , BH-1064 , BH-1080.1 , BH-1084 area",
        "Vibra-D and SC-1110 area",
        "BH-1101 , BH-1102 , BH-1111 platform",
        "Scrap area of production",
        "Control room & ห้องเก็บอุปกรณ์"
    ]
};

// แปลงรายการพื้นที่ให้อยู่ในรูปแบบ "Shift/Area" สำหรับ datalist
function createCombinedAreaOptions() {
    const combinedOptions = [];
    
    for (const shift in areaResponsibilities) {
        const areas = areaResponsibilities[shift];
        areas.forEach(area => {
            combinedOptions.push({
                value: `${shift}/${area}`,
                shift: shift,
                area: area
            });
        });
    }
    
    return combinedOptions;
}

// สร้าง datalist สำหรับตัวเลือกพื้นที่
function createAreaDatalist() {
    console.log("กำลังสร้าง datalist สำหรับรายการพื้นที่แบบ Shift/Area");
    
    // สร้าง datalist สำหรับ autocomplete
    let datalist = document.getElementById('areaList');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'areaList';
        document.body.appendChild(datalist);
        console.log("สร้าง datalist ใหม่");
    } else {
        datalist.innerHTML = ''; // ล้างข้อมูลเดิมถ้ามี
        console.log("ใช้ datalist ที่มีอยู่แล้ว");
    }
    
    // สร้างตัวเลือกในรูปแบบ "Shift/Area"
    const combinedOptions = createCombinedAreaOptions();
    combinedOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.setAttribute('data-shift', option.shift);
        optionElement.setAttribute('data-area', option.area);
        datalist.appendChild(optionElement);
    });
    
    console.log("เพิ่มตัวเลือกพื้นที่แบบ Shift/Area ทั้งหมดใน datalist เรียบร้อย");
    return datalist;
}

// ฟังก์ชันสำหรับการเพิ่มฟิลด์ผู้รับผิดชอบ (ตอนนี้เราไม่จำเป็นต้องใช้แล้ว แต่เก็บไว้สำหรับการแสดงผลเท่านั้น)
function addResponsibleField() {
    console.log("กำลังเพิ่มฟิลด์ผู้รับผิดชอบ (สำหรับแสดงผลเท่านั้น)");
    
    // ตรวจสอบว่ามีฟิลด์นี้อยู่แล้วหรือไม่
    if (document.getElementById('responsibleShift')) {
        console.log("ฟิลด์ผู้รับผิดชอบมีอยู่แล้ว");
        return document.getElementById('responsibleShift'); // คืนค่าฟิลด์ที่มีอยู่แล้ว
    }
    
    // สร้างองค์ประกอบสำหรับฟิลด์ผู้รับผิดชอบ
    const formRow = document.createElement('div');
    formRow.className = 'form-row';
    formRow.id = 'responsibleShiftRow';
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group col-md-6';
    formGroup.id = 'responsibleShiftGroup';
    
    const label = document.createElement('label');
    label.textContent = 'ผู้รับผิดชอบตาม Shift (แสดงผลเท่านั้น)';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.id = 'responsibleShift';
    input.name = 'responsibleShiftDisplay'; // เปลี่ยนชื่อเพื่อไม่ให้ถูกส่งไปกับฟอร์ม
    input.readOnly = true;
    
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    formRow.appendChild(formGroup);
    
    // กลยุทธ์หาตำแหน่งเพิ่มฟิลด์
    const areaInput = document.querySelector('input[name="Area"]');
    if (areaInput) {
        console.log("พบฟิลด์พื้นที่ กำลังเพิ่มฟิลด์ผู้รับผิดชอบต่อจากนั้น");
        // หาคอนเทนเนอร์ที่เหมาะสม
        let container = areaInput.closest('.form-row');
        if (!container) {
            container = areaInput.closest('.form-group');
        }
        if (!container) {
            container = areaInput.closest('.modal-body');
        }
        
        if (container) {
            // ใส่หลังจากคอนเทนเนอร์นั้น
            container.after(formRow);
            console.log("เพิ่มฟิลด์ผู้รับผิดชอบเรียบร้อย");
        } else {
            // ถ้าไม่พบคอนเทนเนอร์ที่เหมาะสม ให้เพิ่มใน modal-body
            const modalBody = document.querySelector('.modal-body');
            if (modalBody) {
                modalBody.appendChild(formRow);
                console.log("เพิ่มฟิลด์ผู้รับผิดชอบใน modal-body เรียบร้อย");
            } else {
                console.log("ไม่พบตำแหน่งที่เหมาะสมสำหรับเพิ่มฟิลด์ผู้รับผิดชอบ");
            }
        }
    } else {
        console.log("ไม่พบฟิลด์พื้นที่");
        // ถ้าไม่พบฟิลด์พื้นที่ ให้ลองเพิ่มใน modal-body
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.appendChild(formRow);
            console.log("เพิ่มฟิลด์ผู้รับผิดชอบใน modal-body แทน");
        }
    }
    
    return input;
}

// ฟังก์ชันอัพเดทการแสดงผล Shift จากค่าที่เลือก
function updateDisplayFromSelection(selectedValue) {
    console.log("อัพเดทการแสดงผลจากค่าที่เลือก:", selectedValue);
    
    // หาฟิลด์สำหรับแสดงผลผู้รับผิดชอบ (ถ้ามี)
    const responsibleInput = document.getElementById('responsibleShift');
    
    // แยก Shift และ Area จากค่าที่เลือก
    const parts = selectedValue.split('/');
    if (parts.length >= 2) {
        const shift = parts[0];
        // อัพเดทการแสดงผล
        if (responsibleInput) {
            responsibleInput.value = shift;
            console.log("อัพเดทการแสดงผลเป็น:", shift);
        }
    } else {
        console.log("รูปแบบค่าที่เลือกไม่ถูกต้อง");
        // ค้นหา Shift ที่รับผิดชอบพื้นที่นี้
        let foundShift = "";
        for (const shift in areaResponsibilities) {
            const areas = areaResponsibilities[shift];
            if (areas.some(area => selectedValue.includes(area) || area.includes(selectedValue))) {
                foundShift = shift;
                break;
            }
        }
        
        // อัพเดทการแสดงผล
        if (responsibleInput && foundShift) {
            responsibleInput.value = foundShift;
            console.log("อัพเดทการแสดงผลเป็น:", foundShift);
        }
    }
}

// ฟังก์ชันหลักสำหรับการเริ่มต้นระบบ
function initAreaAutoCompleteSystem() {
    console.log("กำลังเริ่มต้นระบบ Autocomplete พื้นที่");
    
    // สร้าง datalist สำหรับ autocomplete
    createAreaDatalist();
    
    // หา input สำหรับช่องกรอกพื้นที่
    const areaInput = document.querySelector('input[name="Area"]');
    if (areaInput) {
        console.log("พบช่องกรอกพื้นที่");
        
        // ตั้งค่า input
        areaInput.setAttribute('list', 'areaList');
        areaInput.setAttribute('autocomplete', 'off');
        
        // ลบ event listener เดิมก่อนเพิ่มใหม่
        areaInput.removeEventListener('input', handleAreaInputChange);
        areaInput.removeEventListener('change', handleAreaInputChange);
        
        // เพิ่ม event listener
        areaInput.addEventListener('input', handleAreaInputChange);
        areaInput.addEventListener('change', handleAreaInputChange);
        
        console.log("ตั้งค่า event listener สำหรับช่องกรอกพื้นที่เรียบร้อย");
    } else {
        console.log("ไม่พบช่องกรอกพื้นที่");
    }
    
    // สร้างฟิลด์ผู้รับผิดชอบสำหรับการแสดงผล (ถ้าต้องการ)
    addResponsibleField();
}

// ฟังก์ชัน handler สำหรับ event input และ change
function handleAreaInputChange(event) {
    console.log("เกิดเหตุการณ์เปลี่ยนแปลงในช่องกรอกพื้นที่:", event.type);
    console.log("ค่าที่กรอก:", this.value);
    
    // อัพเดทการแสดงผล Shift
    updateDisplayFromSelection(this.value);
}

// ฟังก์ชันสำหรับติดตั้งการทำงานของระบบ
function setupAreaAutocompleteSystem() {
    console.log("กำลังติดตั้งระบบ Autocomplete พื้นที่แบบ Shift/Area");
    
    // ตรวจสอบว่ามี modal ที่ต้องการหรือไม่
    const modalAudit = document.getElementById('modal-audit');
    
    if (modalAudit) {
        console.log("พบ modal-audit");
        
        // ใช้ทั้ง MutationObserver และ jQuery event
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class' && 
                    modalAudit.classList.contains('show')) {
                    console.log("Modal แสดงผล (จาก observer)");
                    initAreaAutoCompleteSystem();
                }
            });
        });
        
        observer.observe(modalAudit, { attributes: true });
        
        // เพิ่ม event listener สำหรับเหตุการณ์ปิด modal
        modalAudit.addEventListener('hidden.bs.modal', function() {
            console.log("Modal ถูกซ่อน");
        });
        
        // เพิ่ม event listener สำหรับเหตุการณ์เปิด modal โดยตรง
        modalAudit.addEventListener('shown.bs.modal', function() {
            console.log("Modal แสดงผล (จาก event)");
            initAreaAutoCompleteSystem();
        });
    }
    
    // ตรวจสอบกรณีที่ Modal แสดงอยู่แล้ว
    if (modalAudit && modalAudit.classList.contains('show')) {
        console.log("Modal กำลังแสดงผลอยู่แล้ว");
        initAreaAutoCompleteSystem();
    }
    
    // สร้าง datalist ตั้งแต่ต้น
    createAreaDatalist();
}

// ตรวจสอบการโหลดของหน้าเว็บ
if (document.readyState === 'loading') {
    console.log("หน้าเว็บกำลังโหลด จะเริ่มระบบหลังจาก DOMContentLoaded");
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM โหลดเสร็จแล้ว");
        setupAreaAutocompleteSystem();
    });
} else {
    console.log("หน้าเว็บโหลดเสร็จแล้ว เริ่มระบบทันที");
    setupAreaAutocompleteSystem();
}

// ฟังก์ชัน jQuery
if (typeof jQuery !== 'undefined') {
    console.log("มี jQuery อยู่ในหน้าเว็บ");
    jQuery(function($) {
        console.log("jQuery document ready");
        
        // ตรวจจับการคลิกปุ่มเพิ่มข้อมูลใหม่
        $(document).on('click', '#btn-add', function() {
            console.log("คลิกปุ่มเพิ่มข้อมูล");
            // รอสักครู่ให้ modal แสดงก่อน
            setTimeout(function() {
                initAreaAutoCompleteSystem();
            }, 500);
        });
        
        // ใช้ jQuery event สำหรับ modal
        $(document).on('shown.bs.modal', '#modal-audit', function() {
            console.log("Modal แสดงผล (จาก jQuery)");
            initAreaAutoCompleteSystem();
        });
    });
} else {
    console.log("ไม่พบ jQuery ในหน้าเว็บ");
}