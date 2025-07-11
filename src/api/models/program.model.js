import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    programManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    facilitators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    trainees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Draft", "PendingApproval", "Active", "Completed", "Rejected"],
      default: "Draft",
    },
    rejectionReason: { type: String },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    isActive: { type: Boolean, default: true }, // For soft deletes
  },
  { timestamps: true }
);

// This middleware automatically filters out "deleted" (isActive: false) programs
// for all `find` and `findOne` queries.
programSchema.pre(/^find/, function (next) {
  if (this.op === "findOne" || this.op === "find") {
    this.where({ isActive: { $ne: false } });
  }
  next();
});

export const Program = mongoose.model("Program", programSchema);
