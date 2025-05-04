<template>
  <div class="home-view">
    <div class="container">
      <div class="row">
        <!-- Left Sidebar -->
        <div class="sidebar-left hide-mobile">
          <Card>
            <div class="sidebar-section">
              <h3 class="sidebar-title">Navigation</h3>
              <div class="sidebar-links">
                <router-link to="/" class="sidebar-link active">
                  <span class="mdi mdi-home"></span>
                  <span>Home</span>
                </router-link>
                <router-link v-if="isAuthenticated" to="/profile" class="sidebar-link">
                  <span class="mdi mdi-account"></span>
                  <span>Profile</span>
                </router-link>
                <router-link v-if="isAuthenticated" to="/friends" class="sidebar-link">
                  <span class="mdi mdi-account-multiple"></span>
                  <span>Friends</span>
                </router-link>
                <router-link v-if="isAuthenticated" to="/groups" class="sidebar-link">
                  <span class="mdi mdi-account-group"></span>
                  <span>Groups</span>
                </router-link>
              </div>
            </div>

            <div v-if="isAuthenticated && myGroups.length > 0" class="sidebar-section">
              <h3 class="sidebar-title">Your Groups</h3>
              <div class="sidebar-links">
                <router-link 
                  v-for="group in myGroups.slice(0, 5)" 
                  :key="group.id" 
                  :to="`/groups/${group.id}`" 
                  class="sidebar-link"
                >
                  <span class="mdi mdi-account-group"></span>
                  <span>{{ group.name }}</span>
                </router-link>
                <router-link v-if="myGroups.length > 5" to="/groups" class="sidebar-link see-all">
                  <span>See all groups</span>
                </router-link>
              </div>
            </div>
          </Card>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Create Post Form -->
          <PostForm 
            v-if="isAuthenticated" 
            @created="handlePostCreated" 
          />

          <!-- Feed Tabs -->
          <div class="feed-tabs">
            <button 
              class="tab-button" 
              :class="{ active: activeTab === 'all' }" 
              @click="activeTab = 'all'"
            >
              <span class="mdi mdi-earth"></span>
              <span>All Posts</span>
            </button>
            <button 
              v-if="isAuthenticated" 
              class="tab-button" 
              :class="{ active: activeTab === 'friends' }" 
              @click="activeTab = 'friends'"
            >
              <span class="mdi mdi-account-multiple"></span>
              <span>Friends</span>
            </button>
            <button 
              v-if="isAuthenticated" 
              class="tab-button" 
              :class="{ active: activeTab === 'groups' }" 
              @click="activeTab = 'groups'"
            >
              <span class="mdi mdi-account-group"></span>
              <span>Groups</span>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner">
              <span class="mdi mdi-loading mdi-spin"></span>
            </div>
            <p>Loading posts...</p>
          </div>

          <!-- Error State -->
          <Alert 
            v-if="error" 
            type="error" 
            :message="error" 
            dismissible 
            @close="error = ''"
          />

          <!-- Empty State -->
          <Card v-if="!loading && displayedPosts.length === 0" class="empty-state">
            <div class="text-center p-4">
              <span class="mdi mdi-emoticon-sad-outline empty-icon"></span>
              <h3>No posts to show</h3>
              <p v-if="activeTab === 'all'">
                There are no public posts yet. Be the first to create one!
              </p>
              <p v-else-if="activeTab === 'friends'">
                No posts from your friends yet. Add more friends or encourage them to post!
              </p>
              <p v-else-if="activeTab === 'groups'">
                No posts in your groups yet. Join more groups or create a post in one of your groups!
              </p>
              <div v-if="isAuthenticated" class="mt-3">
                <Button @click="scrollToPostForm">Create a Post</Button>
              </div>
              <div v-else class="mt-3">
                <Button @click="$router.push('/login')">Login to Post</Button>
              </div>
            </div>
          </Card>

          <!-- Posts List -->
          <div v-if="!loading && displayedPosts.length > 0" class="posts-list">
            <PostItem 
              v-for="post in displayedPosts" 
              :key="post.post_id"
              :post="post"
              @edit="handleEditPost"
              @delete="handleDeletePost"
            />
          </div>

          <!-- Load More -->
          <div v-if="!loading && displayedPosts.length > 0 && hasMorePosts" class="load-more">
            <Button 
              variant="outline" 
              block 
              :loading="loadingMore" 
              @click="loadMorePosts"
            >
              Load More
            </Button>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="sidebar-right hide-mobile">
          <Card v-if="!isAuthenticated">
            <div class="sidebar-section">
              <h3 class="sidebar-title">Welcome!</h3>
              <p>Join our social network to connect with friends, join groups, and share your thoughts.</p>
              <div class="mt-3">
                <Button block @click="$router.push('/login')">Login</Button>
              </div>
            </div>
          </Card>

          <Card v-if="isAuthenticated && friendRequests.length > 0">
            <div class="sidebar-section">
              <h3 class="sidebar-title">Friend Requests</h3>
              <div class="friend-requests">
                <div 
                  v-for="request in friendRequests.slice(0, 3)" 
                  :key="request.id" 
                  class="friend-request-item"
                >
                  <Avatar 
                    :src="request.senderPhotoURL" 
                    :name="request.senderName" 
                    size="sm" 
                  />
                  <div class="friend-request-info">
                    <div class="friend-name">{{ request.senderName }}</div>
                    <div class="friend-actions">
                      <button class="mini-btn accept" @click="acceptFriendRequest(request.id)">
                        <span class="mdi mdi-check"></span>
                      </button>
                      <button class="mini-btn reject" @click="rejectFriendRequest(request.id)">
                        <span class="mdi mdi-close"></span>
                      </button>
                    </div>
                  </div>
                </div>
                <router-link v-if="friendRequests.length > 3" to="/friends" class="see-all-link">
                  See all requests
                </router-link>
              </div>
            </div>
          </Card>

          <Card>
            <div class="sidebar-section">
              <h3 class="sidebar-title">Trending Groups</h3>
              <div v-if="trendingGroups.length > 0" class="trending-groups">
                <div 
                  v-for="group in trendingGroups.slice(0, 3)" 
                  :key="group.id" 
                  class="trending-group-item"
                  @click="$router.push(`/groups/${group.id}`)"
                >
                  <div class="trending-group-name">{{ group.name }}</div>
                  <div class="trending-group-members">
                    <span class="mdi mdi-account-multiple"></span>
                    {{ group.members.length }} members
                  </div>
                </div>
                <router-link to="/groups" class="see-all-link">
                  Explore all groups
                </router-link>
              </div>
              <div v-else class="empty-trending">
                <p>No groups available yet.</p>
              </div>
            </div>
          </Card>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Alert from '@/components/common/Alert.vue'
