import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  useToast,
  Input,
  HStack,
  Spinner,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
  Flex,
  Image,
  Tag,
  extendTheme,
  ChakraProvider,
  Divider,
  Icon,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Link,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import {
  CopyIcon,
  ArrowForwardIcon,
  RepeatIcon,
  QuestionOutlineIcon,
  InfoIcon,
  CheckCircleIcon,
  ArrowBackIcon,
} from "@chakra-ui/icons";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import {
  createRpc,
  buildAndSignTx,
  sendAndConfirmTx,
} from "@lightprotocol/stateless.js";
import {
  CompressedTokenProgram,
  selectMinCompressedTokenAccountsForTransfer,
} from "@lightprotocol/compressed-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
// import solanaWebP from "./assets/solana.webp"; // Old logo
import solanaSvg from "./assets/solana.svg"; // New Solana SVG logo

// Custom theme
const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  fonts: {
    heading: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
  colors: {
    brand: {
      50: "#fff6e0",
      100: "#ffecb3",
      200: "#ffe180",
      300: "#ffd74d",
      400: "#ffcd1a",
      500: "#ffbf00",
      600: "#e6ac00",
      700: "#b38600",
      800: "#805f00",
      900: "#4d3900",
    },
    cardBg: "rgba(35, 35, 35, 0.75)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
  },
  styles: {
    global: (props) => ({
      body: {
        bg: "#121212",
        color: "whiteAlpha.900",
        lineHeight: "1.6",
      },
      "*::placeholder": {
        color: "whiteAlpha.600",
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "brand" ? "brand.500" : undefined,
          color: props.colorScheme === "brand" ? "#1A202C" : undefined,
          _hover: {
            bg: props.colorScheme === "brand" ? "brand.600" : undefined,
            transform:
              props.colorScheme === "brand" ? "scale(1.03)" : undefined,
            boxShadow: props.colorScheme === "brand" ? "md" : undefined,
          },
          transition:
            "transform 0.15s ease-out, background-color 0.15s ease-out, box-shadow 0.15s ease-out",
        }),
      },
      defaultProps: {
        size: "md",
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderColor: "whiteAlpha.300",
          bg: "whiteAlpha.50",
          _hover: {
            borderColor: "whiteAlpha.400",
          },
          _focus: {
            borderColor: "brand.500",
            boxShadow: `0 0 0 1px #ffbf00`,
          },
          _placeholder: {
            color: "gray.700",
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Container: {
      baseStyle: {
        maxW: "container.xl",
        px: { base: 4, md: 6 },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "700",
      },
    },
    Card: {
      baseStyle: {
        bg: "cardBg",
        borderRadius: "xl",
        border: "1px solid",
        borderColor: "cardBorder",
        boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.15)",
        backdropFilter: "blur(10px)",
        p: 6,
      },
    },
  },
});

// Helper for consistent card styling
const cardStyles = {
  bg: "cardBg",
  borderRadius: "xl",
  border: "1px solid",
  borderColor: "cardBorder",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  backdropFilter: "blur(12px)",
  p: { base: 5, md: 6 },
  width: "100%",
};

// Key for localStorage
const LOCAL_STORAGE_TRACKED_MINTS = "zkWalletTrackedMints";

const truncateAddress = (address, chars = 4) => {
  if (!address) return "";
  const len = address.length;
  if (len <= chars * 2 + 3) return address;
  return `${address.substring(0, chars)}...${address.substring(len - chars)}`;
};

