$(f_init);
let MAP;
let FM_MAP = {};
let dragStartCenter;
let isOnDDragDrag = false;
const KEY_TILE_LAYER = "_tile_layer_";
const KEY_L_NM = "_key_l_nm_";
const KEY_GUST_FRONT = "_gust_front_";
const KEY_MICROBURST = "_microburst_";
const KEY_AMOS_OBS = "_amos_obs_"
const KEY_WP_OBS = "_wp_obs_";
const KEY_LLWAS_SENSORS = "_llwas_sensors_";
const KEY_ARENA_ALERT = "_arena_alert_";
const DISP_SET = fn_getJsonCookie("sysSetting");
const LLWAS_SENSORS_LOCS = [
    [33.50492, 126.49261], [33.51925, 126.49457], [33.53295, 126.54114], [33.51421, 126.51605], [33.49315, 126.54088], [33.49165, 126.51530],
    [33.49371, 126.46876], [33.48068, 126.45170], [33.48632, 126.43832], [33.49973, 126.45521], [33.50838, 126.47478],
];

function f_init() {
    f_initMap();
    f_initBtns();
    f_initSelect();
    $(window).resize(f_onWindowResize);
    document.addEventListener('dragstart', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());

    f_onWindowResize();

    if (f_alnComGetScrType().ishist) {
        return;
    }
    f_loadFirst();
    fn_wsConnect(f_display);

    jidExpireManager.addExpTarget({
        type: JidExpireManager.MAP_LAYER,
        mapId: KEY_WP_OBS,
        isUtc: $("#iWpIsUtc").val() === "Y",
        delayAllowMin: $("#iWpDelayAllowMin").val() * 1,
    });
    jidExpireManager.addExpTarget({
        type: JidExpireManager.MAP_LAYER, mapId: KEY_AMOS_OBS, isUtc: false,
        delayAllowMin: $("#iAmosObsDelayAllowMin").val() * 1,
    });
    jidExpireManager.addExpTarget({
        type: JidExpireManager.MAP_LAYER, mapId: KEY_LLWAS_SENSORS, isUtc: true,
        delayAllowMin: $("#iAmosObsDelayAllowMin").val() * 1,
    });
    jidExpireManager.addExpTarget({
        type: JidExpireManager.CUSTOM,
        processor: f_processExpiredWindProfiler,
    });
}

function f_initBtns() {
    //$("button.btn_view").click(f_onBtnViewClick);
    $("button.btn_view").click(f_onBtnViewClick2);

    // $("#btnAln").click(() => document.location = '/aln');
    // $("#btnCross").click(() => document.location = '/cross');

    $("#btnRightHide").click(() => {
        const center = MAP.getCenter();
        $("#dMenuBtnArea").addClass("is_only");
        $("#aLeft").css("flex", "");
        // 250813
        $("#btnRightShow").css("display", "block")
        $("#aRight").hide(0, () => {
            // ✅ aRight 사라진 후 실행
            $(".info_area").css("border-radius", "15px");
            MAP.invalidateSize();
            MAP.setView(center);
        });
    });

    $("#btnRightShow").click(() => {
        console.log("btnRightShow clicked"); // 디버깅 로그

        const center = MAP.getCenter();
        $("#aRight").css("display", "flex");
        // 250813
        $("#btnRightShow").css("display", "none");

        requestAnimationFrame(() => {
            MAP.invalidateSize();
            MAP.setView(center);
        });

        $("#dMenuBtnArea").removeClass("is_only");

        // border-radius 강제 초기화
        $(".info_area").each(function () {
            // 희원 260812 ( !important 제거 )
            this.style.setProperty('border-radius', '0 15px 15px 0');
        });
    });


    $("button.btn_nm").click(f_onNauticalMileChange);
    $("#btnToggleWp").click(f_toggleWindProfiler);

    $("#dDrag").draggable({
        axis: "x",
        start: () => {
            dragStartCenter = MAP.getCenter();
            isOnDDragDrag = true;
        },
        drag: function (event, ui) {
            const containerWidth = $("#dDrag").parent().width();
            const dragPosition = ui.position.left;

            const leftWidth = Math.max(0, dragPosition);
            const rightWidth = containerWidth - dragPosition - $("#dDrag").width();

            $("#aLeft").css("flex", `0 0 ${leftWidth}px`);
            $("#aRight").css("flex", `0 0 ${rightWidth}px`);

            requestAnimationFrame(() => {
                MAP.invalidateSize();
            });
        },
        stop: () => {
            isOnDDragDrag = false;
            MAP.fire("moveend");
        },
        containment: "parent"
    });

    $("button.btn_map_color").click(f_onMapColorDispBtnClick);
    $("#btnHist").click(() => document.location = 'graph/hist.html');
}


