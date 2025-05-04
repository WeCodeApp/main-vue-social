import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'

export interface FriendRequest {
  id: string
  senderId: string
  senderName: string
  senderPhotoURL?: string
  friend_id: string
  receiverName: string
  receiverPhotoURL?: string
  status: FriendRequestStatus
  createdAt: Date
  updatedAt?: Date
}

export interface Friend {
  id: string
  userId: string
  displayName: string
  photoURL?: string
  email?: string
}

export const useFriendsStore = defineStore('friends', () => {
  // State
  const friendRequests = ref<FriendRequest[]>([])
  const friends = ref<Friend[]>([])
  const blockedUsers = ref<string[]>([]) // Array of user IDs that the current user has blocked
  const loading = ref(false)
  const error = ref<string | null>(null)

  // User store for authentication
  const userStore = useUserStore()

  // Getters
  const incomingRequests = computed(() => 
    friendRequests.value.filter(req => 
      req.friend_id === userStore.user?.uid && 
      req.status === 'pending'
    )
  )

  const outgoingRequests = computed(() => 
    friendRequests.value.filter(req => 
      req.senderId === userStore.user?.uid && 
      req.status === 'pending'
    )
  )

  const isFriend = computed(() => (userId: string) => 
    friends.value.some(friend => friend.userId === userId)
  )

  const isBlocked = computed(() => (userId: string) => 
    blockedUsers.value.includes(userId)
  )

  const hasPendingRequestFrom = computed(() => (userId: string) => 
    friendRequests.value.some(req => 
      req.senderId === userId && 
      req.friend_id === userStore.user?.uid && 
      req.status === 'pending'
    )
  )

  const hasPendingRequestTo = computed(() => (userId: string) => 
    friendRequests.value.some(req => 
      req.senderId === userStore.user?.uid && 
      req.friend_id === userId && 
      req.status === 'pending'
    )
  )

  // Actions
  async function fetchFriendRequests() {
    if (!userStore.user || !userStore.accessToken) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data && Array.isArray(response.data)) {
        // Transform dates from strings to Date objects
        const fetchedRequests = response.data.map((request: any) => ({
          ...request,
          createdAt: new Date(request.createdAt),
          updatedAt: request.updatedAt ? new Date(request.updatedAt) : undefined
        }))

        friendRequests.value = fetchedRequests
      }
    } catch (err: any) {
      console.error('Error fetching friend requests:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch friend requests'
    } finally {
      loading.value = false
    }
  }

  async function fetchFriends() {
    if (!userStore.user || !userStore.accessToken) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data && Array.isArray(response.data)) {
        friends.value = response.data
      }
    } catch (err: any) {
      console.error('Error fetching friends:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch friends'
    } finally {
      loading.value = false
    }
  }

  async function fetchBlockedUsers() {
    if (!userStore.user || !userStore.accessToken) return

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/blocked`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data && Array.isArray(response.data)) {
        // Assuming the API returns an array of blocked user IDs
        blockedUsers.value = response.data
      }
    } catch (err: any) {
      console.error('Error fetching blocked users:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch blocked users'
    } finally {
      loading.value = false
    }
  }

  async function sendFriendRequest(receiverId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to send a friend request'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const requestData = {
        friend_id: receiverId,
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/friends/requests`, requestData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Transform dates from strings to Date objects
        const newRequest: FriendRequest = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : undefined
        }

        friendRequests.value.push(newRequest)
        return newRequest
      }
      return null
    } catch (err: any) {
      console.error('Error sending friend request:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to send friend request'
      return null
    } finally {
      loading.value = false
    }
  }

  async function respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected') {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to respond to a friend request'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/friends/requests/${requestId}`,
        { status },
        { headers: { Authorization: `Bearer ${userStore.accessToken}` } }
      )

      if (response.data) {
        // Update local state
        const index = friendRequests.value.findIndex(r => r.id === requestId)
        if (index !== -1) {
          friendRequests.value[index] = {
            ...friendRequests.value[index],
            status,
            updatedAt: new Date()
          }
        }

        // If accepted, add to friends list or refresh friends list
        if (status === 'accepted') {
          // Either add the friend directly if we have the data
          const request = friendRequests.value.find(r => r.id === requestId)
          if (request) {
            const newFriend: Friend = {
              id: requestId,
              userId: request.senderId,
              displayName: request.senderName,
              photoURL: request.senderPhotoURL
            }
            friends.value.push(newFriend)
          } else {
            // Or refresh the friends list
            await fetchFriends()
          }
        }

        return true
      }
      return false
    } catch (err: any) {
      console.error('Error responding to friend request:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to respond to friend request'
      return false
    } finally {
      loading.value = false
    }
  }

  async function unfriend(friendId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to unfriend someone'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      friends.value = friends.value.filter(f => f.userId !== friendId)

      // Also update the friendRequests array if needed
      const friend = friends.value.find(f => f.userId === friendId)
      if (friend) {
        const requestIndex = friendRequests.value.findIndex(r => r.id === friend.id)
        if (requestIndex !== -1) {
          friendRequests.value[requestIndex].status = 'rejected'
          friendRequests.value[requestIndex].updatedAt = new Date()
        }
      }

      return true
    } catch (err: any) {
      console.error('Error unfriending user:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to unfriend user'
      return false
    } finally {
      loading.value = false
    }
  }

  async function blockUser(userId: string, userName: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to block a user'
      return false
    }

    loading.value = true
    error.value = null

    try {
      // First, check if the user is already blocked
      if (blockedUsers.value.includes(userId)) {
        error.value = 'User is already blocked'
        return false
      }

      // Block the user
      await axios.post(`${import.meta.env.VITE_API_URL}/friends/blocked`,
        { userId, userName },
        { headers: { Authorization: `Bearer ${userStore.accessToken}` } }
      )

      // If they were friends, unfriend them
      if (isFriend.value(userId)) {
        await unfriend(userId)
      }

      // Update local state for any pending requests
      const pendingRequests = friendRequests.value.filter(r => 
        (r.senderId === userId && r.friend_id === userStore.user?.uid) ||
        (r.senderId === userStore.user?.uid && r.friend_id === userId)
      )

      for (const request of pendingRequests) {
        // Update local state
        const index = friendRequests.value.findIndex(r => r.id === request.id)
        if (index !== -1) {
          friendRequests.value[index].status = 'rejected'
          friendRequests.value[index].updatedAt = new Date()
        }
      }

      // Update local state
      blockedUsers.value.push(userId)

      return true
    } catch (err: any) {
      console.error('Error blocking user:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to block user'
      return false
    } finally {
      loading.value = false
    }
  }

  async function unblockUser(userId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to unblock a user'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/friends/blocked/${userId}`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      blockedUsers.value = blockedUsers.value.filter(id => id !== userId)

      return true
    } catch (err: any) {
      console.error('Error unblocking user:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to unblock user'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    friendRequests,
    friends,
    blockedUsers,
    loading,
    error,
    incomingRequests,
    outgoingRequests,
    isFriend,
    isBlocked,
    hasPendingRequestFrom,
    hasPendingRequestTo,
    fetchFriendRequests,
    fetchFriends,
    fetchBlockedUsers,
    sendFriendRequest,
    respondToFriendRequest,
    unfriend,
    blockUser,
    unblockUser
  }
})
