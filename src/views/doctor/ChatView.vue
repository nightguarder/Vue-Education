<template>
  <div class="chat-view h-100">
    <div class="container-fluid py-4 h-100">
      <div class="row h-100 g-4">
        <!-- 1. Chat List Sidebar -->
        <div class="col-md-3 col-lg-2 h-100">
          <div class="card border-0 rounded-4 shadow-sm h-100 overflow-hidden">
            <div class="card-header bg-white py-3 border-bottom-0">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0 text-uppercase small tracking-wider">Sessions</h6>
                <button class="btn btn-link btn-sm text-danger p-0" @click="clearAllChats" title="Clear all">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </div>
            <div class="card-body p-0 overflow-auto">
              <div v-if="chats.length === 0" class="text-center text-muted p-4">
                <p class="small mb-0">No sessions</p>
              </div>
              <div v-else class="list-group list-group-flush">
                <button
                  v-for="chat in chats"
                  :key="chat.chatId"
                  class="list-group-item list-group-item-action border-0 py-3 px-3 chat-item"
                  :class="{ 'active-chat': currentChatId === chat.chatId }"
                  @click="selectChat(chat.chatId)"
                >
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-truncate">{{ chat.patientName }}</span>
                    <small class="text-muted" style="font-size: 0.7rem;">{{ formatDate(chat.createdAt) }}</small>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted truncate-1">ID: {{ chat.chatId.slice(0, 8) }}</small>
                    <i class="bi bi-chevron-right small opacity-50"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Main Chat Window -->
        <div class="col-md-6 col-lg-7 h-100">
          <div v-if="!currentChat" class="card border-0 rounded-4 shadow-sm h-100 d-flex align-items-center justify-content-center text-center empty-state-card">
            <div class="p-5">
              <div class="bg-primary bg-opacity-10 rounded-circle p-4 d-inline-block mb-3">
                <i class="bi bi-chat-dots-fill text-primary display-5"></i>
              </div>
              <h5 class="fw-bold">Select a clinical session</h5>
              <p class="text-muted">Choose a patient from the left panel to begin analysis</p>
            </div>
          </div>
          
          <div v-else class="card border-0 rounded-4 shadow-sm h-100 d-flex flex-column main-chat-card overflow-hidden">
            <!-- Chat Header -->
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center">
                <div class="avatar-circle me-3">{{ currentChat.patientName.charAt(0) }}</div>
                <div>
                  <h6 class="fw-bold mb-0">{{ currentChat.patientName }}</h6>
                  <span class="badge bg-success bg-opacity-10 text-success p-1 px-2 small rounded-pill" style="font-size: 0.7rem;">
                    <i class="bi bi-dot"></i> Active Session
                  </span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" @click="downloadChat">
                  <i class="bi bi-download me-1"></i>Export
                </button>
                <button class="btn btn-sm btn-primary px-3 rounded-pill shadow-sm" @click="sendToOmlx" :disabled="isSending">
                  <span v-if="isSending" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-stars me-1"></i>AI Analysis
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div class="card-body chat-messages overflow-auto p-4 bg-light bg-opacity-25" ref="messagesContainer">
              <div v-for="(msg, idx) in currentChat.messages" :key="idx" class="mb-4">
                <div 
                  class="message-wrapper"
                  :class="msg.role === 'user' ? 'user-msg' : 'ai-msg'"
                >
                  <div class="message-meta mb-1 px-2">
                    <span class="fw-bold small">{{ msg.role === 'user' ? 'Doctor' : msg.role === 'assistant' ? 'AI Assistant' : 'System' }}</span>
                    <small class="ms-2 opacity-50">{{ msg.timestamp ? formatTime(msg.timestamp) : '' }}</small>
                  </div>
                  <div class="message-bubble shadow-sm p-3">
                    <div class="content" style="white-space: pre-wrap;">{{ msg.content }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="card-footer bg-white p-3 border-top-0">
              <div class="input-group chat-input-group shadow-sm rounded-pill overflow-hidden border">
                <input 
                  v-model="newMessage" 
                  type="text" 
                  class="form-control border-0 ps-4 py-2" 
                  placeholder="Ask about patient data or findings..."
                  @keyup.enter="sendMessage"
                />
                <button class="btn btn-primary px-4" @click="sendMessage" :disabled="!newMessage.trim()">
                  <i class="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Context Sidebar -->
        <div class="col-md-3 col-lg-3 h-100">
          <div v-if="currentChat" class="card border-0 rounded-4 shadow-sm h-100 overflow-auto context-sidebar">
            <div class="card-header bg-white py-3 border-bottom-0">
              <h6 class="fw-bold mb-0 text-uppercase small tracking-wider text-muted">Patient Context</h6>
            </div>
            <div class="card-body pt-0">
              <!-- Profile Info -->
              <div class="context-section mb-4 p-3 bg-primary bg-opacity-10 rounded-4">
                <div class="d-flex align-items-center mb-3 text-primary">
                  <i class="bi bi-person-badge me-2 h5 mb-0"></i>
                  <h6 class="mb-0 fw-bold">Demographics</h6>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <small class="text-muted d-block small-label">Age</small>
                    <span class="fw-bold">{{ currentChat.patientAge || 'N/A' }}</span>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block small-label">Gender</small>
                    <span class="fw-bold text-capitalize">{{ currentChat.patientGender || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- Transcript/Summary section -->
              <div class="context-section">
                <div class="nav nav-pills mb-3 bg-light p-1 rounded-pill" style="font-size: 0.8rem;">
                  <button 
                    class="nav-link py-1 px-3 rounded-pill border-0" 
                    :class="{ active: activeContextTab === 'summary' }"
                    @click="activeContextTab = 'summary'"
                  >Summary</button>
                  <button 
                    class="nav-link py-1 px-3 rounded-pill border-0" 
                    :class="{ active: activeContextTab === 'transcript' }"
                    @click="activeContextTab = 'transcript'"
                  >Transcript</button>
                </div>

                <div class="transcript-box p-3 border-0 rounded-4 bg-light shadow-inner" style="font-size: 0.9rem; max-height: 400px; overflow-y: auto;">
                  <!-- Summary Tab -->
                  <template v-if="activeContextTab === 'summary'">
                    <div v-if="currentChat.aiSummary">
                      <p class="mb-0 text-dark-50" style="line-height: 1.6; white-space: pre-wrap;">{{ currentChat.aiSummary }}</p>
                    </div>
                    <div v-else class="text-center py-5 text-muted">
                      <i class="bi bi-stars display-6 mb-2 opacity-25"></i>
                      <p class="small mb-0">No summary available.</p>
                      <button 
                        class="btn btn-sm btn-outline-primary mt-3 rounded-pill" 
                        @click="generateSummary" 
                        :disabled="isAnalyzing || !currentChat.transcript"
                      >
                        <span v-if="isAnalyzing" class="spinner-border spinner-border-sm me-1"></span>
                        Generate AI Summary
                      </button>
                    </div>
                  </template>

                  <!-- Transcript Tab -->
                  <template v-else>
                    <div v-if="currentChat.transcript">
                      <p class="mb-0 text-dark-50" style="line-height: 1.6;">{{ currentChat.transcript }}</p>
                    </div>
                    <div v-else class="text-center py-5 text-muted">
                      <i class="bi bi-mic-mute display-6 mb-2 opacity-25"></i>
                      <p class="small mb-0">No transcript available.</p>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Additional Notes -->
              <div class="context-section mt-4" v-if="currentChat.patientNotes">
                <h6 class="fw-bold small text-muted text-uppercase mb-2 tracking-wider">Clinical Notes</h6>
                <div class="p-3 border-start border-4 border-primary bg-light rounded-end-4">
                  <small class="text-dark">{{ currentChat.patientNotes }}</small>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="card border-0 rounded-4 shadow-sm h-100 bg-light border-dashed d-flex align-items-center justify-content-center text-center p-4">
             <p class="text-muted small">Select a session to view clinical context</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const CHAT_STORAGE_KEY = 'doctor_chats'

const route = useRoute()
const router = useRouter()

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface Chat {
  chatId: string
  patientName: string
  patientAge?: number
  patientGender?: string
  patientNotes?: string
  createdAt: string
  lastActivity: string
  transcript?: string
  aiSummary?: string
  messages: ChatMessage[]
}

const chats = ref<Chat[]>([])
const currentChatId = ref<string | null>(null)
const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isSending = ref(false)
const isAnalyzing = ref(false)
const activeContextTab = ref<'summary' | 'transcript'>('summary')

const currentChat = computed(() => {
  if (!currentChatId.value) return null
  return chats.value.find(c => c.chatId === currentChatId.value) || null
})

function loadChats() {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY)
    chats.value = stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('[Chat] Failed to load:', e)
    chats.value = []
  }
}

function saveChats() {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats.value))
  } catch (e) {
    console.error('[Chat] Failed to save:', e)
  }
}