function f_initSelect() {
    let optsStream = "";
    let optsVector = "";
    $("#iGraphWindFt").val().split(",").reverse().forEach(ft => {
        optsStream += `<option value="${ft}" type="stream">스트림-${parseInt(ft).toLocaleString()}ft</option>`;
        optsVector += `<option value="${ft}" type="vector">바람깃-${parseInt(ft).toLocaleString()}ft</option>`;
    });
    $("#sWind").append(optsStream + optsVector);
    $("#sWind").change(f_windDisplay);
    $('#sWind').on('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    });
    $("#sProduct").change(f_rdrDisplay);
    $("#cAmos").change(() => f_displayAmosObs(FM_MAP));
    $("#cWpr").change(() => f_displayWindProfilerObs(FM_MAP));
    $("#cLlwas").change(() => f_displayLlwasSensors(FM_MAP));
    $("#cMap").change(() => f_onMapColorDispBtnClick());
    $("#cArena").change(() => f_drawArenas());
    $("#cFlyRoute").change(() => f_drawAirPath());
    $("#cObsCircle").change(() => f_onNauticalMileChange());
    $("body").click(function (e) {
        if ($(e.target).is("#dDispItems") || $.contains($("#dDispItems")[0], e.target)) {
            return;
        }
        $("#dDispItems").removeAttr("open");
    });
}

function f_toggleWindProfiler() {
    const $i = $("#btnToggleWp > i");
    if ($i.hasClass("ico_down")) {
        $i.removeClass("ico_down").addClass("ico_up");
        $("#tWp").hide();
        $("article.real_num > ul > li").addClass("v_wide");
    } else {
        $i.removeClass("ico_up").addClass("ico_down");
        $("#tWp").show();
        $("article.real_num > ul > li").removeClass("v_wide");
    }
}

function f_onMapColorDispBtnClick() {
    fn_remove_map_layer(KEY_TILE_LAYER);
    if ($(this).hasClass("btn_map_color")) { // button.btn_map_color 클릭 시
        $("button.btn_map_color").removeClass("is_active");
        $(this).addClass("is_active");
    }
    if (!$("#cMap").prop("checked")) {
        return;
    }
    if ($("button.btn_map_color.is_active").val() === "hc") {
        L.tileLayer("/hcmap/tile/{z}/{x}/{y}.png", { id: KEY_TILE_LAYER }).addTo(MAP);
    } else {
        L.tileLayer("/map/tile/{z}/{x}/{y}.png", { id: KEY_TILE_LAYER }).addTo(MAP);
    }
}

function f_initMap() {
    MAP = L.map('dMap', {
        layers: [L.tileLayer("/hcmap/tile/{z}/{x}/{y}.png", { id: KEY_TILE_LAYER })],
        attributionControl: false,
        zoomControl: false,
        maxBounds: L.latLngBounds(
            L.latLng(20, 110),
            L.latLng(45, 150)),
        minZoom: 6,
        maxZoom: 16,
    });
    MAP.setView(MAP_CENTER, 13);
    MAP.on("mousemove", (e) => {
        if (DISP_SET.dispLatLonType === "digit") {
            $("#sLat").text("위도 " + e.latlng.lat.toFixed(4));
            $("#sLon").text("경도 " + e.latlng.lng.toFixed(4));
        } else {
            $("#sLat").text("위도 " + toDMS(e.latlng.lat));
            $("#sLon").text("경도 " + toDMS(e.latlng.lng));
        }
    });
    L.control.scale({ metric: true, imperial: false, position: "bottomright", maxWidth: 70, }).addTo(MAP);
    L.control.zoom({ position: "topright", }).addTo(MAP);
    f_initShapes();
    f_onNauticalMileChange();
    f_windInitStreamLayer();
    f_rdrInitMapEvents();
    MAP.on("zoom", f_adjustAlertArenaFont);
    MAP.on("zoomend", () => {
        $("div.wind-barb-icon").css("z-index", "20");
        $("div.map_amosobs").css("z-index", "25");
    });
}

function f_onWindowResize() {
    $("#dDrag").css("left", $("#aLeft").width() + "px");
}

function f_initShp() {
    fetch("/shp/v1.zip")
        .then(res => res.arrayBuffer())
        .then(buffer => {
            new L.Shapefile(buffer, {
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        layer.bindPopup(Object.keys(feature.properties).map(
                            key => `${key}: ${feature.properties[key]}`
                        ).join('<br />'));
                    }
                }
            }).addTo(MAP);
        })
        .catch(err => console.error('Error loading shapefile:', err));
}

