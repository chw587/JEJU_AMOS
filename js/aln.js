$(f_init);
let ALNMAP = {};

function f_init() {
    f_initBtns();
    f_loadFirst();
    fn_wsConnect(f_display);
}

function f_initBtns() {
    $("#btnAln").click(()=>document.location='index.html');
	$("#btnCross").click(()=>document.location='feed.html');
    $("#btnGraph").click(()=>document.location='graphic.html');
    $("#btnHist").click(()=>document.location='aln/hist.html');
}

// s
function f_display(map) {
    if( map ) {
        console.log(map);
    }
    if (!map) {
        map = FM_MAP;
    } 
    FM_MAP = map;
    f_displayAln(map);

}


