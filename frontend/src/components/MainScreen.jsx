import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../utils/auth';
import ReportView from './ReportView';
import Sidebar from './Sidebar';
import Stepper from './Stepper';

const API_BASE = 'http://localhost:8000';

function MainScreen() {
    const [history, setHistory] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [executionResult, setExecutionResult] = useState(null);
    const [error, setError] = useState(null);

    // Get user from localStorage
    const getUser = () => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    // Fetch question history on mount
    const fetchHistory = useCallback(async () => {
        const user = getUser();
        if (!user?.id) return;
        try {
            const res = await authFetch(`${API_BASE}/questions/user/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data.reverse()); // newest first
            }
        } catch (err) {
            console.warn('Could not load history', err);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);


    // Handle metadata fetch — Phase 1: discover tables/columns
    const handleFetchMetadata = async (question) => {
        setMetadataLoading(true);
        setMetadata(null);
        setExecutionResult(null);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE}/questions/get_metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'error') {
                    setError(data.error || 'Metadata discovery returned an error');
                } else {
                    setMetadata(data.metadata);
                    setExecutionResult(data.execution_result || null);
                }
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.detail || 'Failed to fetch metadata');
            }
        } catch (err) {
            setError('Could not connect to the server');
        } finally {
            setMetadataLoading(false);
        }
    };

    // Handle stepper submission — call decision engine (Phase 2)
    const handleSubmit = async ({ question, restrictions, metadata: metadataFromStepper, llmModel }) => {
        setLoading(true);
        setError(null);
        try {
            // Build a rich prompt from stepper data
            let prompt = question;
            if (restrictions?.trim()) {
                prompt += `\n\nAdditional restrictions: ${restrictions}`;
            }

            const res = await authFetch(`${API_BASE}/questions/decide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: prompt,
                    metadata: metadataFromStepper || null,
                    llm_model: llmModel,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'error') {
                    setError(data.error || 'Decision engine returned an error');
                } else {
                    setSelectedQuestion({
                        title: question,
                        answer: data.answer,
                        restrictions,
                    });
                    // Refresh sidebar history so the new question appears
                    await fetchHistory();
                }
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.detail || 'Failed to get answer from decision engine');
            }
        } catch (err) {
            setError('Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setSelectedQuestion(null);
        setMetadata(null);
        setExecutionResult(null);
        setError(null);
    };

    const handleSelectQuestion = (q) => {
        setSelectedQuestion(q);
        setError(null);
    };

    const renderContent = () => {
        if (selectedQuestion) {
            return (
                <ReportView
                    question={selectedQuestion.title}
                    answer={selectedQuestion.answer}
                    restrictions={selectedQuestion.restrictions}
                    onNewQuery={handleNewChat}
                />
            );
        }

        if (loading) {
            return (
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-[#1e1e1e] rounded-xl p-10 border border-[#333] flex flex-col items-center gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-[#333] border-t-[#f47721] animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#f47721]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-1">Analyzing your question...</h3>
                            <p className="text-sm text-gray-400">
                                The AI is discovering relevant data and generating your answer.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full">
                {error && (
                    <div className="max-w-2xl mx-auto mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
                        {error}
                    </div>
                )}
                <Stepper
                    onSubmit={handleSubmit}
                    onFetchMetadata={handleFetchMetadata}
                    loading={loading}
                    metadataLoading={metadataLoading}
                    metadata={metadata}
                    executionResult={executionResult}
                />
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#242424] text-white">
            {/* Left sidebar */}
            <Sidebar
                history={history}
                onSelectQuestion={handleSelectQuestion}
                onNewChat={handleNewChat}
            />

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#1e1e1e]">
                    <h1 className="text-lg font-semibold">
                        <span className="text-[#f47721]">Denodo</span> Data Explorer
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                        </svg>
                        {getUser()?.username || 'User'}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default MainScreen;
