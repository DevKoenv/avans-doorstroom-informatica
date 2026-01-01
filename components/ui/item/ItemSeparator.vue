<template>
  <Separator
    data-slot="item-separator"
    orientation="horizontal"
    :class="cn('my-0', props.class)"
  />
</template>

<script setup lang="ts">
import type { SeparatorProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { cn } from "@/utils/cn";

const props = defineProps<SeparatorProps & { class?: HTMLAttributes["class"] }>();
</script>
