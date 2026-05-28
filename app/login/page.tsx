'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CyberBackdrop from '@/components/ui/CyberBackdrop';
import Particles from '@/components/ui/Particles';
import { toast } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useApi, useAction } from '@/lib/api';

type Stage = 'phone' | 'otp';

interface RequestOtpResp { ok: boolean; masked: string; ttl: number }
interface VerifyOtpResp  { ok: boolean; token: string; isNewUser: boolean }

/** Returning-hunter login — 2-step phone + OTP. Both stages mock-friendly:
 *  any phone ≥9 digits + any 6-digit code works in API_MOCK mode. */
export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [remember, setRemember] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const requestOtp = useAction<RequestOtpResp>('auth.requestOtp');
  const verifyOtp = useAction<VerifyOtpResp>('auth.verifyOtp');

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const phoneClean = phone.replace(/\D/g, '');
  const otpFilled = otp.every((d) => d.length === 1);

  /** Format raw digits into TH style: 081-234-5678. Pure presentation —
   *  the cleaned digits are the source of truth via `phoneClean`. */
  const fmtPhone = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 10)
      .replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join('-'),
      );

  const onRequest = async () => {
    if (phoneClean.length < 9) return;
    try {
      await requestOtp.run({ phone: phoneClean });
      setStage('otp');
      setCountdown(30);
      toast.success(`▸ OTP_SENT // +66 ***-***-${phoneClean.slice(-4)}`);
    } catch {
      toast.error('▸ NETWORK_ERR // ลองอีกครั้ง');
    }
  };

  const onResend = async () => {
    try {
      await requestOtp.run({ phone: phoneClean });
      setCountdown(30);
      toast.success('▸ OTP_RESENT');
    } catch {
      toast.error('▸ RESEND_FAILED');
    }
  };

  const setOtpAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const onSignIn = async () => {
    if (!otpFilled) return;
    try {
      const res = await verifyOtp.run({ phone: phoneClean, code: otp.join('') });
      signIn({ phone: phoneClean, token: res.token, nickname: 'HUNTER_NYX' });
      toast.success('▸ ACCESS_GRANTED // WELCOME BACK, HUNTER_NYX');
      // New users still need onboarding to pick tribe + pet.
      router.push(res.isNewUser ? '/onboarding' : '/');
    } catch {
      toast.error('▸ INVALID_OTP // ตรวจสอบรหัสอีกครั้ง');
    }
  };

  const maskedPhone = phoneClean
    ? `+66 ${phoneClean.slice(-9, -6)}-***-${phoneClean.slice(-4)}`
    : '+66 ***-***-****';

  return (
    <main className="cyber-screen min-h-screen flex items-center justify-center px-4 py-6">
      <div className="scanline-overlay" />
      <CyberBackdrop accent="cyan" />
      <Particles count={6} />

      <div className="relative z-10 w-full max-w-[640px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
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
          <svg width="42" height="42" viewBox="0 0 46 46" className="shrink-0">
            <polygon points="23,2 42,13 42,33 23,44 4,33 4,13" fill="none" stroke="#22D3EE" strokeWidth="2" />
            <polygon points="23,8 36,16 36,30 23,38 10,30 10,16" fill="rgba(34,211,238,.2)" />
            <text x="23" y="29" textAnchor="middle" fill="#22D3EE" fontSize="14" fontWeight="800" fontFamily="Orbitron">
              CH
            </text>
          </svg>
          <div className="leading-tight">
            <div className="shimmer-text font-display font-bold text-[16px] tracking-cyber">COIN HUNTER</div>
            <div className="font-mono text-[10px] text-cyber-cyan/70 tracking-widest2">
              // SECURE_LOGIN_PROTOCOL
            </div>
          </div>
          <span className="flex-1" />
          <span
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-cyber-green text-[9px] font-mono tracking-widest2"
            style={{
              background: 'rgba(74,222,128,0.10)',
              border: '1px solid rgba(74,222,128,0.45)',
              clipPath:
                'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse-dot" />
            ENCRYPTED · TLS 1.3
          </span>
        </div>

        {/* Card */}
        <div
          className="hud relative px-7 py-9 sm:px-9 sm:py-11"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,6,18,0.92), rgba(5,3,10,0.96))',
            borderColor: 'rgba(34,211,238,0.5)',
            boxShadow:
              'inset 0 0 60px rgba(34,211,238,0.08), 0 0 40px rgba(34,211,238,0.18), 0 0 80px rgba(167,139,250,0.15)',
          }}
        >
          {/* Top ribbon notch */}
          <div
            className="absolute left-1/2 -translate-x-1/2 px-4 py-1 font-display font-bold text-[9px] tracking-widest2 text-cyber-cyan"
            style={{
              top: -12,
              background: 'linear-gradient(180deg, rgba(10,6,18,0.95), rgba(5,3,10,0.95))',
              border: '1px solid rgba(34,211,238,0.55)',
              clipPath:
                'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-cyan mr-2 align-middle animate-pulse-dot" />
            NEURAL_HANDSHAKE
          </div>

          {stage === 'phone' && (
            <>
              <div className="dl text-center mb-2">// LOG_IN // RETURNING_HUNTER</div>
              <h1
                className="text-center font-display font-extrabold text-[30px] sm:text-[36px] tracking-cyber mb-1"
                style={{
                  background: 'linear-gradient(90deg, #22D3EE, #A78BFA, #FBBF24, #22D3EE)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 0 26px rgba(34,211,238,0.18)',
                  animation: 'shimmer-bg 6s linear infinite',
                }}
              >
                WELCOME BACK
              </h1>
              <div className="text-center font-mono text-[10px] text-white/50 tracking-widest2 mb-7">
                ▸ ACCESS_TERMINAL // BANGKOK.GRID
              </div>

              <label className="block font-mono text-[9px] text-cyber-cyan/70 tracking-widest2 mb-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-cyan mr-2 align-middle animate-pulse-dot" />
                // MOBILE_NUMBER (TH)
              </label>
              <div
                className="flex items-center px-5 py-4 transition-all"
                style={{
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.35))',
                  border: `1px solid ${phoneClean.length >= 9 ? 'rgba(34,211,238,0.7)' : 'rgba(255,255,255,0.15)'}`,
                  clipPath:
                    'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                  boxShadow:
                    phoneClean.length >= 9
                      ? 'inset 0 0 24px rgba(34,211,238,0.1), 0 0 18px rgba(34,211,238,0.25)'
                      : 'inset 0 0 18px rgba(34,211,238,0.04)',
                }}
              >
                <span
                  className="font-display font-bold text-[18px] sm:text-[20px] mr-3 text-cyber-cyan"
                  style={{ textShadow: '0 0 8px var(--cy-cyan)' }}
                >
                  +66
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(fmtPhone(e.target.value))}
                  placeholder="081-234-5678"
                  className="flex-1 bg-transparent border-0 outline-0 font-mono font-bold text-[18px] sm:text-[20px] text-white tracking-wider"
                />
                {phoneClean.length >= 9 && (
                  <span
                    className="text-cyber-green text-[20px]"
                    style={{ filter: 'drop-shadow(0 0 6px var(--cy-green))' }}
                  >
                    ✓
                  </span>
                )}
              </div>

              <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
                <span
                  className="w-5 h-5 flex items-center justify-center text-[12px] font-extrabold transition-all"
                  style={{
                    background: remember ? 'var(--cy-cyan)' : 'rgba(0,0,0,0.5)',
                    border: `1px solid ${remember ? 'var(--cy-cyan)' : 'rgba(255,255,255,0.3)'}`,
                    color: '#0a0612',
                    clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                    boxShadow: remember ? '0 0 10px rgba(34,211,238,0.5)' : 'none',
                  }}
                >
                  {remember ? '✓' : ''}
                </span>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="hidden"
                />
                <span className="font-mono text-[11px] text-white/65 tracking-wider">
                  // REMEMBER_THIS_DEVICE
                </span>
              </label>

              <button
                onClick={onRequest}
                disabled={phoneClean.length < 9 || requestOtp.loading}
                className="relative w-full mt-6 px-7 py-4 font-display font-extrabold text-[14px] tracking-widest2 overflow-hidden transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                style={{
                  background:
                    phoneClean.length >= 9
                      ? 'linear-gradient(135deg, #00d4f0 0%, #4dd8ff 30%, #a78bfa 75%, #c084fc 100%)'
                      : 'rgba(255,255,255,0.06)',
                  color: phoneClean.length >= 9 ? '#0a0612' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  clipPath:
                    'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)',
                  boxShadow:
                    phoneClean.length >= 9
                      ? '0 0 28px rgba(34,211,238,0.55), 0 0 60px rgba(167,139,250,0.4), inset 0 0 24px rgba(255,255,255,0.15)'
                      : 'none',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12">
                  <polygon points="2,1 11,6 2,11" fill={phoneClean.length >= 9 ? '#0a0612' : 'rgba(255,255,255,0.4)'} />
                </svg>
                {requestOtp.loading ? 'SENDING...' : 'SEND OTP_CODE'}
              </button>

              <div className="mt-6 pt-5 border-t border-dashed border-cyber-cyan/25 text-center font-mono text-[11px] text-white/55 tracking-wider">
                ▸ ยังไม่มีบัญชี?{' '}
                <Link
                  href="/onboarding"
                  className="text-cyber-cyan underline tracking-cyber"
                  style={{ textShadow: '0 0 8px var(--cy-cyan)' }}
                >
                  SIGN_UP →
                </Link>
              </div>
            </>
          )}

          {stage === 'otp' && (
            <>
              <div className="dl text-center mb-2">// VERIFY // 6_DIGIT_CODE</div>
              <h1
                className="text-center font-display font-extrabold text-[26px] sm:text-[30px] tracking-cyber mb-4"
                style={{
                  background: 'linear-gradient(90deg, #22D3EE, #A78BFA)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  animation: 'shimmer-bg 8s linear infinite',
                }}
              >
                ENTER YOUR CODE
              </h1>

              <div className="text-center font-sans text-[13px] text-white/70 mb-6">
                ส่งรหัสไปที่{' '}
                <span
                  className="text-cyber-cyan font-mono tracking-wider"
                  style={{ textShadow: '0 0 8px var(--cy-cyan)' }}
                >
                  {maskedPhone}
                </span>{' '}
                <button
                  onClick={() => setStage('phone')}
                  className="text-cyber-violet underline bg-transparent border-0 cursor-pointer"
                >
                  เปลี่ยน
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3 mb-6 justify-center">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setOtpAt(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className="w-[48px] sm:w-[58px] h-[68px] sm:h-[76px] text-center font-display font-extrabold text-[26px] sm:text-[30px] outline-0 transition-all"
                    style={{
                      background: d
                        ? 'linear-gradient(180deg, rgba(34,211,238,0.18), rgba(34,211,238,0.05))'
                        : 'rgba(0,0,0,0.5)',
                      border: `1px solid ${d ? 'var(--cy-cyan)' : 'rgba(255,255,255,0.18)'}`,
                      color: d ? 'var(--cy-cyan)' : '#fff',
                      clipPath:
                        'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
                      boxShadow: d
                        ? '0 0 18px rgba(34,211,238,0.45), inset 0 0 14px rgba(34,211,238,0.22)'
                        : 'inset 0 0 8px rgba(0,0,0,0.5)',
                      textShadow: d ? '0 0 10px var(--cy-cyan)' : 'none',
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-between items-center font-mono text-[10px] text-white/50 mb-6">
                <span>▸ ไม่ได้รับรหัส?</span>
                {countdown > 0 ? (
                  <span className="text-cyber-violet tracking-cyber">RESEND_IN {countdown}s</span>
                ) : (
                  <button
                    onClick={onResend}
                    disabled={requestOtp.loading}
                    className="text-cyber-cyan underline tracking-cyber bg-transparent border-0 cursor-pointer"
                    style={{ textShadow: '0 0 6px var(--cy-cyan)' }}
                  >
                    ▸ RESEND_CODE
                  </button>
                )}
              </div>

              <button
                onClick={onSignIn}
                disabled={!otpFilled || verifyOtp.loading}
                className="relative w-full px-7 py-4 font-display font-extrabold text-[14px] tracking-widest2 overflow-hidden transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                style={{
                  background: otpFilled
                    ? 'linear-gradient(135deg, #00d4f0 0%, #4dd8ff 30%, #a78bfa 75%, #c084fc 100%)'
                    : 'rgba(255,255,255,0.06)',
                  color: otpFilled ? '#0a0612' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  clipPath:
                    'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)',
                  boxShadow: otpFilled
                    ? '0 0 28px rgba(34,211,238,0.55), 0 0 60px rgba(167,139,250,0.4), inset 0 0 24px rgba(255,255,255,0.15)'
                    : 'none',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12">
                  <polygon points="2,1 11,6 2,11" fill={otpFilled ? '#0a0612' : 'rgba(255,255,255,0.4)'} />
                </svg>
                {verifyOtp.loading ? 'VERIFYING...' : 'SIGN_IN // ENTER GRID'}
              </button>

              <div className="mt-5 px-4 py-3 font-mono text-[10px] text-cyber-green/85 text-center tracking-wider"
                style={{
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px dashed rgba(74,222,128,0.3)',
                }}
              >
                ▸ TEST_HINT // ใส่เลขอะไรก็ได้ 6 หลัก ระบบ mock จะรับทุก code
              </div>
            </>
          )}
        </div>

        {/* Bottom watermark */}
        <div className="flex items-center gap-3 mt-7 font-mono text-[9px] text-white/30 tracking-widest2">
          <span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }} />
          <span>▸ COIN_HUNTER // BANGKOK_GRID_v2.4 // SECURE_AUTH</span>
          <span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)' }} />
        </div>
      </div>
    </main>
  );
}
