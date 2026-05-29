'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { TRIBES } from '@/data/tribes';
import type { TribeId } from '@/types';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useApi, useAction } from '@/lib/api';
import type { PortraitColor } from '@/store/authStore';

const STEPS = [
  'PHONE',
  'OTP',
  'BIRTHDATE',
  'NICKNAME',
  'TRIBE',
  'STARTER',
  'CONFIRM',
] as const;
type StepName = (typeof STEPS)[number];

const TIPS: Record<StepName, string> = {
  PHONE: 'กรอกเบอร์โทรศัพท์ — ใช้ยืนยันตัวตนและกู้คืนบัญชี',
  OTP: 'กรอก OTP 6 หลักที่ได้รับทาง SMS',
  BIRTHDATE: 'กรอกวันเกิด — ตรวจอายุขั้นต่ำและคำนวณ event โบนัสวันเกิด',
  NICKNAME: 'ตั้งชื่อ call-sign — แสดงบน leaderboard',
  TRIBE: 'เลือก tribe — โบนัสการเล่นและสีประจำตัว',
  STARTER: 'เลือก digivice companion — อยู่เคียงข้างคุณทุก contract',
  CONFIRM: 'รีวิวข้อมูล — เซ็น neural pact เพื่อเข้าสู่ Bangkok Grid',
};

const PORTRAIT_COLORS: { id: PortraitColor; color: string; label: string }[] = [
  { id: 'cyan',   color: '#22D3EE', label: 'CYAN_SIGNAL' },
  { id: 'violet', color: '#A78BFA', label: 'VIOLET_FLUX' },
  { id: 'gold',   color: '#FBBF24', label: 'GOLD_ARC' },
  { id: 'pink',   color: '#FF35E6', label: 'PINK_PULSE' },
  { id: 'green',  color: '#4ade80', label: 'GREEN_SIGIL' },
];

interface PetCard {
  id: string;
  nick: string;
  name: string;
  element: string;
  stage: string;
  level: number;
  image: string;
  hp: number;
  hpMax: number;
  en: number;
  enMax: number;
  atk: number;
}
interface PetsResp { pets: PetCard[] }

const ELEMENT_COLOR: Record<string, string> = {
  FAIRY:   '#FF35E6',
  BEAST:   '#FD7A2F',
  PSYCHIC: '#A78BFA',
  DARK:    '#22D3EE',
};

