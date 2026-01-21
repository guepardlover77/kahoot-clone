# Étape 1: Build du client React
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copier les fichiers package
COPY client/package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source du client
COPY client/ ./

# Build du client
RUN npm run build

# Étape 2: Setup du serveur
FROM node:20-alpine AS server

# Installer OpenSSL pour Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copier les fichiers package du serveur
COPY server/package*.json ./server/

# Installer les dépendances du serveur
WORKDIR /app/server
RUN npm install

# Copier le code source du serveur
COPY server/ ./

# Générer le client Prisma
RUN npx prisma generate

# Copier le build du client depuis l'étape précédente
COPY --from=client-builder /app/client/dist /app/client/dist

# Exposer le port
EXPOSE 3001

# Créer un volume pour la base de données
VOLUME ["/app/server/prisma"]

# Commande de démarrage
CMD ["sh", "-c", "npx prisma db push && node src/index.js"]
