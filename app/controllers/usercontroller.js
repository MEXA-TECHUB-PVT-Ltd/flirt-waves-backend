const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require("../config/dbconfig")
const nodemailer = require('nodemailer');

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
            // Validate password length
            if (password.length < 6) {
                return res.status(400).json({ error: true, msg: 'Password must be at least 6 characters long' });
            }

            // Hash the password before storing it in the database
            hashedPassword = await bcrypt.hash(password, 10); // You can adjust the number of rounds for security
        } else if (signup_type === 'google' || signup_type === 'apple') {
            // For Google or Facebook signups, set password to null and use the provided token
            hashedPassword = null;
            tokenValue = token; // Use the provided token for Google or Facebook signups
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
    const { email, password } = req.body;

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

        await pool.query('UPDATE Users SET last_active = CURRENT_TIMESTAMP WHERE email = $1', [email]);

        res.status(200).json({ error: false, msg: 'Login successful', data: userData });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getallusers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    let query = `
    SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.image,
           u.device_id, u.deleted_status, u.block_status,
           g.gender AS gender_details,
           r.relation_type AS relation_type_details,
           c.cooking_skill AS cooking_skill_details,
           h.habit AS habit_details,
           e.exercise AS exercise_details,
           hb.hobby AS hobby_details,
           s.smoking_opinion AS smoking_opinion_details,
           k.kids_opinion AS kids_opinion_details,
           n.night_life AS night_life_details,
           u.interested_in, u.verified_status, u.report_status,
           u.created_at, u.updated_at
    FROM Users u
    LEFT JOIN Gender g ON u.gender::text = g.id::text
    LEFT JOIN Relationship r ON u.relation_type::text = r.id::text
    LEFT JOIN Cookingskill c ON u.cooking_skill::text = c.id::text
    LEFT JOIN Habits h ON u.habit::text = h.id::text
    LEFT JOIN Exercise e ON u.exercise::text = e.id::text
    LEFT JOIN Hobbies hb ON u.hobby::text = hb.id::text
    LEFT JOIN Smoking s ON u.smoking_opinion::text = s.id::text
    LEFT JOIN Kids k ON u.kids_opinion::text = k.id::text
    LEFT JOIN Nightlife n ON u.night_life::text = n.id::text
    WHERE u.deleted_status = false
`;

    // Check if pagination parameters are provided
    if (page && limit) {
        query += `
            OFFSET ${offset}
            LIMIT ${limit}
        `;
    }

    pool.query(query, async (err, result) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const users = result.rows;
        const processedUsers = await Promise.all(users.map(async (user) => {
            const processedUser = { ...user };

            // Modify user details to embed associated details if available
            if (user.gender_details !== null) {
                processedUser.gender_details = await fetchGenderDetails(user.gender_details);
                // Fetch other details in a similar manner
            }
            return processedUser;
        }));

        return res.status(200).json({
            msg: 'Users fetched successfully',
            error: false,
            count: processedUsers.length,
            data: processedUsers,
        });
    });
}

const getalluserbyID = async (req, res) => {
    const userId = req.params.id; // Assuming the user ID is passed as a route parameter

    let query = `
    SELECT u.id, u.name, u.email, u.password, u.token, u.signup_type, u.image,
           u.device_id, u.deleted_status, u.block_status,
           g.gender AS gender_details,
           r.relation_type AS relation_type_details,
           c.cooking_skill AS cooking_skill_details,
           h.habit AS habit_details,
           e.exercise AS exercise_details,
           hb.hobby AS hobby_details,
           s.smoking_opinion AS smoking_opinion_details,
           k.kids_opinion AS kids_opinion_details,
           n.night_life AS night_life_details,
           u.interested_in, u.verified_status, u.report_status,
           u.created_at, u.updated_at
    FROM Users u
    LEFT JOIN Gender g ON u.gender::text = g.id::text
    LEFT JOIN Relationship r ON u.relation_type::text = r.id::text
    LEFT JOIN Cookingskill c ON u.cooking_skill::text = c.id::text
    LEFT JOIN Habits h ON u.habit::text = h.id::text
    LEFT JOIN Exercise e ON u.exercise::text = e.id::text
    LEFT JOIN Hobbies hb ON u.hobby::text = hb.id::text
    LEFT JOIN Smoking s ON u.smoking_opinion::text = s.id::text
    LEFT JOIN Kids k ON u.kids_opinion::text = k.id::text
    LEFT JOIN Nightlife n ON u.night_life::text = n.id::text
    WHERE u.id = $1 AND u.deleted_status = false
    `;

    pool.query(query, [userId], async (err, result) => {
        if (err) {
            console.error('Error fetching user by ID:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found', error: true });
        }

        const user = result.rows[0];
        const processedUser = { ...user };

        // Modify user details to embed associated details if available
        if (user.gender_details !== null) {
            processedUser.gender_details = user.gender_details; // Assuming gender_details field contains the gender value directly
            // Fetch other details in a similar manner
        }

        return res.status(200).json({
            msg: 'User fetched successfully',
            error: false,
            data: processedUser,
        });
    });
}

