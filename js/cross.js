$(f_init);
/*
let wd = 0; // 초기 각도
const step = 5; // 각도 증가량
let intervalId = null; // setInterval ID 저장
let isActive = false; // 테스트 기능 활성화 여부


$(document).on("keydown", function(e) {
	// Ctrl + 1 키 조합 감지
	if (e.ctrlKey && e.key === "1") {
		e.preventDefault(); // 기본 동작 방지

		// 테스트 기능 활성화/비활성화 토글
		isActive = !isActive;
		$("#test").toggle(isActive);

		if (isActive) {
			// 활성화 상태일 때 setInterval 시작
			intervalId = setInterval(() => {
				wd = (wd + step) % 360; // 각도 업데이트
				let radians = wd * (Math.PI / 180);
				let uValue = Math.cos(radians);
				let vValue = Math.sin(radians);
				let tmpWd = Math.atan2(-uValue, -vValue) * (180 / Math.PI);

				if (tmpWd < 0) {
					tmpWd += 360;
				}

				let li = `<div class="wind"><span>
							 <img src="../images/ico_black_0.png" alt="">
							 <img src="../images/ico_black_0.png" alt="">
						  </span>
						  <strong>${tmpWd.toFixed(2)}° / ${wd}°</strong></div>`;
			    
				$("#test").html(li);
				$("#test").find("span img").eq(0).css("transform", `rotate(${tmpWd}deg)`);
				$("#test").find("span img").eq(1).css("transform", `rotate(${wd}deg)`);
			}, 1000);
		} else {
			// 비활성화 상태일 때 setInterval 중지
			clearInterval(intervalId);
			intervalId = null;
		}
	}
});

*/
let ALNMAP = {};
let sysSetting = {};
let dispRwy = {};

//let rwyType = "R1";
let dataType = "WIND";

let prevAlerts = { "A": null, "D": null }; // 각 "prevAlert"를 독립적으로 유지하는 변수
let prevLlwasAlerts = { "A": null, "D": null };
let prevAlertsArena = new Array();

let LgnColors = {};
let crossColors = [];

function f_init() {
	//f_loadLgndColor(); //풍속 범례 대신 attn, warn, dgr 만 판단으로 변경
	f_initUI();
	f_initBtns();
	f_getSysSetting();
	$("#btnInfoOpenClose").trigger('click');

	if (f_alnComGetScrType().ishist) {
		return;
	} else {
		f_loadFirst();
		fn_wsConnect(f_display);
	}




}

function f_initUI() {

	$("#radioEdr").hide();

}

function f_initBtns() {

	// $("#btnAln").click(()=>document.location='/aln');
	// $("#btnGraph").click(()=>document.location='/graph');

	$("#btnRightHide").click(() => {
		$("#aLeft").css("display", "flex");
		$("#aRight").hide(0, () => {
			// aRight 사라진 후 실행
			$(".info_area").css("border-radius", "15px");
			$(".wpr_area").css("display", "flex");
			$(".wpr_erd .edr_list").css("position", "static");
			// 250818 
			$(".height_area").css("display", "none");

		});
	});

	$("#btnRightShow").click(() => {
		console.log("btnRightShow clicked"); // 디버깅 로그

		$("#aRight").css("display", "flex");

		$("#aLeft").show(0, () => {
			$(".info_area").css("border-radius", '0 15px 15px 0', 'important');
			$(".wpr_area").css("display", "none");
			$(".wpr_erd .edr_list").css("position", "absolute");
			// 250818 
			$(".height_area").css("display", "flex");

		});

	});





	$("#btnToggleWp").click(f_toggleWindProfiler);

	$("#windType").click((e) => {
		$("#windType").removeClass("line_type");
		$("#edrType").addClass("line_type");
		$("#radioEdr").hide();
		dataType = "WIND";
		f_drawLgnd(dataType);
	});

	$("#edrType").click((e) => {
		$("#edrType").removeClass("line_type");
		$("#windType").addClass("line_type");
		$("#radioEdr").show();
		dataType = "EDR";
		f_drawLgnd(dataType);
	});

	// 250903 수정
	$("#btnRwy2").change((e) => {
		let isChecked = $(e.currentTarget).is(":checked");  // 체크 여부 확인
		let statusText = isChecked ? "R2" : "R1";          // 체크되면 R2, 아니면 R1

		// 상태 변경 함수 호출
		f_chgRwy(statusText);

		// p 태그 텍스트 갱신
		$("#status").text("현재 상태: " + statusText);

		// 화면 모드에 맞게 출력
		if (f_alnComGetScrType().ishist) {
			f_histDisplay();
		} else {
			f_display();
		}
	});

	$("#btnHist").click(() => document.location = 'cross/hist.html');
}

function f_chgRwy(type) {

	rwyType = type;

	let rwy1 = "07";
	let rwy2 = "25";

	if (type === "R2") {
		rwy1 = "13";
		rwy2 = "31";
		$("#liWpr07").hide();
		$("#liWpr25").hide();
		$('#rAreaTit1').css("visibility", "hidden");
		$('#rAreaTit2').css("visibility", "visible");
	} else {
		$("#liWpr07").show();
		$("#liWpr25").show();
		$('#rAreaTit1').css("visibility", "visible");
		$('#rAreaTit2').css("visibility", "hidden");
	}

	$(".rwy_list .tit span").eq(0).html(rwy1);
	$(".rwy_list .tit span").eq(2).html(rwy2);

	$("#rAreaTit1").html("R" + rwy1);
	$("#rAreaTit2").html("R" + rwy2);

}

function f_getSysSetting() {
	sysSetting = fn_getJsonCookie("sysSetting");
	dispRwy = fn_getJsonCookie("dispRwy");
	//	console.log(sysSetting);	
}

