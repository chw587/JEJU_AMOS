let wdStreamLayer;
let ANI_WIND;
let windDt;
let windBarbCurData;
let aniWindDtType;
const OUTLIER_VAL = -9999;
const WIND_BARB_WIDTH = 30; //px
const KEY_WIND_BARBS = "_wind_barbs_";
const ZOOM_WINDBARB_SIZE = {6: 128, 7: 64, 8: 32, 9: 16, 10: 8, 11: 4, 12: 2, 13: 1, 14: 1, 15: 1, 16: 1,}

$(f_windInit);

function f_windInit() {
    $("#tWp07").click(f_windDispWpPrevHour);
    $("#tWp25").click(f_windDispWpPrevHour);
    $("#dWpPopupClose").click(()=>  { 
        $("#dWpPopup").hide();
        $("div.wpp_graph svg").remove();
    });
    setTimeout(()=>{
        MAP.on("zoomend", () => f_windBarbDisplay() );
    }, 1000);
}

function f_windUpdateDisplay(map) {
    const ft = $("#sWind").val();
    if (!ft) {
        return;
    }
    if ( map.hwind && map.hwind[ft] && map.hwind[ft].substring(0,14)!==windDt ) {
        f_windDisplay();
    }
}

function f_windDisplay() {
    
    windBarbCurData = null;
    if ( f_aniIsPlaying() ) {
        f_windLoad1hrWindData();
        return;
    }
    const ft = $("#sWind").val();
    const type = $("#sWind").find("option:selected").attr("type");

    wdStreamLayer.setData(null);
    fn_remove_map_layer(KEY_WIND_BARBS);
    windDispData = null;

    if ( !ft ) {
        windDt = null;
        return;
    }

    $.ajax({
        url: "/wind/windexp.a",
        data: {height: ft},
        method: "post",
        success: (d) => {
            windDt = d.datetime;
            const limitDt = moment(lastAlnMap.dt).add(-9, "h").add($("#iHwindDelayAllowMin").val()*-1, "m");
            if ( moment(d.datetime, "YYYYMMDDHHmmss").isBefore(limitDt) ) {
                windDt = null;
                return;
            }
            if ( type==="stream" ) {
                f_windStreamDisplay(d);
            } else {
                f_windBarbDisplay(d);
            }
        }
    });
}

function f_windStreamDisplay(data) {
    if ( !data || !data.mapValue ) {
        return;
    }

    const uvGrid = fi_buildData(data);
    wdStreamLayer.setData(uvGrid);

    function fi_buildData(data) {
        const wdGridSize = parseInt($("#iHwindNx").val());
        const u = {"data":[], header: {
            "parameterUnit": "m.s-1",
            "parameterCategory": 2,
            "parameterNumber": 2,
            "parameterNumberName": "eastward_wind",
            "dx": parseFloat($("#iHwindDxdyDegree").val()),
            "dy": parseFloat($("#iHwindDxdyDegree").val()),
            "la1": data.mapValue.rightTopLat,
            "la2": data.mapValue.leftBottomLat,
            "lo1": data.mapValue.leftBottomLon,
            "lo2": data.mapValue.rightTopLon,
            "nx": $("#iHwindNx").val(),
            "ny": $("#iHwindNy").val(),
            "refTime": moment(data.datetime, "YYYYMMDDHHmmss").format("YYYY-MM-DD HH:mm:ss")}};

        const v = {"data":[], header: {...u.header} };
        v.header.parameterNumberName = "northward_wind";
        v.header.parameterNumber = 3;

        // Data reverse order
        for ( let i = wdGridSize-1; i >= 0; i-- ) {
            u.data.push( ...data.grid.u_component[i] );
            v.data.push( ...data.grid.v_component[i] );
        }
        u.data = u.data.map(value => (value === OUTLIER_VAL ? null : value));
        v.data = v.data.map(value => (value === OUTLIER_VAL ? null : value));

        return [u, v];
    }

}