function f_onNauticalMileChange() {
    if (this) {
        $(this).addClass("is_active").parent().siblings().find("button.btn_nm").removeClass("is_active");
    }
    const selNm = $("#btnNm > li > button.btn_nm.is_active").text();
    const selMeter = selNm * 1852;
    fn_remove_map_layer(KEY_L_NM);
    MAP.setView(MAP_CENTER, { N3: 13, N6: 12, N32: 10, N64: 9 }[`N${selNm}`]);
    if (!$("#cObsCircle").prop("checked")) {
        return;
    }

    L.circle(MAP_CENTER, { radius: selMeter, weight: 1, color: "#444", fillOpacity: 0, id: KEY_L_NM, className: "map_nm_circle" }).addTo(MAP);

    const latLng = L.latLng(MAP_CENTER[0], MAP_CENTER[1]);
    const top = L.GeometryUtil.destination(latLng, 0, selMeter);
    const right = L.GeometryUtil.destination(latLng, 90, selMeter);
    const bottom = L.GeometryUtil.destination(latLng, 180, selMeter);
    const left = L.GeometryUtil.destination(latLng, 270, selMeter);
    const options = { weight: 1, color: "#444", id: KEY_L_NM, className: "map_nm_circle" };

    const topText = L.marker(top, {
        icon: L.divIcon({
            className: `nautical-mile-label`, html: selNm + " NM",
            iconSize: [50, 20], iconAnchor: [25, 20]
        }), id: KEY_L_NM
    }).addTo(MAP);

    L.polyline([top, [90.0, top.lng]], options).addTo(MAP);
    L.polyline([bottom, [-90.0, bottom.lng]], options).addTo(MAP);
    L.polyline([left, [left.lat, 0]], options).addTo(MAP);
    L.polyline([right, [right.lat, 364.9]], options).addTo(MAP);
}

function f_loadFirst() {
    $.ajax({
        url: "/aln/alndata.a",
        nonblockui: true,
        success: (map) => {
            f_display(map);
        },
        error: () => {
            f_displayError("데이터를 불러오는 중 문제가 발생했습니다.");
        }
    });
}

function f_display(map) {
    if (map) {
        console.log(map);
    }
    if (!map) {
        map = FM_MAP;
    }
    FM_MAP = map;
    f_displayAln(map);
    f_displayAlnAlert(map);
    f_displayWindProfiler(map);
    f_displayGustFront(map);
    f_displayMicroburst(map);
    f_displayAmosObs(map);
    f_displayWindProfilerObs(map);
    f_displayLlwasSensors(map);
    f_windUpdateDisplay(map);
    f_rdrUpdateDisplay(map);
}

