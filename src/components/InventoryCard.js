import { StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  Chip,
  Divider,
  Text,
  useTheme
} from 'react-native-paper';

export default function InventoryCard({ item }) {
  const theme = useTheme();

  const getStockStatus = () => {
    const currentStock = item.currentStock || 0;
    const threshold = item.reorderPoint || 0;

    if (currentStock === 0) {
      return { label: 'Out of Stock', color: theme.colors.error, backgroundColor: theme.colors.errorContainer };
    } else if (currentStock <= threshold) {
      return { label: 'Low Stock', color: theme.colors.tertiary, backgroundColor: theme.colors.tertiaryContainer };
    } else {
      return { label: 'In Stock', color: theme.colors.secondary, backgroundColor: theme.colors.secondaryContainer };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <Avatar.Icon
            size={40}
            icon="package-variant"
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
          <View style={styles.headerText}>
            <Text variant="titleMedium" numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              #{item.productCode}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.content}>
          <View style={styles.stockInfo}>
            <View style={styles.stockRow}>
              <Text variant="bodyMedium">Current Stock:</Text>
              <Text variant="titleMedium" style={{ color: stockStatus.color }}>
                {item.currentStock || 0} {item.unit}
              </Text>
            </View>
            <View style={styles.stockRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Target Stock: {item.minimumStock || 0} {item.unit}
              </Text>
              <Chip
                mode="outlined"
                compact
                textStyle={{ fontSize: 12, color: stockStatus.color }}
                style={{ borderColor: stockStatus.color, backgroundColor: stockStatus.backgroundColor }}
              >
                {stockStatus.label}
              </Chip>
            </View>
          </View>

          <View style={styles.priceInfo}>
            <View style={styles.priceRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Price:
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                ₱{item.price?.toFixed(2)}
              </Text>
            </View>
            {item.cost && (
              <View style={styles.priceRow}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Cost:
                </Text>
                <Text variant="bodyMedium">
                  ₱{item.cost?.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {item.category && (
            <View style={styles.categoryRow}>
              <Chip
                mode="flat"
                compact
                icon="tag"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              >
                {item.category}
              </Chip>
            </View>
          )}
        </View>


      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },

  divider: {
    marginVertical: 12,
  },
  content: {
    gap: 12,
  },
  stockInfo: {
    gap: 8,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    alignItems: 'flex-start',
  },

});