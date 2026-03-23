async function f_chekTopAdmin(){
	const isTopAdm = await f_isTopAdm();
	if(!isTopAdm){
		return false;
	}
	
	return true;
}

function f_isTopAdm(){
	return new Promise((resolve, reject) => {
		$.ajax({
			url: "/mngr/isTopAdm.a",
			success: ( isTopAdm ) => {
				if(!isTopAdm){
					$("#popTopAdmPwd").addClass("is_active");
					$("#topAdmPwd").val("");
					resolve(false);
				}else{
					resolve(true);
				}
			},
			error: () => {
				reject(new Error("로그인 확인 실패!"));
			}
		});
		
	});
}

function f_isLogin(){
	return new Promise((resolve, reject) => {
		$.ajax({
			url: "/mngr/isTopAdm.a",
			success: ( isTopAdm ) => {
				if(!isTopAdm){
					resolve(false);
				}else{
					resolve(true);
				}
			},
			error: () => {
				reject(new Error("로그인 확인 실패!"));
			}
		});
		
	});
}

function f_topAdmLogout(){
	$.ajax({
		url: "/mngr/topAdmLogout.a",
		type:"post",
		success:( isLogin ) =>{	
			const prevUrl = document.referrer;
			window.location = prevUrl;
		},
		error: () => {
			
		}
	});
}


/**
 * 비밀번호 변경
 */
function f_topAdmPwdChg(){
	const curPwd = $("#chgTopAdmPwd").val();
	const newPwd = $("#chgTopAdmPwdNew").val();
	
	$.ajax({
		url: "/mngr/topAdmPwdChg.a",
		type:"post",
		data: {pwd: curPwd, newPwd: newPwd},
		success: ( success ) => {
			$("#chgTopAdmPwd").val("");
			$("#chgTopAdmPwdNew").val("");
			$("#chgTopAdmPwdNewRe").val("");
			$("#popTopAdmPwdChg").removeClass("is_active");
		},
		error: () => {
			reject(new Error("패스워드 체크 실패!"));
		}
	});
	
}


function f_topAdmLogin(){
	const pwd = $("#topAdmPwd").val();
	
	$.ajax({
		url: "/mngr/topAdmLogin.a",
		type:"post",
		data:{ pwd : pwd},
		success:( isLogin ) =>{
			if(!isLogin) toastr["error"]('로그인에 실패 하였습니다.');
			else $("#popTopAdmPwd").removeClass("is_active");
		},
		error: () => {
			
		}
	});
}




function f_topAdmPwdChgValid(){
	const curPwd = $("#chgTopAdmPwd").val();
	const newPwd = $("#chgTopAdmPwdNew").val();
	const newRePwd = $("#chgTopAdmPwdNewRe").val();
	
	// 유효성 검사
    if (!curPwd) {
        toastr["warning"]("현재 비밀번호를 입력해 주세요.");
        return false;
    }
    if (!newPwd) {
        toastr["warning"]("신규 비밀번호를 입력해 주세요.");
        return false;
    }
    if (!newRePwd) {
        toastr["warning"]("신규 비밀번호 확인을 입력해 주세요.");
        return false;
    }
    if (newPwd !== newRePwd) {
        toastr["warning"]("신규 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        return false;
    }

    // 모든 검사 통과
    return true;
}



function f_isCurTopAdmPwd(){
	return new Promise((resolve, reject) => {
		const curPwd = $("#chgTopAdmPwd").val();
		$.ajax({
			url: "/mngr/isTopAdmChk.a",
			type:"post",
			data: {pwd: curPwd},
			success: ( success ) => {
				resolve(success);
			},
			error: () => {
				reject(new Error("패스워드 체크 실패!"));
			}
		});
	});
}

