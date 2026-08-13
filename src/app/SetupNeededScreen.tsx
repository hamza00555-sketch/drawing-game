/**
 * Shown when Firebase config is absent.
 *
 * This is a developer-facing screen, not part of the game's world, so it is
 * deliberately plain — it must never be mistaken for وش ذا؟ art direction.
 * It exists so the app runs and self-describes instead of throwing a blank
 * white page at whoever cloned the repo.
 */

const STEPS: readonly { title: string; body: string }[] = [
  {
    title: 'أنشئ مشروع Firebase',
    body: 'من console.firebase.google.com — أنشئ مشروعًا جديدًا ثم أضف تطبيق ويب.',
  },
  {
    title: 'فعّل Anonymous Authentication',
    body: 'Authentication ← Sign-in method ← Anonymous ← Enable. اللعبة لا تطلب تسجيل حساب من اللاعبين.',
  },
  {
    title: 'أنشئ Realtime Database',
    body: 'Realtime Database ← Create database. اختر المنطقة الأقرب للاعبين (europe-west1 أو asia-southeast1 للخليج).',
  },
  {
    title: 'عبّئ ملف .env.local',
    body: 'انسخ .env.example إلى .env.local وضع فيه قيم إعدادات تطبيق الويب.',
  },
  {
    title: 'انشر قواعد الأمان',
    body: 'firebase deploy --only database — بدونها ستكون قاعدة البيانات مفتوحة أو مغلقة بالكامل.',
  },
];

export function SetupNeededScreen() {
  return (
    <main className="wt-screen wt-paper-ground">
      <div className="mx-auto w-full max-w-content">
        <p className="font-body text-sm text-ink-faint">إعداد المشروع</p>
        <h1 className="mt-2 font-display text-2xl text-ink">
          ينقص ربط Firebase
        </h1>
        <p className="mt-3 font-body text-base text-ink-soft">
          الكود جاهز بالكامل، لكن لا توجد إعدادات اتصال. اتبع الخطوات التالية ثم أعد تشغيل الخادم.
        </p>

        <ol className="mt-6 flex list-none flex-col gap-4 p-0">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-md border-thin border-ink-hairline bg-paper-raised p-4"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-lg text-ink-faint">{index + 1}</span>
                <div>
                  <h2 className="font-display text-base text-ink">{step.title}</h2>
                  <p className="mt-1 font-body text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-6 font-body text-sm text-ink-faint">
          للتطوير بدون مشروع سحابي: شغّل <code>npm run emulators</code> واضبط{' '}
          <code>VITE_USE_FIREBASE_EMULATORS=true</code>.
        </p>
      </div>
    </main>
  );
}