const updateuserprofile = async (req, res) => {
    const { id } = req.params; // Assuming the user ID is passed as a parameter
    const updateData = req.body;

    try {
        // Check if the user with the provided ID exists in your database
        const userData = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        if (userData.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        const existingUser = userData.rows[0];

        // Remove email and non-existing attributes from updateData
        delete updateData.email;
        Object.keys(updateData).forEach(key => {
            if (!existingUser.hasOwnProperty(key)) {
                delete updateData[key];
            }
        });

        const updateValues = [];
        const updateColumns = [];

        // Build the update query based on provided attributes
        Object.keys(updateData).forEach((key, index) => {
            updateColumns.push(`${key} = $${index + 1}`);
            updateValues.push(updateData[key]);
        });

        if (updateValues.length > 0) {
            updateValues.push(id);

            let updateQuery = `UPDATE Users SET ${updateColumns.join(', ')} WHERE id = $${updateValues.length} RETURNING *`;

            // Perform the update operation
            const updatedUser = await pool.query(updateQuery, updateValues);

            if (updatedUser.rows.length === 0) {
                return res.status(500).json({ error: true, msg: 'Failed to update user profile' });
            }

            res.status(200).json({
                error: false,
                msg: 'User profile updated successfully',
                data: updatedUser.rows[0]
            });
        } else {
            // No attributes provided to update or non-existing attributes provided
            res.status(200).json({ error: false, msg: 'No changes made', data: existingUser });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

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

const updatepassword = async (req, res) => {
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

const deleteuser = async (req, res) => {
    const { id } = req.params; // Assuming the user ID is passed as a parameter

    try {
        // Check if the user with the provided ID exists in your database
        const user = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'User not found' });
        }

        // Update the deleted_status to true for the user
        const updateUser = await pool.query('UPDATE Users SET deleted_status = true WHERE id = $1', [id]);

        if (updateUser.rowCount === 0) {
            return res.status(500).json({ error: true, msg: 'Failed to delete user' });
        }

        // Fetch the updated user data
        const updatedUser = await pool.query('SELECT * FROM Users WHERE id = $1', [id]);

        res.status(200).json({
            error: false,
            msg: 'User deleted successfully',
            data: updatedUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
}

const getalldeletedusers = async (req, res) => {

    try {
        // Fetch users with deleted_status=true and deleted_at not null
        const fetchQuery = `
            SELECT *
            FROM Users
            WHERE deleted_status = true;
        `;

        const fetchResult = await pool.query(fetchQuery);

        const deletedUsers = fetchResult.rows;

        // Calculate the date 90 days ago from the current date
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Convert the date to a PostgreSQL timestamp format
        const formattedDate = ninetyDaysAgo.toISOString().slice(0, 19).replace("T", " ");

        // Check if any users need to be permanently deleted
        const usersToDelete = deletedUsers.filter(user => new Date(user.deleted_at) < ninetyDaysAgo);

        if (usersToDelete.length > 0) {
            // Delete users permanently
            const deleteQuery = `
                DELETE FROM Users
                WHERE id IN (${usersToDelete.map(user => user.id).join(', ')})
                RETURNING *;
            `;

            const deleteResult = await pool.query(deleteQuery);
            const permanentlyDeletedUsers = deleteResult.rows;

            return res.status(200).json({
                // permanent delete
                msg: "Deleted users fetched",
                error: false,
                count: permanentlyDeletedUsers.length,
                data: permanentlyDeletedUsers
            });
        } else {
            return res.status(200).json({
                msg: "Deleted users fetched",
                error: false,
                count: deletedUsers.length,
                data: deletedUsers
            });
        }
    } catch (error) {
        console.error('Error fetching and deleting users:', error);
        res.status(500).json({ msg: 'Internal server error', error: true });
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

const getUsersWithFilters = async (req, res) => {

    const { name } = req.body;

    try {
        const query = `
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

        const { rows } = await pool.query(query, [`%${name}%`]);

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

    try {
        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        // Query to retrieve verified users with pagination
        const verifiedUsersQuery = `
        SELECT *, COUNT(*) OVER() AS total_count
        FROM Users
        WHERE verified_status = true
        ORDER BY id
        OFFSET $1
        LIMIT $2
      `;

        const verifiedUsersResult = await pool.query(verifiedUsersQuery, [offset, limit]);
        const verifiedUsers = verifiedUsersResult.rows;

        // Extract the total count from the first row of the result
        const totalCount = verifiedUsers.length > 0 ? verifiedUsers[0].total_count : 0;

        res.status(200).json({
            error: false,
            msg: 'Verified users fetched successfully',
            count: verifiedUsers.length,
            total_count: totalCount,
            data: verifiedUsers,
        });
    } catch (error) {
        console.error('Error fetching verified users:', error);
        res.status(500).json({ error: true, msg: 'Internal Server Error' });
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
    const { page = 1, limit = 10 } = req.query;

    try {
        // Calculate the OFFSET based on the page and limit
        const offset = (page - 1) * limit;

        const query = 'SELECT * FROM users'; // Replace 'users' with your actual table name
        const result = await pool.query(`${query} WHERE deleted_status = false OFFSET ${offset} LIMIT ${limit}`);
        const allUsers = result.rows;

        // Extract gender and country values from the first user (assuming at least one user exists)
        const { gender, country, dob: referenceDOBStr } = allUsers[0];

        // Extract year from reference DOB
        const referenceYear = new Date(referenceDOBStr).getFullYear();

        // Find users whose age difference is within ±5 years
        const similarUsers = allUsers.filter(user => {
            const userYear = new Date(user.dob).getFullYear();
            const ageDifference = referenceYear - userYear;

            return !isNaN(ageDifference) && Math.abs(ageDifference) <= 5; // Check if the absolute age difference is within 5 years
        });

        if (similarUsers.length > 0) {
            return res.json({
                msg: "Profile fetched succussfully",
                error: false,
                count: similarUsers.length,
                data: similarUsers
            });
        } else {
            return res.json({
                msg: "No users found with age difference within ±5 years",
                error: false,
                count: 0,
                data: []
            });
        }
    } catch (error) {
        return res.status(500).json({
            msg: "Internal server error",
            error: true
        });
    }
}

const getrecentprofiles = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    // Get current time in UTC
    const currentTimeUTC = new Date().toISOString();

    // Calculate time 24 hours ago in UTC
    const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString();

    let query = `
        SELECT *
        FROM Users
        WHERE deleted_status = false
        AND created_at BETWEEN '${twentyFourHoursAgo}' AND '${currentTimeUTC}'
    `;

    // Check if pagination parameters are provided
    if (page && limit) {
        query += `
            OFFSET ${offset}
            LIMIT ${limit}
        `;
    }

    pool.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching users created in last 24 hours:', err);
            return res.status(500).json({ msg: 'Internal server error', error: true });
        }

        const usersInLast24Hours = result.rows;
        console.log('Users fetched in the last 24 hours:', usersInLast24Hours); // Log fetched users for debugging
        return res.status(200).json({
            msg: "Recently Added users",
            error: false,
            count: usersInLast24Hours.length,
            data: usersInLast24Hours
        });
    });
}

const getCurrentlyOnlineUsers = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Calculate the OFFSET based on the page and limit
    const offset = (page - 1) * limit;

    try {
        // Calculate the timestamp for 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Fetch users who have been active within the last 5 minutes with pagination
        const onlineUsers = await pool.query('SELECT * FROM Users WHERE last_active > $1 OFFSET $2 LIMIT $3', [
            fiveMinutesAgo,
            offset,
            limit,
        ]);

        res.status(200).json({
            error: false,
            msg: 'Online users within the last 5 minutes with pagination',
            count: onlineUsers.rows.length,
            data: onlineUsers.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const searchUserByName = async (req, res) => {
    const { name } = req.body;

    try {
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: true, msg: 'Invalid search parameter' });
        }

        // Perform a search query based on the provided name using ILIKE for pattern matching
        const users = await pool.query('SELECT * FROM Users WHERE name ILIKE $1', [`%${name}%`]);

        if (users.rows.length === 0) {
            return res.status(404).json({ error: true, msg: 'No users found with that name' });
        }

        res.status(200).json({ error: false, msg: 'Users found', data: users.rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = { usersignup, usersignin, getallusers, getalluserbyID, updateuserprofile, forgetpassword, updatepassword, deleteuser, getalldeletedusers, deleteuserpermanently, updateUserBlockStatus, getUsersWithFilters, updateUserVerifiedStatus, getVerifiedUsers, getVerifiedUserById, getDashboardprofiles, getrecentprofiles, getCurrentlyOnlineUsers, searchUserByName };