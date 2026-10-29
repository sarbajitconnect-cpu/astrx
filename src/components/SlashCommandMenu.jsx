import React from 'react';
import { 
  Globe, 
  FlaskConical, 
  Sparkles, 
  CornerDownLeft
} from 'lucide-react';

export const SLASH_COMMANDS = [
  {
    id: 'temporary',
    command: '/temporary',
    aliases: ['/temp', '/incognito'],
    title: 'Temporary chat',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
        <path d="M16.4961 20.3687C18.3643 19.362 19.6215 20.2979 20.7302 20.4658C20.8984 20.4913 21.0659 20.4302 21.1861 20.31C21.3687 20.1274 21.4034 19.8451 21.3026 19.6074C21.0386 18.9852 20.7877 18.0249 20.7528 17M10.4961 2.61775C10.9847 2.54025 11.4857 2.5 11.9961 2.5C12.5065 2.5 13.0075 2.54025 13.4961 2.61775M6.42502 4.30418C5.61082 4.89461 4.89392 5.61108 4.30312 6.42496M2.61382 10.5C2.53632 10.9886 2.49612 11.4896 2.49612 12C2.49612 12.5104 2.53632 13.0114 2.61382 13.5M4.30312 17.575C4.89392 18.3889 5.61072 19.1053 6.42492 19.6958M10.4961 21.3822C10.9847 21.4597 11.4857 21.5 11.9961 21.5C12.5065 21.5 13.0075 21.4597 13.4961 21.3822M21.3783 13.5C21.4558 13.0114 21.4961 12.5104 21.4961 12C21.4961 11.4896 21.4558 10.9886 21.3783 10.5M19.6919 6.42883C19.1014 5.61464 18.385 4.89781 17.5711 4.30699" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    action: ({ onToggleTemporaryChat }) => {
      onToggleTemporaryChat?.(true);
    }
  },
  {
    id: 'search',
    command: '/search',
    aliases: ['/web', '/google'],
    title: 'Web search',
    icon: <Globe size={13} className="text-white/80" />,
    action: ({ onToggleWebSearch }) => {
      onToggleWebSearch?.();
    }
  },
  {
    id: 'research',
    command: '/research',
    aliases: ['/study', '/paper', '/deep'],
    title: 'Deep research',
    icon: <FlaskConical size={13} className="text-white/80" />,
    action: ({ onToggleResearchMode }) => {
      onToggleResearchMode?.();
    }
  }
];

export default function SlashCommandMenu({
  isOpen,
  query = '',
  selectedIndex = 0,
  isLight = false,
  onSelectCommand,
  handlers = {}
}) {
  if (!isOpen) return null;

  const cleanQuery = query.startsWith('/') ? query.slice(1).toLowerCase().trim() : query.toLowerCase().trim();

  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanQuery) return true;
    return (
      cmd.id.includes(cleanQuery) ||
      cmd.command.includes(cleanQuery) ||
      cmd.title.toLowerCase().includes(cleanQuery) ||
      cmd.aliases.some(a => a.includes(cleanQuery))
    );
  });

  if (filtered.length === 0) return null;

  return (
    <div
      className={`mb-2 self-start rounded-[20px] p-1 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none text-xs font-victor ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 26, 30, 0.88)',
        backdropFilter: 'blur(30px) saturate(130%)',
        WebkitBackdropFilter: 'blur(30px) saturate(130%)',
        border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLight ? '0 16px 36px -8px rgba(0, 0, 0, 0.12)' : '0 16px 36px -8px rgba(0, 0, 0, 0.6)'
      }}
    >
      <div className="flex flex-col gap-0.5">
        {filtered.map((item, index) => {
          const isSelected = index === selectedIndex % filtered.length;
          return (
            <div
              key={item.id}
              onClick={() => onSelectCommand(item)}
              className={`flex items-center justify-between gap-4 px-3 py-1.5 rounded-[15px] transition-all cursor-pointer ${
                isSelected 
                  ? (isLight ? 'bg-slate-100 text-slate-950 font-medium' : 'bg-white/15 text-white') 
                  : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-50' : 'text-white/70 hover:text-white hover:bg-white/10')
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`flex items-center justify-center shrink-0 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>
                  {item.icon}
                </span>
                <span className="text-[12.5px] font-normal tracking-wide">
                  {item.title}
                </span>
              </div>

              <span className={`text-[11px] font-mono shrink-0 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                {item.command}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

