$(document).ready(function () {
  $(document).keydown(function (e) {
    const key = e.which;
    const $select = $("select[name='fontSize']");
    const $options = $select.find('option');
    let selectedIndex = $options.index($options.filter(':selected'));

    if (key === 37 && selectedIndex > 0) {
      // ← 좌측 방향키
      $options.eq(selectedIndex - 1).prop('selected', true);
    } else if (key === 39 && selectedIndex < $options.length - 1) {
      // ↓ 방향키
      $options.eq(selectedIndex + 1).prop('selected', true);
    }

    $select.trigger('change');
  });
});

function f_initSysSetting(){
	f_setSysSettingData();
}

function f_setSysSettingData(){
	const sysSetting = fn_getJsonCookie("sysSetting");
	
	if(Object.keys(sysSetting).length > 0){
		if(sysSetting.dispLatLonType !== undefined){
			$("select[name='dispLatLonType']").val(sysSetting.dispLatLonType);
		}else{
			$("select[name='dispLatLonType'] option").eq(0).prop("selected", true);
		}
		
		if(sysSetting.blnkgTm !== undefined){
			$("select[name='blnkgTm']").val(sysSetting.blnkgTm);
		}else{
			$("select[name='blnkgTm'] option").eq(0).prop("selected", true);
		}	
		
		if(sysSetting.blnkgCyc !== undefined){
			$("select[name='blnkgCyc']").val(sysSetting.blnkgCyc);
		}else{
			$("select[name='blnkgCyc'] option").eq(0).prop("selected", true);
		}
		
		if(sysSetting.fontSize !== undefined){
			$("select[name='fontSize']").val(sysSetting.fontSize);
		}else{
			$("select[name='fontSize']").val(1);
		}
		
		if(sysSetting.lyrAlpha !== undefined){
			$("input[name='lyrAlpha']").val(100 - sysSetting.lyrAlpha);
		}else{
			$("input[name='lyrAlpha']").val(50);
		}
		
		if(sysSetting.mbaBackColor !== undefined){
			$("input[name='mbaColorBtn']").eq(0).val(sysSetting.mbaBackColor);
			f_setPreview($("button[name='mbaBackColorPreview']"),"background-color", sysSetting.mbaBackColor);
			f_setPreview($("button[name='mbaFontColorPreview']"),"background-color", sysSetting.mbaBackColor);
	
		}else{
			$("input[name='mbaColorBtn']").eq(0).val("#FF0000");
			f_setPreview($("button[name='mbaBackColorPreview']"),"background-color", "#FF0000");
			f_setPreview($("button[name='mbaFontColorPreview']"),"background-color", "#FF0000");

		}
		if(sysSetting.mbaFontColor !== undefined){
			$("input[name='mbaColorBtn']").eq(1).val(sysSetting.mbaFontColor);
			f_setPreview($("button[name='mbaBackColorPreview']"),"color", sysSetting.mbaFontColor);
			f_setPreview($("button[name='mbaFontColorPreview']"),"color", sysSetting.mbaFontColor);

		}else{
			$("input[name='mbaColorBtn']").eq(1).val("#000000");
			f_setPreview($("button[name='mbaBackColorPreview']"),"color", "#000000");
			f_setPreview($("button[name='mbaFontColorPreview']"),"color", "#000000");
			
		}
		
		if(sysSetting.wsaBackColor !== undefined){
			$("input[name='wsaColorBtn']").eq(0).val(sysSetting.wsaBackColor);
			f_setPreview($("button[name='wsaBackColorPreview']"),"background-color", sysSetting.wsaBackColor);
			f_setPreview($("button[name='wsaFontColorPreview']"),"background-color", sysSetting.wsaBackColor);
		}else{
			$("input[name='wsaColorBtn']").eq(0).val("#FFFF00");
			f_setPreview($("button[name='wsaBackColorPreview']"),"background-color", "#FFFF00");
			f_setPreview($("button[name='wsaFontColorPreview']"),"background-color", "#FFFF00");

		}
		if(sysSetting.wsaFontColor !== undefined){
			$("input[name='wsaColorBtn']").eq(1).val(sysSetting.wsaFontColor);
			f_setPreview($("button[name='wsaBackColorPreview']"),"color", sysSetting.wsaFontColor);
			f_setPreview($("button[name='wsaFontColorPreview']"),"color", sysSetting.wsaFontColor);
		}else{
			$("input[name='wsaColorBtn']").eq(1).val("#000000");
			f_setPreview($("button[name='wsaBackColorPreview']"),"color", "#000000");
			f_setPreview($("button[name='wsaFontColorPreview']"),"color", "#000000");

		}
		
		if(sysSetting.microColor !== undefined){
			$("input[name='microColorBtn']").val(sysSetting.microColor);
			f_setPreview($("button[name='microColorPreview']"),"color", sysSetting.microColor);
			f_setPreview($("button[name='microColorPreview']"),"border-color", sysSetting.microColor);
		}else{
			$("input[name='microColorBtn']").val("#FF00FF");
			f_setPreview($("button[name='microColorPreview']"),"color", "#FF00FF");
			f_setPreview($("button[name='microColorPreview']"),"border-color", "#FF00FF");
		}
		
		if(sysSetting.gustColor !== undefined){
			$("input[name='gustColorBtn']").val(sysSetting.gustColor);
			f_setPreview($("button[name='gustColorPreview']"),"border-color", sysSetting.gustColor);
		}else{
			$("input[name='gustColorBtn']").val("#790175");
			f_setPreview($("button[name='gustColorPreview']"),"border-color", "#790175");
		}
		
		if(sysSetting.crossWsAttn !== undefined){
			$("input[name='crossWsAttn']").val(sysSetting.crossWsAttn);
		}
		
		if(sysSetting.crossWsWarn !== undefined){
			$("input[name='crossWsWarn']").val(sysSetting.crossWsWarn);
		}
		
		if(sysSetting.crossWsDgr !== undefined){
			$("input[name='crossWsDgr']").val(sysSetting.crossWsDgr);
		}
	}else{
		f_resetSysSetting();
	}
}

