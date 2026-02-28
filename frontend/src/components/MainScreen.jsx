import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '../utils/auth';
import Sidebar from './Sidebar';
import Stepper from './Stepper';

const API_BASE = 'http://localhost:8000';

function MainScreen() {
    const [history, setHistory] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
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


    // Handle stepper submission
    const handleSubmit = async ({ dataset, columns, title }) => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE}/questions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    answers: [],
                    dataset,
                    columns,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedQuestion(data);
                // Refresh history
                await fetchHistory();
            } else {
                const err = await res.json().catch(() => ({}));
                setError(err.detail || 'Failed to submit question');
            }
        } catch (err) {
            setError('Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setSelectedQuestion(null);
        setError(null);
    };

    const handleSelectQuestion = (q) => {
        setSelectedQuestion(q);
        setError(null);
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
                <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
                    {/* Metadata preview removed to avoid failing network call on mount */}
                    {selectedQuestion ? (
                        /* Show selected / submitted question detail */
                        <div className="w-full max-w-2xl mx-auto">
                            <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#333]">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedQuestion.title}
                                    </h3>
                                    <button
                                        onClick={handleNewChat}
                                        className="text-xs text-gray-400 hover:text-[#f47721] transition-colors"
                                    >
                                        + New query
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                                            Dataset
                                        </span>
                                        <p className="text-sm text-[#f47721] mt-0.5">
                                            {selectedQuestion.dataset?.replace(/_/g, ' ')}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                                            Columns
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {selectedQuestion.columns?.map((col) => (
                                                <span
                                                    key={col}
                                                    className="inline-block px-2 py-0.5 rounded-full bg-[#f4772130] text-[#f47721] text-xs"
                                                >
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedQuestion.answers &&
                                        selectedQuestion.answers.length > 0 && (
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wider">
                                                    Answers
                                                </span>
                                                <div className="mt-1 space-y-1">
                                                    {selectedQuestion.answers.map((a, i) => (
                                                        <p key={i} className="text-sm text-gray-200 bg-[#2a2a2a] px-3 py-2 rounded-lg">
                                                            {a}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Stepper for new query */
                        <div className="w-full">
                            {error && (
                                <div className="max-w-2xl mx-auto mb-4 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}
                            <Stepper onSubmit={handleSubmit} loading={loading} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default MainScreen;
