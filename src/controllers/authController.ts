import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';

// Login with Employee Code
export const login = async (req: Request, res: Response) => {
    try {
        const { employee_code } = req.body;

        if (!employee_code) {
            return res.status(400).json({
                success: false,
                error: 'Employee code is required',
            });
        }

        // Check if user exists
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('employee_code', employee_code)
            .eq('status', 'active')
            .single();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid employee code or account inactive',
            });
        }

        // In a real app, you might issue a JWT here. 
        // For this simple internal app, returning the User object might be sufficient if trusted.
        // Ideally, we return a session token or similar.
        // For simplicity given the scope (Backend Refactor), we return the user profile.

        return res.status(200).json({
            success: true,
            message: 'Login successful',
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
