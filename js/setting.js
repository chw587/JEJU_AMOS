let onOff = "off";

$(f_initSetting);

/**
 * 설정 초기화
 */
function f_initSetting(){
	f_initSettingBtn();
	f_settingloadFirst();
	fn_wsConnect(f_settingInfo);
}

/**
 * 최초 한번 로드
 */
function f_settingloadFirst(){
	//사용 활주로 초기 정보 
	$.ajax({
		url : "/setting/rwyUseData.a",
		success : ( rwyUse ) => {
			console.log(rwyUse);
			
			f_settingInfo(rwyUse);
			
		}
	});
	
	f_initDispRwyData();
	f_initSysSetting();
}



/**
 * 설정에서 필요한 정보 닫기 
 */
function f_settingInfo(map){
	//AMOS 자료 소켓으로 여부 받을때설정	
	onOff = "off";
	//console.log(map)
	
	if(map.amos.fileDt) {
		const now = moment();
		const fileDt = moment(map.amos.fileDt,'YYYYMMDDHHmmss');
		const diffMin = now.diff(fileDt, 'minutes');
		
		if(diffMin <= amosAllowMin){
			onOff= "on";	
		}
		
	}
	f_activeOnOff();
	
	f_isLogin().then((isTopAdm) =>{
		if(!isTopAdm){
			f_setRwyUse(map);
		}
	});
	f_setDispRwy(map);
}

/**
 * 설정에서 사용하는 btn event
 */
function f_initSettingBtn(){
	
	//seting popup close
	$("#btnCloSetting").click(() => {
		$("#lyrPopSetting").removeClass("is_active");
		f_topAdmLogout();
	});
	
	//settingMenu
	$("#settingMenu li a").click((e) => {
		$("#settingMenu li").each((idx, li) => {
			if($(li).hasClass("is_active")){
				$(li).removeClass("is_active");
				return false;	
			}
		});
		$(e.target).parent().addClass("is_active");
		const id = $(e.target).parent().attr("id").replace(/^tab/,"");
		const tabMenu = id.charAt(0).toLowerCase()+ id.slice(1);
		
		$(".pop_contents").each((idx, div) =>{
			if($(div).hasClass("is_active")){
				$(div).removeClass("is_active");
				return false;	
			}
		});
			
		$(`#${tabMenu}`).addClass("is_active");
		if(tabMenu === "runwayUse") $("#runwayUseBtns").show();
		else $("#runwayUseBtns").hide();		
		
		f_settingloadFirst();
	});
	
	f_initRwyUseBtn(); 		 //사용 활주로 버튼 이벤트
	f_initDispRwyBtn(); 	 //표출 활주로 버튼 이벤트
	f_initSysSettingBtn();	 //시스템 설정 버튼 이벤트
}

/**
 * 설정 팝업 활성화
 */
function f_openSetting(){
	$("#lyrPopSetting").addClass("is_active");
	f_initSettingPage();
}

/**
 * 최초 setting 페이지 초기화
 */
function f_initSettingPage(){
	
	$("#tabRunwayUse").addClass("is_active");
	$("#tabDispRunway").removeClass("is_active");
	$("#tabSetSys").removeClass("is_active");
	
	$("#runwayUse").addClass("is_active");
	$("#dispRunway").removeClass("is_active");
	$("#setSys").removeClass("is_active");
	
}	

