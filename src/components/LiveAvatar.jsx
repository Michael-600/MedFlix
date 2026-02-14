import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, Volume2, Send, Sparkles, User } from 'lucide-react'

export default function LiveAvatar({ patientName, diagnosis }) {
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([
    {
      role: 'avatar',
      content: `Hi ${patientName || 'there'}! I'm your AI health companion. I'm here to answer any questions about your recovery, explain medical terms, or just chat about how you're feeling. How can I help you today?`,
      timestamp: new Date(),
    },
  ])
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const handleSendMessage = () => {
    if (!message.trim()) return

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setConversation((prev) => [...prev, userMessage])
    setMessage('')

    // Simulate avatar response
    setIsAvatarSpeaking(true)
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me explain it in simpler terms...",
        "I understand your concern. Here's what you should know...",
        "Based on your recovery plan, I'd recommend...",
        "It's completely normal to feel that way. Many patients experience similar concerns...",
        "Let me break that down for you in a way that's easier to understand...",
      ]
      const avatarMessage = {
        role: 'avatar',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }
      setConversation((prev) => [...prev, avatarMessage])
      setIsAvatarSpeaking(false)
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoice = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setMessage("Can you explain what I should do if I feel pain?")
        setIsListening(false)
      }, 3000)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-medflix-accent to-medflix-accentLight p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Live AI Health Companion</h2>
              <p className="text-white/90 text-sm">
                Ask questions anytime - I'm here to support your recovery journey
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Avatar Video Section */}
          <div className="lg:col-span-1 bg-medflix-darker p-6 flex flex-col items-center justify-center min-h-[500px]">
            {/* Avatar Display */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-medflix-accent/20 to-medflix-accentLight/20 flex items-center justify-center border-4 border-medflix-accent/30 mb-6">
                <div className="relative">
                  {isAvatarSpeaking && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-medflix-accent/30 animate-ping" />
                    </div>
                  )}
                  <User className="w-20 h-20 text-medflix-accent relative z-10" strokeWidth={1.5} />
                </div>
              </div>
              {isAvatarSpeaking && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-medflix-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <h3 className="text-white font-semibold text-lg mb-1">Dr. Sarah AI</h3>
              <p className="text-gray-400 text-sm">Your Personal Health Guide</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
                <span className="text-green-400 text-xs font-medium">Online & Ready</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex gap-3">
              <button
                onClick={toggleVoice}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse-soft'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice chat'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                title="Toggle video"
              >
                <Video className="w-5 h-5 text-white" />
              </button>
              <button
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                title="Adjust volume"
              >
                <Volume2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {isListening && (
              <div className="mt-4 text-center">
                <div className="flex gap-1 justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-medflix-accent rounded-full animate-pulse"
                      style={{
                        height: `${15 + Math.random() * 15}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-gray-400 text-xs">Listening...</p>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-medflix-accent text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isAvatarSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question or concern..."
                  rows="2"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none resize-none text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="px-6 bg-medflix-accent text-white rounded-xl hover:bg-medflix-accentLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  Press Enter to send, Shift + Enter for new line
                </p>
                <button
                  onClick={toggleVoice}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-red-100 text-red-600'
                      : 'bg-medflix-accent/10 text-medflix-accent hover:bg-medflix-accent/20'
                  }`}
                >
                  {isListening ? '🔴 Stop Voice' : '🎤 Use Voice'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="border-t p-6 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'What should I do if I feel pain?',
              'Explain my medications',
              'When is my next milestone?',
              'What foods should I eat?',
              'How do I track my progress?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setMessage(q)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-medflix-accent hover:text-medflix-accent transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
