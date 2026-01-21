import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index.js';

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Chercher ou créer l'utilisateur
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
          });

          if (!user) {
            // Créer un nouvel utilisateur
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                picture: profile.photos?.[0]?.value || null
              }
            });
          } else {
            // Mettre à jour les infos si nécessaire
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: profile.displayName,
                picture: profile.photos?.[0]?.value || null
              }
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

export default passport;
