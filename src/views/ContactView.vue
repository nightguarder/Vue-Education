<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')

const contactEmail = 'cyril.steger@tutamail.com'

const submitForm = () => {
  const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject.value)}&body=${encodeURIComponent(
    `Jméno: ${name.value}\nEmail: ${email.value}\n\n${message.value}`
  )}`
  window.location.href = mailtoLink
}
</script>

<template>
  <main class="contact-page">
    <BContainer>
      <BRow class="justify-content-center">
        <BCol lg="8">
          <h1 class="mb-4">Kontaktujte nás</h1>
          <p class="lead text-muted mb-5">
            Máte dotazy? Napište nám na
            <a :href="`mailto:${contactEmail}`" class="text-primary">{{ contactEmail }}</a>
          </p>

          <BCard class="border-0 shadow-sm">
            <BCardBody class="p-4">
              <BForm @submit.prevent="submitForm">
                <BFormGroup label="Jméno" label-for="name" class="mb-3">
                  <BFormInput
                    id="name"
                    v-model="name"
                    placeholder="Vaše jméno"
                    required
                  />
                </BFormGroup>

                <BFormGroup label="Email" label-for="email" class="mb-3">
                  <BFormInput
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="vas@email.cz"
                    required
                  />
                </BFormGroup>

                <BFormGroup label="Předmět" label-for="subject" class="mb-3">
                  <BFormInput
                    id="subject"
                    v-model="subject"
                    placeholder="Předmět zprávy"
                    required
                  />
                </BFormGroup>

                <BFormGroup label="Zpráva" label-for="message" class="mb-4">
                  <BFormTextarea
                    id="message"
                    v-model="message"
                    placeholder="Vaše zpráva..."
                    rows="5"
                    required
                  />
                </BFormGroup>

                <BButton type="submit" variant="primary" size="lg" class="w-100">
                  <i class="bi bi-envelope me-2"></i>
                  Odeslat zprávu
                </BButton>
              </BForm>
            </BCardBody>
          </BCard>
        </BCol>
      </BRow>
    </BContainer>
  </main>
</template>

<style scoped lang="scss">
.contact-page {
  padding: 3rem 0;
}

.text-primary {
  color: $primary-color !important;
}
</style>
