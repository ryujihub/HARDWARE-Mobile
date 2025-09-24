# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## How to run (Windows PowerShell)

1. Install dependencies:

```powershell
npm install
```

2. Start the Expo dev server:

```powershell
npm start
```

3. Useful developer commands:

```powershell
# Run the app in an Android emulator
npm run android

# Run the app in an iOS simulator (macOS only)
npm run ios

# Run the web version
npm run web

# Run ESLint
npm run lint

# Fix lintable issues automatically
npm run lint:fix

# Format the codebase with Prettier
npm run format
```

Troubleshooting tips:

- If you see dependency resolution errors during `npm install`, try:

```powershell
npm install --legacy-peer-deps
```

- If the Expo CLI shows native module mismatches, confirm your Expo SDK version in `package.json` matches the installed packages.
- For camera permission issues on Android/iOS, ensure the proper permissions are declared in `app.json` / native configuration.
