const VIEW_KEY = ["combined", "llwas", "tldr1", "tldr2"];
const GRAPH_DI_CHK_KEYS = ["cWpr", "cLlwas", "cAmos", "cMap", "cArena", "cFlyRoute", "cObsCircle",];

let prevAlert = {};
let alertSound;
let lastAlnMap;
let eqpError;
let firstAlnLoad = true;
let changeWindTimer = null;

$(f_alnComInit);

// 250818
$(function () {
    function f_volControl() {
        const isMuted = $('#rVol').val() === '0';
        // ALM 버튼 상태/텍스트
        $('.tit button')
            .toggleClass('off', isMuted)
            .toggleClass('on', !isMuted)
            .html('ALM <span>' + (isMuted ? 'OFF' : 'ON') + '</span>');
    }

    function toggleVol() {
        const isMuted = $('#rVol').val() === '0';
        console.log(isMuted)

        if (isMuted) {
            // 저장된 값이 있으면 복원, 없으면 기본값 사용
            let savedValue = localStorage.getItem("savedVol");
            if (!savedValue) savedValue = $("#rVol").val();
            $('#rVol').val(savedValue);
        } else {
            // 현재 값을 localStorage에 저장하고 0으로 변경
            localStorage.setItem("savedVol", $('#rVol').val());
            $('#rVol').val(0);
        }

        f_volControl();
        f_onVolRangeChange();
        f_VolIco();
    }

    // 초기 상태 반영
    f_volControl();

    // 이벤트 바인딩
    $('.tit button').on('click', toggleVol);
    $('#rVol').on('input change', function () {
        f_volControl();
        if ($('#rVol').val() !== '0') {
            // 슬라이더 움직일 때 0이 아니면 값 저장
            localStorage.setItem("savedVol", $('#rVol').val());
        }
    });
});




function f_alnComInit() {
    const setting = fn_getUserUiSetting();
    $("#bVol").click(f_onVolBtnClick);
    $("button.btn_view").click(f_onBtnViewClick);
    $("body").click(f_onAlnComBodyClick);
    $("#rVol").change(f_onVolRangeChange).change(f_alnComSaveUserUiSetting);
    //$("#rVol").val(setting?setting["rVol"]:"1").change(f_onVolRangeChange).change(f_alnComSaveUserUiSetting).trigger("change");
    $("#btnAlertPause").click(f_onBtnAlertPauseClick);

    // 사용자 버튼 등 UI 설정
    if (f_alnComGetScrType().ishist) {
        return; // 이력은 이하 세팅하지 않음
    }
    $("button.btn_view").click(() => setTimeout(f_alnComSaveUserUiSetting, 10));
    if (f_alnComGetScrType().graph) {
        $("#btnRightHide").click(() => setTimeout(f_alnComSaveUserUiSetting, 10));
        $("#btnRightShow").click(() => setTimeout(f_alnComSaveUserUiSetting, 10));
        $("#btnToggleWp").click(() => setTimeout(f_alnComSaveUserUiSetting, 10));
        ["sProduct", "sWind"].forEach(id => $("#" + id).change(f_alnComSaveUserUiSetting));
        GRAPH_DI_CHK_KEYS.forEach(k => $("#" + k).change(f_alnComSaveUserUiSetting));
        MAP.on("zoomend", f_alnComSaveUserUiSetting);
        MAP.on("moveend", f_alnComSaveUserUiSetting);
        $("button.btn_map_color").click(f_alnComSaveUserUiSetting);
    }
    //setInterval(f_alnComMonitorVolChange, 1000);

    $("body").on("keydown", f_alnComKeyDown);
}

/**
 * '25-04-22 요구사항 대응
 * Keyboard Actions
 * 
 * @param {*} e 
 */
