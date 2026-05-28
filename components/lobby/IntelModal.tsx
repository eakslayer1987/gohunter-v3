'use client';

import Modal from '@/components/ui/Modal';
import { TRIBES } from '@/data/tribes';

/** Scoring bands — kept in sync with lib/utils.ts scoreFromDistance.
 *  Hard-coded here (not imported) so the modal renders without
 *  pulling the score helper into client bundle. */
const BANDS = [
  { tier: 'S', range: '≤50m', base: 1000, color: '#FBBF24', label: 'BULLSEYE' },
  { tier: 'A', range: '≤200m', base: 800, color: '#22D3EE', label: 'EXCELLENT' },
  { tier: 'B', range: '≤500m', base: 500, color: '#A78BFA', label: 'GOOD' },
  { tier: 'C', range: '500m+', base: 100, color: '#FD7A6F', label: 'CLOSE' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Onboarding / cheatsheet modal that the VIEW_INTEL hero button
 *  opens. Covers the four scoring rules a new player needs to know:
 *  tribe bonus, distance bands, companion skill, pin/stamina economy. */
export default function IntelModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="HOW_TO_HUNT // PROTOCOL_BRIEF">
      <div className="flex flex-col gap-4 font-mono text-[11px] text-white/80 max-h-[70vh] overflow-y-auto pr-1">
        <p className="leading-[1.6]">
          ▸ ตามล่าเหรียญลับใน Bangkok Grid โดยอ่านเบาะแส, สำรวจ street view, แล้วปักหมุดบนแผนที่. คะแนนคำนวณจากระยะ pin ↔ target.
        </p>

        <section>
          <div className="dl mb-2">// TRIBES — ผลต่อโบนัสคะแนน</div>
          <div className="grid grid-cols-2 gap-2">
            {TRIBES.map((t) => (
              <div
                key={t.id}
                className="p-2"
                style={{
                  border: `1px solid ${t.color}66`,
                  background: `${t.color}10`,
                }}
              >
                <div className="text-base">
                  {t.emoji}{' '}
                  <span
                    className="font-display tracking-cyber text-[12px]"
                    style={{ color: t.color }}
                  >
                    {t.name}
                  </span>
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: `${t.color}cc` }}>
                  {t.bonusLabel}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="dl mb-2">// SCORING_BANDS</div>
          {BANDS.map((b) => (
            <div
              key={b.tier}
              className="flex justify-between py-1 border-b border-white/5 last:border-0"
            >
              <span style={{ color: b.color }} className="font-display text-[11px]">
                ▸ TIER_{b.tier} · {b.label}
              </span>
              <span className="text-white/55 tabular-nums">
                {b.range} · base {b.base}
              </span>
            </div>
          ))}
          <div className="text-[9px] text-white/45 mt-1.5">
            + SPEED / NO_HINT / STREAK / TRIBE bonuses stack on top
          </div>
        </section>

        <section>
          <div className="dl mb-2">// COMPANION_SKILL</div>
          <div
            className="px-3 py-2"
            style={{
              border: '1px solid rgba(34,211,238,0.4)',
              background: 'rgba(34,211,238,0.05)',
            }}
          >
            <div className="font-display text-cyber-cyan text-[11px] mb-1">
              🐱 RADAR_SCAN
            </div>
            <div className="text-[10px] text-white/65">
              เผยโซน 500m รอบเหรียญใน 5 วินาที · cooldown 120s
            </div>
          </div>
        </section>

        <section>
          <div className="dl mb-2">// PIN_ENERGY</div>
          <div className="text-[10px] text-white/65 leading-[1.6]">
            ▸ มี <span className="text-cyber-cyan">20 แต้ม</span> ต่อรอบ — drag pin{' '}
            <span className="text-cyber-cyan">-1 ต่อทุก 100m</span>. รีเซ็ตทุก mission ใหม่
          </div>
        </section>

        <section>
          <div className="dl mb-2">// STAMINA</div>
          <div className="text-[10px] text-white/65 leading-[1.6]">
            ▸ regen <span className="text-cyber-green">+1 ทุก 5 นาที</span>. แหล่งเติม: feed companion (
            <span className="text-cyber-gold">-10CR</span> →{' '}
            <span className="text-cyber-cyan">+8⚡</span>), daily login (
            <span className="text-cyber-cyan">+15⚡</span>), DEV_REFILL (
            <span className="text-cyber-cyan">+max⚡</span>)
          </div>
        </section>

        <button type="button" onClick={onClose} className="btn-cyber mt-2 self-stretch">
          ▸ CLOSE
        </button>
      </div>
    </Modal>
  );
}
