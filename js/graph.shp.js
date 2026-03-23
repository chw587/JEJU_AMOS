const KEY_RUNWAY = "_runway_";
const KEY_ARENA = "_arena_";
const KEY_AIRPATH = "_airpath_";

function f_initShapes() {
    f_drawAirPath();
    f_drawRunways();
    f_drawArenas();
}

function f_drawAirPath() {
    fn_remove_map_layer(KEY_AIRPATH);
    if ( !$("#cFlyRoute").prop("checked") ) {
        return;
    }
	$.ajax({
		url: "/shapes/AISPATH.json",
		success: (d) => {
			$.each(d.features, (i, rec) => {
				const polyline = L.polyline(
					f_getSwitchedLatLngCoords(rec.geometry.coordinates[0]), {color: "#999", fillOpacity: 0.1, id: KEY_AIRPATH}).addTo(MAP);
				polyline.bindTooltip(rec.properties.ident_txt, {permanent: true, direction:"center", className: "map_label_textonly"} );
			});			
		}
	});    
}

function f_getSwitchedLatLngCoords(orgArr) {
	const arr = [];
	$.each(orgArr, (i, coor)=> {
		arr.push([ coor[1], coor[0]] );
	});
	
	return arr;
}
    

function f_drawRunways() {
    ["/shapes/RWY-1.kml", "/shapes/RWY-2.kml"].forEach( kmlUrl => {
        $.ajax({
            url: kmlUrl, 
            dataType: 'xml',
            success: function (data) {
                const coorStr = 
                    $(data).find('Placemark Polygon outerBoundaryIs LinearRing coordinates').text().trim();
      
                const coordinates = coorStr.split(' ')
                    .map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return [lat, lng]; 
                    });
                const rwyNumbers = kmlUrl.endsWith("1.kml")?["07","25"]:["13","31"];

                L.polygon(coordinates, {
                    weight: 2, color: "#444", fillOpacity:0, id: KEY_RUNWAY, rwys: rwyNumbers, className: "map_rwy_arena"
                }).addTo(MAP);
            },
            error: function (xhr, status, error) {
                toastr["error"](`활주로를 그리는데 실패했습니다. (${kmlUrl})`);
            },
        });    
    });
}

function f_drawArenas() {
    fn_remove_map_layer(KEY_ARENA);
    if ( !$("#cArena").prop("checked") ) {
        return;
    }    
    
    ["/shapes/arena_07A_25D.kml", "/shapes/arena_13A_31D.kml",
        "/shapes/arena_25A_07D.kml", "/shapes/arena_31A_13D.kml"].forEach(kmlUrl => {
        
        $.ajax({
            url: kmlUrl,
            dataType: 'xml',
            success: function (data) {
                const points = [];
                const rwyNoList = kmlUrl.replace(/^.*\/arena_/, "").replace(/\.kml$/, "").split("_");
                $(data).find('Placemark Point coordinates').each(function () {
                    const coordText = $(this).text().trim();
                    const [lng, lat] = coordText.split(',').map(Number); // 경도, 위도 추출
                    points.push([lat, lng]); // Leaflet 좌표 형식 [위도, 경도]
                });
        
                const groups = [
                    points.slice(0, 4), // Point 1~4
                    points.slice(4, 8), // Point 5~8
                    points.slice(8, 12), // Point 9~12
                ];
        
                // 각 ARENA에는 Alert 발생 시 강조할 수 있도록
                // 07A_1MF 25D_2MD 를 arenaNames에 배열로 달아 놓음
                groups.forEach((group, index) => {
                    const arenaName1 = rwyNoList[0]+"_"+(index+1)+"M"+(rwyNoList[0].endsWith("A")?"F":"D");
                    const arenaName2 = rwyNoList[1]+"_"+(index+1)+"M"+(rwyNoList[1].endsWith("A")?"F":"D");
                    L.polygon(group, 
                        {
                            weight: 2, color: "#444", fillOpacity:0, id: KEY_ARENA, arenaNames: [arenaName1, arenaName2], 
                            className: "map_rwy_arena" 
                        })
                        .addTo(MAP);
                });

//                 MAP.eachLayer(l=>{
//                     if ( l.options.id===KEY_ARENA ) {
//                         if (  l.options.arenaNames[0]==="13D_1MD" || l.options.arenaNames[1]==="13D_1MD" ) {
//                             l.setStyle({weight:5, color: "#f00"});
// //                            l.redraw();
//                         }
//                     }
//                 })
            },
            error: function (xhr, status, error) {
                toastr["error"](`Arena를 그리는데 실패했습니다. (${kmlUrl})`);
            },
        });
  
    });
}

