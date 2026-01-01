<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>{{ t('auth.resetPasswordTitle') }}</CardTitle>
          <CardDescription>{{ t('auth.resetPasswordDescription') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert v-if="apiError" variant="destructive" class="mb-4">
            <AlertDescription>{{ apiError }}</AlertDescription>
          </Alert>

          <Alert v-if="successMessage" class="mb-4">
            <AlertDescription>{{ successMessage }}</AlertDescription>
          </Alert>

          <Alert v-if="!token" variant="destructive" class="mb-4">
            <AlertDescription>{{ t('auth.invalidResetToken') }}</AlertDescription>
          </Alert>

          <form v-if="token && !successMessage" @submit.prevent="onSubmit">
            <FieldGroup>
              <VeeField name="password" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="password">{{ t('auth.newPassword') }}</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldDescription>{{ t('auth.passwordMinLength') }}</FieldDescription>
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <VeeField name="confirmPassword" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <FieldLabel for="confirmPassword">{{ t('auth.confirmNewPassword') }}</FieldLabel>
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
                  <span v-if="!loading">{{ t('auth.resetPassword') }}</span>
                  <span v-else>{{ t('auth.resetting') }}</span>
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
const token = ref('')

const formSchema = z.object({
  password: z.string().min(8, t('auth.errors.passwordMinLength', { min: 8 })),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.errors.passwordsNoMatch'),
  path: ['confirmPassword'],
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { password: '', confirmPassword: '' },
})

onMounted(() => {
  token.value = (route.query.token as string) || ''
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    const res = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: values.password,
      },
    })

    if (res.success) {
      successMessage.value = t('auth.passwordResetSuccess')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    }
  } catch (err: any) {
    const errorCode = err.data?.code
    apiError.value = errorCode
      ? t(`auth.errors.${errorCode}`)
      : t('auth.errors.resetFailed')
  } finally {
    loading.value = false
  }
})
</script>