'use client';

import { useRouter } from 'next/navigation';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import TopBar from '@/components/lobby/TopBar';
import { useSoundStore } from '@/store/soundStore';
import { useSettingsStore, type Lang, type ThemeAccent } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';

interface SegOption<T extends string> {
  v: T;
  label: string;
  dot?: boolean;
  c?: string;
}

export default function SettingsPage() {
  const router = useRouter();

  const soundEnabled = useSoundStore((s) => s.enabled);
  const toggleSound = useSoundStore((s) => s.toggle);

  const lang = useSettingsStore((s) => s.lang);
  const setLang = useSettingsStore((s) => s.setLang);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const haptics = useSettingsStore((s) => s.haptics);
  const setHaptics = useSettingsStore((s) => s.setHaptics);

  const auth = useAuthStore();
  const player = useGameStore((s) => s.player);

  const onWipe = () => {
    if (typeof window === 'undefined') return;
    const ok = window.confirm('ลบ save ทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้');
    if (!ok) return;
    // Persist keys used across the app — keep this list in sync with
    // each new persisted store added (gameStore, authStore, etc.).
    const KEYS = [
      'coin-hunter-cyber-bangkok',
      'coin-hunter-auth',
      'coin-hunter-settings',
      'coin-hunter-sound',
    ];
    for (const k of KEYS) {
      try { window.localStorage.removeItem(k); } catch { /* noop */ }
    }
    toast.warn('▸ SAVE_WIPED // FRESH_START');
    // Hard reload so all stores re-initialise from defaults.
    setTimeout(() => window.location.reload(), 600);
  };

  const langOpts: SegOption<Lang>[] = [
    { v: 'TH', label: 'ไทย' },
    { v: 'EN', label: 'ENG' },
  ];
  const themeOpts: SegOption<ThemeAccent>[] = [
    { v: 'cyan',   label: '', dot: true, c: '#22D3EE' },
    { v: 'violet', label: '', dot: true, c: '#A78BFA' },
    { v: 'gold',   label: '', dot: true, c: '#FBBF24' },
    { v: 'green',  label: '', dot: true, c: '#4ade80' },
  ];

  return (
    <main className="cyber-screen min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="violet" />
      <Particles count={5} />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-9 py-5 sm:py-7">
        <TopBar />

        <div className="mb-5">
          <div className="dl mb-1">// SYSTEM // PREFERENCES</div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] tracking-cyber text-white">
            SETTINGS
          </h1>
        </div>

        <div className="max-w-[720px]">
          {/* PREFERENCES */}
          <div className="hud px-6 py-2">
            <Row label="SOUND_FX" sub="เสียงปักหมุด, ล็อกเป้า, ชนะ">
              <Toggle on={soundEnabled} onClick={toggleSound} />
            </Row>
            <Row label="LANGUAGE" sub="ภาษาที่แสดงในเกม">
              <Seg value={lang} options={langOpts} onChange={(v) => {
                setLang(v);
                toast.info(`▸ LANG // ${v}`);
              }} />
            </Row>
            <Row label="THEME_ACCENT" sub="สีหลักของ HUD">
              <Seg value={theme} options={themeOpts} onChange={(v) => {
                setTheme(v);
                toast.info(`▸ THEME // ${v.toUpperCase()}`);
              }} />
            </Row>
            <Row label="HAPTICS" sub="สั่นเมื่อกดปุ่มสำคัญ (มือถือ)">
              <Toggle on={haptics} onClick={() => setHaptics(!haptics)} />
            </Row>
          </div>

          {/* ACCOUNT / DATA */}
          <div className="hud px-6 py-2 mt-4">
            <Row
              label="SAVE_DATA"
              sub={
                auth.guest
                  ? 'guest — ยังไม่ได้สมัคร'
                  : `${player.nickname} · LV ${player.level} · ${player.credits.toLocaleString()} CR`
              }
            >
              <Pill variant={auth.guest ? 'red' : 'green'}>
                {auth.guest ? 'NOT_SAVED' : 'PERSISTED'}
              </Pill>
            </Row>
            {auth.guest ? (
              <Row label="JOIN_GRID" sub="สร้างบัญชีเพื่อบันทึก save บน server">
                <Button onClick={() => router.push('/onboarding')} className="!px-4 !py-2.5 !text-[11px]">
                  ▸ SIGN_UP
                </Button>
              </Row>
            ) : (
              <Row label="SIGN_OUT" sub="ออกจากระบบ — ข้อมูล save จะถูกเก็บไว้">
                <Button
                  variant="ghost"
                  onClick={() => {
                    auth.signOut();
                    toast.info('▸ SESSION_ENDED');
                    router.push('/login');
                  }}
                  className="!px-4 !py-2.5 !text-[11px]"
                >
                  ▸ LOGOUT
                </Button>
              </Row>
            )}
            <Row label="RESET_PROGRESS" sub="ลบ save ทั้งหมด เริ่มใหม่จากศูนย์">
              <Button variant="red" onClick={onWipe} className="!px-4 !py-2.5 !text-[11px]">
                ▸ WIPE
              </Button>
            </Row>
          </div>

          <div className="mt-4 font-mono text-[10px] text-white/40 tracking-widest2 text-center">
            ▸ SETTINGS + PROGRESS เก็บใน localStorage · sync เมื่อต่อ network
          </div>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────
function Row({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 py-4 border-b border-dashed border-white/10 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-[12px] sm:text-[13px] text-white tracking-cyber">
          {label}
        </div>
        {sub && <div className="font-sans text-[11px] sm:text-[12px] text-white/55 mt-0.5 truncate">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-14 h-7 cursor-pointer transition-all shrink-0"
      style={{
        background: on ? 'linear-gradient(135deg, #22D3EE, #A78BFA)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${on ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.2)'}`,
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        boxShadow: on ? '0 0 14px rgba(34,211,238,0.4)' : 'none',
      }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 w-5 h-5 transition-all"
        style={{
          left: on ? 30 : 3,
          background: on ? '#0a0612' : 'rgba(255,255,255,0.6)',
          clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
        }}
      />
    </button>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 shrink-0">
      {options.map((o) => {
        const active = o.v === value;
        const c = o.c ?? '#22D3EE';
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className="px-3.5 py-2 cursor-pointer font-display font-bold text-[11px] tracking-cyber flex items-center gap-1.5"
            style={{
              background: active ? `${c}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? c : 'rgba(255,255,255,0.12)'}`,
              color: active ? c : 'rgba(255,255,255,0.55)',
              clipPath:
                'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)',
              boxShadow: active ? `0 0 12px ${c}55` : 'none',
            }}
          >
            {o.dot && (
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: c, boxShadow: `0 0 6px ${c}` }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
