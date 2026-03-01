import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { authFetch } from '../utils/auth';

/* Custom markdown components (kept outside render to avoid re-creation) */
const mdComponents = {
    table: ({ children }) => (
        <div className="report-table-wrap">
            <table>{children}</table>
        </div>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
};

/**
 * ReportView — renders the AI analysis as an elegant, exportable document.
 * Designed for decision-making reports, not chat bubbles.
 */
function ReportView({ questionId, question, answer, restrictions, like, onLikeChange, onNewQuery, temporary }) {
    const reportRef = useRef(null);

    const handleLike = async (value) => {
        if (!questionId) return;
        try {
            await authFetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/questions/${questionId}/like?like=${value}`, {
                method: 'PATCH',
            });
            onLikeChange(value);
        } catch (e) {
            console.error('Failed to update like', e);
        }
    };

    const timestamp = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const handlePrint = () => {
        globalThis.print();
    };

    const handleCopyText = async () => {
        if (!reportRef.current) return;
        try {
            await navigator.clipboard.writeText(reportRef.current.innerText);
        } catch {
            /* fallback: select text */
            const range = document.createRange();
            range.selectNodeContents(reportRef.current);
            const sel = globalThis.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    return (
        <div className="report-wrapper w-full max-w-4xl mx-auto animate-fade-in">
            {/* ── Toolbar (hidden on print) ── */}
            <div className="no-print flex items-center justify-between mb-4 px-1">
                <button
                    onClick={onNewQuery}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors border border-[#333]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Query
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyText}
                        title="Copy to clipboard"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors border border-[#333]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                    </button>
                    <button
                        onClick={handlePrint}
                        title="Export as PDF / Print"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1e1e1e] transition-colors border border-[#333]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>

            {/* ── Document ── */}
            <article ref={reportRef} className="report-document">
                {/* Document header */}
                <header className="report-header">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f47721] to-[#e06610] flex items-center justify-center flex-shrink-0 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="report-title">Data Analysis Report</h1>
                            <p className="report-subtitle">Denodo AI-Powered Decision Support</p>
                        </div>
                    </div>

                    <div className="report-meta">
                        <div className="report-meta-item">
                            <span className="report-meta-label">Generated</span>
                            <span className="report-meta-value">{timestamp}</span>
                        </div>
                        <div className="report-meta-item">
                            <span className="report-meta-label">Engine</span>
                            <span className="report-meta-value">Denodo AI SDK</span>
                        </div>
                    </div>
                </header>

                {/* Divider */}
                <hr className="report-divider" />

                {/* Query section */}
                <section className="report-section">
                    <h2 className="report-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Query
                    </h2>
                    <blockquote className="report-blockquote">{question}</blockquote>

                    {restrictions && (
                        <div className="report-restrictions">
                            <span className="report-restrictions-label">Applied constraints:</span>
                            <span className="report-restrictions-text">{restrictions}</span>
                        </div>
                    )}
                </section>

                {/* Divider */}
                <hr className="report-divider-light" />

                {/* Analysis / Answer section */}
                <section className="report-section">
                    <h2 className="report-section-title">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analysis
                    </h2>
                    <div className="report-prose">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={mdComponents}
                        >
                            {answer || '_No data returned._'}
                        </ReactMarkdown>
                    </div>
                </section>

                {/* Footer */}
                <footer className="report-footer">
                    {temporary && (
                        <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                            Temporary query — this report will not be saved to your history.
                        </div>
                    )}
                    {!temporary && (
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                            onClick={() => handleLike(true)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors border ${
                                like === true
                                    ? 'bg-green-600/20 border-green-500 text-green-400'
                                    : 'border-[#333] text-gray-400 hover:text-green-400 hover:border-green-500'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                            </svg>
                            Like
                        </button>
                        <button
                            onClick={() => handleLike(false)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors border ${
                                like === false
                                    ? 'bg-red-600/20 border-red-500 text-red-400'
                                    : 'border-[#333] text-gray-400 hover:text-red-400 hover:border-red-500'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                            </svg>
                            Dislike
                        </button>
                    </div>
                    )}
                    <p>
                        This report was automatically generated by the <strong>Denodo AI Decision Engine</strong>.
                        Data sourced via Denodo logical data fabric. Results should be validated before critical decision-making.
                    </p>
                </footer>
            </article>
        </div>
    );
}

export default ReportView;
