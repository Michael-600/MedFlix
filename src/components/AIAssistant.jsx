import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { aiAssistantGreeting, aiResponses } from '../data/mockData'

export default function AIAssistant({ patientName, diagnosis }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: aiAssistantGreeting, timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const getAIResponse = (userMessage) => {
    const msg = userMessage.toLowerCase()
    if (msg.includes('medication') || msg.includes('medicine') || msg.includes('drug') || msg.includes('pill')) {
      return aiResponses.medications
    }
    if (msg.includes('pain') || msg.includes('hurt') || msg.includes('ache') || msg.includes('discomfort')) {
      return aiResponses.pain
    }
    if (msg.includes('warning') || msg.includes('emergency') || msg.includes('danger') || msg.includes('symptom') || msg.includes('sign')) {
      return aiResponses.warning
    }
    if (msg.includes('exercise') || msg.includes('activity') || msg.includes('walk') || msg.includes('stretch') || msg.includes('move')) {
      return aiResponses.exercise
    }
    if (msg.includes('diet') || msg.includes('food') || msg.includes('eat') || msg.includes('nutrition') || msg.includes('meal')) {
      return aiResponses.diet
    }
    if (msg.includes('day 1') || msg.includes('day one') || msg.includes('first day')) {
      return `Day 1 of your recovery plan focuses on understanding your diagnosis. This is your foundation — take time to review your condition with your care team, understand all treatment options, and write down any questions you have. Don't hesitate to ask for clarification on anything you're unsure about.`
    }
    if (msg.includes('day 2') || msg.includes('day two') || msg.includes('second day')) {
      return `Day 2 focuses on home care management. You'll learn about managing medications at home, setting up a comfortable recovery space, and recognizing warning signs that need attention. This is also a good time to organize your medications and set reminders.`
    }
    if (msg.includes('day 3') || msg.includes('day three') || msg.includes('third day')) {
      return `Day 3 introduces increased activity. You'll start with gentle movements and gradually build up. The key is to listen to your body — some discomfort is normal, but sharp pain means you should stop and rest. Track your activity levels and how you feel afterward.`
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return `Hello ${patientName}! I'm glad you're here. How are you feeling today? I can help you with questions about your ${diagnosis || 'recovery'} plan, medications, exercises, nutrition, or any concerns you might have.`
    }
    if (msg.includes('thank')) {
      return `You're welcome, ${patientName}! Remember, your recovery is a journey, and every question you ask shows you're taking an active role in your health. I'm here whenever you need me. Keep up the great work!`
    }
    return aiResponses.default
  }

  const handleSend = () => {
    if (!input.trim() || isTyping) return

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking time
    setTimeout(() => {
      const response = getAIResponse(userMsg.content)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, timestamp: new Date() },
      ])
      setIsTyping(false)
    }, 1000 + Math.random() * 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    'What are my medications for?',
    'How do I manage pain?',
    'What warning signs should I watch for?',
    'What exercises can I do?',
    'What should I eat?',
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
        {/* Chat Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-medflix-accent/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medflix-accent/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-medflix-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">MedFlix AI Assistant</h3>
              <p className="text-xs text-gray-500">
                Ask questions about your {diagnosis || 'recovery'} plan
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fadeIn`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-medflix-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-medflix-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-medflix-dark text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-2' : ''}>
                    {line.startsWith('**') ? (
                      <strong>{line.replace(/\*\*/g, '')}</strong>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-medflix-dark rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-8 h-8 bg-medflix-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-medflix-accent" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInput(action)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-medflix-accent/5 hover:border-medflix-accent/30 hover:text-medflix-accent transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your recovery plan..."
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-medflix-accent focus:ring-2 focus:ring-medflix-accent/20 outline-none transition-all"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="px-4 py-3 bg-medflix-dark text-white rounded-xl hover:bg-medflix-darker transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            AI responses are for educational purposes only. Always consult your healthcare provider for medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}
