const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: 'birthday'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: null
  },
  tag: {
    type: String,
    default: '',
    trim: true
  },
  emoji: {
    type: String,
    default: '🎁',
    trim: true
  },
  image: {
    type: String,
    default: '',
    trim: true
  },
  stock: {
    type: Number,
    default: 10,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryTime: {
    type: String,
    default: 'Same Day',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  includes: {
    type: [String],
    default: []
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    default: 'live',
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Product', productSchema);