function selectChat(chatId: string) {
  currentChatId.value = chatId
  router.replace(`/doctor/chat/${chatId}`)
  nextTick(scrollToBottom)
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function sendMessage() {
  if (!newMessage.value.trim() || !currentChat.value) return
  
  const msg: ChatMessage = {
    role: 'user',
    content: newMessage.value.trim(),
    timestamp: new Date().toISOString()
  }
  
  currentChat.value.messages.push(msg)
  currentChat.value.lastActivity = new Date().toISOString()
  newMessage.value = ''
  
  saveChats()
  nextTick(scrollToBottom)
}

async function generateSummary() {
  if (!currentChat.value || !currentChat.value.transcript || isAnalyzing.value) return
  
  isAnalyzing.value = true
  
  try {
    const transcript = currentChat.value.transcript
    
    const prompt = `Analyzuj následující přepis konzultace.

SNAŽ SE POROZUMĚT KONVERZACI:
- První mluvčí typicky zdraví a představuje se: "Dobrý den, jméno..."
- Druhý mluvčí odpovídá a představuje se
- Tazatel klade otázky (začíná na "Jak", "Co", "Proč", "Můžete", "Zmínil jste", "Povězte")
- Odpovídač popisuje zkušenosti ("Od roku", "Mám", "Zažívám", "Když")

POUŽIJ TATO PRAVIDLA:
- Lékař = klade otázky, formální "Vy", začíná zdravím
- Pacient = odpovídá, popisuje, "Já/Mám"

ÚKOL:
1. Identifikuj mluvčí (Lékař/Pacient).
2. Vytvoř stručné klinické shrnutí (hlavní obtíže, anamnéza, doporučení).
3. Oprav chyby a odstraň výplňková slova (hmm, eh, no, jo).

Přepis:
${transcript}`;

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          { role: 'system', content: 'Jsi zkušený klinický asistent. Tvým úkolem je analyzovat přepisy lékařských konzultací.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    if (response.ok) {
      const data = await response.json()
      const summary = data.choices?.[0]?.message?.content || 'Shrnutí se nepodařilo vygenerovat.'
      
      currentChat.value.aiSummary = summary
      saveChats()
    }
  } catch (e) {
    console.error('[Chat] Summary generation failed:', e)
  } finally {
    isAnalyzing.value = false
  }
}

async function sendToOmlx() {
  if (!currentChat.value || isSending.value) return
  
  isSending.value = true
  
  try {
    const transcript = currentChat.value.transcript || ''
    
    const recentMessages = currentChat.value.messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : m.role,
      content: m.content.substring(0, 1000)
    }))

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          { 
            role: 'system', 
            content: `You are a medical assistant helping a doctor. 
            Patient: ${currentChat.value.patientName}, Age: ${currentChat.value.patientAge || 'Unknown'}, Gender: ${currentChat.value.patientGender || 'Unknown'}.
            Provide clinical insights based on the transcript and current conversation.` 
          },
          ...recentMessages,
          { 
            role: 'user', 
            content: transcript ? `Based on this transcript: "${transcript}", what are the key findings?` : 'Analyze the current conversation and provide clinical suggestions.' 
          }
        ],
        max_tokens: 800
      })
    })

    if (response.ok) {
      const data = await response.json()
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response',
        timestamp: new Date().toISOString()
      }
      currentChat.value.messages.push(aiMsg)
      currentChat.value.lastActivity = new Date().toISOString()
      saveChats()
      nextTick(scrollToBottom)
    }
  } catch (e) {
    console.error('[Chat] AI assist failed:', e)
    alert('AI assistance failed. Please check your connection.')
  } finally {
    isSending.value = false
  }
}

