import { useEffect, useRef } from 'react';
import { analyticsApi } from '@/lib/api';

/**
 * Auto-tracks study sessions. Starts a session on mount,
 * ends it on unmount or tab close.
 */
export function useStudyTimer() {
  const sessionIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function startSession() {
      try {
        const res = await analyticsApi.startStudySession();
        if (mounted) {
          sessionIdRef.current = res.data.session._id;
        }
      } catch {
        // Silent fail
      }
    }

    async function endSession() {
      if (sessionIdRef.current) {
        try {
          await analyticsApi.endStudySession(sessionIdRef.current);
        } catch {
          // Silent fail
        }
        sessionIdRef.current = null;
      }
    }

    startSession();

    // End session on tab close / navigate away
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliability during page unload
        const token = localStorage.getItem('eduai_token');
        const url = (import.meta.env.VITE_API_URL || '/api') + '/analytics/study-session/end';
        navigator.sendBeacon(
          url,
          new Blob(
            [JSON.stringify({ sessionId: sessionIdRef.current })],
            { type: 'application/json' },
          ),
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, []);
}
