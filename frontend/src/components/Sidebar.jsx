import { useState } from 'react';
import { clearAuth } from '../utils/auth';

function Sidebar({ history, onSelectQuestion, onNewChat }) {
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        clearAuth();
        globalThis.location.href = '/login';
    };

    return (
        <aside
            className={`flex flex-col bg-[#1a1a1a] border-r border-[#333] transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
                {!collapsed && (
                    <h2 className="text-sm font-semibold text-white truncate">History</h2>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="text-gray-400 hover:text-white transition-colors ml-auto"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        /* chevron-right */
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    ) : (
                        /* chevron-left */
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* New Chat button */}
            {!collapsed && (
                <div className="p-3">
                    <button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-[#444] text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Query
                    </button>
                </div>
            )}

            {/* Scrollable history list */}
            <nav className="flex-1 overflow-y-auto px-2 py-1">
                {!collapsed && history.length === 0 && (
                    <p className="text-xs text-gray-500 px-2 py-4 text-center">
                        No previous questions yet
                    </p>
                )}
                {!collapsed &&
                    history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSelectQuestion(item)}
                            className="w-full text-left px-3 py-2 mb-1 rounded-md text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors truncate"
                            title={item.title}
                        >
                            {item.title}
                        </button>
                    ))}
            </nav>

            {/* Logout button */}
            <div className="p-3 border-t border-[#333]">
                {collapsed ? (
                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center text-gray-400 hover:text-red-400 transition-colors"
                        title="Log out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-[#2a2a2a] hover:text-red-400 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                        Log out
                    </button>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
