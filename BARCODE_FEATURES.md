# Barcode & POS Features

## Overview
Your hardware inventory app now includes comprehensive barcode scanning capabilities and a Point of Sale (POS) system for quick checkout.

## New Features

### 1. Barcode Scanner Component
- **Location**: `src/components/BarcodeScanner.js`
- **Features**:
  - Camera permission handling
  - Real-time barcode/QR code scanning
  - Support for multiple barcode formats (EAN-13, UPC, QR codes, etc.)
  - Visual scanning frame with instructions
  - Scan again functionality

### 2. Point of Sale (POS) Screen
- **Location**: `src/screens/POSScreenMaterial.js`
- **Access**: Home → Quick Actions → "Point of Sale"
- **Features**:
  - Quick barcode scanning to add products to cart
  - Real-time cart management
  - Quantity adjustment with stock validation
  - Live total calculation
  - Customer name entry (optional)
  - One-tap checkout
  - Automatic inventory stock updates
  - Sales record creation

**How to Use POS**:
1. Tap "Point of Sale" from the home screen
2. Tap the "Scan" FAB button
3. Scan product barcodes to add items to cart
4. Adjust quantities using +/- buttons
5. Tap "Checkout" when ready
6. Enter customer name (optional)
7. Confirm sale

### 3. Product Form with Barcode
- **Location**: `src/screens/ProductFormMaterial.js`
- **Access**: Home → Quick Actions → "Add Product"
- **Features**:
  - Add new products with barcode scanning
  - Edit existing products
  - Scan existing barcodes to find products
  - Generate barcodes automatically
  - Duplicate barcode detection
  - Complete product information entry
  - Stock management fields

**How to Add Products**:
1. Tap "Add Product" from the home screen
2. Scan or generate a barcode
3. Fill in product details (name, price, stock, etc.)
4. Tap "Add Product" to save

**How to Edit Products**:
1. Go to Inventory screen
2. Tap the pencil icon on any product card
3. Update product information
4. Tap "Update" to save changes

### 4. Enhanced Inventory Cards
- **Location**: `src/components/InventoryCard.js`
- **Features**:
  - Display barcode information
  - Quick edit button
  - Direct navigation to product form

## Database Schema Updates

Products now include a `barcode` field:
```javascript
{
  name: string,
  productCode: string,
  barcode: string,        // NEW: Barcode/QR code
  category: string,
  price: number,
  currentStock: number,
  minimumStock: number,
  reorderPoint: number,
  description: string,
  userId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

Sales records are created with:
```javascript
{
  userId: string,
  customerName: string,
  items: [{
    productId: string,
    name: string,
    quantity: number,
    price: number,
    total: number
  }],
  totalAmount: number,
  timestamp: timestamp,
  paymentMethod: string
}
```

## Barcode Formats Supported
- EAN-13 (most common retail barcodes)
- EAN-8
- UPC-A
- UPC-E
- Code 39
- Code 93
- Code 128
- QR Codes
- Data Matrix
- PDF417
- And more...

## Workflow Examples

### Adding Products with Barcodes
1. Receive new hardware inventory
2. Open "Add Product" screen
3. Scan manufacturer barcode or generate new one
4. Enter product details
5. Save product

### Quick POS Checkout
1. Customer brings items to counter
2. Open POS screen
3. Scan each item's barcode
4. Review cart and adjust quantities
5. Enter customer name (optional)
6. Complete checkout
7. Stock automatically updated

### Updating Product Information
1. Go to Inventory screen
2. Find product (use search/filters)
3. Tap edit button
4. Update information
5. Save changes

## Tips & Best Practices

1. **Barcode Generation**: Use the "Generate" button to create unique barcodes for products without manufacturer barcodes
2. **Stock Validation**: POS system prevents selling more than available stock
3. **Duplicate Detection**: System alerts if scanning a barcode that already exists
4. **Camera Permissions**: Grant camera access when prompted for scanning features
5. **Lighting**: Ensure good lighting when scanning barcodes for best results
6. **Distance**: Hold device 6-12 inches from barcode for optimal scanning

## Navigation Structure

```
Home Screen
├── Point of Sale (NEW)
│   └── Barcode Scanner
├── Add Product (NEW)
│   └── Barcode Scanner
└── Manage Inventory
    └── Edit Product (NEW)
        └── Barcode Scanner
```

## Dependencies Added
- `expo-barcode-scanner`: For barcode/QR code scanning functionality

## Next Steps

Consider adding:
- Print receipt functionality
- Barcode label printing
- Bulk product import via CSV with barcodes
- Product search by barcode in inventory
- Sales history with barcode tracking
- Multi-payment method support
- Discount/promotion codes
