import { Router } from 'express';
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from '../controllers/studentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();
router.use(authenticate);
router.get('/', listStudents);
router.get('/:id', getStudent);
router.post('/', authorize('ADMINISTRATOR'), createStudent);
router.put('/:id', authorize('ADMINISTRATOR', 'LECTURER'), updateStudent);
router.delete('/:id', authorize('ADMINISTRATOR'), deleteStudent);
export default router;
