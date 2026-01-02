<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Team Invitation</CardTitle>
        <CardDescription>
          You've been invited to join a team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p class="mt-4 text-muted-foreground">Processing invitation...</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <AlertCircle class="h-12 w-12 text-destructive mx-auto" />
          <h3 class="mt-4 text-lg font-semibold">Invalid or Expired Invitation</h3>
          <p class="mt-2 text-sm text-muted-foreground">{{ error }}</p>
          <Button class="mt-6" @click="navigateTo('/app/teams')">
            Go to Teams
          </Button>
        </div>

        <div v-else-if="success" class="text-center py-8">
          <CheckCircle class="h-12 w-12 text-green-500 mx-auto" />
          <h3 class="mt-4 text-lg font-semibold">Invitation Accepted!</h3>
          <p class="mt-2 text-sm text-muted-foreground">
            You've successfully joined the team.
          </p>
          <Button class="mt-6" @click="navigateTo(`/app/teams/${teamId}`)">
            Go to Team
          </Button>
        </div>

        <div v-else-if="invitation" class="space-y-4">
          <div class="bg-muted p-4 rounded-lg">
            <div class="flex items-center gap-3 mb-3">
              <Users class="h-8 w-8 text-primary" />
              <div>
                <h3 class="font-semibold">{{ invitation.team.name }}</h3>
                <p class="text-sm text-muted-foreground">
                  Role: <Badge>{{ invitation.role }}</Badge>
                </p>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              You've been invited to join this team as a {{ invitation.role.toLowerCase() }}.
            </p>
          </div>

          <Alert>
            <Info class="h-4 w-4" />
            <AlertDescription>
              By accepting, you'll be able to access and collaborate with this team.
            </AlertDescription>
          </Alert>

          <div class="flex gap-2">
            <Button class="flex-1" @click="acceptInvitation" :disabled="accepting">
              <span v-if="accepting">Accepting...</span>
              <span v-else>Accept Invitation</span>
            </Button>
            <Button
              variant="outline"
              class="flex-1"
              @click="navigateTo('/app/teams')"
            >
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Users, CheckCircle, AlertCircle, Info } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  layout: 'blank',
});

const route = useRoute();
const token = computed(() => route.params.token as string);

const loading = ref(true);
const accepting = ref(false);
const success = ref(false);
const error = ref('');
const invitation = ref<any>(null);
const teamId = ref<number | null>(null);

// Fetch invitation details
onMounted(async () => {
  try {
    const response = await $fetch(`/api/invitations/${token.value}`);
    invitation.value = response.invitation;
    loading.value = false;
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load invitation';
    loading.value = false;
  }
});

async function acceptInvitation() {
  accepting.value = true;
  try {
    const response = await $fetch(`/api/invitations/${token.value}/accept`, {
      method: 'POST',
    });

    success.value = true;
    teamId.value = response.team?.id;
    toast.success('Invitation accepted successfully!');
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to accept invitation';
    toast.error(error.value);
  } finally {
    accepting.value = false;
  }
}
</script>
