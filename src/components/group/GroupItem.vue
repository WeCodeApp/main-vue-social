<template>
  <Card class="group-item" hover>
    <template #header>
      <div class="group-header">
        <h3 class="group-name">{{ group.name }}</h3>
        <div class="group-actions">
          <template v-if="isAdmin">
            <Button 
              variant="outline" 
              size="sm" 
              icon="pencil" 
              @click="$emit('edit', group)"
            >
              Edit
            </Button>
            <button class="btn-icon" @click="toggleMenu">
              <span class="mdi mdi-dots-vertical"></span>
            </button>
            <div v-if="showMenu" class="dropdown-menu">
              <button class="dropdown-item" @click="manageMembers">
                <span class="mdi mdi-account-multiple-check"></span>
                Manage Members
              </button>
              <button v-if="isCreator" class="dropdown-item text-danger" @click="confirmDelete">
                <span class="mdi mdi-delete"></span>
                Delete Group
              </button>
            </div>
          </template>
          <template v-else-if="isMember">
            <Button 
              variant="outline" 
              size="sm" 
              icon="exit-to-app" 
              @click="confirmLeave"
            >
              Leave
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
              Join
            </Button>
          </template>
        </div>
      </div>
    </template>
    
    <div class="group-content">
      <div v-if="group.imageUrl" class="group-image">
        <img :src="group.imageUrl" :alt="group.name" />
      </div>
      <div class="group-description">
        <p>{{ group.description }}</p>
      </div>
      <div class="group-meta">
        <div class="group-stat">
          <span class="mdi mdi-account-multiple"></span>
          {{ group.members.length }} {{ group.members.length === 1 ? 'member' : 'members' }}
        </div>
        <div class="group-stat">
          <span class="mdi mdi-calendar"></span>
          Created {{ formatDate(group.createdAt) }}
        </div>
        <div v-if="showCreator" class="group-stat">
          <span class="mdi mdi-account"></span>
          Created by {{ group.creatorName }}
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="group-footer">
        <Button 
          variant="outline" 
          size="sm" 
          icon="eye" 
          @click="viewGroup"
        >
          View Group
        </Button>
      </div>
    </template>
  </Card>
  
  <!-- Confirmation Modal -->
  <div v-if="showConfirm" class="modal-overlay" @click="showConfirm = false">
    <div class="modal-content" @click.stop>
      <h3>{{ confirmTitle }}</h3>
      <p>{{ confirmMessage }}</p>
      <div class="modal-actions">
        <Button variant="outline" @click="showConfirm = false">Cancel</Button>
        <Button 
          :variant="confirmAction === 'delete' ? 'danger' : 'primary'" 
          :loading="loading"
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
import Button from '@/components/common/Button.vue'
import { useUserStore } from '@/stores/user'
import { useGroupsStore, type Group } from '@/stores/groups'

const props = defineProps<{
  group: Group
  showCreator?: boolean
}>()

const emit = defineEmits(['update', 'edit', 'manage-members'])

const router = useRouter()
const userStore = useUserStore()
const groupsStore = useGroupsStore()

// State
const showMenu = ref(false)
const loading = ref(false)
const showConfirm = ref(false)
const confirmAction = ref<'leave' | 'delete'>('leave')
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')

// Computed
const isMember = computed(() => {
  if (!userStore.user) return false
  return props.group.members.includes(userStore.user.uid)
})

const isAdmin = computed(() => {
  if (!userStore.user) return false
  return props.group.admins.includes(userStore.user.uid)
})

const isCreator = computed(() => {
  if (!userStore.user) return false
  return props.group.createdBy === userStore.user.uid
})

// Methods
function formatDate(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function viewGroup() {
  router.push(`/groups/${props.group.id}`)
}

function manageMembers() {
  showMenu.value = false
  emit('manage-members', props.group)
}

async function joinGroup() {
  if (!userStore.user) {
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    await groupsStore.joinGroup(props.group.id)
    emit('update')
  } catch (error) {
    console.error('Error joining group:', error)
  } finally {
    loading.value = false
  }
}

function confirmLeave() {
  confirmAction.value = 'leave'
  confirmTitle.value = `Leave ${props.group.name}`
  confirmMessage.value = `Are you sure you want to leave this group? You'll need to be added back by an admin to rejoin.`
  confirmButtonText.value = 'Leave Group'
  showConfirm.value = true
}

function confirmDelete() {
  showMenu.value = false
  confirmAction.value = 'delete'
  confirmTitle.value = `Delete ${props.group.name}`
  confirmMessage.value = `Are you sure you want to delete this group? This action cannot be undone and all group content will be lost.`
  confirmButtonText.value = 'Delete Group'
  showConfirm.value = true
}

async function confirmActionHandler() {
  loading.value = true
  
  try {
    if (confirmAction.value === 'leave') {
      await groupsStore.leaveGroup(props.group.id)
    } else if (confirmAction.value === 'delete') {
      await groupsStore.deleteGroup(props.group.id)
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
.group-item {
  margin-bottom: 1.5rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-name {
  margin: 0;
  font-size: 1.25rem;
}

.group-actions {
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
  min-width: 180px;
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

.group-content {
  margin-bottom: 1rem;
}

.group-image {
  margin-bottom: 1rem;
  border-radius: var(--border-radius);
  overflow: hidden;
  
  img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
  }
}

.group-description {
  margin-bottom: 1rem;
  
  p {
    margin: 0;
  }
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.group-stat {
  display: flex;
  align-items: center;
  color: var(--text-light);
  font-size: 0.9rem;
  
  .mdi {
    margin-right: 0.5rem;
  }
}

.group-footer {
  display: flex;
  justify-content: flex-end;
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