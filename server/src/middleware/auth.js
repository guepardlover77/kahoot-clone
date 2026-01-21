import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../index.js';

// Middleware qui requiert une authentification
export async function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  // Récupérer l'utilisateur complet depuis la DB
  const user = await prisma.user.findUnique({
    where: { id: decoded.id }
  });

  if (!user) {
    return res.status(401).json({ error: 'Utilisateur non trouvé' });
  }

  req.user = user;
  next();
}

// Middleware optionnel - ajoute l'utilisateur si connecté, mais ne bloque pas
export async function optionalAuth(req, res, next) {
  const token = req.cookies?.auth_token;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      req.user = user;
    }
  }

  next();
}

// Middleware pour vérifier si l'utilisateur est propriétaire d'une ressource
export function requireOwnership(getResourceUserId) {
  return async (req, res, next) => {
    const resourceUserId = await getResourceUserId(req);

    if (!resourceUserId) {
      // Pas de propriétaire assigné, autoriser si admin ou si c'est une ancienne ressource
      return next();
    }

    if (req.user.id !== resourceUserId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Non autorisé à modifier cette ressource' });
    }

    next();
  };
}
