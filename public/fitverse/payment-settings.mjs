// Editable only through the authenticated admin catalog endpoint.
export function normalizeWallet(value){return String(value??'').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[\s()-]/g,'').replace(/^(\+20|0020)/,'0')}
export const paymentErrors={invalid_wallet:'رقم المحفظة غير صحيح. استخدم رقمًا مصريًا مثل 01012345678 أو +201012345678.',invalid_instapay:'عنوان InstaPay يجب أن يكون مثل name@instapay. لا تكتب رقم المحفظة في خانة العنوان.',recipient_required:'أدخل اسم المستفيد كما يظهر في التحويل قبل تفعيل وسيلة الدفع.',payment_address_required:'أدخل عنوان وسيلة الدفع التي تريد تفعيلها.',invalid_payment_settings:'راجع إعدادات الدفع واسم المستفيد.',revision_conflict:'تغيّرت الإعدادات من جلسة أخرى. أعد تحميل الصفحة ثم حاول الحفظ.',authentication_required:'انتهت الجلسة. سجّل الدخول مرة أخرى.',admin_required:'حفظ إعدادات التحصيل متاح للأدمن فقط.'};
export function validatePayments(v){
 if(!v||typeof v.walletEnabled!=='boolean'||typeof v.instapayEnabled!=='boolean'||typeof v.recipientName!=='string'||v.recipientName.length>100||/[<>\u0000-\u001f]/.test(v.recipientName))throw Error('invalid_payment_settings');
 const walletNumber=normalizeWallet(v.walletNumber);
 const instapayAddress=String(v.instapayAddress??'').trim();
 if(walletNumber&&!/^01[0125]\d{8}$/.test(walletNumber))throw Error('invalid_wallet');
 if(instapayAddress&&!/^[a-zA-Z0-9._-]{1,80}@instapay$/.test(instapayAddress))throw Error('invalid_instapay');
 if((v.walletEnabled||v.instapayEnabled)&&!v.recipientName.trim())throw Error('recipient_required');
 if(v.walletEnabled&&!walletNumber||v.instapayEnabled&&!instapayAddress)throw Error('payment_address_required');
 return {walletNumber,instapayAddress,recipientName:v.recipientName.trim(),walletEnabled:v.walletEnabled,instapayEnabled:v.instapayEnabled};
}
