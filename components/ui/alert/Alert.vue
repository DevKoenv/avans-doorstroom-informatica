<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { AlertVariants } from "@/utils/variants/alert"
import { cn } from '@/utils/cn'
import { alertVariants } from "@/utils/variants/alert"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: AlertVariants["variant"]
}>()
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
