const { model, Schema } = require("mongoose");

const commentSchema = new Schema({

    comment:  String,
    who: String,
    description: String,
    imgUrl: { type: String, default: "https://res.cloudinary.com/robcg1102/image/upload/v1602447423/Apapacho/donativo_j4cfmy.png"},
    active: {type: Boolean, default: true}, 
    donor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    owner: {
  
      type: Schema.Types.ObjectId,
  
      ref: 'User'
  
    }
  
});

const Comment = model('Comment', commentSchema);

module.exports = Comment;