function f_alnComKeyDown(e) {
    switch (e.key) {
        case '1':
            fi_changePage("/index");
            break;
        case '2':
            fi_changePage("/graphic");
            break;
        case '3':
            fi_changePage("/feed");
            break;
        case '4':
            fi_changePage("/cross?rwy=r2");
            break;
        case "ArrowDown":
            fi_changeGraphWind();
            break;
        case "ArrowUp":
            fi_changeGraphWind(true);
            break;
        case " ":
            fi_toggleVolume();
            break;
    }

    function fi_changePage(page) {
        if (document.location.href.endsWith(page)) {
            return;
        }
        window.location.href = window.location.origin + page;
    }

    function fi_changeGraphWind(isUp) {
        if (document.location.pathname !== "/graph" || !$("#sWind").val()) {
            return;
        }
        const $selectedOption = $("#sWind").find("option:selected");
        if (isUp) {
            if ($selectedOption.prev('option').length === 0
                || $selectedOption.prev('option').attr("type") !== $selectedOption.attr("type")) {
                return;
            }
            console.log($selectedOption.prev('option')[0]);
            $selectedOption.prev('option').prop("selected", true);
        } else {
            if ($selectedOption.next('option').length === 0
                || $selectedOption.next('option').attr("type") !== $selectedOption.attr("type")) {
                return;
            }
            console.log($selectedOption.next('option')[0]);
            $selectedOption.next('option').prop("selected", true);
        }

        if (changeWindTimer) {
            clearTimeout(changeWindTimer);
        }
        changeWindTimer = setTimeout(() => {
            $("#sWind").trigger("change");
            changeWindTimer = null;
        }, 300); // 300ms 동안 추가 키 입력이 없으면 change 발생        
    }

    function fi_toggleVolume() {
        $("#btnAlertPause").click();
    }

}

function f_onBtnViewClick() {
    if ($(this).hasClass("btn_gray")) {
        return;
    }
    $(this).addClass("btn_green").removeClass("btn_blue");
    $(this).siblings().each((i, btn) => {
        if ($(btn).hasClass("btn_green")) {
            $(btn).removeClass("btn_green").addClass("btn_blue");
        }
    });
    f_display();
}

function f_onBtnAlertPauseClick() {
    if ($(this).hasClass("is_active")) {
        $(this).removeClass("is_active");
    } else {
        $(this).addClass("is_active");
    }
}

function f_displayAln(map) {
    lastAlnMap = map;
    serverStartDt = map.serverStartDt;
    try {
        f_hideError();
        f_resetAlerts();
        f_setEqpError(map);
        f_setViewBtns(map);
        f_alnCheckMaxDelay(map);
        f_alnDisplayHeader(map);
        f_alnDisplayTarget(map);
    } catch (e) {
        let message = "자료 표출 중 에러 발생";
        if (e instanceof JidBizError) {
            message = e.message;
        } else {
            console.log(e);
        }
        f_displayError(message);
        throw e;
    }
    if (firstAlnLoad) {
        firstAlnLoad = false;
        f_alnComSetUserUiSetting();
    }
}

function f_getSelViewKey() {
    return $("button.btn_view.btn_green").val();
}

function f_alnDisplayHeader(map) {
    if (!map.atcpd && f_aniIsPlaying()) {
        return;
    }
    const a = map.atcpd[f_getSelViewKey()];
    if (!a || a.error) {
        throw new JidBizError(a.errorMessage);
    }
    const timeStr = moment(a.gentime).format("HHmm");
    let almOnOff = $("#rVol").val() === "0" ? "ALM OFF" : "ALM ON";
    if (f_alnComGetScrType().ishist) {
        almOnOff = "";
    }

    const centerfieldname = (!a.validreport || a.centerfieldname == "null" || a.centerfield == "null") ? "" : a.centerfieldname;
    const direction = fi_verifyRound(a.validreport, a.centerfieldname, a.centerfielddirection);
    const speed = fi_verifyRound(a.validreport, a.centerfieldname, a.centerfieldspeed, 1.94384);
    const windgust = a.windgustvalid ? "G" + a.windgust : "";
    $("#fHeader").text(`${centerfieldname} ${direction} ${speed} ${windgust} ${timeStr} ${almOnOff}`);

    function fi_verifyRound(validreport, centerfieldname, field, multiplier) {
        if (!validreport || !centerfieldname) {
            return "";
        }
        try {
            return Math.round(parseFloat(field) * (multiplier ? multiplier : 1));
        } catch {
            return "";
        }
    }
}

