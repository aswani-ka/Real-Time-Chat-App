import mongoose, { Schema, Document } from "mongoose";


export interface IMessage extends Document {
    senderName: string,
    receiverName: string,
    roomId: string,
    message: string,
    status: string,
    isDeleted: boolean,
    reactions: Map<string, string>,
}


const messageScheme = new Schema<IMessage>(
    {
        senderName: {
            type: String,
            required: true,
            trim: true
        },
        receiverName: {
            type: String,
            trim: true,
            default: null
        },
        roomId: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "seen"],
            default: "sent"
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        reactions: {
            type: Map,
            of: String,  // username -> emoji
            default: {}
        },
    },
    {
        timestamps: true
    }
)


export default mongoose.model<IMessage>("Message", messageScheme)
