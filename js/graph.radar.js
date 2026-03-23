const KEY_RADAR_IMAGE = "_radar_image_";
let latestRdrReq;
let rdrDt;
let ANI_RADAR;
let rdrLoader;

$(f_rdrInit);

function f_rdrInit() {
    rdrLoader = new RadarAniLoader(); //Dummy
    jidExpireManager.addExpTarget({ 
        type: JidExpireManager.MAP_LAYER, 
        mapId: KEY_RADAR_IMAGE,
        isUtc: $("#iRadarIsUtc").val()==="Y",
        delayAllowMin: $("#iRadarDelayAllowMin").val()*1,
    });
}

function f_rdrUpdateDisplay(map) {
    if ( f_aniIsPlaying() || !map.radar ) {
        return;
    }
    const fileName = map.radar[$("#sProduct").val()];
    if ( !fileName ) {
        return;
    }
    if ( !fileName.startsWith(rdrDt)) {
        latestRdrReq = null;
        f_rdrDisplay();
    }
}

async function f_rdrDisplay(e) {
    
    const type = $("#sProduct").val();
    if ( isOnDDragDrag ) {
        return;
    }
    if ( type!=="" && f_aniIsPlaying() ) {
        f_rdrLoad1hrData();
        return;
    }

    // Random Sleep 추가
    if ( !e || !e.type ) {
        const sleepMs = Math.floor( Math.random() * 1000 * $("#iRadarUpdateRandDelaySec").val() );
        await new Promise(resolve => setTimeout(resolve, sleepMs));
    }

    let radarImgLayers = fn_get_map_layers(KEY_RADAR_IMAGE);
    if ( type==="" ) {
        latestRdrReq = null;
        rdrDt = null;
        rdrLoader.clearCache();
        fn_remove_map_layer_object(radarImgLayers);
        f_rdrClearLegend();
        return;
    }
    const param = f_rdrGetParam();
    if ( f_rdrGetParamKey(param)===latestRdrReq ) { // 중복호출 방지
        return;
    }
    latestRdrReq = f_rdrGetParamKey(param);

    $.ajax({
        url: "/radar/radar.a",
        data: param,
        method: "post",
        success: (d) => {
            if ( !d || !d.result ) {
                toastr["error"]( d.message );
                return;
            }

            const limitDt = moment(lastAlnMap.dt).add( $("#iRadarIsUtc").val()==="Y"?-9:0, "h").add($("#iRadarDelayAllowMin").val()*-1, "m");
            if ( moment(d.datetime, "YYYYMMDDHHmmss").isBefore(limitDt) ) {
                rdrDt = null;
                fn_remove_map_layer(KEY_RADAR_IMAGE);
                return;
            }
            
            const imageBounds = [ [param.rtLat, param.lbLon], [param.lbLat, param.rtLon] ];
            radarImgLayers = fn_get_map_layers(KEY_RADAR_IMAGE);
            L.imageOverlay("/radar/radarImage?image="+encodeURIComponent(d.url), imageBounds, {
                id: KEY_RADAR_IMAGE, opacity: DISP_SET.lyrAlpha/100, zIndex: 10,
                dt: d.datetime,
            }).addTo(MAP);
            fn_remove_map_layer_object(radarImgLayers);
            rdrDt = d.datetime;
            f_rdrDrawLegend(d);
        },
        complete: () => {
            latestRdrReq = null;
        }
    });    
}

function f_rdrGetParam() {
    const bounds = MAP.getBounds();
    return {type: $("#sProduct").val(), 
        lbLat: bounds._southWest.lat, lbLon: bounds._southWest.lng,
        rtLat: bounds._northEast.lat, rtLon: bounds._northEast.lng,
        width: MAP.getSize().x, height: MAP.getSize().y,
    };
}

function f_rdrGetParamKey(p) {
    return `${p.type}_${p.lbLat}_${p.lbLon}_${p.rtLat}_${p.rtLon}_${p.width}_${p.height}`;
}

function f_rdrInitMapEvents() {
    MAP.on("zoomend", f_rdrDisplay);
    MAP.on("moveend", f_rdrDisplay);
}

async function f_rdrLoad1hrData() {
    if ( !$("#sProduct").val() ) {
        f_rdrClearAniData();
        return;
    }
    rdrDt = null;

    // toastr.info("재생에 필요한 레이더 영상 데이터를 조회하고 있습니다. 잠시만 기다려주세요.");
    // const param = f_rdrGetParam();
    // param["ymdhm"] = moment(ANI_DATA.at(-1).dt).format("YYYYMMDDHHmm");
    // await $.ajax({
    //     url: "/radar/load1hrPrevRadar.a",
    //     method: "post",
    //     data: param,
    //     success: (d) => {
    //         console.log(d);
    //         ANI_RADAR = d;
    //     },
    // });

    rdrLoader.clearCache();
    rdrLoader = new RadarAniLoader(f_rdrGetParam(), moment(ANI_DATA.at(-1).dt).format("YYYYMMDDHHmm"));
    if ( $("#btnPlay").hasClass("play") ) { // Pause이면
        f_radarAniDisplay( parseInt($("#rAni").val()) );
    }
    await rdrLoader.load();
}

