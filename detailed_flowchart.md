flowchart TD
  %% Authentication flow
  LoginScreen["Login Screen"]
  SignUpScreen["Sign Up Screen"]
  MainTabs["Main Tabs (Bottom Tab Navigator)"]
  SalesDetailsScreen["Sales Details Screen"]

  %% Tabs
  HomeTab["Home Screen"]
  InventoryTab["Inventory Screen"]
  SettingsTab["Settings Screen"]

  %% Authentication transitions
  LoginScreen -->|Login Success| MainTabs
  LoginScreen -->|Go to Sign Up| SignUpScreen
  SignUpScreen -->|Sign Up Success| MainTabs
  SignUpScreen -->|Back to Login| LoginScreen

  %% Main Tabs navigation
  MainTabs --> HomeTab
  MainTabs --> InventoryTab
  MainTabs --> SettingsTab
  MainTabs --> SalesDetailsScreen

  %% Tab navigation
  HomeTab -->|Navigate to Inventory| InventoryTab
  HomeTab -->|Navigate to Settings| SettingsTab
  InventoryTab -->|Navigate to Home| HomeTab
  SettingsTab -->|Navigate to Home| HomeTab

  %% Styling nodes
  classDef auth fill:#f9f,stroke:#333,stroke-width:2px;
  classDef tabs fill:#bbf,stroke:#333,stroke-width:2px;
  classDef screens fill:#bfb,stroke:#333,stroke-width:2px;

  class LoginScreen,SignUpScreen auth;
  class MainTabs tabs;
  class HomeTab,InventoryTab,SettingsTab,SalesDetailsScreen screens;
```
This detailed flowchart shows:

- The authentication flow between Login and Sign Up screens.
- The main tab navigator with Home, Inventory, and Settings tabs.
- The Sales Details screen accessible from the stack navigator.
- Navigation transitions between tabs and screens.
- Nodes styled by category for clarity.

You can copy this Mermaid code into a Mermaid live editor (https://mermaid.live) or any Mermaid-compatible Markdown viewer to see the flowchart visually with shapes and arrows.
