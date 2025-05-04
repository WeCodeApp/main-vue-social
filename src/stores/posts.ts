import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import axios from 'axios'

export interface Post {
  post_id: string
  content: string
  media?: string
  author_id: string
  author_name: string
  author_avatar?: string
  created_at: Date
  updated_at?: Date
  group_id?: string
  visibility: 'public' | 'private' | 'group'
  likes_count: number
  comments_count: number
  user_likes?: string[] // Array of user IDs who liked the post
}

export interface Comment {
  comment_id: string
  post_id: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  created_at: Date
}

export const usePostsStore = defineStore('posts', () => {
  // State
  const posts = ref<Post[]>([])
  const comments = ref<Record<string, Comment[]>>({}) // Keyed by post ID
  const loading = ref(false)
  const error = ref<string | null>(null)

  // User store for authentication
  const userStore = useUserStore()

  // Getters
  const publicPosts = computed(() => 
    posts.value.filter(post => post.visibility === 'public')
  )

  const userPosts = computed(() => 
    posts.value.filter(post => post.author_id === userStore.user?.uid)
  )

  const friendPosts = computed(() => 
    posts.value.filter(post => 
      (post.visibility === 'private' && post.author_id !== userStore.user?.uid) ||
      post.visibility === 'public'
    )
  )

  const groupPosts = computed(() => (groupId: string) => 
    posts.value.filter(post => post.visibility === 'group' && post.group_id === groupId)
  )

  // Actions
  async function fetchPosts() {
    if (!userStore.accessToken && userStore.isAuthenticated) return

    loading.value = true
    error.value = null

    try {
      // Determine the endpoint based on authentication status
      const endpoint = `${import.meta.env.VITE_API_URL}/posts`

      // Set up headers with auth token if authenticated
      const headers = userStore.isAuthenticated 
        ? { Authorization: `Bearer ${userStore.accessToken}` } 
        : {}

      const response = await axios.get(endpoint, { headers })

      if (response.data.posts && Array.isArray(response.data.posts)) {
        // Transform dates from strings to Date objects
        const fetchedPosts = response.data.posts.map((post: any) => ({
          ...post,
          created_at: new Date(post.created_at),
          updated_at: post.updated_at ? new Date(post.updated_at) : undefined
        }))

        posts.value = fetchedPosts
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch posts'
    } finally {
      loading.value = false
    }
  }

  async function createPost(content: string, visibility: 'public' | 'private' | 'group', groupId?: string, media?: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to create a post'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const postData = {
        content,
        media,
        visibility,
        group_id: visibility === 'group' ? groupId : null
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, postData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Transform dates from strings to Date objects
        const newPost: Post = {
          ...response.data,
          created_at: new Date(response.data.created_at),
          updated_at: response.data.updated_at ? new Date(response.data.updated_at) : undefined
        }

        posts.value.unshift(newPost)
        return newPost
      }
      return null
    } catch (err: any) {
      console.error('Error creating post:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to create post'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updatePost(postId: string, content: string, visibility: 'public' | 'private' | 'group', groupId?: string, media?: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to update a post'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const postData = {
        content,
        media,
        visibility,
        group_id: visibility === 'group' ? groupId : null
      }

      const response = await axios.put(`${import.meta.env.VITE_API_URL}/posts/${postId}`, postData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Update local state
        const index = posts.value.findIndex(p => p.post_id === postId)
        if (index !== -1) {
          posts.value[index] = {
            ...posts.value[index],
            ...response.data,
            created_at: new Date(response.data.created_at),
            updated_at: response.data.updated_at ? new Date(response.data.updated_at) : undefined
          }
        }
        return true
      }
      return false
    } catch (err: any) {
      console.error('Error updating post:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to update post'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deletePost(postId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to delete a post'
      return false
    }

    loading.value = true
    error.value = null

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      posts.value = posts.value.filter(p => p.post_id !== postId)

      // Clean up comments
      if (comments.value[postId]) {
        delete comments.value[postId]
      }

      return true
    } catch (err: any) {
      console.error('Error deleting post:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to delete post'
      return false
    } finally {
      loading.value = false
    }
  }

  async function likePost(postId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to like a post'
      return false
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      const index = posts.value.findIndex(p => p.post_id === postId)
      if (index !== -1) {
        // Increment likes count
        posts.value[index].likes_count++

        // Add user to user_likes array if it doesn't exist
        if (!posts.value[index].user_likes) {
          posts.value[index].user_likes = []
        }

        // Only proceed if user is defined and has a uid
        const userId = userStore.user?.uid
        if (userId) {
          // Use non-null assertion since we've checked above
          const userLikes = posts.value[index].user_likes!
          if (!userLikes.includes(userId)) {
            userLikes.push(userId)
          }
        }
      }

      return true
    } catch (err: any) {
      console.error('Error liking post:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to like post'
      return false
    }
  }

  async function unlikePost(postId: string) {
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to unlike a post'
      return false
    }

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      // Update local state
      const index = posts.value.findIndex(p => p.post_id === postId)
      if (index !== -1) {
        // Decrement likes count, but ensure it doesn't go below 0
        posts.value[index].likes_count = Math.max(0, posts.value[index].likes_count - 1)

        // Remove user from user_likes array
        if (posts.value[index].user_likes && userStore.user) {
          const userId = userStore.user.uid
          // Use non-null assertion since we've checked above
          const userLikes = posts.value[index].user_likes!
          posts.value[index].user_likes = userLikes.filter(id => id !== userId)
        }
      }

      return true
    } catch (err: any) {
      console.error('Error unliking post:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to unlike post'
      return false
    }
  }

  async function fetchComments(postId: string) {
    if (!postId) return []

    loading.value = true
    error.value = null

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${postId}/comments`, {
        headers: userStore.accessToken ? { Authorization: `Bearer ${userStore.accessToken}` } : {}
      })

      if (response.data.comments && Array.isArray(response.data.comments)) {
        // Transform dates from strings to Date objects
        const fetchedComments = response.data.comments.map((comment: any) => ({
          ...comment,
          created_at: new Date(comment.created_at)
        }))

        comments.value[postId] = fetchedComments
        return fetchedComments
      }
      return []
    } catch (err: any) {
      console.error('Error fetching comments:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to fetch comments'
      return []
    } finally {
      loading.value = false
    }
  }

  async function addComment(postId: string, content: string) {
    console.log("post id", postId)
    console.log("content", content)
    if (!userStore.user || !userStore.accessToken) {
      error.value = 'You must be logged in to comment'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const commentData = {
        content
      }

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/comments`, commentData, {
        headers: { Authorization: `Bearer ${userStore.accessToken}` }
      })

      if (response.data) {
        // Transform dates from strings to Date objects
        const newComment: Comment = {
          ...response.data,
          created_at: new Date(response.data.created_at)
        }

        // Update local state
        if (!comments.value[postId]) {
          comments.value[postId] = []
        }
        comments.value[postId].push(newComment)

        // Update post comment count
        const postIndex = posts.value.findIndex(p => p.post_id === postId)
        if (postIndex !== -1) {
          posts.value[postIndex].comments_count++
        }

        return newComment
      }
      return null
    } catch (err: any) {
      console.error('Error adding comment:', err)
      error.value = err.response?.data?.message || err.message || 'Failed to add comment'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    comments,
    loading,
    error,
    publicPosts,
    userPosts,
    friendPosts,
    groupPosts,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    fetchComments,
    addComment
  }
})
