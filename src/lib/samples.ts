import { addDays, toISO } from './dates'
import { uid } from './id'
import type { NewTask } from './store'

/** A few friendly starter tasks relative to today, offered on first run. */
export function sampleTasks(now: Date): NewTask[] {
  const d = (n: number) => toISO(addDays(now, n))
  return [
    {
      title: 'Try quick add: type "Call mum tomorrow 5pm !high"',
      priority: 'high',
      due: d(0),
      listId: 'personal',
      notes: 'Dates, priority (!low !med !high), lists (#work) and tags (@idea) are picked up as you type.',
    },
    {
      title: 'Plan the week',
      priority: 'medium',
      due: d(0),
      time: '17:00',
      listId: 'work',
      subtasks: [
        { id: uid(), title: 'Review calendar', done: true },
        { id: uid(), title: 'Pick three priorities', done: false },
      ],
    },
    { title: 'Drag a card by its handle to reorder', priority: 'low', due: d(1), listId: 'home' },
    { title: 'Go for a 20 minute walk', priority: 'medium', due: d(2), listId: 'health', tags: ['habit'] },
    { title: 'Finish chapter 4 notes', priority: 'medium', due: d(4), listId: 'study' },
  ]
}