function f_alnCheckMaxDelay(map) {
    if (!map.atcpd && typeof f_aniIsPlaying === "function" && f_aniIsPlaying()) {
        toastr["warning"](`${moment(map.dt).format("HH:mm")}의 ATCPD 자료가 없습니다.`);
        return;
    }
    if (f_alnComGetScrType().ishist) {
        return;
    }
    const atcpdDelayAllowMin = $("#iAtcpdDelayAllowMin").val();
    if (!atcpdDelayAllowMin) {
        return;
    }
    const atcpdDt = moment(map.atcpd.fileDt, "YYYYMMDDHHmmssSSS");
    const delayBasisDt = moment(map.dt).add(parseInt(atcpdDelayAllowMin) * -1, "m");
    if (atcpdDt.isBefore(delayBasisDt)) {
        throw new JidBizError(`ATCPD 미수집   (${atcpdDelayAllowMin}분 초과)`);
    }

}

function f_alnDisplayTarget(map) {
    if (!map.atcpd && (typeof window.myFunction === "function" && f_aniIsPlaying())) {
        return;
    }

    const view = map.atcpd[f_getSelViewKey()];

    const isManual = map.rwy && map.rwy.type === "M";
    $("#sRwyMode").text(isManual ? "MANUAL" : "AUTO");
    const rws = fn_getCustomActiveRunways(isManual ? map.rwy : map.amos); // 
    // 활주로 맵 변환
    const alertsByRunway = view.alerts.reduce((acc, alert) => ({ ...acc, [alert.runway]: alert }), {});

    let newAlert = {};
    rws.forEach((rw, i) => {
        const $ul = $(`ul.rwy_info:eq(${i})`);
        const alert = alertsByRunway[rw];
        const fields = alert.faa.split(" ").map(f => f.trim());
        if (alert.type === "WSA" || alert.type === "MBA") {
            $ul.addClass("alert");
            newAlert[fields[0]] = fields[1] + fields[2] + fields[3];
        }
        //        console.log(fields);
        if (fields.length === 3 && fields[1] === "000" && fields[2] === "0") { // 000 0 -> CALM
            $ul.find(`li:eq(0)`).text(fields[0]);
            $ul.find(`li:eq(1)`).text("CALM");
            return;
        }

        fields.forEach((field, j) => {
            $ul.find(`li:eq(${j})`).text(field);
        });
    });

    if (f_alnComGetScrType().ishist) { // 경고 필요 없으면 건너뜀
        return;
    }

    if (!alertSound) {
        alertSound = new AlertSound();
    }
    if (!map.isAni) {
        if (f_isAlertTarget(newAlert)) {
            alertSound.setAlertByStrs(newAlert);
        } else if (Object.keys(newAlert).length === 0) {
            alertSound.setAlertByStrs({});
        }
    }
    prevAlert = newAlert;
}

function f_isAlertTarget(newAlert) {
    let target = false;
    // 알람일시정지 버튼이 눌리지 않았을 때
    //    if ( !$("#btnAlertPause").hasClass("is_active") && Object.keys(newAlert).length>0 ) {
    //        return true;
    //    }
    // 알람일시정지 버튼이 눌렸을 때
    Object.keys(newAlert).forEach((rwy) => {
        if (newAlert[rwy] !== prevAlert[rwy]) {
            target = true;
        }
    });
    if (target) {
        $("#btnAlertPause").removeClass("is_active");
    }
    return target;
}

