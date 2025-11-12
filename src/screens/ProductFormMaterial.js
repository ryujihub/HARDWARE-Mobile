import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Surface,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import BarcodeScanner from '../components/BarcodeScanner';
import { auth, db } from '../config/firebase';

export default function ProductFormMaterial({ navigation, route }) {
  const theme = useTheme();
  const editProduct = route?.params?.product;
  const isEditing = !!editProduct;

  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    productCode: editProduct?.productCode || '',
    barcode: editProduct?.barcode || '',
    category: editProduct?.category || '',
    price: editProduct?.price?.toString() || '',
    currentStock: editProduct?.currentStock?.toString() || '',
    minimumStock: editProduct?.minimumStock?.toString() || '',
    reorderPoint: editProduct?.reorderPoint?.toString() || '',
    description: editProduct?.description || '',
  });

  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchingBarcode, setSearchingBarcode] = useState(false);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBarcodeScan = async ({ data }) => {
    setShowScanner(false);
    // Set both barcode and product code to the same value
    updateField('barcode', data);
    updateField('productCode', data);

    // Check if product with this barcode already exists
    setSearchingBarcode(true);
    try {
      const snapshot = await db.collection('inventory').where('barcode', '==', data).limit(1).get();

      if (!snapshot.empty && (!isEditing || snapshot.docs[0].id !== editProduct.id)) {
        const existingProduct = snapshot.docs[0].data();
        Alert.alert(
          'Product Found',
          `A product "${existingProduct.name}" already exists with this barcode. Do you want to edit it instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Edit Product',
              onPress: () => {
                navigation.replace('ProductForm', {
                  product: { id: snapshot.docs[0].id, ...existingProduct },
                });
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error checking barcode:', error);
    } finally {
      setSearchingBarcode(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required.');
      return false;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price.');
      return false;
    }

    if (
      !formData.currentStock ||
      isNaN(parseInt(formData.currentStock)) ||
      parseInt(formData.currentStock) < 0
    ) {
      Alert.alert('Validation Error', 'Please enter a valid stock quantity.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const user = auth.currentUser;
      const barcodeValue = formData.barcode.trim();
      const productData = {
        name: formData.name.trim(),
        productCode: barcodeValue || `PROD-${Date.now()}`, // Product code is same as barcode
        barcode: barcodeValue,
        category: formData.category.trim() || 'Uncategorized',
        price: parseFloat(formData.price),
        currentStock: parseInt(formData.currentStock),
        minimumStock: parseInt(formData.minimumStock) || 10,
        reorderPoint: parseInt(formData.reorderPoint) || 20,
        description: formData.description.trim(),
        userId: user.uid,
        updatedAt: new Date(),
      };

      if (isEditing) {
        await db.collection('inventory').doc(editProduct.id).update(productData);
        Alert.alert('Success', 'Product updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        productData.createdAt = new Date();
        await db.collection('inventory').add(productData);
        Alert.alert('Success', 'Product added successfully!', [
          {
            text: 'Add Another',
            onPress: () => {
              setFormData({
                name: '',
                productCode: '',
                barcode: '',
                category: formData.category, // Keep category
                price: '',
                currentStock: '',
                minimumStock: '',
                reorderPoint: '',
                description: '',
              });
            },
          },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = () => {
    // Generate a simple barcode (EAN-13 format simulation)
    const timestamp = Date.now().toString();
    const barcode = timestamp.slice(-12).padStart(12, '0');
    // Set both barcode and product code to the same value
    updateField('barcode', barcode);
    updateField('productCode', barcode);
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </Text>

            {/* Barcode Section */}
            <View style={styles.barcodeSection}>
              <TextInput
                label="Barcode"
                value={formData.barcode}
                onChangeText={value => updateField('barcode', value)}
                mode="outlined"
                style={styles.barcodeInput}
                right={
                  searchingBarcode ? (
                    <TextInput.Icon icon={() => <ActivityIndicator size={20} />} />
                  ) : null
                }
              />
              <View style={styles.barcodeActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowScanner(true)}
                  icon="barcode-scan"
                  style={styles.barcodeButton}
                >
                  Scan
                </Button>
                <Button
                  mode="outlined"
                  onPress={generateBarcode}
                  icon="auto-fix"
                  style={styles.barcodeButton}
                >
                  Generate
                </Button>
              </View>
            </View>

            {/* Basic Info */}
            <TextInput
              label="Product Name *"
              value={formData.name}
              onChangeText={value => updateField('name', value)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Product Code (Same as Barcode)"
              value={formData.productCode}
              mode="outlined"
              style={styles.input}
              editable={false}
              placeholder="Will be same as barcode"
              right={<TextInput.Icon icon="link" />}
            />

            <TextInput
              label="Category"
              value={formData.category}
              onChangeText={value => updateField('category', value)}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Price (₱) *"
              value={formData.price}
              onChangeText={value => updateField('price', value)}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={value => updateField('description', value)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Stock Information
            </Text>

            <TextInput
              label="Current Stock *"
              value={formData.currentStock}
              onChangeText={value => updateField('currentStock', value)}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
            />

            <TextInput
              label="Minimum Stock"
              value={formData.minimumStock}
              onChangeText={value => updateField('minimumStock', value)}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
              placeholder="Default: 10"
            />

            <TextInput
              label="Reorder Point"
              value={formData.reorderPoint}
              onChangeText={value => updateField('reorderPoint', value)}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
              placeholder="Default: 20"
            />
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.actionButton}
            loading={loading}
            disabled={loading}
          >
            {isEditing ? 'Update' : 'Add Product'}
          </Button>
        </View>
      </ScrollView>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
        title="Scan Product Barcode"
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  barcodeSection: {
    marginBottom: 16,
  },
  barcodeInput: {
    marginBottom: 8,
  },
  barcodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeButton: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
