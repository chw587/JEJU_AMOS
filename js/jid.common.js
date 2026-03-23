const MAP_CENTER = [33.51222222, 126.4927778]

$(document)
    .ajaxError(
        function (e, jqXHR, ajaxSettings, exception) {
            if (jqXHR.status === 0) {
                toastr["error"]('연결할 수 없습니다. 네트워크를 확인하십시오.');
                fn_switchServer();
            }
            else if (jqXHR.status == 400) {
                toastr["error"]('서버에서 에러가 발생했습니다. 요청이 올바르지 않습니다. (400)');
            }
            else if (jqXHR.status == 401 || jqXHR.status == 302) {
                toastr["error"]('로그인이 필요합니다. <br />잠시 후 로그인 화면으로 이동합니다.');
                setTimeout(() => {
                    document.location.replace("/login/login.d");
                }, 2000);
            }
            else if (jqXHR.status == 403) {
                toastr["error"]('접근 권한이 없습니다.');
            }
            else if (jqXHR.status == 404) {
                toastr["error"]('페이지를 찾을 수 없습니다.');
            }
            else if (jqXHR.status == 503) {
                toastr["error"]('서버가 서비스가 불가능합니다. 자세한 내용은 관리자에게 문의하시기 바랍니다.');
            }
            else if (exception === 'parsererror') {
                toastr["error"]('Requested JSON parse failed. [Failed]');
            }
            else if (exception === 'timeout') {
                toastr["error"]('Time out error. [Timeout]');
            }
            else if (exception === 'abort') {
                toastr["error"]('Ajax request aborted. [Aborted]');
            }
            else {
                var msg = "서버에서 처리 중 에러가 발생했습니다. 관리자에게 문의하시기 바랍니다. (1)";

                try {
                    if (jqXHR.responseText.trim() != "" && $.parseJSON(jqXHR.responseText) && $.parseJSON(jqXHR.responseText).message) {
                        msg = $.parseJSON(jqXHR.responseText).message;
                    }
                } catch (e) {

                }
                toastr["error"](msg);
            }
        }
    )
    .ajaxSend(fn_before_ajax_send)
    .ajaxComplete(fn_unblock_screen);


//TODO 동시성 해결
var SCR_BLOCK_COUNT = 0;
function fn_before_ajax_send(event, xhr, options) {
    //	const token = $("meta[name='_csrf']").attr("content")
    //	const header = $("meta[name='_csrf_header']").attr("content");
    //	xhr.setRequestHeader(header, token); 

    if (!options.blockui) {
        return;
    }
    SCR_BLOCK_COUNT++;
    if (SCR_BLOCK_COUNT == 1) {
        $.blockUI({ baseZ: 2000, message: '<img src="/images/loading01.gif" style="width:50px;" />' });
    }
}

function fn_unblock_screen(event, xhr, options) {
    if (!options.blockui) {
        return;
    }
    SCR_BLOCK_COUNT--;
    if (SCR_BLOCK_COUNT < 1) {
        $.unblockUI();
    }
}

function fn_remove_map_layer(layerIds) {
    let ids = layerIds;
    if (!Array.isArray(layerIds)) {
        ids = [layerIds];
    }

    MAP.eachLayer(layer => {
        if (ids.includes(layer.options.id)) {
            MAP.removeLayer(layer);
        }
    });
}

function fn_get_map_layers(layerIds) {
    const layers = [];
    let ids = layerIds;
    if (!Array.isArray(layerIds)) {
        ids = [layerIds];
    }
    MAP.eachLayer(layer => {
        if (ids.includes(layer.options.id)) {
            layers.push(layer);
        }
    });
    return layers;
}

function fn_remove_map_layer_object(layers) {
    if (!layers) {
        return;
    }
    layers.forEach(l => MAP.removeLayer(l));
}

function fn_getCustomRunwaySetting() {
    // 기능은 cookie로 할 예정
    const dispRwy = fn_getJsonCookie("dispRwy");
    if (dispRwy === undefined || dispRwy.rwys === undefined || dispRwy.rwys === null || !Array.isArray(dispRwy.rwys) || dispRwy.rwys.length === 0) {
        return ["1D", "1A", "2D", "2A"];
    }
    return dispRwy.rwys;
}

