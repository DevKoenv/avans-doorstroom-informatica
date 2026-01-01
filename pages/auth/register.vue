<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card v-if="!showVerification">
        <CardHeader>
          <CardTitle>{{ $t('auth.createAccount') }}</CardTitle>
          <CardDescription>{{ $t('auth.enterDetails') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert v-if="apiError" variant="destructive" class="mb-4">
            <AlertDescription>{{ apiError }}</AlertDescription>
          </Alert>

          <form @submit.prevent="onSubmit">
            <FieldGroup>
              <VeeField name="name" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="name">{{ $t('auth.name') }}</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    :placeholder="$t('auth.namePlaceholder')"
                    autocomplete="name"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="email" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="email">{{ $t('auth.email') }}</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    :placeholder="$t('auth.emailPlaceholder')"
                    autocomplete="email"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="password" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="password">{{ $t('auth.password') }}</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldDescription>{{ $t('auth.passwordMinLength') }}</FieldDescription>
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="confirmPassword" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="confirmPassword">{{ $t('auth.confirmPassword') }}</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <Field>
                <Button type="submit" class="w-full" :disabled="loading">
                  <span v-if="!loading">{{ $t('auth.createAccountButton') }}</span>
                  <span v-else>{{ $t('auth.creatingAccount') }}</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div class="mt-4 text-center text-sm">
            <span class="text-muted-foreground">{{ $t('auth.alreadyHaveAccount') }}</span>
            <NuxtLink to="/auth/login" class="ml-1 underline-offset-4 hover:underline">
              {{ $t('auth.signIn') }}
            </NuxtLink>
          </div>
        </CardContent>
      </Card>

      <Card v-else>
        <CardHeader>
          <CardTitle>{{ $t('auth.verifyTitle') }}</CardTitle>
          <CardDescription>{{ $t('auth.demoVerificationCode', { email: registeredEmail }) }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>{{ $t('auth.demoMode') }}:</strong> {{ $t('auth.demoCodeIs') }}
              <code class="block mt-2 p-2 bg-muted rounded text-lg font-mono">{{ verificationCode }}</code>
            </AlertDescription>
          </Alert>

          <div class="text-center">
            <Button @click="goToVerification">
              {{ $t('auth.continueToVerification') }}
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
const showVerification = ref(false)
const verificationCode = ref('')
const registeredEmail = ref('')

const formSchema = z.object({
  name: z.string().min(1, t('auth.nameRequired')),
  email: z.string().email(t('auth.errors.validEmail')),
  password: z.string().min(8, t('auth.errors.passwordMinLength', { min: 8 })),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.errors.passwordsNoMatch'),
  path: ['confirmPassword'],
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { name: '', email: '', password: '', confirmPassword: '' },
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  loading.value = true

  try {
    const res = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: values.name,
        email: values.email,
        password: values.password,
      },
    })

    if (res.success) {
      const url = new URL(res.url)
      const token = url.searchParams.get('token')
      verificationCode.value = token || ''
      registeredEmail.value = values.email
      showVerification.value = true
    }
  } catch (err: any) {
    const errorCode = err.data?.code
    if (errorCode === 'EMAIL_ALREADY_EXISTS') {
      apiError.value = t('auth.errors.emailAlreadyExists')
    } else {
      apiError.value = t('auth.errors.registrationFailed')
    }
  } finally {
    loading.value = false
  }
})

function goToVerification() {
  router.push(`/auth/verify-email?email=${encodeURIComponent(registeredEmail.value)}`)
}
</script>