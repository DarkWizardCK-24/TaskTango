<div align="center">

<img src="public/logo.png" width="112" alt="Task Tango logo" />

# Task Tango

**Tasks with rhythm: a fast, beautiful to-do app that understands "Call mum tomorrow 5pm !high".**

Next.js · React · TypeScript · Tailwind CSS 4 · Firebase Auth · Firestore · Framer Motion · dnd-kit

</div>

Task Tango is a warm, focused task manager that feels like a native app on your phone and a polished workspace on your desktop. Type a task the way you would say it and dates, priorities and lists are filled in for you. Plan your day, break work into subtasks, drag things into the order you want and watch your streak grow. Use it instantly as a guest, or create a free account to keep your tasks in sync across every device in real time. Your tasks are private to you, work offline and can be installed like an app.

This is a ground-up rebuild of the original Task Tango (iTask) todo app. Tasks saved by the old version are carried over automatically the first time you open the new one.

## Screenshots

### Mobile

| Today | Dark theme | Upcoming | Lists |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/mobile-today.png" width="180" /> | <img src="docs/screenshots/mobile-today-dark.png" width="180" /> | <img src="docs/screenshots/mobile-upcoming.png" width="180" /> | <img src="docs/screenshots/mobile-lists.png" width="180" /> |

| Quick add | Edit task | Progress | Progress (dark) |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/mobile-quick-add.png" width="180" /> | <img src="docs/screenshots/mobile-edit.png" width="180" /> | <img src="docs/screenshots/mobile-stats.png" width="180" /> | <img src="docs/screenshots/mobile-stats-dark.png" width="180" /> |

| Empty state | Welcome | Sign in | Create account |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/mobile-empty.png" width="180" /> | <img src="docs/screenshots/mobile-welcome.png" width="180" /> | <img src="docs/screenshots/mobile-sign-in.png" width="180" /> | <img src="docs/screenshots/mobile-register.png" width="180" /> |

| Signed in and synced | Account settings |
| :---: | :---: |
| <img src="docs/screenshots/mobile-signed-in.png" width="180" /> | <img src="docs/screenshots/mobile-account.png" width="180" /> |

### Desktop

| | |
| :---: | :---: |
| <img src="docs/screenshots/desktop-today.png" width="420" /> | <img src="docs/screenshots/desktop-today-dark.png" width="420" /> |
| Today | Dark theme |
| <img src="docs/screenshots/desktop-quick-add.png" width="420" /> | <img src="docs/screenshots/desktop-edit.png" width="420" /> |
| Quick add with live chips | Task drawer |
| <img src="docs/screenshots/desktop-upcoming.png" width="420" /> | <img src="docs/screenshots/desktop-list.png" width="420" /> |
| Upcoming | A single list |
| <img src="docs/screenshots/desktop-stats.png" width="420" /> | <img src="docs/screenshots/desktop-shortcuts.png" width="420" /> |
| Progress | Keyboard shortcuts |
| <img src="docs/screenshots/desktop-empty.png" width="420" /> | <img src="docs/screenshots/desktop-welcome.png" width="420" /> |
| Empty state | Welcome |
| <img src="docs/screenshots/desktop-sign-in.png" width="420" /> | <img src="docs/screenshots/desktop-register.png" width="420" /> |
| Sign in | Create account |
| <img src="docs/screenshots/desktop-signed-in.png" width="420" /> | <img src="docs/screenshots/desktop-account.png" width="420" /> |
| Signed in with sync indicator | Account settings |

## Features

**Capture**
- **Natural quick add.** Type "Buy milk !high #home tomorrow at 5pm" and see the priority, list, date and time appear as chips before you save.
- **Flexible dates.** today, tomorrow, mon to sun, "in 3d", "in 2 weeks" and times like 5pm or 17:30.
- **Priorities, lists and tags.** Low, Medium and High priority with icons and labels, built-in lists for Personal, Work, Study, Health and Home, plus your own lists in a warm colour palette.
- **Subtasks.** Turn any task into a checklist with a live progress bar.
- **Notes, due dates and times** on every task.

**Plan**
- **Today, Upcoming, All and Completed views** plus a view for each list.
- **Smart sections** for Overdue, Today, Tomorrow, Later and No date, each with a count.
- **Live search** across titles, notes, tags and subtasks, and sorting by manual order, due date, priority or newest.
- **Drag and drop reordering** that works with mouse, touch and keyboard, and is remembered.
- **Edit in place.** Tasks open in a bottom sheet on phones and a side drawer on desktop, and are never deleted and re-added.

**Stay motivated**
- **Progress rings** for today and overall.
- **Streaks** for every consecutive day you finish something.
- **Weekly bar chart** of tasks completed, drawn as crisp SVG.
- **Delightful details.** A check animation with a tiny confetti burst, springy sheets and smooth list transitions that respect reduced-motion settings.

**Accounts and sync**
- **Guest mode by default.** Everything works instantly with no account, saved on your device.
- **Sign in with email and password or Google** (with password reset and a gentle strong-password nudge).
- **Real-time sync across devices.** Add, edit, complete or reorder a task on one device and it appears on the others within moments.
- **Works offline.** Changes made without a connection are kept and sync automatically when you are back online, with a clear Synced, Syncing or Offline indicator.
- **Bring your tasks along.** The first time you sign in you can move your guest tasks into your account.
- **Private to you.** Your tasks live in your own protected space that only you can read or change, and you can delete all cloud data or sign out at any time.

**Stay safe**
- **Undo for everything that matters.** Deleting, completing and clearing finished tasks can all be undone with a toast button or Ctrl/Cmd+Z, and tasks return to their original position.
- **Saved instantly on your device.** Guest tasks never leave it, and changes sync across open tabs.
- **Backup and restore.** Export to JSON, import with merge or replace, with validation that rejects bad files.
- **Reset everything** behind a clear confirmation.

**Made for phones and desktops**
- **Mobile-app feel.** Large title header, bottom tab bar, floating plus button that opens a composer sheet, swipe to complete or delete, safe-area aware.
- **Desktop workspace.** A sidebar with lists and live stats, a focused task pane and a detail drawer.
- **Keyboard first.** N or / to add, ? for help, Esc to close, Ctrl/Cmd+Z to undo, with visible focus rings throughout.
- **Light and dark themes** with a one-tap toggle, following your system by default.
- **Installable and offline.** Add it to your home screen and keep working without a connection.
- **Optional reminders.** Opt in to a browser notification shortly before a timed task is due while the tab is open.

**Design**
- **Tango identity.** Crimson to coral to tangerine gradients on warm ivory, with a warm near-black dark mode.
- **Original artwork.** Hand-drawn SVG logo, empty-state and welcome illustrations.
- **Accessible.** Labelled controls, dialog roles, live-region toasts and priorities that never rely on colour alone.

Built by DarkWizardCK
