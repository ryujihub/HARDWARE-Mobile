import { ScrollView, StyleSheet } from 'react-native';
import { Button, Divider, Modal, Portal, Surface, Text, Title, useTheme } from 'react-native-paper';

const PrivacyPolicyModal = ({ visible, onClose }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        <Surface style={styles.modalContent} elevation={3}>
          <Title style={styles.modalTitle}>Privacy Policy</Title>
          <Divider style={styles.divider} />

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text variant="bodySmall" style={styles.lastUpdated}>
              Last Updated: October 2024
            </Text>

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Information We Collect
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Account Information:</Text> We collect your email
              address and username for authentication purposes when you create an account.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Inventory Data:</Text> All inventory information
              you input including product names, codes, prices, stock levels, and categories are
              stored securely in our database.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Usage Data:</Text> We collect information about
              how you use the app, including features accessed and system performance data to
              improve our services.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              How We Use Your Information
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Service Provision:</Text> To provide and
              maintain the inventory monitoring system functionality.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Data Security:</Text> To ensure the security
              and integrity of your business data.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>System Improvement:</Text> To analyze usage
              patterns and improve app performance and features.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Support Services:</Text> To provide technical
              support and respond to your inquiries.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Data Storage and Security
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Secure Storage:</Text> Your data is stored using
              Firebase, Google's secure cloud platform with enterprise-grade security measures.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Encryption:</Text> All data transmission is
              encrypted using industry-standard SSL/TLS protocols.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              <Text style={{ fontWeight: 'bold' }}>Access Control:</Text> Only you have access to
              your inventory data through your authenticated account.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Data Sharing
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              We <Text style={{ fontWeight: 'bold' }}>do not sell, trade, or share</Text> your
              personal information or inventory data with third parties, except:
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • When required by law or legal process
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • To protect our rights, property, or safety
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • With your explicit consent
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Your Rights
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Access:</Text> You can access and view all your
              data within the app.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Correction:</Text> You can update and correct
              your information at any time.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Deletion:</Text> You can request deletion of
              your account and associated data.
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              • <Text style={{ fontWeight: 'bold' }}>Export:</Text> You can export your inventory
              data for backup purposes.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Cookies and Tracking
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              This app uses minimal tracking technologies only for essential functionality such as
              maintaining your login session and app preferences. We do not use advertising cookies
              or third-party tracking.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Changes to Privacy Policy
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy in the app. Changes are effective immediately upon
              posting.
            </Text>

            <Divider style={styles.sectionDivider} />

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Contact Information
            </Text>
            <Text variant="bodyMedium" style={styles.sectionContent}>
              If you have any questions about this Privacy Policy or our data practices, please
              contact us through the app's support system or settings menu.
            </Text>

            <Text variant="bodySmall" style={styles.footer}>
              Metro Manila Hills Hardware Inventory System
              {'\n'}Committed to protecting your business data and privacy.
            </Text>
          </ScrollView>

          <Divider style={styles.divider} />
          <Button
            mode="contained"
            onPress={onClose}
            style={styles.closeButton}
            contentStyle={styles.closeButtonContent}
          >
            I Understand
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
    maxHeight: '90%',
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
    maxHeight: 500,
  },
  lastUpdated: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
    opacity: 0.7,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  sectionContent: {
    marginBottom: 8,
    lineHeight: 20,
  },
  sectionDivider: {
    marginVertical: 12,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  closeButton: {
    marginTop: 16,
  },
  closeButtonContent: {
    paddingVertical: 4,
  },
});

export default PrivacyPolicyModal;
