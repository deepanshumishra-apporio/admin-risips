'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const StorageKey = 'risips.sidebar.collapsed';

type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarState>({ collapsed: false, toggle: () => {} });

export function useSidebar(): SidebarState {
  return useContext(SidebarContext);
}

/**
 * The rail's width is one number shared by the sidebar and the header block
 * above it, so it lives here and is published as a CSS variable rather than
 * threaded through both components.
 *
 * The preference is read after mount, not during render — reading storage while
 * rendering would make the server and client markup disagree.
 */
export function SidebarProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(StorageKey) === 'true');
    } catch {
      // Private browsing or blocked storage: the default width is fine.
    }
  }, []);

  const toggle = useCallback((): void => {
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(StorageKey, String(next));
      } catch {
        // Not being able to remember the choice must not break the toggle.
      }

      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div style={{ ['--shell-sidebar' as string]: collapsed ? '60px' : '252px' }}>{children}</div>
    </SidebarContext.Provider>
  );
}
