import mongoose from 'mongoose';
const { Schema } = mongoose;

const categorySchema = new Schema({
  title: {
    type: String,
    required : true
  }, // String is shorthand for {type: String}

  description: String,
  status: Boolean,
 
 
});

const Category = mongoose.model('Category', categorySchema);

export default Category