function f_loadFirst() {
	$.ajax({
		url: "/aln/alndata.a",
		success: (map) => {
			if (rwyType == "R2") {
				ALNMAP = map;
				$("#btnRwy").trigger('click');

			} else {
				f_display(map);
			}



		},
		error: () => {
			f_displayError("데이터를 불러오는 중 문제가 발생했습니다.");
		}
	});
}

function f_display(map) {
	if (map) {
		//        console.log(map);
	}
	if (!map) {
		map = ALNMAP;
	}
	ALNMAP = map;
	f_getSysSetting();
	f_dispLgndColor();
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



}

function f_loadLgndColor() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: "/cross/crossColorWs.a",
			type: "post",
			data: {},
			success: (data) => {
				console.log("AJAX 요청 성공:", data); // 데이터 확인
				crossColors = data;
				resolve(true);
			},
			error: () => {
				reject(new Error("연직 색상 불러오기 실퍠!"));
			}
		});
	});
}

function f_dispLgndColor() {

	$("#mbaColor").css("background-color", sysSetting.mbaBackColor);
	$("#mbaColor").css("color", sysSetting.mbaFontColor);

	$("#wsaColor").css("background-color", sysSetting.wsaBackColor);
	$("#wsaColor").css("color", sysSetting.wsaFontColor);


	LgnColors = {
		MBA: {
			backColor: sysSetting.mbaBackColor,
			fontColor: sysSetting.mbaFontColor
		},
		WSA: {
			backColor: sysSetting.wsaBackColor,
			fontColor: sysSetting.wsaFontColor
		},
		WIND: [
			{ "color": { "R": 230, "G": 230, "B": 157 }, "level": { "m/s": 0.1, "kn": 0.194384 } },
			{ "color": { "R": 221, "G": 219, "B": 106 }, "level": { "m/s": 0.2, "kn": 0.388768 } },
			{ "color": { "R": 211, "G": 210, "B": 58 }, "level": { "m/s": 0.4, "kn": 0.777536 } },
			{ "color": { "R": 170, "G": 166, "B": 33 }, "level": { "m/s": 0.6, "kn": 1.166304 } },
			{ "color": { "R": 116, "G": 122, "B": 24 }, "level": { "m/s": 0.8, "kn": 1.555072 } },
			{ "color": { "R": 154, "G": 227, "B": 154 }, "level": { "m/s": 1, "kn": 1.943840 } },
			{ "color": { "R": 113, "G": 228, "B": 111 }, "level": { "m/s": 1.5, "kn": 2.915760 } },
			{ "color": { "R": 53, "G": 211, "B": 54 }, "level": { "m/s": 2, "kn": 3.887680 } },
			{ "color": { "R": 38, "G": 169, "B": 41 }, "level": { "m/s": 2.5, "kn": 4.859600 } },
			{ "color": { "R": 30, "G": 121, "B": 28 }, "level": { "m/s": 3, "kn": 5.831520 } },
			{ "color": { "R": 154, "G": 232, "B": 234 }, "level": { "m/s": 3.5, "kn": 6.803440 } },
			{ "color": { "R": 106, "G": 221, "B": 214 }, "level": { "m/s": 4, "kn": 7.775360 } },
			{ "color": { "R": 54, "G": 210, "B": 207 }, "level": { "m/s": 4.5, "kn": 8.747280 } },
			{ "color": { "R": 38, "G": 169, "B": 163 }, "level": { "m/s": 5, "kn": 9.719200 } },
			{ "color": { "R": 29, "G": 119, "B": 120 }, "level": { "m/s": 5.5, "kn": 10.691120 } },
			{ "color": { "R": 157, "G": 154, "B": 235 }, "level": { "m/s": 6, "kn": 11.663040 } },
			{ "color": { "R": 106, "G": 105, "B": 222 }, "level": { "m/s": 6.5, "kn": 12.634960 } },
			{ "color": { "R": 56, "G": 56, "B": 212 }, "level": { "m/s": 7, "kn": 13.606880 } },
			{ "color": { "R": 36, "G": 39, "B": 172 }, "level": { "m/s": 8, "kn": 15.550720 } },
			{ "color": { "R": 25, "G": 29, "B": 118 }, "level": { "m/s": 9, "kn": 17.494560 } },
			{ "color": { "R": 232, "G": 153, "B": 232 }, "level": { "m/s": 10, "kn": 19.438400 } },
			{ "color": { "R": 219, "G": 105, "B": 218 }, "level": { "m/s": 15, "kn": 29.157600 } },
			{ "color": { "R": 213, "G": 56, "B": 209 }, "level": { "m/s": 20, "kn": 38.876800 } },
			{ "color": { "R": 169, "G": 38, "B": 170 }, "level": { "m/s": 25, "kn": 48.596000 } },
			{ "color": { "R": 121, "G": 26, "B": 116 }, "level": { "m/s": 30, "kn": 58.315200 } },
			{ "color": { "R": 227, "G": 153, "B": 154 }, "level": { "m/s": 35, "kn": 68.034400 } },
			{ "color": { "R": 221, "G": 105, "B": 108 }, "level": { "m/s": 40, "kn": 77.753600 } },
			{ "color": { "R": 209, "G": 57, "B": 54 }, "level": { "m/s": 45, "kn": 87.472800 } },
			{ "color": { "R": 172, "G": 36, "B": 36 }, "level": { "m/s": 50, "kn": 97.192000 } },
			{ "color": { "R": 118, "G": 28, "B": 30 }, "level": { "m/s": 55, "kn": 106.911200 } },
			{ "color": { "R": 40, "G": 40, "B": 40 }, "level": { "m/s": 60, "kn": 116.630400 } }

		]

	};

	//범례 판단 변경으로 색상 표출 X
	//console.log("crossColors:", crossColors); // 데이터 확인
	//if (crossColors.length > 0) {
	//    LgnColors.WIND = crossColors;
	//    console.log("LgnColors.WIND 업데이트됨:", LgnColors.WIND); // 업데이트 확인
	//}

	f_drawLgnd(dataType);
}

