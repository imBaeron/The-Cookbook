import { useCallback } from 'react';
import { runPageTurn } from '../animation/pageTurnController';

// Use this instead of calling navigation.navigate/goBack directly whenever
// you want the book page-turn effect to play during that transition.
export function usePageTurnNav(navigation) {
  const push = useCallback(
    (screen, params) => {
      runPageTurn(() => navigation.navigate(screen, params));
    },
    [navigation]
  );

  const back = useCallback(() => {
    runPageTurn(() => navigation.goBack());
  }, [navigation]);

  return { push, back };
}