function fn_getCustomActiveRunways(amos) {

    const firstRunway = amos.mainRunway === "07" || amos.mainRunway === "25" ? amos.mainRunway : amos.subRunway;
    const secondaryRunway = amos.mainRunway === "13" || amos.mainRunway === "31" ? amos.mainRunway : amos.subRunway;

    return fn_getCustomRunwaySetting().map(rw => {

        if (rw === "1A" || rw === "1D" || rw === "2A" || rw === "2D") {
            if (rw.startsWith("1")) {
                return firstRunway + rw.charAt(1);
            }
            return secondaryRunway + rw.charAt(1);
        } else {
            return rw;
        }
    });

}

function JidBizError(message = "") {
    this.name = "JidBizError";
    this.message = message;
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, JidBizError);
    } else {
        this.stack = (new Error(message)).stack;
    }
}
JidBizError.prototype = Object.create(Error.prototype);
JidBizError.prototype.constructor = JidBizError;

// Common WS Subscription -------------------------------------------------------------------------
let jidUpdateWsClient;
let jidUpdateSubscription;
let blockByWsErr = false;
const wsReconnectInterval = 3000;
let wsErrorCount = 0;
let serverStartDt;
let wsManualDisconnect = false;
let wsClosed = false;
async function fn_wsConnect(callbackFunc) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const socket = new SockJS('/ws');
    jidUpdateWsClient = Stomp.over(socket);
    jidUpdateWsClient.debug = null;

    $("body").on("beforeunload", fn_wsDisconnect).on("unload", fn_wsDisconnect);

    jidUpdateWsClient.connect(
        {},
        function (frame) {
            if (blockByWsErr) {
                $("#dError").hide();
                blockByWsErr = false;
            }
            wsClosed = false;

            // WebSocket topic 구독
            jidUpdateSubscription = jidUpdateWsClient.subscribe('/jid/updates', (message) => {
                const map = JSON.parse(message.body);
                if (serverStartDt && serverStartDt != map.serverStartDt) {
                    document.location.reload();
                    return;
                }
                serverStartDt = map.serverStartDt;
                callbackFunc(map);
                wsErrorCount = 0;
                wsManualDisconnect = false;
            });

            jidUpdateWsClient.ws.onclose = function () {
                if (wsManualDisconnect) {
                    return;
                } else {
                    console.error('웹소켓이 비정상으로 종료됨.');
                    fn_wsOnError(callbackFunc);
                }
            };

            jidUpdateWsClient.ws.onerror = function (error) {
                if (!wsManualDisconnect) {
                    console.error('웹소켓 에러:', error);
                    fn_wsOnError(callbackFunc);
                }
            };
        },
        function (error) {
            console.error('웹소켓 접속이 끊어짐.');
            fn_wsOnError(callbackFunc);
        }
    );
}

function fn_wsOnError(callbackFunc) {
    if (wsClosed) {
        return;
    }
    wsClosed = true;
    if (wsErrorCount > 1) {
        if ($("#dError").length > 0 && $("#dError").css("display") === "none") {
            $("#dError > p").text("최신 자료 업데이트 실패 (재시도중)");
            $("#dError").show();
            blockByWsErr = true;
        }
    }
    console.error(wsReconnectInterval / 1000 + '초 후 접속 재시도...');
    setTimeout(() => {
        wsClosed = false;
        fn_wsConnect(callbackFunc);
    }, wsReconnectInterval);
    wsErrorCount++;
}

function fn_wsDisconnect() {
    wsManualDisconnect = true;

    if (jidUpdateSubscription) {
        jidUpdateSubscription.unsubscribe(); // 구독 중단
        jidUpdateSubscription = null;
        console.log('/jid/updates 구독 해제');
    }

    if (jidUpdateWsClient) {
        jidUpdateWsClient.disconnect(() => {
            console.log('웹소켓 접속 종료');
            jidUpdateWsClient = null;
        });
    }
}

const USER_MENU_SET_COOKIE_KEY = "_useruiset_";

