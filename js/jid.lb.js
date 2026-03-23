function fn_switchServer() {
    const serverNo = $("#iServerNo").val();
    const serverUrlBase = getAlternativeServerUrl();
    console.log("NEW: "+ serverUrlBase);

    if(!serverUrlBase) {
        return;
    }

    $.ajax({
        url: serverUrlBase,
        success: ()=>{
            const form = document.createElement("form");
            form.method = "POST";
            form.action = serverUrlBase + "/relay";
        
            const urlInput = document.createElement("input");
            urlInput.type = "hidden";
            urlInput.name = "targetUrl";
            urlInput.value = window.location.pathname+window.location.search;
            form.appendChild(urlInput);
        
            const cookieInput = document.createElement("input");
            cookieInput.type = "hidden";
            cookieInput.name = "cookies";
            cookieInput.value = document.cookie;
            form.appendChild(cookieInput);
        
            document.body.appendChild(form);
            form.submit();            
        },
    });

    function getAlternativeServerUrl() {
        const currentUrl = window.location.href;
    
        const server1Urls = $("#iServer1UrlBase").val().split(',');
        const server2Urls = $("#iServer2UrlBase").val().split(',');
    
        for (var i = 0; i < server1Urls.length; i++) {
            if (currentUrl.startsWith(server1Urls[i])) {
                return server2Urls[i];
            }
        }
    
        for (var j = 0; j < server2Urls.length; j++) {
            if (currentUrl.startsWith(server2Urls[j])) {
                return server1Urls[j];
            }
        }
    
        return null;
    }
}

/** 서버가 빠르면 양수, 로컬이 빠르면 음수 */
let SERVER_LOCAL_TIME_DIFF_SEC = 0;

async function fn_checkServerAlive() {
    let startTime = Date.now();
    let pingCompleted = false;

    let timeoutHandler = setTimeout(() => { // 5초 이내 응답 없으면 서버 에러로 처리
        if (!pingCompleted) {
            console.warn("서버 이상 감지. 서버 전환 시도.");
            serverSwitching = true;
            fn_switchServer();
        }
    }, 5000);

    $.ajax({
        url: "/ping",
        method: "GET",
        timeout: 5000,
        success: (data, textStatus, jqXHR)=>{
            pingCompleted = true;
            clearTimeout(timeoutHandler);
            const serverDate = jqXHR.getResponseHeader("Date");
//            console.log("서버 시각:", serverDate, moment(serverDate).format("YYYYMMDDHHmmss"));
            SERVER_LOCAL_TIME_DIFF_SEC = moment.utc(serverDate).local().diff( moment(), "seconds" );
//            console.log(SERVER_LOCAL_TIME_DIFF_SEC);
        },
        error: ()=>console.error("서버 Alive Check 실패"),
    });
}

function fn_getServerMoment() {
    return moment().add(SERVER_LOCAL_TIME_DIFF_SEC, "seconds");
}

setInterval(fn_checkServerAlive, 10000);