function f_displayWindProfiler(map) {
    const $tbody = $("#tWp > tbody");

    // if ( $tbody.attr("r07filedt")===map.wp.r07FileDt 
    //         && $tbody.attr("r25filedt")===map.wp.r25FileDt ) {
    //     return;
    // }
    fi_emptyTbody();
    if (!map.wp || !map.wp.r07FileDt) {
        return;
    }
    if (!f_isExpiredWindProfilerData(map.dt, map.wp.r07FileDt)) {
        $tbody.attr("r07filedt", map.wp.r07FileDt);
        map.wp.r07Winds.forEach((wind) => {
            const tr = $tbody.find(`tr[ht=${wind.height.substring(1)}]`);
            const imgHtml = `<span class="arrow_"><img src="/images/ico_arrow_0.png" `
                + `style="transform: rotate(${wind.wd}deg);"></span>`;
            tr.find("td:eq(1)").html(`${imgHtml}<span class="wd">${wind.wd == 0 ? 360 : wind.wd}</span> / <span class="ws">${wind.ws}</span>`);
        });
    }
    if (!f_isExpiredWindProfilerData(map.dt, map.wp.r25FileDt)) {
        $tbody.attr("r25filedt", map.wp.r25FileDt);
        map.wp.r25Winds.forEach((wind) => {
            const tr = $tbody.find(`tr[ht=${wind.height.substring(1)}]`);
            const imgHtml = `<span class="arrow_"><img src="/images/ico_arrow_0.png" `
                + `style="transform: rotate(${wind.wd}deg);"></span>`;
            tr.find("td:eq(2)").html(`${imgHtml}<span class="wd">${wind.wd == 0 ? 360 : wind.wd}</span> / <span class="ws">${wind.ws}</span>`);
        });
    }

    function fi_emptyTbody() {
        $tbody.empty().removeAttr("r07FileDt").removeAttr("r25FileDt");
        const dispHeights = $("#iWpHeightFt").val().trim().split(",");
        const heights = $("#iWpHeight").val().trim().split(",");
        dispHeights.forEach((ft, i) => {
            $tbody.prepend(`<tr ht='${heights[i]}'><td>${ft} ft</td><td>-</td><td>-</td></tr>`);
        });
    }
}

function f_processExpiredWindProfiler() {
    const $tbody = $("#tWp > tbody");
    if (f_isExpiredWindProfilerData(fn_getServerMoment(), $tbody.attr("r07filedt"))) {
        $tbody.removeAttr("r07filedt").find("tr").each((i, tr) => $(tr).find("td:eq(1)").text("-"));
    }
    if (f_isExpiredWindProfilerData(fn_getServerMoment(), $tbody.attr("r25filedt"))) {
        $tbody.removeAttr("r25filedt").find("tr").each((i, tr) => $(tr).find("td:eq(2)").text("-"));
    }
}

function f_isExpiredWindProfilerData(nowDt, dt) {
    if (f_aniIsPlaying()) {
        return false;
    }
    const dataDt = moment(dt, "YYYYMMDDHHmm");
    const basisDt = moment(nowDt).add(($("#iWpIsUtc").val() === "Y" ? -9 : 0), "h").add($("#iWpDelayAllowMin").val() * -1, "m");
    if (dataDt.isBefore(basisDt)) {
        return true;
    }
}

function f_displayGustFront(map) {
    fn_remove_map_layer(KEY_GUST_FRONT);
    if (!map.atcpd && f_aniIsPlaying()) {
        return;
    }

    const view = map.atcpd[f_getSelViewKey()];
    const gfs = view.gustFronts;
    if (!gfs || !gfs.length) {
        return;
    }
    gfs.forEach((gf) => {
        const coors = gf.lats.map(lat => [lat]);
        gf.lons.forEach((lon, i) => coors[i].push(lon));
        L.polyline(coors, { id: KEY_GUST_FRONT, color: DISP_SET.gustColor, className: "map_microburst" }).addTo(MAP);
    });
}

