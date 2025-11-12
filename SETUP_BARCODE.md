# Setup Instructions for Barcode Features

## ⚠️ Important: Native Module Setup Required

The barcode scanner requires native modules to be rebuilt. Follow these steps:

## 🔧 Setup Steps

### Step 1: Stop the Development Server
If the server is running, press `Ctrl+C` to stop it.

### Step 2: Clear Cache and Rebuild
Run these commands in order:

```bash
# Clear Expo cache
npx expo start -c

# OR if that doesn't work, do a full clean:
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### Step 3: For Development Builds (Recommended)

If you're using Expo Go, the barcode scanner should work automatically. But for best results, create a development build:

```bash
# For Android
npx expo run:android

# For iOS (macOS only)
npx expo run:ios
```

### Step 4: Start the App

```bash
npm start
```

## 📱 Testing Options

### Option A: Expo Go (Easiest)
1. Install Expo Go on your phone
2. Run `npm start`
3. Scan QR code
4. Grant camera permissions
5. Test barcode features

**Note**: Expo Go includes expo-barcode-scanner by default, so it should work!

### Option B: Development Build (Best Performance)
1. Run `npx expo run:android` or `npx expo run:ios`
2. App installs on device/emulator
3. Better performance and reliability

### Option C: Emulator (Limited)
- Android Emulator: Camera simulation available
- iOS Simulator: No camera support
- **Recommendation**: Use physical device for testing

## 🐛 Troubleshooting

### Error: "Cannot find native module 'ExpoBarCodeScanner'"

**Solution 1: Clear Cache**
```bash
npx expo start -c
```

**Solution 2: Reinstall Dependencies**
```bash
rm -rf node_modules
npm install
```

**Solution 3: Rebuild Native Modules**
```bash
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Error: "Property 'POSScreenMaterial' doesn't exist"

This means the import is missing. The file should have:
```javascript
import POSScreenMaterial from './src/screens/POSScreenMaterial';
import ProductFormMaterial from './src/screens/ProductFormMaterial';
```

**Solution**: The imports are already correct in App.js. Just restart the server:
```bash
npm start
```

### Camera Permission Issues

**Android:**
1. Go to Settings → Apps → Your App → Permissions
2. Enable Camera permission

**iOS:**
1. Go to Settings → Privacy → Camera
2. Enable for your app

## ✅ Verification Steps

After setup, verify everything works:

1. **App Starts**
   ```bash
   npm start
   # Should start without errors
   ```

2. **Navigation Works**
   - Open app
   - Tap "Point of Sale" - should open POS screen
   - Tap "Add Product" - should open product form

3. **Scanner Works**
   - Tap "Scan" button
   - Camera permission requested
   - Scanner opens with camera view

4. **Features Work**
   - Can add products
   - Can scan barcodes
   - Can process sales

## 🚀 Quick Start After Setup

Once everything is working:

1. **Add a Product**
   - Home → Add Product
   - Tap "Generate" for barcode
   - Fill in details
   - Save

2. **Test POS**
   - Home → Point of Sale
   - Tap "Scan" FAB
   - Scan the product barcode
   - Complete checkout

## 📝 Alternative: Use Without Camera

If you can't get the camera working, you can still use the app:

1. **Manual Barcode Entry**
   - Type barcode numbers manually
   - Use "Generate" button for new products

2. **Test with Generated Barcodes**
   - Generate barcodes for products
   - Copy/paste barcode numbers for testing

## 🔄 If All Else Fails

If you continue having issues:

1. **Check Expo SDK Version**
   ```bash
   npx expo-doctor
   ```

2. **Update Expo**
   ```bash
   npm install expo@latest
   ```

3. **Reinstall expo-barcode-scanner**
   ```bash
   npm uninstall expo-barcode-scanner
   npm install expo-barcode-scanner
   ```

4. **Check app.json**
   Ensure camera plugin is configured:
   ```json
   {
     "plugins": [
       [
         "expo-camera",
         {
           "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera to scan barcodes."
         }
       ]
     ]
   }
   ```

## ✅ Expected Result

After successful setup:
- ✅ App starts without errors
- ✅ Can navigate to all screens
- ✅ Camera permission works
- ✅ Barcode scanner opens
- ✅ Can scan barcodes
- ✅ POS system functional
- ✅ Product management works

## 📞 Still Having Issues?

If you're still experiencing problems:

1. Check the error message carefully
2. Review the troubleshooting section
3. Ensure you're using a physical device (not simulator)
4. Verify camera permissions are granted
5. Try clearing cache and rebuilding

## 🎉 Success!

Once you see the scanner working, you're all set! Refer to:
- **QUICK_START_BARCODE.md** for usage guide
- **POS_WORKFLOW.md** for workflows
- **TESTING_GUIDE.md** for testing

Happy scanning! 📱✨
