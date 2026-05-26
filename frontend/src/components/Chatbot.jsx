import { useState, useRef, useEffect } from 'react'

const suggestions = [
  'How am I doing financially?',
  'Where am I spending the most?',
  'Give me a saving tip',
  'How can I reduce my expenses?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
          💰
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        {msg.text}
      </div>
    </div>
  )
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm your PaisaTrack assistant 👋 Ask me anything about your finances." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg || loading) return
    setInput('')

    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const history = newMessages.slice(1, -1).map(m => ({ role: m.role, text: m.text }))

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'model', text: data.reply || data.message }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center text-2xl"
        title="AI Assistant"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">💰</div>
            <div>
              <p className="text-white font-semibold text-sm">PaisaTrack Assistant</p>
              <p className="text-indigo-200 text-xs">Powered by Gemini AI</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs flex-shrink-0">💰</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-indigo-50 text-primary px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about your finances..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
