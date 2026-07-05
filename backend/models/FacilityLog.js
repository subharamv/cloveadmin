const mongoose = require('mongoose');

const FacilityLogSchema = new mongoose.Schema({
  pillar: {
    type: String,
    required: true,
    trim: true
  },
  reviewer: {
    type: String,
    required: true,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  priorityScore: {
    type: Number,
    required: true
  },
  telemetryData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FacilityLog', FacilityLogSchema);
