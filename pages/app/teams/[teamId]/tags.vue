<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tags</h1>
        <p class="text-muted-foreground">Organize bookmarks with tags</p>
      </div>
      <Button v-if="canCreateTag" @click="showCreateDialog = true">
        <Plus class="mr-2 h-4 w-4" />
        Create Tag
      </Button>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 6" :key="i" class="animate-pulse">
        <CardContent class="pt-6">
          <div class="h-4 w-3/4 rounded bg-muted" />
        </CardContent>
      </Card>
    </div>

    <div v-else-if="tags?.length === 0" class="text-center py-12">
      <Empty>
        <template #icon>
          <Tag class="h-12 w-12" />
        </template>
        <template #title>No tags yet</template>
        <template #description>
          Create tags to organize and categorize your bookmarks.
        </template>
        <template #actions>
          <Button v-if="canCreateTag" @click="showCreateDialog = true">
            <Plus class="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </template>
      </Empty>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="tag in tags" :key="tag.id">
        <CardContent class="pt-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="h-4 w-4 rounded-full"
                :style="{ backgroundColor: tag.color }"
              />
              <span class="font-medium">{{ tag.name }}</span>
              <Badge variant="secondary" class="text-xs">
                {{ tag._count?.bookmarks || 0 }}
              </Badge>
            </div>
            <DropdownMenu v-if="canManageTag">
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="editTag(tag)">
                  <Edit class="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive"
                  @click="deleteTag(tag)"
                >
                  <Trash class="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Create/Edit Tag Dialog -->
    <Sheet v-model:open="showTagDialog">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{ editingTag ? 'Edit' : 'Create' }} Tag</SheetTitle>
          <SheetDescription>
            {{ editingTag ? 'Update' : 'Create a new' }} tag to organize bookmarks.
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="saveTag" class="space-y-4 mt-6">
          <Field label="Name" required>
            <Input
              v-model="tagForm.name"
              placeholder="Enter tag name"
              required
            />
          </Field>

          <Field label="Color" required>
            <div class="flex items-center gap-2">
              <Input
                v-model="tagForm.color"
                type="color"
                class="w-20"
              />
              <Input
                v-model="tagForm.color"
                placeholder="#6366f1"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </Field>

          <div class="flex gap-2 pt-4">
            <Button type="submit" :disabled="saving">
              <span v-if="saving">Saving...</span>
              <span v-else>{{ editingTag ? 'Update' : 'Create' }} Tag</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="closeTagDialog"
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
import { Plus, Tag, MoreVertical, Edit, Trash } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Tags',
});

const route = useRoute();
const teamId = computed(() => parseInt(route.params.teamId as string));

const showTagDialog = ref(false);
const showCreateDialog = computed({
  get: () => showTagDialog.value && !editingTag.value,
  set: (val) => {
    showTagDialog.value = val;
    if (!val) editingTag.value = null;
  },
});

const saving = ref(false);
const editingTag = ref<any>(null);

const tagForm = ref({
  name: '',
  color: '#6366f1',
});

// Fetch team details
const { data: teamData } = await useFetch(`/api/teams/${teamId.value}`);
const team = computed(() => teamData.value?.team);

// Fetch tags
const { data: tagsData, pending, refresh: refreshTags } = await useFetch(
  `/api/teams/${teamId.value}/tags`
);
const tags = computed(() => tagsData.value?.tags || []);

const canManageTag = computed(() => ['OWNER', 'ADMIN'].includes(team.value?.role || ''));
const canCreateTag = computed(() => {
  // Check team settings for member permissions
  return ['OWNER', 'ADMIN'].includes(team.value?.role || '') || team.value?.role === 'MEMBER';
});

function editTag(tag: any) {
  editingTag.value = tag;
  tagForm.value = {
    name: tag.name,
    color: tag.color,
  };
  showTagDialog.value = true;
}

function closeTagDialog() {
  showTagDialog.value = false;
  editingTag.value = null;
  tagForm.value = { name: '', color: '#6366f1' };
}

async function saveTag() {
  saving.value = true;
  try {
    const url = editingTag.value
      ? `/api/teams/${teamId.value}/tags/${editingTag.value.id}`
      : `/api/teams/${teamId.value}/tags`;

    const method = editingTag.value ? 'PUT' : 'POST';

    await $fetch(url, {
      method,
      body: tagForm.value,
    });

    toast.success(`Tag ${editingTag.value ? 'updated' : 'created'} successfully`);
    closeTagDialog();
    await refreshTags();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to save tag');
  } finally {
    saving.value = false;
  }
}

async function deleteTag(tag: any) {
  const hasBookmarks = tag._count?.bookmarks > 0;
  const message = hasBookmarks
    ? `Delete tag "${tag.name}"? This will remove it from ${tag._count.bookmarks} bookmark(s).`
    : `Delete tag "${tag.name}"?`;

  if (!confirm(message)) return;

  try {
    await $fetch(`/api/teams/${teamId.value}/tags/${tag.id}`, {
      method: 'DELETE',
      query: hasBookmarks ? { force: 'true' } : {},
    });

    toast.success('Tag deleted successfully');
    await refreshTags();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to delete tag');
  }
}
</script>
