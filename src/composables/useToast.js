import { ref } from 'vue'

export function useToast(ttl = 2600) {
  const toast = ref(null)

  function show(msg) {
    toast.value = msg
    setTimeout(() => { toast.value = null }, ttl)
  }

  return { toast, show }
}