function f_windBarbDisplay(data) {
    
    if ( !data && !windBarbCurData ) {
        return;
    }
    if ( data ) {
        windBarbCurData = data;
    }
    fn_remove_map_layer(KEY_WIND_BARBS);
    
    const grid = fi_gridToSpeedDegGrid(windBarbCurData.grid);
    const windBarbs = [];
    const skipSize = ZOOM_WINDBARB_SIZE[MAP.getZoom()];
    
    grid.forEach( (row, ri)=>{
        if ( ri%skipSize !== 0 ) {
            return;
        }
        row.forEach( (col, ci) => {
            if ( ci%skipSize !== 0 ) {
                return;
            }
                const lat = windBarbCurData.mapValue.leftBottomLat + ri * windBarbCurData.mapValue.deltaDegree;
            const lon = windBarbCurData.mapValue.leftBottomLon + ci * windBarbCurData.mapValue.deltaDegree;

            const svgIcon = L.divIcon({
                className: 'wind-barb-icon',
                html: f_getWindBarbSvg(col.ws, {color: "#7A297B", width: 24, drawSlowWind: true}),
                iconSize: [24, 24],
                iconAnchor: [12, 12], // 중심점 설정
            });
            windBarbs.push(L.marker([lat, lon], { 
                icon: svgIcon, rotationAngle: col.wd, id: KEY_WIND_BARBS, pane: "overlayPane", ri: ri, ci: ci,
            }));
        });
    });

    L.layerGroup(windBarbs, {id: KEY_WIND_BARBS}).addTo(MAP);
    $("div.wind-barb-icon").css("z-index", "20");

    function fi_gridToSpeedDegGrid(grid) {
        const res = [];
        grid.u_component.forEach((row, ri)=>{
            res[ri] = [];
            row.forEach( (col, ci) => {
                const vVal = grid.v_component[ri][ci]
                if ( col === OUTLIER_VAL || vVal === OUTLIER_VAL ) {
                    res[ri][ci] = {ws: null, wd: null};
                    return;
                }
                res[ri][ci] = fi_uvToWdWs(col, vVal);
            });
        });
        return res;
    }

    function fi_uvToWdWs(u, v) {
        const speedInKnots = Math.sqrt(u ** 2 + v ** 2) * 1.94384;
        let degree = Math.atan2(-u, -v) * (180 / Math.PI);
        if (degree < 0) {
            degree += 360;
        }
    
        return { ws: speedInKnots, wd: degree };
    }

}


function f_windInitStreamLayer() {
    wdStreamLayer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          // label prefix
          velocityType: "",
      
          // leaflet control position
          position: "bottomleft",
      
          // no data at cursor
          emptyString: " ",
      
          // see explanation below
          angleConvention: "bearingCW",
      
          // display cardinal direction alongside degrees
          showCardinal: false,
      
          // one of: ['ms', 'k/h', 'mph', 'kt']
          speedUnit: "kt",
      
          // direction label prefix
          directionString: "풍향",
      
          // speed label prefix
          speedString: "풍속",
        },
//        data: [], // see demo/*.json, or wind-js-server for example data service
      
        // OPTIONAL
        minVelocity: 0, // used to align color scale
        maxVelocity: 20, // used to align color scale
        lineWidth: 3,
        particleMultiplier: 1/700,
        velocityScale: 0.0075, // 바람 스트림 길이 조정 modifier for particle animations, arbitrarily defaults to 0.005
        colorScale: ["rgb(255,255,255", "rgb(255,255,255"], // define your own array of hex/rgb colors
        opacity: 0.97, // layer opacity, default 0.97
        className: "map_wind",
      });    
    
    MAP.addLayer(wdStreamLayer);
}

async function f_windLoad1hrWindData() {
    if ( !$("#sWind").val() ) {
        ANI_WIND = null;
        f_windRemoveDisplay();
        return;
    }

    toastr.info("재생에 필요한 바람 데이터를 조회하고 있습니다. 잠시만 기다려주세요.");
    await $.ajax({
        url: "/wind/load1hrPrevWind.a",
        method: "post",
        data: {height: $("#sWind").val(), ymdhm: moment(ANI_DATA.at(-1).dt).format("YYYYMMDDHHmm"), },
        success: (d) => {
            ANI_WIND = d.map( windStr => JSON.parse(windStr) );
            f_windAniDisplay( parseInt($("#rAni").val()) );
        },
    });
}

function f_windAniDisplay(aniFrameNo) {
    const ft = $("#sWind").val();
    const type = $("#sWind").find("option:selected").attr("type");
    if (!ft) {
        f_windRemoveDisplay();
        return;
    }

    const windData = ANI_WIND[aniFrameNo];

    if ( !windData ) {
        f_windRemoveDisplay();
        return;
    }
    if ( (windData.datetime+type) ===aniWindDtType ) {
        return;
    }
    wdStreamLayer.setData(null);
    fn_remove_map_layer(KEY_WIND_BARBS);
    aniWindDtType = windData.datetime+type;

    if ( type==="stream" ) {
        f_windStreamDisplay(windData);
    } else {
        f_windBarbDisplay(windData);
    }
}

function f_windRemoveDisplay() {
    wdStreamLayer.setData(null);
    fn_remove_map_layer(KEY_WIND_BARBS);
    aniWindDtType = null;
}

function f_windDispWpPrevHour() {
    $.ajax({
        url: "/graph/loadPrevWps.a",
        success: (d) => f_windShowWpPrevHour(d, $(this).attr("id")==="tWp07"),
    });
}

