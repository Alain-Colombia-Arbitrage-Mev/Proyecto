export function useDarkMode() {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  function toggle() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }

  function set(mode: 'light' | 'dark' | 'system') {
    colorMode.preference = mode
  }

  return {
    isDark,
    preference: computed(() => colorMode.preference),
    toggle,
    set,
  }
}
