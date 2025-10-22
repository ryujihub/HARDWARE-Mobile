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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

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

  const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0);

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
              <Text style={styles.headerTitle}>Sales Report</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₱{totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{ordersData.length}</Text>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
          </View>

          {ordersData.length === 0 ? (
            <Text style={styles.noDataText}>No sales data available</Text>
          ) : (
            ordersData.map(order => (
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
                      {order.items.map((item, index) => (
                        <Text key={index} style={styles.orderItem}>
                          • {item.name || item.productName || 'Item'} × {item.quantity || 1}
                        </Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.orderMeta}>
                    <Text style={styles.paymentMethod}>
                      {order.paymentMethod || 'Cash'}
                    </Text>
                    {order.status && (
                      <Text style={[styles.orderStatus, getStatusStyle(order.status)]}>
                        {order.status}
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
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 30,
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
});