function clearAllChats() {
  if (!confirm('Delete all chats? This cannot be undone.')) return
  chats.value = []
  currentChatId.value = null
  saveChats()
  router.replace('/doctor/chat')
}

function downloadChat() {
  if (!currentChat.value) return
  const content = currentChat.value.messages
    .map(m => `[${m.role.toUpperCase()} ${m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}]\n${m.content}\n`)
    .join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Clinical_Session_${currentChat.value.patientName}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadChats()
  const chatId = route.params.chatId as string
  if (chatId) {
    currentChatId.value = chatId
    nextTick(scrollToBottom)
  }
})

watch(() => route.params.chatId, (newId) => {
  if (newId) {
    currentChatId.value = newId as string
    nextTick(scrollToBottom)
  }
})
</script>

<style scoped lang="scss">
.chat-view {
  background-color: #fcfcfc;
}

.container-fluid {
  height: calc(100vh - 80px); /* Adjust based on navbar height */
}

/* Card Styling to match PatientHome rounded approach */
.card {
  transition: all 0.2s ease;
  background: white;
}

.chat-item {
  transition: all 0.2s ease;
  margin: 4px 8px;
  border-radius: 12px !important;

  &:hover {
    background-color: #f8f9fa;
  }
}

.active-chat {
  background-color: rgba(var(--bs-primary-rgb), 0.08) !important;
  color: var(--bs-primary) !important;
  font-weight: 500;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--bs-primary) 0%, #4a90e2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Message Bubbles - matching the soft rounded aesthetic */
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.user-msg {
  align-items: flex-end;
  margin-left: auto;
}

.ai-msg {
  align-items: flex-start;
}

.message-bubble {
  border-radius: 20px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.user-msg .message-bubble {
  background-color: var(--bs-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-msg .message-bubble {
  background-color: white;
  color: #2d3748;
  border-bottom-left-radius: 4px;
  border: 1px solid #edf2f7;
}

.chat-input-group {
  background: #f8f9fa;
  padding: 4px;
}

.chat-input-group .form-control:focus {
  box-shadow: none;
  background: white;
}

.small-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
  margin-bottom: 2px;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.border-dashed {
  border: 2px dashed #e2e8f0 !important;
}

.tracking-wider {
  letter-spacing: 0.08em;
}

.truncate-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #cbd5e0;
}

@media (max-width: 768px) {
  .container-fluid {
    height: auto;
    overflow: visible;
  }
}
</style>
