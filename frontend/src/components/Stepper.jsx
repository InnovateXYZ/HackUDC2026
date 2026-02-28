import { useEffect, useMemo, useState } from 'react';
import DATASETS from '../utils/datasets';

const STEP_LABELS = ['Question', 'Filters'];

function Stepper({ onSubmit, loading }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [question, setQuestion] = useState('');
    const [restrictions, setRestrictions] = useState('');
    const [columnSearch, setColumnSearch] = useState('');

    // For each dataset, track which columns are selected (all by default)
    const [tableColumns, setTableColumns] = useState({});

    const datasetNames = useMemo(() => Object.keys(DATASETS), []);

    // Initialize all columns as selected for all datasets
    useEffect(() => {
        const initialState = {};
        datasetNames.forEach((name) => {
            initialState[name] = [...DATASETS[name]];
        });
        setTableColumns(initialState);
    }, [datasetNames]);

    const canNext = () => {
        if (currentStep === 0) return question.trim() !== '';
        if (currentStep === 1) {
            // At least one column must be selected in any table
            return Object.values(tableColumns).some((cols) => cols.length > 0);
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep < 1) setCurrentStep((s) => s + 1);
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep((s) => s - 1);
    };

    const toggleColumn = (dataset, col) => {
        setTableColumns((prev) => {
            const current = prev[dataset] || [];
            if (current.includes(col)) {
                return { ...prev, [dataset]: current.filter((c) => c !== col) };
            } else {
                return { ...prev, [dataset]: [...current, col] };
            }
        });
    };

    const toggleAllForDataset = (dataset) => {
        setTableColumns((prev) => {
            const allCols = DATASETS[dataset];
            const current = prev[dataset] || [];
            if (current.length === allCols.length) {
                return { ...prev, [dataset]: [] };
            } else {
                return { ...prev, [dataset]: [...allCols] };
            }
        });
    };

    const getFilteredColumns = (dataset) => {
        const allCols = DATASETS[dataset] || [];
        if (!columnSearch.trim()) return allCols;
        const q = columnSearch.toLowerCase();
        return allCols.filter((c) => c.toLowerCase().includes(q));
    };

    const handleSubmit = () => {
        if (!canNext()) return;
        onSubmit({
            question,
            tableColumns,
            restrictions,
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333] min-h-[400px] flex flex-col">
                {/* Step 0: Analytical Question */}
                {currentStep === 0 && (
                    <div className="flex-1 flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-white">Analytical Question</h3>
                        <p className="text-sm text-gray-400">
                            Describe what you want to analyze. Be as specific as possible about the insights you're looking for.
                        </p>
                        <div className="flex-1 flex flex-col">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. Which countries won the most gold medals in swimming events? Show me a breakdown by year and compare the top 5 nations."
                                rows={6}
                                className="w-full flex-1 px-4 py-3 rounded-lg border border-[#444] bg-[#2a2a2a] text-white outline-none focus:border-[#f47721] transition-colors resize-none placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                )}

                {/* Step 1: Filters */}
                {currentStep === 1 && (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Filters</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Select the columns to include in your analysis. All columns are selected by default.
                            </p>
                        </div>

                        {/* Search columns */}
                        <input
                            type="text"
                            placeholder="Search columns across all tables…"
                            value={columnSearch}
                            onChange={(e) => setColumnSearch(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[#444] bg-[#2a2a2a] text-white text-sm outline-none focus:border-[#f47721] transition-colors"
                        />

                        {/* Tables with columns */}
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                            {datasetNames.map((dataset) => {
                                const allCols = DATASETS[dataset];
                                const selectedCols = tableColumns[dataset] || [];
                                const filteredCols = getFilteredColumns(dataset);

                                if (filteredCols.length === 0) return null;

                                return (
                                    <div key={dataset} className="border border-[#444] rounded-lg overflow-hidden">
                                        {/* Table header */}
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-[#444]">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#f47721]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium text-white text-sm">
                                                    {dataset.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({selectedCols.length}/{allCols.length})
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleAllForDataset(dataset)}
                                                className="text-xs text-[#f47721] hover:text-[#ff9f56] transition-colors"
                                            >
                                                {selectedCols.length === allCols.length ? 'Deselect all' : 'Select all'}
                                            </button>
                                        </div>
                                        {/* Columns */}
                                        <div className="p-3 bg-[#1e1e1e]">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
                                                {filteredCols.map((col) => (
                                                    <label
                                                        key={col}
                                                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${selectedCols.includes(col)
                                                            ? 'bg-[#f4772120] text-white'
                                                            : 'text-gray-400 hover:bg-[#2a2a2a]'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCols.includes(col)}
                                                            onChange={() => toggleColumn(dataset, col)}
                                                            className="accent-[#f47721] h-3 w-3 rounded"
                                                        />
                                                        <span className="truncate">{col}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Natural language restrictions */}
                        <div className="border-t border-[#333] pt-4">
                            <label className="block text-sm font-medium text-white mb-2">
                                Additional Restrictions (optional)
                            </label>
                            <p className="text-xs text-gray-400 mb-2">
                                Add constraints in natural language to filter your results.
                            </p>
                            <textarea
                                value={restrictions}
                                onChange={(e) => setRestrictions(e.target.value)}
                                placeholder="e.g. Only include results between 1970 and 1990, exclude team sports, focus on European countries..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-[#444] bg-[#2a2a2a] text-white text-sm outline-none focus:border-[#f47721] transition-colors resize-none placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                )}                {/* Navigation buttons */}
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
                            disabled={!canNext()}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${canNext()
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
                            disabled={!canNext() || loading}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${canNext() && !loading
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
