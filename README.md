# 💱 Currency Converter — React Native + Expo

Convertisseur de devises mobile, propulsé par l'API **Frankfurter** (gratuite, sans clé API).

## Stack

- **React Native** avec **Expo SDK 51**
- **TypeScript**
- **API Frankfurter** — `https://api.frankfurter.app` (données BCE, 30+ devises)

## Structure du projet

```
currency-converter/
├── app/
│   └── ConverterScreen.tsx   # Écran principal
├── components/
│   └── CurrencyPicker.tsx    # Modal de sélection de devise
├── hooks/
│   └── useExchangeRate.ts    # Hook : appel API + conversion
├── constants/
│   └── currencies.ts         # Liste des 31 devises + drapeaux
├── index.ts                  # Point d'entrée Expo
├── app.json                  # Config Expo
├── package.json
└── tsconfig.json
```

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Expo CLI : `npm install -g expo-cli`
- Application **Expo Go** sur ton téléphone (iOS ou Android)

### Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm start

# 3. Scanner le QR code avec Expo Go sur ton téléphone
```

### Lancer sur émulateur

```bash
npm run android   # Android Studio requis
npm run ios       # Xcode requis (macOS uniquement)
```

## Fonctionnalités

- ✅ 31 devises mondiales (dont XPF — Franc Pacifique)
- ✅ Taux en temps réel via Frankfurter (BCE)
- ✅ Recherche de devise par nom ou code
- ✅ Inverser les devises (avec vibration haptic)
- ✅ Montants rapides (10, 50, 100, 500, 1000)
- ✅ Actualisation manuelle du taux
- ✅ Gestion des erreurs réseau
- ✅ TypeScript strict
- ✅ Design sombre (dark theme)

## API Frankfurter

```
GET https://api.frankfurter.app/latest?from=EUR&to=USD
```

- **Gratuite** — aucune clé API requise
- **Open source** — données BCE (Banque Centrale Européenne)
- **Mise à jour** chaque jour ouvré vers 16h CET
- **Docs** : https://www.frankfurter.app/docs

## Publier sur les stores

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter à Expo
eas login

# Configurer le build
eas build:configure

# Build iOS (TestFlight / App Store)
eas build --platform ios

# Build Android (Google Play)
eas build --platform android
```
