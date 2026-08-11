const sheet = document.querySelector('.contents_map .contents');

let startY = 0;
let startBottom = 0;
let currentBottom = 0;
let isDragging = false;

const MIN_VISIBLE = 30;

function getSheetHeight() {
    return sheet.offsetHeight;
}


// 시작
function dragStart(e) {
    isDragging = true;

    sheet.style.transition = 'none';

    startY = e.type.includes('mouse')
        ? e.clientY
        : e.touches[0].clientY;

    startBottom = parseFloat(
        getComputedStyle(sheet).bottom
    );
}


function dragMove(e) {

    if (!isDragging) return;

    const currentY = e.type.includes('mouse')
        ? e.clientY
        : e.touches[0].clientY;


    const diff = startY - currentY;

    currentBottom = startBottom + diff;


    if (currentBottom > 0) {
        currentBottom = 0;
    }


    const minBottom = -(getSheetHeight() - MIN_VISIBLE);


    if (currentBottom < minBottom) {
        currentBottom = minBottom;
    }


    sheet.style.bottom = `${currentBottom}px`;
}


function dragEnd(){

    if(!isDragging) return;

    isDragging = false;

    sheet.style.transition = 'bottom .3s ease';


    const minBottom = -(getSheetHeight() - MIN_VISIBLE);


    // 가까운 위치로 스냅
    if(currentBottom < minBottom / 2){

        sheet.style.bottom = `${minBottom}px`;

    }else{

        sheet.style.bottom = '0px';

    }
}


// 터치
sheet.addEventListener('touchstart', dragStart);
sheet.addEventListener('touchmove', dragMove);
sheet.addEventListener('touchend', dragEnd);


// 마우스
sheet.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMove);
document.addEventListener('mouseup', dragEnd);