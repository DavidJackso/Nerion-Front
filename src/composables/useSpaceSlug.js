import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSpacesStore } from '@/stores/spaces.js'

export function useSpaceSlug() {
  const route = useRoute()
  const spacesStore = useSpacesStore()

  const slug = computed(() => route.params.slug)
  const space = computed(() => spacesStore.spaces.find(s => s.slug === slug.value))

  return { slug, space }
}
