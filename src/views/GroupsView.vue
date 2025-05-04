<template>
  <div class="groups-view">
    <div class="container">
      <div class="groups-header">
        <h1 class="page-title">Groups</h1>
        <Button 
          variant="primary" 
          icon="plus" 
          @click="showCreateGroup = true"
        >
          Create Group
        </Button>
      </div>
      
      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'my' }" 
          @click="activeTab = 'my'"
        >
          <span class="mdi mdi-account-group"></span>
          <span>My Groups</span>
          <span class="count">{{ myGroups.length }}</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'discover' }" 
          @click="activeTab = 'discover'"
        >
          <span class="mdi mdi-compass"></span>
          <span>Discover</span>
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span>
        </div>
        <p>Loading groups...</p>
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
      
      <!-- My Groups Tab -->
      <div v-if="activeTab === 'my' && !loading">
        <!-- Search -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="mdi mdi-magnify search-icon"></span>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="search-input" 
              placeholder="Search my groups..." 
            />
            <button 
              v-if="searchQuery" 
              class="clear-search" 
              @click="searchQuery = ''"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>
        </div>
        
        <!-- Empty State -->
        <Card v-if="filteredMyGroups.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-account-group empty-icon"></span>
            <h3>No groups found</h3>
            <p v-if="searchQuery">
              No groups match your search query. Try a different search.
            </p>
            <p v-else>
              You haven't joined any groups yet. Create a group or discover new ones!
            </p>
            <div class="mt-3">
              <Button @click="showCreateGroup = true">Create Group</Button>
              <Button 
                variant="outline" 
                class="ml-2" 
                @click="activeTab = 'discover'"
              >
                Discover Groups
              </Button>
            </div>
          </div>
        </Card>
        
        <!-- Groups Grid -->
        <div v-else class="groups-grid">
          <GroupItem 
            v-for="group in filteredMyGroups" 
            :key="group.id" 
            :group="group"
            :showCreator="true"
            @update="fetchGroups"
            @edit="editGroup"
            @manage-members="manageGroupMembers"
          />
        </div>
      </div>
      
      <!-- Discover Tab -->
      <div v-if="activeTab === 'discover' && !loading">
        <!-- Search -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <span class="mdi mdi-magnify search-icon"></span>
            <input 
              type="text" 
              v-model="discoverSearchQuery" 
              class="search-input" 
              placeholder="Search for groups..." 
            />
            <button 
              v-if="discoverSearchQuery" 
              class="clear-search" 
              @click="discoverSearchQuery = ''"
            >
              <span class="mdi mdi-close"></span>
            </button>
          </div>
        </div>
        
        <!-- Empty State -->
        <Card v-if="filteredDiscoverGroups.length === 0" class="empty-state">
          <div class="text-center p-4">
            <span class="mdi mdi-compass empty-icon"></span>
            <h3>No groups found</h3>
            <p v-if="discoverSearchQuery">
              No groups match your search query. Try a different search.
            </p>
            <p v-else>
              There are no groups available to discover. Be the first to create one!
            </p>
            <div class="mt-3">
              <Button @click="showCreateGroup = true">Create Group</Button>
            </div>
          </div>
        </Card>
        
        <!-- Discover Groups Grid -->
        <div v-else class="groups-grid">
          <GroupItem 
            v-for="group in filteredDiscoverGroups" 
            :key="group.id" 
            :group="group"
            :showCreator="true"
            @update="fetchGroups"
          />
        </div>
      </div>
    </div>
    
    <!-- Create Group Modal -->
    <div v-if="showCreateGroup" class="modal-overlay" @click="showCreateGroup = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingGroup ? 'Edit Group' : 'Create Group' }}</h3>
          <button class="modal-close" @click="cancelGroupForm">
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
                @click="cancelGroupForm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                :loading="submitting"
              >
                {{ editingGroup ? 'Save Changes' : 'Create Group' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Manage Members Modal -->
    <div v-if="showManageMembers && currentGroup" class="modal-overlay" @click="showManageMembers = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Manage Members - {{ currentGroup.name }}</h3>
          <button class="modal-close" @click="showManageMembers = false">
            <span class="mdi mdi-close"></span>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="loadingMembers" class="text-center p-3">
            <span class="mdi mdi-loading mdi-spin"></span> Loading members...
          </div>
          
          <div v-else-if="groupMembers.length === 0" class="empty-state">
            <span class="mdi mdi-account-group"></span>
            <p>No members in this group yet.</p>
          </div>
          
          <div v-else class="members-list">
            <div 
              v-for="member in groupMembers" 
              :key="member.userId" 
              class="member-item"
            >
              <Avatar 
                :name="member.displayName" 
                :src="member.photoURL" 
                size="md" 
              />
              <div class="member-info">
                <div class="member-name">
                  {{ member.displayName }}
                  <span v-if="isGroupCreator(member.userId)" class="member-badge creator">Creator</span>
                  <span v-else-if="member.isAdmin" class="member-badge admin">Admin</span>
                </div>
                <div class="member-joined">
                  Joined {{ formatDate(member.joinedAt) }}
                </div>
              </div>
              <div v-if="isCurrentUserAdmin && !isGroupCreator(member.userId) && member.userId !== userStore.user?.uid" class="member-actions">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Alert from '@/components/common/Alert.vue'
import Avatar from '@/components/common/Avatar.vue'
import GroupItem from '@/components/group/GroupItem.vue'
import { useUserStore } from '@/stores/user'
import { useGroupsStore, type Group, type GroupMember } from '@/stores/groups'

const userStore = useUserStore()
const groupsStore = useGroupsStore()

// State
const loading = ref(true)
const loadingMembers = ref(false)
const submitting = ref(false)
const error = ref('')
const groupFormError = ref('')
const activeTab = ref('my')
const searchQuery = ref('')
const discoverSearchQuery = ref('')
const showCreateGroup = ref(false)
const showManageMembers = ref(false)
const editingGroup = ref<Group | null>(null)
const currentGroup = ref<Group | null>(null)
const groupMembers = ref<GroupMember[]>([])
const myGroups = ref<Group[]>([])
const allGroups = ref<Group[]>([])

// Group form
const groupForm = ref({
  name: '',
  description: '',
  imageUrl: ''
})

// Computed
const filteredMyGroups = computed(() => {
  if (!searchQuery.value) return myGroups.value
  
  const query = searchQuery.value.toLowerCase()
  return myGroups.value.filter(group => 
    group.name.toLowerCase().includes(query) || 
    group.description.toLowerCase().includes(query)
  )
})

const filteredDiscoverGroups = computed(() => {
  // Filter out groups the user is already a member of
  const discoverGroups = allGroups.value.filter(group => 
    !myGroups.value.some(myGroup => myGroup.id === group.id)
  )
  
  if (!discoverSearchQuery.value) return discoverGroups
  
  const query = discoverSearchQuery.value.toLowerCase()
  return discoverGroups.filter(group => 
    group.name.toLowerCase().includes(query) || 
    group.description.toLowerCase().includes(query)
  )
})

const isCurrentUserAdmin = computed(() => {
  if (!currentGroup.value || !userStore.user) return false
  return currentGroup.value.admins.includes(userStore.user.uid)
})

// Methods
async function fetchGroups() {
  loading.value = true
  error.value = ''
  
  try {
    await Promise.all([
      groupsStore.fetchGroups(),
      groupsStore.fetchMyGroups()
    ])
    
    myGroups.value = groupsStore.myGroups
    allGroups.value = groupsStore.groups
  } catch (err: any) {
    console.error('Error fetching groups:', err)
    error.value = err.message || 'Failed to load groups'
  } finally {
    loading.value = false
  }
}

function formatDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

function editGroup(group: Group) {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    description: group.description,
    imageUrl: group.imageUrl || ''
  }
  showCreateGroup.value = true
}

function cancelGroupForm() {
  showCreateGroup.value = false
  editingGroup.value = null
  groupForm.value = {
    name: '',
    description: '',
    imageUrl: ''
  }
  groupFormError.value = ''
}

async function submitGroupForm() {
  if (!groupForm.value.name || !groupForm.value.description) {
    groupFormError.value = 'Name and description are required'
    return
  }
  
  submitting.value = true
  groupFormError.value = ''
  
  try {
    if (editingGroup.value) {
      // Update existing group
      await groupsStore.updateGroup(
        editingGroup.value.id,
        groupForm.value.name,
        groupForm.value.description,
        groupForm.value.imageUrl || undefined
      )
    } else {
      // Create new group
      await groupsStore.createGroup(
        groupForm.value.name,
        groupForm.value.description,
        groupForm.value.imageUrl || undefined
      )
    }
    
    // Refresh groups
    await fetchGroups()
    
    // Close modal
    showCreateGroup.value = false
    editingGroup.value = null
    groupForm.value = {
      name: '',
      description: '',
      imageUrl: ''
    }
  } catch (err: any) {
    console.error('Error submitting group:', err)
    groupFormError.value = err.message || 'Failed to save group'
  } finally {
    submitting.value = false
  }
}

async function manageGroupMembers(group: Group) {
  currentGroup.value = group
  showManageMembers.value = true
  loadingMembers.value = true
  
  try {
    groupMembers.value = await groupsStore.fetchGroupMembers(group.id)
  } catch (err: any) {
    console.error('Error fetching group members:', err)
    error.value = err.message || 'Failed to load group members'
  } finally {
    loadingMembers.value = false
  }
}

function isGroupCreator(userId: string) {
  return currentGroup.value?.createdBy === userId
}

async function makeAdmin(userId: string) {
  if (!currentGroup.value) return
  
  try {
    await groupsStore.makeAdmin(currentGroup.value.id, userId)
    // Refresh members
    groupMembers.value = await groupsStore.fetchGroupMembers(currentGroup.value.id)
  } catch (err: any) {
    console.error('Error making admin:', err)
    error.value = err.message || 'Failed to make user an admin'
  }
}

async function removeAdmin(userId: string) {
  if (!currentGroup.value) return
  
  try {
    await groupsStore.removeAdmin(currentGroup.value.id, userId)
    // Refresh members
    groupMembers.value = await groupsStore.fetchGroupMembers(currentGroup.value.id)
  } catch (err: any) {
    console.error('Error removing admin:', err)
    error.value = err.message || 'Failed to remove admin status'
  }
}

// Fetch data on component mount
onMounted(fetchGroups)
</script>

<style lang="scss" scoped>
.groups-view {
  padding: 2rem 0;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.page-title {
  margin: 0;
  font-size: 2rem;
}

.tabs {
  display: flex;
  margin-bottom: 2rem;
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
}

.search-container {
  margin-bottom: 1.5rem;
}

.search-input-wrapper {
  position: relative;
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
  
  .mdi, .empty-icon {
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

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
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

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--background-color);
  }
}

.member-info {
  margin-left: 1rem;
  flex: 1;
}

.member-name {
  font-weight: 600;
  display: flex;
  align-items: center;
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

.member-joined {
  font-size: 0.85rem;
  color: var(--text-light);
}

.member-actions {
  display: flex;
  gap: 0.5rem;
}
</style>