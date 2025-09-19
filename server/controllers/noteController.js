import noteModel from "../models/noteModel.js";
import userModel from "../models/userModel.js";

// Create note
export const createNote = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const note = new noteModel({ user: req.user.id, title, description });
    await note.save();
    res.json(note);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
}

// Get all notes for logged-in user
export const getNotes = async (req, res) => {
  try {
    const notes = await noteModel.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
}

export const updateNote =async (req, res) => {
  try {
    const { title, description } = req.body;
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

    note.title = title ?? note.title;
    note.description = description ?? note.description;
    await note.save();
    res.json(note);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
}

// Delete note
export const deleteNote = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ message: 'Unauthorized' });

     await noteModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note removed' });
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
}

// Toggle pin
export const togglePin = async (req, res) => {
  try {
    const note = await noteModel.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.pinned = !note.pinned; // ✅ Toggle
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}
