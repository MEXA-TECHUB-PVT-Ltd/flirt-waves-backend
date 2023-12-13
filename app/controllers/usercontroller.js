const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
}

const allowedSignupTypes = ["email", "google", "facebook"];

const usersignup = async (req, res) => {
    const { name, email, password, signup_type, token, device_id } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    // Check if the email or device_id already exists in the database
    try {
        const emailExists = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: true, msg: 'Email already exists' });
        }

        // Initialize variables for password and token
        let hashedPassword = null;
        let tokenValue = null;

        // Check signup_type and handle password and token accordingly
        if (signup_type === 'email') {
            // Validate password existence and length
            if (!password || password.length < 6) {
                return res.status(400).json({ error: true, msg: 'Password must be provided and be at least 6 characters long for email signup' });
            }

            // Hash the password before storing it in the database
            hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of rounds for security

            // Check if token is provided for email signup (should be null)
            if (token) {
                return res.status(400).json({ error: true, msg: 'Token should not be provided for email signup' });
            }
        } else if (signup_type === 'google' || signup_type === 'apple') {
            // For Google or Apple signups, set password to null and use the provided token
            if (password) {
                return res.status(400).json({ error: true, msg: 'Password should not be provided for Google or Apple signup' });
            }

            // Check if token is missing for Google or Apple signup
            if (!token) {
                return res.status(400).json({ error: true, msg: 'Token must be provided for Google or Apple signup' });
            }
            tokenValue = token; // Use the provided token for Google or Apple signups
        }

        // Insert the user into the database
        const result = await pool.query(
            'INSERT INTO Users (name, email, password, signup_type, token, device_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, email, hashedPassword, signup_type, tokenValue, device_id]
        );

        const userId = result.rows[0];
        res.status(201).json({ error: false, msg: 'User signed up successfully', data: userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }

};

const usersignin = async (req, res) => {
    const { email, password, device_id } = req.body;

    // Validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: true, msg: 'Invalid email format' });
    }

    try {
        // Check if the user with the provided email exists
        const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: true, msg: 'User not found' });
        }

        const userData = user.rows[0]; // User data retrieved from the database

        // Check if the user is marked as deleted
        if (userData.deleted_status === true) {
            return res.status(401).json({ error: true, msg: 'User account has been deleted' });
        }

        if (userData.signup_type === 'email') {
            // User signed up using email, require password for login
            if (!password || typeof password !== 'string') {
                return res.status(400).json({ error: true, msg: 'Password is required for email login' });
            }

            const hashedPassword = userData.password;

            // Check if the provided password matches the hashed password in the database
            const isPasswordValid = await bcrypt.compare(password, hashedPassword);

            if (!isPasswordValid) {
                return res.status(401).json({ error: true, msg: 'Invalid password' });
            }
        } else if (userData.signup_type === 'google' || userData.signup_type === 'apple') {
            // User signed up using Google or Apple, validate token for login
            const tokenFromDB = userData.token; // Token stored in the database during signup

            if (!tokenFromDB || typeof tokenFromDB !== 'string') {
                return res.status(401).json({ error: true, msg: 'Token not found' });
            }
        }

        // Update device_id if provided during sign-in
        if (device_id && typeof device_id === 'string') {
            await pool.query('UPDATE Users SET device_id = $1, last_active = CURRENT_TIMESTAMP, online_status = true WHERE email = $2', [device_id, email]);
        } else {
            await pool.query('UPDATE Users SET last_active = CURRENT_TIMESTAMP, online_status = true WHERE email = $1', [email]);
        }

        // Fetch updated user data after the device_id update
        const updatedUser = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const updatedUserData = updatedUser.rows[0];

        res.status(200).json({ error: false, msg: 'Login successful', data: updatedUserData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }


    // const { email, password, device_id } = req.body;

    // // Validate email format
    // if (!isValidEmail(email)) {
    //     return res.status(400).json({ error: true, msg: 'Invalid email format' });
    // }

    // try {
    //     // Check if the user with the provided email exists
    //     const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

    //     if (user.rows.length === 0) {
    //         return res.status(401).json({ error: true, msg: 'User not found' });
    //     }

    //     const userData = user.rows[0]; // User data retrieved from the database

    //     if (userData.signup_type === 'email') {
    //         // User signed up using email, require password for login
    //         if (!password || typeof password !== 'string') {
    //             return res.status(400).json({ error: true, msg: 'Password is required for email login' });
    //         }

    //         const hashedPassword = userData.password;

    //         // Check if the provided password matches the hashed password in the database
    //         const isPasswordValid = await bcrypt.compare(password, hashedPassword);

    //         if (!isPasswordValid) {
    //             return res.status(401).json({ error: true, msg: 'Invalid password' });
    //         }
    //     } else if (userData.signup_type === 'google' || userData.signup_type === 'apple') {
    //         // User signed up using Google or Apple, validate token for login
    //         const tokenFromDB = userData.token; // Token stored in the database during signup

    //         if (!tokenFromDB || typeof tokenFromDB !== 'string') {
    //             return res.status(401).json({ error: true, msg: 'Token not found' });
    //         }
    //     }

    //     // Update device_id if provided during sign-in
    //     if (device_id && typeof device_id === 'string') {
    //         await pool.query('UPDATE Users SET device_id = $1, last_active = CURRENT_TIMESTAMP, online_status = true WHERE email = $2', [device_id, email]);
    //     } else {
    //         await pool.query('UPDATE Users SET last_active = CURRENT_TIMESTAMP, online_status = true WHERE email = $1', [email]);
    //     }

    //     // Fetch updated user data after the device_id update
    //     const updatedUser = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    //     const updatedUserData = updatedUser.rows[0];

    //     res.status(200).json({ error: false, msg: 'Login successful', data: updatedUserData });

    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ error: true, msg: 'Internal server error' });
    // }

};

