import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Avatar,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    List,
    Modal,
    Portal,
    Surface,
    Text,
    Title,
    useTheme
} from 'react-native-paper';
import HelpModalMaterial from '../components/HelpModalMaterial';
import { auth, db } from '../config/firebase';

export default function HomeScreenMaterial() {
    const navigation = useNavigation();
    const theme = useTheme();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalValue: 0,
        categories: 0,
        outOfStock: 0,
        highValue: 0,
        totalSales: 0,
        totalLostAmount: 0,
    });
    const [ordersData, setOrdersData] = useState([]);
    const [username, setUsername] = useState('');
    const [recentActivityData, setRecentActivityData] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    useEffect(() => {
        let unsubscribeItems = null;
        
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            // Clean up previous listener if it exists
            if (unsubscribeItems && typeof unsubscribeItems === 'function') {
                unsubscribeItems();
                unsubscribeItems = null;
            }
            
            if (!user) {
                setError('No user logged in');
                setLoading(false);
                setItems([]);
                return;
            }

            console.log('=== USER ID DEBUG ===');
            console.log('Current user UID:', user.uid);
            console.log('Current user email:', user.email);
            console.log('Previous user UID was: UiFyE4p0rCNPhE05wAsrXP60Wzn2');
            console.log('UIDs match?', user.uid === 'UiFyE4p0rCNPhE05wAsrXP60Wzn2');
            console.log('====================');

            const loadUsername = async () => {
                try {
                    if (user.displayName) {
                        setUsername(user.displayName);
                    } else {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            setUsername(userDoc.data().username || '');
                        }
                    }
                } catch (e) {
                    console.error('Failed to load username:', e);
                }
            };
            loadUsername();

            const itemsRef = db.collection('inventory');
            console.log('HomeScreen: Querying inventory for userId:', user.uid);
            
            // First, let's check if there are ANY items in the inventory collection
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
            const q = itemsRef;

            unsubscribeItems = q.onSnapshot(
                snapshot => {
                    console.log('=== FILTERED QUERY RESULT ===');
                    console.log('HomeScreen: Received snapshot with', snapshot.docs.length, 'items for user', user.uid);
                    console.log('Query was: userId ==', user.uid);
                    snapshot.docs.forEach(doc => {
                        console.log('Filtered item:', doc.id, doc.data().name);
                    });
                    console.log('=============================');
                    const itemsArray = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setItems(itemsArray);
                    setLoading(false);
                    calculateQuickStats(itemsArray, ordersData);
                },
                error => {
                    console.error('Error fetching items:', error);
                    setError('Failed to load items');
                    setLoading(false);
                },
            );
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeItems && typeof unsubscribeItems === 'function') {
                unsubscribeItems();
            }
        };
    }, [ordersData]);

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef);

        const unsubscribeOrders = onSnapshot(
            ordersQuery,
            snapshot => {
                const fetchedOrders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setOrdersData(fetchedOrders);
                calculateQuickStats(items, fetchedOrders);
            },
            error => {
                console.error('Error fetching orders data:', error);
            },
        );

        return () => unsubscribeOrders();
    }, [items]);

    useEffect(() => {
        const activityRef = collection(db, 'activity');
        const q = query(activityRef, orderBy('createdAt', 'desc'), limit(5));

        const unsubscribeActivity = onSnapshot(
            q,
            snapshot => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt
                        ? new Date(doc.data().createdAt.toDate()).toLocaleString()
                        : 'N/A'
                }));
                setRecentActivityData(activities);
                setLoadingActivity(false);
            },
            error => {
                console.error('Error fetching recent activity:', error);
                setLoadingActivity(false);
            },
        );

        return () => unsubscribeActivity();
    }, []);

    const calculateQuickStats = React.useCallback((itemsData, ordersData) => {
        const totalItems = itemsData.length;
        const totalValue = itemsData.reduce((sum, item) =>
            sum + (item.price || 0) * (item.currentStock || 0), 0);
        const outOfStock = itemsData.filter(item => item.currentStock === 0).length;
        const totalSales = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalLostAmount = itemsData.reduce((sum, item) => {
            const variance = item.inventoryVariance || 0;
            const cost = Number(item.cost) || Number(item.sellingPrice) || Number(item.price) || 0;
            if (variance < 0) {
                return sum + (Math.abs(variance) * cost);
            }
            return sum;
        }, 0);

        setStats({
            totalItems,
            totalValue,
            outOfStock,
            totalSales,
            totalLostAmount,
        });
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (loading) {
        return (
            <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </Surface>
        );
    }

    if (error) {
        return (
            <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <Button
                        mode="contained"
                        onPress={() => navigation.replace('Login')}
                        style={styles.errorButton}
                    >
                        Go to Login
                    </Button>
                </View>
            </Surface>
        );
    }

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Card */}
                <Card style={styles.headerCard} mode="elevated">
                    <Card.Content>
                        <View style={styles.headerContent}>
                            <View style={styles.headerLeft}>
                                <Avatar.Icon
                                    size={48}
                                    icon="account"
                                    style={{ backgroundColor: theme.colors.primary }}
                                />
                                <View style={styles.headerText}>
                                    <Title style={styles.welcomeText}>Welcome Back!</Title>
                                    {username && <Text variant="bodyLarge">{username}</Text>}
                                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                        {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.headerActions}>

                                <IconButton
                                    icon="cog"
                                    size={24}
                                    onPress={() => navigation.navigate('Settings')}
                                />
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]} mode="elevated">
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="cube-outline" size={32} color={theme.colors.primary} />
                            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                                {stats.totalItems}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                                Total Items
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: theme.colors.secondaryContainer }]} mode="elevated">
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="cash-outline" size={32} color={theme.colors.secondary} />
                            <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>
                                ₱{stats.totalValue.toFixed(0)}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                                Total Value
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[
                            styles.statCard,
                            { backgroundColor: stats.outOfStock > 0 ? theme.colors.errorContainer : theme.colors.tertiaryContainer }
                        ]}
                        mode="elevated"
                        onPress={() => setShowOutOfStockModal(true)}
                    >
                        <Card.Content style={styles.statContent}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={32}
                                color={stats.outOfStock > 0 ? theme.colors.error : theme.colors.tertiary}
                            />
                            <Text
                                variant="headlineMedium"
                                style={{ color: stats.outOfStock > 0 ? theme.colors.error : theme.colors.tertiary }}
                            >
                                {stats.outOfStock}
                            </Text>
                            <Text
                                variant="bodySmall"
                                style={{
                                    color: stats.outOfStock > 0 ? theme.colors.onErrorContainer : theme.colors.onTertiaryContainer
                                }}
                            >
                                Out of Stock
                            </Text>
                            <Chip
                                compact
                                style={{ marginTop: 4 }}
                                textStyle={{ fontSize: 10 }}
                            >
                                Tap to view
                            </Chip>
                        </Card.Content>
                    </Card>

                    <Card
                        style={[styles.statCard, { backgroundColor: theme.colors.primaryContainer }]}
                        mode="elevated"
                        onPress={() => navigation.navigate('SalesReport')}
                    >
                        <Card.Content style={styles.statContent}>
                            <Ionicons name="trending-up-outline" size={32} color={theme.colors.primary} />
                            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                                ₱{stats.totalSales.toFixed(0)}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                                Total Sales
                            </Text>
                            <Chip
                                compact
                                style={{ marginTop: 4 }}
                                textStyle={{ fontSize: 10 }}
                            >
                                View Report
                            </Chip>
                        </Card.Content>
                    </Card>
                </View>

                {/* Quick Actions */}
                <Card style={styles.actionsCard} mode="elevated">
                    <Card.Content>
                        <Title>Quick Actions</Title>
                        <Divider style={{ marginVertical: 12 }} />
                        <List.Item
                            title="Manage Inventory"
                            description="View and update your items"
                            left={props => <List.Icon {...props} icon="package-variant" />}
                            right={props => <List.Icon {...props} icon="chevron-right" />}
                            onPress={() => navigation.navigate('Inventory')}
                            style={styles.listItem}
                        />
                    </Card.Content>
                </Card>

                {/* Recent Activity */}
                <Card style={styles.activityCard} mode="elevated">
                    <Card.Content>
                        <Title>Recent Activity</Title>
                        <Divider style={{ marginVertical: 12 }} />
                        {loadingActivity ? (
                            <ActivityIndicator size="small" />
                        ) : recentActivityData.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                                No recent activity found.
                            </Text>
                        ) : (
                            recentActivityData.map((activity, index) => (
                                <View key={activity.id}>
                                    <List.Item
                                        title={activity.message}
                                        description={`${activity.entityType} • ${activity.userName} • ${activity.createdAt}`}
                                        left={props => <List.Icon {...props} icon="history" />}
                                    />
                                    {index < recentActivityData.length - 1 && <Divider />}
                                </View>
                            ))
                        )}
                    </Card.Content>
                </Card>
            </ScrollView>



            {/* Out of Stock Modal */}
            <Portal>
                <Modal
                    visible={showOutOfStockModal}
                    onDismiss={() => setShowOutOfStockModal(false)}
                    contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                >
                    <Title>Out of Stock Items</Title>
                    <Divider style={{ marginVertical: 12 }} />

                    {items.filter(item => item.currentStock === 0).length === 0 ? (
                        <Text style={{ textAlign: 'center', padding: 20 }}>
                            No items are currently out of stock! 🎉
                        </Text>
                    ) : (
                        <ScrollView style={styles.modalScrollView}>
                            {items.filter(item => item.currentStock === 0).map(item => (
                                <Card key={item.id} style={styles.outOfStockItem} mode="outlined">
                                    <Card.Content>
                                        <View style={styles.itemRow}>
                                            <View style={styles.itemInfo}>
                                                <Text variant="titleMedium">{item.name}</Text>
                                                <Text variant="bodySmall">#{item.productCode}</Text>
                                                <Text variant="bodySmall">Min Stock: {item.minimumStock} {item.unit}</Text>
                                                <Text variant="titleSmall" style={{ color: theme.colors.secondary }}>
                                                    ₱{item.price?.toFixed(2)}
                                                </Text>
                                            </View>
                                            <Chip
                                                mode="outlined"
                                                textStyle={{ color: theme.colors.error }}
                                                style={{ borderColor: theme.colors.error }}
                                            >
                                                OUT OF STOCK
                                            </Chip>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.modalActions}>
                        <Button mode="outlined" onPress={() => setShowOutOfStockModal(false)}>
                            Close
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setShowOutOfStockModal(false);
                                navigation.navigate('Inventory');
                            }}
                        >
                            Go to Inventory
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Help Modal */}
            <HelpModalMaterial visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        textAlign: 'center',
        marginVertical: 16,
    },
    errorButton: {
        marginTop: 16,
    },
    headerCard: {
        margin: 16,
        marginBottom: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerText: {
        marginLeft: 12,
        flex: 1,
    },
    welcomeText: {
        marginBottom: 4,
    },
    headerActions: {
        flexDirection: 'row',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        gap: 8,
    },
    statCard: {
        width: '47%',
        marginBottom: 8,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionsCard: {
        margin: 16,
        marginTop: 8,
    },
    listItem: {
        paddingHorizontal: 0,
    },
    activityCard: {
        margin: 16,
        marginTop: 8,
        marginBottom: 16,
    },

    modalContainer: {
        margin: 20,
        padding: 20,
        borderRadius: 12,
        maxHeight: '80%',
    },
    modalScrollView: {
        maxHeight: 300,
    },
    outOfStockItem: {
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
});