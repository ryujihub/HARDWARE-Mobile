import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Chip,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

export default function InventoryFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  stockFilter,
  onStockFilterChange,
}) {
  const theme = useTheme();

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'stock', label: 'Stock' },
    { value: 'price', label: 'Price' },
  ];

  const stockFilterOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'inStock', label: 'In Stock' },
    { value: 'lowStock', label: 'Low Stock' },
    { value: 'outOfStock', label: 'Out of Stock' },
  ];

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]} elevation={1}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search items..."
        onChangeText={onSearchChange}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={{ fontSize: 16 }}
      />

      {/* Category Filter */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Categories
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          <Chip
            mode={selectedCategory === 'All' ? 'flat' : 'outlined'}
            selected={selectedCategory === 'All'}
            onPress={() => onCategoryChange('All')}
            style={styles.chip}
          >
            All
          </Chip>
          {categories.map(category => (
            <Chip
              key={category}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
              selected={selectedCategory === category}
              onPress={() => onCategoryChange(category)}
              style={styles.chip}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Stock Filter */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Stock Status
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {stockFilterOptions.map(option => (
            <Chip
              key={option.value}
              mode={stockFilter === option.value ? 'flat' : 'outlined'}
              selected={stockFilter === option.value}
              onPress={() => onStockFilterChange(option.value)}
              style={styles.chip}
            >
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Sort By
        </Text>
        <SegmentedButtons
          value={sortBy}
          onValueChange={onSortChange}
          buttons={sortOptions}
          style={styles.segmentedButtons}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  searchbar: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  segmentedButtons: {
    marginTop: 4,
  },
});