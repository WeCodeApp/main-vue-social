<template>
  <div class="friends-view">
    <div class="container">
      <h1 class="page-title">Friends</h1>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          <span class="mdi mdi-account-multiple"></span>
          <span>All Friends</span>
          <span class="count">{{ friends.length }}</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'requests' }"
          @click="activeTab = 'requests'"
        >
          <span class="mdi mdi-account-clock"></span>
          <span>Friend Requests</span>
          <span class="count">{{ incomingRequests.length }}</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'sent' }"
          @click="activeTab = 'sent'"
        >
          <span class="mdi mdi-account-arrow-right"></span>
          <span>Sent Requests</span>
          <span class="count">{{ outgoingRequests.length }}</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'blocked' }"
          @click="activeTab = 'blocked'"
        >
          <span class="mdi mdi-account-cancel"></span>
          <span>Blocked Users</span>
          <span class="count">{{ blockedUsers.length }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span>
        </div>
        <p>Loading...</p>
      </div>

      <!-- Error State -->
      <Alert
        v-if="error"
        type="error"
        :message="error"
        dismissible
        @close="error = ''"
        class="mb-4"
      />

      <!-- All Friends Tab -->
      <div v-if="activeTab === 'all' && !loading">
        <!-- Search -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="mdi mdi-magnify search-icon"></span>
            <input
              type="text"
              v-model="searchQuery"
              class="search-input"
              placeholder="Search friends..."
            />
            <button
              v-if="searchQuery"
              class="clear-search"
              @click="searchQuery = ''"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>
          <Button
            variant="outline"
            icon="account-search"
            @click="showFindFriends = true"
          >
            Find Friends
          </Button>
        </div>

        <!-- Empty State -->
        <Card v-if="filteredFriends.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-account-multiple empty-icon"></span>
            <h3>No friends found</h3>
            <p v-if="searchQuery">
              No friends match your search query. Try a different search.
            </p>
            <p v-else>
              You don't have any friends yet. Start by adding some friends!
            </p>
            <div class="mt-3">
              <Button @click="showFindFriends = true">Find Friends</Button>
            </div>
          </div>
        </Card>

        <!-- Friends List -->
        <div v-else class="friends-list">
          <FriendItem
            v-for="friend in filteredFriends"
            :key="friend.userId"
            :userId="friend.userId"
            :displayName="friend.displayName"
            :avatarSrc="friend.photoURL"
            :isFriend="true"
            @update="fetchFriends"
            @message="sendMessage"
          />
        </div>
      </div>

      <!-- Friend Requests Tab -->
      <div v-if="activeTab === 'requests' && !loading">
        <!-- Empty State -->
        <Card v-if="incomingRequests.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-account-clock empty-icon"></span>
            <h3>No friend requests</h3>
            <p>You don't have any pending friend requests.</p>
          </div>
        </Card>

        <!-- Requests List -->
        <div v-else class="friends-list">
          <FriendItem
            v-for="request in incomingRequests"
            :key="request.id"
            :userId="request.senderId"
            :displayName="request.senderName"
            :avatarSrc="request.senderPhotoURL"
            :isRequest="true"
            :request="request"
            @update="fetchFriends"
          />
        </div>
      </div>

      <!-- Sent Requests Tab -->
      <div v-if="activeTab === 'sent' && !loading">
        <!-- Empty State -->
        <Card v-if="outgoingRequests.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-account-arrow-right empty-icon"></span>
            <h3>No sent requests</h3>
            <p>You haven't sent any friend requests that are pending.</p>
            <div class="mt-3">
              <Button @click="showFindFriends = true">Find Friends</Button>
            </div>
          </div>
        </Card>

        <!-- Sent Requests List -->
        <div v-else class="friends-list">
          <FriendItem
            v-for="request in outgoingRequests"
            :key="request.id"
            :userId="request.friend_id"
            :displayName="request.receiverName"
            :avatarSrc="request.receiverPhotoURL"
            :isRequest="true"
            :request="request"
            @update="fetchFriends"
          />
        </div>
      </div>

      <!-- Blocked Users Tab -->
      <div v-if="activeTab === 'blocked' && !loading">
        <!-- Empty State -->
        <Card v-if="blockedUsers.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-account-cancel empty-icon"></span>
            <h3>No blocked users</h3>
            <p>You haven't blocked any users.</p>
          </div>
        </Card>

        <!-- Blocked Users List -->
        <div v-else class="friends-list">
          <FriendItem
            v-for="user in blockedUsers"
            :key="user.userId"
            :userId="user.userId"
            :displayName="user.displayName"
            :avatarSrc="user.photoURL"
            :isBlocked="true"
            @update="fetchFriends"
          />
        </div>
      </div>
    </div>

    <!-- Find Friends Modal -->
    <div v-if="showFindFriends" class="modal-overlay" @click="showFindFriends = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Find Friends</h3>
          <button class="modal-close" @click="showFindFriends = false">
            <span class="mdi mdi-close"></span>
          </button>
        </div>

        <div class="modal-body">
          <p class="text-center mb-4">
            This is a demo application. In a real app, you would be able to search for users and send friend requests.
          </p>

          <div class="search-input-wrapper mb-4">
            <span class="mdi mdi-magnify search-icon"></span>
            <input
              type="text"
              v-model="findFriendsQuery"
              class="search-input"
              placeholder="Search for people..."
            />
          </div>

          <!-- Mock search results -->
          <div class="search-results">
            <div
              v-for="user in mockUsers"
              :key="user.id"
              class="search-result-item"
            >
              <Avatar
                :name="user.name"
                size="md"
              />
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-meta">{{ user.mutualFriends }} mutual friends</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="account-plus"
                @click="addMockFriend(user)"
              >
                Add Friend
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Alert from '@/components/common/Alert.vue'
import Avatar from '@/components/common/Avatar.vue'
import FriendItem from '@/components/friend/FriendItem.vue'
import { useFriendsStore, type Friend, type FriendRequest } from '@/stores/friends'
const friendsStore = useFriendsStore()

// State
const loading = ref(true)
const error = ref('')
const activeTab = ref('all')
const searchQuery = ref('')
const showFindFriends = ref(false)
const findFriendsQuery = ref('')
const friends = ref<Friend[]>([])
const incomingRequests = ref<FriendRequest[]>([])
const outgoingRequests = ref<FriendRequest[]>([])
const blockedUsers = ref<{ userId: string; displayName: string; photoURL?: string }[]>([])

// Mock data for find friends
const mockUsers = [
  { id: 'user1', name: 'Jane Smith', mutualFriends: 5 },
  { id: 'user2', name: 'John Doe', mutualFriends: 3 },
  { id: 'user3', name: 'Alice Johnson', mutualFriends: 2 },
  { id: 'user4', name: 'Bob Williams', mutualFriends: 1 },
  { id: 'user5', name: 'Emma Davis', mutualFriends: 0 }
]

// Computed
const filteredFriends = computed(() => {
  if (!searchQuery.value) return friends.value

  const query = searchQuery.value.toLowerCase()
  return friends.value.filter(friend =>
    friend.displayName.toLowerCase().includes(query)
  )
})

// Methods
async function fetchFriends() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([
      friendsStore.fetchFriends(),
      friendsStore.fetchFriendRequests(),
      friendsStore.fetchBlockedUsers()
    ])

    friends.value = friendsStore.friends
    incomingRequests.value = friendsStore.incomingRequests
    outgoingRequests.value = friendsStore.outgoingRequests

    // In a real app, we would fetch blocked users with their details
    // For now, we'll create mock data based on the blocked IDs
    blockedUsers.value = friendsStore.blockedUsers.map(id => ({
      userId: id,
      displayName: `Blocked User ${id.substring(0, 4)}`,
      photoURL: undefined
    }))
  } catch (err: any) {
    console.error('Error fetching friends data:', err)
    error.value = err.message || 'Failed to load friends data'
  } finally {
    loading.value = false
  }
}

