export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(target.isContentEditable);
}

export interface SimulationShortcutActions {
  onTogglePause?: () => void;
  onResetCamera?: () => void;
  onToggleExploded?: () => void;
  onToggleBlueprint?: () => void;
  onToggleFullscreen?: () => void;
  onEscape?: () => void;
}

export function handleSimulationKeydown(e: KeyboardEvent, actions: SimulationShortcutActions): void {
  if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.code) {
    case 'Space':
      if (actions.onTogglePause) {
        e.preventDefault();
        actions.onTogglePause();
      }
      break;
    case 'KeyR':
      actions.onResetCamera?.();
      break;
    case 'KeyE':
      actions.onToggleExploded?.();
      break;
    case 'KeyB':
      actions.onToggleBlueprint?.();
      break;
    case 'KeyF':
      actions.onToggleFullscreen?.();
      break;
    case 'Escape':
      actions.onEscape?.();
      break;
    default:
      break;
  }
}
