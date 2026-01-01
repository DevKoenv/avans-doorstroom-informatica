<template>
  <div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>{{ t('auth.signInTitle') }}</CardTitle>
          <CardDescription>{{ t('auth.enterEmail') }}</CardDescription>
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

              <VeeField name="password" v-slot="{ field, errors }" :validate-on-blur="true">
                <Field :data-invalid="!!errors.length">
                  <div class="flex items-center">
                    <FieldLabel for="password">{{ t('auth.password') }}</FieldLabel>
                    <NuxtLink
                      to="/auth/forgot-password"
                      class="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      {{ t('auth.forgotPassword') }}
                    </NuxtLink>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    v-bind="field"
                    :aria-invalid="!!errors.length"
                  />
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>

              <Field>
                <Button type="submit" class="w-full" :disabled="loading">
                  <span v-if="!loading">{{ t('auth.login') }}</span>
                  <span v-else>{{ t('auth.loggingIn') }}</span>
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <div class="mt-4 text-center text-sm">
            <span class="text-muted-foreground">{{ t('auth.dontHaveAccount') }}</span>
            <NuxtLink to="/auth/register" class="ml-1 underline-offset-4 hover:underline">
              {{ t('auth.signUp') }}
            </NuxtLink>
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

const formSchema = z.object({
  email: z.string().email(t('auth.errors.validEmail')),
  password: z.string().min(6, t('auth.errors.passwordMinLength', { min: 6 })),
})

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { email: '', password: '' },
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  loading.value = true

  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: values,
    })

    if (res.success) {
      await router.push('/')
    }
  } catch (err: any) {
    if (err.statusCode === 401 && err.data?.message?.includes('not verified')) {
      await router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`)
    } else {
      const errorCode = err.data?.code
      apiError.value = errorCode
        ? t(`auth.errors.${errorCode}`)
        : t('auth.errors.loginFailed')
    }
  } finally {
    loading.value = false
  }
})
</script>
