import mongoose, { Schema, Document} from "mongoose";


export interface IGroup extends Document {
    name: string
    roomId: string
}

const groupSchema = new Schema<IGroup> (
    {
        name: {
            type: String,
            required: true
        },
        roomId: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
)


export default mongoose.model<IGroup>("Group", groupSchema)