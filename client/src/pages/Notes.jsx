import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  Settings,
  Search,
  Tag,
  Pin,
  Share2,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";


const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingStatus, setSavingStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest"); // newest | oldest | title
  const autosaveTimerRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false); // ✅ NEW
 
  const {userData,backenedUrl,setUserData,setIsLoggedin} = useContext(AppContext)
  // get auth token from localStorage (if you store it there)
  const token = localStorage.getItem("token");

  const axiosConfig = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  // Fetch notes on mount
  useEffect(() => {
    let cancelled = false;
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const res = await axios.get(backenedUrl + '/api/notes/getNotes', axiosConfig);
        if (!cancelled) {
          // API returns array of notes
          setNotes(Array.isArray(res.data) ? res.data : []);
          // select first note if exists
          setActiveNote(res.data && res.data.length ? res.data[0] : null);
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        // show alert or toast if you use toast
        // alert(err.response?.data?.message || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNotes();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived list: filtered + sorted
  const displayedNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = notes.filter((n) => {
      if (!q) return true;
      const title = (n.title || "").toLowerCase();
      const desc = (n.description || "").toLowerCase();
      const tags = (n.tags || []).join(" ").toLowerCase();
      return title.includes(q) || desc.includes(q) || tags.includes(q);
    });

     // ✅ First sort by pinned status
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1; // a comes first
    if (!a.pinned && b.pinned) return 1;  // b comes first
    return 0;
  });

    if (sortOption === "newest") {
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (sortOption === "oldest") {
      list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    } else if (sortOption === "title") {
      list.sort((a, b) => ((a.title || "") > (b.title || "") ? 1 : -1));
    }
    return list;
  }, [notes, searchQuery, sortOption]);

  // Create new note
  const handleCreateNote = async () => {
    try {
      setCreating(true);
      const payload = { title: "Untitled", description: "" };
      const res = await axios.post(backenedUrl + `/api/notes/createNote`, payload, axiosConfig);
      const created = res.data;
      // prepend to notes and select it
      setNotes((prev) => [created, ...prev]);
      setActiveNote(created);
    } catch (err) {
      console.error("Create note failed:", err);
      alert(err.response?.data?.message || "Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId) => {
    const ok = window.confirm("Delete this note? This moves it to trash (permanent delete depends on backend).");
    if (!ok) return;
    try {
      await axios.delete(backenedUrl + `/api/notes/deleteNote/${noteId}`, axiosConfig);
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteId));
      if ((activeNote?._id || activeNote?.id) === noteId) {
        setActiveNote(null);
      }
    } catch (err) {
      console.error("Delete note failed:", err);
      alert(err.response?.data?.message || "Failed to delete note");
    }
  };

  // Autosave (debounced): whenever activeNote changes, wait and save
  useEffect(() => {
    // don't autosave if no active note
    if (!activeNote) return;

    // clear previous timer
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    setSavingStatus("saving");
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const id = activeNote._id || activeNote.id;
        if (!id) {
          // In case server assigns id only on creation - you should create first.
          setSavingStatus("idle");
          return;
        }
        const payload = {
          title: activeNote.title,
          description: activeNote.description,
        };
        const res = await axios.put( backenedUrl + `/api/notes/updateNote/${id}`, payload, axiosConfig);
        const updated = res.data;
        // update notes array with updated note
        setNotes((prev) => prev.map((n) => ((n._id || n.id) === (updated._id || updated.id) ? updated : n)));
        setActiveNote(updated);
        setSavingStatus("saved");
        // clear saved indicator after a short time
        setTimeout(() => setSavingStatus("idle"), 1200);
      } catch (err) {
        console.error("Autosave failed:", err);
        setSavingStatus("idle");
        // optional: show alert
      }
    }, 900); // 900ms debounce
    
 


    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.title, activeNote?.description]);

  // Update local activeNote state when editing inputs
  const updateActiveField = (field, value) => {
    setActiveNote((prev) => (prev ? { ...prev, [field]: value } : prev));
    // optimistic update of notes list snippet if desired
    setNotes((prev) =>
      prev.map((n) =>
        (n._id || n.id) === (activeNote?._id || activeNote?.id) ? { ...n, [field]: value } : n
      )
    );
  };

  // Handle click on note in list
  const handleSelectNote = (note) => {
    setActiveNote(note);
  };

  // Format Date helper
  const formatDate = (iso) => {
    if (!iso) return "";
    const dt = new Date(iso);
    return dt.toLocaleString();
  };

  // Toggle Pin
