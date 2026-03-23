const ANI_INTERVAL_MS=1000;
let ANI_DATA;
let aniObj;
let ANI_MODE = false;

$(f_initAni);

function f_initAni() {
    $("#btnPlay").click(f_aniPlay);
    $("#btnPrev").click(()=>f_aniBtnPrevNextClick(true));
    $("#btnNext").click(()=>f_aniBtnPrevNextClick());
    $("#btnFinishAni").click(f_aniFinish);
    $("#rAni").change(f_aniDisplayFrame);
}

function f_aniBtnPrevNextClick(isPrev) {
    let newVal = parseInt($("#rAni").val())+1*(isPrev?-1:1);
    if ( newVal < 0 ) {
        newVal = $("#rAni").attr("max");
    } else if ( newVal > parseInt($("#rAni").attr("max")) ) {
        newVal = 0;
    }
    $("#rAni").val(newVal).trigger("change");
}

async function f_aniPlay() {
    if ( $("#btnFinishAni").css("display")==="none" ) {
        await f_aniInitPlay();
        ANI_MODE=true;
        $("#dModeDisp").show();
    }
    if ( $(this).hasClass("play") ) { // play
        $(this).removeClass("play").addClass("pause");
        await f_aniDisplayFrame();
        aniObj = setInterval( ()=>{
            $("#rAni").val( $("#rAni").val()===$("#rAni").attr("max")?"0":(parseInt($("#rAni").val())+1) ).trigger("change");
        }, ANI_INTERVAL_MS);
    } else { // pause
        clearInterval(aniObj);
        aniObj = null;
        $(this).removeClass("pause").addClass("play");
    }
}

async function f_aniDisplayFrame() {
    const frameNo = parseInt($("#rAni").val());
    const map = ANI_DATA[frameNo];
    ALNMAP = map;
    $("#sAniTimeTxt").css("left", ($("#rAni").width()-10)/59*frameNo )
        .text( moment(map.dt).format("HH:mm") );
    f_display(map);
    f_radarAniDisplay(frameNo);
    f_windAniDisplay(frameNo);
}

async function f_aniInitPlay() {
    if ( !ANI_DATA ) {
        await f_aniLoadData();
    }
    if( !ANI_DATA ) {
        toastr.error("동화를 재생할 수 없습니다.");
        return;
    }
    aniObj = true;
    if ( $("#sWind").val()!=="" ) {
        await f_windLoad1hrWindData();
    }
    if ( $("#sProduct").val()!=="" ) {
        await f_rdrLoad1hrData();
    } else {
        f_rdrClearAniData();
    }
    $("#btnFinishAni").show();
    $("#btnPrev").prop("disabled", false);
    $("#btnNext").prop("disabled", false);
    $("#rAni").prop("disabled", false);
    fn_wsDisconnect();
    toastr.success("동화를 시작합니다. 실시간 모드로 돌아가려면 동화종료 버튼을 누르세요.");
    $("#rAni").val("0");
    $("#sAniTimeTxt").show();
    $("#sAniEndTimeTxt").text( moment(ANI_DATA.at(-1).dt).format("HH:mm") );
}

async function f_aniLoadData() {
    toastr.info("재생에 필요한 데이터를 조회하고 있습니다. 잠시만 기다려주세요.");
    await $.ajax({
        url: "/graph/load1hrPrev.a",
        blockui: true,
        success: (d) => {
            ANI_DATA=d;
            ANI_DATA.forEach((data) => data.isAni=true);
        },
    });
}

function f_aniFinish() {
    ANI_DATA = null;
    if ( $("#btnPlay").hasClass("pause") ) {
        $("#btnPlay").click();
    }
    ANI_MODE=false;
    $("#dModeDisp").hide();
    $("#btnFinishAni").hide();
    f_rdrOnAniFinish();
    f_windOnAniFinish();
    f_loadFirst();
    fn_wsConnect(f_display);
    $("#btnPrev").prop("disabled", true);
    $("#btnNext").prop("disabled", true);
    $("#rAni").prop("disabled", true);
    $("#sAniEndTimeTxt").text( "");
    $("#sAniTimeTxt").hide();
    $("#rAni").val("0");
    toastr.info("실시간 모드로 전환됐습니다.");
}

function f_aniIsPlaying() {
    return ANI_MODE?true:false;
}
