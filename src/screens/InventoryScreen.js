import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import HelpModal from '../components/HelpModal';
import { auth, db } from '../config/firebase'; // Ensure db is FIRESTORE_DB

export default function InventoryScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(''); // State to store username
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [selectedCategory, setSelectedCategory] = useState('All'); // State for selected category

  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const movementsRef = collection(db, 'stockMovements');
    const unsubscribeMovements = onSnapshot(movementsRef, async snapshot => {
      // Process only added or modified documents to avoid duplicate updates
      const changes = snapshot.docChanges();
      for (const change of changes) {
        if (change.type === 'added' || change.type === 'modified') {
          const mv = change.doc.data();
          try {
            // Prefer using the inventory document id if provided; otherwise try mapping by productCode
            let itemId = mv.itemId;
            if (!itemId && mv.productCode) {
              const matched = items.find(i => i.productCode === mv.productCode);
              itemId = matched?.id;
            }

            if (!itemId) {
              console.warn('Stock movement received but no matching item id found:', mv);
              continue;
            }

            const delta =
              mv.type === 'out'
                ? -Math.abs(Number(mv.quantity) || 0)
                : Math.abs(Number(mv.quantity) || 0);

            // Use atomic increment to avoid race conditions (modular API)
            const itemDocRef = doc(db, 'inventory', itemId);
            await updateDoc(itemDocRef, {
              currentStock: increment(delta),
            });
          } catch (err) {
            console.error('Failed to apply stock movement atomically:', err, mv);
          }
        }
      }
    });
    return () => unsubscribeMovements();
  }, [items]);

  useEffect(() => {
    const salesRef = collection(db, 'sales');
    const salesQuery = query(salesRef);
    const unsubscribeSales = onSnapshot(
      salesQuery,
      snapshot => {
        // Handle sales updates here, e.g., refresh local state or trigger UI updates
        console.log(
          'Sales collection updated:',
          snapshot.docs.map(doc => doc.data()),
        );
        // You can implement logic to update inventory or sales stats based on sales changes
      },
      error => {
        console.error('Error listening to sales collection:', error);
      },
    );

    return () => unsubscribeSales();
  }, []);

  // Load items and username
  useEffect(() => {
    loadItems();

    const user = auth.currentUser;
    if (user) {
      const loadUsername = async () => {
        try {
          if (user.displayName) {
            setUsername(user.displayName);
          } else {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUsername(userSnap.data().username || 'Unknown User');
            }
          }
        } catch (e) {
          console.error('Failed to load username:', e);
          setUsername('Unknown User');
        }
      };
      loadUsername();
    }
  }, []);

  const loadItems = async () => {
    try {
      const user = auth.currentUser;
      console.log('Current user ID:', user?.uid);
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('Starting to fetch inventory items...');
      const itemsRef = collection(db, 'inventory');

      // Fetch all items to inspect their userId values
      const allItemsSnapshot = await getDocs(itemsRef);
      console.log('Total items in database:', allItemsSnapshot.docs.length);

      allItemsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        console.log(`Item ID: ${docSnap.id}, Name: ${data.name}, UserId: ${data.userId}`);
      });

      // Identify and fix items that don't have a userId by assigning them to the current user
      const fixPromises = allItemsSnapshot.docs
        .filter(docSnap => docSnap.data().userId !== user.uid) // Filter items whose userId is not the current user's UID
        .map(docSnap => {
          console.log('Fixing item without userId:', docSnap.id, 'Assigning to:', user.uid);
          return updateDoc(doc(db, 'inventory', docSnap.id), {
            userId: user.uid,
            lastUpdated: new Date(),
          });
        });

      if (fixPromises.length > 0) {
        console.log('Fixing', fixPromises.length, 'items without userId');
        await Promise.all(fixPromises);
        console.log('Successfully fixed items without userId');
        // After fixing, reload items to ensure the snapshot listener picks up the changes
        // This will trigger the onSnapshot below with the updated data
      }

      // Now, set up the real-time listener for items belonging to the current user
      const userItemsQuery = query(itemsRef, where('userId', '==', user.uid));
      console.log('Querying items for user ID:', user.uid);

      const unsubscribe = onSnapshot(
        userItemsQuery,
        snapshot => {
          console.log('Received snapshot with docs:', snapshot.docs.length);
          console.log('Snapshot metadata:', snapshot.metadata);

          const itemsArray = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

          console.log('Total items fetched for user:', itemsArray.length);

          setItems(itemsArray);
          setLoading(false);
        },
        error => {
          console.error('Error fetching items:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack,
          });
          Alert.alert('Error', `Failed to load items: ${error.message}`);
          setLoading(false);
        },
      );

      return () => {
        try {
          unsubscribe();
          console.log('Successfully unsubscribed from inventory updates');
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.error('Error in loadItems:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', `Failed to load items: ${error.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  // Get unique categories from items
  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

  // Filter items based on search query and selected category
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Header with Search and Filters */}
      <View style={styles.headerContainer}>
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.categoryFilterContent}>
            <FlatList
              data={categories}
              keyExtractor={cat => cat}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryFilterButton,
                    selectedCategory === item && styles.categoryFilterButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Ionicons
                    name={getCategoryIcon(item)}
                    size={16}
                    color={selectedCategory === item ? 'white' : '#666'}
                    style={styles.categoryIcon}
                  />
                  <Text
                    style={[
                      styles.categoryFilterText,
                      selectedCategory === item && styles.categoryFilterTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.itemCode}>#{item.productCode}</Text>
                  {item.inventoryVariance < 0 && (
                    <View style={styles.shortageBadge}>
                      <Text style={styles.badgeText}>
                        Shortage: {Math.abs(item.inventoryVariance)} {item.unit}
                      </Text>
                    </View>
                  )}
                  {item.inventoryVariance > 0 && (
                    <View style={styles.surplusBadge}>
                      <Text style={styles.badgeText}>
                        Surplus: {item.inventoryVariance} {item.unit}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.itemContent}>
                <View style={styles.stockInfo}>
                  <View style={styles.stockRow}>
                    <View style={styles.stockItem}>
                      <Text style={styles.stockLabel}>On Hand</Text>
                      <Text style={styles.stockValue}>
                        {item.currentStock} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.stockItem}>
                      <Text style={styles.stockLabel}>Total</Text>
                      <Text style={styles.stockValue}>
                        {item.minimumStock} {item.unit}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.priceValue}>₱{item.price?.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.lastUpdated}>
                    Updated: {item.lastUpdated?.toDate().toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'No inventory items available'}
            </Text>
          </View>
        }
      />

      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </View>
  );
}

const getCategoryIcon = category => {
  const icons = {
    Tools: 'hammer',
    Electrical: 'flash',
    Plumbing: 'water',
    Carpentry: 'construct',
    Paint: 'color-palette',
    Hardware: 'hardware-chip',
  };
  return icons[category] || 'cube';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 10,
  },
  searchSection: {
    flexDirection: 'column',
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 10,
    alignItems: 'stretch',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearSearchButton: {
    padding: 4,
  },

  categoryFilterContainer: {
    backgroundColor: 'white',
  },
  categoryFilterContent: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
  },
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: 'white',
  },
  // Badges
  shortageBadge: {
    marginTop: 6,
    backgroundColor: '#FFCDD2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  surplusBadge: {
    marginTop: 6,
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },

  list: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  itemHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  itemCode: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  itemContent: {
    padding: 15,
  },
  stockInfo: {
    marginBottom: 15,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
