import { ScrollView, StyleSheet } from 'react-native';
import {
    Button,
    Divider,
    Modal,
    Portal,
    Surface,
    Text,
    Title,
    useTheme,
} from 'react-native-paper';

const HelpModalMaterial = ({ visible, onClose }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Surface style={styles.modalContent} elevation={3}>
          <Title style={styles.modalTitle}>User Guide</Title>
          <Divider style={styles.divider} />
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Dashboard Overview
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Total Items:</Text>{" Shows the complete count of inventory items in your hardware store."}</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Total Value:</Text>{" Current monetary worth of all inventory (₱ price × stock quantity)."}</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Out of Stock:</Text>{" Items needing immediate restocking. Tap the card to see which items."}</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Total Revenue:</Text>{" Sales performance from all transactions. Tap to view detailed analytics."}</Text>
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Navigation Guide
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Manage Inventory:</Text>{" Access the complete inventory monitoring system with search and filters."}</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Back Buttons:</Text>{" Use \"← Back\" buttons to return to the dashboard from any screen."}</Text>
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ fontWeight: 'bold' }}>Recent Activity:</Text>{" Monitor the latest inventory changes and system updates."}</Text>
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Inventory Monitoring
            </Text>
            
            <Text variant="titleSmall" style={styles.subSectionTitle}>
              Real-Time Monitoring
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              View live inventory data with automatic updates. This system is designed for monitoring only - no editing capabilities to ensure data integrity.
            </Text>

            <Text variant="titleSmall" style={styles.subSectionTitle}>
              Stock Status Indicators
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text>{"• "}<Text style={{ color: theme.colors.secondary }}>Green:</Text>{" In Stock - Adequate inventory levels"}</Text>
              {'\n'}<Text>{"• "}<Text style={{ color: theme.colors.tertiary }}>Orange:</Text>{" Low Stock - Below minimum threshold"}</Text>
              {'\n'}<Text>{"• "}<Text style={{ color: theme.colors.error }}>Red:</Text>{" Out of Stock - Immediate attention needed"}</Text>
            </Text>

            <Text variant="titleSmall" style={styles.subSectionTitle}>
              Search & Filter Tools
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              Use the search bar and filter options to find specific hardware items by name, product code, category, or stock status. Sort by name, stock level, or price.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Sales Analytics
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              Access comprehensive sales reports showing revenue trends, top-selling products, customer analytics, and payment method breakdowns. Filter by time periods for detailed insights.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              System Settings
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              Configure app preferences including currency display, refresh intervals, notifications, and auto-backup settings. Access help and support options from the settings menu.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              About This System
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Metro Manila Hills Hardware Inventory</Text> is a monitoring-focused system designed for real-time inventory oversight, sales analytics, and business intelligence for hardware retail operations.
            </Text>
          </ScrollView>

          <Divider style={styles.divider} />
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
            contentStyle={styles.closeButtonContent}
          >
            Got it!
          </Button>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '85%',
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  scrollView: {
    maxHeight: 400,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subSectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  sectionContent: {
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionDivider: {
    marginVertical: 12,
  },
  closeButton: {
    marginTop: 16,
  },
  closeButtonContent: {
    paddingVertical: 4,
  },
});

export default HelpModalMaterial;