import { useCallback, useEffect, useRef, useState } from 'react';
import { authFetch } from '../utils/auth';
import { createFolder, deleteFolder, fetchFolders, moveQuestionToFolder, renameFolder } from '../utils/folders';
import AboutModal from './AboutModal';
import ProfileModal from './ProfileModal';
import ReportView from './ReportView';
import Sidebar from './Sidebar';
import Stepper from './Stepper';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function MainScreen() {
    const [history, setHistory] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [metadataLoading, setMetadataLoading] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [executionResult, setExecutionResult] = useState(null);
    const [error, setError] = useState(null);
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const userMenuRef = useRef(null);

    // Get user from localStorage
    const getUser = () => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    // Load user on mount and fetch fresh data from API
    useEffect(() => {
        const localUser = getUser();
        setCurrentUser(localUser);

        // Fetch fresh user data from API
        authFetch(`${API_BASE}/me`)
            .then(async (res) => {
                if (res.ok) {
                    const freshUser = await res.json();
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setCurrentUser(freshUser);
                }
            })
            .catch(() => { /* keep localStorage version */ });
    }, []);

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

    // Fetch folders on mount
    const loadFolders = useCallback(async () => {
        try {
            const data = await fetchFolders();
            setFolders(data);
        } catch (err) {
            console.warn('Could not load folders', err);
        }
    }, []);

    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    // Close user menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    // Folder handlers
    const handleCreateFolder = async (name) => {
        try {
            await createFolder(name);
            await loadFolders();
        } catch (err) {
            console.warn('Could not create folder', err);
        }
    };

    const handleRenameFolder = async (folderId, name) => {
        try {
            await renameFolder(folderId, name);
            await loadFolders();
        } catch (err) {
            console.warn('Could not rename folder', err);
        }
    };

    const handleDeleteFolder = async (folderId) => {
        try {
            await deleteFolder(folderId);
            await loadFolders();
            await fetchHistory(); // refresh questions since folder_id may have changed
        } catch (err) {
            console.warn('Could not delete folder', err);
        }
    };

    const handleMoveQuestion = async (questionId, folderId) => {
        try {
            await moveQuestionToFolder(questionId, folderId);
            await fetchHistory(); // refresh to reflect new folder assignment
        } catch (err) {
            console.warn('Could not move question', err);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            const res = await authFetch(`${API_BASE}/questions/${questionId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                // If the deleted question is currently selected, go back to new chat
                if (selectedQuestion?.id === questionId) {
                    setSelectedQuestion(null);
                    setMetadata(null);
                    setExecutionResult(null);
                    setError(null);
                }
                await fetchHistory();
            }
        } catch (err) {
            console.warn('Could not delete question', err);
        }
    };


    // Handle metadata fetch — Phase 1: discover tables/columns
    const handleFetchMetadata = async (question, selectedDatasets) => {
        setMetadataLoading(true);
        setMetadata(null);
        setExecutionResult(null);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE}/questions/get_metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, datasets: selectedDatasets }),
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
    const handleSubmit = async ({ question, restrictions, metadata: metadataFromStepper, llmModel, selectedDatasets, saveToHistory = true, deepthink = false }) => {
        setLoading(true);
        setError(null);
        try {
            // Build a rich prompt from stepper data
            let prompt = question;

            const res = await authFetch(`${API_BASE}/questions/decide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: prompt,
                    restrictions: restrictions || null,
                    metadata: metadataFromStepper || null,
                    llm_model: llmModel,
                    datasets: selectedDatasets || [],
                    exclude_user_info: anonymousMode,
                    save_to_history: saveToHistory,
                    deepthink: deepthink,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'error') {
                    setError(data.error || 'Decision engine returned an error');
                } else {
                    setSelectedQuestion({
                        id: data.question_id,
                        title: question,
                        answer: data.answer,
                        restrictions,
                        like: true,
                        temporary: !saveToHistory,
                    });
                    // Refresh sidebar history so the new question appears
                    if (saveToHistory) await fetchHistory();
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
                    questionId={selectedQuestion.id}
                    question={selectedQuestion.title}
                    answer={selectedQuestion.answer}
                    restrictions={selectedQuestion.restrictions}
                    like={selectedQuestion.like}
                    temporary={selectedQuestion.temporary}
                    onLikeChange={(newLike) => {
                        setSelectedQuestion(prev => ({ ...prev, like: newLike }));
                        setHistory(prev => prev.map(q => q.id === selectedQuestion.id ? { ...q, like: newLike } : q));
                    }}
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
                                The AI is discovering relevant data and generating your report.
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
                folders={folders}
                onSelectQuestion={handleSelectQuestion}
                onNewChat={handleNewChat}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveQuestion={handleMoveQuestion}
                onDeleteQuestion={handleDeleteQuestion}
            />

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#1e1e1e]">
                    <h1 className="text-lg font-semibold">
                        <span className="text-[#f47721]">K2</span> Platform
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                        {/* Anonymous mode toggle */}
                        <button
                            onClick={() => setAnonymousMode((prev) => !prev)}
                            title={anonymousMode ? 'Personal info excluded from reports' : 'Personal info included in reports'}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${anonymousMode
                                ? 'bg-[#f47721]/20 border-[#f47721] text-[#f47721]'
                                : 'border-[#444] text-gray-400 hover:text-white hover:border-[#666]'
                                }`}
                        >
                            {anonymousMode ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                            {anonymousMode ? 'Anonymous' : 'Personal'}
                        </button>
                        {/* User menu with dropdown */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen((prev) => !prev)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                                title="User menu"
                            >
                                {currentUser?.profile_image ? (
                                    <img
                                        src={`${API_BASE}/${currentUser.profile_image}`}
                                        alt="Profile"
                                        className="w-7 h-7 rounded-full object-cover border border-[#444]"
                                    />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-[#f47721] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                                    </svg>
                                )}
                                <span className="text-gray-400 hover:text-white transition-colors">{currentUser?.username || 'User'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-[#1e1e1e] border border-[#444] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                    <button
                                        onClick={() => { setUserMenuOpen(false); setProfileOpen(true); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar perfil
                                    </button>
                                    <button
                                        onClick={() => { setUserMenuOpen(false); setAboutOpen(true); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        About
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Profile modal */}
                <ProfileModal
                    open={profileOpen}
                    onClose={() => setProfileOpen(false)}
                    user={currentUser}
                    onUserUpdated={(updatedUser) => {
                        // localStorage is already updated inside ProfileModal
                        // Update state so the header picks up new data (profile image, etc.)
                        setCurrentUser(updatedUser);
                    }}
                />

                {/* About modal */}
                <AboutModal
                    open={aboutOpen}
                    onClose={() => setAboutOpen(false)}
                />

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex items-start justify-center">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default MainScreen;
