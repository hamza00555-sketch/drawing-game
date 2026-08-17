import { GameButton, type ButtonSize, type ButtonTone } from '../design/components/GameButton';

/**
 * Dev-only review page for the button asset system (ASSET_MANIFEST.md
 * Batch 13). One place to see every tone, size, and state at once before
 * they ship across the app — reachable at `?preview=buttons`.
 */

const TONES: ButtonTone[] = ['primary', 'secondary', 'accent', 'danger'];
const SIZES: ButtonSize[] = ['lg', 'md', 'sm'];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-body text-sm text-ink-soft">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border-thin border-ink-hairline p-4">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function ButtonStyleSheet() {
  return (
    <main className="wt-screen wt-paper-ground flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Button Style Sheet</h1>

      <Section title="الأنواع — Default">
        <Row label="بالحجم الكبير lg">
          {TONES.map((tone) => (
            <GameButton key={tone} tone={tone} size="lg">
              {tone}
            </GameButton>
          ))}
        </Row>
      </Section>

      <Section title="الأحجام — كل نوع بثلاث أحجام">
        {TONES.map((tone) => (
          <Row key={tone} label={tone}>
            {SIZES.map((size) => (
              <GameButton key={size} tone={tone} size={size}>
                {size}
              </GameButton>
            ))}
          </Row>
        ))}
      </Section>

      <Section title="Disabled">
        <Row label="كل نوع، معطّل">
          {TONES.map((tone) => (
            <GameButton key={tone} tone={tone} size="md" disabled>
              {tone}
            </GameButton>
          ))}
        </Row>
      </Section>

      <Section title="Block (full width)">
        <GameButton tone="primary" size="lg" block>
          زر بعرض كامل
        </GameButton>
      </Section>

      <Section title="Drawing tool buttons — selected / unselected">
        <p className="font-body text-xs text-ink-faint">
          نفس ثنائية wt-btn-secondary / wt-btn-ink المستخدمة في أدوات الرسم والرقاقات
          المختارة.
        </p>
        <Row label="غير محدد ↔ محدد">
          <button type="button" className="min-h-tap wt-btn-sm wt-btn-secondary px-4 text-ink">
            قلم
          </button>
          <button type="button" className="min-h-tap wt-btn-sm wt-btn-ink px-4 text-paper">
            قلم
          </button>
        </Row>
      </Section>

      <Section title="Small chips">
        <Row label="غير مختار ↔ مختار">
          <span className="min-h-tap rounded-pill border-thin border-ink-hairline px-3 py-2 font-body text-sm text-ink-soft">
            الأساسي
          </span>
          <span className="min-h-tap rounded-pill wt-chip-ink px-3 py-2 font-body text-sm text-paper">
            بالثوب
          </span>
        </Row>
      </Section>

      <p className="font-body text-xs text-ink-faint">
        Press: امسك الماوس على أي زر (active) — إزاحة وظل مضغوط + تعتيم خفيف على نفس
        الرسمة. لا صورة منفصلة للضغط.
      </p>
    </main>
  );
}
