import React, { useEffect, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { FOUNDATION_SECTIONS, SECTION_IDS, errorMessage, lessonCategory, lessonFor } from '../../lib/foundationSections.mjs';

// Foundation lessons (Agent Tasks 8): one YouTube lesson per Foundation section. Each row saves to the
// training-videos store with the section's category; the section page's lesson spot shows it. With no
// lesson the section reads "Lesson coming soon".
const inputClass = 'w-full px-3 py-2 rounded-lg border border-[var(--cth-command-border)] bg-white text-sm text-[var(--cth-command-ink)] focus:outline-none focus:border-[var(--cth-command-purple)]';

const formFor = (lesson) => ({
  url: lesson?.youtube_url || '',
  title: lesson?.title || '',
  minutes: lesson?.duration_minutes ? String(lesson.duration_minutes) : '',
});

function LessonRow({ sectionId, name, lesson, onSaved }) {
  const [form, setForm] = useState(() => formFor(lesson));
  // Refill the row when the saved lesson arrives, is created or is removed (not on every keystroke).
  const lessonKey = lesson ? `${lesson.id}:${lesson.updated_at || ''}` : '';
  useEffect(() => { setForm(formFor(lesson)); }, [lessonKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const id = `lesson-${sectionId}`;

  const save = async () => {
    const url = form.url.trim(), title = form.title.trim(), minutes = form.minutes.trim();
    if (!url || !title) return setMessage({ text: 'Add the YouTube link and a title.', error: true });
    if (minutes && !(/^\d+$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 240)) {
      return setMessage({ text: 'Length is whole minutes, 1 to 240.', error: true });
    }
    const body = { youtube_url: url, title, ...(minutes ? { duration_minutes: Number(minutes) } : {}) };
    setBusy(true); setMessage({ text: '', error: false });
    try {
      if (lesson) await apiClient.patch(`/api/admin/training-videos/${lesson.id}`, body);
      else await apiClient.post('/api/admin/training-videos', { ...body, description: '', category: lessonCategory(sectionId), is_published: true });
      setMessage({ text: 'Saved. Members see it on the section page.', error: false });
      await onSaved();
    } catch (e) {
      setMessage({ text: errorMessage(e, 'The lesson could not be saved.'), error: true });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true); setMessage({ text: '', error: false });
    try {
      await apiClient.delete(`/api/admin/training-videos/${lesson.id}`);
      setMessage({ text: 'Removed. The section shows "Lesson coming soon".', error: false });
      await onSaved();
    } catch (e) {
      setMessage({ text: errorMessage(e, 'The lesson could not be removed.'), error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-[var(--cth-command-border)] bg-[var(--cth-command-ivory)] p-4" data-section={sectionId}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--cth-command-ink)]">{name}</h4>
        <span className="text-xs text-[var(--cth-command-muted)]">{lesson ? 'Lesson set' : 'Lesson coming soon'}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[2fr_2fr_1fr]">
        <label className="text-xs text-[var(--cth-command-muted)]" htmlFor={`${id}-url`}>YouTube link (unlisted is fine)
          <input id={`${id}-url`} className={inputClass} type="url" placeholder="https://youtu.be/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </label>
        <label className="text-xs text-[var(--cth-command-muted)]" htmlFor={`${id}-title`}>Title
          <input id={`${id}-title`} className={inputClass} type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="text-xs text-[var(--cth-command-muted)]" htmlFor={`${id}-minutes`}>Length (minutes)
          <input id={`${id}-minutes`} className={inputClass} type="text" inputMode="numeric" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-[var(--cth-command-purple)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Save lesson</button>
        {lesson && <button type="button" onClick={remove} disabled={busy} className="rounded-lg border border-[var(--cth-command-border)] bg-white px-4 py-2 text-sm text-[var(--cth-command-ink)] disabled:opacity-60">Remove</button>}
        {message.text && <p role={message.error ? 'alert' : 'status'} className={`text-sm ${message.error ? 'text-[var(--cth-command-crimson)]' : 'text-[var(--cth-command-muted)]'}`}>{message.text}</p>}
      </div>
    </li>
  );
}

export function AdminFoundationLessons({ trainingVideos, fetchTrainingVideos }) {
  return (
    <ol className="grid gap-3" data-testid="foundation-lessons">
      {FOUNDATION_SECTIONS.filter(([id]) => SECTION_IDS.includes(id)).map(([id, name]) => {
        const lesson = lessonFor(trainingVideos, id);
        return <LessonRow key={id} sectionId={id} name={name} lesson={lesson} onSaved={fetchTrainingVideos} />;
      })}
    </ol>
  );
}
