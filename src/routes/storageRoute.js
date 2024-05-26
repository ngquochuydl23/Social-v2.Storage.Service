const express = require('express');
const router = express.Router();
const multer = require('multer');
const storageController = require('../controllers/storageController')
const fs = require('fs')
const crypto = require('crypto');
const path = require('path');
const Bucket = require("../models/bucket");
const { AppException } = require('../exceptions/AppException');


const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const bucket = await Bucket.findById(req.params.bucketId);

        if (!bucket) {
            return cb(new AppException("Bucket not found"))
        }

        const path = `./uploads/` + bucket._id + '/';
        fs.mkdirSync(path, { recursive: true });
        return cb(null, path);
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(16, (err, buf) => {
            if (err) return cb(err)

            const filename = buf.toString('hex') + path.extname(file.originalname);
            return cb(null, filename)
        })
    }
})


var upload = multer({ storage });

router.get("/bucket/:bucketId/:fileName", storageController.getFileByName);
router.post("/bucket/:bucketId/upload", [upload.any()], storageController.upload);


router.get("/bucket/:bucketId/", storageController.getFilesByBucketId);
router.put("/bucket/:bucketId/", storageController.updateBucket);
router.delete("/bucket/:bucketId/", storageController.deleteBucket);



router.post("/bucket/", storageController.createBucket);
router.get("/bucket/", storageController.getAllBucket);

module.exports = router;