function f_rdrClearAniData() {
    rdrLoader.clearCache();
}

async function f_radarAniDisplay(aniFrameNo) {
    fn_remove_map_layer(KEY_RADAR_IMAGE);
    const type = $("#sProduct").val();
    if ( type==="" ) {
        f_rdrClearLegend();
        return;
    }
    if ( !ANI_RADAR  ) {
        ANI_RADAR = [];
    }

    let rdrData = ANI_RADAR[aniFrameNo];
    if ( !rdrData ) {
        rdrData = await rdrLoader.loadFrame(aniFrameNo);
        console.log("frame loaded: ", rdrData);
        if ( !rdrData ) {
            return;
        }
    }
    if ( rdrData.nodata ) {
        return;
    }
    const imageBounds = [ [rdrData.param.rtLat, rdrData.param.lbLon], [rdrData.param.lbLat, rdrData.param.rtLon] ];
    L.imageOverlay("/radar/radarImage?image="+encodeURIComponent(rdrData.url), imageBounds, {
        id: KEY_RADAR_IMAGE, opacity: DISP_SET.lyrAlpha/100, zIndex: 10}).addTo(MAP);
    f_rdrDrawLegend(rdrData);
}

function f_rdrOnAniFinish() {
    rdrLoader.clearCache();
}

class RadarAniLoader {

    stopped = false;
    param;
    ymdhm;

    constructor(param, ymdhm) {
        this.param = param;
        this.ymdhm = $("#iRadarIsUtc").val()==="Y"?moment(ymdhm,"YYYYMMDDHHmm").add(-9,"h").format("YYYYMMDDHHmm"):ymdhm;
    }

    async load() {
        ANI_RADAR=[];
        const param = { ...this.param, ymdhm: moment(this.ymdhm, "YYYYMMDDHHmm").add(-59, "m").format("YYYYMMDDHHmm") };
        await $.ajax({
            url: "/radar/loadPrevRadarFrame.a",
            method: "post",
            data: param,
            success: (d) => {
                if (this.stopped) {
                    return;
                }
                if ( !d ) {
                    d = {nodata: true,};
                }
                d.param = param;
                ANI_RADAR[0] = d;
                this.loadRemainders();
            },
        });
    }

    async loadRemainders() {
        for ( let i = 1; i < 60; i++ ) {
            await this.loadFrame(i);
        }
    }

    async loadFrame(i) {
        const param = { ...this.param, ymdhm: moment(this.ymdhm, "YYYYMMDDHHmm").add(i-59, "m").format("YYYYMMDDHHmm") };
        if (this.stopped) {
            return;
        }
        if (ANI_RADAR[i]) {
            return ANI_RADAR[i];
        }
        const result = await new Promise((resolve, reject) => {
            $.ajax({
                url: "/radar/loadPrevRadarFrame.a",
                method: "post",
                data: param,
                nonblockui: true,
                success: (d) => {
                    if (this.stopped) {
                        return;
                    }
                    if ( !d ) {
                        d = {nodata: true,};
                    }
                    d.param = param;
                    ANI_RADAR[i] = d;
                    resolve(d);
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
        return result;
    }

    clearCache() {
        this.stopped = true;
        ANI_RADAR = null;
    }
}

function f_rdrDrawLegend(rdrData) {
    $pLegend = $("#pLegend");
    if ( !rdrData ) {
        return;
    }
    if ( rdrData.dataType === $pLegend.attr("type") ) {
        return;
    }
    $("#pLegend").empty();
    $pLegend.attr("type", rdrData.dataType);
    let html = `<div class='legend_unit'>${rdrData.unit}</div><div class="legend_color_bars">`;
    rdrData.ColorIndex.reverse().forEach( (r)=>{
        html += `<div style="background-color: rgb(${r[0]}, ${r[1]}, ${r[2]})" class="legend_color_bar">`
            +`<div class="legend_color_bar_text">${r[4]!=9999?r[4]:""}</div>`
            +`</div>`;
    });
    html += "</div>";
    $pLegend.append(html).show();

}

function f_rdrClearLegend() {
    $("#pLegend").empty().removeAttr("type").hide();
}

