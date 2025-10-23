import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
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
import { db } from '../config/firebase';

export default function SalesReport({ navigation }) {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      snapshot => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrdersData(fetchedOrders);
        calculateAnalytics(fetchedOrders);
        setLoading(false);
      },
      error => {
        console.error('Error fetching orders data:', error);
        setError('Failed to load sales data');
        setLoading(false);
      },
    );

    return () => unsubscribeOrders();
  }, []);

  const calculateAnalytics = (orders) => {
    const filteredOrders = filterOrdersByPeriod(orders, selectedPeriod);

    // Basic metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown - Check multiple possible field names
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      // Try different possible status field names, default to 'completed' if not set
      const status = (order.status || order.orderStatus || order.state || 'completed').toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Debug: Log status breakdown and sample order
    console.log('Status breakdown:', statusBreakdown);
    console.log('Sample order:', filteredOrders[0]);
    console.log('All orders:', filteredOrders.length);

    // Payment method breakdown
    const paymentBreakdown = filteredOrders.reduce((acc, order) => {
      const method = order.paymentMethod || 'Cash';
      acc[method] = (acc[method] || 0) + (order.total || 0);
      return acc;
    }, {});

    // Top products
    const productSales = {};
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const productName = item.name || item.productName || 'Unknown Product';
          const quantity = item.quantity || 1;
          const revenue = (item.price || 0) * quantity;

          if (productSales[productName]) {
            productSales[productName].quantity += quantity;
            productSales[productName].revenue += revenue;
          } else {
            productSales[productName] = {
              quantity,
              revenue,
              price: item.price || 0
            };
          }
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers
    const customerSales = {};
    filteredOrders.forEach(order => {
      const customer = order.customerName || 'Walk-in Customer';
      if (customerSales[customer]) {
        customerSales[customer].orders += 1;
        customerSales[customer].revenue += order.total || 0;
      } else {
        customerSales[customer] = {
          orders: 1,
          revenue: order.total || 0
        };
      }
    });

    const topCustomers = Object.entries(customerSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales trend (last 30 days)
    const dailySales = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    filteredOrders.forEach(order => {
      if (order.createdAt) {
        const date = new Date(order.createdAt.toDate());
        if (date >= thirtyDaysAgo) {
          const dateKey = date.toISOString().split('T')[0];
          if (dailySales[dateKey]) {
            dailySales[dateKey].revenue += order.total || 0;
            dailySales[dateKey].orders += 1;
          } else {
            dailySales[dateKey] = {
              revenue: order.total || 0,
              orders: 1
            };
          }
        }
      }
    });

    const salesTrend = Object.entries(dailySales)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setAnalytics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      statusBreakdown,
      paymentBreakdown,
      topProducts,
      topCustomers,
      salesTrend,
      completedOrders: statusBreakdown['completed'] || 0,
      pendingOrders: statusBreakdown['pending'] || 0,
      cancelledOrders: statusBreakdown['cancelled'] || 0,
    });
  };

  const filterOrdersByPeriod = (orders, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return orders;
    }

    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt.toDate());
      return orderDate >= startDate;
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Recalculate analytics with current period
    calculateAnalytics(ordersData);
    setRefreshing(false);
  }, [ordersData, selectedPeriod]);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
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



  const renderPeriodFilter = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {[
          { key: 'all', label: 'All Time' },
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
        ].map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.filterButton,
              selectedPeriod === period.key && styles.filterButtonActive
            ]}
            onPress={() => {
              setSelectedPeriod(period.key);
              calculateAnalytics(ordersData);
            }}
          >
            <Text style={[
              styles.filterButtonText,
              selectedPeriod === period.key && styles.filterButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sales report...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Sales Analytics</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>
        </View>

        {/* Period Filter */}
        {renderPeriodFilter()}

        {/* Enhanced Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₱{analytics.totalRevenue?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{analytics.totalOrders || 0}</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Average Order</Text>
            <Text style={styles.summaryValue}>₱{analytics.averageOrderValue?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{analytics.completedOrders || 0}</Text>
          </View>
        </View>

        {/* Order Status Breakdown */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusValue}>{analytics.completedOrders || 0}</Text>
              <Text style={styles.statusLabel}>Completed</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusValue}>{analytics.pendingOrders || 0}</Text>
              <Text style={styles.statusLabel}>Pending</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusValue}>{analytics.cancelledOrders || 0}</Text>
              <Text style={styles.statusLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
          </View>
          {Object.keys(analytics.paymentBreakdown || {}).length > 0 ? (
            Object.entries(analytics.paymentBreakdown).map(([method, amount]) => (
              <View key={method} style={styles.paymentCard}>
                <Text style={styles.paymentMethodText}>{method}</Text>
                <Text style={styles.paymentAmount}>₱{amount.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No payment data available</Text>
          )}
        </View>

        {/* Top Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Products</Text>
          </View>
          {analytics.topProducts?.length > 0 ? (
            analytics.topProducts.map((product, index) => (
              <View key={product.name} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productRank}>#{index + 1}</Text>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStats}>
                      {product.quantity} sold • ₱{product.price.toFixed(2)} each
                    </Text>
                  </View>
                </View>
                <Text style={styles.productRevenue}>₱{product.revenue.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No product data available</Text>
          )}
        </View>

        {/* Top Customers */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Customers</Text>
          </View>
          {analytics.topCustomers?.length > 0 ? (
            analytics.topCustomers.map((customer, index) => (
              <View key={customer.name} style={styles.customerCard}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerRank}>#{index + 1}</Text>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerStats}>
                      {customer.orders} orders
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerRevenue}>₱{customer.revenue.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No customer data available</Text>
          )}
        </View>



        {/* Recent Orders */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </View>

          {ordersData.length === 0 ? (
            <Text style={styles.noDataText}>No sales data available</Text>
          ) : (
            ordersData.slice(0, 10).map(order => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id?.slice(-6) || 'N/A'}</Text>
                    <Text style={styles.orderDate}>
                      {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.orderAmount}>₱{order.total?.toFixed(2) || '0.00'}</Text>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.customerName}>
                    {order.customerName || 'Walk-in Customer'}
                  </Text>

                  {order.items && order.items.length > 0 && (
                    <View style={styles.itemsContainer}>
                      {order.items.slice(0, 2).map((item, index) => (
                        <Text key={index} style={styles.orderItem}>
                          • {item.name || item.productName || 'Item'} × {item.quantity || 1}
                        </Text>
                      ))}
                      {order.items.length > 2 && (
                        <Text style={styles.orderItem}>• ... and {order.items.length - 2} more items</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.orderMeta}>
                    <Text style={styles.paymentMethod}>
                      {order.paymentMethod || 'Cash'}
                    </Text>
                    {order.status && (
                      <Text style={[styles.orderStatus, getStatusStyle(order.status)]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                      </Text>
                    )}
                  </View>
                </View>

                {order.createdAt && (
                  <Text style={styles.orderTime}>
                    {new Date(order.createdAt.toDate()).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  sectionContainer: {
    padding: 15,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemsContainer: {
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 14,
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
  orderTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 30,
  },
  productDetails: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productStats: {
    fontSize: 12,
    color: '#666',
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  customerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 30,
  },
  customerDetails: {
    flex: 1,
    marginLeft: 10,
  },
  customerStats: {
    fontSize: 12,
    color: '#666',
  },
  customerRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
});
