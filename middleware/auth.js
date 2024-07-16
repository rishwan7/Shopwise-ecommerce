// middleware/checkBlockedUser.js
const {userdetails} = require('../model/userDb'); // Adjust the path to your User model

const checkBlockedUser = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await userdetails.findOne({ email });
        if (user && user.userStatus === 'block') {
            return res.status(403).json({ message: 'Your account is blocked. Please contact support.' });
        }
        next();
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = checkBlockedUser;
