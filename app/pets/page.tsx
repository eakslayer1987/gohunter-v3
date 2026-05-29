'use client';

import { useState } from 'react';
import ScreenShell from '@/components/ui/ScreenShell';
import Bar from '@/components/ui/Bar';
import Pill from '@/components/ui/Pill';
import Button from '@/components/ui/Button';
import { useGameStore } from '@/store/gameStore';
import { toast } from '@/store/toastStore';
import { useApi, useAction } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface PetCard {
  id: string;
  name: string;
  nick: string;
  element: 'FAIRY' | 'BEAST' | 'PSYCHIC' | 'DARK';
  stage: 'BABY' | 'ROOKIE' | 'CHAMPION' | 'ULTIMATE' | 'MEGA';
  level: number;
  /** Asset URL — webp portrait shipped at /public/assets/img/pets/. */
  image: string;
  hp: number;
  hpMax: number;
  en: number;
  enMax: number;
  atk: number;
  sync: number;
  link: boolean;
  msg: string;
}
interface PetsResp { pets: PetCard[] }
interface ChatResp { ok: boolean; reply: string }

const ELEMENT_COLOR: Record<PetCard['element'], string> = {
  FAIRY:   '#FF35E6',
  BEAST:   '#FBBF24',
  PSYCHIC: '#22D3EE',
  DARK:    '#A78BFA',
};
const STAGES: PetCard['stage'][] = ['BABY', 'ROOKIE', 'CHAMPION', 'ULTIMATE', 'MEGA'];
const FEED_COST_CR = 10;

interface ChatLine {
  who: 'pet' | 'me';
  text: string;
  time: string;
}

