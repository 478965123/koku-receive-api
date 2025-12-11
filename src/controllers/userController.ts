import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Get all users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { role } = req.query;
        let query = supabase.from('users').select('*').order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        const { data: users, error } = await query;

        if (error) {
            console.error("Error fetching users (Full):", JSON.stringify(error, null, 2));
            return res.status(500).json({ success: false, error: 'Failed to fetch users', details: error });
        }

        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error in getUsers:", error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
    try {
        console.log("Create User Endpoint Hit with body:", req.body);
        const { employee_code, name, phone, role, username, password } = req.body;

        // Validations
        if (!employee_code || !name) {
            return res.status(400).json({ success: false, error: 'Employee code and name are required' });
        }

        let password_hash = null;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            password_hash = await bcrypt.hash(password, salt);
        }

        const { data, error } = await supabase
            .from('users')
            .insert({
                employee_code,
                name,
                phone: phone || '',
                role: role || 'staff',
                username,
                password_hash,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Error during User Insert:", JSON.stringify(error, null, 2));
            return res.status(500).json({
                success: false,
                error: 'Failed to create user',
                details: error // Return error to client for easier debugging
            });
        }

        return res.status(201).json({
            success: true,
            data,
            message: 'User created successfully',
        });

    } catch (error) {
        console.error('Error in createUser:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, role, status, username, password } = req.body;

        const updates: any = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (role) updates.role = role;
        if (status) updates.status = status;
        if (username !== undefined) updates.username = username || null;

        if (password) {
            updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({ success: false, error: 'Failed to update user' });
        }

        return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("Error in updateUser:", error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const { error } = await supabase.from('users').delete().eq('id', id);

        if (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({ success: false, error: 'Failed to delete user' });
        }

        return res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error("Error in deleteUser:", error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
