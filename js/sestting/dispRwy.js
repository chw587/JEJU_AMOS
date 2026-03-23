let DISP_RWY_ATCPD_DATA;
let DISP_RWY_INFO;
/**
 * 쿠키로 표출 활주로 정보 가져와서 세팅하기
 */
function f_initDispRwyData(){
	
	f_initManualDispRwy();
	f_initPreFerDispRwy();
	 
	 f_setDispRwyData();
	 
}

/**
 * 표출 활주로 버튼 이벤트
 */
function f_initDispRwyBtn(){
	
	//선호 표출 수동 표출 둘중 하나만
	$("input[name='dispRwyType']").on("change", (e) => {
		if($(e.target).is(':checked')){
			$("input[name='dispRwyType']").not(e.target).prop("checked", false);
			
			f_initDispRwy();
		}else{
			f_initManualDispRwy();
			f_initPreFerDispRwy();
		}
	});

	//선호 표출 선택
	$("#preFerGrp li").click( (e) =>{
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		
		if(dispRwyType === "P"){
			$(e.target).addClass("is_active");
			$("#preFerGrp li").not(e.target).removeClass("is_active");	
		}else{
			toastr["warning"]("선호 표출를 선택해 주세요.");
			e.preventDefault();
		}
		f_drawDispRwyATCPD();
		
	});
	
	//수동 표출 선택
	// 왼쪽에서 오른쪽으로 아이템 이동
    $(".ico_next").click(function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		
		if(dispRwyType === "M"){
	        if ($("#manualSlt1 li.is_active").length === 0) {
	            toastr["warning"]("이동할 항목을 선택하세요.");
	        } else {
	            $("#manualSlt1 li.is_active").each(function() {
	                $(this).removeClass("is_active");
	                $("#manualSlt2").append($(this).clone());
	                $(this).remove();
	            });
	        }
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		}
		f_drawDispRwyATCPD();
    });

    // 오른쪽에서 왼쪽으로 아이템 이동
    $(".ico_prev").click(function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		
		if(dispRwyType === "M"){
	        if ($("#manualSlt2 li.is_active").length === 0) {
	            toastr["warning"]("이동할 항목을 선택하세요.");
	        } else {
	            $("#manualSlt2 li.is_active").each(function() {
	                $(this).removeClass("is_active");
	                $("#manualSlt1").append($(this).clone());
	                $(this).remove();
	            });
	            
	            f_sortListByDataIdx($("#manualSlt1"));
	        }
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		}
		f_drawDispRwyATCPD();
    });

    // 리스트 내에서 아이템 위로 이동
    $(".ico_up2").click(function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		if(dispRwyType === "M"){
	        if ($("#manualSlt2 li.is_active").length === 0) {
	            toastr["warning"]("이동할 항목을 선택하세요.");
	        } else {
	            $("#manualSlt2 li.is_active").each(function() {
	                var prev = $(this).prev();
	                if (prev.length !== 0) {
	                    prev.before($(this));
	                }
	            });
	        }
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		}
		f_drawDispRwyATCPD();
    });

    // 리스트 내에서 아이템 아래로 이동
    $(".ico_down2").click(function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		if(dispRwyType === "M"){
	        if ($("#manualSlt2 li.is_active").length === 0) {
	            toastr["warning"]("이동할 항목을 선택하세요.");
	        } else {
	            $("#manualSlt2 li.is_active").each(function() {
	                var next = $(this).next();
	                if (next.length !== 0) {
	                    next.after($(this));
	                }
	            });
	        }
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		} 
		f_drawDispRwyATCPD();
    });

    // 아이템 선택 시 클래스 추가/제거
    $("#manualSlt1").on("click", "li", function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		if(dispRwyType === "M"){
        	$(this).toggleClass("is_active");
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		}
    });

    $("#manualSlt2").on("click", "li", function() {
		const dispRwyType = $("input[name='dispRwyType']:checked").val();
		if(dispRwyType === "M"){
        	$(this).toggleClass("is_active");
		}else{
			toastr["warning"]("수동 표출를 선택해 주세요.");
			e.preventDefault();
		}
    });
    
    //표출활주로 적용
    $("#btnDispRwyApply").click( (e) => {
		if(f_validDispRwy()){
			f_dispRwyApply();
			f_topAdmLogout();
		}
	});
}

