<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Teams</h1>
        <p class="text-muted-foreground">
          Manage your teams and workspaces
        </p>
      </div>
      <Button @click="showCreateDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        Create Team
      </Button>
    </div>

    <!-- Teams Grid -->
    <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <CardContent class="pt-6">
          <div class="space-y-3">
            <div class="h-12 w-12 rounded-lg bg-muted" />
            <div class="h-4 w-3/4 rounded bg-muted" />
            <div class="h-3 w-1/2 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else-if="teams?.length === 0" class="text-center py-12">
      <Empty>
        <template #icon>
          <Users class="h-12 w-12" />
        </template>
        <template #title>No teams yet</template>
        <template #description>
          Create your first team to start collaborating and managing bookmarks.
        </template>
        <template #actions>
          <Button @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </template>
      </Empty>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="team in teams"
        :key="team.id"
        class="hover:border-primary cursor-pointer transition-colors"
        @click="navigateTo(`/app/teams/${team.id}`)"
      >
        <CardHeader>
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div
                v-if="team.avatar"
                class="h-12 w-12 rounded-lg overflow-hidden"
              >
                <img :src="team.avatar" :alt="team.name" class="h-full w-full object-cover" />
              </div>
              <div
                v-else
                class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <Users class="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>{{ team.name }}</CardTitle>
                <Badge :variant="getRoleBadgeVariant(team.role)">
                  {{ team.role }}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="team.description" class="text-sm text-muted-foreground mb-4">
            {{ team.description }}
          </p>
          <div class="flex items-center gap-4 text-sm text-muted-foreground">
            <div class="flex items-center gap-1">
              <Users class="h-4 w-4" />
              <span>{{ team.memberCount }} members</span>
            </div>
            <div class="flex items-center gap-1">
              <Folder class="h-4 w-4" />
              <span>{{ team.collectionCount }} collections</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create Team Dialog -->
    <Sheet v-model:open="showCreateDialog">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Team</SheetTitle>
          <SheetDescription>
            Create a new team to collaborate with others and manage bookmarks.
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="createTeam" class="space-y-4 mt-6">
          <Field label="Team Name" required>
            <Input
              v-model="newTeam.name"
              placeholder="Enter team name"
              required
            />
          </Field>

          <Field label="Slug" required>
            <Input
              v-model="newTeam.slug"
              placeholder="team-slug"
              pattern="[a-z0-9-]+"
              required
            />
            <p class="text-xs text-muted-foreground mt-1">
              URL-friendly identifier (lowercase, numbers, hyphens only)
            </p>
          </Field>

          <Field label="Description">
            <Textarea
              v-model="newTeam.description"
              placeholder="What's this team about?"
              rows="3"
            />
          </Field>

          <Field label="Avatar URL">
            <Input
              v-model="newTeam.avatar"
              type="url"
              placeholder="https://example.com/avatar.png"
            />
          </Field>

          <div class="flex gap-2 pt-4">
            <Button type="submit" :disabled="creating">
              <span v-if="creating">Creating...</span>
              <span v-else>Create Team</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="showCreateDialog = false"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { Plus, Users, Folder } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Teams',
});

const showCreateDialog = ref(false);
const creating = ref(false);

const newTeam = ref({
  name: '',
  slug: '',
  description: '',
  avatar: '',
});

// Auto-generate slug from name
watch(
  () => newTeam.value.name,
  (name) => {
    if (!newTeam.value.slug || newTeam.value.slug === '') {
      newTeam.value.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }
);

// Fetch teams
const { data: teamsData, pending, refresh } = await useFetch('/api/teams');
const teams = computed(() => teamsData.value?.teams || []);

// Create team
async function createTeam() {
  creating.value = true;
  try {
    const response = await $fetch('/api/teams', {
      method: 'POST',
      body: {
        name: newTeam.value.name,
        slug: newTeam.value.slug,
        description: newTeam.value.description || undefined,
        avatar: newTeam.value.avatar || undefined,
      },
    });

    toast.success('Team created successfully');
    showCreateDialog.value = false;
    newTeam.value = { name: '', slug: '', description: '', avatar: '' };
    await refresh();

    // Navigate to new team
    if (response.team) {
      navigateTo(`/app/teams/${response.team.id}`);
    }
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to create team');
  } finally {
    creating.value = false;
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'OWNER':
      return 'default';
    case 'ADMIN':
      return 'secondary';
    default:
      return 'outline';
  }
}
</script>
