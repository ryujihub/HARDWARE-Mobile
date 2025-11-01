import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    FAB,
    Portal,
    Surface,
    Text,
    useTheme
} from 'react-native-paper';
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
        let unsubscribeItems = null;
        
        // Wait for auth state to be determined before loading items
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            // Clean up previous listener if it exists
            if (unsubscribeItems && typeof unsubscribeItems === 'function') {
                unsubscribeItems();
                unsubscribeItems = null;
            }
            
            if (user) {
                unsubscribeItems = await loadItems();
            } else {
                setLoading(false);
                setItems([]);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeItems && typeof unsubscribeItems === 'function') {
                unsubscribeItems();
            }
        };
    }, []);

    const loadItems = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.log('No user logged in, skipping item load');
                setLoading(false);
                return;
            }

            console.log('=== DEBUGGING AUTH STATE ===');
            console.log('User UID:', user.uid);
            console.log('User email:', user.email);
            console.log('User emailVerified:', user.emailVerified);
            console.log('User isAnonymous:', user.isAnonymous);
            console.log('User metadata:', user.metadata);
            
            // Get and log the ID token
            try {
                const idToken = await user.getIdToken(true); // Force refresh
                console.log('ID token obtained, length:', idToken.length);
                console.log('ID token first 50 chars:', idToken.substring(0, 50));
            } catch (tokenError) {
                console.error('Failed to get ID token:', tokenError);
                Alert.alert('Auth Error', 'Failed to get authentication token. Please logout and login again.');
                setLoading(false);
                return;
            }
            
            // Test basic read access first
            try {
                console.log('Testing basic read access...');
                const testDoc = await db.collection('inventory').limit(1).get();
                console.log('Basic read test successful, docs:', testDoc.docs.length);
            } catch (testError) {
                console.error('Basic read test failed:', testError);
                console.error('Error code:', testError.code);
                console.error('Error message:', testError.message);
                Alert.alert('Database Error', `Cannot connect to database: ${testError.message}\nError code: ${testError.code}`);
                setLoading(false);
                return;
            }

            // Test write access
            try {
                console.log('Testing write access...');
                const testRef = db.collection('test').doc('auth-test');
                await testRef.set({
                    userId: user.uid,
                    timestamp: new Date(),
                    test: true
                });
                console.log('Write test successful');
                // Clean up test document
                await testRef.delete();
            } catch (writeError) {
                console.error('Write test failed:', writeError);
                console.error('Write error code:', writeError.code);
            }
            
            const itemsRef = db.collection('inventory');
            console.log('InventoryScreen: Querying inventory for userId:', user.uid);
            
            // Check all items in the collection first
            try {
                const allItems = await itemsRef.get();
                console.log('Total items in inventory collection:', allItems.docs.length);
                allItems.docs.forEach(doc => {
                    const data = doc.data();
                    console.log('Item:', doc.id, 'userId:', data.userId, 'name:', data.name);
                });
            } catch (error) {
                console.error('Error checking all items:', error);
            }
            
            // Shared inventory - all users see the same items
            const userItemsQuery = itemsRef;

            const unsubscribe = userItemsQuery.onSnapshot(
                snapshot => {
                    console.log('Received snapshot with', snapshot.docs.length, 'items');
                    const itemsArray = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    setItems(itemsArray);
                    setLoading(false);
                },
                error => {
                    console.error('Error fetching items:', error);
                    if (error.code === 'permission-denied') {
                        Alert.alert('Permission Error', 'You do not have permission to access this data. Please check your account permissions.');
                    } else {
                        Alert.alert('Error', `Failed to load items: ${error.message}`);
                    }
                    setLoading(false);
                },
            );

            return unsubscribe;
        } catch (error) {
            console.error('Error in loadItems:', error);
            Alert.alert('Error', error.message);
            setLoading(false);
            return null;
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
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase())
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
                renderItem={({ item }) => (
                    <InventoryCard
                        item={item}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
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
                    style={[styles.fab, styles.fabSecondary]}
                    mode="elevated"
                />
                <FAB
                    icon="help"
                    size="small"
                    onPress={() => setShowHelpModal(true)}
                    style={[styles.fab, styles.fabSecondary]}
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