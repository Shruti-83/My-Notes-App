import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    user:{type: mongoose.Schema.Types.ObjectId, 
        ref:'User',
        required:true
    },
    title:{
        type:String,
        required:true
    },  pinned: { type: Boolean, default: false }, 
    description:{
        type:String,
        default:''
    },

},{timestamps:true});

const noteModel =mongoose.model('note',noteSchema);
export default noteModel;