function sendMessage(userId: string) {
  // In a real app, this would open a chat with the user
  console.log('Send message to:', userId)
}

function addMockFriend(user: { id: string; name: string }) {
  // In a real app, this would send a friend request
  console.log('Add friend:', user)
  showFindFriends.value = false

  // Show success message
  alert(`Friend request sent to ${user.name}!`)
}

// Fetch data on component mount
onMounted(fetchFriends)
</script>

<style lang="scss" scoped>
.friends-view {
  padding: 2rem 0;
}

.page-title {
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.tabs {
  display: flex;
  margin-bottom: 2rem;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  transition: all 0.2s;

  .mdi {
    margin-right: 0.5rem;
    font-size: 1.25rem;
  }

  .count {
    margin-left: 0.5rem;
    background-color: var(--background-color);
    color: var(--text-light);
    border-radius: 20px;
    padding: 0.1rem 0.5rem;
    font-size: 0.8rem;
    min-width: 1.5rem;
  }

  &:hover {
    background-color: var(--background-color);
  }

  &.active {
    color: var(--primary-color);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--primary-color);

    .count {
      background-color: var(--primary-color);
      color: white;
    }
  }

  @media (max-width: 768px) {
    flex: 0 0 50%;
    padding: 0.75rem;
  }
}

.search-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 576px) {
    flex-direction: column;
  }
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--card-color);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--primary-color);
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.loading-spinner {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;

  .empty-icon {
    font-size: 4rem;
    color: var(--text-light);
    margin-bottom: 1rem;
    display: block;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-light);
    margin-bottom: 1.5rem;
  }
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
  }
}

.modal-close {
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
    background-color: var(--background-color);
  }

  .mdi {
    font-size: 1.25rem;
  }
}

.modal-body {
  padding: 1.5rem;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--background-color);
  }

  .user-info {
    margin-left: 1rem;
    flex: 1;
  }

  .user-name {
    font-weight: 600;
  }

  .user-meta {
    font-size: 0.85rem;
    color: var(--text-light);
  }
}
</style>
