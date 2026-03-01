import { useEffect, useRef, useState } from 'react';
import { clearAuth } from '../utils/auth';

function Sidebar({ history, folders, onSelectQuestion, onNewChat, onCreateFolder, onRenameFolder, onDeleteFolder, onMoveQuestion }) {
    const [collapsed, setCollapsed] = useState(false);
    const [openFolders, setOpenFolders] = useState({});
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [renamingFolderId, setRenamingFolderId] = useState(null);
    const [renameFolderName, setRenameFolderName] = useState('');
    const [contextMenu, setContextMenu] = useState(null); // { type, id, x, y }
    const [draggedQuestion, setDraggedQuestion] = useState(null);
    const [dropTarget, setDropTarget] = useState(null); // folder id or 'unfiled'

    const newFolderRef = useRef(null);
    const renameRef = useRef(null);
    const contextMenuRef = useRef(null);

    const handleLogout = () => {
        clearAuth();
        globalThis.location.href = '/login';
    };

    // Toggle folder open/close
    const toggleFolder = (folderId) => {
        setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    // Auto-focus input fields
    useEffect(() => {
        if (creatingFolder && newFolderRef.current) newFolderRef.current.focus();
    }, [creatingFolder]);

    useEffect(() => {
        if (renamingFolderId && renameRef.current) renameRef.current.focus();
    }, [renamingFolderId]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (contextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [contextMenu]);

    // Categorize questions
    const questionsByFolder = {};
    const unfiledQuestions = [];
    for (const q of history) {
        if (q.folder_id) {
            if (!questionsByFolder[q.folder_id]) questionsByFolder[q.folder_id] = [];
            questionsByFolder[q.folder_id].push(q);
        } else {
            unfiledQuestions.push(q);
        }
    }

    // Create folder handler
    const handleCreateFolder = () => {
        const name = newFolderName.trim();
        if (name) {
            onCreateFolder(name);
        }
        setNewFolderName('');
        setCreatingFolder(false);
    };

    // Rename folder handler
    const handleRenameSubmit = () => {
        const name = renameFolderName.trim();
        if (name && renamingFolderId) {
            onRenameFolder(renamingFolderId, name);
        }
        setRenamingFolderId(null);
        setRenameFolderName('');
    };

    // Drag & drop handlers
    const handleDragStart = (e, questionId) => {
        setDraggedQuestion(questionId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, target) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget(target);
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e, folderId) => {
        e.preventDefault();
        if (draggedQuestion !== null) {
            onMoveQuestion(draggedQuestion, folderId);
        }
        setDraggedQuestion(null);
        setDropTarget(null);
    };

    // Context menu for folders
    const handleFolderContextMenu = (e, folderId) => {
        e.preventDefault();
        setContextMenu({ type: 'folder', id: folderId, x: e.clientX, y: e.clientY });
    };

    // Context menu for questions (move to folder)
    const handleQuestionContextMenu = (e, questionId) => {
        e.preventDefault();
        setContextMenu({ type: 'question', id: questionId, x: e.clientX, y: e.clientY });
    };

    return (
        <aside
            className={`flex flex-col bg-[#1a1a1a] border-r border-[#333] transition-all duration-300 relative ${collapsed ? 'w-16' : 'w-72'}`}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Action buttons */}
            {!collapsed && (
                <div className="p-3 flex gap-2">
                    <button
                        onClick={onNewChat}
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-[#444] text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Query
                    </button>
                    <button
                        onClick={() => setCreatingFolder(true)}
                        className="flex items-center gap-1 px-3 py-2 rounded-md border border-[#444] text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        title="Create folder"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                </div>
            )}

            {/* New folder input */}
            {!collapsed && creatingFolder && (
                <div className="px-3 pb-2">
                    <div className="flex gap-1">
                        <input
                            ref={newFolderRef}
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
                            }}
                            placeholder="Folder name…"
                            className="flex-1 px-2 py-1 text-sm rounded bg-[#2a2a2a] border border-[#555] text-white outline-none focus:border-[#f47721] placeholder:text-gray-500"
                        />
                        <button onClick={handleCreateFolder} className="text-[#f47721] hover:text-white text-sm px-2">
                            ✓
                        </button>
                        <button onClick={() => { setCreatingFolder(false); setNewFolderName(''); }} className="text-gray-400 hover:text-white text-sm px-1">
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Scrollable history with folders */}
            <nav className="flex-1 overflow-y-auto px-2 py-1">
                {!collapsed && history.length === 0 && folders.length === 0 && (
                    <p className="text-xs text-gray-500 px-2 py-4 text-center">
                        No previous questions yet
                    </p>
                )}

                {!collapsed && (
                    <>
                        {/* Render folders */}
                        {folders.map((folder) => {
                            const isOpen = openFolders[folder.id] !== false; // default open
                            const folderQuestions = questionsByFolder[folder.id] || [];
                            const isDragOver = dropTarget === folder.id;

                            return (
                                <div key={folder.id} className="mb-1">
                                    {/* Folder header */}
                                    <div
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${isDragOver ? 'bg-[#f47721]/20 border border-[#f47721]/50' : 'hover:bg-[#2a2a2a]'}`}
                                        onClick={() => toggleFolder(folder.id)}
                                        onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                                        onDragOver={(e) => handleDragOver(e, folder.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, folder.id)}
                                    >
                                        {/* Chevron */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        {/* Folder icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#f47721]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>

                                        {renamingFolderId === folder.id ? (
                                            <input
                                                ref={renameRef}
                                                type="text"
                                                value={renameFolderName}
                                                onChange={(e) => setRenameFolderName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameSubmit();
                                                    if (e.key === 'Escape') { setRenamingFolderId(null); setRenameFolderName(''); }
                                                }}
                                                onBlur={handleRenameSubmit}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 px-1 py-0 text-sm bg-[#2a2a2a] border border-[#555] rounded text-white outline-none focus:border-[#f47721]"
                                            />
                                        ) : (
                                            <span className="flex-1 text-sm text-gray-300 truncate">
                                                {folder.name}
                                            </span>
                                        )}

                                        <span className="text-xs text-gray-500 mr-1">
                                            {folderQuestions.length}
                                        </span>

                                        {/* Action buttons (visible on hover) */}
                                        <div className="hidden group-hover:flex items-center gap-0.5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRenamingFolderId(folder.id);
                                                    setRenameFolderName(folder.name);
                                                }}
                                                className="text-gray-500 hover:text-white p-0.5"
                                                title="Rename folder"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteFolder(folder.id);
                                                }}
                                                className="text-gray-500 hover:text-red-400 p-0.5"
                                                title="Delete folder"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Folder contents */}
                                    {isOpen && (
                                        <div className="ml-4 border-l border-[#333] pl-1">
                                            {folderQuestions.length === 0 && (
                                                <p className="text-xs text-gray-600 px-2 py-1 italic">
                                                    Drag questions here
                                                </p>
                                            )}
                                            {folderQuestions.map((item) => (
                                                <button
                                                    key={item.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                                    onClick={() => onSelectQuestion(item)}
                                                    onContextMenu={(e) => handleQuestionContextMenu(e, item.id)}
                                                    className="w-full text-left px-3 py-1.5 mb-0.5 rounded text-xs text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors truncate cursor-grab active:cursor-grabbing"
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Unfiled questions + drop zone to remove from folders */}
                        {(unfiledQuestions.length > 0 || (folders.length > 0 && draggedQuestion !== null)) && (
                            <div className="mt-2">
                                {folders.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 uppercase tracking-wider">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Recent
                                    </div>
                                )}
                                <div
                                    className={`rounded-md transition-colors ${dropTarget === 'unfiled' ? 'bg-[#f47721]/10 border border-dashed border-[#f47721]/40' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDropTarget('unfiled'); }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, null)}
                                >
                                    {unfiledQuestions.map((item) => (
                                        <button
                                            key={item.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item.id)}
                                            onClick={() => onSelectQuestion(item)}
                                            onContextMenu={(e) => handleQuestionContextMenu(e, item.id)}
                                            className="w-full text-left px-3 py-2 mb-0.5 rounded-md text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors truncate cursor-grab active:cursor-grabbing"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </button>
                                    ))}
                                    {/* Visible drop hint when dragging a question from a folder */}
                                    {draggedQuestion !== null && unfiledQuestions.length === 0 && (
                                        <p className="text-xs text-gray-500 px-2 py-2 text-center italic">
                                            Drop here to remove from folder
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </nav>

            {/* Context menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-50 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl py-1 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {contextMenu.type === 'folder' && (
                        <>
                            <button
                                onClick={() => {
                                    const folder = folders.find((f) => f.id === contextMenu.id);
                                    setRenamingFolderId(contextMenu.id);
                                    setRenameFolderName(folder?.name || '');
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3a3a3a] hover:text-white flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Rename
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteFolder(contextMenu.id);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-[#3a3a3a] hover:text-red-300 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete folder
                            </button>
                        </>
                    )}
                    {contextMenu.type === 'question' && (
                        <>
                            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">Move to</div>
                            {folders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => {
                                        onMoveQuestion(contextMenu.id, folder.id);
                                        setContextMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3a3a3a] hover:text-white flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#f47721]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    {folder.name}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    onMoveQuestion(contextMenu.id, null);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3a3a3a] hover:text-white flex items-center gap-2 border-t border-[#444] mt-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Remove from folder
                            </button>
                        </>
                    )}
                </div>
            )}

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
