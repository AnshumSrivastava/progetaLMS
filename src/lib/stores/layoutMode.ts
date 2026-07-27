/**
 * Layout mode store — controls which chrome the course layout shows.
 * Each lesson type sets its preferred mode on mount.
 *
 * 'default'  → course sidebar visible (reading / video)
 * 'exam'     → sidebar hidden, full-width exam environment (quiz/assessment)
 * 'immersive'→ sidebar hidden, full-screen (slide deck)
 */
import { writable } from 'svelte/store';

export type LayoutMode = 'default' | 'exam' | 'immersive';

export const layoutMode = writable<LayoutMode>('default');
