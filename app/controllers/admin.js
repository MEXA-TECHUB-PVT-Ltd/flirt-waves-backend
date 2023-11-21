const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")
const nodemailer = require('nodemailer');

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
}

const adminsignup = (req, res) => {

    const { name, email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if the email already exists in the database
    pool.query('SELECT email FROM Admin WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length > 0) {
            // Email already exists
            return res.status(400).json({ error: 'Email already registered' });
        } else {
            // Email format and password length are valid, proceed with registration
            bcrypt.hash(password, 10, (hashErr, hash) => {
                if (hashErr) {
                    console.error('Error hashing password:', hashErr);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const insertQuery = 'INSERT INTO Admin (name, email, password) VALUES ($1, $2, $3) RETURNING *';
                const values = [name, email, hash];

                pool.query(insertQuery, values, (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error during registration:', insertErr);
                        return res.status(500).json({ error: 'Internal server error' });
                    }

                    const data = result.rows[0];
                    return res.status(201).json({ message: 'Registration successful', data: data });
                });
            });
        }
    });

};

const login = (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    pool.query('SELECT * FROM Admin WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            // Email doesn't exist
            return res.status(400).json({ error: true, msg: 'Email not registered' });
        }

        // Email exists, check the password
        const user = result.rows[0];
        bcrypt.compare(password, user.password, (hashErr, passwordMatch) => {
            if (hashErr) {
                console.error('Error comparing passwords:', hashErr);
                return res.status(500).json({ error: true, msg: 'Internal server error' });
            }

            if (passwordMatch) {
                // Password matches, generate a JWT token
                const secretKey = crypto.randomBytes(32).toString('hex');
                const token = jwt.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: '1h' });

                // Include the token in the response
                return res.status(200).json({ message: 'Login successful', jwt_token: token, data: user, error: false });
            } else {
                // Password doesn't match
                return res.status(400).json({ error: 'true', msg: "Incorrect password" });
            }
        });
    });
};

const forgetpassword = async (req, res) => {

    const { email } = req.body;

    // Check if a user with the provided email exists in your database
    const userExistsQuery = 'SELECT * FROM Admin WHERE email = $1';
    const userExistsValues = [email];

    try {
        const userQueryResult = await pool.query(userExistsQuery, userExistsValues);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Admin with this email not found' });
        }

        // Generate a random 4-digit OTP composed of digits only
        const otp = getRandomDigits(4);

        // Create an email message with the OTP
        const mailOptions = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ error: false, msg: 'OTP sent successfully', userID: userQueryResult.rows[0], otp: otp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Failed to send OTP' });
    }

}

function getRandomDigits(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
    }
    return otp;
}

const transporter = nodemailer.createTransport({
    service: 'mahreentassawar@gmail.com', // e.g., 'Gmail', 'Outlook', etc.
    auth: {
        user: 'mahreentassawar@gmail.com',
        pass: 'apilqktqmvdfdryc',
    },
});

const updatePassword = (req, res) => {
    const { email, new_password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if the email exists in the database
    pool.query('SELECT id, password FROM Admin WHERE email = $1', [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Email exists, proceed to update the password
        const adminId = result.rows[0].id;

        bcrypt.hash(new_password, 10, (hashErr, hash) => {
            if (hashErr) {
                console.error('Error hashing new password:', hashErr);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Update the password in the database
            const updateQuery = 'UPDATE Admin SET password = $1 WHERE id = $2 RETURNING *';
            const values = [hash, adminId];

            pool.query(updateQuery, values, (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating password:', updateErr);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                const updatedAdmin = updateResult.rows[0];
                return res.status(200).json({ message: 'Password updated successfully', data: updatedAdmin });
            });
        });
    });
};

module.exports = { adminsignup, login, forgetpassword, updatePassword };