import Avatar from '@/components/common/Avatar.vue'
import PostItem from '@/components/post/PostItem.vue'
import PostForm from '@/components/post/PostForm.vue'
import { useUserStore } from '@/stores/user'
import { usePostsStore, type Post } from '@/stores/posts'
import { useFriendsStore } from '@/stores/friends'
import { useGroupsStore } from '@/stores/groups'

const userStore = useUserStore()
const postsStore = usePostsStore()
const friendsStore = useFriendsStore()
const groupsStore = useGroupsStore()

// State
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const activeTab = ref('all')
const editingPost = ref<Post | null>(null)

// Computed
const isAuthenticated = computed(() => userStore.isAuthenticated)

const displayedPosts = computed(() => {
  if (activeTab.value === 'all') {
    return postsStore.publicPosts
  } else if (activeTab.value === 'friends' && isAuthenticated.value) {
    return postsStore.friendPosts
  } else if (activeTab.value === 'groups' && isAuthenticated.value) {
    // Combine posts from all user's groups
    return postsStore.posts.filter(post => 
      post.visibility === 'group' &&
      myGroups.value.some(group => group.id === post.group_id)
    )
  }
  return []
})

const hasMorePosts = computed(() => {
  // In a real app, this would be based on pagination info from the API
  return displayedPosts.value.length >= 10
})

const friendRequests = computed(() => 
  friendsStore.incomingRequests
)

const myGroups = computed(() => 
  groupsStore.myGroups
)

