import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';

const router = Router();

// Routes for User Management
// Ideally these should be protected by Admin middleware

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
