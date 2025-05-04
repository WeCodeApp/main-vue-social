<template>
  <div class="profile-view">
    <div class="container">
      <!-- Profile Header -->
      <Card class="profile-header">
        <div class="profile-cover">
          <div class="profile-avatar-container">
            <Avatar 
              :src="profileUser?.photoURL ?? undefined" 
              :name="profileUser?.displayName ?? undefined" 
              size="xl" 
              :status="isCurrentUser ? 'online' : ''"
            />
          </div>
        </div>

        <div class="profile-info">
          <div class="profile-name-container">
            <h1 class="profile-name">{{ profileUser?.displayName || 'User' }}</h1>
            <div v-if="!isCurrentUser" class="profile-actions">
              <template v-if="isFriend">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="message-outline" 
                  @click="sendMessage"
                >
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="account-remove" 
                  @click="unfriendUser"
                >
                  Unfriend
                </Button>
              </template>
              <template v-else-if="hasPendingRequestFrom">
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon="check" 
                  :loading="loading" 
                  @click="acceptFriendRequest"
                >
                  Accept Request
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="close" 
                  :loading="loading" 
                  @click="rejectFriendRequest"
                >
                  Decline
                </Button>
              </template>
              <template v-else-if="hasPendingRequestTo">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="clock-outline" 
                  disabled
                >
                  Request Sent
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="close" 
                  :loading="loading" 
                  @click="cancelFriendRequest"
                >
                  Cancel
                </Button>
              </template>
              <template v-else-if="isBlocked">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="account-cancel" 
                  @click="unblockUser"
                >
                  Unblock
                </Button>
              </template>
              <template v-else>
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon="account-plus" 
                  :loading="loading" 
                  @click="addFriend"
                >
                  Add Friend
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="block-helper" 
                  @click="blockUser"
                >
                  Block
                </Button>
              </template>
            </div>
          </div>

          <div class="profile-stats">
            <div class="profile-stat">
              <span class="stat-value">{{ userPosts.length }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="profile-stat">
              <span class="stat-value">{{ friends.length }}</span>
              <span class="stat-label">Friends</span>
            </div>
            <div class="profile-stat">
              <span class="stat-value">{{ userGroups.length }}</span>
              <span class="stat-label">Groups</span>
            </div>
          </div>
        </div>
      </Card>

      <div class="profile-content">
        <div class="row">
          <!-- Left Column: About & Friends -->
          <div class="profile-sidebar">
            <!-- About Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>About</h3>
                  <Button 
                    v-if="isCurrentUser" 
                    variant="outline" 
                    size="sm" 
                    icon="pencil" 
                    @click="editProfile"
                  >
                    Edit
                  </Button>
                </div>
              </template>

              <div class="about-info">
                <div class="about-item">
                  <span class="mdi mdi-email"></span>
                  <span>{{ profileUser?.email || 'No email provided' }}</span>
                </div>
                <div class="about-item">
                  <span class="mdi mdi-calendar-account"></span>
                  <span>Joined {{ joinedDate }}</span>
                </div>
              </div>
            </Card>

            <!-- Friends Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>Friends</h3>
                  <router-link v-if="friends.length > 0" to="/friends" class="view-all">
                    View All
                  </router-link>
                </div>
              </template>

              <div v-if="loadingFriends" class="text-center p-3">
                <span class="mdi mdi-loading mdi-spin"></span> Loading friends...
              </div>

              <div v-else-if="friends.length === 0" class="empty-state">
                <span class="mdi mdi-account-multiple"></span>
                <p>No friends yet</p>
              </div>

              <div v-else class="friends-grid">
                <div 
                  v-for="friend in friends.slice(0, 6)" 
                  :key="friend.userId" 
                  class="friend-item"
                  @click="viewProfile(friend.userId)"
                >
                  <Avatar 
                    :src="friend.photoURL" 
                    :name="friend.displayName" 
                    size="md" 
                  />
                  <div class="friend-name">{{ friend.displayName }}</div>
                </div>
              </div>
            </Card>

            <!-- Groups Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>Groups</h3>
                  <router-link v-if="userGroups.length > 0" to="/groups" class="view-all">
                    View All
                  </router-link>
                </div>
              </template>

              <div v-if="loadingGroups" class="text-center p-3">
                <span class="mdi mdi-loading mdi-spin"></span> Loading groups...
              </div>

              <div v-else-if="userGroups.length === 0" class="empty-state">
                <span class="mdi mdi-account-group"></span>
                <p>No groups yet</p>
              </div>

              <div v-else class="groups-list">
                <div 
                  v-for="group in userGroups.slice(0, 3)" 
                  :key="group.id" 
                  class="group-item"
                  @click="$router.push(`/groups/${group.id}`)"
                >
                  <div class="group-name">{{ group.name }}</div>
                  <div class="group-members">
                    <span class="mdi mdi-account-multiple"></span>
                    {{ group.members.length }} members
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- Right Column: Posts -->
          <div class="profile-main">
            <!-- Create Post Form -->
            <PostForm 
              v-if="isCurrentUser" 
              @created="handlePostCreated" 
            />

            <!-- Posts Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>Posts</h3>
                  <div class="post-filters">
                    <button 
                      class="filter-button" 
                      :class="{ active: postFilter === 'all' }" 
                      @click="postFilter = 'all'"
                    >
                      All
                    </button>
                    <button 
                      v-if="isCurrentUser"
                      class="filter-button" 
                      :class="{ active: postFilter === 'public' }" 
                      @click="postFilter = 'public'"
                    >
                      Public
                    </button>
                    <button 
                      v-if="isCurrentUser"
                      class="filter-button" 
                      :class="{ active: postFilter === 'private' }" 
                      @click="postFilter = 'private'"
                    >
                      Private
                    </button>
                  </div>
                </div>
              </template>

              <div v-if="loadingPosts" class="text-center p-3">
                <span class="mdi mdi-loading mdi-spin"></span> Loading posts...
              </div>

              <div v-else-if="filteredPosts.length === 0" class="empty-state">
                <span class="mdi mdi-post"></span>
                <p>No posts yet</p>
                <div v-if="isCurrentUser" class="mt-3">
                  <Button @click="scrollToPostForm">Create a Post</Button>
                </div>
              </div>

              <div v-else class="posts-list">
                <PostItem 
                  v-for="post in filteredPosts" 
                  :key="post.post_id"
                  :post="post"
                  @edit="handleEditPost"
                  @delete="handleDeletePost"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Post Modal -->
    <div v-if="editingPost" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h3>Edit Post</h3>
        <PostForm 
          :post="editingPost" 
          @updated="handlePostUpdated" 
          @cancel="cancelEdit" 
        />
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="showEditProfile" class="modal-overlay" @click="showEditProfile = false">
      <div class="modal-content" @click.stop>
        <h3>Edit Profile</h3>
        <p class="text-center">Profile editing is not available in this demo.</p>
        <div class="modal-actions">
          <Button @click="showEditProfile = false">Close</Button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="modal-overlay" @click="showConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <Button variant="outline" @click="showConfirm = false">Cancel</Button>
          <Button 
            :variant="confirmAction === 'block' ? 'danger' : 'primary'" 
            :loading="loading"
            @click="confirmActionHandler"
          >
            {{ confirmButtonText }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Avatar from '@/components/common/Avatar.vue'
import PostItem from '@/components/post/PostItem.vue'
import PostForm from '@/components/post/PostForm.vue'
import { useUserStore } from '@/stores/user'
import { usePostsStore, type Post } from '@/stores/posts'
import { useFriendsStore, type FriendRequest, type Friend } from '@/stores/friends'
import { useGroupsStore } from '@/stores/groups'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const postsStore = usePostsStore()
const friendsStore = useFriendsStore()
const groupsStore = useGroupsStore()

// State
const loading = ref(false)
const loadingPosts = ref(true)
const loadingFriends = ref(true)
const loadingGroups = ref(true)
const postFilter = ref<'all' | 'public' | 'private'>('all')
const editingPost = ref<Post | null>(null)
const showEditProfile = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'unfriend' | 'block' | 'unblock'>('unfriend')
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')
const profileUser = ref<{
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
} | null>(null)
const friends = ref<Friend[]>([])
const pendingRequest = ref<FriendRequest | null>(null)

// Computed
const userId = computed(() => {
  return route.params.id as string || userStore.user?.uid
})

const isCurrentUser = computed(() => {
  return userStore.user?.uid === userId.value
})

const userPosts = computed(() => {
  return postsStore.posts.filter(post => post.author_id === userId.value)
})

const filteredPosts = computed(() => {
  if (postFilter.value === 'all') {
    if (isCurrentUser.value) {
      return userPosts.value
    } else {
      // For other users, only show public posts or private posts if we're friends
      return userPosts.value.filter(post => 
        post.visibility === 'public' ||
        (post.visibility === 'private' && isFriend.value)
      )
    }
  } else {
    return userPosts.value.filter(post => post.visibility === postFilter.value)
  }
})

const userGroups = computed(() => {
  return groupsStore.groups.filter(group => 
    group.members.includes(userId.value as string)
  )
})

const joinedDate = computed(() => {
  // In a real app, this would come from the user's profile
  return formatDistanceToNow(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), { addSuffix: true })
})

const isFriend = computed(() => {
  return friendsStore.isFriend(userId.value as string)
})

const isBlocked = computed(() => {
  return friendsStore.isBlocked(userId.value as string)
})

const hasPendingRequestFrom = computed(() => {
  return friendsStore.hasPendingRequestFrom(userId.value as string)
})

const hasPendingRequestTo = computed(() => {
  return friendsStore.hasPendingRequestTo(userId.value as string)
})

// Methods
async function fetchProfileData() {
  loadingPosts.value = true
  loadingFriends.value = true
  loadingGroups.value = true

  try {
    // In a real app, we would fetch the user profile from the API
    if (isCurrentUser.value && userStore.user) {
      profileUser.value = userStore.user
    } else {
      // Mock user data for demo
      profileUser.value = {
        uid: userId.value as string,
        displayName: 'User ' + userId.value,
        email: `user${userId.value}@example.com`,
        photoURL: null
      }
    }

    // Fetch posts, friends, and groups
    await Promise.all([
      postsStore.fetchPosts(),
      friendsStore.fetchFriends(),
      friendsStore.fetchFriendRequests(),
      groupsStore.fetchGroups()
    ])

    // Get friends for this user
    friends.value = friendsStore.friends.filter(friend => 
      isCurrentUser.value || !friendsStore.isBlocked(friend.userId)
    )

    // Find pending request if any
    const incomingRequest = friendsStore.incomingRequests.find(req => 
      req.senderId === userId.value
    )

    const outgoingRequest = friendsStore.outgoingRequests.find(req => 
      req.friend_id === userId.value
    )

    pendingRequest.value = incomingRequest || outgoingRequest || null
  } catch (err) {
    console.error('Error fetching profile data:', err)
  } finally {
    loadingPosts.value = false
    loadingFriends.value = false
    loadingGroups.value = false
  }
}

function handlePostCreated(post: Post) {
  // Switch to the appropriate filter based on the post privacy
  postFilter.value = post.visibility === 'private' ? 'private' : 'public'
}

function handleEditPost(post: Post) {
  editingPost.value = post
}

function handlePostUpdated(_post: Post) {
  editingPost.value = null
}

function handleDeletePost(_postId: string) {
  // The post is already removed from the store, so no need to do anything here
}

function cancelEdit() {
  editingPost.value = null
}

function scrollToPostForm() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

function editProfile() {
  showEditProfile.value = true
}

function viewProfile(userId: string) {
  router.push(`/profile/${userId}`)
}

function sendMessage() {
  // In a real app, this would open a chat with the user
  console.log('Send message to:', userId.value)
}

async function addFriend() {
  if (!profileUser.value) return

  loading.value = true
  try {
    await friendsStore.sendFriendRequest(profileUser.value.uid)
    await fetchProfileData()
  } catch (err) {
    console.error('Error sending friend request:', err)
  } finally {
    loading.value = false
  }
}

async function acceptFriendRequest() {
  if (!pendingRequest.value) return

  loading.value = true
  try {
    await friendsStore.respondToFriendRequest(pendingRequest.value.id, 'accepted')
    await fetchProfileData()
  } catch (err) {
    console.error('Error accepting friend request:', err)
  } finally {
    loading.value = false
  }
}

async function rejectFriendRequest() {
  if (!pendingRequest.value) return

  loading.value = true
  try {
    await friendsStore.respondToFriendRequest(pendingRequest.value.id, 'rejected')
    await fetchProfileData()
  } catch (err) {
    console.error('Error rejecting friend request:', err)
  } finally {
    loading.value = false
  }
}

async function cancelFriendRequest() {
  // Reuse reject for canceling (in a real app, this would be a separate method)
  await rejectFriendRequest()
}

function unfriendUser() {
  if (!profileUser.value) return

  confirmAction.value = 'unfriend'
  confirmTitle.value = `Unfriend ${profileUser.value.displayName || 'User'}`
  confirmMessage.value = `Are you sure you want to remove ${profileUser.value.displayName || 'User'} from your friends? They won't be notified.`
  confirmButtonText.value = 'Unfriend'
  showConfirm.value = true
}

function blockUser() {
  if (!profileUser.value) return

  confirmAction.value = 'block'
  confirmTitle.value = `Block ${profileUser.value.displayName || 'User'}`
  confirmMessage.value = `Are you sure you want to block ${profileUser.value.displayName || 'User'}? They won't be able to see your posts or send you friend requests.`
  confirmButtonText.value = 'Block'
  showConfirm.value = true
}

function unblockUser() {
  if (!profileUser.value) return

  confirmAction.value = 'unblock'
  confirmTitle.value = `Unblock ${profileUser.value.displayName || 'User'}`
  confirmMessage.value = `Are you sure you want to unblock ${profileUser.value.displayName || 'User'}? They will be able to see your public posts and send you friend requests.`
  confirmButtonText.value = 'Unblock'
  showConfirm.value = true
}

async function confirmActionHandler() {
  if (!profileUser.value) return

  loading.value = true

  try {
    if (confirmAction.value === 'unfriend') {
      await friendsStore.unfriend(profileUser.value.uid)
    } else if (confirmAction.value === 'block') {
      await friendsStore.blockUser(
        profileUser.value.uid, 
        profileUser.value.displayName || 'User'
      )
    } else if (confirmAction.value === 'unblock') {
      await friendsStore.unblockUser(profileUser.value.uid)
    }

    showConfirm.value = false
    await fetchProfileData()
  } catch (err) {
    console.error(`Error performing ${confirmAction.value}:`, err)
  } finally {
    loading.value = false
  }
}

// Fetch data on component mount and when userId changes
onMounted(fetchProfileData)
watch(() => userId.value, fetchProfileData)
</script>

<style lang="scss" scoped>
.profile-view {
  padding: 2rem 0;
}

.profile-header {
  margin-bottom: 2rem;
  overflow: hidden;
}

.profile-cover {
  height: 150px;
  background-color: var(--primary-light);
  margin: -1.5rem -1.5rem 0;
  position: relative;
}

.profile-avatar-container {
  position: absolute;
  bottom: -40px;
  left: 2rem;
}

.profile-info {
  margin-top: 50px;
  padding: 0 2rem;
}

.profile-name-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.profile-name {
  font-size: 1.75rem;
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.profile-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
}

.profile-content {
  margin-bottom: 2rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -1rem;
}

.profile-sidebar {
  width: 35%;
  padding: 0 1rem;

  @media (max-width: 992px) {
    width: 100%;
    margin-bottom: 2rem;
  }

  & > * {
    margin-bottom: 1.5rem;
  }
}

.profile-main {
  width: 65%;
  padding: 0 1rem;

  @media (max-width: 992px) {
    width: 100%;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  h3 {
    margin: 0;
    font-size: 1.25rem;
  }

  .view-all {
    font-size: 0.9rem;
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.about-item {
  display: flex;
  align-items: center;

  .mdi {
    margin-right: 1rem;
    font-size: 1.25rem;
    color: var(--text-light);
  }
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.friend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--background-color);
  }
}

.friend-name {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-item {
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background-color: var(--background-color);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }
}

.group-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.group-members {
  font-size: 0.85rem;
  color: var(--text-light);
  display: flex;
  align-items: center;

  .mdi {
    margin-right: 0.25rem;
  }
}

.post-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-button {
  background: transparent;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--background-color);
  }

  &.active {
    background-color: var(--primary-color);
    color: white;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;

  .mdi {
    font-size: 3rem;
    color: var(--text-light);
    margin-bottom: 1rem;
    display: block;
  }

  p {
    color: var(--text-light);
    margin-bottom: 0;
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
  max-width: 600px;

  h3 {
    margin-bottom: 1.5rem;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
