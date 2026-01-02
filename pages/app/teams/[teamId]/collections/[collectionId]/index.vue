<template>
  <div class="space-y-6">
    <!-- Collection Header -->
    <div v-if="collection" class="flex items-start justify-between">
      <div class="flex items-center space-x-4">
        <div
          class="h-16 w-16 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: collection.color + '20' }"
        >
          <Folder class="h-8 w-8" :style="{ color: collection.color }" />
        </div>
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ collection.name }}</h1>
          <p v-if="collection.description" class="text-muted-foreground">
            {{ collection.description }}
          </p>
        </div>
      </div>
      <Button @click="showCreateBookmark = true">
        <Plus class="mr-2 h-4 w-4" />
        Add Bookmark
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search bookmarks..."
        class="max-w-sm"
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <Filter class="mr-2 h-4 w-4" />
            Filter
            <span v-if="statusFilter !== 'all'" class="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="statusFilter = 'all'">
            All Bookmarks
          </DropdownMenuItem>
          <DropdownMenuItem @click="statusFilter = 'ACTIVE'">
            Active Only
          </DropdownMenuItem>
          <DropdownMenuItem @click="statusFilter = 'ARCHIVED'">
            Archived Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Bookmarks List -->
    <div v-if="pendingBookmarks" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <CardContent class="pt-6">
          <div class="space-y-3">
            <div class="h-4 w-3/4 rounded bg-muted" />
            <div class="h-3 w-1/2 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else-if="filteredBookmarks.length === 0" class="text-center py-12">
      <Empty>
        <template #icon>
          <Bookmark class="h-12 w-12" />
        </template>
        <template #title>
          {{ searchQuery ? 'No bookmarks found' : 'No bookmarks yet' }}
        </template>
        <template #description>
          {{
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Add your first bookmark to this collection'
          }}
        </template>
        <template #actions>
          <Button @click="showCreateBookmark = true">
            <Plus class="mr-2 h-4 w-4" />
            Add Bookmark
          </Button>
        </template>
      </Empty>
    </div>

    <div v-else class="space-y-2">
      <Card
        v-for="bookmark in filteredBookmarks"
        :key="bookmark.id"
        class="hover:border-primary transition-colors"
      >
        <CardContent class="pt-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <img
                  v-if="bookmark.favicon"
                  :src="bookmark.favicon"
                  class="h-4 w-4"
                  alt=""
                />
                <ExternalLink v-else class="h-4 w-4" />
                <a
                  :href="bookmark.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium hover:underline"
                  @click.stop
                >
                  {{ bookmark.title }}
                </a>
                <Badge v-if="bookmark.status === 'ARCHIVED'" variant="outline">
                  Archived
                </Badge>
              </div>
              <p v-if="bookmark.description" class="text-sm text-muted-foreground mb-2">
                {{ bookmark.description }}
              </p>
              <div class="flex items-center gap-2">
                <Badge
                  v-for="tag in bookmark.tags"
                  :key="tag.tag.id"
                  variant="secondary"
                  class="text-xs"
                >
                  <Tag class="h-3 w-3 mr-1" />
                  {{ tag.tag.name }}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon">
                  <MoreVertical class="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="editBookmark(bookmark)">
                  <Edit class="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem @click="toggleArchive(bookmark)">
                  <Archive class="mr-2 h-4 w-4" />
                  {{ bookmark.status === 'ARCHIVED' ? 'Unarchive' : 'Archive' }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  class="text-destructive"
                  @click="deleteBookmark(bookmark)"
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

    <!-- Create/Edit Bookmark Dialog -->
    <Sheet v-model:open="showBookmarkDialog">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{{ editingBookmark ? 'Edit' : 'Add' }} Bookmark</SheetTitle>
          <SheetDescription>
            {{ editingBookmark ? 'Update' : 'Add a new' }} bookmark to this collection.
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="saveBookmark" class="space-y-4 mt-6">
          <Field label="Title" required>
            <Input
              v-model="bookmarkForm.title"
              placeholder="Enter bookmark title"
              required
            />
          </Field>

          <Field label="URL" required>
            <Input
              v-model="bookmarkForm.url"
              type="url"
              placeholder="https://example.com"
              required
            />
          </Field>

          <Field label="Description">
            <Textarea
              v-model="bookmarkForm.description"
              placeholder="Add a description..."
              rows="3"
            />
          </Field>

          <Field label="Tags">
            <p class="text-xs text-muted-foreground mb-2">
              Select tags for this bookmark
            </p>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="tag in availableTags"
                :key="tag.id"
                :variant="bookmarkForm.tagIds.includes(tag.id) ? 'default' : 'outline'"
                class="cursor-pointer"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </Badge>
            </div>
          </Field>

          <div class="flex gap-2 pt-4">
            <Button type="submit" :disabled="savingBookmark">
              <span v-if="savingBookmark">Saving...</span>
              <span v-else>{{ editingBookmark ? 'Update' : 'Add' }} Bookmark</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="closeBookmarkDialog"
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
import {
  Plus,
  Folder,
  Bookmark,
  Tag,
  Filter,
  ExternalLink,
  MoreVertical,
  Edit,
  Archive,
  Trash,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Collection',
});

