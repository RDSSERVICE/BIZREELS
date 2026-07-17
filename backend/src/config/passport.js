const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('./index');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Passport.js Google OAuth 2.0 Strategy Configuration
 */
const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId || 'placeholder-client-id',
        clientSecret: config.google.clientSecret || 'placeholder-client-secret',
        callbackURL: config.google.callbackUrl,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Pass raw profile to controller — actual user creation logic lives in AuthService
          return done(null, profile);
        } catch (error) {
          logger.error('Google OAuth error:', { error: error.message, service: 'passport' });
          return done(error, null);
        }
      }
    )
  );

  // No serialization needed (stateless JWT auth)
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
};

module.exports = configurePassport;
