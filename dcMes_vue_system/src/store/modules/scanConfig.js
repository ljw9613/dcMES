const STORAGE_KEY = 'scan_float_config'

const defaultConfig = {
  soundEnabled: true,
  errorDisplayMode: 'auto',
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : defaultConfig.soundEnabled,
        errorDisplayMode: (parsed.errorDisplayMode === 'auto' || parsed.errorDisplayMode === 'manual')
          ? parsed.errorDisplayMode
          : defaultConfig.errorDisplayMode,
      }
    }
  } catch (e) {
    console.warn('scanConfig store: load storage failed', e)
  }
  return { ...defaultConfig }
}

function saveToStorage(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('scanConfig store: save storage failed', e)
  }
}

const state = loadFromStorage()

const mutations = {
  SET_SCAN_CONFIG(state, { soundEnabled, errorDisplayMode }) {
    if (typeof soundEnabled === 'boolean') state.soundEnabled = soundEnabled
    if (errorDisplayMode === 'auto' || errorDisplayMode === 'manual') state.errorDisplayMode = errorDisplayMode
    saveToStorage({ soundEnabled: state.soundEnabled, errorDisplayMode: state.errorDisplayMode })
  },
}

const actions = {
  setScanConfig({ commit }, config) {
    commit('SET_SCAN_CONFIG', config)
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
}
