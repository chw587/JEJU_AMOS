$(f_histInit);
let lastSelDt;

function f_histInit() {
   
    f_getSysSetting();
    f_dispLgndColor();	
    
    $("#btnCross").show();
    $("#btnAln").hide();
    $("#btnGraph").hide();
    $("#dModeDisp").show();
    $("#bVol").hide();
    $("#btnHist").hide();
    $("#dHistControl").css("display", "flex");
    $("#iEqpError").removeAttr("id").hide();
  
    f_histInitBtns();
    f_histLoadAtcpd();
}

function f_histInitBtns() {
	$("#btnCross").click(()=>document.location='../feed.html');
    $("#sAtcpdList").change(f_histDisplaySelected);
    $("#btnHistNext").click(f_onBtnHistNextClick);
    $("#btnHistPrev").click(f_onBtnHistPrevClick);
}

function f_onBtnViewHistClick() {
    if ( $(this).hasClass("btn_gray") ) {
        return;
    }
    $(this).addClass("btn_green").removeClass("btn_blue");
    $(this).siblings().each( (i,btn) => {
        if ( $(btn).hasClass("btn_green") ) {
            $(btn).removeClass("btn_green").addClass("btn_blue");
        }
    });
    f_histDisplay();
}

async function f_histLoadAtcpd() { 
    toastr["info"]("과거자료를 읽어들이고 있습니다. 잠시만 기다려주세요.");
    try {
        const response = await $.ajax({
            url: "/cross/hist/prevalert.a",
            blockui: true
        });

        HIST_MAPS = response;
        f_histDisplay();

    } catch (error) {
    	console.log("자료 조회 중 에러 발생:", error);
    }

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
        console.log($sAtcpdList.val(), map.atcpd.combined.gustFrontArea, map.atcpd.combined.microburstArea, map.atcpd.combined);
        f_displayDate(map);
	    f_displayAirDir(map);
	    f_displayAln(map);
	    f_displayMainWindProfiler(map);
	    f_displayWindProfiler(map);
	    f_displayLidar(map);
	    f_displayLidarAreaAln(map); 
	  	f_displayLidarAln(map); 
	  	f_displayAmosObs(map);
	  	f_displayLlwas(map);
	  	f_displayLlwasAln(map);
        
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