function f_getSysSettingData(){
	let sysSetting = {};
	
	const dispLatLonType = $("select[name='dispLatLonType']").val();
	const blnkgTm = $("select[name='blnkgTm']").val();
	const blnkgCyc = $("select[name='blnkgCyc']").val();
	const fontSize = $("select[name='fontSize']").val();
	const lyrAlpha = $("input[name='lyrAlpha']").val();
	const mbaBackColor = $("input[name='mbaColorBtn']").eq(0).val();
	const mbaFontColor = $("input[name='mbaColorBtn']").eq(1).val();
	const wsaBackColor = $("input[name='wsaColorBtn']").eq(0).val();
	const wsaFontColor = $("input[name='wsaColorBtn']").eq(1).val();
	const microColor = $("input[name='microColorBtn']").val();
	const gustColor = $("input[name='gustColorBtn']").val();
	const crossWsAttn = $("input[name='crossWsAttn']").val();
	const crossWsWarn = $("input[name='crossWsWarn']").val();
	const crossWsDgr = $("input[name='crossWsDgr']").val();

	sysSetting.dispLatLonType = dispLatLonType;
	sysSetting.blnkgTm = blnkgTm;
	sysSetting.blnkgCyc = blnkgCyc;
	sysSetting.lyrAlpha = 100 - lyrAlpha; //사용자와 시시템간의 투명도 개념을 반대로 해달라 하셔서 실제 표현만 반대로 해주고 설정정보는 그대로 넣어준다
	sysSetting.mbaBackColor = mbaBackColor;
	sysSetting.mbaFontColor = mbaFontColor;
	sysSetting.wsaBackColor = wsaBackColor;
	sysSetting.wsaFontColor = wsaFontColor;
	sysSetting.microColor = microColor;
	sysSetting.gustColor = gustColor;
	sysSetting.crossWsAttn = crossWsAttn;
	sysSetting.crossWsWarn = crossWsWarn;
	sysSetting.crossWsDgr = crossWsDgr;
	sysSetting.fontSize = fontSize;
	
	return sysSetting;
	 	
}

