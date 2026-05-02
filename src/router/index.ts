import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
    },
    // Patient portal routes - added progressively
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
      path: '/patients/worry',
      name: 'patient-worry',
      component: () => import('../views/patient/PatientWorryShredder.vue'),
    },
    {
      path: '/patients/infographics',
      name: 'patient-infographics',
      component: () => import('../views/patient/PatientInfographics.vue'),
    },
    {
      path: '/patients/audio',
      name: 'patient-audio',
      component: () => import('../views/patient/PatientAudio.vue'),
    },
    {
      path: '/patients/feedback',
      name: 'patient-feedback',
      component: () => import('../views/patient/PatientFeedback.vue'),
    },
    // Doctor portal routes - added progressively when ready
    // Settings route
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

export default router