function f_setEqpError(map) {
    if (!map || !map.atcpd || (typeof window.myFunction === "function" && f_aniIsPlaying())) {
        return;
    }

    if (!eqpError) {
        eqpError = new EqpError();
    }
    eqpError.reset();

    VIEW_KEY.forEach((key) => { //ATCPD
        const view = map.atcpd[key];
        if (view.error === true) {
            eqpError.setAtcpdErrorMsg(key, view.errorMessage);
        }
    });

    if ((document.location + "").indexOf("/graph") < 0) {
        return;
    }

    if (!map.wp) {  // 윈드프로파일러
        eqpError.setErrorMsg("wp", "자료 없음");
    } else {
        let msg = "";
        if (!map.wp.r07FileDt) {
            msg += "07 자료 없음";
        } else if (fi_isExpiredData("iWpDelayAllowMin", map.wp.r07FileDt, "YYYYMMDDHHmm", "iWpIsUtc")) {
            msg += `07 자료 미수신(최종: ${fi_getLatestFileDt(map.wp.r07FileDt, "iWpIsUtc")})`;
        }
        if (!map.wp.r25FileDt) {
            msg += (msg ? "\n    " : "") + "25 자료 없음";
        } else if (fi_isExpiredData("iWpDelayAllowMin", map.wp.r25FileDt, "YYYYMMDDHHmm", "iWpIsUtc")) {
            msg += (msg ? "\n    " : "") + `25 자료 미수신(최종: ${fi_getLatestFileDt(map.wp.r25FileDt, "iWpIsUtc")})`;
        }

        if (!msg) {
            msg = null;
        }
        eqpError.setErrorMsg("wp", msg);
    }

    if (!map.hwind) { // HWIND
        eqpError.setErrorMsg("hwind.300", "자료 없음");
        eqpError.setErrorMsg("hwind.600", "자료 없음");
        eqpError.setErrorMsg("hwind.900", "자료 없음");
        eqpError.setErrorMsg("hwind.1200", "자료 없음");
        eqpError.setErrorMsg("hwind.1500", "자료 없음");
        eqpError.setErrorMsg("hwind.1800", "자료 없음");
    } else {
        Object.keys(map.hwind).forEach((key) => {
            if (fi_isExpiredData("iHwindDelayAllowMin", map.hwind[key].substring(0, 14), "YYYYMMDDHHmmss", "iRadarIsUtc")) {
                const latest = fi_getLatestFileDt(map.hwind[key].substring(0, 14), "iRadarIsUtc");
                eqpError.setErrorMsg("hwind." + key, `${key}ft 자료 미수신(최종: ${latest})`);
            }
        });
    }

    if (!map.radar) {
        eqpError.setErrorMsg("tldr11", "자료 없음");
        eqpError.setErrorMsg("tldr12", "자료 없음");
        eqpError.setErrorMsg("tldr21", "자료 없음");
        eqpError.setErrorMsg("tldr22", "자료 없음");
    } else {
        Object.keys(map.radar).forEach((key) => {
            if (fi_isExpiredData("iRadarDelayAllowMin", map.radar[key].substring(0, 14), "YYYYMMDDHHmmss", "iRadarIsUtc")) {
                const latest = fi_getLatestFileDt(map.radar[key].substring(0, 14), "iRadarIsUtc");
                eqpError.setErrorMsg("radar." + key, `자료 미수신(최종: ${latest})`);
            }
        });
    }

    function fi_isExpiredData(fieldId, dtStr, format, utcFieldId) {
        let basisDt = moment(map.dt).add($("#" + fieldId).val() * -1, "m");
        if (utcFieldId && $("#" + utcFieldId).val() === "Y") {
            basisDt = basisDt.add(-9, "h");
        }
        return moment(dtStr, format).isBefore(basisDt);
    }

    function fi_getLatestFileDt(ymdHmTxt, utcFieldId) {
        //        console.log(ymdHmTxt);
        return moment(ymdHmTxt, "YYYYMMDDHHmmss").add($("#" + utcFieldId).val() === "Y" ? 9 : 0, "h")
            .format("YYYY-MM-DD HH:mm:ss");
    }

}

function f_setViewBtns(map) {
    return;
    // $(`button.btn_view`).removeClass("btn_blue").removeClass("btn_green").addClass("btn_gray");
    // VIEW_KEY.forEach( (key)=> {
    //     const view = map.atcpd[key];
    //     if ( view.error===false ) {
    //         $(`button.btn_view[value=${key}]`).removeClass("btn_gray").addClass("btn_blue");
    //     }
    // });
    // $('button.btn_view.btn_blue:eq(0)').removeClass("btn_blue").addClass("btn_green");
}


function f_resetAlerts() {
    $("#fHeader").text("");
    $("ul.rwy_info").removeClass("alert");
    $("ul.rwy_info > li").text("");
    $("#iEqpError").addClass("d_none");
}

function f_onVolBtnClick(e) {
    if ($("#bVol").hasClass("is_active")) {
        f_onAlnComBodyClick(e);
        return;
    }
    $("#bVol").addClass("is_active");
    $("#rVol").show();
    e.stopPropagation();
}

function f_onVolRangeChange() {
    $("#bVol > i").removeClass("ico_sound_1").removeClass("ico_sound_2").removeClass("ico_sound_3").removeClass("ico_mute");
    if ($("#rVol").val() === "0") {
        $("#bVol > i").addClass("ico_mute");
    } else if (parseFloat($("#rVol").val()) < 0.33) {
        $("#bVol > i").addClass("ico_sound_1");
    } else if (parseFloat($("#rVol").val()) < 0.67) {
        $("#bVol > i").addClass("ico_sound_2");
    } else {
        $("#bVol > i").addClass("ico_sound_3");
    }
    f_alnDisplayHeader(lastAlnMap);
}