function f_displayDate(map) {
	if (map.atcpd === null || map.atcpd === undefined) return;
	const fileDt = map.atcpd.fileDt;
	let fileDate = moment(fileDt, "YYYYMMDDHHmmss");
	const sKstDt = fileDate.format("YYYY-MM-DD HH:mm:ss");
	const sUtcDt = fileDate.add(-9, "hours").format("YYYY-MM-DD HH:mm:ss");


	$("#sUtc").html(`(UTC) ${sUtcDt}`);
	$("#sKst").html(`(KST) ${sKstDt}`);

}

function f_displayAirDir(map) {
	const rwyUse = map.rwy;

	if (rwyType === "R1") {
		$("#rAreaTit1").html(`<img src="./images/icon/icon_airplane.png" alt="right_airplane">R07`);
		$("#rAreaTit2").html(`<img src="./images/icon/icon_left_airplane.png" alt="right_airplane">R25`);
		// if (rwyUse.mainRunway === "07") {
		// 	$("#rAreaTit1").css("visibility", "visible");
		// 	$("#rAreaTit2").css("visibility", "hidden");
		// } else {
		// 	$("#rAreaTit1").css("visibility", "hidden");
		// 	$("#rAreaTit2").css("visibility", "visible");
		// }
	} else {
		$("#rAreaTit1").html(`<img src="./images/icon/icon_airplane.png" alt="right_airplane">R13`);
		$("#rAreaTit2").html(`<img src="./images/icon/icon_left_airplane.png" alt="right_airplane">R31`);

		// if (rwyUse.subRunway === "13") {
		// 	$("#rAreaTit1").css("visibility", "hidden");
		// 	$("#rAreaTit2").css("visibility", "visible");
		// } else {
		// 	$("#rAreaTit1").css("visibility", "visible");
		// 	$("#rAreaTit2").css("visibility", "hidden");
		// }
	}
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

/**
 * 윈드프로파일러는 07, 25로 고정
 */
function f_displayWindProfiler(map) {
	const $tbody = $("#tWp > tbody");

	if (map.wp === null || map.wp === undefined) {
		fi_emptyTbody();
		return;
	}

	const is07DtChk = f_getDtChk(map.atcpd.fileDt, moment(map.wp.r07FileDt).format("YYYYMMDDHHmm"), map.wp.delay, "UTC");
	const is25DtChk = f_getDtChk(map.atcpd.fileDt, moment(map.wp.r25FileDt).format("YYYYMMDDHHmm"), map.wp.delay, "UTC");

	fi_emptyTbody();
	if (!map.wp || !map.wp.r07FileDt) {
		return;
	}
	if (is07DtChk) {
		$tbody.attr("r07filedt", map.wp.r07FileDt);
		map.wp.r07Winds.forEach((wind) => {
			const tr = $tbody.find(`tr[ht=${wind.height.substring(1)}]`);
			const imgHtml = `<span class="arrow_"><img src="/images/ico_arrow_0.png" `
				+ `style="transform: rotate(${wind.wd}deg);"></span>`;
			tr.find("td:eq(1)").html(`${imgHtml}<span class="wd">${wind.wd == 0 ? 360 : wind.wd}</span> / <span class="ws">${wind.ws}</span>`);
		});
	}

	if (is25DtChk) {
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

function f_displayMainWindProfiler(map) {

	if (map.wp === null || map.wp === undefined) {
		// 기본값 설정
		$("#wpr1").empty().append(`
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
        `);
		$("#wpr2").empty().append(`
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
        `);
		return;

	}

	const is07DtChk = f_getDtChk(map.atcpd.fileDt, moment(map.wp.r07FileDt).format("YYYYMMDDHHmm"), map.wp.delay, "UTC");
	const is25DtChk = f_getDtChk(map.atcpd.fileDt, moment(map.wp.r07FileDt).format("YYYYMMDDHHmm"), map.wp.delay, "UTC");

	if (is07DtChk) {
		$("#wpr1").empty();

		const r1winds = map.wp.r07Winds.slice(0, -1).reverse();

		r1winds.forEach((wind, idx) => {
			const li = `<li>`
				+ `<span><img src="/images/ico_arrow_0.png"`
				+ `style="transform: rotate(${Math.round(wind.wd)}deg);"></span>`
				+ `${Math.round(wind.wd)}/${wind.ws}</li>`;
			$("#wpr1").append(li);
		});


	} else {
		// 기본값 설정
		$("#wpr1").empty().append(`
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
        `);

	}
	if (is25DtChk) {
		$("#wpr2").empty();

		const r2Winds = map.wp.r25Winds.slice(0, -1).reverse();

		r2Winds.forEach((wind, idx) => {
			const li = `<li>`
				+ `<span><img src="/images/ico_arrow_0.png"`
				+ `style="transform: rotate(${Math.round(wind.wd)}deg);"></span>`
				+ `${Math.round(wind.wd)}/${wind.ws}</li>`;
			$("#wpr2").append(li);
		});
	} else {
		$("#wpr2").empty().append(`
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
            <li><span> - </span></li>
        `);
	}
}

function f_displayLidar(map) {
	if (map.cross === null || map.cross === undefined) {
		f_chgWpf(map);
		return;
	}

	const rwy = rwyType === "R1" ? "main" : "sub";

	const uComp = map.cross[rwy].uComp;
	const vComp = map.cross[rwy].vComp;
	const rwy1 = $(".rwy_list .tit span").eq(0).text();
	const rwy2 = $(".rwy_list .tit span").eq(2).text();

	const isDtChk = f_getDtChk(map.atcpd.fileDt, map.cross.fileDt, map.cross.delay, "UTC");
	//const isDtChk = false; 

	$(".airstrip_list").each(function () {
		const degree = $(this).prev(".tit").text().trim();
		const id = $(this).attr("id");

		$(this).find("li").each(function () {
			const alt = $(this).data("alt"); // 각 li 요소의 data-alt 값을 가져옴

			if (alt === "wpr") return true;

			$(this).find("div.wind").remove();

			let pos = rwy1 + "-" + degree;
			if (id && id.startsWith("Mid")) {
				pos = id;
			} else {
				if (id && id.endsWith("nm2")) {
					pos = rwy2 + "-" + degree;
				}
			}


			//dataType에따른 조건 분기 해야될곳 
			if (dataType === "WIND" && isDtChk) {
				const uValue = uComp[alt] ? uComp[alt][pos] : -9999;
				const vValue = vComp[alt] ? vComp[alt][pos] : -9999;

				if (uValue !== -9999 && vValue !== -9999) {
					const ws = Math.round(Math.sqrt(Math.pow(uValue, 2) + Math.pow(vValue, 2)) * 1.94384);
					//let wd = Math.atan2(vValue, uValue) * (180 / Math.PI);
					let wd = Math.atan2(-uValue, -vValue) * (180 / Math.PI);

					wd = Math.round(wd / 10) * 10;
					// wd = Math.round(wd);
					if (wd <= 0) {
						wd += 360;
					}
					if (wd > 360) wd -= 360;
					const color = fi_getColor(ws, "kn");
					let bColor = fi_getComplementaryColor(color);
					if (ws >= 20 && ws < 30) bColor = "#ffffff";
					let li = `<div class="wind" style="color:${bColor}">
	            			  <span>
	            			  	<svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20">
	            			  		<path fill="${bColor}" d="M13.5,18V0h-3V18H5.921l5.083,5.555c.532,.593,1.461,.593,1.993,0l5.083-5.555h-4.579Z"/>
	            			  	</svg>
	            			  </span>`;
					li += `<strong>${wd}/${ws}</strong></div>`;
					$(this).append(li);

					$(this).find("span svg").css("transform", `rotate(${wd}deg)`);
					$(this).css("background-color", color);
				} else {
					let li = `<div class="wind"><strong> - </strong></div>`;
					$(this).append(li);
					$(this).css("background-color", '');
				}
			} else {
				let li = `<div class="wind"><strong> - </strong></div>`;
				$(this).append(li);
				$(this).css("background-color", '');
			}

		});

	});

	f_chgWpf(map);


	// 컬러 설정
	function fi_getColor(ws, type) {
		/* 범례 판단 변경으로 attn, warn, dgr 로 판단 
		const windLevels = LgnColors.WIND;
		for (let i = 0; i < windLevels.length - 1; i++) {
			if (ws >= windLevels[i].level[type] && ws < windLevels[i+1].level[type]) {
				return `rgb(${windLevels[i].color.R}, ${windLevels[i].color.G}, ${windLevels[i].color.B})`;
			}
		}
		*/
		if (ws >= sysSetting.crossWsDgr) {
			//return "red";
			return "#FF8181";
		} else if (ws >= sysSetting.crossWsWarn) {
			//return "orange";
			return "#FFBC4F";
		} else if (ws >= sysSetting.crossWsAttn) {
			//return "blue";
			return "#6969FF";
		}

		// 25-08-12 - 색상 없음
		if (ws === null || ws === '') {
			//return `rgb(217,217,217)`;
			return ``;
		}


		// 기본 색상 없음 (만약 조건에 맞는 색상이 없을 경우)
		return ``;
	}

	function fi_getComplementaryColor(color) {

		let r, g, b;

		if (color.startsWith("#")) {
			// HEX 색상
			({ r, g, b } = fi_hexToRgb(color));
		} else if (color.startsWith("rgb")) {
			// RGB 색상
			let rgb = color.match(/\d+/g);
			r = parseInt(rgb[0]);
			g = parseInt(rgb[1]);
			b = parseInt(rgb[2]);
		} else {
			// 색상 이름
			let tempDiv = document.createElement("div");
			tempDiv.style.color = color;
			document.body.appendChild(tempDiv);
			let computedColor = window.getComputedStyle(tempDiv).color;
			document.body.removeChild(tempDiv);
			let rgb = computedColor.match(/\d+/g);
			r = parseInt(rgb[0]);
			g = parseInt(rgb[1]);
			b = parseInt(rgb[2]);
		}

		// 보색 계산
		r = 255 - r;
		g = 255 - g;
		b = 255 - b;


		// 보색이 너무 눈에 띄는 경우 검정색 또는 흰색으로 변경
		if ((r + g + b) / 3 > 128) {
			return "#F0F0F0";  // 흰색
		} else {
			return "#000000";  // 검정색
		}


		return fi_rgbToHex(r, g, b);

	}


	function fi_hexToRgb(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);
		return { r, g, b };
	}

	function fi_rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
	}



}

function f_displayLidarAreaAln(map) {

	if (map.atcpd === null || map.atcpd === undefined) return;

	const rwy1 = $(".rwy_list .tit span").eq(0).text();
	const rwy2 = $(".rwy_list .tit span").eq(2).text();

	const gustFrontArea = map.atcpd.combined.gustFrontArea || [];
	const microburstArea = map.atcpd.combined.microburstArea || [];

	// 두 배열을 합칩니다.
	const combinedArea = [...gustFrontArea, ...microburstArea];
	//console.log(combinedArea);
	//if( !fi_arrayEquals(prevAlertsArena, combinedArea)){
	if (combinedArea.length > 0) {
		fi_applyAreaColor(combinedArea, rwy1, rwy2);
	} else {
		// 모든 li 요소 내부의 div를 초기화(제거)
		$(".airstrip_list li").find(".wind_point2").remove();

	}
	//}

	function fi_arrayEquals(arr1, arr2) {
		if (arr1.length !== arr2.length) return false;
		return arr1.every((value, index) => value === arr2[index]);
	}

	function fi_applyAreaColor(area, rwy1, rwy2) {
		// 모든 li 요소 내부의 div를 초기화(제거)
		$(".airstrip_list li").find(".wind_point2").remove();

		if (!area) return;

		area.forEach((item) => {
			const [type, rwy, degree, alt] = item.split('-');
			const numAlt = Number(alt);
			const color = LgnColors[(type === "GF" ? 'WSA' : "MBA")];
			let rwyD = "";
			if (rwy === rwy1) {
				rwyD = "1";
			} else if (rwy === rwy2) {
				rwyD = "2";
			}

			if (rwyD !== "") {
				$(".airstrip_list").each(function () {
					//0nm 대응 추가
					let degreeElem = $(this).prev(".tit").text().trim();
					const id = $(this).attr("id");
					let match = false;

					if (degree === "0NM" && id.startsWith("Mid")) {
						match = true;
					} else if (degree === degreeElem) {
						match = true;
					}

					if (id.endsWith(rwyD) && match) {

						$(this).find("li").each(function () {
							const liHtml = $(this).html();
							const altElem = $(this).data("alt");
							if (numAlt === altElem) {

								const div = $("<div>")
									.addClass("wind_point2 blinking")
									.css({
										"background-color": color.backColor,
										"color": color.fontColor,
										"--blink-duration": `${sysSetting.blnkgCyc / 1000}s`
									})
									.html(liHtml);

								//.wind 텍스트 색상을 변경
								div.find(".wind").css({ "color": `${color.fontColor}` });

								//SVG 아이콘 색상을 변경
								div.find("svg path").attr({ "fill": `${color.fontColor}` });

								$(this).append(div);



								//prevAlertsArena.push({rwy:rwy,dir:dirD, alt:numAlt, degree:degree});
								setTimeout(() => {
									div.removeClass("blinking");
								}, sysSetting.blnkgTm);
							}
						});


					}
				});
			}
		});
	}

}

function f_displayLidarAln(map) {
	if (map.atcpd === null || map.atcpd === undefined) return;
	if (map.atcpd["intermediatecomposite"] === null || map.atcpd["intermediatecomposite"] === undefined) return;

	const rwyDirA = ["07A", "13A", "25D", "31D"];
	const rwyDirD = ["07D", "13D", "25A", "31A"];

	const rwyUse = map.rwy;
	const view = map.atcpd["intermediatecomposite"];
	const isManual = map.rwy && map.rwy.type === "M";
	const rws = fn_getCustomActiveRunways(isManual ? map.rwy : map.amos);
	const alertsByRunway = {};

	if (view.alerts === null) return;

	view.alerts.forEach((alert) => {
		alertsByRunway[alert.runway] = alert;
	});
	//console.log(alertsByRunway);
	const rwyMappings = {
		"25": "07",
		"07": "25",
		"31": "13",
		"13": "31"
	};

	const getMappedRunway = (runway) => rwyMappings[runway] || runway;

	// 메인 활주로와 서브 활주로 설정
	const mainRunway = rwyType === "R1" ? rwyUse.mainRunway : rwyUse.subRunway;
	const subRunway = getMappedRunway(mainRunway);

	// 활주로 A, D 설정
	const rwyA = [`${mainRunway}A`, `${subRunway}D`].filter(r => rws.includes(r));
	//console.log(rwyA); // 예상: ["07A", "25D"]

	const rwyD = [`${mainRunway}D`, `${subRunway}A`].filter(r => rws.includes(r));
	//console.log(rwyD); // 예상: ["07D", "25A"]
	const dirA = rwyA.some(r => rwyDirA.includes(r)) ? "1" : "2";
	const dirD = rwyD.some(r => rwyDirD.includes(r)) ? "2" : "1";

	//console.log(rwyA);
	//console.log(rwyD);    	

	const handleAlert = (alert, id) => {
		const fields = alert.faa.split(" ");
		const targetId = fields[3] === "RWY" ? fields[3] : `rwy${fields[3].substr(0, 2)}${id}`;
		console.log("f_displayLidarAln id {}", targetId);
		const existingStrong = $(`#${targetId} .wind_point strong`);

		if (existingStrong.length > 0) {
			// 기존 strong 태그의 텍스트 중 숫자만 추출
			const existingValue = parseFloat(existingStrong.text().match(/\d+(\.\d+)?/)?.[0] || "0");
			const newValue = parseFloat(fields[2].match(/\d+(\.\d+)?/)?.[0] || "0");

			// 숫자 비교 후 더 큰 값으로 업데이트
			if (newValue > existingValue) {
				existingStrong.text(fields[2]);
			}
		} else {

			$(`#${targetId}`).append(`
		        <div class="wind_point blinking"
		            style="
		                background-color: ${LgnColors[alert.type].backColor};
		                color: ${LgnColors[alert.type].fontColor};
		                --blink-duration: ${sysSetting.blnkgCyc / 1000}s;
		            ">
		            <strong>${fields[2]}</strong>
		        </div>
		    `);
		}

		setTimeout(() => {
			$(`#${targetId} .blinking`).removeClass("blinking");
		}, sysSetting.blnkgTm);
	};

	const deactivateAlert = (alert, id) => {
		if (!alert) return; // alert가 null 또는 undefined일 경우 함수를 종료합니다.

		const fields = alert.split(" ");
		const targetId = fields.length >= 4 && fields[3] === "RWY" ? fields[3] : `rwy${fields[3]?.substring(0, 2)}${id}`;
		console.log(targetId);
		$(`#${targetId} div.wind_point`).remove();
	};


	//.wind_point 전체 삭제
	$(".wind_point").remove();

	["A", "D"].forEach((type) => {
		const alerts = type === "A" ? rwyA.map(r => alertsByRunway[r]) : rwyD.map(r => alertsByRunway[r]);
		const id = type === "A" ? dirA : dirD;

		alerts.forEach((alert) => {

			if (alert.type === "WSA" || alert.type === "MBA") {
				console.log("f_displayLidarAln {}", alert);
				//이전 알람 상관없이 울리기
				//if (prevAlerts[type] !== alert.faa) {
				//	deactivateAlert(prevAlerts[type], id);
				handleAlert(alert, id);
				//    prevAlerts[type] = alert.faa;
				//}
			} else {
				//deactivateAlert( prevAlerts[type], id);
				//prevAlerts[type] = null; // 초기화된 상태로 유지
			}
		});
	});
}

function f_displayLlwasAln(map) {
	if (map.atcpd === null || map.atcpd === undefined) return;
	if (map.atcpd["llwas"] === null || map.atcpd["llwas"] === undefined) return;

	const rwyDirA = ["07A", "13A", "25D", "31D"];
	const rwyDirD = ["07D", "13D", "25A", "31A"];

	const rwyUse = map.rwy;
	const view = map.atcpd["llwas"];
	const isManual = map.rwy && map.rwy.type === "M";
	const rws = fn_getCustomActiveRunways(isManual ? map.rwy : map.amos);
	const alertsByRunway = {};

	if (view.alerts === null) return;

	view.alerts.forEach((alert) => {
		alertsByRunway[alert.runway] = alert;
	});


	const rwyMappings = {
		"25": "07",
		"07": "25",
		"31": "13",
		"13": "31"
	};

	const getMappedRunway = (runway) => rwyMappings[runway] || runway;

	// 메인 활주로와 서브 활주로 설정
	const mainRunway = rwyType === "R1" ? rwyUse.mainRunway : rwyUse.subRunway;
	const subRunway = getMappedRunway(mainRunway);

	// 활주로 A, D 설정
	const rwyA = [`${mainRunway}A`, `${subRunway}D`].filter(r => rws.includes(r));
	//console.log(rwyA); // 예상: ["07A", "25D"]

	const rwyD = [`${mainRunway}D`, `${subRunway}A`].filter(r => rws.includes(r));
	//console.log(rwyD); // 예상: ["07D", "25A"]
	const dirA = rwyA.some(r => rwyDirA.includes(r)) ? "1" : "2";
	const dirD = rwyD.some(r => rwyDirD.includes(r)) ? "2" : "1";

	const handleAlert = (alert, id) => {
		//console.log(alert);
		const fields = alert.faa.split(" ");
		// console.log(fields);
		const targetId = fields[3] === "RWY" ? `amosObs${id}` : `llwas${fields[3].substr(0, 2)}${id}`;
		//const targetId = "llwas1M2";
		console.log("f_displayLlwasAln ID {}", targetId);

		const existingStrong = $(`#${targetId} .wind_point3 strong`);

		if (existingStrong.length > 0) {
			// 기존 strong 태그의 텍스트 중 숫자만 추출
			const existingValue = parseFloat(existingStrong.text().match(/\d+(\.\d+)?/)?.[0] || "0");
			const newValue = parseFloat(fields[2].match(/\d+(\.\d+)?/)?.[0] || "0");

			// 숫자 비교 후 더 큰 값으로 업데이트
			if (newValue > existingValue) {
				existingStrong.text(fields[2]);
			}

		} else {
			$(`#${targetId}`).append(`
		        <div class="wind_point3 blinking"
		            style="
		                background-color: ${LgnColors[alert.type].backColor};
		                color: ${LgnColors[alert.type].fontColor};
		                --blink-duration: ${sysSetting.blnkgCyc / 1000}s;
		            ">
		            <strong>${fields[2]}</strong>
		        </div>
		    `);
		}

		setTimeout(() => {
			$(`#${targetId} .blinking`).removeClass("blinking");
		}, sysSetting.blnkgTm);
	};

	const deactivateAlert = (alert, id) => {
		if (!alert) return; // alert가 null 또는 undefined일 경우 함수를 종료합니다.
		//console.log(alert);
		const fields = alert.split(" ");
		const targetId = fields.length >= 4 && fields[3] === "RWY" ? `amosObs${id}` : `llwas${fields[3]?.substring(0, 2)}${id}`;
		console.log("deactive id:" + targetId);
		$(`#${targetId} div.wind_point3`).remove();
	};


	//.wind_point 전체 삭제
	$(".wind_point3").remove();

	["A", "D"].forEach((type) => {
		//console.log(alertsByRunway);
		//console.log(rwyA + ":" + rwyD);
		const alerts = type === "A" ? rwyA.map(r => alertsByRunway[r]) : rwyD.map(r => alertsByRunway[r]);
		const id = type === "A" ? dirA : dirD;

		alerts.forEach((alert) => {
			if (alert === undefined) return;

			if (alert.type === "WSA" || alert.type === "MBA") {
				console.log("f_displayLlwasAln {}", alert);
				//이전 알람 상관없이 울리기
				//if (prevAlerts[type] !== alert.faa) {
				//	deactivateAlert(prevLlwasAlerts[type], id);
				handleAlert(alert, id);
				//    prevLlwasAlerts[type] = alert.faa;
				//}
			}
			else {
				//    deactivateAlert( prevLlwasAlerts[type], id);
				//    prevLlwasAlerts[type] = null; // 초기화된 상태로 유지
			}
		});
	});
}

function f_displayAmosObs(map) {

	if (map.amosobs === null || map.amosobs === undefined) {
		$("#amosObs1").empty();
		$("#amosObs2").empty();
		return;
	}
	if (map.amosobs !== undefined) {
		$("#amosObs1").empty();
		$("#amosObs2").empty();

		const isDtChk = f_getDtChk(map.atcpd.fileDt, map.amosobs.fileDt, map.amosobs.delay, "KST");
		//현재 활주로 판단
		if (isDtChk) {
			if (rwyType === "R1") {
				let wd07 = Math.round((map.amosobs.map['07'].wd + map.amosobs.trueNorthOffset) / 10) * 10;
				let wd25 = Math.round((map.amosobs.map['25'].wd + map.amosobs.trueNorthOffset) / 10) * 10;
				if (wd07 <= 0) wd07 = 360;
				if (wd25 <= 0) wd25 = 360;
				if (wd07 > 360) wd07 -= 360;
				if (wd25 > 360) wd25 -= 360;

				$("#amosObs1").append(`<span><img src="../images/ico_black_0.png" alt=""/></span><strong>${wd07}/${map.amosobs.map['07'].ws}</strong>`)
				$("#amosObs2").append(`<span><img src="../images/ico_black_0.png" alt=""/></span><strong>${wd25}/${map.amosobs.map['25'].ws}</strong>`)

				$("#amosObs1").find("span img").css("transform", `rotate(${wd07}deg)`);
				$("#amosObs2").find("span img").css("transform", `rotate(${wd25}deg)`);
			} else {
				let wd13 = Math.round((map.amosobs.map['13'].wd + map.amosobs.trueNorthOffset) / 10) * 10;
				let wd31 = Math.round((map.amosobs.map['31'].wd + map.amosobs.trueNorthOffset) / 10) * 10;
				if (wd13 <= 0) wd13 = 360;
				if (wd31 <= 0) wd31 = 360;
				if (wd13 > 360) wd13 -= 360;
				if (wd31 > 360) wd31 -= 360;

				$("#amosObs1").append(`<span><img src="../images/ico_black_0.png" alt="" /></span><strong>${wd13}/${map.amosobs.map['13'].ws}</strong>`)
				$("#amosObs2").append(`<span><img src="../images/ico_black_0.png" alt="" /></span><strong>${wd31}/${map.amosobs.map['31'].ws}</strong>`)

				$("#amosObs1").find("span img").css("transform", `rotate(${wd13}deg)`);
				$("#amosObs2").find("span img").css("transform", `rotate(${wd31}deg)`);
			}
		} else {
			$("#amosObs1").append(`<strong> - </strong>`);
			$("#amosObs2").append(`<strong> - </strong>`);
		}

	}

}

function f_displayLlwas(map) {
	if (map.llwas === null || map.llwas === undefined) {
		$("#llwas ul.llwas li").each(function () {
			const rwy = $(this).data("rwytype");
			if (rwy === rwyType || rwy === "A") {
				$(this).css("visibility", "visible");
				const rsId = $(this).data("rsid");
				if (rsId !== '' && rsId !== undefined) {
					$(this).empty();
					rsIds = rsId.split(",");
					let id = "";
					if (rwy === "A") {
						id = rsIds[1];
					} else {
						id = rsIds[0];
					}
					$(this).html("<strong> - </strong>");

				} else {
					$(this).html("<strong> - </strong>");
				}
			} else {
				$(this).css("visibility", "hidden");
				$(this).html("<strong> - </strong>");
			}
		});
		return;
	}


	if (map.llwas !== undefined) {
		const isDtChk = f_getDtChk(map.atcpd.fileDt, map.llwas.fileDt, map.llwas.delay, "UTC");

		$("#llwas ul.llwas li").each(function () {
			const rwy = $(this).data("rwytype");

			if (isDtChk && (rwy === rwyType || rwy === "A")) {
				$(this).css("visibility", "visible");
				const rsId = $(this).data("rsid");

				if (rsId !== '' && rsId !== undefined) {
					$(this).empty();
					rsIds = rsId.split(",");
					let id = "";
					if (rwy === "A") {
						id = rsIds[1];
					} else {
						id = rsIds[0];
					}
					const wsKey = "rsWspd" + id;
					const wdKey = "rsWd" + id;
					const wd = map.llwas[wdKey];
					const ws = map.llwas[wsKey];
					$(this).append(`<span><img src="../images/ico_black_0.png" alt=""/></span><strong>${wd}/${ws}</strong>`)
					$(this).find("span img").css("transform", `rotate(${wd}deg)`);

				} else {
					$(this).html("<strong> - </strong>");
				}
			} else {
				$(this).css("visibility", "hidden");
				$(this).html("<strong> - </strong>");
			}
		});
	} else {
		$("#llwas ul.llwas li").each(function () {
			$(this).css("visibility", "hidden");
			$(this).html("<strong> - </strong>");
		});
	}
}



function f_drawLgnd(type) {
	if (type === "WIND") {
		// $("#lgndEDR").hide();
		$("#lgndWIND").hide();

		/* 풍속 판단 변경으로 범례 표출 X
		$("#lgndWIND").show();
		let html= "<p>WIND(knot)</p><ul>";
		let li = "";
		const windDataReverse = LgnColors.WIND.slice().reverse();
    
		windDataReverse.forEach((item, index) => {
			const levelClass = "level_custom";
			let span = "";
			//let level = (typeof item.level.kn === "string") ? Number(item.level.kn).toFixed(2) : item.level.kn.toFixed(2);
			let level = (item.level.txt !== undefined) ? item.level.txt :  (typeof item.level.kn === "string") ? Number(item.level.kn).toFixed(2) : item.level.kn.toFixed(2);
			if(index === 0){
				span = `${level}`;
			}else if(index % 5 == 0){
				span = `${level}`;
			}else if(index === windDataReverse.length-1){
				span = `${level}`;
			}
			li += `<li class="${levelClass}">
						<span></span>
						<em style="background: rgba(${item.color.R}, ${item.color.G}, ${item.color.B}, 1.0) !important;"></em>
						<span>${span}</span>				
					 </li>`	
						
		});
		html += li;
		html += "</ul>";
		$("#lgndWIND").html(html);
		*/
	} else {
		$("#lgndEDR").show();
		$("#lgndWIND").hide();
		$("#lgndWIND").html("");
	}
}



function f_getDtChk(atcpdDt, tarDt, delay, type) {
	let atcpdFileDt = moment(atcpdDt, "YYYYMMDDHHmmss");
	let tarFileDtFileDt = moment(tarDt, "YYYYMMDDHHmmss");


	// type에 따라 UTC이면  atcpdFileDt에서 9시간을 빼기 UTC
	let typGap = 0;
	if (type === "UTC") {
		typGap = -9;
	}
	atcpdFileDt = atcpdFileDt.add(typGap, "hours");

	// 두 시간의 차이 계산
	let diffMin = Math.abs(atcpdFileDt.diff(tarFileDtFileDt, 'minutes'));
	//console.log(atcpdFileDt.format("YYYYMMDDHHmmss") + "," + crossDt + " , " + diffMin );
	// 차이가 delay 이상이면 false 반환
	return diffMin >= Number(delay) ? false : true;

}

function f_chgWpf(map) {
	// - 체크후 윈드프로파일러로 대체
	if (rwyType === "R1") {
		let r07AllDash = true;
		let r25AllDash = true;
		$("#rwy3nm1 li").each(function () {
			const windText = $(this).find(".wind strong").text().trim();
			if (windText !== "-" && windText !== "07WPR") {
				r07AllDash = false;
				return false; //하나라도 - 이 아니면 반복 종료
			}
		});

		$("#rwy2nm2 li").each(function () {
			const windText = $(this).find(".wind strong").text().trim();
			if (windText !== "-" && windText !== "25WPR") {
				r25AllDash = false;
				return false; //하나라도 - 이 아니면 반복 종료
			}
		});

		//모든 항목이 - 이면 다른 콘텐츠를 삽입
		if (r07AllDash) {
			if (map.wp !== null && map.wp !== undefined) {
				const r07Winds = map.wp.r07Winds;

				// 배열을 객체로 변환하면 검색 효율 ↑
				const windMap = {};
				r07Winds.forEach(item => {
					const key = item.height.replace("H", "");
					windMap[key] = { wd: item.wd, ws: item.ws };
				});

				// 각 li를 순회하며 업데이트
				$("#rwy3nm1 li").each(function () {
					const ht = $(this).data("ht"); // 예: 450
					const key = ht;
					const wind = windMap[key];

					if (wind) {
						const { wd, ws } = wind;

						// 색상 설정 (원하는 색상 로직으로 변경 가능)
						if (wd <= 0) {
							wd += 360;
						}
						if (wd > 360) wd -= 360;
						const bColor = "#FFB2F5";

						// 새로운 wind 요소 생성
						let windHtml = `<div class="wind" style="color:${bColor}">
			                    <span>
			                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="transform: rotate(${wd}deg);">
			                            <path fill="${bColor}" d="M13.5,18V0h-3V18H5.921l5.083,5.555c.532,.593,1.461,.593,1.993,0l5.083-5.555h-4.579Z"/>
			                        </svg>
			                    </span>
			                    <strong>${wd}/${ws}</strong>
			                </div>`;

						// 기존 wind div를 대체
						$(this).find(".wind").replaceWith(windHtml);
					} else {
						$(this).find("svg path").attr("fill", "#FFB2F5");
						$(this).css("color", "#FFB2F5");
					}
				});

			}
		} else {
			$("#rwy3nm1 li").each(function () {
				const windText = $(this).find(".wind strong").text().trim();
				if (windText === "07WPR") {
					$(this).find("svg path").attr("fill", "#ffffff");
					$(this).css("color", "#ffffff");
					return false; //하나라도 - 이 아니면 반복 종료
				}
			});
		}

		if (r25AllDash) {
			if (map.wp !== null && map.wp !== undefined) {
				const r25Winds = map.wp.r25Winds;

				// 배열을 객체로 변환하면 검색 효율 ↑
				const windMap = {};
				r25Winds.forEach(item => {
					const key = item.height.replace("H", "");
					windMap[key] = { wd: item.wd, ws: item.ws };
				});

				// 각 li를 순회하며 업데이트
				$("#rwy2nm2 li").each(function () {
					const ht = $(this).data("ht"); // 예: 450
					const key = ht;
					const wind = windMap[key];

					if (wind) {
						const { wd, ws } = wind;

						// 색상 설정 (원하는 색상 로직으로 변경 가능)
						if (wd <= 0) {
							wd += 360;
						}
						if (wd > 360) wd -= 360;
						const bColor = "#FFB2F5";

						// 새로운 wind 요소 생성
						let windHtml = `<div class="wind" style="color:${bColor}">
			                    <span>
			                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="transform: rotate(${wd}deg);">
			                            <path fill="${bColor}" d="M13.5,18V0h-3V18H5.921l5.083,5.555c.532,.593,1.461,.593,1.993,0l5.083-5.555h-4.579Z"/>
			                        </svg>
			                    </span>
			                    <strong>${wd}/${ws}</strong>
			                </div>`;

						// 기존 wind div를 대체
						$(this).find(".wind").replaceWith(windHtml);
					} else {
						$(this).find("svg path").attr("fill", "#FFB2F5");
						$(this).css("color", "#FFB2F5");
					}
				});

			}
		} else {


			$("#rwy2nm2 li").each(function () {
				const windText = $(this).find(".wind strong").text().trim();
				if (windText === "25WPR") {
					$(this).find("svg path").attr("fill", "#ffffff");
					$(this).css("color", "#ffffff");
					return false; //하나라도 - 이 아니면 반복 종료
				}
			});
		}
	}

}