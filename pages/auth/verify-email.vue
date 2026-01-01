<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('auth.verifyTitle') }}</CardTitle>
          <CardDescription>
            {{ $t('auth.verifyDescription', { email: email || $t('auth.email') }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert v-if="apiError" variant="destructive" class="mb-4">
            <AlertDescription>{{ apiError }}</AlertDescription>
          </Alert>

          <Alert v-if="successMessage" class="mb-4">
            <AlertDescription>{{ successMessage }}</AlertDescription>
          </Alert>

          <form @submit.prevent="onSubmit" class="space-y-4">
            <VeeField name="code" v-slot="{ field, errors }" :validate-on-blur="true">
              <Field :data-invalid="!!errors.length">
                <FieldLabel for="code">{{ $t('auth.verificationCode') }}</FieldLabel>
                <Input
                  id="code"
                  type="text"
                  :placeholder="$t('auth.enterCode')"
                  autocomplete="one-time-code"
                  v-bind="field"
                  :aria-invalid="!!errors.length"
                  class="text-center text-lg tracking-wider"
                />
                <FieldDescription>{{ $t('auth.enterCodeDescription') }}</FieldDescription>
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>

            <div class="space-y-2">
              <Button type="submit" class="w-full" :disabled="loading || !!successMessage">
                <span v-if="!loading">{{ $t('auth.verifyEmail') }}</span>
                <span v-else>{{ $t('auth.verifying') }}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                class="w-full"
                :disabled="resendDisabled"
                @click="resendCode"
              >
                {{ resendDisabled ? $t('auth.resendIn', { seconds: resendTimer }) : $t('auth.resendCode') }}
              </Button>
            </div>
          </form>

          <div class="mt-4 text-center text-sm">
            <NuxtLink to="/auth/login" class="underline-offset-4 hover:underline">
              {{ $t('auth.backToLogin') }}
            </NuxtLink>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useI18n } from 'vue-i18n'
import * as z from 'zod'

definePageMeta({
  layout: 'blank',
})

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const apiError = ref('')
const successMessage = ref('')
const loading = ref(false)
const resendDisabled = ref(false)
const resendTimer = ref(0)
const email = ref('')

const formSchema = z.object({
  code: z.string().min(1, t('auth.errors.codeRequired')),
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { code: '' },
})

onMounted(() => {
  email.value = (route.query.email as string) || ''

  const tokenFromUrl = route.query.token as string
  if (tokenFromUrl) {
    // Could auto-fill the field here
  }
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    const res = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: {
        token: values.code,
      },
    })

    if (res.success) {
      successMessage.value = t('auth.emailVerifiedSuccess')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  } catch (err: any) {
    const errorCode = err.data?.code
    apiError.value = errorCode
      ? t(`auth.errors.${errorCode}`)
      : t('auth.errors.verificationFailed')
  } finally {
    loading.value = false
  }
})

async function resendCode() {
  if (!email.value) {
    apiError.value = t('auth.errors.emailRequired')
    return
  }

  apiError.value = ''
  successMessage.value = ''
  resendDisabled.value = true
  resendTimer.value = 60

  const interval = setInterval(() => {
    resendTimer.value--
    if (resendTimer.value <= 0) {
      clearInterval(interval)
      resendDisabled.value = false
    }
  }, 1000)

  try {
    const res = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: email.value },
    })

    if (res.success) {
      successMessage.value = res.message || t('auth.resendCode')

      if (res.url) {
        const url = new URL(res.url)
        const newToken = url.searchParams.get('token')
        if (newToken) {
          console.log('New verification token:', newToken)
        }
      }
    }
  } catch (err: any) {
    const errorCode = err.data?.code
    apiError.value = errorCode
      ? t(`auth.errors.${errorCode}`)
      : t('auth.errors.resendFailed')
    clearInterval(interval)
    resendDisabled.value = false
    resendTimer.value = 0
  }
}
</script>