function f_displayMicroburst(map) {
    fn_remove_map_layer(KEY_MICROBURST);
    if (!map.atcpd && f_aniIsPlaying()) {
        return;
    }

    const view = map.atcpd[f_getSelViewKey()];
    const mbs = view.microbursts;
    if (!mbs || !mbs.length) {
        return;
    }

    mbs.forEach((mb) => {
        if (!mb.lat) {
            return;
        }
        L.circle([mb.lat, mb.lon], {
            radius: mb.size * 1000, id: KEY_GUST_FRONT, color: DISP_SET.microColor, fillOpacity: 0, className: "map_microburst"
        }).addTo(MAP);
        L.circleMarker([mb.lat, mb.lon], {
            radius: 2, id: KEY_GUST_FRONT, fillColor: DISP_SET.microColor, color: DISP_SET.microColor,
            fillOpacity: 1, className: "map_microburst"
        }).addTo(MAP);
    });
}

// 지도 위 AMOS 바람깃 표시
function f_displayAmosObs(map) {
    fn_remove_map_layer(KEY_AMOS_OBS);

    if (!$("#cAmos").prop("checked")) {
        return;
    }
    if (!map || !map.amosobs || !map.amosobs.map) {
        return;
    }

    if (!f_aniIsPlaying()) { // Check AmosObs is expired
        const delayAllowMin = $("#iAmosObsDelayAllowMin").val() * 1;
        const dataDt = moment(map.amosobs.fileDt, "YYYYMMDDHHmmss");
        if (fn_getServerMoment().add(delayAllowMin * -1, "m").isAfter(dataDt)) { // KST
            return; // expired
        }
    }

    const locs = { "07": [33.50269197, 126.4712102], "25": [33.51403589, 126.4935349], "13": [33.51416495, 126.491781], "31": [33.50780276, 126.5019039] };
    $.each(map.amosobs.map, (idx, amosObs) => {
        const loc = locs[amosObs.rwy];
        const svgIcon = L.divIcon({
            className: 'wind-barb-icon map_amosobs',
            html: f_getWindBarbSvg(amosObs.ws, { color: "#00f", width: 30 }),
            iconSize: [30, 30],
            iconAnchor: [15, 25], // 중심점 설정
        });
        L.marker(loc, {
            icon: svgIcon, rotationAngle: amosObs.wd, id: KEY_AMOS_OBS, pane: "overlayPane",
            dt: map.amosobs.fileDt,
        }).addTo(MAP);
        const svgIcon2 = L.divIcon({
            className: 'wind-barb-icon map_amosobs',
            html: f_getWindBarbLocSvg("amos"),
            iconSize: [12, 12],
            iconAnchor: [6, 6], // 중심점 설정
        });
        L.marker(loc, { icon: svgIcon2, id: KEY_AMOS_OBS, pane: "overlayPane", dt: map.amosobs.fileDt }).addTo(MAP);
        $("div.map_amosobs").css("z-index", "25");
    });
}