function f_onAlnComBodyClick(e) {
    if (e.target.id === 'rVol') {
        return;
    }
    $("#rVol").hide();
    $("#bVol").removeClass("is_active");
}

function f_displayError(msg) {
    $("#dError > p").text(msg);
    $("#dError").css("display", "flex");
    // 250813
    $(".info_area .menu").css({ position: "relative", zIndex: 504 });
}

function f_hideError() {
    $("#dError").hide();
}

class AlertSound {

    wsaAudio;
    mbaAudio;
    currentAlerts = [];

    constructor() {
        $("body").append(
            `<audio id="aAlertWsa"><source src="/sound/WSA.wav" type="audio/wav"></audio>` +
            `<audio id="aAlertMba"><source src="/sound/MBA.wav" type="audio/wav"></audio>`
        );
        this.wsaAudio = $("#aAlertWsa")[0];
        this.mbaAudio = $("#aAlertMba")[0];

        this.playAlert();  // 반복 재생 루프 시작
    }

    setAlertByStrs(alerts) {
        let wsa = false, mba = false;
        Object.values(alerts).forEach((alert) => {
            if (alert.startsWith("WSA")) {
                wsa = true;
            } else {
                mba = true;
            }
        });

        if (wsa && mba) {
            this.currentAlerts = ["wsa", "mba"];
        } else if (wsa) {
            this.currentAlerts = ["wsa", "wsa"];
        } else if (mba) {
            this.currentAlerts = ["mba", "mba"];
        } else {
            this.currentAlerts = []; // 조건에 해당하지 않을 경우만 비움
        }
    }

    async playAlert() {
        while (true) {
            if (this.currentAlerts.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            // 복사본 사용 (외부에서 currentAlerts 변경 가능)
            const alertsToPlay = [...this.currentAlerts];

            for (const alert of alertsToPlay) {
                if ($("#btnAlertPause").hasClass("is_active")) {
                    await new Promise(resolve => setTimeout(resolve, 1400));
                    continue;
                }

                const audio = alert === "wsa" ? this.wsaAudio : this.mbaAudio;
                if (!audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                audio.volume = parseFloat($("#rVol").val());

                const startTime = Date.now();
                try {
                    await audio.play();
                } catch (error) {
                    toastr["warning"]("경고음을 재생할 수 없습니다. 사용자가이드를 참고해 브라우저 옵션을 변경하십시오.");
                }

                const elapsed = Date.now() - startTime;
                const remaining = 1400 - elapsed;
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, remaining));
                }
            }
        }
    }
}

class EqpError {
    static keys = ["atcpd.combined", "atcpd.llwas", "atcpd.tldr1", "atcpd.tldr2",
        "wp",
        "hwind.300", "hwind.600", "hwind.900", "hwind.1200", "hwind.1500", "hwind.1800",
        "radar.tldr11", "radar.tldr12", "radar.tldr21", "radar.tldr22"
    ];
    static names = ["ATPCD(combined)", "ATCPD(llwas)", "ATCPD(TLDR1)", "ATCPD(TLDR2)",
        "윈드프로파일러",
        "HWIND(300)", "HWIND(600)", "HWIND(900)", "HWIND(1200)", "HWIND(1500)", "HWIND(1800)",
        "TLDR1(SNR)", "TLDR1(시선속도)", "TLDR2(SNR)", "TLDR2(시선속도)"
    ];
    errorMsgs = [];

    constructor() {
        this.reset();
    }

    reset() {
        if (this.errorMsgs.length === 0) {
            EqpError.names.forEach(() => this.errorMsgs.push(null));
        } else {
            this.errorMsgs.forEach((v, i) => this.errorMsgs[i] = null);
        }
    }

    removeErrorMsg(key) {
        EqpError.keys.forEach((dispKey, i) => {
            if (key === dispKey) {
                this.errorMsgs[i] = null;
            }
        });
        this.updateEqpError();
    }

