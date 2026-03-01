import { useEffect, useRef, useState } from 'react';
import { authFetch } from '../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function ProfileModal({ open, onClose, user, onUserUpdated }) {
    const [name, setName] = useState('');
    const [genderIdentity, setGenderIdentity] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [userPreferences, setUserPreferences] = useState('');
    const [profileImage, setProfileImage] = useState(null); // URL string for preview
    const [imageFile, setImageFile] = useState(null); // File object to upload
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const backdropRef = useRef(null);
    const fileInputRef = useRef(null);

    // Populate fields when the modal opens or the user prop changes
    useEffect(() => {
        if (open && user) {
            setName(user.name || '');
            setGenderIdentity(user.gender_identity || '');
            setDateOfBirth(user.date_of_birth || '');
            setUserPreferences(user.user_preferences || '');
            setProfileImage(user.profile_image ? `${API_BASE}/${user.profile_image}` : null);
            setImageFile(null);
            setError(null);
            setSuccess(false);
        }
    }, [open, user]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    if (!open) return null;

    const handleBackdropClick = (e) => {
        if (e.target === backdropRef.current) onClose();
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image (JPG, PNG, GIF, or WebP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB');
            return;
        }

        setImageFile(file);
        setProfileImage(URL.createObjectURL(file));
        setError(null);
    };

    const handleRemoveImage = async () => {
        setUploadingImage(true);
        setError(null);
        try {
            const res = await authFetch(`${API_BASE}/me/profile-image`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const updatedUser = await res.json();
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setProfileImage(null);
                setImageFile(null);
                if (onUserUpdated) onUserUpdated(updatedUser);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Failed to remove image');
            }
        } catch {
            setError('Could not connect to the server');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Upload image first if a new file was selected
            if (imageFile) {
                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', imageFile);

                const imgRes = await authFetch(`${API_BASE}/me/profile-image`, {
                    method: 'POST',
                    body: formData,
                });

                if (!imgRes.ok) {
                    const data = await imgRes.json().catch(() => ({}));
                    setError(data.detail || 'Failed to upload image');
                    setSaving(false);
                    setUploadingImage(false);
                    return;
                }

                // Save updated user (with new profile_image) to localStorage
                const imgUser = await imgRes.json();
                localStorage.setItem('user', JSON.stringify(imgUser));
                if (onUserUpdated) onUserUpdated(imgUser);

                setUploadingImage(false);
            }

            // Then save the rest of the profile fields
            const payload = {
                name: name || null,
                gender_identity: genderIdentity || null,
                date_of_birth: dateOfBirth || null,
                user_preferences: userPreferences || null,
            };

            const res = await authFetch(`${API_BASE}/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                // Persist updated user data in localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setSuccess(true);
                if (onUserUpdated) onUserUpdated(updatedUser);
                // Auto-close after a brief moment
                setTimeout(() => onClose(), 800);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || 'Failed to update profile');
            }
        } catch {
            setError('Could not connect to the server');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <div className="w-full max-w-md mx-4 bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl animate-in fade-in zoom-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                    <div className="flex items-center gap-3">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt="Profile"
                                className="w-9 h-9 rounded-full object-cover border border-[#444]"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-[#f47721]/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#f47721]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h2 className="text-base font-semibold text-white">Edit Profile</h2>
                            <p className="text-xs text-gray-500">{user?.username} &middot; {user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-[#333]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="px-3 py-2 rounded-lg bg-green-900/30 border border-green-700 text-green-300 text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Profile image */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-[#444] group-hover:border-[#f47721] transition-colors"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-[#2a2a2a] border-2 border-[#444] flex items-center justify-center group-hover:border-[#f47721] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#f47721] hover:bg-[#d96518] flex items-center justify-center shadow-lg transition-colors"
                                title="Change profile image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Profile photo</span>
                            {profileImage && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    disabled={uploadingImage}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-name" className="text-sm text-gray-400">Full name</label>
                        <input
                            id="profile-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-gender" className="text-sm text-gray-400">Gender identity</label>
                        <input
                            id="profile-gender"
                            type="text"
                            value={genderIdentity}
                            onChange={(e) => setGenderIdentity(e.target.value)}
                            placeholder="e.g. she/her"
                            className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-dob" className="text-sm text-gray-400">Date of birth</label>
                        <input
                            id="profile-dob"
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors [color-scheme:dark]"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="profile-prefs" className="text-sm text-gray-400">Preferences</label>
                        <textarea
                            id="profile-prefs"
                            value={userPreferences}
                            onChange={(e) => setUserPreferences(e.target.value)}
                            placeholder='e.g. "I like short answers..."'
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] text-white placeholder-gray-500 outline-none focus:border-[#f47721] focus:ring-1 focus:ring-[#f47721]/30 transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm text-gray-400 border border-[#444] hover:bg-[#2a2a2a] hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#f47721] hover:bg-[#d96518] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {saving && (
                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            )}
                            {saving ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileModal;
