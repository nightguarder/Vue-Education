import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
    },
    // Patient portal routes
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
      path: '/patients/stress',
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
      component: () => import('../views/patient/PatientAudio.vue'),
    },
    {
      path: '/patients/feedback',
      name: 'patient-feedback',
      component: () => import('../views/patient/PatientFeedback.vue'),
    },
    // Doctor portal routes
    // Settings route
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

export default router