const trendingGroups = computed(() => {
  // In a real app, this would be based on activity, popularity, etc.
  // For now, just sort by member count
  return [...groupsStore.groups].sort((a, b) => b.members.length - a.members.length)
})

// Methods
async function fetchInitialData() {
  loading.value = true
  error.value = ''

  try {
    await Promise.all([
      postsStore.fetchPosts(),
      isAuthenticated.value ? friendsStore.fetchFriendRequests() : Promise.resolve(),
      isAuthenticated.value ? groupsStore.fetchMyGroups() : Promise.resolve(),
      groupsStore.fetchGroups()
    ])
  } catch (err: any) {
    console.error('Error fetching data:', err)
    error.value = 'Failed to load data. Please try again.'
  } finally {
    loading.value = false
  }
}

async function loadMorePosts() {
  // In a real app, this would fetch the next page of posts
  loadingMore.value = true

  try {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    // In a real app: await postsStore.fetchMorePosts()
  } catch (err: any) {
    console.error('Error loading more posts:', err)
    error.value = 'Failed to load more posts. Please try again.'
  } finally {
    loadingMore.value = false
  }
}

function handlePostCreated(post: Post) {
  // Switch to the appropriate tab based on the post privacy
  if (post.visibility === 'group') {
    activeTab.value = 'groups'
  } else if (post.visibility === 'private') {
    activeTab.value = 'friends'
  } else {
    activeTab.value = 'all'
  }
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

async function acceptFriendRequest(requestId: string) {
  try {
    await friendsStore.respondToFriendRequest(requestId, 'accepted')
  } catch (err: any) {
    console.error('Error accepting friend request:', err)
    error.value = 'Failed to accept friend request. Please try again.'
  }
}

async function rejectFriendRequest(requestId: string) {
  try {
    await friendsStore.respondToFriendRequest(requestId, 'rejected')
  } catch (err: any) {
    console.error('Error rejecting friend request:', err)
    error.value = 'Failed to reject friend request. Please try again.'
  }
}

// Fetch data on component mount
onMounted(fetchInitialData)
</script>

<style lang="scss" scoped>
.home-view {
  padding: 2rem 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -1rem;
}

.sidebar-left, .sidebar-right {
  width: 25%;
  padding: 0 1rem;

  @media (max-width: 992px) {
    width: 30%;
  }
}

.main-content {
  width: 50%;
  padding: 0 1rem;

  @media (max-width: 992px) {
    width: 70%;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
}

.sidebar-section {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.sidebar-title {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  color: var(--text-color);
  transition: background-color 0.2s;

  .mdi {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }

  &:hover, &.active {
    background-color: var(--background-color);
    color: var(--primary-color);
  }

  &.see-all {
    color: var(--primary-color);
    justify-content: center;
    font-size: 0.9rem;
  }
}

.feed-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  background-color: var(--card-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-light);
  transition: all 0.2s;

  .mdi {
    margin-right: 0.5rem;
  }

  &:hover {
    background-color: var(--background-color);
  }

  &.active {
    color: var(--primary-color);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--primary-color);
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

.load-more {
  margin-top: 1.5rem;
}

.friend-requests {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.friend-request-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--background-color);
  }
}

.friend-request-info {
  margin-left: 0.75rem;
  flex: 1;
}

.friend-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.friend-actions {
  display: flex;
  gap: 0.5rem;
}

.mini-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &.accept {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: var(--primary-light);
    }
  }

  &.reject {
    background-color: var(--background-color);
    color: var(--text-light);

    &:hover {
      background-color: var(--danger-color);
      color: white;
    }
  }
}

.trending-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trending-group-item {
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

.trending-group-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.trending-group-members {
  font-size: 0.85rem;
  color: var(--text-light);
  display: flex;
  align-items: center;

  .mdi {
    margin-right: 0.25rem;
  }
}

.see-all-link {
  display: block;
  text-align: center;
  color: var(--primary-color);
  text-decoration: none;
  padding: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    text-decoration: underline;
  }
}

.empty-trending {
  text-align: center;
  padding: 1rem;
  color: var(--text-light);
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
</style>
