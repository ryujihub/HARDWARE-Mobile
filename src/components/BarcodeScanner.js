import { BarCodeScanner } from 'expo-barcode-scanner';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Surface, Text } from 'react-native-paper';

export default function BarcodeScanner({ visible, onScan, onClose, title = 'Scan Barcode' }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      requestCameraPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      onScan({ type, data });
    }
  };

  if (!visible) return null;

  if (hasPermission === null) {
    return (
      <Surface style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </Surface>
    );
  }

  if (hasPermission === false) {
    return (
      <Surface style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Button mode="contained" onPress={requestCameraPermission} style={styles.button}>
          Grant Permission
        </Button>
        <Button mode="outlined" onPress={onClose} style={styles.button}>
          Cancel
        </Button>
      </Surface>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>
        <IconButton icon="close" onPress={onClose} />
      </Surface>

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructionText}>
          {scanned ? 'Barcode scanned!' : 'Position barcode within frame'}
        </Text>
      </View>

      {scanned && (
        <Surface style={styles.footer}>
          <Button mode="contained" onPress={() => setScanned(false)} style={styles.button}>
            Scan Again
          </Button>
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  title: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  button: {
    marginVertical: 8,
  },
});
