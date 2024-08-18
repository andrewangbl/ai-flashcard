
import { signInUser } from '@/lib/auth';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        const result = await signInUser(email, password);

        if (result.success) {
            res.status(200).json({ message: result.message, user: result.user });
        } else {
            res.status(401).json({ error: result.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
