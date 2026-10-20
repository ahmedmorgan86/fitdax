// Editable only through the authenticated admin catalog endpoint.
export function defaultPayments(){return {walletNumber:'01097905455',recipientName:'',instapayAddress:'',walletEnabled:false,instapayEnabled:false}}
export function validatePayments(v){
 if(!v||typeof v.walletEnabled!=='boolean'||typeof v.instapayEnabled!=='boolean'||typeof v.recipientName!=='string'||v.recipientName.length>100||/[<>\u0000-\u001f]/.test(v.recipientName))throw Error('invalid_payment_settings');
 const walletNumber=String(v.walletNumber??'').replace(/^\+20/,'0').replace(/\s/g,'');
 const instapayAddress=String(v.instapayAddress??'').trim();
 if(walletNumber&&!/^01[0125]\d{8}$/.test(walletNumber))throw Error('invalid_wallet');
 if(instapayAddress&&!/^[a-zA-Z0-9._-]{1,80}@instapay$/.test(instapayAddress))throw Error('invalid_instapay');
 if((v.walletEnabled||v.instapayEnabled)&&!v.recipientName.trim())throw Error('recipient_required');
 if(v.walletEnabled&&!walletNumber||v.instapayEnabled&&!instapayAddress)throw Error('payment_address_required');
 return {walletNumber,instapayAddress,recipientName:v.recipientName.trim(),walletEnabled:v.walletEnabled,instapayEnabled:v.instapayEnabled};
}
