import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, Portal, Surface, Text, useTheme } from 'react-native-paper';
import HelpModalMaterial from '../components/HelpModalMaterial';
import InventoryCard from '../components/InventoryCard';
import InventoryFilters from '../components/InventoryFilters';
import { auth, db } from '../config/firebase';

export default function InventoryScreenMaterial({ navigation, route }) {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [stockFilter, setStockFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Get unique categories from items
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      const itemsRef = collection(db, 'inventory');
      const userItemsQuery = query(itemsRef); // Removed userId filter temporarily

      const unsubscribe = onSnapshot(
        userItemsQuery,
        snapshot => {
          const itemsArray = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

          setItems(itemsArray);
          setLoading(false);
        },
        error => {
          console.error('Error fetching items:', error);
          Alert.alert('Error', `Failed to load items: ${error.message}`);
          setLoading(false);
        },
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error in loadItems:', error);
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadItems().finally(() => setRefreshing(false));
  }, []);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Stock filter
    switch (stockFilter) {
      case 'inStock':
        filtered = filtered.filter(item => {
          const currentStock = item.currentStock || 0;
          const threshold = item.reorderPoint || item.minimumStock || 0;
          return currentStock >= threshold && currentStock > 0;
        });
        break;
      case 'lowStock':
        filtered = filtered.filter(item => {
          const currentStock = item.currentStock || 0;
          const threshold = item.reorderPoint || item.minimumStock || 0;
          return currentStock > 0 && currentStock < threshold;
        });
        break;
      case 'outOfStock':
        filtered = filtered.filter(item => {
          const currentStock = item.currentStock || 0;
          return currentStock === 0;
        });
        break;
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'stock':
          return (b.currentStock || 0) - (a.currentStock || 0);
        case 'price':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, selectedCategory, stockFilter, sortBy]);

  if (loading) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Filters */}
      {showFilters && (
        <InventoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
        />
      )}

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <InventoryCard item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="headlineSmall" style={styles.emptyText}>
              No items found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add your first inventory item'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon="filter"
          size="small"
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          mode="elevated"
        />
        <FAB
          icon="help"
          size="small"
          onPress={() => setShowHelpModal(true)}
          style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
          mode="elevated"
        />
      </View>

      {/* Help Modal */}
      <Portal>
        <HelpModalMaterial visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    elevation: 2,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    elevation: 4,
  },
  fabPrimary: {
    backgroundColor: undefined, // Use theme default
  },
  fabSecondary: {
    backgroundColor: undefined, // Use theme default
  },
});
