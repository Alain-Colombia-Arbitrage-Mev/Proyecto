<script setup lang="ts">
// Redirect to unified auth page in register mode
const route = useRoute()
const query: Record<string, string> = { mode: 'register' }
if (route.query.invite) query.invite = route.query.invite as string
if (route.query.email) query.email = route.query.email as string

await navigateTo({ path: '/auth/login', query }, { replace: true })
</script>
