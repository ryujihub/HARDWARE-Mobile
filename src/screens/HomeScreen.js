import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import HelpModal from '../components/HelpModal'; // Import the new HelpModal component
import { auth, db } from '../config/firebase'; // Assuming firebase.js exports FIRESTORE_DB

export default function HomeScreen() {
  const navigation = useNavigation();
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
    topCategory: '',
    topSellingItem: '',
    monthlyGrowth: 0,
    inventoryMetrics: {
      topPerformingItems: [],
    },
  });
  const [ordersData, setOrdersData] = useState([]); // Renamed from salesData
  const [username, setUsername] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [recentActivityData, setRecentActivityData] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState(''); // For debugging

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setError('No user logged in');
      setLoading(false);
      return;
    }

    // Load username from auth profile or users collection
    const loadUsername = async () => {
      try {
        if (user.displayName) {
          setUsername(user.displayName);
        } else {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username || '');
          }
        }
      } catch (e) {
        console.error('Failed to load username:', e);
      }
    };
    loadUsername();

    const itemsRef = collection(db, 'inventory');
    const q = query(itemsRef, where('userId', '==', user.uid));

    // Store raw items from snapshot; compute heavy stats only on demand or when autoCompute is enabled
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const itemsArray = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
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

    return () => unsubscribe();
  }, [username, ordersData]); // Removed autoCompute, computeHeavyStats from dependencies

  useEffect(() => {
    const ordersRef = collection(db, 'orders'); // Changed to 'orders' collection
    const ordersQuery = query(ordersRef);

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      snapshot => {
        const fetchedOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Order data:', { id: doc.id, ...data });
          return { id: doc.id, ...data };
        });
        console.log('Total orders fetched:', fetchedOrders.length);
        setOrdersData(fetchedOrders);
        calculateQuickStats(items, fetchedOrders);
      },
      error => {
        console.error('Error fetching orders data:', error);
      },
    );

    return () => unsubscribeOrders();
  }, [items, ordersData]);

  useEffect(() => {
    const activityRef = collection(db, 'activity');
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(5)); // Fetch last 5 activities

    const unsubscribeActivity = onSnapshot(
      q,
      snapshot => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleString() : 'N/A'
        }));
        setRecentActivityData(activities);
        setLoadingActivity(false);
      },
      error => {
        console.error('Error fetching recent activity:', error);
        setActivityError('Failed to load recent activity.');
        setLoadingActivity(false);
      },
    );

    return () => unsubscribeActivity();
  }, []); // Empty dependency array to run once on mount and listen for real-time updates

  const calculateQuickStats = React.useCallback((itemsData, ordersData) => {
    const totalItems = itemsData.length;
    const totalValue = itemsData.reduce((sum, item) => sum + (item.price || 0) * (item.currentStock || 0), 0);
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

    setStats(prev => ({
      ...prev,
      totalItems,
      totalValue,
      outOfStock,
      totalSales,
      totalLostAmount,
    }));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { color: '#2E7D32', backgroundColor: '#E8F5E9' };
      case 'pending':
        return { color: '#F57C00', backgroundColor: '#FFF3E0' };
      case 'cancelled':
        return { color: '#C62828', backgroundColor: '#FFEBEE' };
      default:
        return { color: '#666', backgroundColor: '#f5f5f5' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.replace('Login')}>
          <Text style={styles.errorButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>
                  Welcome Back!
                </Text>
                {username ? <Text style={styles.usernameText}>{username}</Text> : null}
                <Text style={styles.dateText}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowHelpModal(true)}
              >
                <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatsGrid}>
            <View style={[styles.quickStatCard, styles.primaryCard]}>
              <Ionicons name="cube-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>{stats.totalItems}</Text>
              <Text style={styles.quickStatLabel}>Total Items</Text>
            </View>
            <View style={[styles.quickStatCard, styles.successCard]}>
              <Ionicons name="cash-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>₱{stats.totalValue.toFixed(2)}</Text>
              <Text style={styles.quickStatLabel}>Total Value</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.quickStatCard,
                stats.outOfStock > 0 ? styles.dangerCard : styles.infoCard,
              ]}
              onPress={() => setShowOutOfStockModal(true)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>{stats.outOfStock}</Text>
              <Text style={styles.quickStatLabel}>Out of Stock</Text>
              <Text style={styles.tapToSeeText}>Tap to see list</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickStatCard, styles.infoCard]}
              onPress={() => navigation.navigate('SalesReport')}
            >
              <Ionicons name="wallet-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>₱{stats.totalSales.toFixed(2)}</Text>
              <Text style={styles.quickStatLabel}>Total Revenue</Text>
              <Text style={styles.tapToSeeText}>Tap to see analytics</Text>
            </TouchableOpacity>
            <View style={[styles.quickStatCard, styles.dangerCard]}>
              <Ionicons name="trending-down-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>₱{stats.totalLostAmount.toFixed(2)}</Text>
              <Text style={styles.quickStatLabel}>Total Lost Amount</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Inventory')}
          >
            <View style={styles.quickActionContent}>
              <Ionicons name="list" size={24} color="#007AFF" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>View Inventory</Text>
                <Text style={styles.quickActionSubtitle}>Manage your items</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {loadingActivity ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : activityError ? (
            <Text style={styles.errorText}>{activityError}</Text>
          ) : recentActivityData.length === 0 ? (
            <Text style={styles.noActivityText}>No recent activity found.</Text>
          ) : (
            recentActivityData.map(activity => (
              <View key={activity.id} style={styles.activityCard}>
                <Text style={styles.activityMessage}>{activity.message}</Text>
                <Text style={styles.activityDetails}>Type: {activity.entityType}</Text>
                <Text style={styles.activityDetails}>User: {activity.userName}</Text>
                <Text style={styles.activityDetails}>Time: {activity.createdAt}</Text>
              </View>
            ))
          )}
        </View>


      </ScrollView>

      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />

      {/* Out of Stock Modal */}
      {showOutOfStockModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Out of Stock Items</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowOutOfStockModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {items.filter(item => item.currentStock === 0).length === 0 ? (
                <Text style={styles.noItemsText}>No items are currently out of stock!</Text>
              ) : (
                <ScrollView style={styles.outOfStockList}>
                  {items.filter(item => item.currentStock === 0).map(item => (
                    <View key={item.id} style={styles.outOfStockItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCode}>#{item.productCode}</Text>
                        <Text style={styles.itemDetails}>
                          Min Stock: {item.minimumStock} {item.unit}
                        </Text>
                        <Text style={styles.itemPrice}>₱{item.price?.toFixed(2)}</Text>
                      </View>
                      <View style={styles.itemStatus}>
                        <Text style={styles.outOfStockLabel}>OUT OF STOCK</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowOutOfStockModal(false);
                  navigation.navigate('Inventory');
                }}
              >
                <Text style={styles.modalButtonText}>Go to Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 5, // Add gap between icons
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  usernameText: {
    fontSize: 20, // Slightly smaller than "Welcome Back!"
    color: '#333',
    marginTop: 2, // Small margin from "Welcome Back!"
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  iconButton: {
    padding: 3,
  },
  quickStatsContainer: {
    padding: 15,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  quickStatCard: {
    width: '45%', // Adjusted for 5 cards: 3 on first row, 2 on second
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  successCard: {
    backgroundColor: '#2E7D32',
  },
  warningCard: {
    backgroundColor: '#F57C00',
  },
  dangerCard: {
    backgroundColor: '#C62828',
  },
  infoCard: {
    backgroundColor: '#1565C0',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  tapToSeeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  quickActionsContainer: {
    padding: 15,
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sectionContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  metricsContainer: {
    gap: 15,
  },
  metricsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metricSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  optimalValue: {
    color: '#2E7D32',
  },
  warningValue: {
    color: '#F57C00',
  },
  dangerValue: {
    color: '#C62828',
  },
  alertValue: {
    color: '#7B1FA2',
  },
  valueDistribution: {
    gap: 4,
  },
  distributionText: {
    fontSize: 12,
    color: '#666',
  },
  topItemsList: {
    gap: 8,
  },
  topItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  topItemDetails: {
    alignItems: 'flex-end',
  },
  topItemSales: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  topItemStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  valueBreakdown: {
    gap: 15,
  },
  totalValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  totalValueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  valueBreakdownGrid: {
    gap: 10,
  },
  valueBreakdownItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  valueBreakdownLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  valueBreakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  valueBreakdownCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  valueInsights: {
    marginTop: 10,
    gap: 8,
  },
  valueInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueInsightText: {
    fontSize: 13,
    color: '#666',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  activityDetails: {
    fontSize: 13,
    color: '#666',
  },
  noActivityText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    marginBottom: 20,
  },
  outOfStockList: {
    maxHeight: 300,
  },
  outOfStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  itemStatus: {
    alignItems: 'center',
  },
  outOfStockLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noItemsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 30,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Sales Modal Styles
  revenueSummary: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  salesList: {
    maxHeight: 250,
  },
  salesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  salesInfo: {
    flex: 1,
  },
  salesDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  salesDetails: {
    fontSize: 12,
    color: '#666',
  },
  salesAmount: {
    alignItems: 'flex-end',
  },
  salesAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  moreItemsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  // Additional Sales Modal Styles
  salesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  salesOrderId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemsList: {
    marginBottom: 8,
  },
  itemDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  salesTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  moreOrdersText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