function f_windShowWpPrevHour(wps, is07) {
    $("#dWpPopup").show();
    $("#dWpPopup > div.wpp_title > span").text(`${is07 ? "07" : "25"}WPR / ${moment(wps.at(-1).dt).format("YYYY-MM-DD HH:mm")}`);
    const canvas = $("#dWpPopup > div.wpp_graph > canvas")[0];
    $(canvas).prop("width", $(canvas).parent().width()).prop("height", $(canvas).parent().height());

    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Graph boundaries
    const margin = 50; // Margin around the graph
    const legendWidth = 100; // Space for the legend
    const graphWidth = width - margin * 2 - legendWidth;
    const graphHeight = height - margin * 2;

    const xDivisions = 24; // X-axis divisions
    const yMax = 15000; // Y-axis maximum (feet)
    const yStep = 1000; // Y-axis step (1000 feet)
    const yDivisions = yMax / yStep; // Calculate the number of divisions

    // Draw background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.strokeRect(margin, margin, graphWidth, graphHeight);

    // Draw x-axis divisions
    let lastDay;
    for (let i = 0; i <= xDivisions; i++) {
        const x = margin + (i * graphWidth) / xDivisions;
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + graphHeight);
        ctx.stroke();

        // X-axis labels
        if ( i % 6===0 && i < xDivisions) {
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = '12px Arial';
            const label = moment(wps[xDivisions-i-1].dt).format("HH:mm");
            ctx.fillText(label, x+17, margin + graphHeight + 5);
            if ( lastDay!= moment(wps[xDivisions-i-1].dt).format("YYYYMMDD") ) {
                ctx.fillText(moment(wps[xDivisions-i-1].dt).format("YYYY-MM-DD"), x+30, margin + graphHeight + 20);
                lastDay = moment(wps[xDivisions-i-1].dt).format("YYYYMMDD");
            }
        }
    }

    // Draw y-axis divisions
    for (let i = 0; i <= yDivisions; i++) {
        if ( i == yDivisions) {
            continue;
        }
        const y = margin + (i * graphHeight) / yDivisions;
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + graphWidth, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#000';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.font = '12px Arial';
        const label = (yMax - i * yStep).toLocaleString() + ' ft';
        ctx.fillText(label, margin - 5, y);
    }

    // Draw legend (on the right)
    const legendX = width - margin - legendWidth / 2;
    const legendYStart = margin;
    const legendHeight = graphHeight;
    const legendSteps = 18; // Number of color steps
    const legendColors = [
        '#EEEEEE', '#000390', '#1F219D', '#4C4EB1', '#8081C7', 
        '#CCAA00', '#E0B900', '#F9CD00', '#FFDC1F', '#008000',
        '#00A400', '#00D500', '#1EF31E', '#BF0000', '#D50000', 
        '#EE0B0B', '#F63E3E', '#333333', 
    ].reverse(); // Example gradient
    const legendValues = [
        9999, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 
        30, 25, 20, 15, 10, 5, 0]; // Corresponding legend values

    for (let i = 0; i < legendSteps; i++) {
        const colorY = legendYStart + (i * legendHeight) / legendSteps;
        const colorHeight = legendHeight / legendSteps;

        // Draw the color block
        ctx.fillStyle = legendColors[i];
        ctx.fillRect(legendX - 10, colorY, 20, colorHeight);

        if ( i == 0 ) {
            continue;
        }

        // Draw the legend value at the top of each color block
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '12px Arial';

        const labelY = colorY; // Align label at the top of the color block
        ctx.fillText(`${legendValues[i]} ${i>1?"":"[kt]"}`, legendX + 15, labelY);
    }

    wps.reverse().forEach( (wp,x)=>{
        const tWp = is07?wp.r07Winds:wp.r25Winds;
        if ( !tWp ) {
            return;
        }
        const height = 830, width = 780;
        tWp.filter( wind=>!wind.height.match(/.*50$/) ).forEach( (wind,y)=>{
            const svgString = f_getWindBarbSvg( wind.ws, {
                color: fi_getWBColor(wind.ws), width: 14, drawSlowWind: true, rotate: wind.wd,
            } );

            const $svg = $(svgString).addClass("wpp_graph_windbarb").css({
                "top": (91+height - height/15000*wind.height.substring(1)*3.28084)+"px", "left": (70 + x*width/24)+"px", 
            });

            //console.log( wind.height, height/15000*wind.height.substring(1)*3.28084 );

            $("div.wpp_graph").append($svg);
        });
    });

    function fi_getWBColor( speed ) {
        for ( let i = 0 ; i < legendValues.length; i++ ) {
            if ( i==(legendValues.length-1) || speed > legendValues[i] ) {
                return legendColors[i];
            }
        }
    }
}

function f_windOnAniFinish() {
    windDt = null;
}
