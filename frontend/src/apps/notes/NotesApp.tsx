import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Pin, Star, Trash2, Tag, Check, X, Clock, FileText } from 'lucide-react';
import { cn, formatRelativeTime } from '@shared/utils';
import { useWindowStore } from '@/stores/windowStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { generateId } from '@shared/constants';
import type { Note } from '@shared/types';

interface NotesAppProps {
  windowId: string;
}

const DEFAULT_NOTES: Note[] = [
  {
    id: '1', title: 'Welcome to Notes', content: '# Welcome to Notes\n\nThis is your notes application. You can:\n\n- Create and edit notes\n- Pin important notes\n- Add tags\n- Search through all notes\n\nStart writing!',
    isPinned: true, isFavorite: true, tags: ['welcome', 'getting-started'],
    createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000,
  },
  {
    id: '2', title: 'Shopping List', content: '- Milk\n- Eggs\n- Bread\n- Butter\n- Cheese\n- Apples',
    isPinned: false, isFavorite: false, tags: ['shopping', 'personal'],
    createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: '3', title: 'Project Ideas', content: '## AI Operating System\n\nBuild a browser-based OS with:\n\n- Window manager\n- File system\n- Terminal\n- AI assistant\n- Applications\n\n## Weather App\n\nUse OpenWeatherMap API.',
    isPinned: false, isFavorite: true, tags: ['ideas', 'projects'],
    createdAt: Date.now() - 86400000 * 14, updatedAt: Date.now() - 86400000 * 5,
  },
];

export function NotesApp({ windowId }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem('ai-os-notes');
      return stored ? JSON.parse(stored) : DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const { setWindowTitle } = useWindowStore();
  const { addNotification } = useNotificationStore();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    localStorage.setItem('ai-os-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (selectedNote) {
      setWindowTitle(windowId, `Notes - ${selectedNote.title}`);
    }
  }, [selectedNote, windowId, setWindowTitle]);

  const filteredNotes = notes
    .filter((n) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  const createNote = useCallback(() => {
    const newNote: Note = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      isPinned: false,
      isFavorite: false,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    addNotification({ type: 'success', title: 'Note created', message: 'New note created successfully', duration: 2000 });
  }, [addNotification]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(notes.find((n) => n.id !== id)?.id || null);
    }
    addNotification({ type: 'info', title: 'Note deleted', message: 'Note has been deleted', duration: 2000 });
  }, [selectedNoteId, notes, addNotification]);

  const togglePin = useCallback((id: string) => {
    updateNote(id, { isPinned: !notes.find((n) => n.id === id)?.isPinned });
  }, [notes, updateNote]);

  const toggleFavorite = useCallback((id: string) => {
    updateNote(id, { isFavorite: !notes.find((n) => n.id === id)?.isFavorite });
  }, [notes, updateNote]);

  const addTag = useCallback((noteId: string, tag: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note && !note.tags.includes(tag)) {
      updateNote(noteId, { tags: [...note.tags, tag] });
    }
  }, [notes, updateNote]);

  const removeTag = useCallback((noteId: string, tag: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      updateNote(noteId, { tags: note.tags.filter((t) => t !== tag) });
    }
  }, [notes, updateNote]);

  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-border bg-surface-hover flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <button
            className="p-2 rounded-lg bg-primary text-text-inverse hover:bg-primary-light transition-colors"
            onClick={createNote}
            aria-label="New note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <FileText className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm">No notes found</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all duration-100 group',
                  selectedNoteId === note.id ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-surface-hover'
                )}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {note.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                      <span className="text-sm font-medium text-text truncate">{note.title}</span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{note.content.replace(/[#*\-_`]/g, '').slice(0, 100)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 rounded hover:bg-surface-hover"
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                      aria-label={note.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={cn('w-3 h-3', note.isPinned ? 'text-primary fill-primary' : 'text-text-muted')} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-surface-hover"
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-danger" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-text-muted">{formatRelativeTime(note.updatedAt)}</span>
                  {note.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-surface-active border border-border rounded-full text-text-muted">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-[10px] text-text-muted">+{note.tags.length - 2}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote ? (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                className="flex-1 text-lg font-semibold text-text bg-transparent border-none outline-none"
                placeholder="Note title..."
              />
              <button
                className={cn('p-2 rounded-lg transition-colors', selectedNote.isFavorite ? 'text-warning' : 'text-text-muted hover:bg-surface-hover')}
                onClick={() => toggleFavorite(selectedNote.id)}
                aria-label={selectedNote.isFavorite ? 'Unfavorite' : 'Favorite'}
              >
                <Star className={cn('w-5 h-5', selectedNote.isFavorite && 'fill-current')} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
              {selectedNote.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/15 text-primary rounded-full">
                  {tag}
                  <button
                    className="hover:text-danger transition-colors"
                    onClick={() => removeTag(selectedNote.id, tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {editingTag === selectedNote.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        addTag(selectedNote.id, tagInput.trim().toLowerCase());
                        setTagInput('');
                        setEditingTag(null);
                      }
                      if (e.key === 'Escape') setEditingTag(null);
                    }}
                    className="px-2 py-1 text-xs bg-surface border border-border rounded-lg focus:outline-none focus:border-primary w-24"
                    placeholder="Tag name"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  className="flex items-center gap-1 text-xs px-2 py-1 text-text-muted hover:bg-surface-hover rounded-full transition-colors"
                  onClick={() => setEditingTag(selectedNote.id)}
                >
                  <Plus className="w-3 h-3" /> Add tag
                </button>
              )}
            </div>

            <textarea
              ref={editorRef}
              value={selectedNote.content}
              onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
              className="flex-1 p-4 bg-transparent text-text text-sm leading-relaxed resize-none focus:outline-none font-mono"
              placeholder="Start writing..."
              spellCheck={false}
            />

            <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-text-muted">
              <span>{selectedNote.content.length} characters</span>
              <span>{selectedNote.content.split(/\s+/).filter(Boolean).length} words</span>
              <span>Updated {formatRelativeTime(selectedNote.updatedAt)}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto opacity-20 mb-4" />
              <p className="text-lg font-medium text-text mb-1">No note selected</p>
              <p className="text-sm">Select a note or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}