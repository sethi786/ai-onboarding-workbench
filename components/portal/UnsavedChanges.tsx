'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';

const DirtyContext = createContext<{
  register: (id: string, dirty: boolean) => void;
  confirmNavigation: () => boolean;
}>({
  register: (_id: string, _dirty: boolean) => {},
  confirmNavigation: () => true,
});

export function UnsavedChanges({ children }: { children: React.ReactNode }) {
  const dirtyForms = useRef(new Set<string>());
  const register = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyForms.current.add(id);
    else dirtyForms.current.delete(id);
  }, []);
  const confirmNavigation = useCallback(
    () =>
      !dirtyForms.current.size ||
      window.confirm(
        'You have unsaved changes. Leave this page and discard them?',
      ),
    [],
  );
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyForms.current.size) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download'))
        return;
      const target = new URL(link.href, window.location.href);
      // Full document navigation has the browser's beforeunload protection.
      if (
        target.origin !== window.location.origin ||
        (target.pathname === window.location.pathname &&
          target.search === window.location.search)
      )
        return;
      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', click, true);
    };
  }, [confirmNavigation]);
  return (
    <DirtyContext.Provider value={{ register, confirmNavigation }}>
      {children}
    </DirtyContext.Provider>
  );
}

export function useDirtyForm(dirty: boolean) {
  const id = useId();
  const { register } = useContext(DirtyContext);
  useEffect(() => {
    register(id, dirty);
    return () => register(id, false);
  }, [id, dirty, register]);
}

export function useConfirmNavigation() {
  return useContext(DirtyContext).confirmNavigation;
}
