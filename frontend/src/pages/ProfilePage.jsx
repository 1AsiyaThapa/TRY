import { useState, useEffect, useRef } from 'react'

const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`http://localhost:5000${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
}

const rules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [nameForm, setNameForm] = useState({ name: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [nameMsg, setNameMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)
  const [nameLoading, setNameLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => {
    API('/api/profile').then(r => r.json()).then(data => {
      setProfile(data)
      setNameForm({ name: data.name || '' })
    })
  }, [])

  const handleNameSave = async (e) => {
    e.preventDefault()
    setNameLoading(true)
    setNameMsg(null)
    try {
      const res = await API('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: nameForm.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setProfile(data)
      setNameMsg({ type: 'success', text: 'Name updated successfully.' })
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message })
    } finally {
      setNameLoading(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm)
      return setPwMsg({ type: 'error', text: 'Passwords do not match.' })
    if (!rules.every(r => r.test(pwForm.newPassword)))
      return setPwMsg({ type: 'error', text: 'Password does not meet requirements.' })

    setPwLoading(true)
    setPwMsg(null)
    try {
      const res = await API('/api/profile/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setPwMsg({ type: 'success', text: data.message })
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message })
    } finally {
      setPwLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('http://localhost:5000/api/profile/avatar', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setProfile(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true)
    try {
      const res = await API('/api/profile/avatar', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setProfile(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isGoogle = profile.googleId

  return (
    <div className="space-y-6 max-w-xl">

      <div>
        <h2 className="text-xl font-bold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account details</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-primary text-2xl font-bold">
              {profile.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          {/* Upload overlay */}
          <button
            onClick={() => avatarRef.current.click()}
            disabled={avatarLoading}
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            title="Change photo"
          >
            {avatarLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
          <p className="text-sm text-gray-400">{profile.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              profile.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {profile.isVerified ? '✓ Verified' : 'Not verified'}
            </span>
            {isGoogle && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                Google account
              </span>
            )}
            {profile.avatar && (
              <button onClick={handleRemoveAvatar} disabled={avatarLoading}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Update name */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Update Name</h3>
        {nameMsg && (
          <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${nameMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {nameMsg.text}
          </div>
        )}
        <form onSubmit={handleNameSave} className="flex gap-3">
          <input
            type="text"
            value={nameForm.name}
            onChange={e => setNameForm({ name: e.target.value })}
            placeholder="Your full name"
            required
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <button type="submit" disabled={nameLoading}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {nameLoading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* Change password */}
      {!isGoogle && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
          {pwMsg && (
            <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input type="password" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required placeholder="Enter current password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input type="password" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required placeholder="Create new password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
              {pwForm.newPassword && (
                <ul className="mt-2 space-y-1">
                  {rules.map(r => (
                    <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.test(pwForm.newPassword) ? 'text-emerald-600' : 'text-gray-400'}`}>
                      <span>{r.test(pwForm.newPassword) ? '✓' : '○'}</span>{r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input type="password" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                required placeholder="Repeat new password"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
                  pwForm.confirm && pwForm.confirm !== pwForm.newPassword
                    ? 'border-red-300 focus:ring-red-200'
                    : pwForm.confirm && pwForm.confirm === pwForm.newPassword
                    ? 'border-emerald-300 focus:ring-emerald-200'
                    : 'border-gray-200 focus:ring-primary/30 focus:border-primary'
                }`} />
              {pwForm.confirm && pwForm.confirm !== pwForm.newPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading}
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Account</h3>
        <p className="text-xs text-gray-400 mb-4">Joined {new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <button onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
          Log out of PaisaTrack
        </button>
      </div>

    </div>
  )
}
