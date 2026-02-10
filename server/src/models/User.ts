import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
    name: string,
    email: string,
    password: string,
    lastSeen: Date,
    isOnline: boolean,
    resetPasswordToken?: string,
    resetPasswordExpiry?: Date
}


const userScheme = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            trim: true
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },

        isOnline: {
            type: Boolean,
            default: false,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpiry: {
            type: Date,
        }
    },
    {
        timestamps: true
    }
)


export default mongoose.model<IUser>("User", userScheme)