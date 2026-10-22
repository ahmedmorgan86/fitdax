# Paymob — خطوات تفعيل FitDax

## ما تم تجهيزه
- ربط إنشاء Intention وصفحة Unified Checkout المصرية في وحدة خادمية؛ المبلغ من باقة قاعدة البيانات، وليس من المتصفح.
- مسارات إنشاء الطلب والتحقق من HMAC ومطابقة المبلغ والعملة وربط حساب المستخدم، وسجل طلبات وأحداث يمنع التفعيل المكرر.
- وضع Test للأدمن فقط لا يمنح اشتراكًا حقيقيًا؛ Live يحتاج موافقة مستقلة في إعدادات الخادم.
- حقول البطاقة لا تدخل التطبيق. الاسم وبريد Google المتحقق والهاتف هي بيانات الفاتورة اللازمة للبوابة. لم نرسل بيانات فعلية إلى Paymob أثناء التجهيز.
- طلبات الدفع مشفرة الروابط ومقيدة بالحساب. لا تُسجل بيانات البطاقة أو أسرار الربط في السجلات.
- الدفع بالبطاقة مغلق حتى إعداد الحساب والمفاتيح واختبار الرحلة كاملة. الاختبارات الحالية محاكاة وعمليات قاعدة بيانات تجريبية تراجعت بالكامل.

## خطواتك مع Paymob
1. افتح https://egypt.paymob.com/portal/en/register واختر خدمة التحصيل أونلاين في مصر.
2. اذكر النشاط بدقة: اشتراكات تطبيق لياقة وتدريب وتغذية رقمية، ورابط الموقع https://fitdax.vercel.app ورابط الباقات https://fitdax.vercel.app/#plans وبريد الدعم ahmed.morgan2009@gmail.com.
3. أكمل بيانات المالك والنشاط كما في مستنداتك. اسأل Paymob عن قبول هذا النشاط وشكلك القانوني قبل دفع رسوم أو تأسيس كيان. جهّز إثبات الهوية وبيانات النشاط وحساب التسوية، والسجل التجاري/المستند الضريبي إذا طلبوهما وفق حالتك. المتطلبات النهائية تحددها Paymob؛ لا تُرفع الهوية أو المستندات البنكية في المحادثة.
4. اطلب عرضًا مكتوبًا للعمولة، وأي رسوم تأسيس/شهرية، ومواعيد وحدود التسوية، والضرائب والرسوم، والاسترداد والنزاعات. لم نثبت سعر عمولة أو موعد قبول غير مؤكد.
5. راجع صفحات الهوية التجارية والخصوصية والشروط والاسترداد قبل تفعيل التحصيل بالبطاقة. وجود الكود ليس مراجعة قانونية أو موافقة من Paymob.
6. من لوحة حساب التاجر احصل على إعدادات الاختبار: Secret Key وPublic Key وHMAC Secret وCard Integration ID. القوائم قد تسمى Settings → API Keys وPayment Integrations أو Developers حسب حسابك.
7. ضع القيم في إعدادات Vercel الآمنة للمشروع، لا في المحادثة أو GitHub. استخدم أسماء .env.example: PAYMOB_ENABLED=true وPAYMOB_MODE=test والقيم الأربع، مع PAYMOB_LIVE_APPROVED=false. تحتاج وظيفة الإشعارات أيضًا PAYMOB_SUPABASE_SECRET_KEY خادميًا فقط، وهو مفتاح Supabase سري/خدمة؛ لا تستخدم مفتاح publishable ولا NEXT_PUBLIC_. أبقِ FITVERSE_DATA_KEY الحالي كما هو لحفظ إمكانية قراءة البيانات المشفرة. إعداد الخدمة لا يطلب كلمة مرور Google أو PIN أو OTP.
8. عناوين الربط المعدة: POST https://fitdax.vercel.app/api/paymob/callback للإشعار، وhttps://fitdax.vercel.app/fitverse/payments.html?provider=paymob للعودة. الإشعار يعيد 503 الآن عمدًا لعدم تهيئة الحساب؛ لا تختبر تحصيلًا حقيقيًا عليه قبل إكمال الإعداد.
9. اختبر بحساب الأدمن وبطاقات Test الرسمية: نجاح، رفض، 3DS، إلغاء/تعليق، تكرار الإشعار، تحديث الصفحة، وانتهاء الطلب. راقب حالة test_paid؛ لا يفعل الاختبار اشتراك Live. لا تعتمد على رسالة النجاح في رابط العودة.
10. بعد قبول Paymob لحساب Live واكتمال الاختبارات، استبدل مفاتيح Test ومُعرّف الربط بقيم Live، ثم اضبط PAYMOB_MODE=live وPAYMOB_LIVE_APPROVED=true وأعد النشر. نفّذ اختبار تحصيل محدودًا بواسطة صاحب البطاقة، وتحقق من التسوية والتفعيل مرة واحدة.

## ما يحتاج التأكد مع الحساب الحقيقي
توافق حقول الفاتورة وشكل الإشعارات مع حسابك، وتمرير توقيع HMAC الصحيح على معاملات فعلية، ومواعيد الاستلام، والنزاعات والاسترداد. لا تُطلق خصمًا متكررًا تلقائيًا؛ الربط الحالي شراء مدة اشتراك مرة واحدة. التجديد طلب دفع جديد. الاسترداد المالي يُجرى يدويًا من حساب التاجر مع مراجعة أثره على الاشتراك؛ لا يوجد API استرداد أموال أو إلغاء اشتراك تلقائي عند الاسترداد في هذه المرحلة. الإفادة بهوية مشترٍ واختباره على أجهزة Android فعلية لم تكتمل.

## المراجع الرسمية
https://developers.paymob.com/paymob-docs/intention-apis/create-intention
https://developers.paymob.com/paymob-docs/integration-paths/apis
https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac
https://wizard.paymob.com/

هذه خطوات تشغيل، وليست ضمان قبول تاجر أو شهادة امتثال أو اعتمادًا طبيًا أو قانونيًا.

## Verification notes — 23 October
The synthetic SQL checks in supabase/paymob-check.sql pass canonical pricing, owner isolation, untrusted-role write denial, repeated event/order handling, test/live separation and a refund-review flag preceding an old success callback. No synthetic records remain. Unit checks cover request formatting, disabled configuration, HMAC tampering and mismatched amounts/currency/order. No actual Paymob account, key, checkout or transaction was used. Full browser/3DS/bank settlement testing remains pending merchant setup. Local Next compilation succeeded, but page-data worker creation was blocked by sandbox spawn EPERM; deployed endpoints are checked separately.

Security advisor notes: public offer reading through a narrowly projected SECURITY DEFINER function is intentional; it exposes prices and descriptions, not destinations or account data. Card order creation requires an authenticated owner and has explicit anonymous EXECUTE revocation. Binding, fulfillment and review RPCs are service-role only. The events table has default-deny RLS with no end-user policy because it is server-only. Existing leaked-password warning remains unrelated to the Google-only sign-in flow.
