import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../config/firebase';

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    categories: 0,
    outOfStock: 0,
    highValue: 0,
    totalSales: 0,
    topCategory: '',
    topSellingItem: '',
    monthlyGrowth: 0,
    inventoryMetrics: {
      turnoverRate: 0,
      stockValueByCategory: {},
      inventoryHealth: {
        optimal: 0,
        overstocked: 0,
        understocked: 0,
        deadStock: 0,
      },
      topPerformingItems: [],
      categoryPerformance: {},
      stockValueDistribution: {
        highValue: 0,
        mediumValue: 0,
        lowValue: 0,
      },
    },
  });
  const [autoCompute, setAutoCompute] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [lastComputedAt, setLastComputedAt] = useState(null);
  const [statsStale, setStatsStale] = useState(false);
  const [username, setUsername] = useState('');

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
        // mark stats stale so user can recompute on demand
        setStatsStale(true);
        if (autoCompute) {
          computeHeavyStats(itemsArray);
        }
      },
      error => {
        console.error('Error fetching items:', error);
        setError('Failed to load items');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [autoCompute, computeHeavyStats]);

  // compute function extracted for on-demand use
  const computeHeavyStats = React.useCallback(itemsArray => {
    try {
      setMetricsLoading(true);

      const totalValue = itemsArray.reduce((sum, item) => sum + (item.price || 0) * (item.currentStock || 0), 0);
      const lowStock = itemsArray.filter(item => item.currentStock < item.minimumStock && item.currentStock > 0).length;
      const outOfStock = itemsArray.filter(item => item.currentStock === 0).length;
      const categories = new Set(itemsArray.map(item => item.category)).size;
      const highValue = itemsArray.filter(item => (item.price || 0) * (item.currentStock || 0) > 1000).length;

      const totalSales = itemsArray.reduce((sum, item) => sum + (item.price || 0) * (item.usage || 0), 0);
      const prices = itemsArray.map(item => item.price || 0);
      const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const categoryPrices = {};
      itemsArray.forEach(item => {
        if (item.category) {
          if (!categoryPrices[item.category]) categoryPrices[item.category] = [];
          categoryPrices[item.category].push(item.price || 0);
        }
      });

      const categoryAverages = {};
      Object.entries(categoryPrices).forEach(([category, prices]) => {
        categoryAverages[category] = prices.reduce((a, b) => a + b, 0) / prices.length;
      });

      const topCategory = Object.entries(categoryAverages).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      const topPerformingItems = [...itemsArray]
        .sort((a, b) => (b.price || 0) * (b.usage || 0) - (a.price || 0) * (a.usage || 0))
        .slice(0, 5)
        .map(item => ({ name: item.name, sales: (item.price || 0) * (item.usage || 0), stock: item.currentStock }));

      const totalItemsSold = itemsArray.reduce((sum, item) => sum + (item.usage || 0), 0);
      const averageInventory = itemsArray.length > 0 ? itemsArray.reduce((sum, item) => sum + (item.currentStock || 0), 0) / itemsArray.length : 0;
      const turnoverRate = averageInventory > 0 ? (totalItemsSold / averageInventory) * 100 : 0;

      const stockValueByCategory = {};
      itemsArray.forEach(item => {
        if (item.category) {
          const value = (item.price || 0) * (item.currentStock || 0);
          stockValueByCategory[item.category] = (stockValueByCategory[item.category] || 0) + value;
        }
      });

      const inventoryHealth = {
        optimal: itemsArray.filter(item => (item.currentStock || 0) >= (item.minimumStock || 0) && (item.currentStock || 0) <= ((item.maximumStock || (item.minimumStock || 0) * 2))).length,
        overstocked: itemsArray.filter(item => (item.currentStock || 0) > ((item.maximumStock || (item.minimumStock || 0) * 2))).length,
        understocked: itemsArray.filter(item => (item.currentStock || 0) < (item.minimumStock || 0) && (item.currentStock || 0) > 0).length,
        deadStock: itemsArray.filter(item => (item.usage || 0) === 0 && (item.currentStock || 0) > 0).length,
      };

      const stockValueDistribution = {
        highValue: itemsArray.filter(item => (item.price || 0) * (item.currentStock || 0) > 1000).length,
        mediumValue: itemsArray.filter(item => (item.price || 0) * (item.currentStock || 0) >= 100 && (item.price || 0) * (item.currentStock || 0) <= 1000).length,
        lowValue: itemsArray.filter(item => (item.price || 0) * (item.currentStock || 0) < 100).length,
      };

      setStats(prev => ({
        ...prev,
        totalItems: itemsArray.length,
        totalValue,
        lowStock,
        categories,
        outOfStock,
        highValue,
        totalSales,
        topCategory,
        averagePrice,
        inventoryMetrics: {
          turnoverRate,
          stockValueByCategory,
          inventoryHealth,
          topPerformingItems,
          stockValueDistribution,
        },
      }));

      setLastComputedAt(new Date());
      setStatsStale(false);
    } catch (e) {
      console.error('Failed to compute metrics:', e);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // run compute when autoCompute toggles on
  React.useEffect(() => {
    if (autoCompute) {
      computeHeavyStats(items);
    }
  }, [autoCompute, computeHeavyStats, items]);

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
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatsRow}>
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
        </View>
        <View style={styles.quickStatsRow}>
          <View
            style={[
              styles.quickStatCard,
              stats.lowStock > 0 ? styles.warningCard : styles.infoCard,
            ]}
          >
            <Ionicons name="alert-circle-outline" size={24} color="#fff" />
            <Text style={styles.quickStatValue}>{stats.lowStock}</Text>
            <Text style={styles.quickStatLabel}>Low Stock</Text>
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

      {/* Inventory Health */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Inventory Health</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={{ paddingHorizontal: 10, paddingVertical: 6, opacity: metricsLoading ? 0.6 : 1 }}
              onPress={() => !metricsLoading && computeHeavyStats(items)}
              disabled={metricsLoading}
            >
              <Text style={styles.sectionAction}>{metricsLoading ? 'Refreshing...' : 'Refresh Metrics'}</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: statsStale ? '#F57C00' : '#666' }}>{statsStale ? 'Stale' : 'Up-to-date'}</Text>
              <Switch value={autoCompute} onValueChange={val => setAutoCompute(val)} />
              {lastComputedAt && (
                <Text style={{ fontSize: 11, color: '#999' }}>{`Last: ${lastComputedAt.toLocaleString()}`}</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.metricsContainer}>
          {/* Total Value Breakdown */}
          <View style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Ionicons name="cash" size={20} color="#2E7D32" />
              <Text style={styles.metricsTitle}>Total Value Breakdown</Text>
            </View>
            <View style={styles.valueBreakdown}>
              <View style={styles.totalValueRow}>
                <Text style={styles.totalValueLabel}>Total Inventory Value</Text>
                <Text style={styles.totalValueAmount}>₱{stats.totalValue.toFixed(2)}</Text>
              </View>
              <View style={styles.valueBreakdownGrid}>
                <View style={styles.valueBreakdownItem}>
                  <Text style={styles.valueBreakdownLabel}>High Value Items</Text>
                  <Text style={styles.valueBreakdownValue}>
                    ₱
                    {items
                      .filter(item => item.price * item.currentStock > 1000)
                      .reduce((sum, item) => sum + item.price * item.currentStock, 0)
                      .toFixed(2)}
                  </Text>
                  <Text style={styles.valueBreakdownCount}>
                    {stats.inventoryMetrics.stockValueDistribution.highValue} items
                  </Text>
                </View>
                <View style={styles.valueBreakdownItem}>
                  <Text style={styles.valueBreakdownLabel}>Medium Value Items</Text>
                  <Text style={styles.valueBreakdownValue}>
                    ₱
                    {items
                      .filter(
                        item =>
                          item.price * item.currentStock >= 100 &&
                          item.price * item.currentStock <= 1000,
                      )
                      .reduce((sum, item) => sum + item.price * item.currentStock, 0)
                      .toFixed(2)}
                  </Text>
                  <Text style={styles.valueBreakdownCount}>
                    {stats.inventoryMetrics.stockValueDistribution.mediumValue} items
                  </Text>
                </View>
                <View style={styles.valueBreakdownItem}>
                  <Text style={styles.valueBreakdownLabel}>Low Value Items</Text>
                  <Text style={styles.valueBreakdownValue}>
                    ₱
                    {items
                      .filter(item => item.price * item.currentStock < 100)
                      .reduce((sum, item) => sum + item.price * item.currentStock, 0)
                      .toFixed(2)}
                  </Text>
                  <Text style={styles.valueBreakdownCount}>
                    {stats.inventoryMetrics.stockValueDistribution.lowValue} items
                  </Text>
                </View>
              </View>
              <View style={styles.valueInsights}>
                <View style={styles.valueInsightItem}>
                  <Ionicons name="alert-circle" size={16} color="#F57C00" />
                  <Text style={styles.valueInsightText}>
                    {stats.inventoryMetrics.inventoryHealth.overstocked} items are overstocked
                  </Text>
                </View>
                <View style={styles.valueInsightItem}>
                  <Ionicons name="trending-up" size={16} color="#2E7D32" />
                  <Text style={styles.valueInsightText}>
                    {stats.inventoryMetrics.turnoverRate.toFixed(1)}% turnover rate
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Inventory Health Overview */}
          <View style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Ionicons name="pulse" size={20} color="#2E7D32" />
              <Text style={styles.metricsTitle}>Stock Status</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Optimal</Text>
                <Text style={[styles.metricValue, styles.optimalValue]}>
                  {stats.inventoryMetrics.inventoryHealth.optimal}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Overstocked</Text>
                <Text style={[styles.metricValue, styles.warningValue]}>
                  {stats.inventoryMetrics.inventoryHealth.overstocked}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Understocked</Text>
                <Text style={[styles.metricValue, styles.dangerValue]}>
                  {stats.inventoryMetrics.inventoryHealth.understocked}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Dead Stock</Text>
                <Text style={[styles.metricValue, styles.alertValue]}>
                  {stats.inventoryMetrics.inventoryHealth.deadStock}
                </Text>
              </View>
            </View>
          </View>

          {/* Turnover and Value Distribution */}
          <View style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Ionicons name="trending-up" size={20} color="#1565C0" />
              <Text style={styles.metricsTitle}>Performance Metrics</Text>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Turnover Rate</Text>
                <Text style={styles.metricValue}>
                  {stats.inventoryMetrics.turnoverRate.toFixed(1)}%
                </Text>
                <Text style={styles.metricSubtext}>Last 30 days</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Value Distribution</Text>
                <View style={styles.valueDistribution}>
                  <Text style={styles.distributionText}>
                    High: {stats.inventoryMetrics.stockValueDistribution.highValue}
                  </Text>
                  <Text style={styles.distributionText}>
                    Med: {stats.inventoryMetrics.stockValueDistribution.mediumValue}
                  </Text>
                  <Text style={styles.distributionText}>
                    Low: {stats.inventoryMetrics.stockValueDistribution.lowValue}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Top Performing Items */}
          <View style={styles.metricsCard}>
            <View style={styles.metricsHeader}>
              <Ionicons name="star" size={20} color="#F57C00" />
              <Text style={styles.metricsTitle}>Top Performing Items</Text>
            </View>
            <View style={styles.topItemsList}>
              {stats.inventoryMetrics.topPerformingItems.map((item, index) => (
                <View key={index} style={styles.topItemRow}>
                  <Text style={styles.topItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.topItemDetails}>
                    <Text style={styles.topItemSales}>₱{item.sales.toFixed(2)}</Text>
                    <Text style={styles.topItemStock}>Stock: {item.stock}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
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
  settingsButton: {
    padding: 8,
  },
  quickStatsContainer: {
    padding: 15,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  quickStatCard: {
    flex: 1,
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
});