/**
 * 표출 활주로 초기화
 */
function f_initDispRwy(){
	const dispRwyType = $("input[name='dispRwyType']:checked").val();
	
	if(dispRwyType === "P"){
		f_initManualDispRwy();
		
	}else{
		f_initPreFerDispRwy();
	}
}

/**
 * 선호 표출 초기화
 */
function f_initPreFerDispRwy(){
	$("#preFerGrp li").each((idx, li)=>{
		$(li).removeClass("is_active");
	});
}

/**
 * 수동 표출 초기화
 */
function f_initManualDispRwy(){
	
	$("#manualSlt1").empty();
	$("#manualSlt2").empty();
 	
	$("#manualSlt1").append($("#hidenClone").html());		
}

// data-idx를 기준으로 리스트 정렬
function f_sortListByDataIdx($list) {
    var $items = $list.children("li").get();
    $items.sort(function(a, b) {
        return $(a).data("idx") - $(b).data("idx");
    });
    $.each($items, function(index, item) {
        $list.append(item);
    });
}

/**
 * Validation 
 */
function f_validDispRwy(){
	const dispRwyType = $("input[name='dispRwyType']:checked").val();
	
	if(dispRwyType === undefined) return true;
	
	if(dispRwyType !== "P" && dispRwyType !== "M"){
		toastr['warning']("표출할 방법을 선택해 주세요.");
		return false;
	}else{
		if(dispRwyType === "P"){
			const liCnt = $("#preFerGrp li.is_active").length;
			if(liCnt === 0){
				toastr['warning']("선호 표출 선택된 항목이 없습니다.");
				return false;
			}
		}else {
			//250208 요청으로 인해 활성화 말로 목록이있으면 다 적용
			const liCnt = $("#manualSlt2 li").length;
			if(liCnt === 0){
				toastr['warning']("수동 표출 선택된 항목이 없습니다.");
				return false;
			}
		}
	}
	
	return true;
	
	
}

/**
 * 표출 활주로 적용
 */
function f_dispRwyApply(){
	const dispRwy = f_getDispRwySelectData();
	
	fn_setJsonCookie("dispRwy", dispRwy, 7);
	
}

function  f_getDispRwySelectData(){
	let dispRwy = {};
	
	const dispRwyType = $("input[name='dispRwyType']:checked").val();
	
	dispRwy.type = dispRwyType === undefined ? "A" : dispRwyType;
	
	if(dispRwyType === "P"){
		const rwys = $("#preFerGrp li.is_active").data('rwys');
		
		// rwys가 문자열인 경우와 undefined, null 또는 빈 배열인 경우를 처리
		if (rwys === undefined || rwys === null || rwys === "" || (Array.isArray(rwys) && rwys.length === 0)) {
			 dispRwy.rwys = ["1A", "1D", "2D"];
		}else{
			const rwyArr = rwys.split(",");
			dispRwy.rwys = rwyArr;
		}
		
	}else if(dispRwyType === "M"){
		const rwyArr  = $("#manualSlt2 li").map(function(){
			return $(this).data("rwy");
		}).get();
		
		if(rwyArr.length > 0){
			dispRwy.rwys = rwyArr;	
		}else{
			dispRwy.rwys = new Array();
		}
	}else {
		dispRwy.rwys = new Array();
	}
	return dispRwy;
}

/**
 * 활주로 별 WIND 정보 표출
 */
function f_setDispRwy(map){
	DISP_RWY_ATCPD_DATA = map.atcpd['combined']; 
	DISP_RWY_INFO = map.rwy;
	
	f_drawDispRwyATCPD();
}

