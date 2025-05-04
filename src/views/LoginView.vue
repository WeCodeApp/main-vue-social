<template>
  <div class="login-view">
    <div class="container">
      <div class="login-container">
        <Card class="login-card">
          <div class="login-header">
            <h1 class="app-title">SocialApp</h1>
            <p class="app-tagline">Connect with friends and the world around you.</p>
          </div>

          <Alert 
            v-if="error" 
            type="error" 
            :message="error" 
            dismissible 
            @close="error = ''"
            class="mb-4"
          />

          <div class="login-options">
            <Button 
              variant="primary" 
              block 
              icon="microsoft" 
              :loading="loading === 'microsoft'" 
              @click="loginWithMicrosoft"
              class="mb-3"
            >
              Continue with Microsoft
            </Button>

            <Button 
              variant="outline" 
              block 
              icon="google" 
              :loading="loading === 'google'" 
              @click="loginWithGoogle"
            >
              Continue with Google
            </Button>

            <div class="login-divider">
              <span>or</span>
            </div>

            <p class="demo-text">
              This is a demo application. You can use either Microsoft or Google authentication to log in.
            </p>
          </div>

          <div class="login-footer">
            <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>
          </div>
        </Card>

        <div class="login-info">
          <h2>Welcome to SocialApp</h2>
          <p>A social media platform where you can:</p>
          <ul>
            <li>
              <span class="mdi mdi-account-multiple"></span>
              Connect with friends and family
            </li>
            <li>
              <span class="mdi mdi-account-group"></span>
              Join groups based on your interests
            </li>
            <li>
              <span class="mdi mdi-post"></span>
              Share updates, photos, and more
            </li>
            <li>
              <span class="mdi mdi-comment-text-multiple"></span>
              Comment on and like posts
            </li>
            <li>
              <span class="mdi mdi-shield-lock"></span>
              Control your privacy with public and private posts
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Alert from '@/components/common/Alert.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// State
const loading = ref<'microsoft' | 'google' | null>(null)
const error = ref('')

// Methods
async function loginWithMicrosoft() {
  loading.value = 'microsoft'
  error.value = ''

  try {
    const user = await userStore.loginWithMicrosoft()
    if (user) {
      handleSuccessfulLogin()
    }
  } catch (err: any) {
    console.error('Microsoft login error:', err)
    error.value = err.message || 'Failed to login with Microsoft. Please try again.'
  } finally {
    loading.value = null
  }
}

async function loginWithGoogle() {
  loading.value = 'google'
  error.value = ''

  try {
    const user = await userStore.loginWithGoogle()
    if (user) {
      handleSuccessfulLogin()
    }
  } catch (err: any) {
    console.error('Google login error:', err)
    error.value = err.message || 'Failed to login with Google. Please try again.'
  } finally {
    loading.value = null
  }
}

function handleSuccessfulLogin() {
  // Redirect to the page the user was trying to access, or to home
  const redirectPath = route.query.redirect as string || '/'
  router.push(redirectPath)
}

// Check for callback parameters in URL
function handleAuthCallback() {
  const queryUser = route.query.user as string; // Get the 'user' query param as a string
  const queryToken = route.query.token as string; // Get the 'token' query param as a string

  if (queryUser && queryToken) {
    try {
      // Parse the query parameters if they are JSON strings
      const user = JSON.parse(queryUser);
      const token = JSON.parse(queryToken);

      // Pass user and token to your store's handler
      userStore.handleAuthCallback(user, token);

      handleSuccessfulLogin()
    } catch (error) {
      console.error('Failed to parse query parameters:', error);
    }

    return true
  }
  return false
}

// Check if user is already logged in or has callback parameters
onMounted(() => {
  if (!handleAuthCallback() && userStore.isAuthenticated) {
    handleSuccessfulLogin()
  }
})
</script>

<style lang="scss" scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: var(--background-color);
  padding: 2rem 0;
}

.login-container {
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 992px) {
    flex-direction: column-reverse;
  }
}

.login-card {
  flex: 1;
  max-width: 450px;
  margin: 0 auto;

  @media (max-width: 992px) {
    max-width: 100%;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.app-tagline {
  color: var(--text-light);
  font-size: 1.1rem;
}

.login-options {
  margin-bottom: 2rem;
}

.login-divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--border-color);
  }

  span {
    padding: 0 1rem;
    color: var(--text-light);
    font-size: 0.9rem;
  }
}

.demo-text {
  text-align: center;
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 0;
}

.login-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-light);

  a {
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.login-info {
  flex: 1;

  h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: var(--text-color);
  }

  p {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
    color: var(--text-color);
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 1.1rem;

      .mdi {
        color: var(--primary-color);
        font-size: 1.5rem;
        margin-right: 1rem;
      }
    }
  }

  @media (max-width: 992px) {
    text-align: center;

    ul {
      display: inline-block;
      text-align: left;
    }
  }
}
</style>
