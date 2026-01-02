<template>
  <div class="space-y-6">
    <!-- Team Header -->
    <div v-if="team" class="flex items-start justify-between">
      <div class="flex items-center space-x-4">
        <div
          v-if="team.avatar"
          class="h-16 w-16 rounded-lg overflow-hidden"
        >
          <img :src="team.avatar" :alt="team.name" class="h-full w-full object-cover" />
        </div>
        <div
          v-else
          class="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center"
        >
          <Users class="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ team.name }}</h1>
          <p v-if="team.description" class="text-muted-foreground">
            {{ team.description }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <Badge :variant="getRoleBadgeVariant(team.role)">
              {{ team.role }}
            </Badge>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="icon">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="canManageTeam" @click="navigateTo(`/app/teams/${teamId}/settings`)">
            <Settings class="mr-2 h-4 w-4" />
            Team Settings
          </DropdownMenuItem>
          <DropdownMenuItem @click="navigateTo(`/app/teams/${teamId}/members`)">
            <Users class="mr-2 h-4 w-4" />
            Members
          </DropdownMenuItem>
          <DropdownMenuItem @click="navigateTo(`/app/teams/${teamId}/tags`)">
            <Tag class="mr-2 h-4 w-4" />
            Tags
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="team.role !== 'OWNER'" />
          <DropdownMenuItem
            v-if="team.role !== 'OWNER'"
            class="text-destructive"
            @click="leaveTeam"
          >
            <LogOut class="mr-2 h-4 w-4" />
            Leave Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Collections -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Collections</h2>
        <Button v-if="canManageCollections" @click="showCreateCollection = true">
          <Plus class="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      <div v-if="pendingCollections" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="i in 3" :key="i" class="animate-pulse">
          <CardContent class="pt-6">
            <div class="space-y-3">
              <div class="h-10 w-10 rounded bg-muted" />
              <div class="h-4 w-3/4 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="collections?.length === 0" class="text-center py-12">
        <Empty>
          <template #icon>
            <Folder class="h-12 w-12" />
          </template>
          <template #title>No collections yet</template>
          <template #description>
            Create your first collection to organize bookmarks.
          </template>
          <template #actions>
            <Button v-if="canManageCollections" @click="showCreateCollection = true">
              <Plus class="mr-2 h-4 w-4" />
              Create Collection
            </Button>
          </template>
        </Empty>
      </div>

      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="collection in collections"
          :key="collection.id"
          class="hover:border-primary cursor-pointer transition-colors"
          @click="navigateTo(`/app/teams/${teamId}/collections/${collection.id}`)"
        >
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="h-10 w-10 rounded flex items-center justify-center"
                  :style="{ backgroundColor: collection.color + '20' }"
                >
                  <component :is="getIconComponent(collection.icon)" class="h-5 w-5" :style="{ color: collection.color }" />
                </div>
                <div>
                  <CardTitle>{{ collection.name }}</CardTitle>
                  <p v-if="collection.description" class="text-sm text-muted-foreground">
                    {{ collection.description }}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-1 text-sm text-muted-foreground">
              <Bookmark class="h-4 w-4" />
              <span>{{ collection._count?.bookmarks || 0 }} bookmarks</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Create Collection Dialog -->
    <Sheet v-model:open="showCreateCollection">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create New Collection</SheetTitle>
          <SheetDescription>
            Organize your bookmarks into collections.
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="createCollection" class="space-y-4 mt-6">
          <Field label="Name" required>
            <Input
              v-model="newCollection.name"
              placeholder="Enter collection name"
              required
            />
          </Field>

          <Field label="Description">
            <Textarea
              v-model="newCollection.description"
              placeholder="What's this collection for?"
              rows="3"
            />
          </Field>

          <Field label="Icon">
            <Input
              v-model="newCollection.icon"
              placeholder="folder"
            />
          </Field>

          <Field label="Color">
            <Input
              v-model="newCollection.color"
              type="color"
            />
          </Field>

          <div class="flex gap-2 pt-4">
            <Button type="submit" :disabled="creatingCollection">
              <span v-if="creatingCollection">Creating...</span>
              <span v-else>Create Collection</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="showCreateCollection = false"
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
import { Plus, Users, Folder, Bookmark, Settings, Tag, LogOut, MoreVertical } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Team',
});

const route = useRoute();
const teamId = computed(() => parseInt(route.params.teamId as string));

const showCreateCollection = ref(false);
const creatingCollection = ref(false);

const newCollection = ref({
  name: '',
  description: '',
  icon: 'folder',
  color: '#6366f1',
});

// Fetch team details
const { data: teamData } = await useFetch(`/api/teams/${teamId.value}`);
const team = computed(() => teamData.value?.team);

// Fetch collections
const { data: collectionsData, pending: pendingCollections, refresh: refreshCollections } = await useFetch(
  `/api/teams/${teamId.value}/collections`
);
const collections = computed(() => collectionsData.value?.collections || []);

const canManageTeam = computed(() => {
  return team.value && ['OWNER', 'ADMIN'].includes(team.value.role);
});

const canManageCollections = computed(() => {
  return team.value && ['OWNER', 'ADMIN'].includes(team.value.role);
});

async function createCollection() {
  creatingCollection.value = true;
  try {
    await $fetch(`/api/teams/${teamId.value}/collections`, {
      method: 'POST',
      body: {
        name: newCollection.value.name,
        description: newCollection.value.description || undefined,
        icon: newCollection.value.icon || 'folder',
        color: newCollection.value.color,
      },
    });

    toast.success('Collection created successfully');
    showCreateCollection.value = false;
    newCollection.value = { name: '', description: '', icon: 'folder', color: '#6366f1' };
    await refreshCollections();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to create collection');
  } finally {
    creatingCollection.value = false;
  }
}

async function leaveTeam() {
  if (!confirm('Are you sure you want to leave this team?')) return;

  try {
    await $fetch(`/api/teams/${teamId.value}/leave`, {
      method: 'POST',
    });

    toast.success('Left team successfully');
    navigateTo('/app/teams');
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to leave team');
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

function getIconComponent(iconName: string) {
  // Default to Folder if icon not found
  return Folder;
}
</script>
