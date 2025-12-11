import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/jwt';

// Login
export const login = async (req: Request, res: Response) => {
    try {
        const { employee_code, username, password } = req.body;

        let user;

        // Login with Employee Code (Staff)
        if (employee_code) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('employee_code', employee_code)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return res.status(401).json({ success: false, error: 'Invalid employee code or account inactive' });
            }
            user = data;
        }
        // Login with Username/Password (Admin/Staff)
        else if (username && password) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('status', 'active')
                .single();

            if (error || !data) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            if (!data.password_hash) {
                return res.status(401).json({ success: false, error: 'Account not set up for password login' });
            }

            const match = await bcrypt.compare(password, data.password_hash);
            if (!match) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            user = data;
        } else {
            return res.status(400).json({ success: false, error: 'Employee code OR Username/Password required' });
        }

        // Generate Token
        const token = signToken({
            id: user.id,
            employee_code: user.employee_code,
            role: user.role
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token, // Return the JWT
            data: {
                id: user.id,
                employee_code: user.employee_code,
                name: user.name,
                role: user.role
            },
        });

    } catch (error) {
        console.error('Error in login:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