/** Formats Date.now() into "HH:mm" so chat bubble timestamps stay short. */
function nowHHmm() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PetsPage() {
  const credits = useGameStore((s) => s.player.credits);
  const totalScore = useGameStore((s) => s.player.totalScore);
  const addStamina = useGameStore((s) => s.addStamina);
  const addCredits = useGameStore((s) => s.addCredits);
  const ownedFromAuth = useAuthStore((s) => s.starterPetId);

  const { data, loading, refetch } = useApi<PetsResp>('pets.list');
  const chatApi = useAction<ChatResp>('pets.chat');

  // Owned pet — prefer the one the user picked at onboarding, otherwise
  // fall back to the first pet in the roster so the page never hangs
  // on an empty selection.
  const ownedId = ownedFromAuth || 'volt';

  const pets = data?.pets ?? [];
  const [selectedId, setSelectedId] = useState<string>('');
  const effectiveSelected = selectedId || ownedId;
  const pet = pets.find((p) => p.id === effectiveSelected) ?? pets[0];

  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState<ChatLine[]>([]);

  if (loading || !pet) {
    return (
      <ScreenShell ribbon="// DIGIVICE // COMPANION_ROSTER" title="DIGIVICE_PETS">
        <div className="font-mono text-cyber-cyan/70 text-[12px] tracking-cyber">
          ▸ LOADING_ROSTER...
        </div>
      </ScreenShell>
    );
  }

  const ec = ELEMENT_COLOR[pet.element];
  const stageIdx = STAGES.indexOf(pet.stage);

  const onSelect = (p: PetCard) => {
    if (p.id !== ownedId) {
      toast.warn(`▸ ${p.name} LOCKED // hatch egg @ MARKET`);
      return;
    }
    setSelectedId(p.id);
    setHistory([]);
  };

  const onFeed = () => {
    if (credits < FEED_COST_CR) {
      toast.error(`▸ NEED ${FEED_COST_CR}CR // INSUFFICIENT CREDITS`);
      return;
    }
    addCredits(-FEED_COST_CR);
    addStamina(8);
    toast.success('▸ FED // -10 CR · +8⚡ +20XP');
  };

  const onSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatApi.loading) return;
    const time = nowHHmm();
    setHistory((h) => [...h, { who: 'me', text, time }]);
    setChatInput('');
    try {
      const res = await chatApi.run({
        petId: pet.id,
        message: text,
        persona: pet.element,
      });
      setHistory((h) => [...h, { who: 'pet', text: res.reply, time: nowHHmm() }]);
    } catch {
      toast.error('▸ CHAT_OFFLINE // ลองอีกครั้ง');
    }
  };

  return (
    <ScreenShell
      ribbon="// DIGIVICE // COMPANION_ROSTER"
      title="DIGIVICE_PETS"
      accent="violet"
    >
      {/* Status strip — LIVE indicator + data source + roster count.
          REFRESH button on the right re-runs the pets.list mock so
          users can see the latency + 4% failure rate in action. */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest2 text-white/55 flex-wrap">
          <span className="flex items-center gap-1.5 text-cyber-green">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse-dot" />
            LIVE
          </span>
          <span className="text-white/25">·</span>
          <span>MOCK_DATA</span>
          <span className="text-white/25">·</span>
          <span>{String(pets.length).padStart(2, '0')} COMPANIONS</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            refetch();
            toast.info('▸ REFRESHING_ROSTER...');
          }}
          className="!px-3.5 !py-2 !text-[10px]"
        >
          ↻ REFRESH
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* ROSTER */}
        <div className="hud p-3.5 h-fit">
          <div className="dl mb-3">
            // ROSTER // 01 OWNED · {String(pets.length - 1).padStart(2, '0')} LOCKED
          </div>
          <div className="flex flex-col gap-2.5">
            {pets.map((p) => {
              const c = ELEMENT_COLOR[p.element];
              const active = p.id === effectiveSelected;
              const isOwned = p.id === ownedId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="flex items-center gap-3 px-2.5 py-2 text-left transition-all disabled:cursor-not-allowed"
                  style={{
                    background: active ? `${c}15` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${active ? c : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: active
                      ? `inset 0 0 24px ${c}28, 0 0 16px ${c}44`
                      : 'none',
                    clipPath:
                      'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                    opacity: isOwned ? 1 : 0.42,
                    filter: isOwned ? 'none' : 'grayscale(.55)',
                    cursor: isOwned ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center shrink-0"
                    style={{
                      filter: isOwned ? `drop-shadow(0 0 8px ${c})` : 'none',
                    }}
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display font-bold text-[13px] text-white tracking-wider">
                        {p.name}
                      </span>
                      <span className="font-mono text-[9px] text-white/55">
                        LV{p.level}
                      </span>
                    </div>
                    <div
                      className="font-mono text-[9px] tracking-cyber mt-0.5"
                      style={{ color: c }}
                    >
                      {p.element} · {p.stage}
                    </div>
                    {isOwned && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1">
                          <Bar
                            value={p.hp}
                            max={p.hpMax}
                            height={3}
                            fillClassName={p.hp / p.hpMax < 0.35 ? '!bg-cyber-red' : '!bg-cyber-green'}
                          />
                        </div>
                        <span className="font-mono text-[8px] text-white/55">{p.hp}</span>
                      </div>
                    )}
                    {!isOwned && (
                      <div className="font-mono text-[9px] text-white/40 mt-1 tracking-wider">
                        🔒 LOCKED · 500 CR EGG
                      </div>
                    )}
                  </div>
                  {isOwned && (
                    <span
                      className="font-display text-[8px] px-1.5 py-0.5 tracking-wider"
                      style={{
                        background: 'rgba(74,222,128,0.14)',
                        border: '1px solid rgba(74,222,128,0.5)',
                        color: '#4ade80',
                      }}
                    >
                      OWNED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            onClick={() => toast.info('▸ HATCH_NEW_EGG // 500 CR // RESERVED')}
            className="!w-full !flex !justify-center !mt-3 !text-[10px]"
          >
            ▸ HATCH NEW EGG // 500 CR
          </Button>
        </div>

        {/* DETAIL */}
        <div className="flex flex-col gap-3.5">
          {/* Header strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="px-4 py-2 font-display font-bold tracking-widest2 text-[10px] text-cyber-cyan flex items-center gap-2"
              style={{
                background: 'rgba(34,211,238,0.10)',
                border: '1px solid rgba(34,211,238,0.55)',
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse-dot" />
              DIGIVICE · LINKED
            </div>
            <div
              className="font-display font-extrabold text-[15px] tracking-widest2"
              style={{ color: ec, filter: `drop-shadow(0 0 6px ${ec})` }}
            >
              {pet.nick}
            </div>
            <span className="flex-1" />
            <Pill variant="red">💎 {credits}</Pill>
            <Pill variant="violet">🪙 {totalScore.toLocaleString()}</Pill>
          </div>

          {/* Showcase */}
          <div
            className="hud relative overflow-hidden p-5"
            style={{
              minHeight: 360,
              borderColor: `${ec}55`,
              boxShadow: `inset 0 0 40px ${ec}1a`,
            }}
          >
            {/* Level chip */}
            <div
              className="absolute top-4 left-4 px-3 py-1.5 text-center z-[3]"
              style={{
                background: 'rgba(167,139,250,0.15)',
                border: '1px solid rgba(167,139,250,0.55)',
                clipPath:
                  'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                minWidth: 56,
              }}
            >
              <div className="font-mono text-[8px] text-white/60 tracking-widest2">LV</div>
              <div className="font-display font-extrabold text-[18px] text-cyber-violet leading-none">
                {pet.level}
              </div>
            </div>
            {/* Element tag */}
            <div
              className="absolute top-4 right-4 px-3 py-1.5 font-display font-extrabold text-[10px] tracking-widest2 z-[3]"
              style={{
                background: `${ec}20`,
                border: `1px solid ${ec}`,
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                color: ec,
                boxShadow: `0 0 14px ${ec}55`,
              }}
            >
              {pet.element}
            </div>

            {/* Pet portrait — webp from /public/assets/img/pets, animated
                float matches the design ref. Halo behind is element-colored. */}
            <div className="absolute inset-0 flex items-center justify-center z-[1]">
              <div
                className="absolute w-[300px] h-[300px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${ec}33 0%, ${ec}11 40%, transparent 70%)`,
                  filter: 'blur(14px)',
                }}
              />
              <img
                src={pet.image}
                alt={pet.nick}
                className="relative animate-hover-float w-[220px] sm:w-[280px] h-auto object-contain"
                style={{
                  filter: `drop-shadow(0 0 28px ${ec}aa) drop-shadow(0 0 50px ${ec}55)`,
                }}
              />
            </div>

            {/* Name plate */}
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 text-center z-[3]"
              style={{
                background: 'rgba(5,3,10,0.85)',
                border: `1px solid ${ec}`,
                clipPath:
                  'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                className="font-display font-extrabold text-[18px] sm:text-[22px] tracking-widest2 text-white"
                style={{ textShadow: `0 0 12px ${ec}` }}
              >
                {pet.name}
              </div>
              <div className="font-mono text-[9px] text-white/60 tracking-wider mt-0.5">
                {pet.stage.toLowerCase()} · {pet.element.toLowerCase()}
              </div>
            </div>
          </div>

          {/* Stats + chat + actions */}
          <div className="hud p-4">
            {/* Header row */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-10 h-10 flex items-center justify-center shrink-0"
                style={{ filter: `drop-shadow(0 0 6px ${ec})` }}
              >
                <img src={pet.image} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold text-[15px] text-white tracking-wider">
                    {pet.name}
                  </span>
                  <span className="font-mono text-[10px] text-white/55">LV{pet.level}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5 font-mono text-[9px] text-white/55 flex-wrap">
                  <span className="text-cyber-green inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse-dot" />
                    LIVE
                  </span>
                  <span style={{ color: pet.link ? 'var(--cy-cyan)' : 'rgba(255,255,255,0.4)' }}>
                    · {pet.link ? 'VOLT LINK' : 'NO LINK'}
                  </span>
                  <span>· SYNC {pet.sync}%</span>
                </div>
              </div>
              <Pill variant="violet">1 NEW</Pill>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-[1fr_1fr_70px] gap-2.5 mb-4">
              <StatLine label="HP" value={`${pet.hp}/${pet.hpMax}`} pct={(pet.hp / pet.hpMax) * 100} color="#FF6B8A" />
              <StatLine label="EN" value={`${pet.en}/${pet.enMax}`} pct={(pet.en / pet.enMax) * 100} color="#22D3EE" />
              <div
                className="px-2.5 py-1.5"
                style={{
                  background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
                }}
              >
                <div className="font-mono text-[8px] text-white/55 tracking-widest2">ATK</div>
                <div className="font-display font-extrabold text-[17px] text-cyber-gold">
                  {pet.atk}
                </div>
              </div>
            </div>

            {/* Digivolution track */}
            <div className="mb-4">
              <div className="font-mono text-[9px] text-cyber-cyan/65 tracking-widest2 mb-1.5">
                ◆ DIGIVOLUTION
                <span className="text-white/45 ml-2">{pet.stage}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {STAGES.map((s, i) => {
                  const reached = i <= stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div
                      key={s}
                      className="px-1.5 py-2 text-center font-display font-bold text-[8px] sm:text-[9px] tracking-cyber"
                      style={{
                        background: current
                          ? 'rgba(251,191,36,0.18)'
                          : reached
                          ? 'rgba(167,139,250,0.08)'
                          : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${current ? '#FBBF24' : reached ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        clipPath:
                          'polygon(6px 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 6px 100%, 0 50%)',
                        color: current
                          ? '#FBBF24'
                          : reached
                          ? 'var(--cy-violet)'
                          : 'rgba(255,255,255,0.35)',
                        boxShadow: current ? '0 0 14px rgba(251,191,36,0.5)' : 'none',
                      }}
                    >
                      {s}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Welcome bubble */}
            <ChatBubble line={{ who: 'pet', text: pet.msg, time: '23:08' }} color={ec} />

            {/* Chat history */}
            {history.map((line, i) => (
              <ChatBubble key={i} line={line} color={ec} />
            ))}

            {/* Action bar */}
            <div className="flex gap-2 flex-wrap mt-3">
              <PetActionBtn color="#FBBF24" icon="🍖" label="FEED" onClick={onFeed} />
              <PetActionBtn color="#FF35E6" icon="✨" label="SKILL" onClick={() => toast.info('▸ SKILL_BOOK // RESERVED')} />
              <PetActionBtn color="#FD1803" icon="⚔️" label="BATTLE" onClick={() => toast.info('▸ BATTLE_QUEUE // RESERVED')} />
              <PetActionBtn color="#22D3EE" icon="🔮" label="หัวมัย?" onClick={() => toast.info('▸ TIP: ' + pet.msg.slice(0, 30))} />
              <PetActionBtn color="#A78BFA" icon="🪙" label="เหรียญฉัน" onClick={() => toast.info(`▸ WALLET // ${credits} CR`)} />
            </div>

            {/* Chat input */}
            <div
              className="flex gap-2 items-center mt-3 px-3.5 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(34,211,238,0.25)',
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) onSendChat();
                }}
                placeholder={`คุยกับ ${pet.nick.toLowerCase()}…`}
                disabled={chatApi.loading}
                className="flex-1 bg-transparent border-0 outline-0 font-sans text-[13px] text-white"
              />
              <button
                onClick={onSendChat}
                disabled={!chatInput.trim() || chatApi.loading}
                aria-label="Send"
                className="w-8 h-8 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `${ec}25`,
                  border: `1px solid ${ec}`,
                  color: ec,
                  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─────────────────────────────────────────────────────────
function StatLine({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div
      className="px-3 py-1.5"
      style={{
        background: `${color}0a`,
        border: `1px solid ${color}3f`,
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
      }}
    >
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-[8px] text-white/55 tracking-widest2">{label}</span>
        <span className="font-display font-bold text-[13px]" style={{ color }}>{value}</span>
      </div>
      <div className="mt-1">
        <Bar value={pct} max={100} height={3} />
      </div>
    </div>
  );
}

function ChatBubble({
  line,
  color,
}: {
  line: ChatLine;
  color: string;
}) {
  const isMe = line.who === 'me';
  const tint = isMe ? 'rgba(34,211,238,0.10)' : `${color}10`;
  const border = isMe ? 'rgba(34,211,238,0.44)' : `${color}44`;
  const left = isMe ? 'rgba(34,211,238,1)' : color;
  const prefixColor = isMe ? '#22D3EE' : color;
  return (
    <div className="flex gap-2 mb-2.5">
      <span className="font-mono text-[9px] text-white/40 shrink-0 mt-1.5">{line.time}</span>
      <div
        className="flex-1 px-3.5 py-2.5 font-sans text-[13px] leading-[1.55] text-white/85"
        style={{
          background: tint,
          border: `1px solid ${border}`,
          borderLeft: `3px solid ${left}`,
          clipPath:
            'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
        }}
      >
        <span style={{ color: prefixColor, fontWeight: 600 }}>▸ </span>
        {line.text}
      </div>
    </div>
  );
}

function PetActionBtn({
  color,
  icon,
  label,
  onClick,
}: {
  color: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 cursor-pointer font-display font-bold text-[11px] tracking-cyber transition-all"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}66`,
        color,
        clipPath:
          'polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)',
        boxShadow: `inset 0 0 12px ${color}1a`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 0 16px ${color}33, 0 0 12px ${color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `inset 0 0 12px ${color}1a`;
      }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