const handleTogglePin = async (id) => {
  try {
    const res = await axios.put(
      backenedUrl + `/api/notes/togglePin/${id}`,
      {}, // no body needed unless your API expects one
      axiosConfig
    );

    setNotes((prev) =>
      prev.map((note) =>
        (note._id || note.id) === id ? { ...note, pinned: res.data.pinned } : note
      )
    );
  } catch (err) {
    console.error("Toggle pin failed:", err);
  }
};

 const handleLogout = async ()=>{
      try{
        axios.defaults.withCredentials =true
        const {data} =await axios.post(backenedUrl + '/api/auth/logout')
        data.success && setIsLoggedin(false)
        data.success && setUserData(false)
        navigate('/')
      }catch(error){
        toast.error(error.message)
      }
    }
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <button
            onClick={handleCreateNote}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full disabled:opacity-60"
          >
            <Plus size={18} /> {creating ? "Creating..." : "New Note"}
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded">
            <Search size={16} className="text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ul className="p-4 space-y-2 text-gray-700">
            <li className="cursor-pointer hover:bg-gray-200 p-2 rounded">📒 All Notes</li>
          
          </ul>
        </div>

         {/* ✅ Settings Dropdown */}
        <div className="p-4 border-t relative group">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <Settings size={18} /> Settings
          </button>

          {/* Dropdown menu (shows on hover) */}
          <div className="absolute bottom-12 left-4 hidden group-hover:block bg-gray-100 rounded shadow-md w-40">
            <ul className="list-none p-2 text-sm">
              {userData && (
                <li
                  onClick={handleLogout}
                  className="py-1 px-3 hover:bg-gray-200 cursor-pointer"
                >
                  Logout
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Notes</h2>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading notes...</div>
          ) : displayedNotes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No notes yet — create one.</div>
          ) : (
            displayedNotes.map((note) => {
              const nid = note._id || note.id;
              return (
                <div
                  key={nid}
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    (activeNote?._id || activeNote?.id) === nid ? "bg-blue-50" : ""
                  }`}
                >
                   <h3 className="font-semibold text-gray-900 flex justify-between items-center">
    {note.title || "Untitled"}
    {/* 📌 Pin button */}
    <button
      onClick={(e) => {
        e.stopPropagation(); // prevents selecting the note when clicking pin
       handleTogglePin(nid);
      }}
      className="ml-2 text-lg"
    >
      {note.pinned ? "📌" : "📍"}
    </button>
  </h3>
                  <p className="text-gray-600 text-sm truncate">{note.description || ""}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{formatDate(note.updatedAt)}</span>
                    {(note.tags || []).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-200 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
              );
            })
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b p-4 bg-white">
              <input
                type="text"
                value={activeNote.title || ""}
                onChange={(e) => updateActiveField("title", e.target.value)}
                placeholder="Title"
                className="text-xl font-semibold w-full outline-none"
              />
              <div className="flex items-center gap-3 text-gray-600">
               
                <button
                  onClick={() => handleDeleteNote(activeNote._id || activeNote.id)}
                  className="text-red-600"
                >
                  <Trash2 />
                </button>
               
              </div>
            </div>

            {/* Editor */}
            <textarea
              value={activeNote.description || ""}
              onChange={(e) => updateActiveField("description", e.target.value)}
              className="flex-1 p-4 outline-none resize-none bg-gray-50"
              placeholder="Start typing your note..."
            />

            <div className="flex items-center justify-between p-2 text-xs text-gray-500">
              <div>{savingStatus === "saving" ? "Saving..." : savingStatus === "saved" ? "Saved" : ""}</div>
              <div>Last edited: {formatDate(activeNote.updatedAt)}</div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            Select a note to view or edit
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
