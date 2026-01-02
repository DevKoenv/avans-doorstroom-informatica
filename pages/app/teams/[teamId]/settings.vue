<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Team Settings</h1>
      <p class="text-muted-foreground">Manage team information and preferences</p>
    </div>

    <!-- Team Information -->
    <Card>
      <CardHeader>
        <CardTitle>Team Information</CardTitle>
        <CardDescription>
          Update your team's basic information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="updateTeamInfo" class="space-y-4">
          <Field label="Team Name" required>
            <Input
              v-model="teamForm.name"
              placeholder="Enter team name"
              required
            />
          </Field>

          <Field label="Slug" required>
            <Input
              v-model="teamForm.slug"
              placeholder="team-slug"
              pattern="[a-z0-9-]+"
              required
            />
            <p class="text-xs text-muted-foreground mt-1">
              URL-friendly identifier
            </p>
          </Field>

          <Field label="Description">
            <Textarea
              v-model="teamForm.description"
              placeholder="What's this team about?"
              rows="3"
            />
          </Field>

          <Field label="Avatar URL">
            <Input
              v-model="teamForm.avatar"
              type="url"
              placeholder="https://example.com/avatar.png"
            />
          </Field>

          <Button type="submit" :disabled="savingInfo">
            <span v-if="savingInfo">Saving...</span>
            <span v-else>Save Changes</span>
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Team Preferences -->
    <Card v-if="team?.role === 'OWNER' || team?.role === 'ADMIN'">
      <CardHeader>
        <CardTitle>Team Preferences</CardTitle>
        <CardDescription>
          Configure team-wide settings and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="updateSettings" class="space-y-4">
          <Field label="Default Member Role">
            <select
              v-model="settingsForm.defaultMemberRole"
              class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p class="text-xs text-muted-foreground mt-1">
              Role assigned to new members by default
            </p>
          </Field>

          <div class="space-y-3">
            <label class="flex items-center justify-between">
              <div>
                <p class="font-medium">Allow members to create bookmarks</p>
                <p class="text-sm text-muted-foreground">
                  Members can add new bookmarks to collections
                </p>
              </div>
              <input
                type="checkbox"
                v-model="settingsForm.allowMemberBookmarkCreate"
                class="h-4 w-4"
              />
            </label>

            <label class="flex items-center justify-between">
              <div>
                <p class="font-medium">Allow members to create tags</p>
                <p class="text-sm text-muted-foreground">
                  Members can create new tags for organizing bookmarks
                </p>
              </div>
              <input
                type="checkbox"
                v-model="settingsForm.allowMemberTagCreate"
                class="h-4 w-4"
              />
            </label>
          </div>

          <Button type="submit" :disabled="savingSettings">
            <span v-if="savingSettings">Saving...</span>
            <span v-else>Save Preferences</span>
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Danger Zone -->
    <Card v-if="team?.role === 'OWNER'" class="border-destructive">
      <CardHeader>
        <CardTitle class="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions that affect your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" class="mb-4">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Deleting a team will permanently remove all collections, bookmarks, tags, and member associations. This action cannot be undone.
          </AlertDescription>
        </Alert>
        <Button variant="destructive" @click="deleteTeam">
          Delete Team
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Settings',
});

const route = useRoute();
const teamId = computed(() => parseInt(route.params.teamId as string));

const savingInfo = ref(false);
const savingSettings = ref(false);

const teamForm = ref({
  name: '',
  slug: '',
  description: '',
  avatar: '',
});

const settingsForm = ref({
  defaultMemberRole: 'MEMBER',
  allowMemberBookmarkCreate: true,
  allowMemberTagCreate: true,
});

// Fetch team details
const { data: teamData } = await useFetch(`/api/teams/${teamId.value}`);
const team = computed(() => teamData.value?.team);

// Fetch team settings
const { data: settingsData } = await useFetch(
  `/api/teams/${teamId.value}/settings`
);

// Initialize forms
watchEffect(() => {
  if (team.value) {
    teamForm.value = {
      name: team.value.name,
      slug: team.value.slug,
      description: team.value.description || '',
      avatar: team.value.avatar || '',
    };
  }

  if (settingsData.value?.settings) {
    const settings = settingsData.value.settings;
    settingsForm.value = {
      defaultMemberRole: settings.defaultMemberRole,
      allowMemberBookmarkCreate: settings.allowMemberBookmarkCreate,
      allowMemberTagCreate: settings.allowMemberTagCreate,
    };
  }
});

async function updateTeamInfo() {
  savingInfo.value = true;
  try {
    await $fetch(`/api/teams/${teamId.value}`, {
      method: 'PUT',
      body: {
        name: teamForm.value.name,
        slug: teamForm.value.slug,
        description: teamForm.value.description || undefined,
        avatar: teamForm.value.avatar || undefined,
      },
    });

    toast.success('Team information updated successfully');
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to update team information');
  } finally {
    savingInfo.value = false;
  }
}

async function updateSettings() {
  savingSettings.value = true;
  try {
    await $fetch(`/api/teams/${teamId.value}/settings`, {
      method: 'PUT',
      body: settingsForm.value,
    });

    toast.success('Team preferences updated successfully');
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to update team preferences');
  } finally {
    savingSettings.value = false;
  }
}

async function deleteTeam() {
  const confirmation = prompt(
    'This action cannot be undone. Type the team name to confirm deletion:'
  );

  if (confirmation !== team.value?.name) {
    toast.error('Team name does not match');
    return;
  }

  try {
    await $fetch(`/api/teams/${teamId.value}`, {
      method: 'DELETE',
    });

    toast.success('Team deleted successfully');
    navigateTo('/app/teams');
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to delete team');
  }
}
</script>