function f_drawDispRwyATCPD(){
	const view = DISP_RWY_ATCPD_DATA;
	//console.log(view);
	
	const isManual = DISP_RWY_INFO&&DISP_RWY_INFO.type==="M";
    const rws = f_getCustomActiveRunways(DISP_RWY_INFO); // 
    const alertsByRunway = {}
    view.alerts.forEach( (alert) => { // 활주로 맵 변환
        alertsByRunway[alert.runway] = alert;
    });

    let newAlert = "";
    
    //비우기
    $("ul.rwy_info").removeClass("alert");
    $("ul.rwy_info li").each(function() {
        $(this).empty();
    });

    rws.forEach( (rw,i) => {
        const $ul = $(`ul.rwy_info:eq(${i})`);
        const alert = alertsByRunway[rw];
        const fields = alert.faa.split(" ");
        if ( alert.type==="WSA" || alert.type==="MBA" ) {
            $ul.addClass("alert");
            newAlert += alert.faa;
        }
        fields.forEach( (field, j) => {
            $ul.find(`li:eq(${j})`).text(field);
        });
    });
    
}

function f_getCustomActiveRunways(amos) {
    
    const firstRunway = amos.mainRunway==="07"||amos.mainRunway==="25"?amos.mainRunway:amos.subRunway;
    const secondaryRunway = amos.mainRunway==="13"||amos.mainRunway==="31"?amos.mainRunway:amos.subRunway;

    return f_getCustomRunwaySetting().map( rw => {
		if(rw === "1A" || rw === "1D" || rw ==="2A" || rw ==="2D"){
			if ( rw.startsWith("1") ) {
            	return firstRunway+rw.charAt(1);	
        	}
        	return secondaryRunway+rw.charAt(1);	
		}else{
			return rw;
		}
        
    });

}

function f_getCustomRunwaySetting() {
    // 기능 개발 전까지 하드코딩
    // 기능은 cookie로 할 예정
    const dispRwy = f_getDispRwySelectData();
    if (dispRwy === undefined || dispRwy.rwys === undefined || dispRwy.rwys === null || !Array.isArray(dispRwy.rwys) || dispRwy.rwys.length === 0) {
		return ["1A", "1D", "2D"];
	}
    return dispRwy.rwys;
}


/**
 * 쿠키 정보로 세팅
 */
function f_setDispRwyData(){
	const dispRwy = fn_getJsonCookie("dispRwy");
	
	if(dispRwy.type !== undefined && dispRwy.type !== "A"){
	
		$("input[name='dispRwyType'][value='" + dispRwy.type + "']").prop("checked", true);
		
		if(dispRwy.type === "P"){
			const rwys = dispRwy.rwys.join(",");
			$("#preFerGrp li").each(function(){
				if($(this).data("rwys") === rwys){
					$(this).addClass("is_active");
				}
			});
		}else if(dispRwy.type === "M"){
			const rwyArr = dispRwy.rwys;
			
			rwyArr.forEach(function(rwy){
				 // data-rwy 값이 rwy와 일치하는 li 요소를 선택
		        const matchingLi = $("#manualSlt1 li").filter(function() {
		            return $(this).data("rwy") === rwy;
		        });
		
		        // 일치하는 요소가 있을 경우 복사하여 manualSlt2에 추가
		        if (matchingLi.length > 0) {
		            const clonedLi = matchingLi.clone().removeClass("is_active");
		            $("#manualSlt2").append(clonedLi[0]);
		            matchingLi.remove();
		        }
			});
			
			
		}	
	}else{
		//쿠키에 정보가 없고 처음 들어오면 선호 표출1번으로 세팅한다.
		$("input[name='dispRwyType'][value='P']").prop("checked", true);
		$("#preFerGrp li:first").addClass("is_active");
		
	}
	
	
}
