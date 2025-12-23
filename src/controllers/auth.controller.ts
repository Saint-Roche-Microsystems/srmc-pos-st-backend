import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { User } from '../models/index';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, passwordHash: password });
    await user.save();

    return res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET
    );

    return res.json({ 
      token,
      username: user.username,
     });
  } catch (error) {
    return res.status(500).json({ message: 'Error in login' });
  }
};