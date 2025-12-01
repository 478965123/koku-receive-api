import { Router } from 'express';
import multer from 'multer';
import { createReceipt, getReceipts } from '../controllers/receiptController';
import { uploadPhoto } from '../controllers/photoController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes
router.post('/create', createReceipt);
router.get('/list', getReceipts);
router.post('/upload-photo', upload.single('photo'), uploadPhoto);

export default router;
