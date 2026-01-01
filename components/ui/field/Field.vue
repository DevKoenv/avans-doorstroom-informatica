<template>
  <div
    role="group"
    data-slot="field"
    :data-orientation="orientation"
    :class="cn(fieldVariants({ orientation }), props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { FieldVariants } from "@/utils/variants/field";
import { cn } from "@/utils/cn";
import { fieldVariants } from "@/utils/variants/field";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  orientation?: FieldVariants["orientation"];
}>();
</script>
