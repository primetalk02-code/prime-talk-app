import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const JAAS_APP_ID = 'vpaas-magic-cookie-062d4f0193ae439a8a1a9867c2893dd0'
const JAAS_KEY_ID = 'vpaas-magic-cookie-062d4f0193ae439a8a1a9867c2893dd0/d70639'

async function generateJWT(user, isModerator) {
  const header = { alg: 'RS256', kid: JAAS_KEY_ID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: 'jitsi', iss: 'chat', iat: now, exp: now + 7200, nbf: now - 10,
    sub: JAAS_APP_ID,
    context: {
      user: { id: user.id, name: user.name, email: user.email, moderator: isModerator ? 'true' : 'false' },
      features: { livestreaming: 'false', recording: 'false', transcription: 'false', 'outbound-call': 'false' }
    },
    room: '*'
  }
  const b64 = str => btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
  const headerB64 = b64(JSON.stringify(header))
  const payloadB64 = b64(JSON.stringify(payload))
  const signingInput = headerB64 + '.' + payloadB64
  const pemKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi1XgDRpKH5iWv
3qhaPIYLm8Slc/JQji4cNS4HfvFEY5+5vWWVinEPVyd96oDsdbN/5u6eNlCcWAVU
2iRsGeptC3KhocycFs9F7P3i3gxrs9bobwoOJR8KsXlZZuwZrYHdPST72Fx0Y/Mp
3Y7ash3dbAqjbF9YWSXCFLdEZwicopjPBIh0KzQsnnEQ1R83KOrHAKpGTVjF68+z
KjinN+ymjVt9HROW7P5WiFOxLUnsiUign/wzr/kWgdJ+6tnlAVcOQ4XwGx25Vxm2
s9+XnEnjZ2jhgZSc1qXEP/yxWAosBFvalnpmdBoIlE9BtctG+k5QBG5cacSUEWu0
t3wHGcg7AgMBAAECggEBAJOePKeTkgGbtmzCyRLNLaRWeaaY/4Lh8pFl8K2g+m7K
diH3vqEcGbUTiNzQ/EHhznHUVFyf1uJ1tZegD0blE635o9k+CnUzBINa/yttrArz
xY+AIriCFKsoC1/uO3pn3oRIC0A5fE+T0P0SO5Ctyv9SFC7lb2ZzoxRYnXBoi9ka
6IXBB5VNUyp7SUTVeruhtO9K7CrWg9e0KYe/Ll/0L7pU3VAH87Zgc6J9k0/SxzU0
pDdjH5dYJn0baXYpdpQyXzNX1teIM7kIOGZqkGWVt9XKKsotFjjh61lrz5JlQXBz
gXzFSNpjjYyXLg2sFWIM6lkFBZ8BTF/z1JCB0pwo6uECgYEAzR4M29lEo+QR+HYR
TSm1b2+nnMMvaCtnf56tKjop9/OdlbsRx0LoYSPFokP3xTBCAQmbhNdKBNrf0+S+
wGEeYyvMXA6RRBV0qIJl3WBxgqXfPH+jKSggaTldY2nHK2H+TC0cKUMZtzOX1v3e
5pUe0xw0qXXw7wmqdlmGpcMKTvECgYEAyzo1rT3Jk36KZTSqB5+m3coGAKj1WQtN
9dhXyNaDymJVT7fg5E/UQqp3oCnq9WGMWSXyvWcygMxrEUqbG+QL9UBzBr2wW2QE
+b1P/dQW7hc/f5AHnnWlcas3xXCVEnQD+d198lQE+y7C/MHw2FqM/FnZKNxKZXZ6
MNaJqJRaYesCgYBRDjDyp9cSFMxtLOsFXRgPo0XPEuqm9Y/+xIuVhkqTaze4taX+
4hfGW0Z8KvO8fqd2lX9ZbWIYrQ2KRHiEuVwywFoPfso0522kMXNjmfsBL98Zny6w
0uSL8FlRMbm9EQpWu/TG8Xc2CDNWiBgPcpotvpWo6ax+KYmtHw+wbXSjYQKBgCJT
EY/SGMK1o7BWRcWF3IwnO/5Oiynf8+nrAWClgprjIt+VAgHtzb74xb2idtG9CRRh
iW8eB/SjEg5YmHwMd0yT9xmTXj8BVKnNpL4NXVYXTR1BeVf1LN1W+tN5IWR9fdJs
64HLWRAHpN1F8GTKXnecwUXadyJN8XNgON3lOKLDAoGAGtDaoEKWDiJRKtpPwBzX
A27E1qV9uuFZ/1BGBRmoK2IZxKf/VeHJpeKyCKWeRu3KzjQqFRsQWn0Rw+3BsOH6
euT92qyT+ncCXwxbg+zVe7KajA7fcdK5dHGGAKjXGjSGliuNWRCzzbcFeNaAByH6
Pm3snwGF458OqNz4P7VwA6s=
-----END PRIVATE KEY-----`
  try {
    const keyData = pemKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(signingInput))
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
    return signingInput + '.' + sigB64
  } catch(e) { console.error('JWT error:', e); return null }
}

// VOA Learning English articles by topic
const VOA_ARTICLES = {
  'Daily Conversation': [
    { title: 'Talking About Your Day', level: 'Beginner', content: 'Every day, people talk about their daily activities. Common topics include work, family, food, and hobbies.\n\nUseful phrases:\n- "How was your day?"\n- "I had a busy morning."\n- "What did you do today?"\n- "I went to the market."\n- "I am tired but happy."\n\nPractice:\nTalk with your teacher about what you did today. Use simple sentences. Try to speak for 2 minutes without stopping.', vocab: ['activities', 'hobbies', 'morning', 'market', 'tired'] },
    { title: 'Making Small Talk', level: 'Beginner', content: 'Small talk is light conversation about everyday topics. It helps people feel comfortable.\n\nCommon small talk topics:\n- The weather: "Nice weather today, isn\'t it?"\n- Work: "How is work going?"\n- Weekend plans: "Any plans for the weekend?"\n- Family: "How is your family?"\n\nTips for good small talk:\n1. Smile and make eye contact\n2. Ask follow-up questions\n3. Listen carefully\n4. Share your own experiences', vocab: ['comfortable', 'conversation', 'weekend', 'experience', 'follow-up'] },
  ],
  'Business English': [
    { title: 'Email Writing at Work', level: 'Intermediate', content: 'Professional emails are important in business. They should be clear, polite, and concise.\n\nEmail structure:\n1. Subject line - clear and specific\n2. Greeting - "Dear Mr./Ms. [Name]"\n3. Opening - state your purpose\n4. Body - main information\n5. Closing - "Best regards" or "Sincerely"\n\nExample:\nSubject: Meeting Request - Friday 3pm\n\nDear Ms. Johnson,\nI am writing to request a meeting to discuss the quarterly report. Would Friday at 3pm work for you?\n\nBest regards,\nJohn Smith', vocab: ['professional', 'concise', 'quarterly', 'request', 'regards'] },
    { title: 'Job Interview English', level: 'Intermediate', content: 'Job interviews require confident and professional English.\n\nCommon interview questions:\n- "Tell me about yourself."\n- "What are your strengths?"\n- "Why do you want this job?"\n- "Where do you see yourself in 5 years?"\n\nSample answer for "Tell me about yourself":\n"I am a dedicated professional with 3 years of experience in marketing. I am passionate about creating engaging content and building strong customer relationships. I am excited about this opportunity because..."\n\nKey tips:\n1. Prepare your answers in advance\n2. Use the STAR method (Situation, Task, Action, Result)\n3. Ask thoughtful questions at the end', vocab: ['dedicated', 'passionate', 'opportunity', 'professional', 'experience'] },
  ],
  'IELTS Speaking': [
    { title: 'IELTS Speaking Part 1 - Personal Questions', level: 'Intermediate', content: 'IELTS Speaking Part 1 lasts 4-5 minutes. The examiner asks questions about familiar topics.\n\nSample questions and answers:\n\nQ: Do you work or study?\nA: "I currently work as a teacher in a local school. I have been teaching for about 3 years and I really enjoy working with young students."\n\nQ: What do you do in your free time?\nA: "In my free time, I enjoy reading books and going for walks in the park. I find these activities very relaxing after a busy day at work."\n\nRemember:\n- Extend your answers (don\'t just say yes or no)\n- Use a variety of vocabulary\n- Speak naturally and fluently\n- It is OK to pause briefly to think', vocab: ['examiner', 'familiar', 'fluently', 'variety', 'naturally'] },
    { title: 'IELTS Speaking Part 2 - Long Turn', level: 'Upper Intermediate', content: 'In Part 2, you speak for 1-2 minutes on a topic card.\n\nSample topic card:\nDescribe a place you have visited that you found interesting.\nYou should say:\n- Where it is\n- When you visited\n- What you saw there\nAnd explain why you found it interesting.\n\nSample response structure:\n"I would like to talk about [place]. I visited there [when] with [who]. The place is located [where].\n\nWhen I arrived, the first thing I noticed was [description]. I was particularly impressed by [specific detail] because [reason].\n\nOverall, I found this place fascinating because [main reason]. It taught me [lesson] and I would definitely recommend it to others."\n\nKey: Use the 1 minute preparation time wisely. Make notes!', vocab: ['fascinating', 'impressed', 'particularly', 'recommend', 'preparation'] },
  ],
  'Grammar Focus': [
    { title: 'Present Perfect Tense', level: 'Intermediate', content: 'The present perfect tense connects the past to the present.\n\nFormula: have/has + past participle\n\nUses:\n1. Experience: "I have visited Japan."\n2. Recent past: "She has just finished her homework."\n3. Unfinished time: "They have lived here for 10 years."\n4. Change over time: "Technology has changed our lives."\n\nCommon mistakes to avoid:\n- Wrong: "I have seen him yesterday."\n- Right: "I saw him yesterday." (specific time = simple past)\n\nPractice sentences:\n1. I _____ (never / eat) sushi before.\n2. She _____ (just / arrive) at the office.\n3. They _____ (live) in Seoul since 2015.\n\nAnswers: 1. have never eaten  2. has just arrived  3. have lived', vocab: ['participle', 'experience', 'unfinished', 'connects', 'formula'] },
    { title: 'Conditional Sentences', level: 'Upper Intermediate', content: 'Conditional sentences talk about possible or imaginary situations.\n\nType 1 - Real possibility:\nIf + present simple, will + base verb\n"If it rains, I will stay home."\n\nType 2 - Unreal present:\nIf + past simple, would + base verb\n"If I had more money, I would travel the world."\n\nType 3 - Unreal past:\nIf + past perfect, would have + past participle\n"If she had studied harder, she would have passed the exam."\n\nMixed conditional:\n"If I had saved money (past), I would be rich now (present)."\n\nCommon expressions:\n- Unless = if not: "Unless you hurry, you will be late."\n- Provided that: "You can come provided that you behave."\n- As long as: "I will help you as long as you try your best."', vocab: ['conditional', 'possibility', 'imaginary', 'provided', 'participle'] },
  ],
  'Travel English': [
    { title: 'At the Airport', level: 'Beginner', content: 'Traveling by plane requires specific English phrases.\n\nCheck-in:\n- "I would like to check in for flight BA201."\n- "Here is my passport and ticket."\n- "I have one bag to check and one carry-on."\n- "Can I have a window seat please?"\n\nSecurity:\n- "Please remove your shoes and belt."\n- "Please put your laptop in a separate tray."\n- "Do you have any liquids in your bag?"\n\nAt the gate:\n- "Is this the gate for the flight to London?"\n- "What time does boarding begin?"\n- "Is the flight on time?"\n\nOn the plane:\n- "Excuse me, could you help me with my bag?"\n- "Could I have a glass of water please?"\n- "What time do we land?"', vocab: ['passport', 'boarding', 'security', 'carry-on', 'departure'] },
  ],
  'Academic Writing': [
    { title: 'Essay Structure', level: 'Upper Intermediate', content: 'A well-structured essay has three main parts.\n\n1. INTRODUCTION\n- Hook: grab the reader\'s attention\n- Background: provide context\n- Thesis statement: your main argument\n\nExample thesis: "Social media has fundamentally transformed the way people communicate, with both positive and negative consequences for society."\n\n2. BODY PARAGRAPHS (usually 2-3)\nEach paragraph has:\n- Topic sentence: main idea of the paragraph\n- Evidence: facts, examples, statistics\n- Analysis: explain the evidence\n- Link: connect to the next paragraph\n\n3. CONCLUSION\n- Restate thesis (in different words)\n- Summarize main points\n- Final thought or recommendation\n\nUseful academic phrases:\n- "Furthermore, ..."\n- "In contrast, ..."\n- "This suggests that ..."\n- "Evidence indicates that ..."', vocab: ['thesis', 'argument', 'evidence', 'analysis', 'conclusion'] },
  ],
}

function getTextbookContent(textbook) {
  const key = Object.keys(VOA_ARTICLES).find(k => textbook && textbook.toLowerCase().includes(k.toLowerCase())) || 'Daily Conversation'
  return VOA_ARTICLES[key] || VOA_ARTICLES['Daily Conversation']
}

export default function LessonRoom() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const videoContainerRef = useRef(null)
  const pollRef = useRef(null)
  const isTeacherRef = useRef(false)
  const lessonIdRef = useRef(lessonId)

  const [lesson, setLesson] = useState(null)
  const [status, setStatus] = useState('Loading lesson...')
  const [error, setError] = useState('')
  const [videoReady, setVideoReady] = useState(false)
  const [currentArticle, setCurrentArticle] = useState(0)
  const [articles, setArticles] = useState([])
  const [showVocab, setShowVocab] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef(null)

  const endLesson = async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} window._jitsiApi = null }
    try { await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonIdRef.current) } catch(e) {}
    navigate(isTeacherRef.current ? '/teacher/dashboard' : '/student/dashboard')
  }

  const startTimer = (durationMinutes) => {
    const totalSeconds = (durationMinutes || 25) * 60
    setTimer(totalSeconds)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); endLesson(); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return m + ':' + s
  }

  const joinJaas = async (roomName, userInfo, isModerator, duration) => {
    if (!videoContainerRef.current) return
    if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} }
    const jwt = await generateJWT(userInfo, isModerator)
    const loadScript = (src, cb) => {
      if (document.querySelector('script[src="' + src + '"]')) { cb(); return }
      const s = document.createElement('script')
      s.src = src; s.async = true; s.onload = cb
      s.onerror = () => setError('Failed to load video library.')
      document.head.appendChild(s)
    }
    loadScript('https://8x8.vc/libs/external_api.min.js', () => {
      try {
        setVideoReady(true)
        startTimer(duration)
        const api = new window.JitsiMeetExternalAPI('8x8.vc', {
          roomName: JAAS_APP_ID + '/' + roomName,
          parentNode: videoContainerRef.current,
          jwt: jwt,
          userInfo: { displayName: userInfo.name, email: userInfo.email },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            hideConferenceSubject: true,
            disableThirdPartyRequests: true,
            toolbarButtons: [],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [],
            SETTINGS_SECTIONS: [],
            FILM_STRIP_MAX_HEIGHT: 100,
          },
          width: '100%',
          height: '100%',
        })
        window._jitsiApi = api
        api.addEventListener('readyToClose', () => endLesson())
      } catch(e) { setError('Video error: ' + e.message); setVideoReady(false) }
    })
  }

  const pollForActive = (id, userInfo) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('lessons').select('status, room_name, duration').eq('id', id).single()
      if (!data) return
      if (data.status === 'active') {
        clearInterval(pollRef.current); pollRef.current = null
        joinJaas(data.room_name || id, userInfo, false, data.duration)
      } else if (data.status === 'declined') {
        clearInterval(pollRef.current); pollRef.current = null
        setError('Teacher declined. Please go back and try again.')
      }
    }, 2000)
  }

  useEffect(() => {
    if (!lessonId || lessonId === 'undefined') { setError('No lesson ID found.'); return }
    lessonIdRef.current = lessonId
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/student/login'); return }
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        const teacher = profile && profile.role === 'teacher'
        isTeacherRef.current = teacher
        const userInfo = { id: user.id, name: profile?.full_name || (teacher ? 'Teacher' : 'Student'), email: user.email || '' }
        const { data: ld, error: fe } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
        if (fe || !ld) { setError('Lesson not found. ID: ' + lessonId); return }
        setLesson(ld)
        const textbookArticles = getTextbookContent(ld.textbook)
        setArticles(textbookArticles)
        const roomName = ld.room_name || lessonId
        if (teacher) {
          joinJaas(roomName, userInfo, true, ld.duration)
        } else if (ld.status === 'active') {
          joinJaas(roomName, userInfo, false, ld.duration)
        } else {
          setStatus('Waiting for teacher to accept...')
          pollForActive(lessonId, userInfo)
        }
      } catch(e) { setError('Error: ' + e.message) }
    }
    init()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} window._jitsiApi = null }
    }
  }, [lessonId])

  const article = articles[currentArticle]

  if (error) return React.createElement('div', { style: { width: '100vw', height: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' } },
    React.createElement('p', { style: { color: '#EF4444', fontSize: '15px', textAlign: 'center', maxWidth: '360px', margin: 0 } }, error),
    React.createElement('button', { onClick: () => navigate(-1), style: { background: '#0EA5A0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 } }, 'Go Back')
  )

  if (!videoReady) return React.createElement('div', { style: { width: '100vw', height: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: 'system-ui, sans-serif' } },
    React.createElement('div', { style: { width: '40px', height: '40px', border: '3px solid rgba(14,165,160,0.3)', borderTop: '3px solid #0EA5A0', borderRadius: '50%', animation: 'spin 1s linear infinite' } }),
    React.createElement('style', null, '@keyframes spin{to{transform:rotate(360deg)}}'),
    React.createElement('p', { style: { color: '#94A3B8', fontSize: '16px', margin: 0 } }, status),
    status.includes('Waiting') && React.createElement('p', { style: { color: '#475569', fontSize: '13px', margin: 0 } }, 'Stay on this page - you will join automatically')
  )

  return React.createElement('div', { style: { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' } },

    // Header
    React.createElement('div', { style: { height: '52px', flexShrink: 0, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 10 } },
      React.createElement('span', { style: { color: '#0EA5A0', fontWeight: 700, fontSize: '16px' } }, 'Prime Talk'),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
        lesson && React.createElement('span', { style: { color: '#94A3B8', fontSize: '13px' } }, lesson.textbook || 'English Lesson'),
        timer > 0 && React.createElement('div', { style: { background: timer < 300 ? '#EF4444' : '#0EA5A0', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: