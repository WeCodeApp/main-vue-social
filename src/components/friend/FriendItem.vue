<template>
  <Card class="friend-item" hover>
    <div class="friend-content">
      <div class="friend-avatar">
        <Avatar 
          :src="avatarSrc" 
          :name="displayName" 
          size="lg" 
          :status="status"
          clickable
          @click="navigateToProfile"
        />
      </div>
      <div class="friend-info">
        <h3 class="friend-name">{{ displayName }}</h3>
        <p v-if="mutualFriends" class="friend-mutual">
          <span class="mdi mdi-account-multiple"></span>
          {{ mutualFriends }} mutual friends
        </p>
        <p v-if="isRequest && request" class="friend-time">
          Request sent {{ formatTime(request.createdAt) }}
        </p>
      </div>
      <div class="friend-actions">
        <!-- Friend request actions -->
        <template v-if="isRequest && request">
          <div v-if="isIncoming" class="request-actions">
            <Button 
              variant="primary" 
              size="sm" 
              icon="check" 
              :loading="loading" 
              @click="acceptRequest"
            >
              Accept
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon="close" 
              :loading="loading" 
              @click="rejectRequest"
            >
              Decline
            </Button>
          </div>
          <div v-else class="request-pending">
            <Button 
              variant="outline" 
              size="sm" 
              icon="clock-outline" 
              disabled
            >
              Pending
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon="close" 
              :loading="loading" 
              @click="cancelRequest"
            >
              Cancel
            </Button>
          </div>
        </template>

        <!-- Friend actions -->
        <template v-else-if="isFriend">
          <div class="friend-menu">
            <Button 
              variant="outline" 
              size="sm" 
              icon="message-outline" 
              @click="$emit('message', userId)"
            >
              Message
            </Button>
            <button class="btn-icon" @click="toggleMenu">
              <span class="mdi mdi-dots-vertical"></span>
            </button>
            <div v-if="showMenu" class="dropdown-menu">
              <button class="dropdown-item" @click="unfriend">
                <span class="mdi mdi-account-remove"></span>
                Unfriend
              </button>
              <button class="dropdown-item text-danger" @click="block">
                <span class="mdi mdi-block-helper"></span>
                Block
              </button>
            </div>
          </div>
        </template>

        <!-- User actions (not friend) -->
        <template v-else>
          <Button 
            v-if="!isBlocked" 
            variant="primary" 
            size="sm" 
            icon="account-plus" 
            :loading="loading" 
            @click="addFriend"
          >
            Add Friend
          </Button>
          <div v-else class="blocked-label">
            <span class="mdi mdi-block-helper"></span>
            Blocked
            <Button 
              variant="outline" 
              size="sm" 
              @click="unblock"
            >
              Unblock
            </Button>
          </div>
        </template>
      </div>
    </div>
  </Card>

  <!-- Confirmation Modal -->
  <div v-if="showConfirm" class="modal-overlay" @click="showConfirm = false">
    <div class="modal-content" @click.stop>
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div class="modal-actions">
        <Button variant="outline" @click="showConfirm = false">Cancel</Button>
        <Button 
          :variant="confirmAction === 'block' ? 'danger' : 'primary'" 
          @click="confirmActionHandler"
        >
          {{ confirmButtonText }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import Card from '@/components/common/Card.vue'
import Avatar from '@/components/common/Avatar.vue'
import Button from '@/components/common/Button.vue'
import { useUserStore } from '@/stores/user'
import { useFriendsStore, type FriendRequest } from '@/stores/friends'

const props = defineProps({
  userId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  avatarSrc: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: ''
  },
  mutualFriends: {
    type: Number,
    default: 0
  },
  isRequest: {
    type: Boolean,
    default: false
  },
  request: {
    type: Object as () => FriendRequest | null,
    default: null
  },
  isFriend: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'message'])

const router = useRouter()
const userStore = useUserStore()
const friendsStore = useFriendsStore()

