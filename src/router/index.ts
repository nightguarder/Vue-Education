import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
    },
    // Patient portal routes
    {
      path: '/patients',
      redirect: '/patients/home',
    },
    {
      path: '/patients/home',
      name: 'patient-home',
      component: () => import('../views/patient/PatientHome.vue'),
    },
    {
      path: '/patients/worksheets',
      name: 'patient-worksheets',
      component: () => import('../views/patient/PatientWorksheets.vue'),
    },
    {
      path: '/patients/stress-relief',
      name: 'stress-relief',
      component: () => import('../views/patient/PatientStressRelief.vue'),
    },
    {
      path: '/patients/resources',
      name: 'patient-resources',
      component: () => import('../views/patient/PatientResources.vue'),
    },
    {
      path: '/patients/audio',
      name: 'patient-audio',
      component: () => import('../views/patient/PatientAudioLibrary.vue'),
    },
    {
      path: '/patients/infographics',
      name: 'patient-infographics',
      component: () => import('../views/patient/PatientInfographics.vue'),
    },
    {
      path: '/patients/feedback',
      name: 'patient-feedback',
      component: () => import('../views/patient/PatientFeedback.vue'),
    },
    {
      path: '/patients/survey/personalized',
      name: 'patient-personalized-survey',
      component: () => import('../views/patient/PersonalizedSurvey.vue'),
    },
    {
      path: '/doctor/feedback',
      name: 'doctor-feedback',
      component: () => import('../views/PatientFeedback.vue'),
    },
    // Doctor portal routes
    {
      path: '/doctor',
      redirect: '/doctor/home',
    },
    {
      path: '/doctor/home',
      name: 'doctor-home',
      component: () => import('../views/doctor/DoctorLanding.vue'),
    },
    {
      path: '/doctor/education',
      name: 'doctor-education',
      component: () => import('../views/doctor/DoctorEducation.vue'),
    },
    {
      path: '/doctor/research',
      name: 'doctor-research',
      component: () => import('../views/doctor/ResearchNotebook.vue'),
    },
    {
      path: '/doctor/transcription',
      name: 'doctor-transcription',
      component: () => import('../views/doctor/TranscriptionView.vue'),
    },
    {
      path: '/doctor/chat',
      name: 'doctor-chat',
      component: () => import('../views/doctor/ChatView.vue'),
    },
    {
      path: '/doctor/chat/:chatId',
      name: 'doctor-chat-detail',
      component: () => import('../views/doctor/ChatView.vue'),
    },
    // Settings route
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    // Contact route
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
    },
  ],
})

export default router
