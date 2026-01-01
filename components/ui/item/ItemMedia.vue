<template>
  <div
    data-slot="item-media"
    :data-variant="props.variant"
    :class="cn(itemMediaVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { ItemMediaVariants } from "@/utils/variants/item";
import { cn } from "@/utils/cn";
import { itemMediaVariants } from "@/utils/variants/item";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  variant?: ItemMediaVariants["variant"];
}>();
</script>
