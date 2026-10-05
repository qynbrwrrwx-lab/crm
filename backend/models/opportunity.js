const mongoose=require("mongoose");
module.exports=mongoose.model("Opportunity",new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  contactId:{type:mongoose.Schema.Types.ObjectId,ref:"Contact",default:null},
  title:{type:String,required:true,trim:true,maxlength:180},
  amount:{type:Number,min:0,default:0},
  probability:{type:Number,min:0,max:100,default:20},
  source:{type:String,trim:true,maxlength:80,default:"manual"},
  stage:{type:String,enum:["lead","qualified","proposal","won","lost"],default:"lead"},
  lostReason:{type:String,trim:true,maxlength:100,default:""},
  expectedCloseDate:{type:Date,default:null},
  notes:{type:String,trim:true,maxlength:1200,default:""}
},{timestamps:true}));
