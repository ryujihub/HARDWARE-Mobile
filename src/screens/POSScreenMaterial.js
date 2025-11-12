import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    FAB,
    IconButton,
    Modal,
    Portal,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import BarcodeScanner from '../components/BarcodeScanner';
import { auth, db } from '../config/firebase';

export default function POSScreenMaterial({ navigation }) {
  const theme = useTheme();
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');

  const handleBarcodeScan = async ({ data }) => {
    setShowScanner(false);
    setLoading(true);

    try {
      // Search for product by barcode
      const snapshot = await db
        .collection('inventory')
        .where('barcode', '==', data)
        .limit(1)
        .get();

      if (snapshot.empty) {
        Alert.alert('Product Not Found', `No product found with barcode: ${data}`);
        setLoading(false);
        return;
      }

      const productDoc = snapshot.docs[0];
      const product = { id: productDoc.id, ...productDoc.data() };

      // Check stock
      if (!product.currentStock || product.currentStock <= 0) {
        Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
        setLoading(false);
        return;
      }

      // Add to cart
      addToCart(product);
      setLoading(false);
    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert('Error', 'Failed to scan barcode. Please try again.');
      setLoading(false);
    }
  };

  const addToCart = product => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        // Check if we can add more
        if (existingItem.quantity >= product.currentStock) {
          Alert.alert('Stock Limit', `Only ${product.currentStock} units available.`);
          return prevCart;
        }

        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = productId => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const maxQuantity = item.currentStock;
          const quantity = Math.min(newQuantity, maxQuantity);
          return { ...item, quantity };
        }
        return item;
      }),
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      const orderData = {
        userId: user.uid,
        customerName: customerName || 'Walk-in Customer',
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        total: calculateTotal(), // Changed from totalAmount to total to match orders collection
        timestamp: new Date(),
        paymentMethod: 'Cash',
        status: 'completed',
      };

      // Add order record
      await db.collection('orders').add(orderData);

      // Update inventory stock
      const batch = db.batch();
      cart.forEach(item => {
        const itemRef = db.collection('inventory').doc(item.id);
        batch.update(itemRef, {
          currentStock: item.currentStock - item.quantity,
        });
      });
      await batch.commit();

      Alert.alert('Success', 'Sale completed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setCart([]);
            setCustomerName('');
            setShowCheckout(false);
          },
        },
      ]);
    } catch (error) {
      console.error('Error processing sale:', error);
      Alert.alert('Error', 'Failed to process sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <Card style={styles.cartItem}>
      <Card.Content>
        <View style={styles.cartItemHeader}>
          <Text variant="titleMedium" style={styles.cartItemName}>
            {item.name}
          </Text>
          <IconButton icon="delete" size={20} onPress={() => removeFromCart(item.id)} />
        </View>

        <View style={styles.cartItemDetails}>
          <Text variant="bodyMedium">₱{item.price.toFixed(2)}</Text>
          <View style={styles.quantityControl}>
            <IconButton
              icon="minus"
              size={20}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            />
            <Text variant="titleMedium" style={styles.quantity}>
              {item.quantity}
            </Text>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            />
          </View>
          <Text variant="titleMedium" style={styles.itemTotal}>
            ₱{(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.stockInfo}>
          Available: {item.currentStock} units
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Stats */}
      <Surface style={styles.header} elevation={1}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text variant="bodySmall">Items</Text>
            <Text variant="titleLarge">{cart.length}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="bodySmall">Total</Text>
            <Text variant="titleLarge">₱{calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </Surface>

      {/* Cart List */}
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color={theme.colors.onSurfaceVariant} />
          <Text variant="headlineSmall" style={styles.emptyText}>
            Cart is Empty
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Scan a barcode to add items
          </Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item.id}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Action Buttons */}
      <Surface style={styles.footer} elevation={3}>
        <Button
          mode="outlined"
          onPress={() => setCart([])}
          disabled={cart.length === 0}
          style={styles.footerButton}
        >
          Clear Cart
        </Button>
        <Button
          mode="contained"
          onPress={() => setShowCheckout(true)}
          disabled={cart.length === 0}
          style={styles.footerButton}
        >
          Checkout
        </Button>
      </Surface>

      {/* Scan FAB */}
      <FAB
        icon="barcode-scan"
        label="Scan"
        onPress={() => setShowScanner(true)}
        style={styles.fab}
        size="medium"
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
        title="Scan Product Barcode"
      />

      {/* Checkout Modal */}
      <Portal>
        <Modal
          visible={showCheckout}
          onDismiss={() => setShowCheckout(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Complete Sale
          </Text>

          <TextInput
            label="Customer Name (Optional)"
            value={customerName}
            onChangeText={setCustomerName}
            mode="outlined"
            style={styles.input}
          />

          <View style={styles.summaryRow}>
            <Text variant="titleMedium">Total Items:</Text>
            <Text variant="titleMedium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text variant="titleLarge">Total Amount:</Text>
            <Text variant="titleLarge" style={styles.totalAmount}>
              ₱{calculateTotal().toFixed(2)}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowCheckout(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCheckout}
              loading={loading}
              disabled={loading}
              style={styles.modalButton}
            >
              Confirm Sale
            </Button>
          </View>
        </Modal>
      </Portal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cartItem: {
    marginBottom: 12,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemName: {
    flex: 1,
  },
  cartItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontWeight: 'bold',
  },
  stockInfo: {
    marginTop: 4,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 90,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  totalAmount: {
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
