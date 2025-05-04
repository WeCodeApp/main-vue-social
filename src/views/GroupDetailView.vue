<template>
  <div class="group-detail-view">
    <div class="container">
      <!-- Group Header -->
      <Card class="group-header">
        <div class="group-cover">
          <img v-if="group?.imageUrl" :src="group.imageUrl" alt="Group cover" class="cover-image" />
        </div>

        <div class="group-info">
          <div class="group-name-container">
            <h1 class="group-name">{{ group?.name || 'Group' }}</h1>
            <div class="group-actions">
              <template v-if="isGroupMember">
                <Button 
                  v-if="isGroupAdmin" 
                  variant="outline" 
                  size="sm" 
                  icon="pencil" 
                  @click="editGroup"
                >
                  Edit Group
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon="exit-to-app" 
                  @click="confirmLeaveGroup"
                >
                  Leave Group
                </Button>
              </template>
              <template v-else>
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon="account-plus" 
                  :loading="loading" 
                  @click="joinGroup"
                >
                  Join Group
                </Button>
              </template>
            </div>
          </div>

          <p class="group-description">{{ group?.description }}</p>

          <div class="group-meta">
            <div class="meta-item">
              <span class="mdi mdi-account-multiple"></span>
              {{ group?.members?.length || 0 }} members
            </div>
            <div class="meta-item">
              <span class="mdi mdi-calendar"></span>
              Created {{ createdDate }}
            </div>
            <div class="meta-item">
              <span class="mdi mdi-account"></span>
              Created by {{ group?.creatorName || 'Unknown' }}
            </div>
          </div>
        </div>
      </Card>

      <div class="group-content">
        <div class="row">
          <!-- Left Column: Members & Info -->
          <div class="group-sidebar">
            <!-- Members Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>Members</h3>
                  <Button 
                    v-if="isGroupAdmin" 
                    variant="outline" 
                    size="sm" 
                    icon="account-cog" 
                    @click="manageMembers"
                  >
                    Manage
                  </Button>
                </div>
              </template>

              <div v-if="loadingMembers" class="text-center p-3">
                <span class="mdi mdi-loading mdi-spin"></span> Loading members...
              </div>

              <div v-else-if="!groupMembers.length" class="empty-state">
                <span class="mdi mdi-account-multiple"></span>
                <p>No members yet</p>
              </div>

              <div v-else class="members-grid">
                <div 
                  v-for="member in groupMembers.slice(0, 6)" 
                  :key="member.userId" 
                  class="member-item"
                  @click="viewProfile(member.userId)"
                >
                  <Avatar 
                    :src="member.photoURL" 
                    :name="member.displayName" 
                    size="md" 
                  />
                  <div class="member-info">
                    <div class="member-name">
                      {{ member.displayName }}
                      <span v-if="isGroupCreator(member.userId)" class="member-badge creator">Creator</span>
                      <span v-else-if="member.isAdmin" class="member-badge admin">Admin</span>
                    </div>
                  </div>
                </div>

                <div v-if="groupMembers.length > 6" class="view-all-members" @click="showAllMembers = true">
                  <span class="mdi mdi-dots-horizontal"></span>
                  <span>View all members</span>
                </div>
              </div>
            </Card>

            <!-- About Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>About this Group</h3>
                </div>
              </template>

              <div class="about-info">
                <p>{{ group?.description }}</p>
                <div class="about-item">
                  <span class="mdi mdi-calendar"></span>
                  <span>Created {{ createdDate }}</span>
                </div>
                <div class="about-item">
                  <span class="mdi mdi-account"></span>
                  <span>Created by {{ group?.creatorName || 'Unknown' }}</span>
                </div>
              </div>
            </Card>
          </div>

          <!-- Right Column: Posts -->
          <div class="group-main">
            <!-- Create Post Form -->
            <PostForm 
              v-if="isGroupMember" 
              :groupId="groupId" 
              @created="handlePostCreated" 
            />

            <!-- Posts Section -->
            <Card>
              <template #header>
                <div class="card-header">
                  <h3>Posts</h3>
                </div>
              </template>

              <div v-if="loadingPosts" class="text-center p-3">
                <span class="mdi mdi-loading mdi-spin"></span> Loading posts...
              </div>

              <div v-else-if="!groupPosts.length" class="empty-state">
                <span class="mdi mdi-post"></span>
                <p>No posts in this group yet</p>
                <div v-if="isGroupMember" class="mt-3">
                  <Button @click="scrollToPostForm">Create a Post</Button>
                </div>
                <div v-else class="mt-3">
                  <Button @click="joinGroup">Join Group to Post</Button>
                </div>
              </div>

              <div v-else class="posts-list">
                <PostItem 
                  v-for="post in groupPosts" 
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

    <!-- Edit Group Modal -->
    <div v-if="showEditGroup" class="modal-overlay" @click="showEditGroup = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Edit Group</h3>
          <button class="modal-close" @click="showEditGroup = false">
            <span class="mdi mdi-close"></span>
          </button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="submitGroupForm" class="group-form">
            <div class="form-group">
              <label for="group-name" class="form-label">Group Name</label>
              <input 
                type="text" 
                id="group-name" 
                v-model="groupForm.name" 
                class="form-input" 
                placeholder="Enter group name" 
                required
              />
            </div>

            <div class="form-group">
              <label for="group-description" class="form-label">Description</label>
              <textarea 
                id="group-description" 
                v-model="groupForm.description" 
                class="form-input form-textarea" 
                placeholder="Describe your group" 
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label for="group-image" class="form-label">Group Image URL (optional)</label>
              <input 
                type="url" 
                id="group-image" 
                v-model="groupForm.imageUrl" 
                class="form-input" 
                placeholder="https://example.com/image.jpg" 
              />
            </div>

            <div v-if="groupFormError" class="form-error">
              {{ groupFormError }}
            </div>

            <div class="form-actions">
              <Button 
                type="button" 
                variant="outline" 
                @click="showEditGroup = false"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                :loading="submitting"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- All Members Modal -->
    <div v-if="showAllMembers" class="modal-overlay" @click="showAllMembers = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Group Members</h3>
          <button class="modal-close" @click="showAllMembers = false">
            <span class="mdi mdi-close"></span>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loadingMembers" class="text-center p-3">
            <span class="mdi mdi-loading mdi-spin"></span> Loading members...
          </div>

          <div v-else-if="!groupMembers.length" class="empty-state">
            <span class="mdi mdi-account-multiple"></span>
            <p>No members yet</p>
          </div>

          <div v-else class="members-list">
            <div 
              v-for="member in groupMembers" 
              :key="member.userId" 
              class="member-list-item"
            >
              <div class="member-info-row">
                <Avatar 
                  :src="member.photoURL" 
                  :name="member.displayName" 
                  size="md" 
                />
                <div class="member-details">
                  <div class="member-name">
                    {{ member.displayName }}
                    <span v-if="isGroupCreator(member.userId)" class="member-badge creator">Creator</span>
                    <span v-else-if="member.isAdmin" class="member-badge admin">Admin</span>
                  </div>
                  <div class="member-joined">
                    Joined {{ formatDate(member.joinedAt) }}
                  </div>
                </div>
                <div v-if="isGroupAdmin && !isGroupCreator(member.userId) && member.userId !== userStore.user?.uid" class="member-actions">
                  <Button 
                    v-if="!member.isAdmin" 
                    variant="outline" 
                    size="sm" 
                    icon="shield-account" 
                    @click="makeAdmin(member.userId)"
                  >
                    Make Admin
                  </Button>
                  <Button 
                    v-else 
                    variant="outline" 
                    size="sm" 
                    icon="shield-off" 
                    @click="removeAdmin(member.userId)"
                  >
                    Remove Admin
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
            :variant="confirmAction === 'leave' ? 'danger' : 'primary'" 
            :loading="loading"
            @click="confirmActionHandler"
          >
            {{ confirmButtonText }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Edit Post Modal -->
    <div v-if="editingPost" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h3>Edit Post</h3>
        <PostForm 
          :post="editingPost" 
          :groupId="groupId" 
          @updated="handlePostUpdated" 
          @cancel="cancelEdit" 
        />
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
import { useGroupsStore, type Group, type GroupMember } from '@/stores/groups'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const postsStore = usePostsStore()
const groupsStore = useGroupsStore()

// State
const loading = ref(false)
const loadingPosts = ref(true)
const loadingMembers = ref(true)
const submitting = ref(false)
const showEditGroup = ref(false)
const showAllMembers = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'leave'>('leave')
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')
const groupFormError = ref('')
const group = ref<Group | null>(null)
const groupMembers = ref<GroupMember[]>([])
const editingPost = ref<Post | null>(null)

// Group form
const groupForm = ref({
  name: '',
  description: '',
  imageUrl: ''
})

// Computed
const groupId = computed(() => {
  return route.params.id as string
})

const groupPosts = computed(() => {
  return postsStore.posts.filter(post => 
    post.visibility === 'group' && post.group_id === groupId.value
  )
})

const createdDate = computed(() => {
  if (!group.value?.createdAt) return 'recently'
  return formatDistanceToNow(group.value.createdAt, { addSuffix: true })
})

const isGroupMember = computed(() => {
  if (!userStore.user || !group.value) return false
  return group.value.members.includes(userStore.user.uid)
})

const isGroupAdmin = computed(() => {
  if (!userStore.user || !group.value) return false
  return group.value.admins.includes(userStore.user.uid)
})

// Methods
function formatDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

function isGroupCreator(userId: string) {
  return group.value?.createdBy === userId
}

async function fetchGroupData() {
  loadingPosts.value = true
  loadingMembers.value = true

  try {
    // Fetch group details
    const fetchedGroup = await groupsStore.fetchGroupById(groupId.value)
    group.value = fetchedGroup

    if (group.value) {
      // Fetch group members
      groupMembers.value = await groupsStore.fetchGroupMembers(groupId.value)

      // Fetch posts
      await postsStore.fetchPosts()
    }
  } catch (err) {
    console.error('Error fetching group data:', err)
  } finally {
    loadingPosts.value = false
    loadingMembers.value = false
  }
}

function viewProfile(userId: string) {
  router.push(`/profile/${userId}`)
}

function editGroup() {
  if (!group.value) return

  groupForm.value = {
    name: group.value.name,
    description: group.value.description,
    imageUrl: group.value.imageUrl || ''
  }

  showEditGroup.value = true
}

async function submitGroupForm() {
  if (!group.value) return

  submitting.value = true
  groupFormError.value = ''

  try {
    await groupsStore.updateGroup(
      group.value.id,
      groupForm.value.name,
      groupForm.value.description,
      groupForm.value.imageUrl || undefined
    )

    // Refresh group data
    await fetchGroupData()

    // Close modal
    showEditGroup.value = false
  } catch (err: any) {
    console.error('Error updating group:', err)
    groupFormError.value = err.message || 'Failed to update group'
  } finally {
    submitting.value = false
  }
}

function manageMembers() {
  showAllMembers.value = true
}

async function makeAdmin(userId: string) {
  if (!group.value) return

  try {
    await groupsStore.makeAdmin(group.value.id, userId)
    // Refresh members
    groupMembers.value = await groupsStore.fetchGroupMembers(group.value.id)
  } catch (err) {
    console.error('Error making admin:', err)
  }
}

async function removeAdmin(userId: string) {
  if (!group.value) return

  try {
    await groupsStore.removeAdmin(group.value.id, userId)
    // Refresh members
    groupMembers.value = await groupsStore.fetchGroupMembers(group.value.id)
  } catch (err) {
    console.error('Error removing admin:', err)
  }
}

async function joinGroup() {
  if (!groupId.value) return

  loading.value = true
  try {
    await groupsStore.joinGroup(groupId.value)
    await fetchGroupData()
  } catch (err) {
    console.error('Error joining group:', err)
  } finally {
    loading.value = false
  }
}

function confirmLeaveGroup() {
  confirmAction.value = 'leave'
  confirmTitle.value = 'Leave Group'
  confirmMessage.value = 'Are you sure you want to leave this group? You will need to be added back by an admin to rejoin.'
  confirmButtonText.value = 'Leave Group'
  showConfirm.value = true
}

async function confirmActionHandler() {
  if (!groupId.value) return

  loading.value = true

  try {
    if (confirmAction.value === 'leave') {
      await groupsStore.leaveGroup(groupId.value)
      await fetchGroupData()
    }

    showConfirm.value = false
  } catch (err) {
    console.error(`Error performing ${confirmAction.value}:`, err)
  } finally {
    loading.value = false
  }
}

function handlePostCreated(_post: Post) {
  // Scroll to the top of the posts list
  window.scrollTo({
    top: (document.querySelector('.posts-list') as HTMLElement)?.offsetTop || 0,
    behavior: 'smooth'
  })
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

// Fetch data on component mount and when groupId changes
onMounted(fetchGroupData)
watch(() => groupId.value, fetchGroupData)
</script>

<style lang="scss" scoped>
.group-detail-view {
  padding: 2rem 0;
}

.group-header {
  margin-bottom: 2rem;
  overflow: hidden;
}

.group-cover {
  height: 200px;
  background-color: var(--primary-light);
  margin: -1.5rem -1.5rem 0;
  position: relative;
  overflow: hidden;

  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.group-info {
  padding: 1.5rem 2rem;
}

.group-name-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-name {
  font-size: 2rem;
  margin: 0;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.group-description {
  margin-bottom: 1.5rem;
  color: var(--text-color);
  line-height: 1.6;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  color: var(--text-light);
  font-size: 0.9rem;
}

.meta-item {
  display: flex;
  align-items: center;

  .mdi {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
}

.group-content {
  margin-bottom: 2rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -1rem;
}

.group-sidebar {
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

.group-main {
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
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  p {
    margin: 0;
    line-height: 1.6;
  }
}

.about-item {
  display: flex;
  align-items: center;
  color: var(--text-light);

  .mdi {
    margin-right: 1rem;
    font-size: 1.25rem;
  }
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.member-item {
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

.member-info {
  margin-top: 0.5rem;
  text-align: center;
}

.member-name {
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.member-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;

  &.creator {
    background-color: var(--primary-color);
    color: white;
  }

  &.admin {
    background-color: var(--secondary-color);
    color: white;
  }
}

.view-all-members {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--primary-color);
  font-weight: 500;

  .mdi {
    margin-right: 0.5rem;
  }

  &:hover {
    background-color: var(--primary-light);
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

// Members list in modal
.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-list-item {
  padding: 0.75rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--background-color);
  }
}

.member-info-row {
  display: flex;
  align-items: center;
}

.member-details {
  margin-left: 1rem;
  flex: 1;
}

.member-joined {
  font-size: 0.85rem;
  color: var(--text-light);
}

.member-actions {
  display: flex;
  gap: 0.5rem;
}

// Form styles
.group-form {
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-error {
    color: var(--danger-color);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
