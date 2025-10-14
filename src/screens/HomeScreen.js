import { Ionicons } from '@expo/vector-icons';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
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

export default function HomeScreen({ navigation }) {
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
    const q = itemsRef.where('userId', '==', user.uid);

    // Store raw items from snapshot; compute heavy stats only on demand or when autoCompute is enabled
    const unsubscribe = q.onSnapshot(
      snapshot => {
        const itemsArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    setStats(prev => ({
      ...prev,
      totalItems,
      totalValue,
      outOfStock,
      totalSales,
    }));
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

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
                  {username ? ` ${username}` : ''}
                </Text>
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
            <View
              style={[
                styles.quickStatCard,
                stats.outOfStock > 0 ? styles.dangerCard : styles.infoCard,
              ]}
            >
              <Ionicons name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>{stats.outOfStock}</Text>
              <Text style={styles.quickStatLabel}>Out of Stock</Text>
            </View>
            <View style={[styles.quickStatCard, styles.infoCard]}>
              <Ionicons name="wallet-outline" size={24} color="#fff" />
              <Text style={styles.quickStatValue}>₱{stats.totalSales.toFixed(2)}</Text>
              <Text style={styles.quickStatLabel}>Total Revenue</Text>
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

        {/* Recent Items */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          {items.slice(0, 5).map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentItemCard}
              onPress={() => navigation.navigate('Inventory')}
            >
              <View style={styles.recentItemContent}>
                <View style={styles.recentItemMain}>
                  <Text style={styles.recentItemName}>{item.name}</Text>
                  <Text style={styles.recentItemCode}>#{item.productCode}</Text>
                  <View style={styles.recentItemDetails}>
                    <View style={styles.recentItemDetail}>
                      <Ionicons name="cube-outline" size={16} color="#666" />
                      <Text style={styles.recentItemDetailText}>
                        {item.currentStock} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.recentItemDetail}>
                      <Ionicons name="pricetag-outline" size={16} color="#666" />
                      <Text style={styles.recentItemDetailText}>₱{item.price?.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.recentItemSide}>
                  {item.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.stockStatus,
                      item.currentStock === 0
                        ? styles.stockStatusEmpty
                        : item.currentStock < item.minimumStock
                          ? styles.stockStatusLow
                          : styles.stockStatusGood,
                    ]}
                  >
                    <Text style={styles.stockStatusText}>
                      {item.currentStock === 0
                        ? 'Empty'
                        : item.currentStock < item.minimumStock
                          ? 'Low'
                          : 'Good'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <HelpModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
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
    gap: 10, // Add gap between icons
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
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
    width: '48%', // Roughly half, accounting for gap
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
  recentItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentItemContent: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentItemMain: {
    flex: 1,
  },
  recentItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recentItemCode: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  recentItemDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  recentItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentItemDetailText: {
    fontSize: 14,
    color: '#666',
  },
  recentItemSide: {
    alignItems: 'flex-end',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  stockStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockStatusGood: {
    backgroundColor: '#E8F5E9',
  },
  stockStatusLow: {
    backgroundColor: '#FFF3E0',
  },
  stockStatusEmpty: {
    backgroundColor: '#FFEBEE',
  },
  stockStatusText: {
    fontSize: 12,
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
    gap: 10,
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
});
