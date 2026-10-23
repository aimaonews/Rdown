<template>
  <el-config-provider :locale="epLocale">
  <div class="app-layout">
    <!-- 左侧窄导航 -->
    <aside class="side-nav">
      <div class="nav-logo" title="Rdown">
        <img class="nav-logo-img" src="/logo.png" alt="Rdown" />
      </div>
      <nav class="nav-items">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: view === item.key }"
          :title="item.label"
          @click="view = item.key"
        >
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </nav>
      <div class="nav-footer">
        <el-tooltip :content="isDark ? t('common.toLight') : t('common.toDark')" placement="right">
          <div class="nav-item" @click="toggleTheme">
            <el-icon :size="22">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </el-icon>
          </div>
        </el-tooltip>
        <a class="nav-brand" href="https://www.aimao.today" target="_blank" rel="noopener" title="aimao.today">aimao</a>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-area">
      <header class="main-header">
        <span class="app-title">{{ viewTitle }}</span>
        <span class="conn-status" :class="connClass">
          <span class="conn-dot"></span>
          {{ connText }}
        </span>
      </header>
      <section class="main-body">
        <Tasks v-show="view === 'tasks'" />
        <Settings v-if="view === 'settings'" />
      </section>
    </main>
  </div>
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from './stores/settings'
import { useTasksStore } from './stores/tasks'
import Tasks from './views/Tasks.vue'
import Settings from './views/Settings.vue'
import { EP_LOCALES } from './i18n/element'

const { t, locale } = useI18n()

const navItems = computed(() => [
  { key: 'tasks', label: t('common.navTasks'), icon: 'Download' },
  { key: 'settings', label: t('common.navSettings'), icon: 'Setting' }
])

const view = ref('tasks')
const settingsStore = useSettingsStore()
const tasksStore = useTasksStore()

const viewTitle = computed(() => (view.value === 'tasks' ? 'Rdown' : t('common.navSettings')))
const isDark = computed(() => settingsStore.isDark)

const connClass = computed(() => (tasksStore.connected ? 'online' : 'offline'))
const connText = computed(() => (tasksStore.connected ? t('common.connected') : t('common.connecting')))

const epLocale = computed(() => EP_LOCALES[locale.value] || EP_LOCALES.en)

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  settingsStore.saveSettings({ theme: next }).catch(() => {})
}

onMounted(async () => {
  settingsStore.initThemeListener()
  settingsStore.initLocaleListener()
  try {
    await settingsStore.fetchSettings()
  } catch { /* 后端可能尚未就绪，WS 重连会兜底 */ }
  tasksStore.connect(settingsStore.settings.apiToken || '')
})

// apiToken 变化时重建 WS 连接
watch(
  () => settingsStore.settings.apiToken,
  (token) => tasksStore.reconnectWithToken(token || '')
)
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100%;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.side-nav {
  width: 72px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--kd-nav-bg);
  border-right: 1px solid var(--kd-border-secondary);
  padding: 12px 0;
}

.nav-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
}

.nav-logo-img {
  width: 44px;
  height: 44px;
  display: block;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  width: 56px;
  padding: 8px 0;
  border-radius: var(--kd-radius-icon);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  color: var(--kd-text-tertiary);
  position: relative;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--kd-hover-bg);
  color: var(--kd-text-primary);
}

/* 品牌激活态：浅底 + 主色文字 + 左侧 3px 色条 */
.nav-item.active {
  color: var(--kd-primary);
  background: var(--kd-primary-soft);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  border-radius: 0 2px 2px 0;
  background: var(--kd-primary);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

.nav-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.nav-brand {
  font-size: 11px;
  color: var(--kd-text-muted);
  text-decoration: none;
  padding: 4px 0;
  letter-spacing: 0.3px;
}
.nav-brand:hover {
  color: var(--kd-primary);
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--kd-space-6);
  border-bottom: 1px solid var(--kd-border-secondary);
}

.app-title {
  font-size: var(--kd-t1);
  font-weight: 600;
  color: var(--kd-text-primary);
  letter-spacing: -0.01em;
}

/* 连接状态 pill */
.conn-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  color: var(--kd-text-secondary);
}

.conn-status.online {
  background: var(--kd-success-soft, rgba(22, 163, 74, 0.1));
  color: var(--kd-success);
}

.conn-status.offline {
  background: var(--kd-danger-soft, rgba(239, 68, 68, 0.1));
  color: var(--kd-danger);
}

.conn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.conn-status.offline .conn-dot {
  animation: blink 1.2s infinite;
}

@keyframes blink {
  50% { opacity: 0.3; }
}

@media (prefers-reduced-motion: reduce) {
  .conn-status.offline .conn-dot { animation: none; }
}

.main-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--kd-space-5) var(--kd-space-6);
}
</style>
