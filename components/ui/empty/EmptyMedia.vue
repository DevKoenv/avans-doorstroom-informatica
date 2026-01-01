<template>
  <div
    data-slot="empty-icon"
    :data-variant="variant"
    :class="cn(emptyMediaVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { EmptyMediaVariants } from "@/utils/variants/empty";
import { cn } from "@/utils/cn";
import { emptyMediaVariants } from "@/utils/variants/empty";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  variant?: EmptyMediaVariants["variant"];
}>();
</script>
