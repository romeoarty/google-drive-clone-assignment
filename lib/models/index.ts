import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// File Schema
const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  type: {
    type: String,
    required: [true, 'File type is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  // Support both local file paths and cloud storage
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  // Cloud storage fields
  cloudUrl: {
    type: String,
    default: null
  },
  cloudPublicId: {
    type: String,
    default: null
  },
  // Storage type: 'local' or 'cloud'
  storageType: {
    type: String,
    enum: ['local', 'cloud'],
    default: 'cloud'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Folder Schema
const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
fileSchema.index({ userId: 1, folderId: 1, isDeleted: 1 });
fileSchema.index({ name: 'text' });
folderSchema.index({ userId: 1, parentId: 1, isDeleted: 1 });
folderSchema.index({ name: 'text' });

// Virtual for file URL (if needed for preview)
fileSchema.virtual('url').get(function() {
  return `/api/files/${this._id}/download`;
});

// Virtual for folder children count
folderSchema.virtual('childrenCount', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parentId',
  count: true,
  match: { isDeleted: false }
});

folderSchema.virtual('filesCount', {
  ref: 'File',
  localField: '_id',
  foreignField: 'folderId',
  count: true,
  match: { isDeleted: false }
});

// Pre-save middleware to handle soft deletes
fileSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update.isDeleted === true && !update.deletedAt) {
    update.deletedAt = new Date();
  }
  next();
});

folderSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update.isDeleted === true && !update.deletedAt) {
    update.deletedAt = new Date();
  }
  next();
});

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const File = mongoose.models.File || mongoose.model('File', fileSchema);
export const Folder = mongoose.models.Folder || mongoose.model('Folder', folderSchema);

// Types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFile {
  _id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  mimeType: string;
  path: string;
  cloudUrl?: string;
  cloudPublicId?: string;
  storageType: 'local' | 'cloud';
  userId: string;
  folderId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export interface IFolder {
  _id: string;
  name: string;
  userId: string;
  parentId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  childrenCount?: number;
  filesCount?: number;
}