export default function OnboardingPage() {
  const router = useRouter();
  const authSet = useAuthStore();
  const setTribeStore = useGameStore((s) => s.setTribe);
  const setNicknameStore = useGameStore((s) => s.setNickname);

  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [nickname, setNickname] = useState('');
  const [portrait, setPortrait] = useState<PortraitColor>('cyan');
  const [tribe, setTribe] = useState<TribeId | null>(null);
  const [starterPet, setStarterPet] = useState<string>('');
  const [agreed, setAgreed] = useState(false);

  const requestOtp = useAction('auth.requestOtp');
  const signup = useAction<{ ok: boolean; token: string }>('auth.signup');
  const petsList = useApi<PetsResp>('pets.list', { skip: step < 5 });

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const phoneClean = phone.replace(/\D/g, '');
  const otpFilled = otp.every((d) => d.length === 1);
  const age =
    birthYear.length === 4 ? new Date().getFullYear() - Number(birthYear) : null;
  const birthOk =
    birthYear.length === 4 &&
    !!birthMonth &&
    !!birthDay &&
    Number(birthYear) <= new Date().getFullYear() - 13 &&
    Number(birthYear) >= 1920;

  const canNext = (
    (step === 0 && phoneClean.length >= 9) ||
    (step === 1 && otpFilled) ||
    (step === 2 && birthOk) ||
    (step === 3 && nickname.trim().length >= 3) ||
    (step === 4 && tribe) ||
    (step === 5 && starterPet) ||
    (step === 6 && agreed)
  );

  const stepDone: Record<number, boolean> = {
    0: phoneClean.length >= 9,
    1: otpFilled,
    2: birthOk,
    3: nickname.trim().length >= 3,
    4: !!tribe,
    5: !!starterPet,
    6: agreed,
  };

  const sendOtp = async () => {
    try {
      await requestOtp.run({ phone: phoneClean });
      setOtpSent(true);
      setOtpCountdown(30);
      toast.success(`▸ OTP_SENT // +66 ${phoneClean.slice(-9)}`);
    } catch {
      toast.error('▸ OTP_REQUEST_FAILED');
    }
  };

  const next = async () => {
    if (!canNext) return;

    if (step === 0 && !otpSent) {
      await sendOtp();
      setStep(1);
      return;
    }

    if (step < STEPS.length - 1) {
      setStep(step + 1);
      toast.info(`▸ STEP_${step + 2}_ENGAGED // ${STEPS[step + 1]}`);
      return;
    }

    // FINAL — commit signup
    if (!tribe || !starterPet) return;
    try {
      const res = await signup.run({
        phone: phoneClean,
        nickname,
        tribe,
        petId: starterPet,
        birthDate: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
        portrait,
      });
      authSet.completeOnboarding({
        nickname,
        tribe,
        petId: starterPet,
        token: res.token,
      });
      authSet.setPhone(phoneClean);
      authSet.setBirthDate(
        `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`,
      );
      authSet.setPortrait(portrait);
      setTribeStore(tribe);
      setNicknameStore(`HUNTER_${nickname.toUpperCase()}`);
      toast.success(`▸ NEURAL_PACT_SIGNED // WELCOME, HUNTER_${nickname.toUpperCase()}`);
      router.push('/');
    } catch {
      toast.error('▸ SIGNUP_FAILED // ลองอีกครั้ง');
    }
  };

  const back = () => step > 0 && setStep(step - 1);

  return (
    <main className="cyber-screen min-h-screen">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="violet" />
      <Particles count={6} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-7 min-h-screen flex flex-col">
        <Header />

        <div className="grid md:grid-cols-[280px_1fr] gap-5 flex-1">
          <StepRail step={step} setStep={setStep} done={stepDone} />

          <div className="hud v p-5 sm:p-7 flex flex-col">
            <div className="flex-1">
              {step === 0 && <PhoneStep phone={phone} setPhone={setPhone} phoneClean={phoneClean} />}
              {step === 1 && (
                <OtpStep
                  otp={otp}
                  setOtp={setOtp}
                  phone={phoneClean}
                  countdown={otpCountdown}
                  onResend={sendOtp}
                />
              )}
              {step === 2 && (
                <BirthdateStep
                  y={birthYear}
                  m={birthMonth}
                  d={birthDay}
                  setY={setBirthYear}
                  setM={setBirthMonth}
                  setD={setBirthDay}
                  age={age}
                />
              )}
              {step === 3 && (
                <NicknameStep
                  nickname={nickname}
                  setNickname={setNickname}
                  portrait={portrait}
                  setPortrait={setPortrait}
                />
              )}
              {step === 4 && <TribeStep tribe={tribe} setTribe={setTribe} />}
              {step === 5 && (
                <StarterStep
                  pick={starterPet}
                  setPick={setStarterPet}
                  pets={petsList.data?.pets ?? []}
                  loading={petsList.loading}
                />
              )}
              {step === 6 && (
                <ConfirmStep
                  nickname={nickname}
                  portrait={portrait}
                  tribe={tribe}
                  starterPetId={starterPet}
                  pets={petsList.data?.pets ?? []}
                  phone={phoneClean}
                  birth={`${birthDay}/${birthMonth}/${birthYear}`}
                  agreed={agreed}
                  setAgreed={setAgreed}
                />
              )}
            </div>

            {/* Footer nav */}
            <div className="flex justify-between items-center mt-6 pt-5 border-t border-dashed border-cyber-cyan/25">
              {step > 0 ? (
                <Button variant="ghost" onClick={back}>‹ BACK</Button>
              ) : (
                <span />
              )}
              <span className="flex-1" />
              <span className="font-mono text-[10px] text-white/45 tracking-cyber mr-4 hidden sm:inline">
                STEP {step + 1} / {STEPS.length}
              </span>
              <Button disabled={!canNext || signup.loading} onClick={next} className="!min-w-[180px]">
                {step === STEPS.length - 1
                  ? signup.loading
                    ? '▸ BINDING...'
                    : '▸ BIND // ENTER GRID'
                  : 'NEXT ›'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ───────────────────────── HEADER
function Header() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href="/"
        title="Back to dashboard"
        className="w-10 h-10 flex items-center justify-center text-cyber-cyan border border-cyber-cyan/40 bg-[rgba(10,6,18,0.7)] hover:bg-cyber-cyan/10 transition"
        style={{
          clipPath:
            'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <svg width="40" height="40" viewBox="0 0 46 46" className="shrink-0">
        <polygon points="23,2 42,13 42,33 23,44 4,33 4,13" fill="none" stroke="#22D3EE" strokeWidth="2" />
        <polygon points="23,8 36,16 36,30 23,38 10,30 10,16" fill="rgba(34,211,238,.2)" />
        <text x="23" y="29" textAnchor="middle" fill="#22D3EE" fontSize="14" fontWeight="800" fontFamily="Orbitron">
          CH
        </text>
      </svg>
      <div className="leading-tight">
        <div className="shimmer-text font-display font-bold text-[15px] tracking-cyber">COIN HUNTER</div>
        <div className="font-mono text-[9px] text-white/50 tracking-widest2">
          // PROTOCOL_INIT // HUNTER_REGISTRATION
        </div>
      </div>
      <span className="flex-1" />
      <div className="hidden sm:flex items-center gap-2">
        <Pill variant="cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse-dot" />
          SECURE_CHANNEL
        </Pill>
        <Pill variant="violet">SESSION #NX-7412</Pill>
      </div>
    </div>
  );
}

// ───────────────────────── STEP RAIL
interface StepRailProps {
  step: number;
  setStep: (n: number) => void;
  done: Record<number, boolean>;
}
function StepRail({ step, setStep, done }: StepRailProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="hud p-4">
        <div className="dl mb-3">// HUNTER_REGISTRATION</div>
        <div className="flex flex-col gap-1">
          {STEPS.map((s, i) => {
            const active = i === step;
            const finished = done[i] && i < step;
            const reachable = i <= step || done[i - 1];
            const color = active ? '#22D3EE' : finished ? '#4ade80' : 'rgba(255,255,255,0.5)';
            const borderColor = active
              ? '#22D3EE'
              : finished
              ? '#4ade80'
              : 'rgba(255,255,255,0.1)';
            return (
              <button
                key={s}
                onClick={() => reachable && setStep(i)}
                disabled={!reachable}
                className="flex items-center gap-2.5 px-2.5 py-2 text-left font-display font-bold text-[11px] tracking-cyber transition disabled:cursor-not-allowed"
                style={{
                  background: active ? 'rgba(34,211,238,0.10)' : 'transparent',
                  borderLeft: `2px solid ${borderColor}`,
                  color,
                }}
              >
                <span
                  className="w-[22px] h-[22px] flex items-center justify-center text-[10px] font-extrabold"
                  style={{
                    background: active
                      ? 'rgba(34,211,238,0.18)'
                      : finished
                      ? 'rgba(74,222,128,0.18)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${borderColor}`,
                    clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                  }}
                >
                  {finished ? '✓' : i + 1}
                </span>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hud v p-3.5">
        <div className="font-mono text-[9px] text-cyber-violet/80 tracking-widest2 mb-1.5">
          // FIELD_BRIEF
        </div>
        <div className="font-sans text-[12px] text-white/70 leading-[1.6]">{TIPS[STEPS[step]]}</div>
      </div>

      <div
        className="flex flex-col gap-1 px-3.5 py-3"
        style={{
          background: 'rgba(251,191,36,0.04)',
          border: '1px solid rgba(251,191,36,0.18)',
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}
      >
        <div className="font-mono text-[9px] text-cyber-gold tracking-widest2">▸ STARTER_BONUS</div>
        <div className="font-sans text-[11px] text-white/65 leading-[1.5]">
          +500 CR · +20 STAMINA · 24h XP boost ตอนจบ onboarding
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── STEP TITLE
function StepTitle({ ribbon, title }: { ribbon: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="dl mb-1.5">{ribbon}</div>
      <h2
        className="font-display font-extrabold text-[24px] sm:text-[28px] tracking-cyber m-0"
        style={{
          background: 'linear-gradient(90deg, #22D3EE, #A78BFA, #FBBF24)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: 'shimmer-bg 8s linear infinite',
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// ───────────────────────── PHONE STEP
function PhoneStep({
  phone,
  setPhone,
  phoneClean,
}: {
  phone: string;
  setPhone: (v: string) => void;
  phoneClean: string;
}) {
  const fmt = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 10)
      .replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join('-'),
      );
  return (
    <div>
      <StepTitle ribbon="// STEP_01 // PHONE_VERIFY" title="LINK YOUR LINE" />
      <div className="max-w-[520px]">
        <label className="block font-mono text-[9px] text-cyber-cyan/65 tracking-widest2 mb-1.5">
          // MOBILE_NUMBER (TH)
        </label>
        <div
          className="flex items-center px-4 py-3.5"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${phoneClean.length >= 9 ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.15)'}`,
            clipPath:
              'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
          }}
        >
          <span className="font-display font-bold text-cyber-cyan text-[18px] mr-3">+66</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(fmt(e.target.value))}
            placeholder="081-234-5678"
            className="flex-1 bg-transparent border-0 outline-0 font-mono font-bold text-[18px] text-white tracking-wider"
          />
          {phoneClean.length >= 9 && <span className="text-cyber-green text-[18px]">✓</span>}
        </div>

        <div
          className="mt-5 px-4 py-3.5 font-mono text-[10px] text-white/60 leading-[1.7]"
          style={{
            background: 'rgba(34,211,238,0.04)',
            border: '1px dashed rgba(34,211,238,0.25)',
          }}
        >
          ▸ ระบบจะส่งรหัส OTP 6 หลักไปยังเบอร์นี้<br />
          ▸ ใช้สำหรับยืนยันตัวตนและกู้คืนบัญชี<br />
          ▸ เราจะไม่แชร์เบอร์ของคุณกับ third party
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── OTP STEP
function OtpStep({
  otp,
  setOtp,
  phone,
  countdown,
  onResend,
}: {
  otp: string[];
  setOtp: (v: string[]) => void;
  phone: string;
  countdown: number;
  onResend: () => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const set = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const maskedPhone = phone
    ? `+66 ${phone.slice(-9, -6)}-***-${phone.slice(-4)}`
    : '+66 ***-***-****';

  return (
    <div>
      <StepTitle ribbon="// STEP_02 // OTP_VERIFY" title="ENTER 6-DIGIT CODE" />
      <div className="max-w-[560px]">
        <div className="font-sans text-[14px] text-white/70 mb-3.5">
          ส่งรหัสไปที่{' '}
          <span className="text-cyber-cyan font-mono tracking-wider">{maskedPhone}</span>
        </div>

        <div className="flex gap-2 sm:gap-2.5 mb-5">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              className="w-[48px] sm:w-[56px] h-[64px] sm:h-[70px] text-center font-display font-extrabold text-[24px] sm:text-[28px] outline-0 transition-all"
              style={{
                background: d ? 'rgba(34,211,238,0.10)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${d ? 'var(--cy-cyan)' : 'rgba(255,255,255,0.18)'}`,
                color: d ? 'var(--cy-cyan)' : '#fff',
                clipPath:
                  'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
                boxShadow: d
                  ? '0 0 14px rgba(34,211,238,0.35), inset 0 0 12px rgba(34,211,238,0.18)'
                  : 'none',
              }}
            />
          ))}
        </div>

        <div className="flex justify-between items-center font-mono text-[10px] text-white/50">
          <span>▸ ไม่ได้รับรหัส? ตรวจสอบ SMS หรือลองอีกครั้ง</span>
          {countdown > 0 ? (
            <span className="text-cyber-violet">// RESEND_IN {countdown}s</span>
          ) : (
            <button
              onClick={onResend}
              className="text-cyber-cyan underline tracking-cyber bg-transparent border-0 cursor-pointer"
            >
              ▸ RESEND_CODE
            </button>
          )}
        </div>

        <div
          className="mt-5 px-4 py-3 font-mono text-[10px] text-cyber-green/85"
          style={{
            background: 'rgba(74,222,128,0.05)',
            border: '1px dashed rgba(74,222,128,0.25)',
          }}
        >
          ▸ TEST_HINT // ใส่เลขอะไรก็ได้ 6 หลัก ระบบ mock จะรับทุก code
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── BIRTHDATE STEP
function BirthdateStep({
  y,
  m,
  d,
  setY,
  setM,
  setD,
  age,
}: {
  y: string;
  m: string;
  d: string;
  setY: (v: string) => void;
  setM: (v: string) => void;
  setD: (v: string) => void;
  age: number | null;
}) {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const daysInMonth = m && y ? new Date(Number(y), Number(m), 0).getDate() : 31;
  return (
    <div>
      <StepTitle ribbon="// STEP_03 // BIRTHDATE" title="DATE OF BIRTH" />
      <div className="max-w-[560px]">
        <div className="grid grid-cols-[90px_1fr_110px] gap-2.5 mb-3.5">
          <Field label="DAY">
            <select value={d} onChange={(e) => setD(e.target.value)} style={selectStyle(!!d)}>
              <option value="">--</option>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </Field>
          <Field label="MONTH">
            <select value={m} onChange={(e) => setM(e.target.value)} style={selectStyle(!!m)}>
              <option value="">-- เลือกเดือน --</option>
              {months.map((mo, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}. {mo}
                </option>
              ))}
            </select>
          </Field>
          <Field label="YEAR">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={y}
              onChange={(e) => setY(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="2002"
              style={selectStyle(y.length === 4)}
            />
          </Field>
        </div>

        {age !== null && age >= 13 && age <= 105 && (
          <div
            className="inline-block px-3.5 py-1.5 font-display text-[11px] text-cyber-green tracking-cyber"
            style={{
              background: 'rgba(74,222,128,0.10)',
              border: '1px solid rgba(74,222,128,0.5)',
              clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
            }}
          >
            ▸ AGE {age} · ELIGIBLE
          </div>
        )}
        {age !== null && age < 13 && (
          <div
            className="inline-block px-3.5 py-1.5 font-display text-[11px] text-cyber-red tracking-cyber"
            style={{
              background: 'rgba(253,24,3,0.10)',
              border: '1px solid rgba(253,24,3,0.5)',
              clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
            }}
          >
            ▸ MIN_AGE 13 REQUIRED
          </div>
        )}

        <div
          className="mt-5 px-4 py-3.5 font-mono text-[10px] text-white/60 leading-[1.7]"
          style={{
            background: 'rgba(167,139,250,0.04)',
            border: '1px dashed rgba(167,139,250,0.25)',
          }}
        >
          ▸ ใช้ตรวจสอบอายุขั้นต่ำ 13 ปี ตามนโยบายแพลตฟอร์ม<br />
          ▸ ระบบใช้คำนวณ event วันเกิดของ HUNTER (โบนัส 2x ในวันเกิด)<br />
          ▸ ไม่แสดงต่อสาธารณะ — เฉพาะคุณและระบบเห็น
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[9px] text-cyber-cyan/65 tracking-widest2 mb-1.5">
        // {label}
      </label>
      {children}
    </div>
  );
}

function selectStyle(filled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    background: filled ? 'rgba(34,211,238,0.08)' : 'rgba(0,0,0,0.4)',
    border: `1px solid ${filled ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.15)'}`,
    color: filled ? 'var(--cy-cyan)' : '#fff',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    fontSize: 14,
    outline: 'none',
    clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
    cursor: 'pointer',
  };
}

// ───────────────────────── NICKNAME STEP
function NicknameStep({
  nickname,
  setNickname,
  portrait,
  setPortrait,
}: {
  nickname: string;
  setNickname: (v: string) => void;
  portrait: PortraitColor;
  setPortrait: (v: PortraitColor) => void;
}) {
  const portraitColor = PORTRAIT_COLORS.find((p) => p.id === portrait)!.color;
  return (
    <div>
      <StepTitle ribbon="// STEP_04 // CALL_SIGN" title="CHOOSE YOUR HANDLE" />
      <div className="grid grid-cols-[180px_1fr] gap-6 items-center">
        {/* Live portrait preview */}
        <div className="relative w-[180px] h-[180px] flex items-center justify-center">
          <div
            className="absolute w-[160px] h-[160px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${portraitColor}55, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />
          <div
            className="relative w-[130px] h-[150px] flex items-center justify-center"
            style={{
              clipPath: 'polygon(6% 0, 94% 0, 100% 10%, 100% 92%, 96% 100%, 4% 100%, 0 90%, 0 8%)',
              background: `linear-gradient(180deg, ${portraitColor}25, ${portraitColor}08)`,
              border: `1px solid ${portraitColor}`,
              boxShadow: `0 0 24px ${portraitColor}66, inset 0 0 24px ${portraitColor}22`,
            }}
          >
            <span
              className="font-display font-extrabold text-[48px]"
              style={{ color: portraitColor, textShadow: `0 0 14px ${portraitColor}` }}
            >
              {(nickname || '?').slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>

        <div>
          <label className="block font-mono text-[9px] text-cyber-cyan/65 tracking-widest2 mb-1.5">
            // HANDLE (3–16 chars · A–Z 0–9 _)
          </label>
          <div
            className="flex items-center px-4 py-3"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${nickname.length >= 3 ? 'rgba(34,211,238,0.6)' : 'rgba(255,255,255,0.15)'}`,
              clipPath:
                'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
            }}
          >
            <span className="font-display text-cyber-cyan mr-2.5">HUNTER_</span>
            <input
              type="text"
              maxLength={16}
              value={nickname}
              onChange={(e) =>
                setNickname(e.target.value.replace(/[^A-Za-z0-9_]/g, '').toUpperCase())
              }
              placeholder="NYX"
              className="flex-1 bg-transparent border-0 outline-0 font-display font-bold text-[18px] text-white tracking-cyber"
            />
            <span className="font-mono text-[10px] text-white/40">{nickname.length}/16</span>
          </div>

          <div className="mt-4">
            <div className="font-mono text-[9px] text-cyber-cyan/65 tracking-widest2 mb-2">
              // PORTRAIT_SIGNAL
            </div>
            <div className="flex gap-2 flex-wrap">
              {PORTRAIT_COLORS.map((p) => {
                const active = portrait === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPortrait(p.id)}
                    title={p.label}
                    className="inline-flex items-center gap-2 px-3 py-1.5 font-display font-bold text-[10px] tracking-cyber cursor-pointer"
                    style={{
                      background: active ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${active ? p.color : 'rgba(255,255,255,0.15)'}`,
                      color: active ? p.color : 'rgba(255,255,255,0.6)',
                      clipPath:
                        'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)',
                      boxShadow: active ? `0 0 12px ${p.color}55` : 'none',
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
                    />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-4 px-3.5 py-2.5 font-mono text-[10px] text-white/55 leading-[1.6]"
            style={{
              background: 'rgba(34,211,238,0.04)',
              border: '1px dashed rgba(34,211,238,0.25)',
            }}
          >
            ▸ ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น<br />
            ▸ ห้ามใช้คำหยาบหรือชื่อแบรนด์ — ระบบตรวจอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── TRIBE STEP
function TribeStep({
  tribe,
  setTribe,
}: {
  tribe: TribeId | null;
  setTribe: (v: TribeId) => void;
}) {
  const tribeDescs: Record<TribeId, string> = {
    wolf:   'นักวิ่งกลางคืน · pin เร็ว',
    lion:   'ผู้บัญชาการ · พลังโจมตี',
    falcon: 'จับตามอง · เบาะแสไกล',
    shark:  'สำรวจน้ำลึก · ค่าล่าสูง',
  };
  return (
    <div>
      <StepTitle ribbon="// STEP_05 // FOUR_TRIBES_PROTOCOL" title="JOIN A TRIBE" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TRIBES.map((t) => {
          const selected = tribe === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTribe(t.id)}
              className="relative cursor-pointer text-center px-3 py-4 transition-all"
              style={{
                background: selected ? `${t.color}15` : 'rgba(10,6,18,0.7)',
                border: `${selected ? 2 : 1}px solid ${selected ? t.color : 'rgba(255,255,255,0.1)'}`,
                boxShadow: selected ? `inset 0 0 36px ${t.color}33, 0 0 22px ${t.color}55` : 'none',
                clipPath:
                  'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
                color: t.color,
              }}
            >
              {selected && (
                <div
                  className="absolute -top-2 right-3 px-2.5 py-0.5 font-display font-extrabold text-[9px] tracking-cyber"
                  style={{
                    background: t.color,
                    color: '#0a0612',
                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                  }}
                >
                  ✓ JOINED
                </div>
              )}
              <div
                className="text-[42px] sm:text-[48px] leading-none"
                style={{ filter: `drop-shadow(0 0 12px ${t.color})` }}
              >
                {t.emoji}
              </div>
              <div
                className="font-display font-extrabold text-[15px] sm:text-[16px] tracking-cyber mt-2"
                style={{ color: t.color }}
              >
                {t.name}
              </div>
              <div
                className="font-mono text-[9px] mt-1"
                style={{ color: `${t.color}b3` }}
              >
                {t.bonusLabel}
              </div>
              <div className="font-sans text-[11px] text-white/60 mt-2 leading-[1.5] min-h-[50px]">
                {tribeDescs[t.id]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── STARTER STEP
function StarterStep({
  pick,
  setPick,
  pets,
  loading,
}: {
  pick: string;
  setPick: (id: string) => void;
  pets: PetCard[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div>
        <StepTitle ribbon="// STEP_06 // CHOOSE_STARTER" title="BIND YOUR DIGIVICE" />
        <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber">
          ▸ LOADING_ROSTER...
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepTitle ribbon="// STEP_06 // CHOOSE_STARTER" title="BIND YOUR DIGIVICE" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pets.map((p) => {
          const c = ELEMENT_COLOR[p.element] ?? '#22D3EE';
          const selected = pick === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPick(p.id)}
              className="relative cursor-pointer text-center px-3 py-4 transition-all"
              style={{
                background: selected ? `linear-gradient(180deg, ${c}1f, ${c}0a)` : 'rgba(10,6,18,0.7)',
                border: `${selected ? 2 : 1}px solid ${selected ? c : 'rgba(255,255,255,0.1)'}`,
                boxShadow: selected ? `inset 0 0 36px ${c}33, 0 0 22px ${c}55` : 'none',
                clipPath:
                  'polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)',
                color: c,
              }}
            >
              {selected && (
                <div
                  className="absolute -top-2 right-3 px-2.5 py-0.5 font-display font-extrabold text-[9px] tracking-cyber"
                  style={{
                    background: c,
                    color: '#0a0612',
                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                  }}
                >
                  ✓ PICKED
                </div>
              )}
              <div className="relative h-[110px] flex items-center justify-center">
                <div
                  className="absolute w-[110px] h-[110px] rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${c}33, transparent 70%)`,
                    filter: 'blur(8px)',
                  }}
                />
                <img
                  src={p.image}
                  alt={p.nick}
                  className="relative h-[100px] w-auto object-contain"
                  style={{ filter: `drop-shadow(0 0 14px ${c}aa)` }}
                />
              </div>
              <div
                className="font-display font-extrabold text-[14px] sm:text-[15px] tracking-cyber mt-1.5"
                style={{ color: c }}
              >
                {p.nick}
              </div>
              <div className="font-mono text-[9px] text-white/55 tracking-cyber mt-1">
                {p.element} · {p.stage}
              </div>
              <div
                className="grid grid-cols-3 gap-1 mt-2.5 pt-2 font-mono text-[9px]"
                style={{ borderTop: `1px dashed ${c}30` }}
              >
                <div>
                  <div className="text-white/45">HP</div>
                  <div className="font-bold" style={{ color: c }}>{p.hpMax}</div>
                </div>
                <div>
                  <div className="text-white/45">EN</div>
                  <div className="font-bold" style={{ color: c }}>{p.enMax}</div>
                </div>
                <div>
                  <div className="text-white/45">ATK</div>
                  <div className="font-bold" style={{ color: c }}>{p.atk}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────── CONFIRM STEP
function ConfirmStep({
  nickname,
  portrait,
  tribe,
  starterPetId,
  pets,
  phone,
  birth,
  agreed,
  setAgreed,
}: {
  nickname: string;
  portrait: PortraitColor;
  tribe: TribeId | null;
  starterPetId: string;
  pets: PetCard[];
  phone: string;
  birth: string;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
}) {
  const portraitColor = PORTRAIT_COLORS.find((p) => p.id === portrait)!.color;
  const tribeData = useMemo(() => TRIBES.find((t) => t.id === tribe), [tribe]);
  const petData = useMemo(
    () => pets.find((p) => p.id === starterPetId),
    [pets, starterPetId],
  );
  const petColor = petData ? ELEMENT_COLOR[petData.element] ?? '#22D3EE' : '#22D3EE';

  return (
    <div>
      <StepTitle ribbon="// STEP_07 // NEURAL_PACT" title="CONFIRM HUNTER_PROFILE" />

      <div
        className="mb-3.5 px-4 py-3 flex justify-between flex-wrap gap-3.5"
        style={{
          background: 'rgba(34,211,238,0.06)',
          border: '1px solid rgba(34,211,238,0.3)',
          clipPath:
            'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
        }}
      >
        <span className="font-mono text-[11px] text-white/60">
          ▸ PHONE: <span className="text-cyber-cyan">+66 ***-***-{phone.slice(-4) || '****'}</span>
        </span>
        <span className="font-mono text-[11px] text-white/60">
          ▸ DOB: <span className="text-cyber-cyan">{birth || '--/--/----'}</span>
        </span>
        <span className="font-mono text-[11px] text-cyber-green">
          ✓ PHONE_VERIFIED · ✓ AGE_VERIFIED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Handle card */}
        <SummaryCard accent={portraitColor} label="HANDLE" sub={`SIGNAL · ${portrait.toUpperCase()}`}
          title={`HUNTER_${nickname || '—'}`}
        >
          <div
            className="w-20 h-[90px] mx-auto flex items-center justify-center"
            style={{
              clipPath: 'polygon(6% 0, 94% 0, 100% 10%, 100% 92%, 96% 100%, 4% 100%, 0 90%, 0 8%)',
              background: `linear-gradient(180deg, ${portraitColor}25, ${portraitColor}08)`,
              border: `1px solid ${portraitColor}`,
            }}
          >
            <span
              className="font-display font-extrabold text-[32px]"
              style={{ color: portraitColor, textShadow: `0 0 12px ${portraitColor}` }}
            >
              {(nickname || '?').slice(0, 1).toUpperCase()}
            </span>
          </div>
        </SummaryCard>

        {/* Tribe card */}
        <SummaryCard
          accent={tribeData?.color ?? '#22D3EE'}
          label="TRIBE"
          sub={tribeData?.bonusLabel ?? ''}
          title={tribeData?.name ?? '—'}
        >
          <div
            className="text-[56px] leading-none mx-auto w-fit"
            style={{ filter: `drop-shadow(0 0 14px ${tribeData?.color})` }}
          >
            {tribeData?.emoji ?? '?'}
          </div>
        </SummaryCard>

        {/* Pet card */}
        <SummaryCard
          accent={petColor}
          label="COMPANION"
          sub={petData ? `${petData.element} · ${petData.stage}` : ''}
          title={petData?.nick ?? '—'}
        >
          {petData ? (
            <img
              src={petData.image}
              alt={petData.nick}
              className="mx-auto h-[80px] w-auto object-contain"
              style={{ filter: `drop-shadow(0 0 14px ${petColor})` }}
            />
          ) : (
            <div
              className="text-[56px] leading-none mx-auto w-fit"
              style={{ filter: `drop-shadow(0 0 14px ${petColor})` }}
            >
              🐾
            </div>
          )}
        </SummaryCard>
      </div>

      {/* Pact */}
      <div
        className="mt-5 px-4 py-3.5"
        style={{
          background: 'rgba(167,139,250,0.05)',
          border: '1px solid rgba(167,139,250,0.3)',
          clipPath:
            'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
        }}
      >
        <div className="dl text-cyber-violet mb-2">// NEURAL_PACT_TERMS</div>
        <ul className="font-sans text-[12px] text-white/75 leading-[1.7] list-none p-0 m-0">
          <li>▸ Profile ของคุณจะถูกเก็บใน local DIGIVICE และซิงค์เมื่อเชื่อมต่อ network</li>
          <li>▸ ห้ามใช้ตัวช่วย third-party หรือ GPS spoofing — ระบบจะ ban อัตโนมัติ</li>
          <li>▸ Companion ที่เลือกจะติดอยู่กับ profile ตลอดไป (สลับได้ที่ MARKET // RESEARCH_LAB)</li>
          <li>▸ คะแนน, achievement และ leaderboard rank จะคำนวณแบบ real-time</li>
        </ul>
        <label className="flex items-center gap-2.5 mt-3.5 cursor-pointer select-none">
          <span
            className="w-[22px] h-[22px] flex items-center justify-center text-[14px] font-extrabold"
            style={{
              background: agreed ? 'var(--cy-green)' : 'rgba(0,0,0,0.4)',
              border: `1px solid ${agreed ? 'var(--cy-green)' : 'rgba(255,255,255,0.3)'}`,
              color: '#0a0612',
              clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
            }}
          >
            {agreed ? '✓' : ''}
          </span>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="hidden"
          />
          <span className="font-sans text-[13px] text-white">
            ฉันยอมรับ <span className="text-cyber-cyan">NEURAL_PACT</span> และ Terms of Service
          </span>
        </label>
      </div>
    </div>
  );
}

function SummaryCard({
  accent,
  label,
  title,
  sub,
  children,
}: {
  accent: string;
  label: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="px-4 py-4 text-center"
      style={{
        background: `${accent}08`,
        border: `1px solid ${accent}55`,
        clipPath:
          'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
      }}
    >
      <div className="dl mb-2.5" style={{ color: `${accent}b3` }}>
        // {label}
      </div>
      <div className="h-[90px] flex items-center justify-center">{children}</div>
      <div
        className="font-display font-extrabold text-[14px] tracking-cyber mt-3"
        style={{ color: accent }}
      >
        {title}
      </div>
      <div className="font-mono text-[9px] text-white/50 mt-0.5">{sub}</div>
    </div>
  );
}
