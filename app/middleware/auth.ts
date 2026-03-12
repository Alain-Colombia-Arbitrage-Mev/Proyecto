export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !to.path.startsWith('/auth') && !to.path.startsWith('/legal')) {
    return navigateTo('/auth/login')
  }
})
