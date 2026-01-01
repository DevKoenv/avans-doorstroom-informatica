<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card v-if="!emailSent">
        <CardHeader>
          <CardTitle>{{ t('auth.forgotPasswordTitle') }}</CardTitle>
          <CardDescription>{{ t('auth.forgotPasswordDescription') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert v-if="apiError" variant="destructive" class="mb-4">
            <AlertDescription>{{ apiError }}</AlertDescription>
          </Alert>

          <form @submit.prevent="onSubmit">
            <FieldGroup>
              <VeeField name="email" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="email">{{ t('auth.email') }}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    :placeholder="t('auth.emailPlaceholder')"
                    autocomplete="email"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <Field>
                <Button type="submit" class="w-full" :disabled="loading">
                  <span v-if="!loading">{{ t('auth.sendResetLink') }}</span>
                  <span v-else>{{ t('auth.sending') }}</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div class="mt-4 text-center text-sm">
            <NuxtLink to="/auth/login" class="underline-offset-4 hover:underline">
              {{ t('auth.backToLogin') }}
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <Card v-else>
        <CardHeader>
          <CardTitle>{{ t('auth.checkEmail') }}</CardTitle>
          <CardDescription>
            {{ t('auth.checkEmailDescription', { email: submittedEmail }) }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Alert v-if="resetUrl">
            <AlertDescription>
              <strong>{{ t('auth.demoMode') }}:</strong> {{ t('auth.demoResetLink') }}
              <NuxtLink :to="resetUrl" class="block mt-2 text-sm text-primary hover:underline break-all">
                {{ resetUrl }}
              </NuxtLink>
            </AlertDescription>
          </Alert>

          <div class="text-center">
            <Button @click="goToLogin">
              {{ t('auth.backToLogin') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useI18n } from 'vue-i18n'
import * as z from 'zod'

definePageMeta({
  layout: 'blank',
})

const { t } = useI18n()
const router = useRouter()
const apiError = ref('')
const loading = ref(false)
const emailSent = ref(false)
const submittedEmail = ref('')
const resetUrl = ref('')

const formSchema = z.object({
  email: z.string().email(t('auth.errors.validEmail')),
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { email: '' },
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  loading.value = true

  try {
    const res = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: values,
    })

    if (res.success) {
      submittedEmail.value = values.email
      emailSent.value = true

      if (res.url) {
        const url = new URL(res.url)
        resetUrl.value = url.pathname + url.search
      }
    }
  } catch (err: any) {
    const errorCode = err.data?.code
    apiError.value = errorCode
      ? t(`auth.errors.${errorCode}`)
      : t('auth.errors.sendResetFailed')
  } finally {
    loading.value = false
  }
})

function goToLogin() {
  router.push('/auth/login')
}
</script>