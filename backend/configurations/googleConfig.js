//backend/configurations/googleConfig
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let existingUser = await User.findOne({ googleId: profile.id });
        
        if (existingUser) {
            return done(null, existingUser);
        }
        
        // Check if user exists with same email
        existingUser = await User.findOne({ email: profile.emails[0].value });
        
        if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = profile.id;
            await existingUser.save();
            return done(null, existingUser);
        }
        
        // Create new user
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            role: 'customer',
            // No password needed for Google users
            password: 'google-oauth-user'
        });
        
        const savedUser = await newUser.save();
        done(null, savedUser);
        
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;