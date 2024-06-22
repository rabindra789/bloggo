const { Schema, model } = require("mongoose");
const { createHmac, randomBytes } = require("crypto");
const { createTokenForUser } = require("../services/authentication");

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImageUrl: {
      type: String,
      default: "/images/default.png",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
    const user = this;
  
    if (!user.isModified("password")) return next();
  
    const salt = randomBytes(16).toString("hex");
    const hashedPassword = createHmac("sha256", salt)
      .update(user.password)
      .digest("hex");
  
    user.salt = salt;
    user.password = hashedPassword;
  
    next();
  });
  

userSchema.static("matchPasswordAndGenereteToken", async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error('User not found!');
  
    const salt = user.salt;
    const hashedPassword = user.password;
  
    const userProvidedHash = createHmac("sha256", salt)
      .update(password)  // Use the provided password here
      .digest("hex");
  
    if (hashedPassword !== userProvidedHash) throw new Error("Incorrect Password!");
  
    const token = createTokenForUser(user)
    return token
  });
  

const User = model("user", userSchema);
module.exports = User;
