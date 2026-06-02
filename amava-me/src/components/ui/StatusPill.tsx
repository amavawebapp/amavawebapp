import { Icon } from './Icon'
export type StatusKey = 'up' | 'flat' | 'down' | 'base' | 'new'
export function StatusPill({ status }: { status: StatusKey }) {
  const map: Record<StatusKey, { cls: string; icon?: 'arrowup'; text: string }> = {
    up: { cls: 'am-tag--up', icon: 'arrowup', text: 'Improving' },
    flat: { cls: 'am-tag--flat', text: 'Steady' },
    down: { cls: 'am-tag--down', text: 'Watch' },
    base: { cls: 'am-tag--flat', text: 'Baseline done' },
    new: { cls: 'am-tag--flat', text: 'Not started' },
  }
  const m = map[status]
  return <span className={'am-tag ' + m.cls}>{m.icon && <Icon name={m.icon} size={13} stroke={2.6} />}{m.text}</span>
}
