<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.name"
              />
              <AvatarFallback class="rounded-lg">{{ getInitials(user.name) }}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ user.name }}</span>
              <span class="truncate text-xs">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="user.avatar"
                  :src="user.avatar"
                  :alt="user.name"
                />
                <AvatarFallback class="rounded-lg">{{ getInitials(user.name) }}</AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">{{ user.name }}</span>
                <span class="truncate text-xs">{{ user.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem @click="navigateTo('/profile')">
              <User />
              {{ $t('nav.profile') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="navigateTo('/settings')">
              <Settings />
              {{ $t('nav.settings') }}
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem @click.prevent="toggleTheme">
              <Moon v-if="colorMode.value === 'dark'" />
              <Sun v-else />
              {{ colorMode.value === 'dark' ? $t('nav.lightMode') : $t('nav.darkMode') }}
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Languages />
                {{ $t('nav.language') }}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  v-for="locale in locales"
                  :key="locale.code"
                  @click="setLocale(locale.code)"
                  :class="{ 'bg-accent': locale.code === currentLocale }"
                >
                  <Check v-if="locale.code === currentLocale" class="h-4 w-4" />
                  <span :class="{ 'ml-6': locale.code !== currentLocale }">{{ locale.name }}</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem @click="handleLogout" :disabled="isLoggingOut">
            <LogOut />
            {{ isLoggingOut ? $t('nav.loggingOut') : $t('nav.logout') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronsUpDown, LogOut, User, Settings, Moon, Sun, Languages, Check } from 'lucide-vue-next'

const { user, clear } = useUserSession()

const router = useRouter()
const { isMobile } = useSidebar()
const { locales, setLocale, locale } = useI18n()
const colorMode = useColorMode()
const isLoggingOut = ref(false)

const currentLocale = computed(() => locale.value)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function handleLogout() {
  if (isLoggingOut.value) return

  isLoggingOut.value = true

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    await clear()

    await navigateTo('/')
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>
