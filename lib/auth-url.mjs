export const productionOrigin='https://fitdax.vercel.app';
// Authentication cookies and the PKCE verifier must stay on the same origin.
export function authOrigin(requestUrl,environment=process.env.NODE_ENV){return environment==='production'?productionOrigin:new URL(requestUrl).origin}