    setErrorMsg(key, msg) {
        EqpError.keys.forEach((dispKey, i) => {
            if (key === dispKey) {
                this.errorMsgs[i] = msg;
            }
        });
        this.updateEqpError();
    }

    setAtcpdErrorMsg(view, msg) {
        this.setErrorMsg("atcpd." + view, msg);
    }

    removeAtcpdErrorMsg(view) {
        this.removeErrorMsg("atcpd." + view);
    }

    updateEqpError() {
        const isDisp = this.errorMsgs.filter(m => m !== null).length > 0;
        if (!isDisp) {
            $("#iEqpError").addClass("d_none");
            return;
        }
        let msg = "";
        EqpError.names.forEach((key, i) => {
            if (this.errorMsgs[i] !== null) {
                msg += (msg ? "\n" : "") + key + ": " + this.errorMsgs[i];
            }
        });
        $("#iEqpError").removeClass("d_none").attr("alt", msg).attr("title", msg);
    }

}

function f_alnComSetUserUiSetting() {
    setTimeout(fi_setUiSttings, 1000);

    function fi_setUiSttings() {
        if (f_alnComGetScrType().ishist) {
            return;
        }

        const setting = fn_getUserUiSetting();

        if (f_getSelViewKey() !== setting.view) {
            $(`button.btn_view[value=${setting.view}]`).click();
        }
        $("#rVol").val(setting["rVol"]).trigger("change");

        // 이하 Graph
        if (f_alnComGetScrType().graph) {
            GRAPH_DI_CHK_KEYS.forEach(key => {
                if ($("#" + key).prop("checked") !== setting[key]) {
                    $("#" + key).prop("checked", setting[key]).trigger("change");
                }
            });
            $("#sProduct").val(setting["sProduct"]).trigger("change");
            const windVal = setting.sWind.split("|");
            if (!windVal || windVal.length === 1) {
                $(`#sWind`).val("");
            } else {
                $(`#sWind > option[value='${windVal[0]}'][type='${windVal[1]}']`).prop("selected", true).trigger("change");
            }
            if (setting.alnMin) {
                $("#btnRightHide").click();
            }
            if (setting.wpMin) {
                $("#btnToggleWp").click();
            }
            MAP.setView(setting.center, setting.zoom);
            if (!$(`button.btn_map_color[value=${setting.mapType}]`).hasClass("is_active")) {
                $(`button.btn_map_color[value=${setting.mapType}]`).click();
            }
        }
    }
}

function f_alnComSaveUserUiSetting() {
    const setting = fn_getUserUiSetting();
    setting.view = f_getSelViewKey();
    setting.rVol = $("#rVol").val();
    if (f_alnComGetScrType().graph) {
        GRAPH_DI_CHK_KEYS.forEach(key => setting[key] = $("#" + key).prop("checked"));
        setting.sProduct = $("#sProduct").val();
        setting.sWind = $("#sWind").val() + "|" + ($("#sWind>option:selected").attr("type") ? $("#sWind>option:selected").attr("type") : "");
        setting.alnMin = $("#aRight").css("display") === "none";
        setting.wpMin = $("#btnToggleWp > i").hasClass("ico_up");
        setting.center = MAP.getCenter(),
            setting.zoom = MAP.getZoom(),
            setting.mapType = $("button.btn_map_color.is_active").val();
    }
    fn_setJsonCookie(USER_MENU_SET_COOKIE_KEY, setting, 30);
}

function f_alnComGetScrType() {
    const scrType = { graph: false, aln: false, graphhist: false, alnhist: false, other: false, ishist: false, cross: false, crosshist: false }
    if (document.location.href.indexOf("/graph/hist") > 0) {
        scrType.graphhist = true;
        scrType.ishist = true;
    } else if (document.location.href.indexOf("/graph") > 0) {
        scrType.graph = true;
    } else if (document.location.href.indexOf("/aln/hist") > 0) {
        scrType.alnhist = true;
        scrType.ishist = true;
    } else if (document.location.href.indexOf("/cross/hist") > 0) {
        scrType.crosshist = true;
        scrType.ishist = true;
    } else {
        scrType.other = true;
    }
    return scrType;
}

function f_alnComMonitorVolChange() {
    if ($("#rVol").val() != fn_getUserUiSetting()["rVol"]) {
        $("#rVol").val(fn_getUserUiSetting()["rVol"]).trigger("change");
    }
}