// 사용자 UI 설정 조회/세팅
function fn_getUserUiSetting() {
    // 사용자 UI 설정 기본
    const USER_MENU_SET_DEFAULT = {
        view: "combined",
        wpMin: false,
        alnMin: false,
        sProduct: "",
        sWind: "",
        cWpr: true,
        cLlwas: true,
        cAmos: true,
        cMap: true,
        cArena: true,
        cFlyRoute: true,
        cObsCircle: true,
        rVol: "1",
        center: [33.51222222, 126.4927778],
        zoom: 13,
        mapType: "hcmap",
    };

    let userSet = fn_getJsonCookie(USER_MENU_SET_COOKIE_KEY);
    return { ...USER_MENU_SET_DEFAULT, ...userSet };
}

// JSON 데이터를 쿠키에 저장하는 함수
function fn_setJsonCookie(name, jsonData, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    var jsonString = JSON.stringify(jsonData); // JSON 데이터를 문자열로 변환
    document.cookie = name + "=" + encodeURIComponent(jsonString) + expires + "; path=/";
}

// JSON 데이터를 쿠키에서 읽어오는 함수
function fn_getJsonCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) == ' ') cookie = cookie.substring(1, cookie.length);
        if (cookie.indexOf(nameEQ) == 0) {
            var jsonString = decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
            let json = JSON.parse(jsonString);

            if (name === "sysSetting") {
                if (json.crossWsAttn === undefined) {
                    json.crossWsAttn = 20;
                }

                if (json.crossWsWarn === undefined) {
                    json.crossWsWarn = 30;
                }

                if (json.crossWsDgr === undefined) {
                    json.crossWsDgr = 40;
                }

                if (json.fontSize === undefined) {
                    json.fontSize = 1;
                }
            }
            return json; // 문자열을 JSON 객체로 변환
        }
    }

    if (name === "sysSetting") {
        let sysSetting = {};
        sysSetting.dispLatLonType = "digit";
        sysSetting.blnkgTm = 4000;
        sysSetting.blnkgCyc = 1000;
        sysSetting.lyrAlpha = 50;
        sysSetting.fontSize = 1;
        sysSetting.mbaBackColor = "#FF0000";
        sysSetting.mbaFontColor = "#000000";
        sysSetting.wsaBackColor = "#FFFF00";
        sysSetting.wsaFontColor = "#000000";
        sysSetting.microColor = "#FF00FF";
        sysSetting.gustColor = "#790175";
        sysSetting.crossWsAttn = 20;
        sysSetting.crossWsWarn = 30;
        sysSetting.crossWsDgr = 40;
        return sysSetting;
    } else if (name === "dispRwy") {
        let dispRwy = {};
        dispRwy.type = "P";
        dispRwy.rwys = ["1A", "1D", "2D"];
        return dispRwy;
    } else {
        return {};
    }


}

class LRU {
    constructor(max = 10) {
        this.max = max;
        this.cache = new Map();
    }

    get(key) {
        let item = this.cache.get(key);
        if (item !== undefined) {
            // refresh key
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key, val) {
        // refresh key
        if (this.cache.has(key)) this.cache.delete(key);
        // evict oldest
        else if (this.cache.size === this.max) this.cache.delete(this.first());
        this.cache.set(key, val);
    }

    first() {
        return this.cache.keys().next().value;
    }
}


/**
 * sysSetting.dispLatLonType = digit 이면, 소수점 표출
 *                             degree이면  도분초 표출 toDMS( ) 사용 표출
 */
function toDMS(deg) {
    var d = Math.floor(deg);
    var minfloat = (deg - d) * 60;
    var m = Math.floor(minfloat);
    var secfloat = (minfloat - m) * 60;
    var s = Math.round(secfloat);
    // 이후 초의 값이 60이 되면 0으로 설정하고 분을 1 증가시킵니다
    if (s == 60) {
        m++;
        s = 0;
    }
    // 이후 분의 값이 60이 되면 0으로 설정하고 도를 1 증가시킵니다
    if (m == 60) {
        d++;
        m = 0;
    }
    return ("" + d + "°" + m + "'" + s + "\"");
}

function fc_getMagNorth(degOrg) {
    const deg = parseInt(degOrg) - parseInt($("#iTrueNorthOffset").val());
    return deg < 0 ? deg + 360 : deg;
}