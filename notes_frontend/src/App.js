import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * The root of the Notes app. Manages notes, theme, and overall layout.
 * Features:
 *   - CRUD for notes
 *   - Notes sidebar list with search/filter
 *   - Edit/view notes in main area
 *   - Responsive (mobile & desktop)
 *   - Light/Dark theme toggle
 * 
 * Colors: --primary: #1976d2; --secondary: #424242; --accent: #ffca28;
 * Modern, minimalistic style
 */
function App() {
  // Note structure: { id, title, content, updated }
  const [notes, setNotes] = useState(() => {
    // Try to load from localStorage
    try {
      const loaded = JSON.parse(localStorage.getItem("notes-data") || "[]");
      return Array.isArray(loaded) ? loaded : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState(notes.length ? notes[0].id : null);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile view
  const titleInputRef = useRef(null);

  // Effect: Persist notes to localStorage
  useEffect(() => {
    localStorage.setItem("notes-data", JSON.stringify(notes));
  }, [notes]);

  // Effect: Persist theme & set CSS var
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Effect: Ensure selectedId stays valid (after delete)
  useEffect(() => {
    if (notes.length === 0) setSelectedId(null);
    else if (!notes.some(n => n.id === selectedId)) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  // PUBLIC_INTERFACE
  function createNote() {
    const newId = String(Date.now());
    const newNote = {
      id: newId,
      title: "Untitled Note",
      content: "",
      updated: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedId(newId);
    setSidebarOpen(false);
    setTimeout(() => {
      if (titleInputRef.current) titleInputRef.current.focus();
    }, 200);
  }

  // PUBLIC_INTERFACE
  function updateNote(id, upd) {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, ...upd, updated: new Date().toISOString() } : n
      )
    );
  }

  // PUBLIC_INTERFACE
  function deleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    setSidebarOpen(false);
  }

  // Sidebar search & filter
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase())
  );

  // Sort notes by updated desc
  filteredNotes.sort((a, b) => new Date(b.updated) - new Date(a.updated));

  // Selected note
  const current = notes.find((n) => n.id === selectedId);

  // Sidebar toggle (mobile)
  function handleHamburgerClick() {
    setSidebarOpen((prev) => !prev);
  }

  // Keyboard: CMD/CTRL+N for new note
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="app-root">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <button
          className="hamburger"
          aria-label="Open sidebar"
          onClick={handleHamburgerClick}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="brand">
          <span className="brand-accent" />
          <span>Notes</span>
        </span>
        <div className="top-actions">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            className="accent-btn new-btn"
            onClick={createNote}
            aria-label="Create note"
          >
            + New
          </button>
        </div>
      </nav>
      <div className="notes-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <input
              type="text"
              className="search"
              placeholder="Search notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search notes"
            />
          </div>
          <div className="notes-list" role="list">
            {filteredNotes.length === 0 && (
              <div className="empty-hint">
                <span>No notes found</span>
              </div>
            )}
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-list-item ${note.id === selectedId ? "active" : ""}`}
                onClick={() => {
                  setSelectedId(note.id);
                  setSidebarOpen(false);
                }}
                tabIndex={0}
                role="listitem"
                aria-label={`Select note: ${note.title}`}
              >
                <div className="note-title">{note.title || <em>Untitled</em>}</div>
                <div className="note-updated">
                  {new Date(note.updated).toLocaleString()}
                </div>
                <button
                  className="icon-btn delete-btn"
                  aria-label="Delete note"
                  tabIndex={-1}
                  onClick={e => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content area */}
        <main className="main-area">
          {current ? (
            <NoteEditor
              note={current}
              onChangeTitle={title => updateNote(current.id, { title })}
              onChangeContent={content => updateNote(current.id, { content })}
              onDelete={() => deleteNote(current.id)}
              titleInputRef={titleInputRef}
            />
          ) : (
            <div className="empty-hint">
              <span>No note selected</span>
            </div>
          )}
        </main>
      </div>
      <footer className="footer">
        <span>
          Keyboard: <kbd>Ctrl+N</kbd> / <kbd>⌘N</kbd> new note &mdash; Minimal Notes &copy; 2024
        </span>
      </footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * NoteEditor - edit/view a single note.
 */
function NoteEditor({ note, onChangeTitle, onChangeContent, onDelete, titleInputRef }) {
  return (
    <div className="note-editor">
      <input
        className="note-title-input"
        ref={titleInputRef}
        value={note.title}
        onChange={e => onChangeTitle(e.target.value)}
        aria-label="Note title"
        maxLength={64}
      />
      <textarea
        className="note-content-input"
        value={note.content}
        onChange={e => onChangeContent(e.target.value)}
        aria-label="Note content"
        rows={16}
      />
      <div className="editor-actions">
        <button className="danger-btn" onClick={onDelete} aria-label="Delete note">
          Delete
        </button>
      </div>
    </div>
  );
}

export default App;
