const resistance='https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/';
const aerobic='https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/';
const mind='https://www.nhs.uk/live-well/exercise/pilates-and-yoga/';
export const trainingMethods=[
 ['full-body','الجسم بالكامل','Full body','توزيع العضلات الرئيسية في الجلسة، مع يوم راحة بين جلسات الجسم بالكامل.','Train major muscle groups in one session, with a rest day between full-body sessions.'],
 ['upper-lower','علوي / سفلي','Upper / lower','تبادل جلسات الجزء العلوي والسفلي لتوزيع الجهد الأسبوعي.','Alternate upper and lower sessions to distribute weekly work.'],
 ['ppl','دفع / سحب / أرجل','Push / pull / legs','تجميع الحركات حسب الدفع والسحب والأرجل. تكرار الأيام يعتمد على الخبرة والتعافي.','Group pushing, pulling and leg movements. Frequency depends on experience and recovery.'],
 ['progressive','التدرج في التدريب','Progressive overload','زد عاملًا واحدًا تدريجيًا بعد إتقان الحركة: التكرارات أو الحمل أو المجموعات.','Progress one variable gradually after mastering technique: reps, load or sets.'],
 ['linear','التدرج الخطي','Linear progression','زيادات صغيرة مخططة مع مراجعة الأداء؛ لا تزِد الحمل تلقائيًا كل جلسة.','Plan small increases and review performance; do not automatically add weight every session.'],
 ['undulating','التدرج المتغير','Undulating periodization','تغيير التركيز بين حجم التدريب والشدة خلال الأسبوع؛ يحتاج ضبطًا حسب التعافي.','Vary volume and intensity emphasis across the week, adjusted to recovery.'],
 ['five','خمس مجموعات × خمس تكرارات','5 × 5','بنية مجموعات وتكرارات للقوة، وليست علامة تجارية أو شرطًا للتقدم. مناسبة لمن لديه خبرة وإشراف.','A strength set-and-rep structure, not a branded plan or a requirement for progress. Requires experience and coaching.'],
 ['superset','مجموعات مزدوجة','Supersets','أداء تمرينين بالتتابع ثم الراحة. تجنب جمع حركات صعبة قبل إتقانها.','Perform two exercises in sequence, then rest. Avoid pairing difficult movements before mastering them.'],
 ['circuit','التدريب الدائري','Circuit training','التنقل بين عدة محطات مع راحة كافية للحفاظ على جودة الحركة.','Move through several stations with enough rest to preserve technique.'],
 ['dropset','خفض الحمل المتتابع','Drop sets','خفض الحمل بعد مجموعة لإطالة الجهد. أسلوب متقدم اختياري يزيد التعب.','Reduce the load after a set to extend effort. An optional advanced technique that adds fatigue.'],
 ['rest-pause','الراحة القصيرة داخل المجموعة','Rest-pause','تقسيم الجهد بفواصل قصيرة؛ أسلوب متقدم ولا يستلزم الوصول للفشل.','Break effort into short-rest segments; an advanced method that does not require failure.'],
 ['tempo','سرعة الحركة المتحكم فيها','Controlled tempo','راقب مرحلة الرفع والخفض دون اندفاع. البطء الشديد ليس شرطًا للنمو.','Control lifting and lowering without jerking. Extremely slow reps are not essential for growth.'],
 ['isometric','الثبات العضلي','Isometrics','شد العضلة دون حركة ظاهرة، مع تنفس طبيعي وتجنب حبس النفس.','Contract without visible movement, breathing normally without holding your breath.'],
 ['eccentric','التركيز على الخفض','Eccentric emphasis','إطالة مرحلة خفض الوزن بحمل يمكن التحكم فيه. تجنب أحمال فوق القدرة دون إشراف.','Emphasize controlled lowering. Avoid loads beyond your capacity without supervision.'],
 ['bodyweight','تمارين وزن الجسم','Calisthenics','تعديل الرافعة أو المدى أو الدعم لتغيير صعوبة حركات وزن الجسم.','Adjust leverage, range or support to scale bodyweight movements.'],
 ['bands','المقاومة المطاطية','Resistance bands','اختر مطاطًا سليمًا وثبّته بأمان، ثم تحرك بمدى مريح.','Inspect bands, secure their anchor and work through a comfortable range.'],
 ['power','القوة الانفجارية','Power training','حركات سريعة مقصودة بعد تعلم الأساسيات، بحمل ومدى يحدده مدرب مؤهل.','Intentional fast movements after learning fundamentals, with load and range set by a qualified coach.'],
 ['plyometric','القفز والارتداد','Plyometrics','تدريب الهبوط والقفز تدريجيًا؛ يحتاج قدرة وتحكمًا وتقييمًا عند الألم أو الإصابة.','Progress landing and jumping skills gradually; requires control and assessment for pain or injury.'],
 ['steady','كارديو ثابت الشدة','Steady cardio','مجهود مستمر بوتيرة مناسبة؛ اختبار الكلام يساعد على تقدير الشدة المتوسطة.','Sustained activity at a suitable pace; the talk test can help estimate moderate intensity.',aerobic],
 ['interval','فترات الكارديو','Cardio intervals','تبادل فترات نشاط وراحة أو مجهود أخف. ابدأ بفترات معتدلة قبل الشدة العالية.','Alternate activity with rest or easier effort. Start moderately before high intensity.',aerobic],
 ['hiit','فترات عالية الشدة','HIIT','فترات مجهود مرتفع تتخللها راحة. ليست البداية المناسبة للجميع ولا بديلًا عن التدرج.','High-effort intervals separated by recovery. Not a universal starting point or a substitute for progression.',aerobic],
 ['tabata','تاباتا','Tabata','بروتوكول بحثي قصير شديد الجهد؛ ليس كل مؤقت 20/10 مكافئًا للدراسة الأصلية. لا يُفعّل كخطة مبتدئ.','A short, demanding research protocol; not every 20/10 timer reproduces the original study. Not offered as a beginner prescription.','https://pubmed.ncbi.nlm.nih.gov/9139179/'],
 ['yoga','يوجا','Yoga','تدريب الحركة والتوازن والتحكم بالتنفس، ضمن مدى مريح دون إجبار المفاصل.','Practise movement, balance and breathing within a comfortable range without forcing joints.',mind],
 ['pilates','بيلاتس','Pilates','حركات متحكم فيها تركز على الثبات والوعي بالجسم، مع تدرج يناسب القدرة.','Controlled movement focused on stability and body awareness, scaled to ability.',mind]
].map(([id,ar,en,arBody,enBody,source=resistance])=>({id,ar,en,arBody,enBody,source}));
