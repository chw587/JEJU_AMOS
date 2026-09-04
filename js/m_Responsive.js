const sheet = document.querySelector('#aRight');

let startY = 0;
let startBottom = 0;
let currentBottom = 0;
let isDragging = false;

const MIN_VISIBLE = 40;

// 현재 #aRight가 열려있는지 여부
let isSheetOpen = false;


// ============================================================
// 768px 이하에서만 실행
// ============================================================

function isMobile() {
    return window.innerWidth <= 768;
}


function getSheetHeight() {
    return sheet.offsetHeight;
}


// 닫혔을 때의 bottom 위치
function getClosedBottom() {
    return -(getSheetHeight() - MIN_VISIBLE);
}


// 닫힌 상태에서 위치 유지
function keepClosedPosition() {

    // 768px 초과에서는 아무것도 하지 않음
    if (!isMobile()) return;

    // 열려있거나 드래그 중이면 건드리지 않음
    if (isSheetOpen || isDragging) return;

    const closedBottom = getClosedBottom();

    currentBottom = closedBottom;

    sheet.style.bottom = `${closedBottom}px`;
}


// ============================================================
// Drag Start
// ============================================================

function dragStart(e) {

    // 768px 초과에서는 드래그 기능 작동하지 않음
    if (!isMobile()) return;

    isDragging = true;

    sheet.style.transition = 'none';

    startY = e.type.includes('mouse')
        ? e.clientY
        : e.touches[0].clientY;

    startBottom = parseFloat(
        getComputedStyle(sheet).bottom
    ) || 0;
}


// ============================================================
// Drag Move
// ============================================================

function dragMove(e) {

    if (!isMobile()) return;

    if (!isDragging) return;

    const currentY = e.type.includes('mouse')
        ? e.clientY
        : e.touches[0].clientY;

    const diff = startY - currentY;

    currentBottom = startBottom + diff;

    // 위쪽 한계
    if (currentBottom > 0) {
        currentBottom = 0;
    }

    // 아래쪽 한계
    const minBottom = getClosedBottom();

    if (currentBottom < minBottom) {
        currentBottom = minBottom;
    }

    sheet.style.bottom = `${currentBottom}px`;
}


// ============================================================
// Drag End
// ============================================================

function dragEnd() {

    if (!isMobile()) return;

    if (!isDragging) return;

    isDragging = false;

    sheet.style.transition = 'bottom .3s ease';

    const minBottom = getClosedBottom();

    if (currentBottom < minBottom / 2) {

        // 닫힘
        isSheetOpen = false;

        currentBottom = minBottom;

        sheet.style.bottom = `${minBottom}px`;

    } else {

        // 열림
        isSheetOpen = true;

        currentBottom = 0;

        sheet.style.bottom = '0px';
    }
}


// ============================================================
// Touch
// ============================================================

sheet.addEventListener('touchstart', dragStart);

sheet.addEventListener('touchmove', dragMove);

sheet.addEventListener('touchend', dragEnd);


// ============================================================
// Mouse
// ============================================================

sheet.addEventListener('mousedown', dragStart);

document.addEventListener('mousemove', dragMove);

document.addEventListener('mouseup', dragEnd);


// ============================================================
// #aRight 높이 변경 감지
// 768px 이하에서만 작동
// ============================================================

const sheetObserver = new ResizeObserver(() => {

    if (!isMobile()) return;

    if (!isSheetOpen && !isDragging) {
        keepClosedPosition();
    }

});

sheetObserver.observe(sheet);


// ============================================================
// 최초 로딩
// ============================================================

window.addEventListener('load', () => {

    if (!isMobile()) return;

    keepClosedPosition();

});


// ============================================================
// 화면 크기 변경
// ============================================================

window.addEventListener('resize', () => {

    // 768px 이하로 들어왔을 때
    if (isMobile()) {

        if (!isSheetOpen) {
            keepClosedPosition();
        }

    }

});