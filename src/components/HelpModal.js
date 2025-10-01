import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HelpModal = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Total Items:</Text> The total number of unique inventory items you currently have.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Total Value:</Text> The combined monetary value of all your current inventory (price * current stock for all items).
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Out of Stock:</Text> The number of items that currently have zero stock.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Total Revenue:</Text> The total sales generated from all orders.
            </Text>

            <Text style={styles.sectionTitle}>Inventory Health</Text>
            <Text style={styles.sectionContent}>
              This section provides a deeper look into the status and performance of your inventory.
            </Text>

            <Text style={styles.subSectionTitle}>Total Value Breakdown</Text>
            <Text style={styles.sectionContent}>
              Categorizes your inventory items based on their individual value (price * current stock):
              <Text style={{ fontWeight: 'bold' }}> High Value</Text> ({'>'} ₱1000),
              <Text style={{ fontWeight: 'bold' }}> Medium Value</Text> (₱100 - ₱1000), and
              <Text style={{ fontWeight: 'bold' }}> Low Value</Text> ({'<'} ₱100).
            </Text>

            <Text style={styles.subSectionTitle}>Stock Status</Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Optimal:</Text> Items with stock levels within their defined minimum and maximum thresholds.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Overstocked:</Text> Items with stock levels exceeding their maximum threshold, potentially leading to holding costs.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Understocked:</Text> Items with stock levels below their minimum threshold, risking stockouts.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Dead Stock:</Text> Items with current stock but no recorded usage, indicating they are not selling.
            </Text>

            <Text style={styles.subSectionTitle}>Performance Metrics</Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Turnover Rate:</Text> Measures how many times inventory is sold or used over a period. A higher rate generally indicates efficient sales.
            </Text>
            <Text style={styles.sectionContent}>
              - <Text style={{ fontWeight: 'bold' }}>Value Distribution:</Text> A summary of how many items fall into high, medium, and low value categories.
            </Text>

            <Text style={styles.subSectionTitle}>Top Performing Items</Text>
            <Text style={styles.sectionContent}>
              Lists your top 5 items based on their sales performance (price * usage).
            </Text>

            <Text style={styles.sectionTitle}>Inventory Management Actions</Text>
            <Text style={styles.sectionContent}>
              This section explains how to perform key actions within the Inventory screen.
            </Text>

            <Text style={styles.subSectionTitle}>Adding New Items</Text>
            <Text style={styles.sectionContent}>
              To add a new item, tap the "<Text style={{ fontWeight: 'bold' }}>Add Item</Text>" button in the header. Fill in the item's name, product code, category, stock levels, price, and unit. You can also use the scanner to input the product code.
            </Text>

            <Text style={styles.subSectionTitle}>Deleting Items</Text>
            <Text style={styles.sectionContent}>
              To delete an item, find it in the list and tap the "<Text style={{ fontWeight: 'bold' }}>Delete</Text>" button (trash icon) on its card. A confirmation prompt will appear before deletion.
            </Text>

            <Text style={styles.subSectionTitle}>Using the Barcode Scanner</Text>
            <Text style={styles.sectionContent}>
              The barcode scanner can be accessed from the "Add Item" or "Edit Item" forms, or directly via the "<Text style={{ fontWeight: 'bold' }}>Scan Item Barcode</Text>" button in Quick Stock Update mode. Point your camera at a barcode to scan it.
            </Text>

            <Text style={styles.subSectionTitle}>Quick Stock Update</Text>
            <Text style={styles.sectionContent}>
              Tap the "<Text style={{ fontWeight: 'bold' }}>Quick Update</Text>" button in the header to enter this mode. Enter the amount you wish to add or subtract, then scan an item's barcode to instantly update its stock.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 15,
    marginBottom: 5,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default HelpModal;
