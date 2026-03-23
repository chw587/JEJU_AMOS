$(f_init);
let HIST_MAPS;
let HIST_WIND_LISTS;
let lastSelDt;

function f_init() {
    f_histInitBtns();
    f_histLoadFirst();
}

function f_histInitBtns() {
	$("#btnCross").click(()=>document.location='/cross');
    $("#btnAln").click(()=>document.location='/aln');
    $("#sAtcpdList").change(f_histDisplaySelected);
    $("#btnNext").click(f_onBtnHistNextClick);
    $("#btnPrev").click(f_onBtnHistPrevClick);
}

async function f_histLoadFirst() { 
    toastr["info"]("과거자료를 읽어들이고 있습니다. 잠시만 기다려주세요.");
    await $.ajax({
        url: "/aln/hist/prevalert.a",
        blockui: true,
        success: (d) => {
            HIST_MAPS = d;
        },
        error: () => {
            f_displayError("자료 조회 중 에러가 발생하였습니다.");
        }
    });

    f_histDisplay();
}

function f_histDisplay() {
    
    const selkey = f_getSelViewKey();

    const $sAtcpdList = $("#sAtcpdList");
    $sAtcpdList.empty();

    HIST_MAPS.slice().reverse().filter(
        (map) => {
            if ( !map.atcpd || !map.atcpd[selkey] || !map.atcpd[selkey].alerts || map.atcpd[selkey].alerts.length===0 ) {
                return false;
            }
            let isValid=false;
            map.atcpd[selkey].alerts.forEach( alert => {
                if ( alert.type==="WSA" || alert.type==="MBA" ) {
                    isValid = true;
                }
            });
            return isValid;
        }
    ).forEach(map => {
        const dtStr = moment(map.atcpd.fileDt, "YYYYMMDDHHmmssSSS").format("YYYY-MM-DD HH:mm:ss.SSS");
        $sAtcpdList.append(`<option value="${map.atcpd.fileDt}">${dtStr}</option>`);
    });
    if ( lastSelDt ) {
        $sAtcpdList.val(lastSelDt);
    }
    if ( !$sAtcpdList.val() ) {
        $sAtcpdList.prop("selectedIndex", 0);
    }
    f_histDisplaySelected();

//    f_displayAln(map);

}

function f_histDisplaySelected() {
    const $sAtcpdList = $("#sAtcpdList");
    lastSelDt = $sAtcpdList.val();
    if ( $sAtcpdList.val() ) {
        const map = HIST_MAPS.filter( map=>map.atcpd.fileDt===$sAtcpdList.val() )[0];
        console.log($sAtcpdList.val(), map);
        f_displayAln(map);
    } else {
        f_resetAlerts();
        $("#fHeader").text("No Alerts");
    }

}

function f_onBtnHistPrevClick() {
    let currentIndex = parseInt($("#sAtcpdList").prop("selectedIndex"));
    if (currentIndex > 0) {
        $("#sAtcpdList").prop("selectedIndex", currentIndex - 1).trigger("change");
    }
}

function f_onBtnHistNextClick() {
    let currentIndex = parseInt($("#sAtcpdList").prop("selectedIndex"));
    let totalOptions = $("#sAtcpdList").children("option").length;

    if (currentIndex < totalOptions - 1) {
        $("#sAtcpdList").prop("selectedIndex", currentIndex + 1).trigger("change");
    }    
}