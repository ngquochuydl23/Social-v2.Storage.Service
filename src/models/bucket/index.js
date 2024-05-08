const mongoose = require('mongoose');
const schemeConstants = require('./schemeConstant');
const { BaseSchema, whereNotDeleted } = require('../share.model');


const BucketSchema = BaseSchema(schemeConstants.Collection, {
    bucketName: {
        type: String,
        required: [true, 'bucketName must be not null'],
    },
    description: {
        type: String,
        required: false
    },
    dir: {
        type: String,
        required: [true, 'dir must not be null']
    }
});

BucketSchema.pre('findOne', whereNotDeleted);
BucketSchema.pre('find', whereNotDeleted);

module.exports = mongoose.model(schemeConstants.Model, BucketSchema);