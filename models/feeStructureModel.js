const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: true
  },
  className: {
    type: String
  },
  name : {
   type : String
  },
  feeType: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true
  },
  additional:{
    type: Boolean,
    required : true,
    default: false
  }
});

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
