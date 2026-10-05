const mongoose = require("mongoose");
module.exports = mongoose.model("Task", new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  contactId:{type:mongoose.Schema.Types.ObjectId,ref:"Contact",default:null},
  title:{type:String,required:true,trim:true,maxlength:180},
  type:{type:String,enum:["task","appointment"],default:"task"},
  dueDate:{type:Date,default:null},
  startDate:{type:Date,default:null},
  endDate:{type:Date,default:null},
  reminderMinutes:{type:Number,enum:[0,15,30,60,1440],default:0},
  recurrenceGroup:{type:String,trim:true,maxlength:64,default:null,index:true},
  confirmationSentAt:{type:Date,default:null},
  freeContactName:{type:String,trim:true,maxlength:140,default:""},
  freeContactEmail:{type:String,trim:true,lowercase:true,maxlength:180,default:""},
  freeContactPhone:{type:String,trim:true,maxlength:40,default:""},
  location:{type:String,trim:true,maxlength:180,default:""},
  notes:{type:String,trim:true,maxlength:1200,default:""},
  priority:{type:String,enum:["low","normal","high"],default:"normal"},
  status:{type:String,enum:["open","done"],default:"open"}
},{timestamps:true}));