function App() {
  const { publicKey, connected, signTransaction, disconnect } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();

  const [solBalance, setSolBalance] = useState(null);
  const [currentMint, setCurrentMint] = useState("");
  const [inputValueMint, setInputValueMint] = useState("");

  const [trackedMints, setTrackedMints] = useState(() => {
    const savedMints = localStorage.getItem(LOCAL_STORAGE_TRACKED_MINTS);
    return savedMints ? JSON.parse(savedMints) : [];
  });

  const [trackedMintsBalances, setTrackedMintsBalances] = useState({});

  const [sendLoading, setSendLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");

  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);

  const brandColor = useColorModeValue("brand.500", "brand.400");
  const subtleText = useColorModeValue("gray.600", "gray.400");
  const cardBackgroundColor = useColorModeValue("whiteAlpha.50", "cardBg");

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_TRACKED_MINTS,
      JSON.stringify(trackedMints)
    );
    // Clean up balances for mints no longer tracked
    setTrackedMintsBalances((prevBalances) => {
      const newBalances = { ...prevBalances };
      Object.keys(newBalances).forEach((mint) => {
        if (!trackedMints.includes(mint)) {
          delete newBalances[mint];
        }
      });
      return newBalances;
    });
  }, [trackedMints]);

  useEffect(() => {
    if (!currentMint && trackedMints.length > 0) {
      setCurrentMint(trackedMints[0]);
    } else if (trackedMints.length === 0) {
      setCurrentMint(""); // Clear currentMint if no tracked mints
    }
  }, [trackedMints, currentMint]);

  const getRpcClient = useCallback(() => {
    if (!connection) return null;
    return createRpc(connection.rpcEndpoint, "confirmed");
  }, [connection]);

  const refreshMintData = useCallback(
    async (mintAddressToFetch) => {
      if (!publicKey || typeof publicKey.toBase58 !== "function") {
        const errorMsg =
          "Wallet public key is invalid or not available for fetching data.";
        console.error(
          "refreshMintData:",
          errorMsg,
          "Mint:",
          mintAddressToFetch,
          "PublicKey:",
          publicKey
        );
        toast({
          title: `Cannot fetch data for ${truncateAddress(mintAddressToFetch)}`,
          description: errorMsg,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setTrackedMintsBalances((prev) => ({
          ...prev,
          [mintAddressToFetch]: {
            ...prev[mintAddressToFetch],
            isLoading: false,
            error: errorMsg,
            balance: null,
            metadata: null,
          },
        }));
        return;
      }

      if (!mintAddressToFetch) {
        console.error(
          "refreshMintData: mintAddressToFetch is undefined or null"
        );
        return;
      }

      const rpc = getRpcClient();
      if (!rpc) {
        const errorMsg = "RPC client is not available.";
        toast({
          title: "Connection Error",
          description: errorMsg,
          status: "error",
        });
        setTrackedMintsBalances((prev) => ({
          ...prev,
          [mintAddressToFetch]: {
            ...prev[mintAddressToFetch],
            isLoading: false,
            error: errorMsg,
            balance: null,
            metadata: null,
          },
        }));
        return;
      }

      setTrackedMintsBalances((prev) => ({
        ...prev,
        [mintAddressToFetch]: {
          ...prev[mintAddressToFetch],
          isLoading: true,
          error: null,
        },
      }));

      try {
        let balance = 0;
        let metadata = null;
        let fetchedAsNft = false;

        // Try fetching as a specific NFT asset first
        try {
          const asset = await CompressedTokenProgram.getCompressedNftAsset(
            rpc,
            mintAddressToFetch
          );
          if (
            asset &&
            asset.compression.compressed &&
            asset.ownership.owner === publicKey.toBase58()
          ) {
            balance = 1; // NFTs typically represent a balance of 1
            metadata = {
              name: asset.content?.metadata?.name,
              symbol: asset.content?.metadata?.symbol,
              uri: asset.content?.files?.[0]?.uri,
            };
            fetchedAsNft = true;
          }
        } catch (nftError) {
          // It's okay if this fails, it might not be an asset ID or might be a fungible mint ID
          // console.info(`Mint ${mintAddressToFetch} not fetched as specific NFT asset or not owned: ${nftError.message}`);
        }

        // If not fetched as an NFT, or to get sum for a general mint ID
        if (!fetchedAsNft) {
          const accounts = await rpc.getCompressedTokenAccountsByOwner(
            publicKey.toBase58(),
            { mint: mintAddressToFetch }
          );

          balance = accounts.items.reduce(
            (acc, item) => acc + Number(item.amount),
            0
          );
          // Try to get some metadata if available (e.g., from the first account if it has some)
          // This is a simplification; proper metadata for fungible tokens often comes from off-chain registries or token-list standards
          if (accounts.items.length > 0) {
            const firstItem = accounts.items[0];
            // Example: if Light Protocol includes some metadata directly on the account (hypothetical)
            // Or if the mint matches a known token with metadata. For now, this is basic.
            if (firstItem.metadata?.name || firstItem.metadata?.symbol) {
              metadata = {
                name: firstItem.metadata.name,
                symbol: firstItem.metadata.symbol,
              };
            }
          }
        }

        setTrackedMintsBalances((prev) => ({
          ...prev,
          [mintAddressToFetch]: {
            balance,
            metadata,
            isLoading: false,
            error: null,
          },
        }));
      } catch (error) {
        console.error(`Error fetching data for ${mintAddressToFetch}:`, error);
        const errorMessage = error.message || "Unknown error during fetch.";
        toast({
          title: `Error fetching data for ${truncateAddress(
            mintAddressToFetch
          )}`,
          description: truncateAddress(errorMessage, 100),
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        setTrackedMintsBalances((prev) => ({
          ...prev,
          [mintAddressToFetch]: {
            ...prev[mintAddressToFetch],
            balance: null,
            metadata: null,
            isLoading: false,
            error: errorMessage,
          },
        }));
      }
    },
    [publicKey, getRpcClient, toast]
  );

  useEffect(() => {
    if (
      publicKey &&
      typeof publicKey.toBase58 === "function" &&
      trackedMints.length > 0
    ) {
      trackedMints.forEach((mint) => {
        if (!mint) return;
        const mintEntry = trackedMintsBalances[mint];

        if (mintEntry?.isLoading) {
          return;
        }

        if (!mintEntry || (!mintEntry.balance && !mintEntry.metadata)) {
          refreshMintData(mint);
        }
      });
    } else if (!publicKey || typeof publicKey.toBase58 !== "function") {
      // If publicKey becomes invalid after being valid, we might want to clear/reset states
      // For now, this useEffect just won't run the fetches.
      // Consider clearing all mint balances if wallet disconnects or pk becomes invalid
      // setTrackedMintsBalances({}); // Example: clear all balances
    }
  }, [publicKey, trackedMints, refreshMintData]);

  const handleAddOrCheckMint = () => {
    if (!inputValueMint) {
      toast({
        title: "Please enter a mint address",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    try {
      new PublicKey(inputValueMint); // Validate if it's a PublicKey string
    } catch (e) {
      toast({
        title: "Invalid mint address",
        description: "Please enter a valid Solana public key.",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setCurrentMint(inputValueMint);
    if (!trackedMints.includes(inputValueMint)) {
      setTrackedMints((prevMints) => [...prevMints, inputValueMint]);
    }
    refreshMintData(inputValueMint);
  };

  const handleSelectTrackedMint = (mintToSelect) => {
    setCurrentMint(mintToSelect);
    setInputValueMint(mintToSelect);
    // Optionally refresh data on select if it's stale
    // const mintData = trackedMintsBalances[mintToSelect];
    // if (!mintData || (!mintData.isLoading && !mintData.balance && !mintData.error)) {
    // refreshMintData(mintToSelect);
    // }
  };

  const handleRemoveTrackedMint = (mintToRemove) => {
    setTrackedMints((prevMints) => prevMints.filter((m) => m !== mintToRemove));
    if (currentMint === mintToRemove) {
      const remainingMints = trackedMints.filter((m) => m !== mintToRemove);
      const newCurrentMint = remainingMints.length > 0 ? remainingMints[0] : "";
      setCurrentMint(newCurrentMint);
      setInputValueMint(newCurrentMint);
    }
  };

  const fetchSolBalance = useCallback(async () => {
    if (publicKey && connection) {
      try {
        const bal = await connection.getBalance(publicKey);
        setSolBalance(bal / 1e9);
      } catch (e) {
        toast({
          title: "Error fetching SOL balance",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setSolBalance(null);
      }
    } else {
      setSolBalance(null);
    }
  }, [publicKey, connection, toast]);

  useEffect(() => {
    fetchSolBalance();
  }, [fetchSolBalance]);

  const handleSend = async () => {
    const currentMintData = currentMint
      ? trackedMintsBalances[currentMint]
      : null;
    if (
      !publicKey ||
      !currentMint ||
      !recipient ||
      !sendAmount ||
      !currentMintData ||
      typeof currentMintData.balance !== "number" ||
      currentMintData.balance <= 0
    ) {
      toast({
        title: "Send requirements not met.",
        description: "Check mint, recipient, amount, and balance.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    if (Number(sendAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Send amount must be greater than zero.",
        status: "error",
        duration: 3000,
      });
      return;
    }
    if (Number(sendAmount) > currentMintData.balance) {
      toast({
        title: "Insufficient Balance",
        description: "Send amount exceeds your current balance for this token.",
        status: "error",
        duration: 3000,
      });
      return;
    }
    try {
      new PublicKey(recipient); // Validate recipient
    } catch (e) {
      toast({
        title: "Invalid Recipient Address",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setSendLoading(true);
    const rpc = getRpcClient();
    if (!rpc) {
      toast({
        title: "RPC client not available",
        status: "error",
        duration: 3000,
      });
      setSendLoading(false);
      return;
    }

    try {
      const accounts = await rpc.getCompressedTokenAccountsByOwner(
        publicKey.toBase58(),
        { mint: currentMint }
      );

      if (!accounts || accounts.items.length === 0) {
        throw new Error("No token accounts found for sending.");
      }

      // For NFTs, amount is usually 1 unit. For fungible, it's the actual amount.
      // Light Protocol's selectMinCompressedTokenAccountsForTransfer expects amount in base units.
      // We assume sendAmount is in human-readable units. If tokens have decimals, this needs adjustment.
      // For simplicity, assume no decimals or amount is already in base units.
      const amountToSend = BigInt(sendAmount); //This might need adjustment if token has decimals

      const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
        accounts.items,
        amountToSend
      );

      const proof = await rpc.getValidityProof(
        inputAccounts.map((account) => account.compressedAccount.hash)
      );
      const tokenPoolInfos = await rpc.getTokenPoolInfos(currentMint);

      const ix = await CompressedTokenProgram.transfer({
        payer: publicKey,
        owner: publicKey,
        inputCompressedTokenAccounts: inputAccounts,
        toAddress: recipient,
        amount: amountToSend,
        tokenPoolInfos,
        recentInputStateRootIndices: proof.rootIndices,
        recentValidityProof: proof.compressedProof,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const tx = buildAndSignTx(
        [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ix],
        publicKey,
        blockhash,
        [] // No signers needed beyond the wallet if payer is owner
      );

      const signedTx = await signTransaction(tx);
      const sig = await sendAndConfirmTx(connection, signedTx);

      toast({
        title: "Transfer Successful!",
        description: `Signature: ${truncateAddress(sig, 8)}`,
        status: "success",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });

      setSendAmount("");
      setRecipient("");
      refreshMintData(currentMint); // Refresh balance of the sent token
      fetchSolBalance(); // Refresh SOL balance as TX cost SOL
    } catch (e) {
      toast({
        title: "Transfer Failed",
        description: e.message || e.toString(),
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    }
    setSendLoading(false);
  };

  const handleCopy = async (textToCopy, title) => {
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast({
          title: title || "Copied to clipboard!",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  // Helper to display current mint (can be enhanced)
  const displayCurrentMint = currentMint
    ? truncateAddress(currentMint, 6)
    : "None";
  const currentMintData = currentMint
    ? trackedMintsBalances[currentMint]
    : null;
  const isLoadingCurrentMint = !!currentMintData?.isLoading;
  const currentMintError = currentMintData?.error;
  const currentMintBalanceDetails =
    !isLoadingCurrentMint && !currentMintError && currentMintData
      ? currentMintData
      : null;

  // Landing Page Content
  const landingPageContent = (
    <Container
      maxW={{ base: "container.sm", md: "container.md" }}
      textAlign="center"
    >
      <VStack spacing={{ base: 6, md: 8 }} width="100%">
        <Image
          src={solanaSvg}
          alt="Solana SVG Logo"
          boxSize={{ base: "100px", md: "120px" }}
          opacity={0.9}
          mb={4}
        />
        <Heading
          as="h2"
          fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
          fontWeight="extrabold"
          lineHeight="1.2"
        >
          Secure & Efficient Solana
          <br />
          <Text as="span" color={brandColor}>
            Compressed Token Management
          </Text>
        </Heading>
        <Text fontSize={{ base: "md", md: "lg" }} color={subtleText} maxW="lg">
          Leverage the power of ZK-compression. Connect your wallet to
          experience seamless and cost-effective token operations on Solana.
        </Text>
        <Box pt={4}>
          <Text fontSize="sm" color="gray.500">
            Please connect your wallet using the button in the header.
          </Text>
        </Box>
        <Text fontSize="xs" color="gray.600" pt={8}>
          Powered by Light Protocol technology.
        </Text>
      </VStack>
    </Container>
  );

  // Dashboard Content
  const dashboardContent = (
    <Container maxW="container.lg" width="100%">
      <VStack spacing={{ base: 6, md: 7 }} align="stretch" width="100%">
        {/* Wallet and Mint Management Section */}
        <Box sx={cardStyles} bg={cardBackgroundColor}>
          <VStack spacing={4} align="stretch">
            {/* Connected Wallet Info & SOL Balance */}
            <Flex justifyContent="space-between" alignItems="center">
              <HStack>
                <Tag size="sm" colorScheme="green" variant="solid">
                  Connected
                </Tag>
                <Tooltip
                  label={publicKey?.toBase58()}
                  placement="top"
                  gutter={4}
                >
                  <Text fontWeight="medium" fontSize="sm" cursor="default">
                    {truncateAddress(publicKey?.toBase58(), 6)}
                  </Text>
                </Tooltip>
                <IconButton
                  icon={<CopyIcon />}
                  size="xs"
                  aria-label="Copy Address"
                  onClick={() =>
                    handleCopy(publicKey?.toBase58(), "Wallet address copied!")
                  }
                  variant="ghost"
                />
              </HStack>
              <Tag
                size="md"
                colorScheme="brand"
                variant="outline"
                fontWeight="bold"
              >
                {solBalance !== null ? (
                  `${solBalance.toFixed(4)} SOL`
                ) : (
                  <Spinner size="xs" />
                )}
              </Tag>
            </Flex>
            <Divider borderColor="whiteAlpha.200" />

            {/* Track New or Check Mint Input */}
            <FormControl>
              <FormLabel
                htmlFor="mintInput"
                fontWeight="medium"
                fontSize="sm"
                mb={1}
              >
                Track New or Check Mint Address
              </FormLabel>
              <InputGroup size="sm">
                <Input
                  id="mintInput"
                  placeholder="Enter mint or asset ID to track/check"
                  value={inputValueMint}
                  onChange={(e) => setInputValueMint(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddOrCheckMint();
                  }}
                />
                <InputRightElement width="auto" px={1}>
                  <Button
                    h="1.75rem"
                    size="sm"
                    variant="outline"
                    colorScheme="gray"
                    onClick={handleAddOrCheckMint}
                    isLoading={
                      trackedMintsBalances[inputValueMint]?.isLoading &&
                      currentMint === inputValueMint
                    }
                  >
                    {trackedMints.includes(inputValueMint)
                      ? "Refresh"
                      : "Add/Check"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Tracked Mints List */}
            {trackedMints.length > 0 && (
              <Box pt={3}>
                <Heading size="xs" mb={2} color="whiteAlpha.700">
                  Tracked Tokens:
                </Heading>
                <VStack
                  spacing={2}
                  align="stretch"
                  maxHeight="180px"
                  overflowY="auto"
                  pr={2}
                  css={{
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(255,255,255,0.05)",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255,255,255,0.2)",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  {trackedMints.map((m) => {
                    const mintData = trackedMintsBalances[m];
                    const isCurrent = currentMint === m;
                    return (
                      <Flex
                        key={m}
                        justify="space-between"
                        align="center"
                        p={2.5} // Increased padding
                        bg={isCurrent ? "brand.900" : "blackAlpha.300"}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleSelectTrackedMint(m)}
                        _hover={{
                          bg: isCurrent ? "brand.800" : "blackAlpha.400",
                        }}
                        boxShadow={
                          isCurrent
                            ? "0 0 0 1px var(--chakra-colors-brand-500)"
                            : "none"
                        } // Highlight current
                        transition="background-color 0.2s ease-out, box-shadow 0.2s ease-out"
                      >
                        <VStack
                          align="start"
                          spacing={0}
                          flexGrow={1}
                          mr={2}
                          overflow="hidden"
                        >
                          <Tooltip label={m} placement="top-start" gutter={2}>
                            <Text
                              fontSize="xs"
                              noOfLines={1}
                              wordBreak="break-all"
                              fontWeight={isCurrent ? "bold" : "normal"}
                            >
                              {truncateAddress(m, 8)}
                            </Text>
                          </Tooltip>
                          {mintData &&
                            !mintData.isLoading &&
                            !mintData.error &&
                            typeof mintData.balance === "number" && (
                              <Text
                                fontSize="xx-small"
                                color="gray.400"
                                noOfLines={1}
                              >
                                {mintData.balance}
                                {mintData.metadata?.symbol
                                  ? ` ${mintData.metadata.symbol}`
                                  : ""}
                                {mintData.metadata?.name
                                  ? ` (${truncateAddress(
                                      mintData.metadata.name,
                                      15
                                    )})`
                                  : ""}
                              </Text>
                            )}
                          {mintData && mintData.error && (
                            <Text fontSize="xx-small" color="red.400">
                              Error fetching
                            </Text>
                          )}
                        </VStack>
                        <HStack spacing={1}>
                          {mintData?.isLoading && <Spinner size="xs" />}
                          {!mintData?.isLoading && (
                            <IconButton
                              icon={<RepeatIcon />}
                              size="xs"
                              variant="ghost"
                              aria-label="Refresh balance"
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshMintData(m);
                              }}
                            />
                          )}
                          <IconButton
                            icon={<CopyIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label="Copy mint address"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(m, "Mint address copied!");
                            }}
                          />
                          <IconButton
                            icon={
                              <ArrowForwardIcon transform="rotate(45deg)" />
                            }
                            colorScheme="red"
                            size="xs"
                            variant="ghost"
                            aria-label="Remove tracked mint"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrackedMint(m);
                            }}
                          />
                        </HStack>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
            )}
            <Divider
              borderColor="whiteAlpha.200"
              mt={trackedMints.length > 0 ? 2 : 0}
            />
          </VStack>
        </Box>

        {/* Current (Selected) Token Details, Receive & Send Section */}
        {publicKey &&
          currentMint && ( // Only show if a mint is selected
            <Box sx={cardStyles} bg={cardBackgroundColor}>
              <VStack spacing={3} align="stretch" w="100%">
                <HStack justifyContent="space-between" alignItems="center">
                  <Heading
                    as="h3"
                    size="sm"
                    color="whiteAlpha.900"
                    noOfLines={1}
                    title={currentMint}
                  >
                    Selected: {displayCurrentMint}
                  </Heading>
                  {isLoadingCurrentMint && (
                    <Spinner size="sm" color={brandColor} />
                  )}
                </HStack>
                <Divider borderColor="whiteAlpha.200" />

                {currentMintBalanceDetails &&
                  typeof currentMintBalanceDetails.balance === "number" && (
                    <Flex justifyContent="space-between" alignItems="center">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          Balance:
                        </Text>
                        {currentMintBalanceDetails.metadata?.name && (
                          <Tooltip
                            label={currentMintBalanceDetails.metadata.name}
                            placement="top-start"
                            gutter={2}
                          >
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              noOfLines={1}
                              title={currentMintBalanceDetails.metadata.name}
                            >
                              {truncateAddress(
                                currentMintBalanceDetails.metadata.name,
                                20
                              )}
                            </Text>
                          </Tooltip>
                        )}
                      </VStack>
                      <Text fontSize="lg" fontWeight="bold" color={brandColor}>
                        {currentMintBalanceDetails.balance}
                        {currentMintBalanceDetails.metadata?.symbol
                          ? ` ${currentMintBalanceDetails.metadata.symbol}`
                          : ""}
                      </Text>
                    </Flex>
                  )}

                {currentMintError && (
                  <HStack justifyContent="center" py={2} color="red.400">
                    <Icon as={QuestionOutlineIcon} />
                    <Text fontSize="sm">
                      Error:{" "}
                      {typeof currentMintError === "string"
                        ? truncateAddress(currentMintError, 30)
                        : "Could not fetch details."}
                    </Text>
                  </HStack>
                )}

                {!isLoadingCurrentMint &&
                  !currentMintError &&
                  !currentMintBalanceDetails && (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      textAlign="center"
                      py={2}
                    >
                      No data for this mint. Try refreshing.
                    </Text>
                  )}
              </VStack>
            </Box>
          )}

        {/* Send and Receive cards - only if a current mint is selected and has balance data */}
        {publicKey && currentMint && currentMintBalanceDetails && (
          <Flex
            gap={{ base: 5, md: 6 }}
            direction={{ base: "column", md: "row" }}
          >
            {/* Receive Card */}
            <Box sx={cardStyles} flex="1" bg={cardBackgroundColor}>
              <VStack spacing={3} align="stretch">
                <Heading
                  as="h3"
                  size="sm"
                  display="flex"
                  alignItems="center"
                  color="whiteAlpha.900"
                >
                  <Icon
                    as={ArrowForwardIcon}
                    transform="rotate(-45deg)"
                    color="green.400"
                    mr={2}
                    boxSize={5}
                  />{" "}
                  Receive Tokens
                </Heading>
                <Divider borderColor="whiteAlpha.200" />
                <FormControl>
                  <FormLabel
                    htmlFor="walletAddress"
                    fontWeight="medium"
                    fontSize="xs"
                    mb={1}
                  >
                    Your Wallet Address
                  </FormLabel>
                  <InputGroup size="sm">
                    <Input
                      id="walletAddress"
                      value={publicKey?.toBase58()}
                      isReadOnly
                      fontSize="xs"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label="Copy address"
                        icon={<CopyIcon />}
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            publicKey?.toBase58(),
                            "Wallet address copied!"
                          )
                        }
                        variant="ghost"
                        colorScheme="brand"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </VStack>
            </Box>

            {/* Send Card */}
            <Box sx={cardStyles} flex="1" bg={cardBackgroundColor}>
              <VStack spacing={3} align="stretch">
                <Heading
                  as="h3"
                  size="sm"
                  display="flex"
                  alignItems="center"
                  color="whiteAlpha.900"
                >
                  <Icon
                    as={ArrowForwardIcon}
                    color="orange.400"
                    mr={2}
                    boxSize={5}
                  />{" "}
                  Send Tokens
                </Heading>
                <Divider borderColor="whiteAlpha.200" />
                <FormControl mb={1}>
                  <FormLabel
                    htmlFor="recipientAddress"
                    fontWeight="medium"
                    fontSize="xs"
                    mb={1}
                  >
                    Recipient Address
                  </FormLabel>
                  <Input
                    id="recipientAddress"
                    size="sm"
                    placeholder="Enter recipient's Solana address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel
                    htmlFor="sendAmount"
                    fontWeight="medium"
                    fontSize="xs"
                    mb={1}
                  >
                    Amount
                  </FormLabel>
                  <Input
                    id="sendAmount"
                    size="sm"
                    placeholder="Number of tokens to send"
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                  />
                </FormControl>
                <Button
                  colorScheme="brand"
                  onClick={handleSend}
                  isLoading={sendLoading}
                  loadingText="Sending..."
                  isDisabled={
                    !recipient ||
                    !sendAmount ||
                    !currentMint ||
                    !currentMintBalanceDetails ||
                    typeof currentMintBalanceDetails.balance !== "number" ||
                    Number(sendAmount) <= 0 ||
                    Number(sendAmount) > currentMintBalanceDetails.balance
                  }
                  leftIcon={<ArrowForwardIcon />}
                  mt={2}
                >
                  Send Tokens
                </Button>
                {currentMintBalanceDetails &&
                  Number(sendAmount) > currentMintBalanceDetails.balance && (
                    <Text
                      fontSize="xs"
                      color="red.400"
                      textAlign="center"
                      mt={1}
                    >
                      Insufficient balance.
                    </Text>
                  )}
              </VStack>
            </Box>
          </Flex>
        )}
      </VStack>
    </Container>
  );

  // Education Hub Modal Content
  const EducationHubModal = () => (
    <Modal
      isOpen={isEducationModalOpen}
      onClose={() => setIsEducationModalOpen(false)}
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />
      <ModalContent
        bg={cardBackgroundColor}
        border="1px solid"
        borderColor="cardBorder"
        color="whiteAlpha.900"
      >
        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200">
          <HStack>
            <Icon as={InfoIcon} color={brandColor} boxSize={6} />
            <Heading size="md">ZK Compressed Tokens Education Hub</Heading>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="sm" mb={2} color={brandColor}>
                What are ZK Compressed Tokens?
              </Heading>
              <Text fontSize="sm">
                ZK (Zero-Knowledge) Compressed Tokens are a new type of digital
                asset on Solana that leverages the power of zero-knowledge
                proofs to significantly reduce the cost of minting and managing
                tokens, especially Non-Fungible Tokens (NFTs). Instead of
                storing all token data directly on-chain, compressed tokens
                store a cryptographic summary (a Merkle tree root) on-chain,
                while the actual data resides off-chain (typically on reliable
                decentralized storage like Arweave, or retrievable via RPC nodes
                that support the compression scheme).
              </Text>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            <Box>
              <Heading size="sm" mb={3} color={brandColor}>
                Key Benefits
              </Heading>
              <List spacing={3} fontSize="sm">
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  <Text as="span" fontWeight="bold">
                    Drastically Reduced Costs:
                  </Text>{" "}
                  Minting millions of compressed NFTs can cost a few SOL,
                  compared to potentially thousands for traditional NFTs. This
                  opens up new use cases for high-volume tokenization.
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  <Text as="span" fontWeight="bold">
                    Scalability:
                  </Text>{" "}
                  Enables applications that require a massive number of unique
                  tokens without overwhelming the Solana network or incurring
                  prohibitive fees.
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  <Text as="span" fontWeight="bold">
                    On-Chain Security:
                  </Text>{" "}
                  While data is stored off-chain, ownership and transfer
                  validity are still enforced by on-chain logic and ZK proofs,
                  maintaining Solana's security.
                </ListItem>
                <ListItem>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  <Text as="span" fontWeight="bold">
                    Composability:
                  </Text>{" "}
                  Designed to be compatible with the existing Solana ecosystem,
                  allowing compressed tokens to be integrated into various
                  dApps, marketplaces, and wallets (like this one!).
                </ListItem>
              </List>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            <Box>
              <Heading size="sm" mb={2} color={brandColor}>
                How Do They Work (Simplified)?
              </Heading>
              <Text fontSize="sm" mb={2}>
                1.{" "}
                <Text as="span" fontWeight="bold">
                  Merkle Trees:
                </Text>{" "}
                Token data is organized into a Merkle tree. Each token (or its
                state) is a "leaf" in this tree. 2.{" "}
                <Text as="span" fontWeight="bold">
                  On-Chain Root:
                </Text>{" "}
                Only the "root hash" of this Merkle tree is stored on-chain in a
                Solana account. 3.{" "}
                <Text as="span" fontWeight="bold">
                  Off-Chain Data:
                </Text>{" "}
                The actual token data and the tree structure are stored
                off-chain. 4.{" "}
                <Text as="span" fontWeight="bold">
                  ZK Proofs for Operations:
                </Text>{" "}
                When a token is transferred or modified, the owner provides a ZK
                proof. This proof mathematically demonstrates that they own the
                specific token and that the operation is valid according to the
                current Merkle tree root, without revealing unnecessary
                information about other tokens. The on-chain program verifies
                this proof and updates the on-chain root if the operation is
                valid.
              </Text>
              <Text fontSize="xs" color="gray.400">
                This wallet utilizes Light Protocol for its compressed token
                operations, which implements these ZK compression techniques.
              </Text>
            </Box>

            <Divider borderColor="whiteAlpha.200" />

            <Box>
              <Heading size="sm" mb={2} color={brandColor}>
                Further Resources
              </Heading>
              <List spacing={2} fontSize="sm">
                <ListItem>
                  <Link
                    href="https://lightprotocol.com/"
                    isExternal
                    color="brand.400"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Light Protocol Website{" "}
                    <ArrowForwardIcon mx="2px" transform="translateY(-1px)" />
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    href="https://docs.lightprotocol.com/"
                    isExternal
                    color="brand.400"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Light Protocol Docs{" "}
                    <ArrowForwardIcon mx="2px" transform="translateY(-1px)" />
                  </Link>
                </ListItem>
                <ListItem>
                  <Link
                    href="https://solana.com/docs/advanced/state-compression"
                    isExternal
                    color="brand.400"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Solana State Compression Docs{" "}
                    <ArrowForwardIcon mx="2px" transform="translateY(-1px)" />
                  </Link>
                </ListItem>
              </List>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.200">
          <Button
            variant="outline"
            onClick={() => setIsEducationModalOpen(false)}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        bg="#121212"
        color="whiteAlpha.900"
        backgroundImage="radial-gradient(circle at 50% 100%, rgba(255,180,0,0.05) 0%, rgba(18,18,18,0) 50%)"
        display="flex"
        flexDirection="column"
      >
        {/* Global Header */}
        <Box
          as="header"
          py={3}
          px={{ base: 4, md: 8 }}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          bg="#121212"
          position="sticky"
          top={0}
          zIndex="sticky"
        >
          <Container maxW="container.xl">
            <Flex align="center" justify="space-between" minH="50px">
              <HStack spacing={2}>
                {connected && (
                  <Tooltip
                    label="Disconnect & Go Home"
                    placement="bottom"
                    openDelay={300}
                  >
                    <IconButton
                      icon={<ArrowBackIcon boxSize={5} />}
                      aria-label="Disconnect and go back"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={disconnect}
                      size="md"
                      mr={1}
                      sx={{
                        color: "whiteAlpha.800",
                        _hover: {
                          color: "whiteAlpha.900",
                          bg: "whiteAlpha.200",
                        },
                      }}
                    />
                  </Tooltip>
                )}
                <Box
                  bg="brand.500"
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  color="gray.800"
                  fontSize="md"
                >
                  ZK
                </Box>
                <Heading
                  as="h1"
                  size="md"
                  fontWeight="600"
                  letterSpacing="tight"
                >
                  ZK Token Wallet
                </Heading>
              </HStack>
              <WalletMultiButton />
            </Flex>
          </Container>
        </Box>

        {/* Main Content Area */}
        <Flex
          as="main"
          flex="1"
          direction="column"
          align="center"
          justifyContent={!connected ? "center" : "flex-start"}
          width="100%"
          py={{ base: 6, md: 10 }}
        >
          {!connected ? landingPageContent : dashboardContent}
        </Flex>

        {/* Global Footer */}
        <Box
          as="footer"
          textAlign="center"
          py={{ base: 3, md: 4 }}
          px={{ base: 4, md: 8 }}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
        >
          <HStack justifyContent="center" alignItems="center" spacing={4}>
            <Text fontSize="xs" color="gray.500">
              ZK Compressed Token Wallet © {new Date().getFullYear()} • Powered
              by Light Protocol
            </Text>
            <Button
              size="xs"
              variant="link"
              color="brand.400"
              onClick={() => setIsEducationModalOpen(true)}
              leftIcon={<InfoIcon />}
            >
              Learn More
            </Button>
          </HStack>
        </Box>
        <EducationHubModal />
      </Box>
    </ChakraProvider>
  );
}

export default App;
