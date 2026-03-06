import React, { useState } from 'react';

export default function TrueStretchPage() {
  const [resolution, setResolution] = useState('1920x1080');
  const [stretchType, setStretchType] = useState<'4:3' | '5:4' | '16:10' | 'custom'>('4:3');
  const [customW, setCustomW] = useState('1280');
  const [customH, setCustomH] = useState('960');

  const presets = [
    { label: '4:3', res: '1280x960', fov: '90', desc: 'Classic CS stretch' },
    { label: '4:3', res: '1024x768', fov: '90', desc: 'Maximum stretch' },
    { label: '5:4', res: '1280x1024', fov: '90', desc: 'Slight stretch' },
    { label: '16:10', res: '1680x1050', fov: '103', desc: 'Wide stretch' },
  ];

  return (
    <div className="p-6 md:px-12">
      <h1 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">fitness_center</span>
        True Stretch
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm uppercase tracking-widest font-bold opacity-50 mb-4">Resolution Settings</h2>
          <div className="bg-card-dark border border-border-dark rounded-lg p-4 mb-4">
            <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold block mb-1">Current Resolution</span>
            <span className="font-mono text-2xl font-bold text-accent-cyan">{resolution}</span>
          </div>
          <div className="mb-4">
            <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold block mb-2">Stretch Ratio</span>
            <div className="flex gap-2">
              {(['4:3', '5:4', '16:10', 'custom'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setStretchType(type)}
                  className={`text-xs uppercase font-bold px-4 py-2 rounded border transition-colors ${
                    stretchType === type
                      ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30'
                      : 'bg-slate-800/50 text-white/40 border-slate-700/30 hover:text-white/60'
                  }`}
                >{type}</button>
              ))}
            </div>
          </div>
          {stretchType === 'custom' && (
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold block mb-1">Width</span>
                <input type="number" value={customW} onChange={(e) => setCustomW(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-white focus:border-accent-cyan/50 outline-none" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] uppercase tracking-wider opacity-40 font-bold block mb-1">Height</span>
                <input type="number" value={customH} onChange={(e) => setCustomH(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-white focus:border-accent-cyan/50 outline-none" />
              </div>
            </div>
          )}
          <button
            onClick={() => setResolution(stretchType === 'custom' ? `${customW}x${customH}` : (presets.find(p => p.label === stretchType)?.res ?? presets[0].res))}
            className="w-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 rounded py-2.5 text-sm uppercase font-bold tracking-wider hover:bg-accent-cyan/20 transition-colors"
          >Apply Stretch</button>
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-widest font-bold opacity-50 mb-4">Presets</h2>
          <div className="flex flex-col gap-2">
            {presets.map((preset, i) => (
              <div key={i} onClick={() => setResolution(preset.res)}
                className="flex items-center justify-between p-4 bg-card-dark border border-border-dark rounded-lg hover:border-accent-cyan/20 cursor-pointer transition-colors">
                <div>
                  <span className="font-bold text-sm">{preset.res}</span>
                  <span className="text-[10px] opacity-40 block mt-0.5">{preset.desc}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-[8px] uppercase opacity-40 block font-bold">Ratio</span>
                    <span className="text-xs font-bold text-accent-cyan/70">{preset.label}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[8px] uppercase opacity-40 block font-bold">FOV</span>
                    <span className="text-xs font-bold font-mono">{preset.fov}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
