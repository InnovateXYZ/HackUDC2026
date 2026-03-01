import { useEffect } from 'react';

const teamMembers = [
    {
        name: 'Sergio Goyanes Legazpi',
        github: 'sergio-legazpi',
    },
    {
        name: 'Alexandre Borrazás Mancebo',
        github: 'alexborrazasm',
    },
    {
        name: 'Mario Lamas Angeriz',
        github: 'Choped7626',
    },
    {
        name: 'Daniel Garcia Figeroa',
        github: 'gitdfigueroa',
    },
];

function AboutModal({ open, onClose }) {
    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        globalThis.addEventListener('keydown', handleKey);
        return () => globalThis.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="About K2 Platform"
        >
            <div
                className="bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="document"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-[#333] shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-[#f47721]">K2</span> Platform
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#2a2a2a]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4 overflow-y-auto">
                    {/* Project description */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About</h3>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            <strong className="text-white">K2 Platform</strong> is an advanced data orchestration and intelligence hub
                            developed for <strong className="text-[#f47721]">HackUDC 2026</strong>. It bridges the gap between raw,
                            siloed data and actionable insights by combining{' '}
                            <strong className="text-white">Data Virtualization</strong> with{' '}
                            <strong className="text-white">Generative AI</strong>.
                        </p>
                        <p className="text-sm text-gray-400 leading-relaxed mt-1.5">
                            The platform abstracts complex data sources using Denodo, processes them via a high-performance
                            FastAPI backend, and delivers a real-time experience through a modern React frontend and
                            Grafana dashboards.
                        </p>
                    </div>

                    {/* Key features */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Key Features</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: '🛠️', label: 'Data Virtualization' },
                                { icon: '🤖', label: 'AI-Driven Insights' },
                                { icon: '📊', label: 'Live Observability' },
                                { icon: '⚡', label: 'Modern Interface' },
                            ].map((feature) => (
                                <div
                                    key={feature.label}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#333] text-sm text-gray-300"
                                >
                                    <span>{feature.icon}</span>
                                    {feature.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                            Team — InnovateXYZ
                        </h3>
                        <div className="space-y-1.5">
                            {teamMembers.map((member) => (
                                <a
                                    key={member.github}
                                    href={`https://github.com/${member.github}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#333] hover:border-[#f47721]/50 hover:bg-[#2a2a2a]/80 transition-colors group"
                                >
                                    <img
                                        src={`https://github.com/${member.github}.png?size=80`}
                                        alt={member.name}
                                        className="w-8 h-8 rounded-full border border-[#444] group-hover:border-[#f47721] transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500 group-hover:text-[#f47721] transition-colors">
                                            @{member.github}
                                        </p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 group-hover:text-[#f47721] transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-2.5 border-t border-[#333] flex items-center justify-between shrink-0">
                    <p className="text-xs text-gray-500">
                        HackUDC 2026 — No sleep, just code. 🦁
                    </p>
                    <a
                        href="https://github.com/InnovateXYZ/HackUDC2026"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#f47721] hover:underline"
                    >
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    );
}

export default AboutModal;
