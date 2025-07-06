const mongoose = require("mongoose");

const scholarshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: String, required: true },
  deadline: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Scholarship", scholarshipSchema);
