import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

export interface Group {
  id: string
  name: string
  description: string
  imageUrl?: string
  createdAt: Date
  createdBy: string
  creatorName: string
  members: string[] // Array of user IDs
  admins: string[] // Array of user IDs (admins can manage the group)
}

export interface GroupMember {
  userId: string
  displayName: string
  photoURL?: string
  joinedAt: Date
  isAdmin: boolean
}

export const useGroupsStore = defineStore('groups', () => {
  // State
  const groups = ref<Group[]>([])
  const myGroups = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const groupMembers = ref<Record<string, GroupMember[]>>({}) // Keyed by group ID
  const loading = ref(false)
  const error = ref<string | null>(null)

  // User store for authentication
  const userStore = useUserStore()

  // Getters
  const isGroupMember = computed(() => (groupId: string) => {
    const group = groups.value.find(g => g.id === groupId)
    return group ? group.members.includes(userStore.user?.uid || '') : false
  })

  const isGroupAdmin = computed(() => (groupId: string) => {
    const group = groups.value.find(g => g.id === groupId)
    return group ? group.admins.includes(userStore.user?.uid || '') : false
  })

  const userGroups = computed(() => 
    groups.value.filter(group => 
      group.members.includes(userStore.user?.uid || '')
    )
  )

  // Actions
  async function fetchGroups() {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/groups`, {
        headers: userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
      })

      if (response.data && Array.isArray(response.data)) {
        // Transform dates from strings to Date objects
        const fetchedGroups = response.data.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt)
        }))

        groups.value = fetchedGroups
      }
    } catch (err: any) {
      console.error('Error fetching groups:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch groups'
    } finally {
      loading.value = false
    }
  }

  async function fetchMyGroups() {
    if (!userStore.user || !userStore.accessToken) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/groups/my`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data && Array.isArray(response.data)) {
        // Transform dates from strings to Date objects
        const fetchedGroups = response.data.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt)
        }))

        myGroups.value = fetchedGroups
      }
    } catch (err: any) {
      console.error('Error fetching my groups:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch your groups'
    } finally {
      loading.value = false
    }
  }

  async function fetchGroupById(groupId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, {
        headers: userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
      })

      if (response.data) {
        // Transform dates from strings to Date objects
        const group: Group = {
          ...response.data,
          createdAt: new Date(response.data.createdAt)
        }

        currentGroup.value = group
        return group
      } else {
        error.value = 'Group not found'
        currentGroup.value = null
        return null
      }
    } catch (err: any) {
      console.error('Error fetching group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch group'
      currentGroup.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchGroupMembers(groupId: string) {
    if (!groupId) return []

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/groups/${groupId}/members`, {
        headers: userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
      })

      if (response.data && Array.isArray(response.data)) {
        // Transform dates from strings to Date objects
        const fetchedMembers = response.data.map((member: any) => ({
          ...member,
          joinedAt: new Date(member.joinedAt)
        }))

        groupMembers.value[groupId] = fetchedMembers
        return fetchedMembers
      }

      return []
    } catch (err: any) {
      console.error('Error fetching group members:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch group members'
      return []
    } finally {
      loading.value = false
    }
  }

  async function createGroup(name: string, description: string, imageUrl?: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to create a group'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const groupData = {
        name,
        description,
        imageUrl
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/groups`, groupData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Transform dates from strings to Date objects
        const newGroup: Group = {
          ...response.data,
          createdAt: new Date(response.data.createdAt)
        }

        groups.value.push(newGroup)
        myGroups.value.push(newGroup)
        return newGroup
      }
      return null
    } catch (err: any) {
      console.error('Error creating group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to create group'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateGroup(groupId: string, name: string, description: string, imageUrl?: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to update a group'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const groupData = {
        name,
        description,
        imageUrl
      }

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, groupData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Update local state
        const index = groups.value.findIndex(g => g.id === groupId)
        if (index !== -1) {
          groups.value[index] = {
            ...groups.value[index],
            name,
            description,
            imageUrl
          }
        }

        const myIndex = myGroups.value.findIndex(g => g.id === groupId)
        if (myIndex !== -1) {
          myGroups.value[myIndex] = {
            ...myGroups.value[myIndex],
            name,
            description,
            imageUrl
          }
        }

        if (currentGroup.value?.id === groupId) {
          currentGroup.value = {
            ...currentGroup.value,
            name,
            description,
            imageUrl
          }
        }

        return true
      }
      return false
    } catch (err: any) {
      console.error('Error updating group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to update group'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteGroup(groupId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to delete a group'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      groups.value = groups.value.filter(g => g.id !== groupId)
      myGroups.value = myGroups.value.filter(g => g.id !== groupId)

      if (currentGroup.value?.id === groupId) {
        currentGroup.value = null
      }

      if (groupMembers.value[groupId]) {
        delete groupMembers.value[groupId]
      }

      return true
    } catch (err: any) {
      console.error('Error deleting group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to delete group'
      return false
    } finally {
      loading.value = false
    }
  }

  async function joinGroup(groupId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to join a group'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/groups/${groupId}/join`, {}, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1) {
        groups.value[index].members.push(userStore.user.uid)
      }

      // Add to myGroups if not already there
      if (!myGroups.value.some(g => g.id === groupId)) {
        const group = groups.value.find(g => g.id === groupId)
        if (group) {
          myGroups.value.push(group)
        }
      }

      // Update currentGroup if we're viewing it
      if (currentGroup.value?.id === groupId) {
        currentGroup.value.members.push(userStore.user.uid)
      }

      return true
    } catch (err: any) {
      console.error('Error joining group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to join group'
      return false
    } finally {
      loading.value = false
    }
  }

  async function leaveGroup(groupId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to leave a group'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/groups/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1) {
        groups.value[index].members = groups.value[index].members.filter(id => id !== userStore.user?.uid)
        groups.value[index].admins = groups.value[index].admins.filter(id => id !== userStore.user?.uid)
      }

      // Remove from myGroups
      myGroups.value = myGroups.value.filter(g => g.id !== groupId)

      // Update currentGroup if we're viewing it
      if (currentGroup.value?.id === groupId) {
        currentGroup.value.members = currentGroup.value.members.filter(id => id !== userStore.user?.uid)
        currentGroup.value.admins = currentGroup.value.admins.filter(id => id !== userStore.user?.uid)
      }

      // Update groupMembers if loaded
      if (groupMembers.value[groupId]) {
        groupMembers.value[groupId] = groupMembers.value[groupId].filter(m => m.userId !== userStore.user?.uid)
      }

      return true
    } catch (err: any) {
      console.error('Error leaving group:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to leave group'
      return false
    } finally {
      loading.value = false
    }
  }

  async function makeAdmin(groupId: string, userId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to manage group admins'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/groups/${groupId}/admins`,
        { userId },
        { headers: { Authorization: `Bearer ${userStore.accessToken}` } }
      )

      // Update local state
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1 && !groups.value[index].admins.includes(userId)) {
        groups.value[index].admins.push(userId)
      }

      const myIndex = myGroups.value.findIndex(g => g.id === groupId)
      if (myIndex !== -1 && !myGroups.value[myIndex].admins.includes(userId)) {
        myGroups.value[myIndex].admins.push(userId)
      }

      if (currentGroup.value?.id === groupId && !currentGroup.value.admins.includes(userId)) {
        currentGroup.value.admins.push(userId)
      }

      // Update groupMembers if loaded
      if (groupMembers.value[groupId]) {
        const memberIndex = groupMembers.value[groupId].findIndex(m => m.userId === userId)
        if (memberIndex !== -1) {
          groupMembers.value[groupId][memberIndex].isAdmin = true
        }
      }

      return true
    } catch (err: any) {
      console.error('Error making user admin:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to make user an admin'
      return false
    } finally {
      loading.value = false
    }
  }

  async function removeAdmin(groupId: string, userId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to manage group admins'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/groups/${groupId}/admins/${userId}`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      const index = groups.value.findIndex(g => g.id === groupId)
      if (index !== -1) {
        groups.value[index].admins = groups.value[index].admins.filter(id => id !== userId)
      }

      const myIndex = myGroups.value.findIndex(g => g.id === groupId)
      if (myIndex !== -1) {
        myGroups.value[myIndex].admins = myGroups.value[myIndex].admins.filter(id => id !== userId)
      }

      if (currentGroup.value?.id === groupId) {
        currentGroup.value.admins = currentGroup.value.admins.filter(id => id !== userId)
      }

      // Update groupMembers if loaded
      if (groupMembers.value[groupId]) {
        const memberIndex = groupMembers.value[groupId].findIndex(m => m.userId === userId)
        if (memberIndex !== -1) {
          groupMembers.value[groupId][memberIndex].isAdmin = false
        }
      }

      return true
    } catch (err: any) {
      console.error('Error removing admin:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to remove admin'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    groups,
    myGroups,
    currentGroup,
    groupMembers,
    loading,
    error,
    isGroupMember,
    isGroupAdmin,
    userGroups,
    fetchGroups,
    fetchMyGroups,
    fetchGroupById,
    fetchGroupMembers,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
    makeAdmin,
    removeAdmin
  }
})
