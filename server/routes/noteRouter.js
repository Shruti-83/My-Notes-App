import express from "express";
import userAuth from "../middleware/userAuth.js";
import { createNote, deleteNote, getNotes, togglePin, updateNote } from "../controllers/noteController.js";



const noteRouter = express.Router();

noteRouter.post('/createNote', userAuth,createNote)
noteRouter.get('/getNotes', userAuth,getNotes)
noteRouter.put('/updateNote/:id', userAuth,updateNote)
noteRouter.delete('/deleteNote/:id', userAuth,deleteNote)

noteRouter.put('/togglePin/:id', userAuth,togglePin)



export default noteRouter;