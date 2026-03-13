import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function TeacherMessages() {
  const [currentUser, setCurrentUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedName, setSelectedName] = useState('')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)
      await loadConversations(user.id)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async (userId) => {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!data) return
    const seen = new Set()
    const convos = []
    for (const msg of data) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
      if (!seen.has(otherId)) {
        seen.add(otherId)
        convos.push({ userId: otherId, preview: msg.content, created_at: msg.created_at })
      }
    }
    // Load names from profiles
    const otherIds = convos.map(c => c.userId)
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', otherIds)
      const nameMap = {}
      for (const p of profiles || []) nameMap[p.id] = p.full_name || p.email || 'User'
      setConversations(convos.map(c => ({ ...c, name: nameMap[c.userId] || 'User' })))
    } else {
      setConversations([])
    }
  }

  const loadMessages = async (userId, otherUserId) => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const handleSelectConvo = async (convo) => {
    setSelectedUserId(convo.userId)
    setSelectedName(convo.name)
    if (currentUser) await loadMessages(currentUser.id, convo.userId)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUserId || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUserId,
      content: newMessage.trim(),
    })
    if (!error) {
      setNewMessage('')
      await loadMessages(currentUser.id, selectedUserId)
    }
    setSending(false)
  }

  const cardStyle = {
    background: 'white', borderRadius: '16px',
    border: '1px solid #E2E8F0', overflow: 'hidden'
  }

  return (
    <div style={{ padding: '0' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '24px' }}>
        💬 Messages
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: '600px' }}>
        {/* Conversations list */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Conversations</h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ padding: '20px', color: '#64748B', fontSize: '13px' }}>Loading...</p>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <p style={{ fontSize: '13px' }}>No conversations yet</p>
              </div>
            ) : conversations.map(convo => (
              <div key={convo.userId}
                onClick={() => handleSelectConvo(convo)}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                  background: selectedUserId === convo.userId ? '#F0FFFE' : 'transparent',
                  borderLeft: selectedUserId === convo.userId ? '3px solid #0EA5A0' : '3px solid transparent'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#0EA5A0', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontWeight: 700,
                    fontSize: '13px', flexShrink: 0
                  }}>
                    {(convo.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px', margin: 0 }}>{convo.name}</p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {convo.preview || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          {!selectedUserId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Select a conversation</p>
                <p style={{ fontSize: '13px' }}>Choose a student from the list to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0EA5A0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
                  {selectedName.charAt(0).toUpperCase()}
                </div>
                <p style={{ fontWeight: 700, color: '#0F172A', margin: 0 }}>{selectedName}</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', marginTop: '40px' }}>No messages yet. Say hello!</p>
                ) : messages.map(msg => {
                  const isMine = msg.sender_id === currentUser?.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMine ? '#0EA5A0' : '#F1F5F9',
                        color: isMine ? 'white' : '#0F172A', fontSize: '14px'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px' }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none'
                  }} />
                <button onClick={handleSend} disabled={sending}
                  style={{ background: '#0EA5A0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                  {sending ? '...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}