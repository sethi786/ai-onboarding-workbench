import { useWorkbenchStore } from '../store/useWorkbenchStore';
import type { Profile } from '../types';

export function useActiveProfile(): Profile | null {
  return useWorkbenchStore((s) =>
    s.activeProfileId ? s.profiles[s.activeProfileId] ?? null : null,
  );
}

export function useProfiles(): Profile[] {
  return useWorkbenchStore((s) => s.profileOrder.map((id) => s.profiles[id]).filter(Boolean));
}
