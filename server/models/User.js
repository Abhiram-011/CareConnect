import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please enter your email.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address.'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please enter a password.'],
      minlength: [6, 'Password must be at least 6 characters long.']
    },
    phone: {
      type: String,
      required: [true, 'Please enter your phone number.'],
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ['donor', 'home', 'volunteer', 'admin'],
        message: '{VALUE} is not a valid role.'
      },
      default: 'donor'
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    profileImage: {
      type: String,
      default: ''
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    otpCode: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'SUSPENDED'],
        message: '{VALUE} is not a valid account status.'
      },
      default: 'ACTIVE'
    },
    suspensionReason: {
      type: String,
      trim: true,
      default: ''
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform output JSON: never return password or internal Mongoose version
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.otpCode;
  delete userObject.otpExpiresAt;
  delete userObject.__v;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
