
import { signUpUser } from '@/lib/auth';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        const result = await signUpUser(email, password);

        if (result.success) {
            res.status(201).json({ message: result.message });
        } else {
            res.status(500).json({ error: result.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
