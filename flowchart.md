# Full App Flowchart

## Overall Navigation Flow

```mermaid
graph TD
    A[App Start] --> B[Initialize Firebase Auth]
    B --> C{User Authenticated?}
    C -->|No| D[Loading Screen]
    D --> E[Login Screen]
    E --> F[User Logs In]
    F --> G[Authenticated Stack]
    C -->|Yes| G

    subgraph Authenticated Stack
      G --> H[Main Tabs]
      H --> H1[Home Tab]
      H --> H2[Inventory Tab]
      H --> H3[Settings Tab]
      G --> I[SalesDetails Screen]
    end

    H1 --> J[Home Screen]
    J --> K[Navigate to Inventory Screen]
    J --> L[Navigate to Settings Screen]
    J --> M[Logout]

    H2 --> N[Inventory Screen]
    N --> O[Add/Edit/Delete Items]
    N --> P[Barcode Scanner]
    N --> Q[Quick Stock Update]

    H3 --> R[Settings Screen]
    R --> S[User Preferences]
    R --> T[System Settings]
    R --> U[Account Management]
    U --> V[Logout]

    G --> W[SignUp Screen]
    E --> W
    W --> E
```

## Screen Details

### Login Screen
- User inputs email and password
- On success, navigates to authenticated stack
- Link to SignUp screen

### SignUp Screen
- User inputs email, username, password, confirm password
- On success, navigates to Login screen

### Home Screen
- Displays welcome message with username
- Shows quick stats: total items, total value, out of stock, total revenue
- Quick actions: navigate to Inventory screen
- Buttons for Settings and Help modal
- Logout button signs out user

### Inventory Screen
- Displays list of inventory items with search and category filter
- Add new item form with barcode scanner support
- Edit and delete items
- Quick stock update mode with barcode scanning
- Real-time updates from Firestore stock movements and sales collections

### Settings Screen
- User preferences: email notifications, low stock alerts, currency
- System settings: low stock threshold, refresh interval
- Account management: view profile, logout

### SalesDetails Screen
- Displays sales data for the authenticated user
- Shows product code, quantity sold, date, and price

## Data Flow

```mermaid
graph LR
    A[Firebase Auth] --> B[User Authentication]
    C[Firestore Database] --> D[Inventory Collection]
    C --> E[Sales Collection]
    D --> F[Home & Inventory Screens]
    E --> F
    B --> G[Conditional Navigation]
```

## Component Hierarchy

- App.js (Main entry point)
  - NavigationContainer
    - Stack.Navigator
      - LoginScreen
      - SignUpScreen
      - MainTabs (Bottom Tab Navigator)
        - HomeScreen
        - InventoryScreen
        - SettingsScreen
      - SalesDetailsScreen
