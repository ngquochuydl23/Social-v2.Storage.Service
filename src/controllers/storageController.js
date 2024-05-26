const { AppException } = require("../exceptions/AppException");
const _ = require('lodash');
const { createEncodeFileName, decodeFileParam } = require("../utils/fileName");
const fs = require('fs');
const { logger } = require("../logger");
const mongoose = require('mongoose');
const Bucket = require("../models/bucket");

exports.updateBucket = async (req, res, next) => {
    const { bucketId } = req.params;
    const { description } = req.body;

    try {
        const bucket = await Bucket.findById(bucketId);
        if (!bucket) {
            throw new AppException("Bucket not found");
        }
        bucket.description = description;
        await bucket.save();

        return res
            .status(200)
            .send({
                statusCode: 200,
                bucket
            });
    } catch (error) {
        next(error);
    }
}

exports.getAllBucket = async (req, res, next) => {
    try {
        const buckets = await Bucket.find();
        return res
            .status(200)
            .send({
                statusCode: 200,
                buckets
            });
    } catch (error) {
        next(error);
    }
}

exports.createBucket = async (req, res, next) => {
    try {
        const bucket = new Bucket({
            ...req.body,
        });
        bucket.dir = `./uploads/` + bucket._id + '/';
        await bucket.save();
        return res
            .status(201)
            .send({
                statusCode: 201,
                bucket
            });
    } catch (error) {
        next(error);
    }
}

exports.getFilesByBucketId = async (req, res, next) => {
    const { bucketId } = req.params;
    try {
        const bucket = await Bucket.findById(bucketId);
        if (!bucket) {
            throw new AppException("Bucket not found");
        }

        const gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: bucketId
        });
        const files = await gfs
            .find({}, { _id: 0 })
            .toArray();

        return res
            .status(200)
            .json({
                statusCode: 200,
                files
            })
    } catch (error) {
        next(error);
    }
}

exports.deleteBucket = async (req, res, next) => {
    const { bucketId } = req.params;
    try {
        // delete on collection
        const bucket = await Bucket.findById(bucketId);
        if (!bucket) {
            throw new AppException("Bucket not found");
        }
        bucket.isDeleted = true;
        await bucket.save();

        // remove on local
        await fs.rmSync(bucket.dir, { recursive: true, force: true });

        // delete on gridfs
        const gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: bucketId
        });

        await gfs.drop();
        return res
            .status(200)
            .send({
                statusCode: 200,
                msg: 'Bucket is deleted successfully'
            });
    } catch (error) {
        next(error);
    }
}

exports.upload = async (req, res, next) => {
    const { bucketId } = req.params;
    try {
        if (!req.files) {
            throw new AppException("No file uploaded");
        }
        const bucket = await Bucket.findById(bucketId);
        const files = await Promise.all(_.map(req.files, async (file) => {

            const buffer = fs.readFileSync(file.path);
            const gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
                bucketName: bucketId
            });

            const stream = gfs.openUploadStream(file.filename, {
                metadata: {
                    bucketId: bucketId
                }
            });

            await stream.write(buffer);
            stream.end();
            logger.info(`${file.filename} is storaged to mongodb`);
            return {
                url: '/api/bucket/' + bucket._id + '/' + createEncodeFileName(file.filename),
                mime: file.mimetype,
                bucketId: bucket._id
            }
        }));

        return res
            .status(201)
            .send({
                statusCode: 201,
                files
            });
    } catch (error) {
        next(error);
    }
}

exports.getFileByName = async (req, res, next) => {
    const { bucketId, fileName } = req.params;
    try {
        const stream = fs.createReadStream("./uploads/" + bucketId + '/' + decodeFileParam(fileName));
        // const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        //     bucketName: bucketName
        // });
        // const stream = bucket.openDownloadStreamByName(decodeFileParam(fileName));
        stream.on('error', function (err) {
            next(new AppException("File not found"));
        });
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
}
