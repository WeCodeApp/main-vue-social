<template>
  <div class="settings-view">
    <div class="container">
      <h1 class="page-title">Settings</h1>

      <div class="settings-layout">
        <!-- Settings Navigation -->
        <div class="settings-nav">
          <div class="nav-section">
            <h3 class="nav-title">User Settings</h3>
            <div class="nav-links">
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'profile' }" 
                @click="activeSection = 'profile'"
              >
                <span class="mdi mdi-account-edit"></span>
                <span>Profile</span>
              </button>
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'account' }" 
                @click="activeSection = 'account'"
              >
                <span class="mdi mdi-shield-account"></span>
                <span>Account</span>
              </button>
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'privacy' }" 
                @click="activeSection = 'privacy'"
              >
                <span class="mdi mdi-lock"></span>
                <span>Privacy</span>
              </button>
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'notifications' }" 
                @click="activeSection = 'notifications'"
              >
                <span class="mdi mdi-bell"></span>
                <span>Notifications</span>
              </button>
            </div>
          </div>

          <div class="nav-section">
            <h3 class="nav-title">App Settings</h3>
            <div class="nav-links">
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'appearance' }" 
                @click="activeSection = 'appearance'"
              >
                <span class="mdi mdi-palette"></span>
                <span>Appearance</span>
              </button>
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'language' }" 
                @click="activeSection = 'language'"
              >
                <span class="mdi mdi-translate"></span>
                <span>Language</span>
              </button>
            </div>
          </div>

          <div class="nav-section">
            <h3 class="nav-title">Other</h3>
            <div class="nav-links">
              <button 
                class="nav-link" 
                :class="{ active: activeSection === 'help' }" 
                @click="activeSection = 'help'"
              >
                <span class="mdi mdi-help-circle"></span>
                <span>Help & Support</span>
              </button>
              <button 
                class="nav-link danger" 
                @click="showLogoutConfirm = true"
              >
                <span class="mdi mdi-logout"></span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Settings Content -->
        <div class="settings-content">
          <Card>
            <!-- Profile Settings -->
            <div v-if="activeSection === 'profile'" class="settings-section">
              <h2 class="section-title">Profile Settings</h2>

              <form @submit.prevent="saveProfileSettings" class="settings-form">
                <div class="form-group">
                  <label for="display-name" class="form-label">Display Name</label>
                  <input 
                    type="text" 
                    id="display-name" 
                    v-model="profileSettings.displayName" 
                    class="form-input" 
                    placeholder="Your display name"
                  />
                </div>

                <div class="form-group">
                  <label for="bio" class="form-label">Bio</label>
                  <textarea 
                    id="bio" 
                    v-model="profileSettings.bio" 
                    class="form-input form-textarea" 
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="profile-image" class="form-label">Profile Image URL</label>
                  <input 
                    type="url" 
                    id="profile-image" 
                    v-model="profileSettings.photoURL" 
                    class="form-input" 
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div class="form-actions">
                  <Button 
                    type="submit" 
                    :loading="saving"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>

            <!-- Account Settings -->
            <div v-else-if="activeSection === 'account'" class="settings-section">
              <h2 class="section-title">Account Settings</h2>

              <div class="account-info">
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">{{ userStore.user?.email }}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">Authentication Provider</div>
                  <div class="info-value">
                    <span class="provider-badge">
                      <span class="mdi" :class="authProviderIcon"></span>
                      {{ authProviderName }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="danger-zone">
                <h3>Danger Zone</h3>
                <p>These actions are irreversible. Please proceed with caution.</p>

                <Button 
                  variant="danger" 
                  icon="delete" 
                  @click="showDeleteAccountConfirm = true"
                >
                  Delete Account
                </Button>
              </div>
            </div>

            <!-- Privacy Settings -->
            <div v-else-if="activeSection === 'privacy'" class="settings-section">
              <h2 class="section-title">Privacy Settings</h2>

              <div class="settings-options">
                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Who can see your posts by default</div>
                    <div class="option-description">This will be the default privacy setting for new posts</div>
                  </div>
                  <div class="option-control">
                    <select v-model="privacySettings.defaultPostPrivacy" class="form-select">
                      <option value="public">Everyone</option>
                      <option value="private">Friends only</option>
                    </select>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Who can send you friend requests</div>
                    <div class="option-description">Control who can send you friend requests</div>
                  </div>
                  <div class="option-control">
                    <select v-model="privacySettings.friendRequests" class="form-select">
                      <option value="everyone">Everyone</option>
                      <option value="friends-of-friends">Friends of friends</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Profile visibility</div>
                    <div class="option-description">Control who can see your profile information</div>
                  </div>
                  <div class="option-control">
                    <select v-model="privacySettings.profileVisibility" class="form-select">
                      <option value="public">Everyone</option>
                      <option value="friends">Friends only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <Button 
                  @click="savePrivacySettings" 
                  :loading="saving"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <!-- Notifications Settings -->
            <div v-else-if="activeSection === 'notifications'" class="settings-section">
              <h2 class="section-title">Notification Settings</h2>

              <div class="settings-options">
                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Friend requests</div>
                    <div class="option-description">Get notified when someone sends you a friend request</div>
                  </div>
                  <div class="option-control">
                    <label class="toggle">
                      <input type="checkbox" v-model="notificationSettings.friendRequests">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Comments on your posts</div>
                    <div class="option-description">Get notified when someone comments on your posts</div>
                  </div>
                  <div class="option-control">
                    <label class="toggle">
                      <input type="checkbox" v-model="notificationSettings.comments">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Likes on your posts</div>
                    <div class="option-description">Get notified when someone likes your posts</div>
                  </div>
                  <div class="option-control">
                    <label class="toggle">
                      <input type="checkbox" v-model="notificationSettings.likes">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Group invitations</div>
                    <div class="option-description">Get notified when you're invited to join a group</div>
                  </div>
                  <div class="option-control">
                    <label class="toggle">
                      <input type="checkbox" v-model="notificationSettings.groupInvites">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <Button 
                  @click="saveNotificationSettings" 
                  :loading="saving"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <!-- Appearance Settings -->
            <div v-else-if="activeSection === 'appearance'" class="settings-section">
              <h2 class="section-title">Appearance Settings</h2>

              <div class="settings-options">
                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Theme</div>
                    <div class="option-description">Choose your preferred theme</div>
                  </div>
                  <div class="option-control">
                    <select v-model="appearanceSettings.theme" class="form-select">
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System default</option>
                    </select>
                  </div>
                </div>

                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Font size</div>
                    <div class="option-description">Adjust the text size</div>
                  </div>
                  <div class="option-control">
                    <select v-model="appearanceSettings.fontSize" class="form-select">
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <Button 
                  @click="saveAppearanceSettings" 
                  :loading="saving"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <!-- Language Settings -->
            <div v-else-if="activeSection === 'language'" class="settings-section">
              <h2 class="section-title">Language Settings</h2>

              <div class="settings-options">
                <div class="option-item">
                  <div class="option-info">
                    <div class="option-title">Application language</div>
                    <div class="option-description">Choose your preferred language</div>
                  </div>
                  <div class="option-control">
                    <select v-model="languageSettings.language" class="form-select">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <Button 
                  @click="saveLanguageSettings" 
                  :loading="saving"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            <!-- Help & Support -->
            <div v-else-if="activeSection === 'help'" class="settings-section">
              <h2 class="section-title">Help & Support</h2>

              <div class="help-content">
                <div class="help-section">
                  <h3>Frequently Asked Questions</h3>
                  <div class="faq-item" v-for="(faq, index) in faqs" :key="index">
                    <div 
                      class="faq-question" 
                      @click="faq.open = !faq.open"
                    >
                      <span>{{ faq.question }}</span>
                      <span class="mdi" :class="faq.open ? 'mdi-chevron-up' : 'mdi-chevron-down'"></span>
                    </div>
                    <div class="faq-answer" v-if="faq.open">
                      {{ faq.answer }}
                    </div>
                  </div>
                </div>

                <div class="help-section">
                  <h3>Contact Support</h3>
                  <p>If you need further assistance, please contact our support team.</p>
                  <Button variant="outline" icon="email">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutConfirm" class="modal-overlay" @click="showLogoutConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>Logout Confirmation</h3>
        <p>Are you sure you want to logout?</p>
        <div class="modal-actions">
          <Button variant="outline" @click="showLogoutConfirm = false">Cancel</Button>
          <Button 
            variant="primary" 
            icon="logout" 
            :loading="loggingOut"
            @click="logout"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteAccountConfirm" class="modal-overlay" @click="showDeleteAccountConfirm = false">
      <div class="modal-content" @click.stop>
        <h3>Delete Account</h3>
        <p>Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.</p>
        <div class="form-group">
          <label for="confirm-delete" class="form-label">Type "DELETE" to confirm</label>
          <input 
            type="text" 
            id="confirm-delete" 
            v-model="deleteConfirmText" 
            class="form-input" 
            placeholder="DELETE"
          />
        </div>
        <div class="modal-actions">
          <Button variant="outline" @click="showDeleteAccountConfirm = false">Cancel</Button>
          <Button 
            variant="danger" 
            icon="delete" 
            :disabled="deleteConfirmText !== 'DELETE'"
            :loading="deletingAccount"
            @click="deleteAccount"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>

    <!-- Success Alert -->
    <div v-if="showSuccessAlert" class="alert-container">
      <Alert 
        type="success" 
        :message="successMessage" 
        dismissible 
        autoClose 
        @close="showSuccessAlert = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Alert from '@/components/common/Alert.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// State
const activeSection = ref('profile')
const saving = ref(false)
const loggingOut = ref(false)
const deletingAccount = ref(false)
const showLogoutConfirm = ref(false)
const showDeleteAccountConfirm = ref(false)
const showSuccessAlert = ref(false)
const successMessage = ref('')
const deleteConfirmText = ref('')

// Settings
const profileSettings = ref({
  displayName: userStore.user?.displayName || '',
  bio: '',
  photoURL: userStore.user?.photoURL || ''
})

const privacySettings = ref({
  defaultPostPrivacy: 'public',
  friendRequests: 'everyone',
  profileVisibility: 'public'
})

const notificationSettings = ref({
  friendRequests: true,
  comments: true,
  likes: true,
  groupInvites: true
})

const appearanceSettings = ref({
  theme: 'light',
  fontSize: 'medium'
})

const languageSettings = ref({
  language: 'en'
})

// FAQs
const faqs = ref([
  {
    question: 'How do I change my profile picture?',
    answer: 'You can change your profile picture in the Profile settings by providing a URL to your image.',
    open: false
  },
  {
    question: 'How do I control who sees my posts?',
    answer: 'You can set the default privacy for your posts in the Privacy settings. You can also set privacy for individual posts when creating them.',
    open: false
  },
  {
    question: 'How do I delete my account?',
    answer: 'You can delete your account in the Account settings under the Danger Zone section. This action is irreversible.',
    open: false
  },
  {
    question: 'How do I block someone?',
    answer: 'You can block someone by visiting their profile and clicking the Block button in the profile actions.',
    open: false
  },
  {
    question: 'How do I create a group?',
    answer: 'You can create a group by going to the Groups page and clicking the Create Group button.',
    open: false
  }
])

// Computed
const authProviderName = computed(() => {
  // In a real app, this would come from the user's auth provider info
  // For demo purposes, we'll just return a placeholder
  return 'Google'
})

const authProviderIcon = computed(() => {
  if (authProviderName.value === 'Google') {
    return 'mdi-google'
  } else if (authProviderName.value === 'Microsoft') {
    return 'mdi-microsoft'
  }
  return 'mdi-account'
})

// Methods
async function saveProfileSettings() {
  saving.value = true

  try {
    // In a real app, this would update the user's profile in the database
    // For demo purposes, we'll just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000))

    showSuccess('Profile settings saved successfully')
  } catch (error) {
    console.error('Error saving profile settings:', error)
  } finally {
    saving.value = false
  }
}

async function savePrivacySettings() {
  saving.value = true

  try {
    // In a real app, this would update the user's privacy settings in the database
    await new Promise(resolve => setTimeout(resolve, 1000))

    showSuccess('Privacy settings saved successfully')
  } catch (error) {
    console.error('Error saving privacy settings:', error)
  } finally {
    saving.value = false
  }
}

async function saveNotificationSettings() {
  saving.value = true

  try {
    // In a real app, this would update the user's notification settings in the database
    await new Promise(resolve => setTimeout(resolve, 1000))

    showSuccess('Notification settings saved successfully')
  } catch (error) {
    console.error('Error saving notification settings:', error)
  } finally {
    saving.value = false
  }
}

async function saveAppearanceSettings() {
  saving.value = true

  try {
    // In a real app, this would update the user's appearance settings in the database
    await new Promise(resolve => setTimeout(resolve, 1000))

    showSuccess('Appearance settings saved successfully')
  } catch (error) {
    console.error('Error saving appearance settings:', error)
  } finally {
    saving.value = false
  }
}

async function saveLanguageSettings() {
  saving.value = true

  try {
    // In a real app, this would update the user's language settings in the database
    await new Promise(resolve => setTimeout(resolve, 1000))

    showSuccess('Language settings saved successfully')
  } catch (error) {
    console.error('Error saving language settings:', error)
  } finally {
    saving.value = false
  }
}

async function logout() {
  loggingOut.value = true

  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
  } finally {
    loggingOut.value = false
    showLogoutConfirm.value = false
  }
}

