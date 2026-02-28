import { useRef, useState } from 'react';

const STEP_LABELS = ['Question', 'Data & Filters'];

const LLM_MODELS = [
    { value: 'gemma-3-27b-it', label: 'Gemma 3.0 27B (Default)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
];

function Stepper({ onSubmit, onFetchMetadata, loading, metadataLoading, metadata, executionResult }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [restrictions, setRestrictions] = useState('');
    const [llmModel, setLlmModel] = useState('gemma-3-27b-it');

    // voice recognition state
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const startVoice = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Tu navegador no soporta reconocimiento de voz');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuestion((prev) =>
                prev ? prev + ' ' + transcript : transcript
            );
        };

        recognition.start();
        recognitionRef.current = recognition;
    };

    const canNext = () => {
        if (currentStep === 0) return question.trim() !== '';
        return false;
    };

    const handleNext = () => {
        if (currentStep === 0 && canNext()) {
            // Trigger metadata fetch when moving from Question to Data & Filters
            onFetchMetadata(question);
            setCurrentStep(1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const handleSubmit = () => {
        onSubmit({
            question,
            restrictions,
            metadata,
            llmModel,
        });
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Step indicators */}
            <div className="flex items-center mb-8">
                {STEP_LABELS.map((label, idx) => (
                    <div key={label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                            <button
                                onClick={() => {
                                    if (idx < currentStep) setCurrentStep(idx);
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${idx < currentStep
                                    ? 'bg-[#f47721] text-white cursor-pointer'
                                    : idx === currentStep
                                        ? 'bg-[#f47721] text-white ring-2 ring-[#f4772155] ring-offset-2 ring-offset-[#242424]'
                                        : 'bg-[#333] text-gray-400'
                                    }`}
                            >
                                {idx < currentStep ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                        IndentationError: expected an indented block after 'try' statement on line                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    idx + 1
                                )}
                            </button>
                            <span
                                className={`mt-2 text-xs font-medium ${idx <= currentStep ? 'text-white' : 'text-gray-500'
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                        {idx < STEP_LABELS.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 mx-2 mt-[-18px] ${idx < currentStep ? 'bg-[#f47721]' : 'bg-[#333]'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333] min-h-[500px] flex flex-col">
                {/* Step 0: Analytical Question */}
                {currentStep === 0 && (
                    <div className="flex-1 flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white">Analytical Question</h3>
                        <p className="text-sm text-gray-400">
                            Describe what you want to analyze. Be as specific as possible about the insights you're looking for.
                        </p>
                        <div className="flex-1 flex flex-col relative">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. Which countries won the most gold medals in swimming events? Show me a breakdown by year and compare the top 5 nations."
                                rows={6}
                                className="w-full flex-1 px-4 py-3 rounded-lg border border-[#444] bg-[#2a2a2a] text-white outline-none focus:border-[#f47721] transition-colors resize-none placeholder:text-gray-500"
                            />

                            {/* 🎤 Botón micrófono */}
                            <button
                                type="button"
                                onClick={startVoice}
                                className={`absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all
                                    ${listening
                                        ? 'bg-red-500 animate-pulse'
                                        : 'bg-[#f47721] hover:bg-[#ff9f56]'
                                    }`}
                                title="Hablar"
                            >
                                🎤
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Data & Filters — views + restrictions merged */}
                {currentStep === 1 && (
                    <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                        {/* Top: Views & Columns */}
                        <div>
                            <h3 className="text-lg font-semibold text-white">Relevant Data Views</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                These are the views available. Review them and optionally add filters below.
                            </p>
                        </div>

                        {metadataLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-[#333] border-t-[#f47721] animate-spin" />
                                <p className="text-sm text-gray-400">Discovering relevant data schema...</p>
                            </div>
                        ) : executionResult?.views?.length > 0 ? (
                            <>
                                {/* View cards */}
                                <div className="overflow-y-auto max-h-[260px] pr-1 space-y-3 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                                    {executionResult.views.map((view) => {
                                        const viewData = view.view_json || {};
                                        const viewName = (view.view_name || viewData.tableName || 'Unknown View').split('.').pop();
                                        const description = viewData.description || '';
                                        const columns = viewData.columns || [];

                                        // Parse columns from view_text if view_json doesn't have them
                                        let parsedColumns = columns;
                                        if (parsedColumns.length === 0 && view.view_text) {
                                            const colMatches = view.view_text.matchAll(/^- (\w+) \((\w+)\) -> (.+)$/gm);
                                            parsedColumns = [...colMatches].map(m => ({
                                                name: m[1],
                                                type: m[2],
                                                description: m[3].replace(/\.\.$/, ''),
                                            }));
                                        }

                                        return (
                                            <div
                                                key={view.view_name}
                                                className="rounded-lg border border-[#3a3a3a] bg-[#2a2a2a] overflow-hidden"
                                            >
                                                {/* View header */}
                                                <div className="px-4 py-3 bg-gradient-to-r from-[#f47721]/10 to-transparent border-b border-[#3a3a3a]">
                                                    <div className="flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#f47721] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                                        </svg>
                                                        <h4 className="text-sm font-semibold text-white capitalize">
                                                            {viewName.trim()}
                                                        </h4>
                                                    </div>
                                                    {description && (
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{description}</p>
                                                    )}
                                                </div>

                                                {/* Columns as tags */}
                                                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                                                    {parsedColumns.map((col) => {
                                                        const colName = col.name || col;
                                                        const colType = col.type || '';
                                                        const colDesc = col.description || '';
                                                        return (
                                                            <span
                                                                key={colName}
                                                                title={colDesc ? `${colName} (${colType}): ${colDesc}` : `${colName} (${colType})`}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-[#333] text-gray-300 border border-[#444] hover:border-[#f47721]/50 hover:text-white transition-colors cursor-default"
                                                            >
                                                                <span className="text-[#f47721]/70 text-[10px] uppercase">{colType}</span>
                                                                {colName}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-[#333]" />

                                {/* Bottom: Restrictions & LLM model */}
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Additional Restrictions</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Add constraints in natural language to refine your analysis (optional).
                                        </p>
                                    </div>
                                    <textarea
                                        value={restrictions}
                                        onChange={(e) => setRestrictions(e.target.value)}
                                        placeholder="e.g. Only include results between 1970 and 1990, exclude team sports, focus on European countries..."
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-[#444] bg-[#333] text-white text-sm outline-none focus:border-[#f47721] transition-colors resize-none placeholder:text-gray-500"
                                    />

                                    {/* LLM Model Selection */}
                                    <div className="flex items-center gap-3">
                                        <label htmlFor="llm-select" className="text-sm font-semibold text-white whitespace-nowrap">
                                            AI Model
                                        </label>
                                        <select
                                            id="llm-select"
                                            value={llmModel}
                                            onChange={(e) => setLlmModel(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#f47721] bg-[#2a2a2a] text-white text-sm outline-none focus:border-[#ff9f56] transition-colors"
                                        >
                                            {LLM_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : metadata ? (
                            /* Fallback: show raw metadata if no structured views */
                            <>
                                <div className="flex-1 overflow-y-auto rounded-lg border border-[#444] bg-[#2a2a2a] p-4 max-h-[200px]">
                                    <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                                        {metadata}
                                    </pre>
                                </div>

                                <div className="border-t border-[#333]" />

                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">Additional Restrictions</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Add constraints in natural language to refine your analysis (optional).
                                        </p>
                                    </div>
                                    <textarea
                                        value={restrictions}
                                        onChange={(e) => setRestrictions(e.target.value)}
                                        placeholder="e.g. Only include results between 1970 and 1990, exclude team sports..."
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-[#444] bg-[#333] text-white text-sm outline-none focus:border-[#f47721] transition-colors resize-none placeholder:text-gray-500"
                                    />

                                    <div className="flex items-center gap-3">
                                        <label htmlFor="llm-select-fallback" className="text-sm font-semibold text-white whitespace-nowrap">
                                            AI Model
                                        </label>
                                        <select
                                            id="llm-select-fallback"
                                            value={llmModel}
                                            onChange={(e) => setLlmModel(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#f47721] bg-[#2a2a2a] text-white text-sm outline-none focus:border-[#ff9f56] transition-colors"
                                        >
                                            {LLM_MODELS.map((model) => (
                                                <option key={model.value} value={model.value}>
                                                    {model.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-sm text-red-400">No metadata available. Go back and try again.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#333]">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentStep === 0
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                    </button>

                    {currentStep < 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canNext() || metadataLoading}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${canNext() && !metadataLoading
                                ? 'bg-[#f47721] text-white hover:bg-[#e06610]'
                                : 'bg-[#333] text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${!loading
                                ? 'bg-[#f47721] text-white hover:bg-[#e06610]'
                                : 'bg-[#333] text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Analyzing…
                                </>
                            ) : (
                                <>
                                    Submit
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Stepper;
