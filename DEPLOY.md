# نشر «وش ذا؟»

الواجهة على **Vercel**، والباك-إند على **Firebase**. الاثنان منفصلان ويمكن نشر
كل واحد بمفرده.

---

## متى نحتاج Firebase بالضبط؟

هذا سؤال مهم لأن الإجابة تحدد ترتيب العمل.

| ما تريد فعله | يحتاج Firebase؟ |
|---|---|
| بناء الشاشات ومراجعتها | **لا** — معرض المعاينة `?preview=` يعمل ببيانات ثابتة |
| تجربة الرسم والممحاة والتراجع والـReplay | **لا** — يعمل محليًا بالكامل |
| تشغيل الاختبارات (117 اختبارًا) | **لا** |
| بناء المزيد من المودات | **لا** |
| **إنشاء غرفة والانضمام بكود** | **نعم** |
| **لعب جولة حقيقية مع أشخاص** | **نعم** |
| **اختبار الأدوار السرية فعليًا** | **نعم** |
| **اختبار الانقطاع وانتقال الاستضافة** | **نعم** |
| **نشر نسخة على Vercel تعمل** | **نعم** |

**الخلاصة:** كل ما بُني حتى الآن قابل للتحقق بدون Firebase، ولا يزال بإمكاني بناء
بقية المودات بدونه. لكن **أول لحظة تريد فيها أن تلعب اللعبة مع أحد — أو أن ترى
رابطًا يعمل — تحتاج Firebase.**

بدون إعدادات، التطبيق يبني وينشر بنجاح لكنه يعرض شاشة الإعداد بدل اللعبة.

---

## 1. Firebase

### إنشاء المشروع

1. من [console.firebase.google.com](https://console.firebase.google.com) أنشئ مشروعًا.
2. **Authentication ← Sign-in method ← Anonymous ← Enable.**
   اللعبة لا تطلب حسابًا من اللاعبين، لكن كل قاعدة أمان تعتمد على `auth.uid`،
   فبدون هذه الخطوة لا شيء يعمل.
3. **Realtime Database ← Create database.**
   اختر المنطقة الأقرب للاعبين — `europe-west1` هي الأقل تأخيرًا للخليج عادةً.
   ابدأ بوضع **locked mode**؛ القواعد ستُنشر في الخطوة التالية.
4. **Project settings ← Your apps ← Web app** واحفظ قيم الإعداد.

### نشر القواعد

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # اختر مشروعك
firebase deploy --only database
```

القواعد في `firebase/database.rules.json`. **لا تشغّل اللعبة بدونها** — هي التي
تمنع لاعبًا من قراءة كلمة لا تخصه أو تعديل نقاطه.

### نشر Cloud Functions

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

الـFunctions تحتاج خطة **Blaze** (الدفع حسب الاستخدام). الاستخدام هنا ضئيل جدًا
ويقع ضمن الحصة المجانية عمليًا، لكن Firebase يشترط تفعيل الخطة.

---

## 2. Vercel

### الربط

1. اربط المستودع من [vercel.com/new](https://vercel.com/new).
2. الإعدادات تُقرأ من `vercel.json` تلقائيًا — لا تحتاج تغيير شيء.

### متغيرات البيئة

أضف هذه في **Project Settings ← Environment Variables** لبيئات
Production و Preview و Development:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

القيم من `Project settings ← Your apps` في Firebase.

**ملاحظة أمنية:** هذه القيم ليست أسرارًا. إعداد Firebase للويب عام بطبيعته
ويظهر في أي bundle. ما يحمي اللعبة هو `database.rules.json` لا إخفاء المفاتيح.
لا تضع أبدًا مفتاح service account هنا — مكانه Cloud Functions فقط.

### النطاقات المصرّح لها

بعد أول نشر، أضف نطاق Vercel في:
**Firebase Console ← Authentication ← Settings ← Authorized domains**

بدون هذه الخطوة سيفشل تسجيل الدخول المجهول على النطاق المنشور، وسيقف التطبيق
عند شاشة التحميل.

---

## 3. التطوير محليًا بدون مشروع سحابي

يمكن تشغيل كل شيء على المحاكي:

```bash
npm run emulators                       # Auth + Realtime Database
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

مفيد للتطوير، لكنه لا يغني عن اختبار حقيقي على أجهزة مختلفة — مزامنة الوقت
والانقطاع لا تظهر مشاكلهما إلا على شبكة حقيقية.

---

## 4. قائمة تحقق قبل أول اختبار حقيقي

- [ ] Anonymous Auth مفعّل
- [ ] Realtime Database منشأة
- [ ] `firebase deploy --only database` نُفّذ
- [ ] `firebase deploy --only functions` نُفّذ
- [ ] متغيرات البيئة مضافة في Vercel للبيئات الثلاث
- [ ] نطاق Vercel مضاف في Authorized domains
- [ ] افتح الرابط على جوالين مختلفين وأنشئ غرفة وانضم بالكود
