'use client';

import Modal from '@/components/ui/Modal';
import { useGameStore } from '@/store/gameStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AchievementsModal({ open, onClose }: Props) {
  const achievements = useGameStore((s) => s.achievements);
  const unlocked = achievements.filter((a) => a.unlockedAt).length;
  const total = achievements.length;

  return (
    <Modal open={open} onClose={onClose} title="ACHIEVEMENTS // VAULT">
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[11px] text-cyber-cyan">
            ▸ UNLOCKED {unlocked} / {total}
          </span>
          <div className="flex-1 h-1 bg-white/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyber-cyan to-cyber-violet"
              style={{ width: `${(unlocked / total) * 100}%` }}
            />
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {achievements.map((a) => {
            const isUnlocked = !!a.unlockedAt;
            return (
              <li
                key={a.id}
                className="p-2.5 transition"
                style={{
                  background: isUnlocked
                    ? 'rgba(251,191,36,0.07)'
                    : 'rgba(255,255,255,0.025)',
                  border: isUnlocked
                    ? '1px solid rgba(251,191,36,0.45)'
                    : '1px dashed rgba(255,255,255,0.12)',
                  opacity: isUnlocked ? 1 : 0.55,
                  filter: isUnlocked ? 'none' : 'grayscale(0.7)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[26px] leading-none shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display text-[11px] font-bold tracking-cyber truncate"
                      style={{ color: isUnlocked ? '#FBBF24' : 'rgba(255,255,255,0.5)' }}
                    >
                      {a.name}
                    </div>
                    <div className="font-mono text-[9px] text-white/55 mt-0.5 leading-[1.4]">
                      {a.description}
                    </div>
                    {isUnlocked && a.unlockedAt && (
                      <div className="font-mono text-[8px] text-cyber-gold/70 mt-1">
                        ▸ {new Date(a.unlockedAt).toLocaleDateString('th-TH', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button type="button" onClick={onClose} className="btn-cyber mt-1 self-stretch">
          ▸ CLOSE
        </button>
      </div>
    </Modal>
  );
}
