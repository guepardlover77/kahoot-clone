import { Router } from 'express';
import passport from 'passport';
import { generateToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Initie l'authentification Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback OAuth Google
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${CLIENT_URL}/login?error=auth_failed`
  }),
  (req, res) => {
    // Générer le JWT et le stocker dans un cookie
    const token = generateToken(req.user);
    setTokenCookie(res, token);

    // Rediriger vers le client
    res.redirect(CLIENT_URL);
  }
);

// Récupérer l'utilisateur courant
router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    isAdmin: req.user.isAdmin
  });
});

// Déconnexion
router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Déconnecté' });
});

export default router;