// 지도 위 WPR 바람깃 표시
function f_displayWindProfilerObs(map) {
    fn_remove_map_layer(KEY_WP_OBS);

    if (!$("#cWpr").prop("checked")) {
        return;
    }
    if (!map || !map.wp || !map.wp.r07Winds) {
        return;
    }
    const svgBaseIcon = L.divIcon({
        className: 'wind-barb-icon map_amosobs',
        html: f_getWindBarbLocSvg("wpr"),
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
    const loc07 = [33.476746, 126.431681];
    const loc25 = [33.514029, 126.529368];

    if (!f_isExpiredWindProfilerData(map.dt, map.wp.r07FileDt)) {
        L.marker(loc07, { icon: svgBaseIcon, id: KEY_WP_OBS, dt: map.wp.r07FileDt + "00" }).addTo(MAP);
        map.wp.r07Winds.filter(wind => wind.height === "H200").forEach(wind => { //07WPR
            const svgWbIcon = L.divIcon({
                className: 'wind-barb-icon map_amosobs',
                html: f_getWindBarbSvg(wind.ws, { color: "#00B0F0", width: 40 }),
                iconSize: [40, 40],
                iconAnchor: [20, 34],
            });
            L.marker(loc07, { icon: svgWbIcon, rotationAngle: wind.wd, id: KEY_WP_OBS, pane: "overlayPane", dt: map.wp.r07FileDt + "00" }).addTo(MAP);
        });
    }
    if (!f_isExpiredWindProfilerData(map.dt, map.wp.r25FileDt)) {
        L.marker(loc25, { icon: svgBaseIcon, id: KEY_WP_OBS, dt: map.wp.r25FileDt + "00" }).addTo(MAP);
        map.wp.r25Winds.filter(wind => wind.height === "H100").forEach(wind => { //25WPR
            const svgWbIcon = L.divIcon({
                className: 'wind-barb-icon map_amosobs',
                html: f_getWindBarbSvg(wind.ws, { color: "#00B0F0", width: 40 }),
                iconSize: [40, 40],
                iconAnchor: [20, 34],
            });
            L.marker(loc25, { icon: svgWbIcon, rotationAngle: wind.wd, id: KEY_WP_OBS, pane: "overlayPane", dt: map.wp.r25FileDt + "00" }).addTo(MAP);
        });
    }
    $("div.map_amosobs").css("z-index", "25");
}

// 지도 위 LLWAS 표시
function f_displayLlwasSensors(map) {
    fn_remove_map_layer(KEY_LLWAS_SENSORS);

    if (!$("#cLlwas").prop("checked")) {
        return;
    }
    if (!map || !map.llwas) {
        return;
    }

    if (!f_aniIsPlaying()) { // Check AmosObs is expired
        const delayAllowMin = $("#iAmosObsDelayAllowMin").val() * 1;
        const dataDt = moment(map.llwas.fileDt, "YYYYMMDDHHmmss");
        if (fn_getServerMoment().add(-9, "h").add(delayAllowMin * -1, "m").isAfter(dataDt)) { // UTC
            return; // expired
        }
    }

    LLWAS_SENSORS_LOCS.forEach((loc, i) => {
        const wd = map.llwas["rsWd" + String(i + 1).padStart(3, "0")];
        const ws = map.llwas["rsWspd" + String(i + 1).padStart(3, "0")];
        if (wd === null || wd === "" || ws === null || ws === "") {
            return;
        }

        const svgIcon = L.divIcon({
            className: 'wind-barb-icon map_llwas_sensors',
            html: f_getWindBarbSvg(parseInt(ws), { color: "#080", width: 30 }),
            iconSize: [30, 30],
            iconAnchor: [15, 25], // 중심점 설정
            interactive: true,
        });
        L.marker(loc, {
            icon: svgIcon, rotationAngle: fc_getMagNorth(wd), id: KEY_LLWAS_SENSORS, pane: "overlayPane",
            dt: map.llwas.fileDt,
        }).addTo(MAP);
        const svgIcon2 = L.divIcon({
            className: 'wind-barb-icon map_llwas_sensors',
            html: f_getWindBarbLocSvg("llwas"),
            iconSize: [12, 12],
            iconAnchor: [6, 6], // 중심점 설정
            interactive: true,
        });
        L.marker(loc, { icon: svgIcon2, id: KEY_LLWAS_SENSORS, pane: "overlayPane", dt: map.llwas.fileDt }).addTo(MAP);
        $("div.map_llwas_sensors").css("z-index", "25");
    });
}

function f_getWindBarbSvg(knot, op = {}) {
    op = { color: "#000", width: 40, drawSlowWind: false, rotate: 0, ...op };
    //let knot  = Math.round(iKnot);
    let pos = 40;
    let html = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" preserveAspectRatio="xMidYMid meet" width="${op.width}" height="${op.width / 2}" overflow="visible" class="svg_wind_bulba">`;
    html += `<g transform-origin="20px 20px" transform="translate(0, -10)rotate(${op.rotate - 90})">`;
    if (!knot) {
        html += `</g></svg>`;
        return html;
    }
    if (knot < 5) {
        if (op.drawSlowWind) {
            html += `<circle r="6" cx="20" cy="10" stroke="${op.color}" fill="#FFFFFF00" stroke-width="2" class="wind-barb-zero-knots-circle"></circle>`;
        }
        html += `</g></svg>`;
        return html;
    }
    html += `<line x1="0" y1="20" x2="40" y2="20" stroke-width="3" stroke="${op.color}"></line>`;
    while (knot >= 50) {
        html += `<g><path d="M${pos}, 20, ${pos - 10}, 20, ${pos}, 37.320508075688771z" stroke="${op.color}" fill="${op.color}"></path></g>`
        knot -= 50;
        pos -= 14;
    }
    while (knot >= 10) {
        html += `<g><line x1="${pos}" y1="20" x2="${pos}" y2="0" stroke="${op.color}" stroke-width="3" transform-origin="${pos} 20" transform="rotate(150)"></line></g>`
        knot -= 10;
        pos -= 7;
    }
    if (knot >= 5) {
        if (pos === 40) {
            pos -= 7;
        }
        html += `<g><line x1="${pos}" y1="20" x2="${pos}" y2="10" stroke="${op.color}" stroke-width="3" transform-origin="${pos} 20" transform="rotate(150)"></line></g>`
        knot -= 10;
        pos -= 7;
    }
    html += `</g></svg>`;
    return html;
}

function f_getWindBarbLocSvg(type) {
    return {
        "llwas": `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle r="4" cx="6" cy="6" stroke="#000" fill="#FFFFFF00" stroke-width="2" class="wind-barb-zero-knots-circle"></circle></svg>`,
        "wpr": `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" stroke="#000" fill="#FFFFFF00" stroke-width="2" class="wind-barb-zero-knots-rect"></rect></svg>`,
        "amos": `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><polygon points="1,11 11,11 6,2.34" stroke="#000" fill="#FFFFFF00" stroke-width="2"></polygon></svg>`,
    }[type];
}

// ARENA Alert 표출
function f_displayAlnAlert(map) {
    fn_remove_map_layer(KEY_ARENA_ALERT);
    if (!map.atcpd && f_aniIsPlaying()) {
        return;
    }

    const view = map.atcpd[f_getSelViewKey()];
    if (!view) {
        return;
    }
    const isManual = map.rwy && map.rwy.type === "M";
    const rws = fn_getCustomActiveRunways(isManual ? map.rwy : map.amos);
    const alertsByRunway = view.alerts.reduce((acc, alert) => ({ ...acc, [alert.runway]: alert }), {});
    const layers = [];

    const color = { WSA: DISP_SET.wsaBackColor, MBA: DISP_SET.mbaBackColor }
    const blinkSec = DISP_SET.blnkgTm / 1000;
    const blinkIntervalSec = DISP_SET.blnkgCyc / 1000;

    rws.forEach((rw, i) => {
        const alert = alertsByRunway[rw];

        if (!alert) {
            return;
        }

        if (alert.type === "WSA" || alert.type === "MBA") {
            const fields = alert.faa.split(" ");
            const coords = fields[3] === "RWY" ? f_getRwyCoords(rw) : f_getArenaCoords(rw + "_" + fields[3]);
            const polygon = L.polygon(coords,
                {
                    weight: 5, color: color[alert.type], orgColor: color[alert.type], isArena: true,
                    fillOpacity: 0, text: fields[3] === "RWY" ? "" : fields[2], className: "map_arena_alert"
                });
            layers.push(polygon);

            if (fields[3] !== "RWY") {
                const marker = L.marker(polygon.getBounds().getCenter(), {
                    icon: L.divIcon({
                        className: `alert-arena-label alert-arena-label-${alert.type}`, html: fields[2], orgColor: color[alert.type]
                    })
                });
                layers.push(marker);
            }
        }
    });
    if (layers.length == 0) {
        return;
    }
    L.layerGroup(layers, { id: KEY_ARENA_ALERT }).addTo(MAP);
    const blinkObj = setInterval(() => {
        layers.filter(l => l.options.isArena).forEach(layer => {
            layer.setStyle({ "color": layer.options.color === layer.options.orgColor ? "#000" : layer.options.orgColor });
        });
        layers.filter(l => !l.options.isArena).forEach(layer => {

        });
    }, blinkIntervalSec * 1000);
    setTimeout(() => clearInterval(blinkObj), blinkSec * 1000);
    f_adjustAlertArenaFont();
}

function f_getArenaCoords(arenaName) {
    let coords = null;
    MAP.eachLayer(layer => {
        if (layer.options.id === KEY_ARENA &&
            (layer.options.arenaNames[0] === arenaName || layer.options.arenaNames[1] === arenaName)) {
            coords = layer.getLatLngs();
        }
    });
    return coords;
}

function f_getRwyCoords(runwayCode) {
    const rwNo = runwayCode.substring(0, 2);
    let coords = null;
    MAP.eachLayer(layer => {
        if (layer.options.id === KEY_RUNWAY &&
            (layer.options.rwys[0] === rwNo || layer.options.rwys[1] === rwNo)) {
            coords = layer.getLatLngs();
        }
    });
    return coords;
}

function f_onBtnViewClick2() {
    const beforeVal = $("#sProduct").val();
    const $sProduct = $("#sProduct");
    const btnVal = $(this).val();
    $sProduct.empty().append("<option value=''>Product</option>");
    if (btnVal === "combined" || btnVal === "tdwr") {
        //$sProduct.append(`<option value="tdwr1">TDWR:반사도</option>`);
        //$sProduct.append(`<option value="tdwr2">TDWR:시선속도</option>`);
        //$sProduct.append(`<option value="tdwr3">TDWR:수상체</option>`);
    }
    if (btnVal === "combined" || btnVal === "tldr1") {
        $sProduct.append(`<option value="tldr11">TLDR1:SNR</option>`);
        $sProduct.append(`<option value="tldr12">TLDR1:시선속도</option>`);
    }
    if (btnVal === "combined" || btnVal === "tldr2") {
        $sProduct.append(`<option value="tldr21">TLDR2:SNR</option>`);
        $sProduct.append(`<option value="tldr22">TLDR2:시선속도</option>`);
    }
    if ($sProduct.find(`option[value='${beforeVal}']`).length > 0) {
        $sProduct.val(beforeVal).trigger("change");
    } else {
        $sProduct.val("").trigger("change");
    }
}

function f_adjustAlertArenaFont() {
    fi_adjustFontColor();
    fi_adjustSize();

    function fi_adjustFontColor() {
        const strokeSizes = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0.1, 0.3, 0.5, 1, 2, 4, 5];
        const zoom = MAP.getZoom();
        $("div.alert-arena-label-WSA").css({
            "color": DISP_SET.wsaFontColor,
            "-webkit-text-stroke": `${strokeSizes[zoom - 1]}px ${DISP_SET.wsaBackColor}`
        });
        $("div.alert-arena-label-MBA").css({
            "color": DISP_SET.mbaFontColor,
            "-webkit-text-stroke": `${strokeSizes[zoom - 1]}px ${DISP_SET.mbaBackColor}`
        });
    }

    function fi_adjustSize() {
        const fontSizes = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 24, 44, 86, 180, 360];
        const mLefts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -10, -24, -44, -86, -180, -360];
        const mTops = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -7, -17, -28, -58, -120, -240];
        const zoom = MAP.getZoom();
        const css = {
            "font-size": fontSizes[zoom - 1], "margin-left": mLefts[zoom - 1], "margin-top": mTops[zoom - 1],
            "display": zoom < 11 ? "none" : "block",
        };

        $("div.alert-arena-label").css(css);
    }
}