const getallusers = async (req, res) => {

    const { page, limit } = req.query;
    let query = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.latitude, u.longitude, u.gender, u.dob, u.verified_status, u.report_status,
        u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data
        FROM Users u
        LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
        LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
        LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
        LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
        LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
        LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
        LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
        LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
        LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
        WHERE u.deleted_status = false  
        ORDER BY u.created_at DESC
    `;

    if (page && limit) {
        const offset = (page - 1) * limit;
        query += ` OFFSET ${offset} LIMIT ${limit}`;
    }

    try {
        const result = await pool.query(query);
        const users = result.rows;

        return res.status(200).json({
            msg: 'Users fetched successfully',
            error: false,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }

}

const getalluserbyID = async (req, res) => {
    const userId = req.params.id; // Assuming the user ID is passed in the request parameters

    try {
        const query = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location,u.latitude, u.longitude, u.gender, u.dob, u.verified_status, u.report_status,
        u.online_status,u.subscription_status,u.created_at, u.updated_at, u.deleted_at,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data
 FROM Users u
 LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
 LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
 LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
 LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
 LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
 LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
 LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
 LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
 LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
 WHERE u.id = $1
      `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const user = result.rows[0];
        return res.status(200).json({
            msg: 'User fetched successfully',
            error: false,
            data: user,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
}

const updateuserprofile = async (req, res) => {

    try {
        const { userid } = req.params;
        const {
            name, dob, location, latitude, longitude, height, gender, interested_in, relation_type,
            cooking_skill, habit, hobby, exercise, smoking_opinion, kids_opinion, night_life, images
        } = req.body;

        const userExists = await pool.query('SELECT * FROM Users WHERE id = $1', [userid]);

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = $' + (updateValues.length + 1));
            updateValues.push(name);
        }
        if (dob !== undefined) {
            updateFields.push('dob = $' + (updateValues.length + 1));
            updateValues.push(dob);
        }
        if (location !== undefined) {
            updateFields.push('location = $' + (updateValues.length + 1));
            updateValues.push(location);
        }
        if (latitude !== undefined) {
            updateFields.push('latitude = $' + (updateValues.length + 1));
            updateValues.push(latitude);
        }
        if (longitude !== undefined) {
            updateFields.push('longitude = $' + (updateValues.length + 1));
            updateValues.push(longitude);
        }
        if (height !== undefined) {
            updateFields.push('height = $' + (updateValues.length + 1));
            updateValues.push(height);
        }
        if (gender !== undefined) {
            updateFields.push('gender = $' + (updateValues.length + 1));
            updateValues.push(gender);
        }
        if (interested_in !== undefined) {
            updateFields.push('interested_in = $' + (updateValues.length + 1));
            updateValues.push(interested_in);
        }
        if (relation_type !== undefined) {
            updateFields.push('relation_type = $' + (updateValues.length + 1));
            updateValues.push(relation_type);
        }
        if (cooking_skill !== undefined) {
            updateFields.push('cooking_skill = $' + (updateValues.length + 1));
            updateValues.push(cooking_skill);
        }
        if (habit !== undefined) {
            updateFields.push('habit = $' + (updateValues.length + 1));
            updateValues.push(habit);
        }
        if (hobby !== undefined) {
            updateFields.push('hobby = $' + (updateValues.length + 1));
            updateValues.push(hobby);
        }
        if (exercise !== undefined) {
            updateFields.push('exercise = $' + (updateValues.length + 1));
            updateValues.push(exercise);
        }
        if (smoking_opinion !== undefined) {
            updateFields.push('smoking_opinion = $' + (updateValues.length + 1));
            updateValues.push(smoking_opinion);
        }
        if (kids_opinion !== undefined) {
            updateFields.push('kids_opinion = $' + (updateValues.length + 1));
            updateValues.push(kids_opinion);
        }
        if (night_life !== undefined) {
            updateFields.push('night_life = $' + (updateValues.length + 1));
            updateValues.push(night_life);
        }
        if (images !== undefined) {
            updateFields.push('images = $' + (updateValues.length + 1));
            updateValues.push(JSON.stringify(images));
        }

        updateValues.push(userid);

        const updateSetClause = updateFields.join(', ');

        const updateQuery = `
            UPDATE Users 
            SET ${updateSetClause}, 
                updated_at = NOW()
            WHERE id = $${updateValues.length}
            RETURNING *
        `;

        const updatedUser = await pool.query(updateQuery, updateValues);

        // Fetch associated data based on the updated user profile (unchanged)
        const query = `
            SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.dob, u.height, u.location, u.latitude, u.longitude, u.gender, u.verified_status, u.report_status,
                u.online_status,u.subscription_status,u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data
                FROM Users u
                LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
                LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
                LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
                LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
                LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
                LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
                LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
                LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
                LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
                WHERE u.id = $1
        `;

        const userData = await pool.query(query, [userid]);

        res.json({
            msg: 'User profile updated successfully',
            error: false,
            data: userData.rows[0],
        });
    } catch (error) {
        res.status(500).json({ error: true, msg: error.message });
    }
};

const imagePath = 'https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701837514/email_template_nlwqow.png';
const logo = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701863140/logo_iw9fap.png";
const twitter = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865005/twitter_fnifjv.png"
const fb = "https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865043/fb_mnkz7w.png"
const insta = " https://res.cloudinary.com/dxfdrtxi3/image/upload/v1701865074/insta_lnp7x8.png"

const forgetpassword = async (req, res) => {

    const { email } = req.body;

    // Check if a user with the provided email exists in your database
    const userExistsQuery = 'SELECT * FROM Users WHERE email = $1';
    const userExistsValues = [email];

    try {
        const userQueryResult = await pool.query(userExistsQuery, userExistsValues);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this email not found' });
        }

        // Generate a random 4-digit OTP composed of digits only
        const otp = getRandomDigits(4);

        // Create an email message with the OTP
        const mailOptions = {
            from: 'mahreentassawar@gmail.com',
            to: email,
            subject: 'Password Reset OTP',
            // text: `Your OTP for password reset is: ${otp}`,
            html: `
            <html>
            <head>
                <style>
                    /* Add your CSS styles for the email template here */
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        background-color: #FFEEB6; /* Yellow background color */
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px;
                    }
                    .logo-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        align-content:center;
                        margin-bottom: 10px;
                    }
                    .logo {
                        max-width: 50px; /* Adjust size as needed */
                        margin-right: 10px; /* Space between logo and text */
                    }
                    .flirt-waves {
                        font-size: 24px;
                        color: black;
                        margin: 0; /* Remove default margins */
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .centered-image {
                        display: inline-block;
                        margin: 0 5px; /* Adjust spacing between icons */
                        max-width: 20px; /* Adjust size as needed */
                    }
                    .otp {
                        background-color: #FFEEB6; /* Yellow background color */
                        padding: 10px;
                        width: 300px;
                        font-size: 24px;
                        text-align: center;
                        margin-top: 40px;
                        margin-bottom: 20px;
                        letter-spacing: 5px;
                        border-radius: 50px;
                        color: #F5BF03;
                    }
                    /* Add more styles as needed */
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-container">
                   
                    <img class="logo" src="${logo}" alt="Logo">
                    <p class="flirt-waves">Flirt Waves</p>
                   
                    </div>
                </div>
                <div class="container">
                    <!-- Second Image -->
                    <img src="${imagePath}" alt="Embedded Image" style="width: 150px;">
                    <!-- Rest of your email content -->
                    <p style="color: #606060; margin: 15px 0;">Great choice on joining Flirt Waves! To get the most out of your experience, please verify your email by clicking the link below:</p>
                    <strong class="otp">${otp}</strong>            
                    <p style="color: #606060; margin: 15px 0;">No worries if you didn't request this - just ignore the email, and your account <br/> will stay inactive.<br/>Looking forward to having you on board!</p>
                    <div style="text-align: center;">
                        <img src="${fb}" alt="Facebook" class="centered-image">
                        <img src="${insta}" alt="Instagram" class="centered-image">
                        <img src="${twitter}" alt="Twitter" class="centered-image">
                    </div>
                </div>
            </body>
            </html>
        `,
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

const resetpassword = async (req, res) => {
    const { email, password } = req.body;

    // Validate the new password
    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if the email exists in the database
        const userQueryResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this email not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const result = await pool.query('UPDATE Users SET password = $1 WHERE email = $2 RETURNING *', [hashedPassword, email]);

        res.status(200).json({ error: false, msg: 'Password updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const updatePassword = async (req, res) => {
    const { userId, password } = req.body;

    // Validate the new password
    if (password.length < 6) {
        return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if the user exists in the database
        const userQueryResult = await pool.query('SELECT * FROM Users WHERE id = $1', [userId]);

        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User with this ID not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const result = await pool.query('UPDATE Users SET password = $1 WHERE id = $2 RETURNING *', [hashedPassword, userId]);

        res.status(200).json({ error: false, msg: 'Password updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const deleteuser = async (req, res) => {
    const { id } = req.params; // Assuming the user ID is passed as a parameter

    try {
        // Check if the user with the provided ID exists in your database
        const user = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update deleted_status to true and set deleted_at to current timestamp for the user (soft delete)
        const updateUser = await pool.query('UPDATE Users SET deleted_status = true, deleted_at = NOW() WHERE id = $1', [id]);

        if (updateUser.rowCount === 0) {
            return res.status(500).json({ error: true, msg: 'Failed to delete user' });
        }

        res.status(200).json({
            error: false,
            msg: 'User deleted successfully',
            data: updateUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const deleteuserpermanently = async (req, res) => {
    try {
        // Extract user ID from the request or any other parameter that identifies the user
        const userId = req.params.id; // Change this based on your route

        // Query to delete the user and all associated records
        const query = `
            DELETE FROM Users
            WHERE id = $1
            RETURNING *;
        `;

        const result = await pool.query(query, [userId]);

        const deletedUser = result.rows[0]; // Assuming only one user is deleted
        if (!deletedUser) {
            return res.status(404).json({
                msg: "User not found",
                error: true,
                data: null
            });
        }

        return res.status(200).json({
            msg: "User deleted successfully",
            error: false,
            data: deletedUser
        });
    } catch (error) {
        console.error('Error deleting user and associated records:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const updateUserBlockStatus = async (req, res) => {
    const { id } = req.params;
    const { block_status } = req.body;

    try {
        // Check if the user exists
        const userExistsQuery = 'SELECT * FROM Users WHERE id = $1';
        const userExistsResult = await pool.query(userExistsQuery, [id]);

        if (userExistsResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update block_status for the user
        const updateBlockStatusQuery = 'UPDATE Users SET block_status = $1 WHERE id = $2';
        await pool.query(updateBlockStatusQuery, [block_status, id]);

        // Get updated user details
        const updatedUserQuery = 'SELECT * FROM Users WHERE id = $1';
        const updatedUserResult = await pool.query(updatedUserQuery, [id]);
        const userDetails = updatedUserResult.rows[0];

        return res.status(200).json({
            message: 'Block status updated successfully',
            error: false,
            userDetails,
        });
    } catch (error) {
        console.error('Error updating block status:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const blockUser = async (req, res) => {

    const { userId } = req.params; // ID of the user performing the block action
    const { blockuserId } = req.body; // ID of the user to be blocked

    try {
        // Check if the blocker user exists
        const blockerUserQuery = 'SELECT * FROM Users WHERE id = $1';
        const blockerUserResult = await pool.query(blockerUserQuery, [userId]);

        if (blockerUserResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Check if the user to be blocked exists
        const userToBlockQuery = 'SELECT * FROM Users WHERE id = $1';
        const userToBlockResult = await pool.query(userToBlockQuery, [blockuserId]);

        if (userToBlockResult.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User to block not found' });
        }

        // Update block_status for the user to be blocked
        const updateBlockStatusQuery = 'UPDATE Users SET block_status = $1 WHERE id = $2';
        await pool.query(updateBlockStatusQuery, [true, blockuserId]);

        // Get details of the blocked user along with additional information
        const userDetailsQuery = `
            SELECT 
                u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.height, u.location, u.latitude, u.longitude, u.gender, u.verified_status, u.report_status,
                u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data
            FROM Users u
            LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
            LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
            LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
            LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
            LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
            LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
            LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
            LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
            LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
            WHERE u.id = $1 AND u.deleted_status = false
        `;

        const userDetailsResult = await pool.query(userDetailsQuery, [blockuserId]);
        const blockedUserDetails = userDetailsResult.rows[0];

        return res.status(200).json({
            message: 'User blocked successfully',
            error: false,
            blockedUserDetails,
        });
    } catch (error) {
        console.error('Error blocking user:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getUsersWithFilters = async (req, res) => {

    const { id } = req.params;
    const { name, interested_in, relation_type, cooking_skill, exercise } = req.body;

    try {
        // Check if the user exists
        const userQuery = 'SELECT id FROM Users WHERE id = $1';
        const user = await pool.query(userQuery, [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found.' });
        }

        let query = `
        SELECT 'Gender' as table_name, id, gender as matched_field FROM Gender WHERE gender ILIKE $1
        UNION ALL
        SELECT 'Relationship' as table_name, id, relation_type as matched_field FROM Relationship WHERE relation_type ILIKE $1
        UNION ALL
        SELECT 'Cookingskill' as table_name, id, cooking_skill as matched_field FROM Cookingskill WHERE cooking_skill ILIKE $1
        UNION ALL 
        SELECT 'Habits' as table_name, id, habit as matched_field FROM Habits WHERE habit ILIKE $1
        UNION ALL
        SELECT 'Exercise' as table_name, id, exercise as matched_field FROM Exercise WHERE exercise ILIKE $1
        UNION ALL
        SELECT 'Hobbies' as table_name, id, hobby as matched_field FROM Hobbies WHERE hobby ILIKE $1
        UNION ALL
        SELECT 'Nightlife' as table_name, id, night_life as matched_field FROM Nightlife WHERE night_life ILIKE $1
        UNION ALL
        SELECT 'Kids' as table_name, id, kids_opinion as matched_field FROM Kids WHERE kids_opinion ILIKE $1
        UNION ALL
        SELECT 'Smoking' as table_name, id, smoking_opinion as matched_field FROM Smoking WHERE smoking_opinion ILIKE $1
      `;

        const queryParams = [`%${name}%`];

        if (interested_in) {
            // Add a check for interested_in against Gender table
            query += `
          UNION ALL
          SELECT 'InterestedIn' as table_name, id, gender as matched_field FROM Gender WHERE id = $${queryParams.length + 1}
        `;
            queryParams.push(interested_in);
        } if (relation_type) {
            query += `
          UNION ALL
          SELECT 'RelationType' as table_name, id, relation_type as matched_field FROM Relationship WHERE id = $${queryParams.length + 1}
        `;
            queryParams.push(relation_type);
        } if (cooking_skill) {
            query += `
          UNION ALL
          SELECT 'Cookingskill' as table_name, id, cooking_skill as matched_field FROM Cookingskill WHERE id = $${queryParams.length + 1}
        `;
            queryParams.push(cooking_skill);
        }
        if (exercise) {
            query += `
          UNION ALL
          SELECT 'Exercise' as table_name, id, exercise as matched_field FROM Exercise WHERE id = $${queryParams.length + 1}
        `;
            queryParams.push(exercise);
        }

        const { rows } = await pool.query(query, queryParams);

        if (rows.length > 0) {
            res.json({ error: false, data: rows.map(row => ({ id: row.id, value: row.matched_field })) });
        } else {
            res.status(404).json({ error: true, msg: 'No matching records found.' });
        }
    } catch (error) {
        res.status(500).json({ error: true, msg: 'Internal server error.' });
    }

};

const updateUserVerifiedStatus = async (req, res) => {
    const { id } = req.params;
    const { verified_status } = req.body;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update the verified_status for the user
        await pool.query('UPDATE Users SET verified_status = $1 WHERE id = $2 RETURNING *', [verified_status, id]);

        // Fetch updated user details
        const updatedUser = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        res.status(200).json({ error: false, msg: 'Verified status updated successfully', user: updatedUser.rows[0] });
    } catch (error) {
        console.error('Error updating verified status:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const getVerifiedUsers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { userId } = req.params;

    const offset = (page - 1) * limit;

    try {
        // Check if the provided userId exists in the Users table
        const userCheckQuery = `SELECT id FROM Users WHERE id = $1`;
        const userCheckResult = await pool.query(userCheckQuery, [userId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        let query = ` 
            SELECT *, COUNT(*) OVER() AS total_count
            FROM Users
            WHERE verified_status = true
            AND id <> $1 -- Exclude specific user
            AND block_status = false
            AND report_status = false
            AND deleted_status = false 
            ORDER BY id
            OFFSET $2
            LIMIT $3
        `;

        const result = await pool.query(query, [userId, offset, limit]);

        const users = result.rows;
        const totalCount = users.length > 0 ? users[0].total_count : 0;

        return res.status(200).json({
            msg: 'Verified users fetched successfully',
            error: false,
            count: users.length,
            total_count: totalCount,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const checkUserExists = async (userId) => {
    const client = await pool.connect();
    const query = 'SELECT * FROM Users WHERE id = $1';
    const result = await client.query(query, [userId]);
    client.release();
    return result.rows.length > 0 ? result.rows[0] : null;
};

const updateUserSubscriptionStatus = async (req, res) => {
    const userId = req.params.id;
    const subscription_status = req.body.subscription_status;
    console.log(userId, subscription_status)
    try {
        const updateQuery = 'UPDATE Users SET subscription_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
        const values = [subscription_status, userId];

        const result = await pool.query(updateQuery, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Subscription status updated successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).json({ message: 'Error updating subscription status' });
    }
};

const getAllUsersWithSubscription = async (req, res) => {
    const { page, limit } = req.query;
    let query = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
        u.deleted_status, u.block_status, u.height, u.location, u.latitude, u.longitude, u.gender, u.dob, u.verified_status, u.report_status,
        u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
        g.gender AS interested_in_data,
        r.relation_type AS relation_type_data,
        c.cooking_skill AS cooking_skill_data,
        h.habit AS habit_data,
        e.exercise AS exercise_data,
        hb.hobby AS hobby_data,
        s.smoking_opinion AS smoking_opinion_data,
        k.kids_opinion AS kids_opinion_data,
        n.night_life AS night_life_data
        FROM Users u
        LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
        LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
        LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
        LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
        LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
        LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
        LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
        LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
        LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
        WHERE u.deleted_status = false AND u.subscription_status = true
        ORDER BY u.created_at DESC
    `;

    if (page && limit) {
        const offset = (page - 1) * limit;
        query += ` OFFSET ${offset} LIMIT ${limit}`;
    }

    try {
        const result = await pool.query(query);
        const users = result.rows;

        return res.status(200).json({
            msg: 'Users with subscription status true fetched successfully',
            error: false,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users with subscription status true:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getVerifiedUserById = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if the user exists and is verified
        const verifiedUser = await pool.query('SELECT * FROM Users WHERE id = $1 AND verified_status = true', [id]);

        if (verifiedUser.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'Verified user not found or not verified' });
        }

        res.status(200).json({
            error: false,
            msg: 'Verified user fetched successfully',
            data: verifiedUser.rows[0],
        });
    } catch (error) {
        console.error('Error fetching verified user:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }
};

const getDashboardprofiles = async (req, res) => {
    const { page, limit } = req.query;

    try {
        const userId = req.params.userId; // User ID provided in route params

        if (!userId) {
            return res.status(400).json({ error: true, msg: 'User ID is missing in the parameters' });
        }

        // Fetch the user's date of birth and interested_in field
        const userResult = await pool.query('SELECT dob, interested_in, latitude, longitude FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length > 0) {
            const userDOB = userResult.rows[0].dob;
            const interested_in = userResult.rows[0].interested_in;
            const userLatitude = userResult.rows[0].latitude;
            const userLongitude = userResult.rows[0].longitude;

            if (userDOB && userLatitude !== null && userLongitude !== null) {
                // Calculate age difference (+5 years or -5 years) from the user's date of birth
                const queryDatePlus5Years = new Date(new Date(userDOB).setFullYear(new Date(userDOB).getFullYear() + 5));
                const queryDateMinus5Years = new Date(new Date(userDOB).setFullYear(new Date(userDOB).getFullYear() - 5));

                // Query to fetch users with the same interested_in and age difference of 5 years
                let similarUsersQuery = `
                    SELECT *, 
                        ( 6371 * acos( cos( radians($3) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians($4) ) + sin( radians($3) ) * sin( radians( latitude ) ) ) ) AS distance
                    FROM users
                    WHERE id != $1
                    AND interested_in = $2
                    AND dob BETWEEN $5 AND $6 
                    AND deleted_status = false
                    AND block_status = false
                    AND report_status = false
                `;

                if (page && limit) {
                    const offset = (page - 1) * limit;
                    similarUsersQuery += ` OFFSET ${offset} LIMIT ${limit}`;
                }

                const { rows: data } = await pool.query(similarUsersQuery, [userId, interested_in, userLatitude, userLongitude, queryDateMinus5Years, queryDatePlus5Years]);

                res.status(200).json({
                    msg: "users fetched",
                    error: false,
                    count: data.length,
                    data,
                });
            } else {
                res.status(404).json({ error: true, msg: 'User date of birth or coordinates are missing' });
            }
        } else {
            res.status(404).json({ error: true, msg: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getrecentprofiles = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { userId } = req.params; // Assuming the user ID is provided in the params
    const offset = (page - 1) * limit;

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Get the time 24 hours ago

        // Check if the provided userId exists in the Users table
        const userCheckQuery = 'SELECT id FROM Users WHERE id = $1';
        const userCheckResult = await pool.query(userCheckQuery, [userId]);

        if (userId && userCheckResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const query = 'SELECT * FROM Users WHERE created_at >= $1 AND id != $2 AND block_status != true OFFSET $3 LIMIT $4';
        const queryParams = [twentyFourHoursAgo, userId, offset, limit];

        const usersLast24Hours = await pool.query(query, queryParams);

        const users = usersLast24Hours.rows;
        const totalCount = users.length;

        return res.status(200).json({
            msg: 'Users signed up in the last 24 hours fetched successfully',
            error: false,
            count: totalCount,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users signed up in the last 24 hours:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
}

const getCurrentlyOnlineUsers = async (req, res) => {
    const { page, limit } = req.query;
    const { userId } = req.params; // Assuming the user ID is provided in the params

    const offset = (page - 1) * limit;

    try {
        // Check if the provided userId exists in the Users table
        const userCheckQuery = `SELECT id FROM Users WHERE id = '${userId}'`;
        const userCheckResult = await pool.query(userCheckQuery);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }
        let query = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
            u.deleted_status, u.block_status, u.height, u.location, u.gender, u.verified_status, u.report_status,
            u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
            g.gender AS interested_in_data,
            r.relation_type AS relation_type_data,
            c.cooking_skill AS cooking_skill_data,
            h.habit AS habit_data,
            e.exercise AS exercise_data,
            hb.hobby AS hobby_data,
            s.smoking_opinion AS smoking_opinion_data,
            k.kids_opinion AS kids_opinion_data,
            n.night_life AS night_life_data
        FROM Users u
        LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
        LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
        LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
        LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
        LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
        LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
        LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
        LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
        LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
        WHERE u.deleted_status = false  
            AND u.block_status = false 
            AND u.report_status = false
            AND u.online_status = true
            AND u.id != '${userId}'
    `;

        if (userId) {
            query += ` AND u.id != '${userId}'`;
        }

        if (page && limit) {
            query += `
        OFFSET ${offset}
        LIMIT ${limit}
    `;
        }

        const result = await pool.query(query);

        const users = result.rows;
        return res.status(200).json({
            msg: 'Online users fetched successfully',
            error: false,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const updateUserOnlineStatus = async (req, res) => {

    const { id } = req.params;
    const { online_status } = req.body;

    try {
        // Check if the user exists
        const userExists = await pool.query('SELECT EXISTS(SELECT 1 FROM Users WHERE id = $1)', [id]);
        if (!userExists.rows[0].exists) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update the online_status for the user
        await pool.query('UPDATE Users SET online_status = $1 WHERE id = $2', [online_status, id]);

        // Fetch updated user details
        const query = `
            SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.height, u.location, u.gender, u.verified_status, u.report_status,
                u.online_status, u.subscription_status, u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data
            FROM Users u
            LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
            LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
            LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
            LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
            LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
            LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
            LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
            LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
            LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
            WHERE u.id = $1
        `;

        const updatedUser = await pool.query(query, [id]);

        res.status(200).json({
            error: false,
            msg: 'Online status updated successfully',
            user: updatedUser.rows[0], // Sending the updated user details in the response
        });
    } catch (error) {
        console.error('Error updating online status:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
    }

};

const searchUserByName = async (req, res) => {
    const { name } = req.body;

    try {
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: true, msg: 'Invalid search parameter' });
        }

        // Perform a search query based on the provided name using ILIKE for pattern matching
        const users = await pool.query('SELECT * FROM Users WHERE name ILIKE $1 AND block_status = false', [`%${name}%`]);

        if (users.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'No users found with that name' });
        }

        res.status(200).json({ error: false, msg: 'Users found', data: users.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getAllUsersWithBlockStatusTrue = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = `
        SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.height, u.location, u.latitude, u.longitude, u.gender,u.dob, u.verified_status, u.report_status,
                u.online_status,u.subscription_status,u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data
            FROM Users u
            LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
            LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
            LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
            LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
            LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
            LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
            LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
            LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
            LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
        WHERE u.block_status = true
      `;

        if (page && limit) {
            query += `
          OFFSET ${offset}
          LIMIT ${limit}
        `;
        }

        const result = await pool.query(query);

        const users = result.rows;
        return res.status(200).json({
            msg: 'Blocked users fetched',
            error: false,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getUsersByYearAndMonth = async (req, res) => {
    try {
        const query = `
          SELECT 
            EXTRACT(YEAR FROM u.created_at) AS year,
            EXTRACT(MONTH FROM u.created_at) AS month,
            COUNT(*) AS user_count
          FROM 
            Users u
          GROUP BY 
            year, month
          ORDER BY 
            year ASC, month ASC;
        `;

        const result = await pool.query(query);

        const usersByYearAndMonth = result.rows.reduce((acc, row) => {
            const { year, month, user_count } = row;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push({ month, user_count });
            return acc;
        }, {});

        return res.status(200).json({
            msg: 'User count by year and month fetched successfully',
            error: false,
            data: usersByYearAndMonth,
        });
    } catch (error) {
        console.error('Error fetching user count by year and month:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
};

const getalldeletedusers = async (req, res) => {
    const { page, limit } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.images, u.device_id,
                u.deleted_status, u.block_status, u.height, u.location,u.gender, u.verified_status, u.report_status,
                u.online_status,u.subscription_status,u.created_at, u.updated_at, u.deleted_at,
                g.gender AS interested_in_data,
                r.relation_type AS relation_type_data,
                c.cooking_skill AS cooking_skill_data,
                h.habit AS habit_data,
                e.exercise AS exercise_data,
                hb.hobby AS hobby_data,
                s.smoking_opinion AS smoking_opinion_data,
                k.kids_opinion AS kids_opinion_data,
                n.night_life AS night_life_data,
                CASE
                    WHEN u.deleted_at IS NOT NULL THEN 
                        GREATEST(90 - EXTRACT(DAY FROM NOW() - u.deleted_at), 0)
                    ELSE
                        NULL
                END AS remaining_days
            FROM Users u
            LEFT JOIN Gender g ON u.interested_in::varchar = g.id::varchar
            LEFT JOIN Relationship r ON u.relation_type::varchar = r.id::varchar
            LEFT JOIN Cookingskill c ON u.cooking_skill::varchar = c.id::varchar
            LEFT JOIN Habits h ON u.habit::varchar = h.id::varchar
            LEFT JOIN Exercise e ON u.exercise::varchar = e.id::varchar
            LEFT JOIN Hobbies hb ON u.hobby::varchar = hb.id::varchar
            LEFT JOIN Smoking s ON u.smoking_opinion::varchar = s.id::varchar
            LEFT JOIN Kids k ON u.kids_opinion::varchar = k.id::varchar
            LEFT JOIN Nightlife n ON u.night_life::varchar = n.id::varchar
            WHERE u.deleted_status = true -- Fetch only users where deleted_status is true
        `;

        if (page && limit) {
            query += `
                OFFSET ${offset}
                LIMIT ${limit}
            `;
        }

        const result = await pool.query(query);

        const users = result.rows;
        return res.status(200).json({
            msg: 'Deleted users fetched successfully',
            error: false,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching deleted users:', error);
        return res.status(500).json({ msg: 'Internal server error', error: true });
    }
}

module.exports = { updateUserOnlineStatus, getalldeletedusers, getUsersByYearAndMonth, usersignup, usersignin, getallusers, getalluserbyID, updateuserprofile, forgetpassword, resetpassword, updatePassword, deleteuser, deleteuserpermanently, updateUserBlockStatus, getUsersWithFilters, updateUserVerifiedStatus, updateUserSubscriptionStatus, getAllUsersWithSubscription, getVerifiedUsers, getVerifiedUserById, getDashboardprofiles, getrecentprofiles, getCurrentlyOnlineUsers, searchUserByName, getAllUsersWithBlockStatusTrue, blockUser };