async function deleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') return

  deletingAccount.value = true

  try {
    // In a real app, this would delete the user's account from the database
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Logout after account deletion
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error deleting account:', error)
  } finally {
    deletingAccount.value = false
    showDeleteAccountConfirm.value = false
  }
}

function showSuccess(message: string) {
  successMessage.value = message
  showSuccessAlert.value = true

  // Auto-hide after 3 seconds
  setTimeout(() => {
    showSuccessAlert.value = false
  }, 3000)
}
</script>

<style lang="scss" scoped>
.settings-view {
  padding: 2rem 0;
}

.page-title {
  margin-bottom: 2rem;
  font-size: 2rem;
}

.settings-layout {
  display: flex;
  gap: 2rem;

  @media (max-width: 992px) {
    flex-direction: column;
  }
}

.settings-nav {
  width: 250px;
  flex-shrink: 0;

  @media (max-width: 992px) {
    width: 100%;
  }
}

.settings-content {
  flex: 1;
}

.nav-section {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 0.75rem;
  padding-left: 0.5rem;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--text-color);
  transition: all 0.2s;

  .mdi {
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }

  &:hover {
    background-color: var(--background-color);
  }

  &.active {
    background-color: var(--primary-color);
    color: white;
  }

  &.danger {
    color: var(--danger-color);

    &:hover {
      background-color: var(--danger-color);
      color: white;
    }
  }
}

