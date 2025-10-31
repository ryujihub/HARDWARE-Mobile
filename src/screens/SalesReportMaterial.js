import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Card,
  Chip,
  DataTable,
  Divider,
  List,
  Surface,
  Text,
  Title,
  useTheme,
} from 'react-native-paper';
import { db } from '../config/firebase';

export default function SalesReportMaterial({ navigation }) {
  const theme = useTheme();
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [analytics, setAnalytics] = useState({});

  const periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  useEffect(() => {
    const ordersCollection = collection(db, 'orders');
    const ordersQuery = query(ordersCollection, orderBy('createdAt', 'desc'));

    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      snapshot => {
        const fetchedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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

  useEffect(() => {
    if (ordersData.length > 0) {
      calculateAnalytics(ordersData);
    }
  }, [selectedPeriod, ordersData]);

  const calculateAnalytics = orders => {
    const filteredOrders = filterOrdersByPeriod(orders, selectedPeriod);

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      const status = (
        order.status ||
        order.orderStatus ||
        order.state ||
        'completed'
      ).toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

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
              price: item.price || 0,
            };
          }
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

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
          revenue: order.total || 0,
        };
      }
    });

    const topCustomers = Object.entries(customerSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setAnalytics({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      statusBreakdown,
      paymentBreakdown,
      topProducts,
      topCustomers,
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
    calculateAnalytics(ordersData);
    setRefreshing(false);
  }, [ordersData, selectedPeriod]);

  const getStatusChipProps = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          mode: 'flat',
          style: { backgroundColor: theme.colors.secondaryContainer },
          textStyle: { color: theme.colors.secondary },
        };
      case 'pending':
        return {
          mode: 'flat',
          style: { backgroundColor: theme.colors.tertiaryContainer },
          textStyle: { color: theme.colors.tertiary },
        };
      case 'cancelled':
        return {
          mode: 'flat',
          style: { backgroundColor: theme.colors.errorContainer },
          textStyle: { color: theme.colors.error },
        };
      default:
        return { mode: 'outlined' };
    }
  };

  if (loading) {
    return (
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading sales report...</Text>
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
        {/* Period Filter */}
        <Card style={styles.filterCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Time Period
            </Text>
            <View style={styles.chipContainer}>
              {periodOptions.map(option => (
                <Chip
                  key={option.value}
                  mode={selectedPeriod === option.value ? 'flat' : 'outlined'}
                  selected={selectedPeriod === option.value}
                  onPress={() => setSelectedPeriod(option.value)}
                  style={styles.chip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <Card
            style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}
            mode="elevated"
          >
            <Card.Content style={styles.summaryContent}>
              <Ionicons name="cash" size={32} color={theme.colors.primary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
                ₱{analytics.totalRevenue?.toFixed(0) || '0'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                Total Revenue
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.summaryCard, { backgroundColor: theme.colors.secondaryContainer }]}
            mode="elevated"
          >
            <Card.Content style={styles.summaryContent}>
              <Ionicons name="receipt" size={32} color={theme.colors.secondary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.secondary }}>
                {analytics.totalOrders || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                Total Orders
              </Text>
            </Card.Content>
          </Card>

          <Card
            style={[styles.summaryCard, { backgroundColor: theme.colors.tertiaryContainer }]}
            mode="elevated"
          >
            <Card.Content style={styles.summaryContent}>
              <Ionicons name="trending-up" size={32} color={theme.colors.tertiary} />
              <Text variant="headlineMedium" style={{ color: theme.colors.tertiary }}>
                ₱{analytics.averageOrderValue?.toFixed(0) || '0'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onTertiaryContainer }}>
                Avg Order Value
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Order Status Breakdown */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>Order Status</Title>
            <Divider style={styles.divider} />
            <View style={styles.statusContainer}>
              {Object.entries(analytics.statusBreakdown || {}).map(([status, count]) => (
                <View key={status} style={styles.statusItem}>
                  <Chip {...getStatusChipProps(status)} compact>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Chip>
                  <Text variant="titleMedium">{count}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Top Products */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>Top Products</Title>
            <Divider style={styles.divider} />
            {analytics.topProducts?.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Product</DataTable.Title>
                  <DataTable.Title numeric>Qty</DataTable.Title>
                  <DataTable.Title numeric>Revenue</DataTable.Title>
                </DataTable.Header>
                {analytics.topProducts.map((product, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{product.name}</DataTable.Cell>
                    <DataTable.Cell numeric>{product.quantity}</DataTable.Cell>
                    <DataTable.Cell numeric>₱{product.revenue.toFixed(2)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text style={styles.noDataText}>No product data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Top Customers */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>Top Customers</Title>
            <Divider style={styles.divider} />
            {analytics.topCustomers?.length > 0 ? (
              analytics.topCustomers.map((customer, index) => (
                <List.Item
                  key={index}
                  title={customer.name}
                  description={`${customer.orders} orders`}
                  left={props => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                      ₱{customer.revenue.toFixed(2)}
                    </Text>
                  )}
                />
              ))
            ) : (
              <Text style={styles.noDataText}>No customer data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Payment Methods */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Title>Payment Methods</Title>
            <Divider style={styles.divider} />
            {Object.entries(analytics.paymentBreakdown || {}).map(([method, amount]) => (
              <List.Item
                key={method}
                title={method}
                left={props => <List.Icon {...props} icon="credit-card" />}
                right={() => (
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                    ₱{amount.toFixed(2)}
                  </Text>
                )}
              />
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
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
    marginTop: 16,
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
  },
  summaryCard: {
    width: '47%',
    marginBottom: 8,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    alignItems: 'center',
    gap: 8,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.7,
  },
});
