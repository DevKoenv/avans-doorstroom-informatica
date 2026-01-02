<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <component
                :is="activeTeam?.logo || Users"
                class="size-4"
              />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ activeTeam?.name || 'Select Team' }}
              </span>
              <span class="truncate text-xs">{{ activeTeam?.plan || '' }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground"> Teams </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(team, index) in teams"
            :key="team.id"
            class="gap-2 p-2"
            @click="navigateToTeam(team)"
          >
            <div class="flex size-6 items-center justify-center rounded-sm border">
              <component
                :is="team.logo"
                class="size-3.5 shrink-0"
              />
            </div>
            {{ team.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2" @click="navigateTo('/app/teams')">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <Plus class="size-4" />
            </div>
            <div class="font-medium text-muted-foreground">View all teams</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { ChevronsUpDown, Plus, Users } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  teams: {
    id: number;
    name: string;
    logo: Component;
    plan: string;
  }[];
  currentTeamId?: number | null;
}>();

const { isMobile } = useSidebar();

// Find active team based on currentTeamId prop
const activeTeam = computed(() => {
  if (!props.currentTeamId) return props.teams[0];
  return props.teams.find(team => team.id === props.currentTeamId) || props.teams[0];
});

function navigateToTeam(team: { id: number; name: string }) {
  navigateTo(`/app/teams/${team.id}`);
}
</script>
