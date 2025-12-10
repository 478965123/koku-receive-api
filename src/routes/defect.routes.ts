import { Router } from 'express';
import { restockDefect } from '../controllers/defectController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/:id/restock', restockDefect);

export default router;
