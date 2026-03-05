import { BrowserProvider } from 'ethers'

export function useWeb3Auth() {
  const supabase = useSupabaseClient()
  const loading = ref(false)
  const error = ref('')

  function hasWallet(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum
  }

  async function signInWithWallet() {
    if (!hasWallet()) {
      throw new Error('No se detectó wallet. Instala MetaMask u otra wallet compatible.')
    }

    loading.value = true
    error.value = ''

    try {
      const ethereum = (window as any).ethereum
      const provider = new BrowserProvider(ethereum)

      // Request account access
      const accounts = await provider.send('eth_requestAccounts', [])
      if (!accounts || accounts.length === 0) {
        throw new Error('No se pudo conectar la wallet')
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Create SIWE-style message with nonce
      const nonce = Date.now()
      const message = [
        'FocusFlow - Sign In with Wallet',
        '',
        `Address: ${address}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      // Request signature from user
      const signature = await signer.signMessage(message)

      // Verify on backend and get session
      const result = await $fetch<any>('/api/auth/wallet', {
        method: 'POST',
        body: { address, signature, message },
      })

      // Use the verification URL to complete auth
      if (result.verificationUrl) {
        // Extract token from verification URL and verify with Supabase
        const url = new URL(result.verificationUrl)
        const token = url.searchParams.get('token')
        const type = url.searchParams.get('type') || 'magiclink'

        if (token) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: result.tokenHash,
            type: type as any,
          })
          if (verifyErr) throw verifyErr
        }
      }

      return { address: result.walletAddress, email: result.email }
    } catch (e: any) {
      error.value = e.message || 'Error connecting wallet'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    hasWallet,
    signInWithWallet,
    loading,
    error,
  }
}
