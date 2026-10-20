export function authInput(v){
 const fail=code=>{throw Object.assign(Error(code),{status:400})};
 if(!v||typeof v!=='object'||!['login','signup','google','reset','update-password'].includes(v.action))fail('invalid_action');
 if(v.action==='google')return {action:v.action};
 if(v.action==='update-password'){if(typeof v.password!=='string'||v.password.length<10||v.password.length>128)fail('weak_password');return {action:v.action,password:v.password}}
 if(typeof v.email!=='string'||v.email.length>254||!/^\S+@\S+\.\S+$/.test(v.email.trim()))fail('invalid_email');
 const out={action:v.action,email:v.email.trim()};
 if(v.action!=='reset'){if(typeof v.password!=='string'||v.password.length<(v.action==='signup'?10:1)||v.password.length>128)fail(v.action==='signup'?'weak_password':'invalid_credentials');out.password=v.password;}
 if(v.action==='signup'&&v.acceptedTerms!==true)fail('terms_required');
 return out;
}
export function authFailure(error){if(error?.code==='over_email_send_rate_limit')return {error:'email_rate_limited',status:429};if(error?.status===429||error?.code==='over_request_rate_limit')return {error:'auth_rate_limited',status:429};if(error?.code==='email_not_confirmed')return {error:'email_not_confirmed',status:403};if(['weak_password','same_password'].includes(error?.code))return {error:'weak_password',status:400};return {error:'invalid_credentials',status:400}}
