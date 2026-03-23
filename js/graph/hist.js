$(f_histInit);
let HIST_MAPS;
let WPS;
let lastSelDt;

function f_histInit() {
    setTimeout(()=>{
        $("#sProduct").off("change").change(f_histDisplaySelected);
        $("#sWind").off("change").change(f_histDisplaySelected);
        $("button.btn_view").off("click");
        $("button.btn_view").click(f_onBtnViewHistClick);
        $("#tWp07").off("click");
        $("#tWp25").off("click");
        MAP.off("zoomend", f_rdrDisplay);
        MAP.off("moveend", f_rdrDisplay);
        MAP.on("zoomend", f_histDispProduct);
        MAP.on("moveend", f_histDispProduct);
    }, 20);

    $("#btnCross").hide();
    $("#btnAln").hide();
    $("#btnGraph").show();
    $("#dModeDisp").show();
    $("#lVol").hide();
    $("#btnHist").hide();
    $("#dHistControl").css("display", "flex");
    $("#iEqpError").removeAttr("id").hide();
    $("footer.play_footer").hide();
    f_histInitBtns();
    f_histLoadAtcpd();
}

function f_histInitBtns() {
	$("#btnCross").click(()=>document.location='/cross');
    $("#btnGraph").click(()=>document.location='/graph');
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
    const wpDts = {};
    HIST_MAPS.forEach( map=>{
        const fileDt = moment(map.atcpd.fileDt, "YYYYMMDDHHmmssSSS");
        const wpDt = fileDt.add( (fileDt.minute()%5)*-1, "m" ).startOf('minute').format("YYYYMMDDHHmm");
        wpDts[wpDt] = true;
    });
    const reqs = $.map(Object.keys(wpDts), (wpDt)=>{
        return $.ajax({
            url: "/graph/hist/wp.a",
            data: {dt: wpDt},
            method: "post",
        });
    });
    Promise.all(reqs)
    .then(results => {
        WPS = [];
        results.forEach((res, index) => WPS.push(res) );
        WPS.reverse();
        f_histDisplay();
    })
    .catch(error => {
        console.log("WP 조회 중 에러 발생:", error);
    });
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
        f_histDispWp();
        f_histDispProduct();
        f_histDispWind();
    } else {
        f_resetAlerts();
        $("#fHeader").text("No Alerts");
    }
}

// 이력 조회용 WP
function f_histDispWp() {
    let wpsFiltered = WPS.filter( (wp)=>moment(wp.dt).isBefore( f_histLastSelUtcDt() ) );
    f_displayWindProfiler({wp: wpsFiltered.length>0?wpsFiltered[0]:null});
}

// 이력 조회용 Product
function f_histDispProduct() {
    const targetDt = f_histLastSelUtcDt().startOf('minute').format("YYYYMMDDHHmm");
    const type = $("#sProduct").val();
    const radarImgLayers = fn_get_map_layers(KEY_RADAR_IMAGE);
    if ( type==="" ) {
        latestRdrReq = null;
        rdrDt = null;
        fn_remove_map_layer_object(radarImgLayers);
        f_rdrClearLegend();
        return;
    }

    const param = f_histRdrGetParam(targetDt);
    if ( f_histRdrGetParamKey(param)===latestRdrReq ) { // 중복호출 방지
        return;
    }
    latestRdrReq = f_histRdrGetParamKey(param);

    $.ajax({
        url: "/radar/hist.a",
        data: param,
        method: "post",
        success: (d) => {
            if ( !d || !d.result ) {
                toastr["error"]( d.message );
                return;
            }

            const imageBounds = [ [param.rtLat, param.lbLon], [param.lbLat, param.rtLon] ];
            L.imageOverlay("/radar/radarImage?image="+encodeURIComponent(d.url), imageBounds, {
                id: KEY_RADAR_IMAGE, opacity: DISP_SET.lyrAlpha/100, zIndex: 10}).addTo(MAP);
            fn_remove_map_layer_object(radarImgLayers);
            rdrDt = d.datetime;
            f_rdrDrawLegend(d);
        },
        complete: () => {
            latestRdrReq = null;
        }
    });    
}

function f_histRdrGetParam(targetDt) {
    const bounds = MAP.getBounds();
    return {type: $("#sProduct").val(), 
        lbLat: bounds._southWest.lat, lbLon: bounds._southWest.lng,
        rtLat: bounds._northEast.lat, rtLon: bounds._northEast.lng,
        width: MAP.getSize().x, height: MAP.getSize().y, dt: targetDt,
    };
}

function f_histRdrGetParamKey(p) {
    return `${p.type}_${p.lbLat}_${p.lbLon}_${p.rtLat}_${p.rtLon}_${p.width}_${p.height}_${p.dt}`;
}

// 이력 조회용 Wind
function f_histDispWind() {
    const targetDt = f_histLastSelUtcDt().add( (f_histLastSelUtcDt().minute()%5)*-1, "m").format("YYYYMMDDHHmm");
    const ft = $("#sWind").val();
    const type = $("#sWind").find("option:selected").attr("type");

    wdStreamLayer.setData(null);
    fn_remove_map_layer(KEY_WIND_BARBS);

    if ( !ft ) {
        windDt = null;
        return;
    }

    $.ajax({
        url: "/wind/hist.a",
        data: {dt: targetDt, height: ft},
        method: "post",
        success: (d) => {
            windDt = d.datetime;
            if ( type==="stream" ) {
                f_windStreamDisplay(d);
            } else {
                f_windBarbDisplay(d);
            }
        },
    });
}

function f_histLastSelUtcDt() {
    const isUtc = $("#iWpIsUtc").val()==="Y"?true:false;
    return moment(lastSelDt, "YYYYMMDDHHmmssSSS").add( isUtc?-9:0, "h");
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