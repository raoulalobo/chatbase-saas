# ChatBase SaaS - Plateforme d'Agents IA

## 📋 Description

SaaS moderne pour créer des agents de service client IA intelligents pour sites web. Cette plateforme permet aux entreprises de déployer rapidement des chatbots personnalisés sans compétences techniques.

## 🚀 Fonctionnalités Principales

- ✅ **Création rapide d'agents IA** - Interface intuitive pour configurer votre agent en minutes
- ✅ **IA avancée** - Powered by GPT-4 pour des réponses naturelles et pertinentes
- ✅ **Personnalisation complète** - Adaptez l'apparence et le comportement selon vos besoins
- ✅ **Dashboard analytics** - Suivez les performances et conversations de vos agents
- ✅ **Intégration facile** - Script embed simple pour n'importe quel site web

## 🛠️ Stack Technique

- **Frontend**: Next.js 15.5 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4.0 + Variables CSS personnalisées
- **UI Components**: Radix UI + Components personnalisés
- **Base de données**: Drizzle ORM + PostgreSQL
- **Authentification**: NextAuth.js
- **Icons**: Lucide React

## 📁 Structure du Projet

```
src/
├── app/                    # App Router Next.js 15
│   ├── page.tsx           # Page d'accueil
│   ├── globals.css        # Styles globaux avec variables CSS
│   └── layout.tsx         # Layout principal
├── components/
│   ├── ui/                # Composants UI réutilisables
│   ├── dashboard/         # Composants du tableau de bord
│   └── agents/           # Composants liés aux agents IA
├── lib/
│   ├── utils.ts          # Utilitaires (cn pour classes CSS)
│   └── db/               # Configuration base de données
│       ├── index.ts      # Connexion Drizzle
│       ├── schema.ts     # Schéma des tables
│       └── queries.ts    # Fonctions CRUD typées
├── types/                # Types TypeScript
├── hooks/                # Hooks React personnalisés
└── store/               # État global de l'application
drizzle/                 # Fichiers de migrations Drizzle
drizzle.config.ts        # Configuration Drizzle Kit
```

## ⚡ Démarrage Rapide

1. **Installation des dépendances**
```bash
npm install
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env
# Remplir les variables d'environnement
```

3. **Initialisation de la base de données**
```bash
# Générer les migrations depuis le schéma
npm run db:generate

# Appliquer les migrations à la base de données
npm run db:migrate

# Ou pousser directement le schéma (développement)
npm run db:push
```

4. **Lancement du serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🎨 Système de Design

### Palette de Couleurs
- **Primary**: Bleu (#3b82f6)
- **Success**: Vert (#22c55e)  
- **Warning**: Orange (#f59e0b)
- **Error**: Rouge (#ef4444)

### Thème Sombre/Clair
Support automatique basé sur les préférences système avec variables CSS personnalisées.

## 📦 Scripts Disponibles

```bash
npm run dev          # Serveur de développement (Turbopack)
npm run build        # Build de production
npm run start        # Serveur de production  
npm run lint         # Linting ESLint

# Scripts de base de données
npm run db:generate  # Générer les migrations Drizzle
npm run db:migrate   # Appliquer les migrations
npm run db:push      # Pousser le schéma directement
npm run db:studio    # Interface graphique Drizzle Studio
```

## 🔄 Prochaines Étapes

- [ ] Configuration de l'authentification NextAuth.js
- [ ] Interface de création d'agents IA
- [ ] Dashboard d'analytics
- [ ] API routes pour la gestion des agents
- [ ] Système de paiement (Stripe)
- [ ] Widget embeddable pour sites clients

## 🤝 Contribution

1. Fork du projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit des changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