function f_resetSysSetting(){
	$("select[name='dispLatLonType'] option").eq(0).prop("selected", true);
		
	$("select[name='blnkgTm'] option").eq(0).prop("selected", true);
		
	$("select[name='blnkgCyc'] option").eq(0).prop("selected", true);
	
	$("select[name='fontSize'] option").eq(0).prop("selected", true);
	
	$("input[name='lyrAlpha']").val(50);
	
	$("input[name='mbaColorBtn']").eq(0).val("#FF0000");
	$("input[name='mbaColorBtn']").eq(1).val("#000000");
	
	f_setPreview($("button[name='mbaBackColorPreview']"),"background-color", "#FF0000");
	f_setPreview($("button[name='mbaFontColorPreview']"),"background-color", "#FF0000");
	f_setPreview($("button[name='mbaBackColorPreview']"),"color", "#000000");
	f_setPreview($("button[name='mbaFontColorPreview']"),"color", "#000000");
	
	$("input[name='wsaColorBtn']").eq(0).val("#FFFF00");
	$("input[name='wsaColorBtn']").eq(1).val("#000000");
	
	f_setPreview($("button[name='wsaBackColorPreview']"),"background-color", "#FFFF00");
	f_setPreview($("button[name='wsaFontColorPreview']"),"background-color", "#FFFF00");
	f_setPreview($("button[name='wsaBackColorPreview']"),"color", "#000000");
	f_setPreview($("button[name='wsaFontColorPreview']"),"color", "#000000");
	
	$("input[name='microColorBtn']").val("#FF00FF");
	
	f_setPreview($("button[name='microColorPreview']"),"color", "#FF00FF");
	f_setPreview($("button[name='microColorPreview']"),"border-color", "#FF00FF");
		
	$("input[name='gustColorBtn']").val("#790175");	
	
	f_setPreview($("button[name='gustColorPreview']"),"border-color", "#790175");
	
	$("input[name='crossWsAttn']").val(20);
	$("input[name='crossWsWarn']").val(30);
	$("input[name='crossWsDgr']").val(40);
}

function f_initSysSettingBtn(){

	//MBA 색 설정
	$("input[name='mbaColorBtn']").on("input change", (e) => {
		let selectedColor = $(e.target).val();
		let index = $("input[name='mbaColorBtn']").index(e.target);
		
		if(index == 0) {
			f_setPreview($("button[name='mbaBackColorPreview']"),"background-color", selectedColor);
			f_setPreview($("button[name='mbaFontColorPreview']"),"background-color", selectedColor);
		}else{
			f_setPreview($("button[name='mbaBackColorPreview']"),"color", selectedColor);
			f_setPreview($("button[name='mbaFontColorPreview']"),"color", selectedColor);
		}
	});
	
	//WSA 색 설정
	$("input[name='wsaColorBtn']").on("input change", (e) => {
		let selectedColor = $(e.target).val();
		let index = $("input[name='wsaColorBtn']").index(e.target);
		
		if(index == 0) {
			f_setPreview($("button[name='wsaBackColorPreview']"),"background-color", selectedColor);
			f_setPreview($("button[name='wsaFontColorPreview']"),"background-color", selectedColor);

		}else{
			f_setPreview($("button[name='wsaBackColorPreview']"),"color", selectedColor);
			f_setPreview($("button[name='wsaFontColorPreview']"),"color", selectedColor);

		}
	});
	
	//Microburst 색
	$("input[name='microColorBtn']").on("input change", (e) =>{
		let selectedColor = $(e.target).val();
		f_setPreview($("button[name='microColorPreview']"),"color", selectedColor);
		f_setPreview($("button[name='microColorPreview']"),"border-color", selectedColor);
	});
	
	//Gust Front 색  
	$("input[name='gustColorBtn']").on("input change", (e) => {
		let selectedColor = $(e.target).val();
		f_setPreview($("button[name='gustColorPreview']"),"border-color", selectedColor);
	});
	
	//초기화
	$("button[name='reset']").click((e) =>{
		if(window.confirm("설정 초기화를 하시겠습니까?")){
			f_resetSysSetting();	
		}
		
	});
	
	//적용
	$("#btnSysSettingApply").click((e) =>{
		f_sysSettingApply();
		f_topAdmLogout();
	});
	
}

function f_setPreview($target, css, color){
	$target.css(css,color);	
}


function f_sysSettingApply(){
	const sysSetting = f_getSysSettingData();
	
	fn_setJsonCookie("sysSetting", sysSetting, 7);
}