// State
const showMenu = ref(false)
const loading = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'unfriend' | 'block' | 'unblock'>('unfriend')
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')

// Computed
const isIncoming = computed(() => {
  if (!props.request || !userStore.user) return false
  return props.request.friend_id === userStore.user.uid
})

// Methods
function formatTime(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function navigateToProfile() {
  router.push(`/profile/${props.userId}`)
}

async function addFriend() {
  if (!userStore.user) return

  loading.value = true
  try {
    await friendsStore.sendFriendRequest(props.userId)
    emit('update')
  } catch (error) {
    console.error('Error sending friend request:', error)
  } finally {
    loading.value = false
  }
}

async function acceptRequest() {
  if (!props.request) return

  loading.value = true
  try {
    await friendsStore.respondToFriendRequest(props.request.id, 'accepted')
    emit('update')
  } catch (error) {
    console.error('Error accepting friend request:', error)
  } finally {
    loading.value = false
  }
}

async function rejectRequest() {
  if (!props.request) return

  loading.value = true
  try {
    await friendsStore.respondToFriendRequest(props.request.id, 'rejected')
    emit('update')
  } catch (error) {
    console.error('Error rejecting friend request:', error)
  } finally {
    loading.value = false
  }
}

async function cancelRequest() {
  // In a real app, you would have a dedicated method for this
  // For now, we'll reuse the reject method
  await rejectRequest()
}

function unfriend() {
  showMenu.value = false
  confirmAction.value = 'unfriend'
  confirmTitle.value = `Unfriend ${props.displayName}`
  confirmMessage.value = `Are you sure you want to remove ${props.displayName} from your friends? They won't be notified.`
  confirmButtonText.value = 'Unfriend'
  showConfirm.value = true
}

function block() {
  showMenu.value = false
  confirmAction.value = 'block'
  confirmTitle.value = `Block ${props.displayName}`
  confirmMessage.value = `Are you sure you want to block ${props.displayName}? They won't be able to see your posts or send you friend requests.`
  confirmButtonText.value = 'Block'
  showConfirm.value = true
}

function unblock() {
  confirmAction.value = 'unblock'
  confirmTitle.value = `Unblock ${props.displayName}`
  confirmMessage.value = `Are you sure you want to unblock ${props.displayName}? They will be able to see your public posts and send you friend requests.`
  confirmButtonText.value = 'Unblock'
  showConfirm.value = true
}

async function confirmActionHandler() {
  loading.value = true

  try {
    if (confirmAction.value === 'unfriend') {
      await friendsStore.unfriend(props.userId)
    } else if (confirmAction.value === 'block') {
      await friendsStore.blockUser(props.userId, props.displayName)
    } else if (confirmAction.value === 'unblock') {
      await friendsStore.unblockUser(props.userId)
    }

    showConfirm.value = false
    emit('update')
  } catch (error) {
    console.error(`Error performing ${confirmAction.value}:`, error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.friend-item {
  margin-bottom: 1rem;
}

.friend-content {
  display: flex;
  align-items: center;
}

.friend-avatar {
  margin-right: 1rem;
}

.friend-info {
  flex: 1;
}

.friend-name {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.friend-mutual, .friend-time {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-light);
  display: flex;
  align-items: center;

  .mdi {
    margin-right: 0.25rem;
  }
}

.friend-actions {
  display: flex;
  align-items: center;
}

.request-actions, .request-pending {
  display: flex;
  gap: 0.5rem;
}

.friend-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: var(--text-light);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .mdi {
    font-size: 1.25rem;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  min-width: 150px;
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .mdi {
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }

  &.text-danger {
    color: var(--danger-color);
  }
}

.blocked-label {
  display: flex;
  align-items: center;
  color: var(--text-light);
  font-size: 0.9rem;

  .mdi {
    margin-right: 0.5rem;
  }

  button {
    margin-left: 0.5rem;
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;

  h3 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1.5rem;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