.settings-section {
  padding: 1rem;
}

.section-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

// Form styles
.settings-form {
  max-width: 600px;
}

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

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--card-color);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 2rem;
}

// Account info
.account-info {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 200px;
  font-weight: 600;
}

.provider-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background-color: var(--background-color);
  border-radius: 20px;

  .mdi {
    margin-right: 0.5rem;
  }
}

// Danger zone
.danger-zone {
  margin-top: 3rem;
  padding: 1.5rem;
  border: 1px dashed var(--danger-color);
  border-radius: var(--border-radius);

  h3 {
    color: var(--danger-color);
    margin-bottom: 0.5rem;
  }

  p {
    margin-bottom: 1.5rem;
    color: var(--text-light);
  }
}

// Settings options
.settings-options {
  margin-bottom: 2rem;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.option-info {
  flex: 1;
}

.option-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.option-description {
  font-size: 0.9rem;
  color: var(--text-light);
}

.option-control {
  width: 200px;
  text-align: right;
}

// Toggle switch
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: var(--primary-color);
    }

    &:checked + .toggle-slider:before {
      transform: translateX(26px);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: .4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
}

// Help content
.help-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.help-section {
  h3 {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1rem;
  }
}

.faq-item {
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
  background-color: var(--background-color);

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
}

.faq-answer {
  padding: 1rem;
  background-color: var(--card-color);
  border-top: 1px solid var(--border-color);
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

// Alert container
.alert-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  width: 300px;
}
</style>
