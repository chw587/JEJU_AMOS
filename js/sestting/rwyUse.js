
function f_initRwyUseBtn(){
	//관제탑장 비밀번호 popup 관련
	$("#btnPopTopAdmPwdCancel").click(() =>{
		$("#popTopAdmPwd").removeClass("is_active");
	});
	
	$("#btnPopTopAdmPwdHide").click(() =>{
		$("#popTopAdmPwd").removeClass("is_active");
	});
	
	$("#btnPopTopAdmPwdLogin").click(() =>{
		f_topAdmLogin();
	});
	
	//관제탑장 비밀번호 변경 popup 관련 Start
	$("#btnTopAdmChg").click(()=>{
		$("#popTopAdmPwdChg").addClass("is_active");
	});
	
	$("#btnTopAdmPwdChgHide").click(()=>{
		$("#popTopAdmPwdChg").removeClass("is_active")
	});
	
	$("#btnTopAdmPwdChgCancel").click(()=>{
		$("#popTopAdmPwdChg").removeClass("is_active")
	});
	
	//변경
	$("#btnTopAdmPwdChg").click((e)=>{
		if(!f_topAdmPwdChgValid()){
			e.preventDefault();
		}else{
			f_isCurTopAdmPwd().then( (success) =>{
				if(!success){
					e.preventDefault();
					toastr["warning"]('현재 비밀번호가 일치하지 않습니다.');
					$("#chgTopAdmPwd").focus();
				}else{
					f_topAdmPwdChg();
					
				}
			});
		}
	});
	//관제탑장 비밀번호 변경 popup 관련 End
	
	//auto manual 활주로 선택
	$("input[name='rwyUseType']").on("change", (e) => {
		f_chekTopAdmin().then((isTopAdm) =>{
			if(isTopAdm){
				if($(e.target).is(':checked')){
					
					$(e.target).parent().addClass(`is_${onOff}_active`);
					$("input[name='rwyUseType']").not(e.target).prop("checked", false);
					$("input[name='rwyUseType']").not(e.target).parent().removeClass(`is_${onOff}_active`);
						
					const rwyType = $(e.target).val();
					f_initRwyUse(rwyType);
				}
			}else{
				$("input[name='rwyUseType']").prop("checked",false);
			}
		})	
	});
	
	//manal 활주로 선택
	$("button[name='mainRwy']").on("click", (e) =>{
		$(e.target).addClass(`is_${onOff}_active`);
		$("button[name='mainRwy']").not(e.target).removeClass(`is_${onOff}_active`);
	});
	
	$("button[name='subRwy']").on("click", (e) =>{
		$(e.target).addClass(`is_${onOff}_active`);
		$("button[name='subRwy']").not(e.target).removeClass(`is_${onOff}_active`);
	});

	//사용활주로 적용
	$("#btnRwyUseApply").click(()=>{
		f_chekTopAdmin().then((isTopAdm) =>{
			if(isTopAdm){
				if(f_rwyUseApplyValid())
					f_rwyUseApply();
			}
				
		});	
	});
}

function f_initRwyUse(rwyType){
	if(rwyType === 'M'){
		$("button[name='mainRwy']").prop("disabled", false);
		$("button[name='subRwy']").prop("disabled", false);
		//rwy 활성화 해제
		$("button[name='mainRwy']").removeClass("is_on_active");
		$("button[name='subRwy']").removeClass("is_on_active");
		$("button[name='mainRwy']").removeClass("is_off_active");
		$("button[name='subRwy']").removeClass("is_off_active");
	}else{
		$("button[name='mainRwy']").prop("disabled", true);
		$("button[name='subRwy']").prop("disabled", true);
	}	
}


/**
 * rwy 세팅
 */
function f_setRwyUse(map){
	
	const rwy = map.rwy;
	const amos = map.amos;
	
	const isActive =`is_${onOff}_active`;
	
	$("input[name='rwyUseType']").parent().removeClass('is_on_active');
	$("input[name='rwyUseType']").parent().removeClass('is_off_active');
	
	$("input[name='rwyUseType'][value='" + rwy.type + "']").prop("checked", true);
	$("input[name='rwyUseType'][value='" + rwy.type + "']").parent().addClass(`is_${onOff}_active`);
	
	$(".runway_txt").empty();
	$(".runway_txt").append(`<li>${amos.mainRunway}A</li><li>${amos.mainRunway}D</li><li>${amos.subRunway}A</li><li>${amos.subRunway}D</li>`);
		
	if(rwy.type === "M"){
		f_initRwyUse(rwy.type);
		
		$("button[name='mainRwy'][value='" + rwy.mainRunway + "']").addClass(isActive);
		$("button[name='subRwy'][value='" + rwy.subRunway + "']").addClass(isActive);
	}
}



//사용활주로 적용 valid
function f_rwyUseApplyValid(){
	//rwy type 확인
	const isActive =`is_${onOff}_active`;
	const rwyUseType = $("input[name='rwyUseType']:checked").val();
	
	if(rwyUseType !== "A" && rwyUseType !== "M"){
		 toastr["warning"]("사용 활주로를 선택 해주세요.");
		 return false;	
	}
	
	if(rwyUseType === 'M'){
		const mainRwy = $("button[name='mainRwy']." + isActive).val();
		const subRwy = $("button[name='subRwy']." + isActive).val();
		if(mainRwy === "" || subRwy === "" ){
			toastr["warning"]("사용자 활주로 선택시 주, 보조 활주로를 해주세요.");
			return false;
		}	
	}
	
	return true;
}

//사용활주로 적용
function f_rwyUseApply(){
	const isActive = `is_${onOff}_active`;
	
	const rwyUseType = $("input[name='rwyUseType']:checked").val();
	const mainRwy = $("button[name='mainRwy']." + isActive).val() !== undefined ? $("button[name='mainRwy']." + isActive).val() : "";
	const subRwy = $("button[name='subRwy']." + isActive).val() !== undefined ? $("button[name='subRwy']." + isActive).val() : "";
	
	$.ajax({
		url: "/setting/rwyUseApply.a",
		type:"post",
		data: {rwyUseType: rwyUseType, mainRwy: mainRwy, subRwy: subRwy},
		success: ( success ) => {
			f_topAdmLogout();
		},
		error: () => {
		
		}
	});
}

function f_activeOnOff(){

    if (onOff === "on") {
        $("#rwyUseActive .on").show();
        $("#rwyUseActive .off").hide();
    } else {
        $("#rwyUseActive .on").hide();
        $("#rwyUseActive .off").show();
    }
}
