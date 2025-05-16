# ZK Compressed Token Wallet UI

A modern web wallet designed for managing Solana ZK (Zero-Knowledge) Compressed Tokens, built with React, Vite, and Chakra UI. It allows users to connect their Solana wallets, view token balances and metadata for compressed tokens, manage a list of mint addresses, and send these tokens, all through a user-friendly interface.

## Key Features

- **Wallet Connectivity:** Seamlessly connect with popular Solana wallets (Phantom, Solflare, etc.) using Solana Wallet Adapter.
- **Compressed Token Support:** Fetch and display balances for state-compressed tokens via Light Protocol.
- **Token Metadata Display:** View on-chain (name, symbol) and off-chain (image, description) metadata for selected tokens using Metaplex Umi.
- **Multiple Mint Management:** Add, save (to localStorage), select, and remove multiple compressed token mint addresses.
- **Send Functionality:** Transfer compressed tokens to other Solana addresses.
- **Educational Hub:** In-app modal explaining ZK compressed tokens and wallet usage.
- **Modern & Responsive UI:** Built with Chakra UI for a sleek, professional, and responsive user experience.
- **Toast Notifications:** Informative feedback for user actions.

## Technologies Used

- **Frontend:** React 18, Vite
- **UI Library:** Chakra UI
- **Solana Integration:**
  - `@solana/wallet-adapter-react`
  - `@solana/web3.js`
- **Compressed Token Interaction:**
  - `@lightprotocol/stateless.js`
  - `@lightprotocol/compressed-token`
- **Token Metadata:**
  - `@metaplex-foundation/umi`
- **State Management:** React Hooks (useState, useEffect, useMemo), localStorage
- **Build Tool:** Vite
- **Deployment:** Vercel

## Prerequisites

- Node.js (v18.x or later recommended)
- npm (v9.x or later) or yarn

## Local Development Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-name>/wallet-ui
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

    (If you encounter peer dependency issues, you might need to use `npm install --legacy-peer-deps` or resolve them manually, though the current setup aims to minimize this.)

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:5173` (or the port Vite assigns).

## Building for Production

To create a production build of the application:

```bash
npm run build
```

This will generate a `dist` folder in the `wallet-ui` directory, containing the optimized static assets.

## Deployment to Vercel

This project is optimized for easy deployment to Vercel.

1.  **Push your code:** Ensure your local Git repository (containing the `Zhackathon` project with `wallet-ui` inside) is up-to-date and pushed to a provider like GitHub, GitLab, or Bitbucket.

2.  **Import Project on Vercel:**

    - Log in to your Vercel account.
    - Click "Add New..." -> "Project".
    - Select your Git provider and import the repository that contains this `wallet-ui` folder.

3.  **Configure Project Settings:**

    - **Framework Preset:** Vercel should automatically detect **Vite**. If not, select it manually.
    - **Root Directory:** Crucially, set this to `wallet-ui`. This tells Vercel that your application code is within this subdirectory of your repository.
    - **Build and Output Settings:**
      - **Build Command:** Vercel will likely default to `npm run build` or `vite build`. This is correct.
      - **Output Directory:** Should be detected as `dist`. This is correct for Vite builds.
      - **Install Command:** Defaults to `npm install`, which is appropriate.
    - **Environment Variables:** This project currently does not require specific environment variables for basic deployment. The RPC endpoint for Devnet is hardcoded; for a more flexible setup, this could be an environment variable.

4.  **Deploy:** Click the "Deploy" button.

Vercel will build and deploy your application, providing you with a live URL.

---

Powered by Solana, Light Protocol, and Metaplex.
