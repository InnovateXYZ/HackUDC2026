import { authFetch } from './auth';

const API_BASE = 'http://localhost:8000';

/** Fetch all folders for the current user */
export async function fetchFolders() {
    const res = await authFetch(`${API_BASE}/questions/folders`);
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
}

/** Create a new folder */
export async function createFolder(name) {
    const res = await authFetch(`${API_BASE}/questions/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
}

/** Rename an existing folder */
export async function renameFolder(folderId, name) {
    const res = await authFetch(`${API_BASE}/questions/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to rename folder');
    return res.json();
}

/** Delete a folder (questions inside are un-assigned, not deleted) */
export async function deleteFolder(folderId) {
    const res = await authFetch(`${API_BASE}/questions/folders/${folderId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete folder');
    return res.json();
}

/** Move a question into a folder (or remove from folder if folderId is null) */
export async function moveQuestionToFolder(questionId, folderId) {
    const res = await authFetch(`${API_BASE}/questions/${questionId}/folder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
    });
    if (!res.ok) throw new Error('Failed to move question');
    return res.json();
}
