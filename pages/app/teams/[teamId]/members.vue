<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Team Members</h1>
        <p class="text-muted-foreground">Manage team members and their roles</p>
      </div>
      <Button v-if="canInvite" @click="showInviteDialog = true">
        <UserPlus class="mr-2 h-4 w-4" />
        Invite Member
      </Button>
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="divide-y">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between p-4"
          >
            <div class="flex items-center gap-4">
              <div v-if="member.user.image" class="h-10 w-10 rounded-full overflow-hidden">
                <img :src="member.user.image" :alt="member.user.name || ''" class="h-full w-full object-cover" />
              </div>
              <div v-else class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="font-medium">{{ member.user.name || 'Unknown' }}</p>
                <p class="text-sm text-muted-foreground">{{ member.user.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Badge :variant="getRoleBadgeVariant(member.role)">
                {{ member.role }}
              </Badge>
              <DropdownMenu v-if="canManageMember(member)">
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="member.role !== 'OWNER' && isOwner"
                    @click="changeRole(member, 'OWNER')"
                  >
                    <Crown class="mr-2 h-4 w-4" />
                    Transfer Ownership
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="member.role !== 'ADMIN' && member.role !== 'OWNER'"
                    @click="changeRole(member, 'ADMIN')"
                  >
                    <Shield class="mr-2 h-4 w-4" />
                    Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="member.role === 'ADMIN'"
                    @click="changeRole(member, 'MEMBER')"
                  >
                    <User class="mr-2 h-4 w-4" />
                    Make Member
                  </DropdownMenuItem>
                  <DropdownMenuSeparator v-if="member.role !== 'OWNER'" />
                  <DropdownMenuItem
                    v-if="member.role !== 'OWNER'"
                    class="text-destructive"
                    @click="removeMember(member)"
                  >
                    <UserMinus class="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Invite Dialog -->
    <Sheet v-model:open="showInviteDialog">
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite Team Member</SheetTitle>
          <SheetDescription>
            Send an invitation to join this team.
          </SheetDescription>
        </SheetHeader>
        <form @submit.prevent="sendInvite" class="space-y-4 mt-6">
          <Field label="Email" required>
            <Input
              v-model="inviteForm.email"
              type="email"
              placeholder="user@example.com"
              required
            />
          </Field>

          <Field label="Role" required>
            <select
              v-model="inviteForm.role"
              class="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>

          <div class="flex gap-2 pt-4">
            <Button type="submit" :disabled="sending">
              <span v-if="sending">Sending...</span>
              <span v-else>Send Invitation</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              @click="showInviteDialog = false"
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
import { UserPlus, User, MoreVertical, Crown, Shield, UserMinus } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

definePageMeta({
  breadcrumb: 'Members',
});

const route = useRoute();
const teamId = computed(() => parseInt(route.params.teamId as string));

const showInviteDialog = ref(false);
const sending = ref(false);

const inviteForm = ref({
  email: '',
  role: 'MEMBER',
});

// Fetch team details
const { data: teamData } = await useFetch(`/api/teams/${teamId.value}`);
const team = computed(() => teamData.value?.team);

// Fetch members
const { data: membersData, refresh: refreshMembers } = await useFetch(
  `/api/teams/${teamId.value}/members`
);
const members = computed(() => membersData.value?.members || []);

const isOwner = computed(() => team.value?.role === 'OWNER');
const canInvite = computed(() => ['OWNER', 'ADMIN'].includes(team.value?.role || ''));

function canManageMember(member: any) {
  const myRole = team.value?.role;
  if (myRole === 'OWNER') return true;
  if (myRole === 'ADMIN' && member.role === 'MEMBER') return true;
  return false;
}

async function changeRole(member: any, newRole: string) {
  if (newRole === 'OWNER') {
    if (!confirm(`Transfer ownership to ${member.user.name || member.user.email}?`)) return;

    try {
      await $fetch(`/api/teams/${teamId.value}/transfer-ownership`, {
        method: 'POST',
        body: { newOwnerId: member.user.id },
      });

      toast.success('Ownership transferred successfully');
      await refreshMembers();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to transfer ownership');
    }
  } else {
    try {
      await $fetch(`/api/teams/${teamId.value}/members/${member.user.id}`, {
        method: 'PUT',
        body: { role: newRole },
      });

      toast.success('Member role updated successfully');
      await refreshMembers();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to update member role');
    }
  }
}

async function removeMember(member: any) {
  if (!confirm(`Remove ${member.user.name || member.user.email} from the team?`)) return;

  try {
    await $fetch(`/api/teams/${teamId.value}/members/${member.user.id}`, {
      method: 'DELETE',
    });

    toast.success('Member removed successfully');
    await refreshMembers();
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to remove member');
  }
}

async function sendInvite() {
  sending.value = true;
  try {
    await $fetch(`/api/teams/${teamId.value}/invitations`, {
      method: 'POST',
      body: inviteForm.value,
    });

    toast.success('Invitation sent successfully');
    showInviteDialog.value = false;
    inviteForm.value = { email: '', role: 'MEMBER' };
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to send invitation');
  } finally {
    sending.value = false;
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
