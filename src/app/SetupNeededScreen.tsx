import { missingFirebaseKeys } from '../engine/firebase';

/**
 * Shown when Firebase config is absent.
 *
 * A developer-facing screen, not part of the game's world, so it is
 * deliberately plain — it must never be mistaken for وش ذا؟ art direction.
 *
 * It leads with the emulator, because that is the shortest honest answer to
 * "how do I run this": no Firebase project, no billing plan, no account, and
 * every mode playable. Sending someone to the Firebase console first — as this
 * screen used to — is a twenty-minute detour around a one-line fix.
 *
 * It also names the variables it actually found missing. "Configuration is
 * missing" starts a hunt; "VITE_FIREBASE_DATABASE_URL is empty" ends one, and
 * tells apart a `.env.local` that does not exist from one with a typo in it.
 */

const CLOUD_STEPS: readonly { title: string; body: string }[] = [
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
    body: 'Realtime Database ← Create database. اختر المنطقة الأقرب للاعبين (europe-west1 للخليج).',
  },
  {
    // The filename lives in the body, inside <code>. In a heading it is bare
    // text, and bidi drags its leading dot to the far end: `env.local.`
    title: 'عبّئ ملف الإعدادات',
    body: 'انسخ .env.example إلى .env.local وضع فيه قيم إعدادات تطبيق الويب.',
  },
  {
    title: 'انشر قواعد الأمان',
    body: 'firebase deploy --only database — بدونها ستكون قاعدة البيانات مقفلة بالكامل.',
  },
];

function Command({ children }: { children: string }) {
  return (
    <code dir="ltr" className="block font-body text-sm text-ink">
      {children}
    </code>
  );
}

export function SetupNeededScreen() {
  const missing = missingFirebaseKeys();

  return (
    <main className="wt-screen wt-paper-ground">
      <div className="mx-auto w-full max-w-content">
        <p className="font-body text-sm text-ink-faint">إعداد المشروع</p>
        <h1 className="mt-2 font-display text-2xl text-ink">ينقص ربط Firebase</h1>
        <p className="mt-3 font-body text-base text-ink-soft">
          الكود جاهز بالكامل، لكن لا توجد إعدادات اتصال في <code>.env.local</code>.
        </p>

        {/* The fast path, first and unmissable. */}
        <section className="mt-6 rounded-md border-bold border-ink bg-paper-raised p-4">
          <h2 className="font-display text-lg text-ink">شغّلها محليًا — بلا مشروع ولا بطاقة</h2>
          <p className="mt-1 font-body text-sm text-ink-soft">
            المحاكي يشغّل Auth والقاعدة والـFunctions على جهازك، وكل المودات تعمل.
            يحتاج Java فقط.
          </p>

          <div className="mt-3 flex flex-col gap-1 rounded-md border-thin border-ink-hairline bg-paper p-3">
            <Command>npm install &amp;&amp; npm --prefix functions install</Command>
            <Command>cp .env.emulator .env.local</Command>
            <Command>npm run build:functions</Command>
            <Command>npm run emulators # طرفية أولى</Command>
            <Command>npm run dev # طرفية ثانية</Command>
          </div>

          <p className="mt-3 font-body text-sm text-tomato-deep">
            بعد إنشاء <code>.env.local</code> أعد تشغيل <code>npm run dev</code>.
            Vite يقرأ المتغيرات عند الإقلاع فقط، فالملف الجديد لا يظهر أثره في خادم شغّال.
          </p>
        </section>

        {/* What the app actually looked for, so a typo is visible. */}
        <section className="mt-5">
          <h2 className="font-display text-base text-ink">المتغيرات الناقصة</h2>
          <ul className="mt-2 flex list-none flex-col gap-1 p-0">
            {missing.map((key) => (
              <li key={key} dir="ltr" className="font-body text-sm text-ink-soft">
                {key}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-base text-ink">
            أو اربطه بمشروع سحابي — للنشر ولعب أصدقائك من جوالاتهم
          </h2>

          <ol className="mt-3 flex list-none flex-col gap-3 p-0">
            {CLOUD_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-md border-thin border-ink-hairline bg-paper-raised p-3"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-ink-faint">{index + 1}</span>
                  <div>
                    <h3 className="font-display text-base text-ink">{step.title}</h3>
                    <p className="mt-1 font-body text-sm leading-relaxed text-ink-soft">
                      {step.body}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-6 font-body text-sm text-ink-faint">
          التفاصيل كاملة في DEPLOY.md.
        </p>
      </div>
    </main>
  );
}
