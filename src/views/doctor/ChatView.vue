<template>
  <div class="chat-view h-100">
    <div class="container-fluid py-4 h-100">
      <div class="row h-100 g-4">
        <!-- 1. Chat List Sidebar (Collapsible) -->
        <div v-if="showChatList" class="col-md-2 h-100">
          <div class="card border-0 rounded-4 shadow-sm h-100 overflow-hidden">
            <div
              class="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center"
            >
              <h6 class="fw-bold mb-0 text-uppercase small tracking-wider">Sezení</h6>
              <div class="d-flex gap-1">
                <button
                  class="btn btn-link text-primary p-0"
                  @click="showChatList = false"
                  title="Collapse"
                >
                  <i class="bi bi-layout-sidebar-inset h6"></i>
                </button>
                <button
                  class="btn btn-link text-danger p-0"
                  @click="clearAllChats"
                  title="Clear all"
                >
                  <i class="bi bi-trash3 h6"></i>
                </button>
              </div>
            </div>
            <div class="card-body p-0 overflow-auto">
              <div v-if="chats.length === 0" class="text-center text-muted p-4">
                <p class="small mb-0">Žádná sezení</p>
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
                    <span class="fw-bold text-truncate mb-0">{{ chat.patientName }}</span>
                    <small class="text-muted" style="font-size: 0.75rem">{{
                      formatDate(chat.createdAt)
                    }}</small>
                  </div>
                  <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted truncate-1" style="font-size: 0.7rem"
                      >ID: {{ chat.chatId.slice(0, 8) }}</small
                    >
                    <i class="bi bi-chevron-right small opacity-50"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Chat List Collapsed -->
        <div v-else class="col-md-1 h-100 d-flex align-items-center justify-content-center">
          <button
            class="btn btn-link text-primary"
            @click="showChatList = true"
            title="Expand Chat List"
          >
            <i class="bi bi-layout-sidebar h4"></i>
          </button>
        </div>

        <!-- 2. Main Chat Window -->
        <div class="col-md-6 col-lg-7 h-100">
          <div
            v-if="!currentChat"
            class="card border-0 rounded-4 shadow-sm h-100 d-flex align-items-center justify-content-center text-center empty-state-card"
          >
            <div class="p-5">
              <div class="bg-primary bg-opacity-10 rounded-circle p-4 d-inline-block mb-3">
                <i class="bi bi-chat-dots-fill text-primary display-5"></i>
              </div>
              <h5 class="fw-bold">Vyberte klinické sezení</h5>
              <p class="text-muted">Vyberte pacienta z levého panelu pro zahájení analýzy</p>
            </div>
          </div>

          <div
            v-else
            class="card border-0 rounded-4 shadow-sm h-100 d-flex flex-column main-chat-card overflow-hidden"
          >
            <!-- Chat Header -->
            <div
              class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center"
            >
              <div class="d-flex align-items-center">
                <div class="avatar-circle me-3">{{ currentChat.patientName.charAt(0) }}</div>
                <div>
                  <h6 class="fw-bold mb-0">{{ currentChat.patientName }}</h6>
                  <span
                    class="badge bg-success bg-opacity-10 text-success p-1 px-2 small rounded-pill"
                    style="font-size: 0.7rem"
                  >
                    <i class="bi bi-dot"></i> Aktivní sezení
                  </span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  @click="downloadChat"
                >
                  <i class="bi bi-download me-1"></i>Exportovat
                </button>
                <button
                  class="btn btn-sm btn-outline-primary rounded-pill px-3"
                  @click="showQrModal = true"
                >
                  <i class="bi bi-qr-code me-1"></i>QR dotazník
                </button>
                <button
                  class="btn btn-sm btn-primary px-3 rounded-pill shadow-sm"
                  @click="sendToOmlx"
                  :disabled="isSending"
                >
                  <span v-if="isSending" class="spinner-border spinner-border-sm me-1"></span>
                  <i v-else class="bi bi-stars me-1"></i>AI analýza
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div
              class="card-body chat-messages overflow-auto p-4 bg-light bg-opacity-25"
              ref="messagesContainer"
            >
              <div v-for="(msg, idx) in currentChat.messages" :key="idx" class="mb-4">
                <div class="message-wrapper" :class="msg.role === 'user' ? 'user-msg' : 'ai-msg'">
                  <div class="message-meta mb-1 px-2">
                    <span class="fw-bold small">{{
                      msg.role === 'user'
                        ? 'Lékař'
                        : msg.role === 'assistant'
                          ? 'AI asistent'
                          : 'Systém'
                    }}</span>
                    <small class="ms-2 opacity-50">{{
                      msg.timestamp ? formatTime(msg.timestamp) : ''
                    }}</small>
                  </div>
                  <div class="message-bubble shadow-sm p-3">
                    <div class="content" style="white-space: pre-wrap">{{ msg.content }}</div>
                  </div>
                </div>
              </div>

              <!-- Streaming response -->
              <div v-if="isSending && streamingContent" class="mb-4">
                <div class="message-wrapper ai-msg">
                  <div class="message-meta mb-1 px-2">
                    <span class="fw-bold small">AI Assistant</span>
                    <span class="ms-2 opacity-50">
                      <span
                        class="spinner-border spinner-border-sm"
                        style="width: 0.7rem; height: 0.7rem"
                      ></span>
                    </span>
                  </div>
                  <div class="message-bubble shadow-sm p-3">
                    <div class="content" style="white-space: pre-wrap">
                      {{ streamingContent }}<span class="blinking-cursor">|</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="card-footer bg-white p-3 border-top-0">
              <div
                class="input-group chat-input-group shadow-sm rounded-pill overflow-hidden border"
              >
                <input
                  v-model="newMessage"
                  type="text"
                  class="form-control border-0 ps-4 py-2"
                  placeholder="Zeptejte se na data pacienta nebo nálezy..."
                  @keyup.enter="sendMessage"
                />
                <button
                  class="btn btn-primary px-4"
                  @click="sendMessage"
                  :disabled="!newMessage.trim()"
                >
                  <i class="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Context Sidebar -->
        <div class="col-md-3 col-lg-3 h-100">
          <div
            v-if="currentChat"
            class="card border-0 rounded-4 shadow-sm h-100 overflow-auto context-sidebar"
          >
            <div class="card-header bg-white py-3 border-bottom-0">
              <h6 class="fw-bold mb-0 text-uppercase small tracking-wider text-muted">
                Kontext pacienta
              </h6>
            </div>
            <div class="card-body pt-0">
              <!-- Profile Info -->
              <div class="context-section mb-4 p-3 bg-primary bg-opacity-10 rounded-4">
                <div class="d-flex align-items-center mb-3 text-primary">
                  <i class="bi bi-person-badge me-2 h5 mb-0"></i>
                  <h6 class="mb-0 fw-bold">Demografie</h6>
                </div>
                <div class="row g-2">
                  <div class="col-6">
                    <small class="text-muted d-block small-label">Věk</small>
                    <span class="fw-bold">{{ currentChat.patientAge || 'N/A' }}</span>
                  </div>
                  <div class="col-6">
                    <small class="text-muted d-block small-label">Pohlaví</small>
                    <span class="fw-bold text-capitalize">{{
                      currentChat.patientGender || 'N/A'
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Transcript/Summary section -->
              <div class="context-section">
                <div class="nav nav-pills mb-3 bg-light p-1 rounded-pill" style="font-size: 0.8rem">
                  <button
                    class="nav-link py-1 px-3 rounded-pill border-0"
                    :class="{ active: activeContextTab === 'summary' }"
                    @click="activeContextTab = 'summary'"
                  >
                    Shrnutí
                  </button>
                  <button
                    class="nav-link py-1 px-3 rounded-pill border-0"
                    :class="{ active: activeContextTab === 'transcript' }"
                    @click="activeContextTab = 'transcript'"
                  >
                    Přepis
                  </button>
                </div>

                <div
                  class="transcript-box p-3 border-0 rounded-4 bg-light shadow-inner"
                  style="font-size: 0.9rem; max-height: 400px; overflow-y: auto"
                >
                  <!-- Summary Tab -->
                  <template v-if="activeContextTab === 'summary'">
                    <div v-if="currentChat.aiSummary">
                      <p class="mb-0 text-dark-50" style="line-height: 1.6; white-space: pre-wrap">
                        {{ currentChat.aiSummary }}
                      </p>
                    </div>
                    <div v-else class="text-center py-5 text-muted">
                      <i class="bi bi-stars display-6 mb-2 opacity-25"></i>
                      <p class="small mb-0">Žádné shrnutí není k dispozici.</p>
                      <button
                        class="btn btn-sm btn-outline-primary mt-3 rounded-pill"
                        @click="generateSummary"
                        :disabled="isAnalyzing || !currentChat.transcript"
                      >
                        <span
                          v-if="isAnalyzing"
                          class="spinner-border spinner-border-sm me-1"
                        ></span>
                        Vygenerovat AI shrnutí
                      </button>
                    </div>
                  </template>

                  <!-- Transcript Tab -->
                  <template v-else>
                    <div v-if="currentChat.transcript">
                      <p class="mb-0 text-dark-50" style="line-height: 1.6">
                        {{ currentChat.transcript }}
                      </p>
                    </div>
                    <div v-else class="text-center py-5 text-muted">
                      <i class="bi bi-mic-mute display-6 mb-2 opacity-25"></i>
                      <p class="small mb-0">Žádný přepis není k dispozici.</p>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Additional Notes -->
              <div class="context-section mt-4" v-if="currentChat.patientNotes">
                <h6 class="fw-bold small text-muted text-uppercase mb-2 tracking-wider">
                  Klinické poznámky
                </h6>
                <div class="p-3 border-start border-4 border-primary bg-light rounded-end-4">
                  <small class="text-dark">{{ currentChat.patientNotes }}</small>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="card border-0 rounded-4 shadow-sm h-100 bg-light border-dashed d-flex align-items-center justify-content-center text-center p-4"
          >
            <p class="text-muted small">Vyberte sezení pro zobrazení klinického kontextu</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- QR Modal for Patient Survey -->
  <div
    v-if="showQrModal"
    class="modal d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.5)"
  >
    <div class="modal-dialog modal-dialog-centered m-auto" style="max-width: 400px">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">QR dotazník pro pacienta</h5>
          <button type="button" class="btn-close" @click="showQrModal = false"></button>
        </div>
        <div class="modal-body">
          <SurveyQRCode :sessionId="currentChat?.chatId || ''" :patientName="currentChat?.patientName" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showQrModal = false">
            Zavřít
          </button>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSummaryAnalysisPrompt, getChatSystemMessage } from '@/services/aiPrompts'
import SurveyQRCode from '@/components/SurveyQRCode.vue'

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
  patientId?: string
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
const showChatList = ref(true)
const showQrModal = ref(false)
const streamingContent = ref('')

const currentChat = computed(() => {
  if (!currentChatId.value) return null
  return chats.value.find((c) => c.chatId === currentChatId.value) || null
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
    timestamp: new Date().toISOString(),
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

    const prompt = getSummaryAnalysisPrompt(transcript)

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [
          {
            role: 'system',
            content:
              'Jsi zkušený klinický asistent. Tvým úkolem je analyzovat přepisy lékařských konzultací.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
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
    // Build system message with full patient context (sent each request for stateless API)
    const systemMessage = getChatSystemMessage({
      patientName: currentChat.value.patientName,
      patientAge: currentChat.value.patientAge,
      patientGender: currentChat.value.patientGender,
      aiSummary: currentChat.value.aiSummary,
      transcript: currentChat.value.transcript,
    })

    // Send last 10 messages for conversation continuity
    const historyMessages = currentChat.value.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content.substring(0, 500),
    }))

    const response = await fetch('/omlx/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OMLX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemma-4-e4b-it-OptiQ-4bit',
        messages: [{ role: 'system', content: systemMessage }, ...historyMessages],
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) throw new Error(`API failed: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') break

          try {
            const data = JSON.parse(dataStr)
            const content = data.choices?.[0]?.delta?.content || ''
            streamingContent.value += content
            nextTick(scrollToBottom)
          } catch (e) {
            // Partial JSON
          }
        }
      }
    }

    // Save AI response
    if (streamingContent.value) {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: streamingContent.value,
        timestamp: new Date().toISOString(),
      }
      currentChat.value.messages.push(aiMsg)
      currentChat.value.lastActivity = new Date().toISOString()
      saveChats()
    }
  } catch (e) {
    console.error('[Chat] AI asistence selhala:', e)
    alert('AI asistence selhala. Zkontrolujte prosím připojení.')
  } finally {
    isSending.value = false
    streamingContent.value = ''
    nextTick(scrollToBottom)
  }
}

function clearAllChats() {
  if (!confirm('Smazat všechny chaty? Tuto akci nelze vrátit.')) return
  chats.value = []
  currentChatId.value = null
  saveChats()
  router.replace('/doctor/chat')
}

function downloadChat() {
  if (!currentChat.value) return
  const content = currentChat.value.messages
    .map(
      (m) =>
        `[${m.role.toUpperCase()} ${m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}]\n${m.content}\n`,
    )
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

watch(
  () => route.params.chatId,
  (newId) => {
    if (newId) {
      currentChatId.value = newId as string
      nextTick(scrollToBottom)
    }
  },
)
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

.blinking-cursor {
  animation: blink 1s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}
</style>
