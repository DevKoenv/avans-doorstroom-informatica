<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="teams" :current-team-id="currentTeamId" />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in navMain" :key="item.title">
            <SidebarMenuButton :is-active="item.isActive" as-child>
              <NuxtLink :to="item.url">
                <component :is="item.icon" v-if="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import type { SidebarProps } from '@/utils/variants/sidebar';

import {
  Users,
  Folder,
  Tag,
  Settings2,
  Bookmark,
} from 'lucide-vue-next';
import NavUser from '@/components/NavUser.vue';
import TeamSwitcher from '@/components/TeamSwitcher.vue';

const { user } = useUserSession();
const route = useRoute();

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
});

// Fetch user's teams
const { data: teamsData } = await useFetch('/api/teams');
const teams = computed(() => {
  const rawTeams = teamsData.value?.teams || [];
  return rawTeams.map((team: any) => ({
    name: team.name,
    logo: Users,
    plan: team.role,
    id: team.id,
  }));
});

// Get current team ID from route
const currentTeamId = computed(() => {
  const teamId = route.params.teamId;
  return teamId ? parseInt(teamId as string) : null;
});

// Navigation items based on current team
const navMain = computed(() => {
  if (!currentTeamId.value) {
    return [
      {
        title: 'Teams',
        url: '/app/teams',
        icon: Users,
        isActive: true,
      },
    ];
  }

  return [
    {
      title: 'Collections',
      url: `/app/teams/${currentTeamId.value}`,
      icon: Folder,
      isActive: route.path.includes('/collections') || route.path === `/app/teams/${currentTeamId.value}`,
    },
    {
      title: 'Tags',
      url: `/app/teams/${currentTeamId.value}/tags`,
      icon: Tag,
      isActive: route.path.includes('/tags'),
    },
    {
      title: 'Members',
      url: `/app/teams/${currentTeamId.value}/members`,
      icon: Users,
      isActive: route.path.includes('/members'),
    },
    {
      title: 'Settings',
      url: `/app/teams/${currentTeamId.value}/settings`,
      icon: Settings2,
      isActive: route.path.includes('/settings'),
    },
  ];
});
</script>
