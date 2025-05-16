# ZK Token Wallet: Solana Compressed Token Management

A modern, feature-rich web interface for managing Solana Compressed Tokens, built with a focus on user experience and leveraging the power of ZK (Zero-Knowledge) compression via Light Protocol.

This wallet allows users to connect their existing Solana wallets, track multiple compressed token mints (both NFTs and fungible-like tokens), view balances and metadata, send tokens, and learn about the underlying technology.

## Key Features

- **Wallet Integration:** Connect seamlessly with popular Solana wallets like Phantom, Solflare, and others supported by Wallet Adapter.
- **Multi-Mint Management:** Track a list of your favorite compressed token mints or specific asset IDs.
- **Balance & Metadata Display:** View balances for all tracked tokens. For NFTs and recognized tokens, metadata such as name and symbol is displayed.
- **Send Compressed Tokens:** Securely send your compressed tokens to other Solana addresses.
- **Education Hub:** In-app modal to learn about ZK compressed tokens, their benefits, and how they work.
- **Modern & Responsive UI:** Built with Chakra UI for a clean, accessible, and responsive experience on all devices.
- **Easy Navigation:** Includes a disconnect button to easily return to the home screen.

## Tech Stack

- React
- Vite
- Chakra UI
- Solana Wallet Adapter
- Solana Web3.js
- Light Protocol SDK (@lightprotocol/stateless.js, @lightprotocol/compressed-token)

## Getting Started

1.  **Clone the repository (if you haven't already).**
2.  **Navigate to the `wallet-ui` directory:**
    ```bash
    cd wallet-ui
    ```
3.  **Install dependencies:**
    Make sure you have Node.js and npm installed. If you used `npm install react@18.2.0 react-dom@18.2.0` previously, ensure all other dependencies are also installed.
    A general install command is usually sufficient:
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on your local development server (typically `http://localhost:5173`).

---

This project aims to provide a comprehensive and user-friendly tool for interacting with the growing ecosystem of compressed tokens on Solana.