const route = useRoute();
const teamId = computed(() => parseInt(route.params.teamId as string));
const collectionId = computed(() => parseInt(route.params.collectionId as string));

const showBookmarkDialog = ref(false);
const showCreateBookmark = computed({
  get: () => showBookmarkDialog.value && !editingBookmark.value,
  set: (val) => {
    showBookmarkDialog.value = val;
    if (!val) editingBookmark.value = null;
  },
});

const savingBookmark = ref(false);
const editingBookmark = ref<any>(null);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'ACTIVE' | 'ARCHIVED'>('all');

const bookmarkForm = ref({
  title: '',
  url: '',
  description: '',
  tagIds: [] as number[],
});

// Fetch collection
const { data: collectionData } = await useFetch(
  `/api/teams/${teamId.value}/collections/${collectionId.value}`
);
const collection = computed(() => collectionData.value?.collection);

// Fetch bookmarks
const { data: bookmarksData, pending: pendingBookmarks, refresh: refreshBookmarks } = await useFetch(
  `/api/teams/${teamId.value}/collections/${collectionId.value}/bookmarks`
);
const bookmarks = computed(() => bookmarksData.value?.bookmarks || []);

// Fetch tags
const { data: tagsData } = await useFetch(`/api/teams/${teamId.value}/tags`);
const availableTags = computed(() => tagsData.value?.tags || []);

const filteredBookmarks = computed(() => {
  let filtered = bookmarks.value;

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((b: any) => b.status === statusFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (b: any) =>
        b.title.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query) ||
        b.url.toLowerCase().includes(query)
    );
  }

  return filtered;
});

function toggleTag(tagId: number) {
  const index = bookmarkForm.value.tagIds.indexOf(tagId);
  if (index === -1) {
    bookmarkForm.value.tagIds.push(tagId);
  } else {
    bookmarkForm.value.tagIds.splice(index, 1);
  }
}

function editBookmark(bookmark: any) {
  editingBookmark.value = bookmark;
  bookmarkForm.value = {
    title: bookmark.title,
    url: bookmark.url,
    description: bookmark.description || '',
    tagIds: bookmark.tags.map((t: any) => t.tag.id),
  };
  showBookmarkDialog.value = true;
}

function closeBookmarkDialog() {
  showBookmarkDialog.value = false;
  editingBookmark.value = null;
  bookmarkForm.value = { title: '', url: '', description: '', tagIds: [] };
}

async function saveBookmark() {
  savingBookmark.value = true;
  try {
    const url = editingBookmark.value
      ? `/api/teams/${teamId.value}/collections/${collectionId.value}/bookmarks/${editingBookmark.value.id}`
      : `/api/teams/${teamId.value}/collections/${collectionId.value}/bookmarks`;

    const method = editingBookmark.value ? 'PUT' : 'POST';

    await $fetch(url, {
      method,
      body: {
        ...bookmarkForm.value,
        description: bookmarkForm.value.description || undefined,
      },
    });

    toast.success(`Bookmark ${editingBookmark.value ? 'updated' : 'added'} successfully`);
    closeBookmarkDialog();
    await refreshBookmarks();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to save bookmark');
  } finally {
    savingBookmark.value = false;
  }
}

async function toggleArchive(bookmark: any) {
  try {
    await $fetch(
      `/api/teams/${teamId.value}/collections/${collectionId.value}/bookmarks/${bookmark.id}`,
      {
        method: 'PUT',
        body: {
          status: bookmark.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED',
        },
      }
    );

    toast.success(
      `Bookmark ${bookmark.status === 'ARCHIVED' ? 'unarchived' : 'archived'} successfully`
    );
    await refreshBookmarks();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to update bookmark');
  }
}

async function deleteBookmark(bookmark: any) {
  if (!confirm('Are you sure you want to delete this bookmark?')) return;

  try {
    await $fetch(
      `/api/teams/${teamId.value}/collections/${collectionId.value}/bookmarks/${bookmark.id}`,
      {
        method: 'DELETE',
      }
    );

    toast.success('Bookmark deleted successfully');
    await refreshBookmarks();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to delete bookmark');
  }
}
</script>
