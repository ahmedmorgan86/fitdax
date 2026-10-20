export function authInput(v){if(!v||typeof v!=='object'||v.action!=='google'||Object.keys(v).some(k=>k!=='action'))throw Object.assign(Error('google_only'),{status:400});return {action:'google'}}
export function isGoogleUser(user){return !!user?.email_confirmed_at&&Array.isArray(user.identities)&&user.identities.some(i=>i.provider==='google')}
